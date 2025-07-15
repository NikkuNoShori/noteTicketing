import { Pool } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OpenAI } from "ai/openai";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const AUTH_TOKEN = process.env.MY_API_AUTH_TOKEN;

const RATE_LIMIT = 10; // requests
const WINDOW_SEC = 60; // per minute

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Bearer token authentication
  if (req.headers.authorization !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Rate limiting by IP
  const ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "";
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_SEC * 1000);

  try {
    // Count requests in the window
    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM api_rate_limits WHERE identifier = $1 AND requested_at > $2",
      [ip, windowStart]
    );
    const count = parseInt(rows[0].count, 10);

    if (count >= RATE_LIMIT) {
      return res
        .status(429)
        .json({ error: "Too many requests. Please try again later." });
    }

    // Log this request
    await pool.query(
      "INSERT INTO api_rate_limits (identifier, requested_at) VALUES ($1, $2)",
      [ip, now]
    );
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: "Database error", details: err.message });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { chatLog } = req.body || {};

  if (!chatLog || typeof chatLog !== "string") {
    return res.status(400).json({ error: "Missing or invalid chatLog" });
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
      return res
        .status(500)
        .json({
          error: "Failed to parse model output",
          raw: completion.choices[0].message.content,
        });
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
}
