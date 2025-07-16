import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import OpenAI from "openai";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const AUTH_TOKEN = process.env.MY_API_AUTH_TOKEN!;
const RATE_LIMIT = 10;
const WINDOW_SEC = 60;

// Privacy-focused function to hash user IDs
function hashUserId(userId: string): string {
  return crypto.createHash('sha256').update(userId + process.env.HASH_SALT || 'default-salt').digest('hex');
}

// Log privacy audit event
async function logPrivacyAudit(userIdHash: string, action: string, metadata: any = {}) {
  try {
    await sql`
      INSERT INTO privacy_audit (user_id_hash, action, metadata)
      VALUES (${userIdHash}, ${action}, ${JSON.stringify(metadata)})
    `;
  } catch (error) {
    console.error('Failed to log privacy audit:', error);
  }
}

export async function POST(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting by IP
  const ip = req.headers.get("x-forwarded-for") || "";
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_SEC * 1000);

  // Count requests in the window
  const result = await sql`
    SELECT COUNT(*) FROM api_rate_limits WHERE identifier = ${ip} AND requested_at > ${windowStart}
  `;
  const count = parseInt((result[0] as any).count, 10);

  if (count >= RATE_LIMIT) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  // Log this request
  await sql`
    INSERT INTO api_rate_limits (identifier, requested_at) VALUES (${ip}, ${now})
  `;

  // Parse body
  const { chatLog } = await req.json();
  if (!chatLog || typeof chatLog !== "string") {
    return NextResponse.json({ error: "Missing or invalid chatLog" }, { status: 400 });
  }

  const prompt = `
Summarize the following chat and list any action items as a JSON object.

Chat:
${chatLog}

Return a JSON object:
{
  "summary": "A brief summary of the conversation.",
  "action_items": ["Action item 1", "Action item 2"]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    let result;
    try {
      result = JSON.parse(completion.choices[0].message.content || "");
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to parse model output", raw: completion.choices[0].message.content },
        { status: 500 }
      );
    }

    // Privacy-focused: Don't store conversation content, only log the action
    const userIp = req.headers.get("x-forwarded-for") || "unknown";
    await logPrivacyAudit(
      hashUserId(userIp),
      'summarize_request',
      { 
        actionItemsFound: result.action_items?.length || 0,
        summaryLength: result.summary?.length || 0
      }
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
} 