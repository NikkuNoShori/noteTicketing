const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// List all guilds
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        guild_id as id,
        active,
        created_at,
        updated_at
      FROM bot_config
      ORDER BY created_at DESC
    `);

    res.json({
      guilds: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch guilds',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get guild details
router.get('/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        guild_id,
        active,
        privacy_mode_enabled,
        channels_to_monitor,
        todo_channel_id,
        sweep_output_channel_id,
        sweep_interval_hours,
        last_sweep_time,
        created_at,
        updated_at
      FROM bot_config
      WHERE guild_id = $1
    `, [guildId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'GUILD_NOT_FOUND',
          message: 'Guild not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching guild:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch guild',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get guild channels (simulated - would need Discord API integration)
router.get('/:guildId/channels', async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Get monitored channels from config
    const configResult = await pool.query(`
      SELECT channels_to_monitor, todo_channel_id, sweep_output_channel_id
      FROM bot_config
      WHERE guild_id = $1
    `, [guildId]);

    if (configResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'GUILD_NOT_FOUND',
          message: 'Guild not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const config = configResult.rows[0];
    const monitoredChannels = config.channels_to_monitor || [];
    const todoChannel = config.todo_channel_id;
    const sweepOutputChannel = config.sweep_output_channel_id;

    // TODO: Integrate with Discord API to get actual channel data
    // For now, return simulated data
    const channels = monitoredChannels.map(channelId => ({
      id: channelId,
      name: `channel-${channelId.slice(-4)}`,
      type: 'text',
      position: 0,
      monitored: true,
      output_channel: channelId === todoChannel || channelId === sweepOutputChannel
    }));

    res.json({ channels });
  } catch (error) {
    console.error('Error fetching guild channels:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch guild channels',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get guild statistics
router.get('/:guildId/stats', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get action items count
    const actionItemsResult = await pool.query(`
      SELECT COUNT(*) as total_action_items
      FROM action_items
      WHERE guild_id = $1 AND created_at >= $2
    `, [guildId, startDate]);

    // Get processed messages count
    const messagesResult = await pool.query(`
      SELECT COUNT(*) as total_messages_processed
      FROM processed_messages
      WHERE guild_id = $1 AND processed_at >= $2
    `, [guildId, startDate]);

    // Get sweep count
    const sweepResult = await pool.query(`
      SELECT COUNT(*) as sweeps_executed
      FROM bot_config
      WHERE guild_id = $1 AND last_sweep_time >= $2
    `, [guildId, startDate]);

    // Get monitored channels count
    const channelsResult = await pool.query(`
      SELECT 
        CASE 
          WHEN channels_to_monitor IS NOT NULL 
          THEN array_length(channels_to_monitor, 1)
          ELSE 0
        END as channels_monitored
      FROM bot_config
      WHERE guild_id = $1
    `, [guildId]);

    res.json({
      guild_id: guildId,
      period,
      summary: {
        total_action_items: parseInt(actionItemsResult.rows[0]?.total_action_items || 0),
        total_messages_processed: parseInt(messagesResult.rows[0]?.total_messages_processed || 0),
        sweeps_executed: parseInt(sweepResult.rows[0]?.sweeps_executed || 0),
        channels_monitored: parseInt(channelsResult.rows[0]?.channels_monitored || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching guild stats:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch guild statistics',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get guild configuration
router.get('/:guildId/config', async (req, res) => {
  try {
    const { guildId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        guild_id,
        active,
        privacy_mode_enabled,
        channels_to_monitor,
        todo_channel_id,
        sweep_output_channel_id,
        sweep_interval_hours,
        last_sweep_time,
        created_at,
        updated_at
      FROM bot_config
      WHERE guild_id = $1
    `, [guildId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'GUILD_NOT_FOUND',
          message: 'Guild not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching guild config:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch guild configuration',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Update guild configuration
router.patch('/:guildId/config', async (req, res) => {
  try {
    const { guildId } = req.params;
    const {
      active,
      privacy_mode_enabled,
      channels_to_monitor,
      todo_channel_id,
      sweep_output_channel_id,
      sweep_interval_hours
    } = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (active !== undefined) {
      updateFields.push(`active = $${paramCount++}`);
      values.push(active);
    }
    if (privacy_mode_enabled !== undefined) {
      updateFields.push(`privacy_mode_enabled = $${paramCount++}`);
      values.push(privacy_mode_enabled);
    }
    if (channels_to_monitor !== undefined) {
      updateFields.push(`channels_to_monitor = $${paramCount++}`);
      values.push(channels_to_monitor);
    }
    if (todo_channel_id !== undefined) {
      updateFields.push(`todo_channel_id = $${paramCount++}`);
      values.push(todo_channel_id);
    }
    if (sweep_output_channel_id !== undefined) {
      updateFields.push(`sweep_output_channel_id = $${paramCount++}`);
      values.push(sweep_output_channel_id);
    }
    if (sweep_interval_hours !== undefined) {
      updateFields.push(`sweep_interval_hours = $${paramCount++}`);
      values.push(sweep_interval_hours);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No valid fields to update',
          timestamp: new Date().toISOString()
        }
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(guildId);

    const query = `
      UPDATE bot_config 
      SET ${updateFields.join(', ')}
      WHERE guild_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      // Create new config if doesn't exist
      const insertResult = await pool.query(`
        INSERT INTO bot_config (
          guild_id, active, privacy_mode_enabled, channels_to_monitor,
          todo_channel_id, sweep_output_channel_id, sweep_interval_hours
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        guildId,
        active !== undefined ? active : true,
        privacy_mode_enabled !== undefined ? privacy_mode_enabled : false,
        channels_to_monitor || [],
        todo_channel_id,
        sweep_output_channel_id,
        sweep_interval_hours || 6
      ]);

      res.json(insertResult.rows[0]);
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating guild config:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update guild configuration',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Add channel to monitor
router.post('/:guildId/channels/monitor', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { channel_id } = req.body;

    if (!channel_id) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'channel_id is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const result = await pool.query(`
      UPDATE bot_config 
      SET 
        channels_to_monitor = array_append(channels_to_monitor, $2),
        updated_at = NOW()
      WHERE guild_id = $1
      RETURNING channels_to_monitor
    `, [guildId, channel_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'GUILD_NOT_FOUND',
          message: 'Guild not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      message: 'Channel added to monitoring',
      channels_to_monitor: result.rows[0].channels_to_monitor
    });
  } catch (error) {
    console.error('Error adding channel to monitor:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to add channel to monitoring',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Remove channel from monitor
router.delete('/:guildId/channels/monitor/:channelId', async (req, res) => {
  try {
    const { guildId, channelId } = req.params;

    const result = await pool.query(`
      UPDATE bot_config 
      SET 
        channels_to_monitor = array_remove(channels_to_monitor, $2),
        updated_at = NOW()
      WHERE guild_id = $1
      RETURNING channels_to_monitor
    `, [guildId, channelId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'GUILD_NOT_FOUND',
          message: 'Guild not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      message: 'Channel removed from monitoring',
      channels_to_monitor: result.rows[0].channels_to_monitor
    });
  } catch (error) {
    console.error('Error removing channel from monitor:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to remove channel from monitoring',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router; 