const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Get guild analytics
router.get('/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { period = '30d' } = req.query;

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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get summary statistics
    const summaryPromises = [
      // Total messages processed
      pool.query(`
        SELECT COUNT(*) as total_messages_processed
        FROM processed_messages
        WHERE guild_id = $1 AND processed_at >= $2
      `, [guildId, startDate]),

      // Total action items
      pool.query(`
        SELECT COUNT(*) as total_action_items
        FROM action_items
        WHERE guild_id = $1 AND created_at >= $2
      `, [guildId, startDate]),

      // Sweeps executed
      pool.query(`
        SELECT COUNT(*) as sweeps_executed
        FROM sweep_history
        WHERE guild_id = $1 AND triggered_at >= $2
      `, [guildId, startDate]),

      // Channels monitored
      pool.query(`
        SELECT 
          CASE 
            WHEN channels_to_monitor IS NOT NULL 
            THEN array_length(channels_to_monitor, 1)
            ELSE 0
          END as channels_monitored
        FROM bot_config
        WHERE guild_id = $1
      `, [guildId])
    ];

    const summaryResults = await Promise.all(summaryPromises);

    // Get daily trends for the last 7 days
    const trendStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const trendsPromises = [
      // Action items per day
      pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM action_items
        WHERE guild_id = $1 AND created_at >= $2
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [guildId, trendStartDate]),

      // Messages processed per day
      pool.query(`
        SELECT 
          DATE(processed_at) as date,
          COUNT(*) as count
        FROM processed_messages
        WHERE guild_id = $1 AND processed_at >= $2
        GROUP BY DATE(processed_at)
        ORDER BY date
      `, [guildId, trendStartDate])
    ];

    const trendsResults = await Promise.all(trendsPromises);

    // Get top channels by action items
    const topChannelsResult = await pool.query(`
      SELECT 
        channel_id,
        COUNT(*) as action_items,
        COUNT(*) as messages_processed
      FROM action_items
      WHERE guild_id = $1 AND created_at >= $2
      GROUP BY channel_id
      ORDER BY action_items DESC
      LIMIT 5
    `, [guildId, startDate]);

    // Format trends data
    const actionItemsPerDay = trendsResults[0].rows.map(row => row.count);
    const messagesProcessedPerDay = trendsResults[1].rows.map(row => row.count);

    // Format top channels
    const topChannels = topChannelsResult.rows.map(channel => ({
      channel_id: channel.channel_id,
      channel_name: `channel-${channel.channel_id.slice(-4)}`, // Simulated channel name
      action_items: parseInt(channel.action_items),
      messages_processed: parseInt(channel.messages_processed)
    }));

    res.json({
      guild_id: guildId,
      period,
      summary: {
        total_messages_processed: parseInt(summaryResults[0].rows[0]?.total_messages_processed || 0),
        total_action_items: parseInt(summaryResults[1].rows[0]?.total_action_items || 0),
        sweeps_executed: parseInt(summaryResults[2].rows[0]?.sweeps_executed || 0),
        channels_monitored: parseInt(summaryResults[3].rows[0]?.channels_monitored || 0)
      },
      trends: {
        action_items_per_day: actionItemsPerDay,
        messages_processed_per_day: messagesProcessedPerDay
      },
      top_channels: topChannels
    });
  } catch (error) {
    console.error('Error fetching guild analytics:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch guild analytics',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get action items analytics
router.get('/:guildId/action-items', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { period = '30d' } = req.query;

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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get analytics by priority
    const priorityResult = await pool.query(`
      SELECT 
        priority,
        COUNT(*) as count
      FROM action_items
      WHERE guild_id = $1 AND created_at >= $2
      GROUP BY priority
    `, [guildId, startDate]);

    // Get analytics by category
    const categoryResult = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM action_items
      WHERE guild_id = $1 AND created_at >= $2
      GROUP BY category
    `, [guildId, startDate]);

    // Get analytics by status
    const statusResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM action_items
      WHERE guild_id = $1 AND created_at >= $2
      GROUP BY status
    `, [guildId, startDate]);

    // Calculate completion rate
    const completionResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM action_items
      WHERE guild_id = $1 AND created_at >= $2
    `, [guildId, startDate]);

    // Format priority data
    const byPriority = {};
    priorityResult.rows.forEach(row => {
      byPriority[row.priority] = parseInt(row.count);
    });

    // Format category data
    const byCategory = {};
    categoryResult.rows.forEach(row => {
      byCategory[row.category] = parseInt(row.count);
    });

    // Format status data
    const byStatus = {};
    statusResult.rows.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });

    // Calculate completion rate
    const total = parseInt(completionResult.rows[0]?.total || 0);
    const completed = parseInt(completionResult.rows[0]?.completed || 0);
    const completionRate = total > 0 ? completed / total : 0;

    res.json({
      guild_id: guildId,
      period,
      by_priority: byPriority,
      by_category: byCategory,
      by_status: byStatus,
      completion_rate: completionRate
    });
  } catch (error) {
    console.error('Error fetching action items analytics:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch action items analytics',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get channel analytics
router.get('/:guildId/channels/:channelId', async (req, res) => {
  try {
    const { guildId, channelId } = req.params;
    const { period = '30d' } = req.query;

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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get channel statistics
    const statsPromises = [
      // Action items count
      pool.query(`
        SELECT COUNT(*) as action_items
        FROM action_items
        WHERE guild_id = $1 AND channel_id = $2 AND created_at >= $3
      `, [guildId, channelId, startDate]),

      // Messages processed count
      pool.query(`
        SELECT COUNT(*) as messages_processed
        FROM processed_messages
        WHERE guild_id = $1 AND channel_id = $2 AND processed_at >= $3
      `, [guildId, channelId, startDate]),

      // Action items by priority
      pool.query(`
        SELECT 
          priority,
          COUNT(*) as count
        FROM action_items
        WHERE guild_id = $1 AND channel_id = $2 AND created_at >= $3
        GROUP BY priority
      `, [guildId, channelId, startDate]),

      // Action items by status
      pool.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM action_items
        WHERE guild_id = $1 AND channel_id = $2 AND created_at >= $3
        GROUP BY status
      `, [guildId, channelId, startDate])
    ];

    const statsResults = await Promise.all(statsPromises);

    // Format priority data
    const byPriority = {};
    statsResults[2].rows.forEach(row => {
      byPriority[row.priority] = parseInt(row.count);
    });

    // Format status data
    const byStatus = {};
    statsResults[3].rows.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });

    res.json({
      guild_id: guildId,
      channel_id: channelId,
      channel_name: `channel-${channelId.slice(-4)}`, // Simulated channel name
      period,
      summary: {
        action_items: parseInt(statsResults[0].rows[0]?.action_items || 0),
        messages_processed: parseInt(statsResults[1].rows[0]?.messages_processed || 0)
      },
      by_priority: byPriority,
      by_status: byStatus
    });
  } catch (error) {
    console.error('Error fetching channel analytics:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch channel analytics',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router; 