import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import OpenAI from "openai";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const AUTH_TOKEN = process.env.MY_API_AUTH_TOKEN!;

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

  try {
    const { guildId, channelId, messages, sweepType = 'scheduled' } = await req.json();

    if (!guildId || !channelId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Get bot configuration for this guild
    const configResult = await sql`
      SELECT * FROM bot_config WHERE guild_id = ${guildId} AND active = true
    `;

    if (configResult.length === 0) {
      return NextResponse.json({ error: "Guild not configured for sweeping" }, { status: 404 });
    }

    const config = configResult[0];
    
    // Check if privacy mode is enabled
    if (config.privacy_mode_enabled) {
      // In privacy mode, we only process messages that haven't been processed before
      // and we don't store any conversation content
      const processedMessageIds = await sql`
        SELECT message_id FROM processed_messages 
        WHERE channel_id = ${channelId} AND guild_id = ${guildId}
      `;
      
      const processedIds = new Set(processedMessageIds.map(row => row.message_id));
      const newMessages = messages.filter(msg => !processedIds.has(msg.id));
      
      if (newMessages.length === 0) {
        return NextResponse.json({ message: "No new messages to process", processed: 0 });
      }

      // Process only new messages
      const actionItems = await processMessagesForActionItems(newMessages, channelId, guildId, sweepType);
      
      // Mark messages as processed (without storing content)
      for (const msg of newMessages) {
        await sql`
          INSERT INTO processed_messages (message_id, channel_id, guild_id, action_items_found)
          VALUES (${msg.id}, ${channelId}, ${guildId}, ${actionItems.length > 0})
          ON CONFLICT (message_id) DO NOTHING
        `;
      }

      // Log privacy audit
      await logPrivacyAudit(
        hashUserId('system'),
        'channel_sweep_privacy_mode',
        { guildId, channelId, messageCount: newMessages.length, actionItemsFound: actionItems.length }
      );

      return NextResponse.json({
        message: "Channel sweep completed in privacy mode",
        processed: newMessages.length,
        actionItemsFound: actionItems.length,
        actionItems
      });
    } else {
      // Standard mode - process all messages
      const actionItems = await processMessagesForActionItems(messages, channelId, guildId, sweepType);
      
      return NextResponse.json({
        message: "Channel sweep completed",
        processed: messages.length,
        actionItemsFound: actionItems.length,
        actionItems
      });
    }

  } catch (error: any) {
    console.error('Channel sweep error:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

async function processMessagesForActionItems(messages: any[], channelId: string, guildId: string, sourceType: string) {
  const actionItems: any[] = [];
  
  // Group messages into batches for processing
  const batchSize = 10;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    
    // Create a conversation summary for this batch
    const conversationText = batch
      .map(msg => `${msg.author?.username || 'Unknown'}: ${msg.content}`)
      .join('\n');

    if (conversationText.trim().length === 0) continue;

    try {
      const prompt = `
Analyze the following conversation and extract any action items, tasks, or to-dos mentioned.
Focus on identifying specific tasks, deadlines, assignments, or actionable items.

Conversation:
${conversationText}

Return a JSON array of action items. Each action item should be an object with:
- "text": The action item description
- "priority": "low", "medium", or "high" based on urgency
- "category": "meeting", "project", "general", or "urgent"
- "assigned_to": Username if mentioned, otherwise null

If no action items are found, return an empty array.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      let result;
      try {
        result = JSON.parse(completion.choices[0].message.content || "{}");
        const items = result.action_items || result.items || [];
        
        if (Array.isArray(items) && items.length > 0) {
          // Generate unique ID for this batch
          const batchId = crypto.randomBytes(8).toString('hex');
          
          // Store action items in database
          await sql`
            INSERT INTO action_items (
              id, channel_id, summary, action_items, priority, category, source_type
            ) VALUES (
              ${batchId},
              ${channelId},
              ${result.summary || 'Action items extracted from conversation'},
              ${JSON.stringify(items)},
              ${items[0]?.priority || 'medium'},
              ${items[0]?.category || 'general'},
              ${sourceType}
            )
          `;
          
          actionItems.push(...items);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
      }
    } catch (error) {
      console.error('Error processing message batch:', error);
    }
  }
  
  return actionItems;
} 