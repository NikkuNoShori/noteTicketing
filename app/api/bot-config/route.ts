import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const AUTH_TOKEN = process.env.MY_API_AUTH_TOKEN!;

export async function GET(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const guildId = searchParams.get('guildId');

  if (!guildId) {
    return NextResponse.json({ error: "Missing guildId parameter" }, { status: 400 });
  }

  try {
    const result = await sql`
      SELECT * FROM bot_config WHERE guild_id = ${guildId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Guild configuration not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching bot config:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      guildId,
      channelsToMonitor = [],
      todoChannelId,
      sweepIntervalHours = 1,
      privacyModeEnabled = false,
      active = true
    } = await req.json();

    if (!guildId) {
      return NextResponse.json({ error: "Missing guildId" }, { status: 400 });
    }

    // Upsert configuration
    const result = await sql`
      INSERT INTO bot_config (
        guild_id, 
        channels_to_monitor, 
        todo_channel_id, 
        sweep_interval_hours, 
        privacy_mode_enabled, 
        active
      ) VALUES (
        ${guildId},
        ${JSON.stringify(channelsToMonitor)},
        ${todoChannelId},
        ${sweepIntervalHours},
        ${privacyModeEnabled},
        ${active}
      )
      ON CONFLICT (guild_id) DO UPDATE SET
        channels_to_monitor = EXCLUDED.channels_to_monitor,
        todo_channel_id = EXCLUDED.todo_channel_id,
        sweep_interval_hours = EXCLUDED.sweep_interval_hours,
        privacy_mode_enabled = EXCLUDED.privacy_mode_enabled,
        active = EXCLUDED.active,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    return NextResponse.json({
      message: "Bot configuration updated successfully",
      config: result[0]
    });
  } catch (error: any) {
    console.error('Error updating bot config:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { guildId, ...updates } = await req.json();

    if (!guildId) {
      return NextResponse.json({ error: "Missing guildId" }, { status: 400 });
    }

    // Build dynamic update query using template literals
    let updateQuery = sql`UPDATE bot_config SET `;
    const updateParts: any[] = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        if (updateParts.length > 0) {
          updateQuery = sql`${updateQuery}, `;
        }
        
        switch (key) {
          case 'channelsToMonitor':
            updateQuery = sql`${updateQuery}channels_to_monitor = ${JSON.stringify(value)}`;
            break;
          case 'todoChannelId':
            updateQuery = sql`${updateQuery}todo_channel_id = ${value}`;
            break;
          case 'sweepIntervalHours':
            updateQuery = sql`${updateQuery}sweep_interval_hours = ${value}`;
            break;
          case 'privacyModeEnabled':
            updateQuery = sql`${updateQuery}privacy_mode_enabled = ${value}`;
            break;
          case 'active':
            updateQuery = sql`${updateQuery}active = ${value}`;
            break;
        }
      }
    }

    if (updateParts.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updateQuery = sql`${updateQuery}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ${guildId} RETURNING *`;

    const result = await updateQuery;

    if (result.length === 0) {
      return NextResponse.json({ error: "Guild configuration not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Bot configuration updated successfully",
      config: result[0]
    });
  } catch (error: any) {
    console.error('Error patching bot config:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
} 