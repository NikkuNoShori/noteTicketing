const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Get sweep status for a guild
router.get('/:guildId/status', async (req, res) => {
  try {
    const { guildId } = req.params;

    const result = await pool.query(`
      SELECT 
        guild_id,
        active,
        sweep_interval_hours,
        last_sweep_time,
        sweep_output_channel_id,
        channels_to_monitor
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

    const config = result.rows[0];
    const now = new Date();
    const lastSweepTime = config.last_sweep_time ? new Date(config.last_sweep_time) : null;
    
    // Calculate next sweep time
    let nextSweepTime = null;
    if (config.active && config.sweep_interval_hours && lastSweepTime) {
      nextSweepTime = new Date(lastSweepTime.getTime() + (config.sweep_interval_hours * 60 * 60 * 1000));
    }

    // Get total action items count
    const actionItemsResult = await pool.query(`
      SELECT COUNT(*) as total_action_items
      FROM action_items
      WHERE guild_id = $1
    `, [guildId]);

    const monitoredChannels = config.channels_to_monitor || [];

    res.json({
      guild_id: guildId,
      active: config.active,
      interval_hours: config.sweep_interval_hours,
      last_sweep_time: config.last_sweep_time,
      next_sweep_time: nextSweepTime,
      output_channel_id: config.sweep_output_channel_id,
      monitored_channels: monitoredChannels.length,
      total_action_items: parseInt(actionItemsResult.rows[0]?.total_action_items || 0)
    });
  } catch (error) {
    console.error('Error fetching sweep status:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch sweep status',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Trigger manual sweep
router.post('/:guildId/trigger', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { channel_ids, force = false } = req.body;

    // Get guild configuration
    const configResult = await pool.query(`
      SELECT 
        active,
        channels_to_monitor,
        sweep_output_channel_id,
        sweep_interval_hours
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

    // Check if sweep is enabled (unless force is true)
    if (!config.active && !force) {
      return res.status(400).json({
        error: {
          code: 'SWEEP_DISABLED',
          message: 'Sweep is disabled for this guild',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Determine which channels to sweep
    const channelsToSweep = channel_ids || config.channels_to_monitor || [];
    
    if (channelsToSweep.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_CHANNELS',
          message: 'No channels configured for sweeping',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate sweep ID
    const sweepId = require('crypto').randomBytes(8).toString('hex');
    const startTime = new Date();

    // TODO: Integrate with actual sweep logic from your bot
    // For now, we'll simulate the sweep process
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Record sweep execution
    const sweepResult = await pool.query(`
      INSERT INTO sweep_history (
        id, guild_id, triggered_at, channels_processed, 
        messages_processed, action_items_found, status, duration_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      sweepId,
      guildId,
      startTime,
      channelsToSweep.length,
      0, // messages_processed - would be calculated from actual sweep
      0, // action_items_found - would be calculated from actual sweep
      'completed',
      Math.floor((new Date() - startTime) / 1000)
    ]);

    // Update last sweep time
    await pool.query(`
      UPDATE bot_config 
      SET last_sweep_time = $1
      WHERE guild_id = $2
    `, [startTime, guildId]);

    res.json({
      message: 'Sweep triggered successfully',
      sweep_id: sweepId,
      channels_processed: channelsToSweep.length,
      status: 'completed',
      duration_seconds: Math.floor((new Date() - startTime) / 1000)
    });
  } catch (error) {
    console.error('Error triggering sweep:', error);
    res.status(500).json({
      error: {
        code: 'SWEEP_ERROR',
        message: 'Failed to trigger sweep',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get sweep history
router.get('/:guildId/history', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const parsedLimit = Math.min(parseInt(limit), 100);
    const parsedOffset = parseInt(offset);

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM sweep_history
      WHERE guild_id = $1
    `, [guildId]);

    const total = parseInt(countResult.rows[0].total);

    // Get sweep history
    const result = await pool.query(`
      SELECT 
        id,
        guild_id,
        triggered_at,
        channels_processed,
        messages_processed,
        action_items_found,
        status,
        duration_seconds
      FROM sweep_history
      WHERE guild_id = $1
      ORDER BY triggered_at DESC
      LIMIT $2 OFFSET $3
    `, [guildId, parsedLimit, parsedOffset]);

    res.json({
      sweeps: result.rows,
      total,
      limit: parsedLimit,
      offset: parsedOffset
    });
  } catch (error) {
    console.error('Error fetching sweep history:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch sweep history',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get sweep details
router.get('/:guildId/history/:sweepId', async (req, res) => {
  try {
    const { guildId, sweepId } = req.params;

    const result = await pool.query(`
      SELECT 
        id,
        guild_id,
        triggered_at,
        channels_processed,
        messages_processed,
        action_items_found,
        status,
        duration_seconds
      FROM sweep_history
      WHERE guild_id = $1 AND id = $2
    `, [guildId, sweepId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'SWEEP_NOT_FOUND',
          message: 'Sweep not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching sweep details:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch sweep details',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router; 