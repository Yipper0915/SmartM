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
    let query;
    const params = [];

    console.log('当前用户ID:', req.user.id);

    // 先获取用户角色
    const roleQuery = `
      SELECT role_id 
      FROM user_roles 
      WHERE user_id = $1
    `;
    const roleResult = await pool.query(roleQuery, [req.user.id]);
    const userRoleId = roleResult.rows[0]?.role_id;
    
    console.log('查询到的用户角色:', userRoleId);

    if (userRoleId === 2) {
      // 项目经理查看自己负责的项目
      query = `
        SELECT 
          p.id,
          p.name as project_name,
          p.duration_days,
          p.start_date,
          p.end_date,
          p.description,
          ps.name as status_name,
          ps.description as status_description,
          p.created_at
        FROM projects p
        LEFT JOIN project_status ps ON p.status_id = ps.id
        WHERE p.manager_id = $1
        ORDER BY p.created_at DESC
      `;
      params.push(req.user.id);
    } else {
      // 其他成员查看与自己相关的任务所属的项目
      query = `
        SELECT DISTINCT
          p.id,
          p.name as project_name,
          p.duration_days,
          p.start_date,
          p.end_date,
          p.description,
          ps.name as status_name,
          ps.description as status_description,
          p.created_at
        FROM projects p
        LEFT JOIN project_status ps ON p.status_id = ps.id
        WHERE EXISTS (
          SELECT 1 
          FROM tasks t 
          WHERE t.project_id = p.id 
          AND t.assignee_id = $1
        )
        ORDER BY p.created_at DESC
      `;
      params.push(req.user.id);
    }

    console.log('执行的SQL查询:', query);
    console.log('查询参数:', params);

    const { rows } = await pool.query(query, params);
    console.log('查询结果行数:', rows.length);
    console.log('查询结果:', rows);

    return res.json({ data: rows || [] });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return res.json({ data: [] });
  }
});

// 创建项目
router.post('/', authMiddleware, async (req, res) => {
  const { name, duration_days, start_date, end_date, status_id, inventory_manager_id, description } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO projects 
        (name, duration_days, start_date, end_date, status_id, manager_id, inventory_manager_id, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id`,
      [name, duration_days, start_date, end_date, status_id, req.user.id, inventory_manager_id, description]
    );
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('创建项目失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新项目
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, duration_days, start_date, end_date, status_id, inventory_manager_id, description } = req.body;
  try {
    await pool.query(
      `UPDATE projects 
       SET name = $1, 
           duration_days = $2, 
           start_date = $3, 
           end_date = $4, 
           status_id = $5, 
           inventory_manager_id = $6, 
           description = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND manager_id = $9`,
      [name, duration_days, start_date, end_date, status_id, inventory_manager_id, description, id, req.user.id]
    );
    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新项目失败:', error);
    res.status(500).json({ message: '服务器错误' });
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