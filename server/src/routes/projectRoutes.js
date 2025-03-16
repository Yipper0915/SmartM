const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');

// 创建数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 获取项目统计数据
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取当前季度的开始和结束时间
    const quarterQuery = `
      SELECT 
        date_trunc('quarter', CURRENT_DATE) as quarter_start,
        date_trunc('quarter', CURRENT_DATE) + INTERVAL '3 months' - INTERVAL '1 day' as quarter_end
    `;
    
    // 获取统计数据
    const statsQuery = `
      WITH current_quarter AS (${quarterQuery})
      SELECT
        (
          SELECT COUNT(*)
          FROM projects
          WHERE manager_id = $1
          AND created_at BETWEEN (SELECT quarter_start FROM current_quarter)
          AND (SELECT quarter_end FROM current_quarter)
        ) as total_projects_quarter,
        (
          SELECT COUNT(*)
          FROM projects
          WHERE manager_id = $1
          AND status_id = (SELECT id FROM project_status WHERE name = 'completed')
          AND created_at BETWEEN (SELECT quarter_start FROM current_quarter)
          AND (SELECT quarter_end FROM current_quarter)
        ) as completed_projects_quarter,
        (
          SELECT COUNT(*)
          FROM projects
          WHERE manager_id = $1
        ) as total_projects_all,
        (
          SELECT COUNT(*)
          FROM projects
          WHERE manager_id = $1
          AND status_id = (SELECT id FROM project_status WHERE name = 'abnormal')
        ) as abnormal_projects_all
    `;

    const { rows } = await pool.query(statsQuery, [userId]);
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('获取项目统计失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取项目列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        p.id,
        p.name as project_name,
        p.duration_days,
        p.start_date,
        p.end_date,
        p.description,
        ps.name as status_name,
        ps.description as status_description,
        u.full_name as manager_name
      FROM projects p
      LEFT JOIN project_status ps ON p.status_id = ps.id
      LEFT JOIN users u ON p.manager_id = u.id
      WHERE p.manager_id = $1
      ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建项目
router.post('/', authMiddleware, async (req, res) => {
  const { 
    name, 
    duration_days, 
    start_date, 
    end_date, 
    status_id, 
    inventory_manager_ids,
    description 
  } = req.body;

  // 验证必需字段
  if (!name || !duration_days || !start_date || !end_date || !status_id) {
    return res.status(400).json({ 
      message: '缺少必需字段',
      details: '项目名称、完成时间、开始日期、结束日期和状态为必填项'
    });
  }

  // 验证 inventory_manager_ids 是否为数组
  if (inventory_manager_ids && !Array.isArray(inventory_manager_ids)) {
    return res.status(400).json({ 
      message: '库存管理员ID格式错误',
      details: '库存管理员ID必须是一个数组'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. 创建项目
    const projectResult = await client.query(
      `INSERT INTO projects (
        name, duration_days, start_date, end_date, 
        status_id, manager_id, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [name, duration_days, start_date, end_date, status_id, req.user.id, description || '']
    );
    const projectId = projectResult.rows[0].id;

    // 2. 关联库存管理员
    if (inventory_manager_ids && inventory_manager_ids.length > 0) {
      const values = inventory_manager_ids.map(
        managerId => `(${projectId}, ${parseInt(managerId)})`
      ).join(',');
      
      if (values) {
        await client.query(
          `INSERT INTO project_inventory_managers (project_id, inventory_manager_id) VALUES ${values}`
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: '创建成功', id: projectId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('创建项目失败:', error);
    // 返回更详细的错误信息
    res.status(500).json({ 
      message: '创建项目失败',
      details: error.message,
      code: error.code
    });
  } finally {
    client.release();
  }
});

// 更新项目
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    duration_days, 
    start_date, 
    end_date, 
    status_id, 
    inventory_manager_ids,
    description 
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. 更新项目信息
    await client.query(
      `UPDATE projects 
       SET name = $1, duration_days = $2, start_date = $3, end_date = $4,
           status_id = $5, description = $6
       WHERE id = $7 AND manager_id = $8`,
      [name, duration_days, start_date, end_date, status_id, description, id, req.user.id]
    );

    // 2. 更新库存管理员关联
    await client.query(
      'DELETE FROM project_inventory_managers WHERE project_id = $1',
      [id]
    );

    if (inventory_manager_ids && inventory_manager_ids.length > 0) {
      const values = inventory_manager_ids.map(
        managerId => `(${id}, ${managerId})`
      ).join(',');
      await client.query(
        `INSERT INTO project_inventory_managers (project_id, inventory_manager_id) VALUES ${values}`
      );
    }

    await client.query('COMMIT');
    res.json({ message: '更新成功' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('更新项目失败:', error);
    res.status(500).json({ message: '服务器错误' });
  } finally {
    client.release();
  }
});

// 删除项目
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'DELETE FROM projects WHERE id = $1 AND manager_id = $2',
      [id, req.user.id]
    );
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除项目失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取项目步骤列表
router.get('/:projectId/steps', authMiddleware, async (req, res) => {
  const { projectId } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM project_steps WHERE project_id = $1 ORDER BY step_order',
      [projectId]
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('获取项目步骤失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建项目步骤
router.post('/steps', authMiddleware, async (req, res) => {
  const { project_id, step_name } = req.body;
  try {
    // 获取当前最大的 step_order
    const { rows: [maxOrder] } = await pool.query(
      'SELECT COALESCE(MAX(step_order), 0) as max_order FROM project_steps WHERE project_id = $1',
      [project_id]
    );
    
    const { rows: [newStep] } = await pool.query(
      'INSERT INTO project_steps (project_id, step_name, step_order) VALUES ($1, $2, $3) RETURNING *',
      [project_id, step_name, maxOrder.max_order + 1]
    );
    
    res.status(201).json({ data: newStep });
  } catch (error) {
    console.error('创建项目步骤失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新项目步骤
router.put('/steps/:stepId', authMiddleware, async (req, res) => {
  const { stepId } = req.params;
  const { step_name, step_order } = req.body;
  try {
    const { rows: [updatedStep] } = await pool.query(
      'UPDATE project_steps SET step_name = $1, step_order = $2 WHERE id = $3 RETURNING *',
      [step_name, step_order, stepId]
    );
    
    if (!updatedStep) {
      return res.status(404).json({ message: '步骤不存在' });
    }
    
    res.json({ data: updatedStep });
  } catch (error) {
    console.error('更新项目步骤失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除项目步骤
router.delete('/steps/:stepId', authMiddleware, async (req, res) => {
  const { stepId } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM project_steps WHERE id = $1', [stepId]);
    
    if (rowCount === 0) {
      return res.status(404).json({ message: '步骤不存在' });
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除项目步骤失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 