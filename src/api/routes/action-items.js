const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// List action items for a guild
router.get('/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    const {
      status,
      priority,
      channel_id,
      limit = 50,
      offset = 0,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    // Validate limit
    const parsedLimit = Math.min(parseInt(limit), 100);
    const parsedOffset = parseInt(offset);

    // Build WHERE clause
    const whereConditions = ['guild_id = $1'];
    const values = [guildId];
    let paramCount = 2;

    if (status) {
      whereConditions.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (priority) {
      whereConditions.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (channel_id) {
      whereConditions.push(`channel_id = $${paramCount++}`);
      values.push(channel_id);
    }

    // Validate sort field
    const allowedSortFields = ['created_at', 'priority', 'updated_at'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM action_items
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get action items
    const query = `
      SELECT 
        id,
        guild_id,
        channel_id,
        summary,
        text,
        priority,
        category,
        status,
        assigned_to,
        created_at,
        updated_at
      FROM action_items
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    values.push(parsedLimit, parsedOffset);
    const result = await pool.query(query, values);

    // Get channel names (simulated - would need Discord API integration)
    const actionItems = result.rows.map(item => ({
      ...item,
      channel_name: `channel-${item.channel_id.slice(-4)}` // Simulated channel name
    }));

    res.json({
      action_items: actionItems,
      total,
      limit: parsedLimit,
      offset: parsedOffset
    });
  } catch (error) {
    console.error('Error fetching action items:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch action items',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get specific action item
router.get('/:guildId/:itemId', async (req, res) => {
  try {
    const { guildId, itemId } = req.params;

    const result = await pool.query(`
      SELECT 
        id,
        guild_id,
        channel_id,
        summary,
        text,
        priority,
        category,
        status,
        assigned_to,
        created_at,
        updated_at
      FROM action_items
      WHERE guild_id = $1 AND id = $2
    `, [guildId, itemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'ACTION_ITEM_NOT_FOUND',
          message: 'Action item not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const actionItem = {
      ...result.rows[0],
      channel_name: `channel-${result.rows[0].channel_id.slice(-4)}` // Simulated channel name
    };

    res.json(actionItem);
  } catch (error) {
    console.error('Error fetching action item:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch action item',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Create new action item
router.post('/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    const {
      channel_id,
      summary,
      text,
      priority = 'medium',
      category = 'general',
      assigned_to
    } = req.body;

    // Validation
    if (!channel_id || !text) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'channel_id and text are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'priority must be low, medium, or high',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate unique ID
    const id = require('crypto').randomBytes(12).toString('hex');

    const result = await pool.query(`
      INSERT INTO action_items (
        id, guild_id, channel_id, summary, text, priority, category, assigned_to
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [id, guildId, channel_id, summary, text, priority, category, assigned_to]);

    const actionItem = {
      ...result.rows[0],
      channel_name: `channel-${channel_id.slice(-4)}` // Simulated channel name
    };

    res.status(201).json(actionItem);
  } catch (error) {
    console.error('Error creating action item:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create action item',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Update action item
router.put('/:guildId/:itemId', async (req, res) => {
  try {
    const { guildId, itemId } = req.params;
    const {
      channel_id,
      summary,
      text,
      priority,
      category,
      status,
      assigned_to
    } = req.body;

    // Validate priority if provided
    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'priority must be low, medium, or high',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'archived'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'status must be pending, in_progress, completed, or archived',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (channel_id !== undefined) {
      updateFields.push(`channel_id = $${paramCount++}`);
      values.push(channel_id);
    }
    if (summary !== undefined) {
      updateFields.push(`summary = $${paramCount++}`);
      values.push(summary);
    }
    if (text !== undefined) {
      updateFields.push(`text = $${paramCount++}`);
      values.push(text);
    }
    if (priority !== undefined) {
      updateFields.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (assigned_to !== undefined) {
      updateFields.push(`assigned_to = $${paramCount++}`);
      values.push(assigned_to);
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
    values.push(guildId, itemId);

    const query = `
      UPDATE action_items 
      SET ${updateFields.join(', ')}
      WHERE guild_id = $${paramCount++} AND id = $${paramCount++}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'ACTION_ITEM_NOT_FOUND',
          message: 'Action item not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const actionItem = {
      ...result.rows[0],
      channel_name: `channel-${result.rows[0].channel_id.slice(-4)}` // Simulated channel name
    };

    res.json(actionItem);
  } catch (error) {
    console.error('Error updating action item:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update action item',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Delete action item
router.delete('/:guildId/:itemId', async (req, res) => {
  try {
    const { guildId, itemId } = req.params;

    const result = await pool.query(`
      DELETE FROM action_items
      WHERE guild_id = $1 AND id = $2
      RETURNING id
    `, [guildId, itemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'ACTION_ITEM_NOT_FOUND',
          message: 'Action item not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      message: 'Action item deleted successfully',
      id: itemId
    });
  } catch (error) {
    console.error('Error deleting action item:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete action item',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Update action item status
router.patch('/:guildId/:itemId/status', async (req, res) => {
  try {
    const { guildId, itemId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'status is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'status must be pending, in_progress, completed, or archived',
          timestamp: new Date().toISOString()
        }
      });
    }

    const result = await pool.query(`
      UPDATE action_items 
      SET status = $1, updated_at = NOW()
      WHERE guild_id = $2 AND id = $3
      RETURNING *
    `, [status, guildId, itemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'ACTION_ITEM_NOT_FOUND',
          message: 'Action item not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const actionItem = {
      ...result.rows[0],
      channel_name: `channel-${result.rows[0].channel_id.slice(-4)}` // Simulated channel name
    };

    res.json(actionItem);
  } catch (error) {
    console.error('Error updating action item status:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update action item status',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router; 