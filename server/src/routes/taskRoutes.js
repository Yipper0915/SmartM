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

// 获取任务类型列表
router.get('/types', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, description, color FROM task_type ORDER BY id'
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('获取任务类型失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取任务优先级列表
router.get('/priorities', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, description FROM task_priority ORDER BY id'
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('获取任务优先级失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取项目任务列表
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  const { projectId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT 
        t.id,
        t.name as task_name,
        t.start_date,
        t.end_date,
        t.description,
        t.type_id,
        t.step_id,
        t.status,
        t.note,
        tt.name as type_name,
        tt.color as task_color,
        tp.name as priority_name,
        u.full_name as assignee_name,
        t.assignee_id
      FROM tasks t
      LEFT JOIN task_type tt ON t.type_id = tt.id
      LEFT JOIN task_priority tp ON t.priority_id = tp.id
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN project_steps ps ON t.step_id = ps.id
      WHERE t.project_id = $1
      ORDER BY t.start_date ASC`,
      [projectId]
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('获取项目任务列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取项目步骤数量
router.get('/steps/:projectId', authMiddleware, async (req, res) => {
  const { projectId } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT steps FROM project_steps WHERE project_id = $1',
      [projectId]
    );
    
    res.json({ data: rows[0]?.steps || 0 });
  } catch (error) {
    console.error('获取项目步骤数量失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新项目步骤数量
router.put('/steps/:projectId', authMiddleware, async (req, res) => {
  const { projectId } = req.params;
  const { steps } = req.body;

  try {
    // 先检查是否存在记录
    const { rows } = await pool.query(
      'SELECT * FROM project_steps WHERE project_id = $1',
      [projectId]
    );

    if (rows.length === 0) {
      // 如果不存在，插入新记录
      await pool.query(
        'INSERT INTO project_steps (project_id, steps) VALUES ($1, $2)',
        [projectId, 1]
      );
      res.json({ message: '创建成功', data: { steps: 1 } });
    } else {
      // 如果存在，更新记录
      await pool.query(
        'UPDATE project_steps SET steps = $1 WHERE project_id = $2',
        [steps, projectId]
      );
      res.json({ message: '更新成功', data: { steps } });
    }
  } catch (error) {
    console.error('更新项目步骤数量失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建任务
router.post('/', authMiddleware, async (req, res) => {
  const {
    project_id,
    name,
    description,
    start_date,
    end_date,
    type_id,
    priority_id,
    assignee_id,
    step_id,
    status,
    note
  } = req.body;

  // 验证必填字段
  if (!project_id || !name || !start_date || !end_date || !type_id || !priority_id || !step_id) {
    return res.status(400).json({ 
      message: '缺少必填字段',
      details: '项目ID、任务名称、开始日期、结束日期、任务类型、优先级和步骤ID为必填项'
    });
  }

  try {
    // 先检查项目是否存在
    const { rows: projectRows } = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [project_id]
    );

    if (projectRows.length === 0) {
      return res.status(404).json({ message: '项目不存在' });
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks (
        project_id,
        name,
        description,
        start_date,
        end_date,
        type_id,
        priority_id,
        assignee_id,
        step_id,
        status,
        note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        project_id,
        name,
        description || '',
        start_date,
        end_date,
        type_id,
        priority_id,
        assignee_id,
        step_id,
        status || 1,
        note || ''
      ]
    );

    res.status(201).json({ 
      message: '创建成功', 
      data: { id: rows[0].id }
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ 
      message: '创建任务失败',
      error: error.message,
      details: error.detail
    });
  }
});

// 更新任务
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    step_id,
    start_date,
    end_date,
    type_id,
    priority_id,
    assignee_id,
    description,
    status,
    note
  } = req.body;

  try {
    // 先获取用户角色
    const roleQuery = `
      SELECT role_id 
      FROM user_roles 
      WHERE user_id = $1
    `;
    const roleResult = await pool.query(roleQuery, [req.user.id]);
    const userRoleId = roleResult.rows[0]?.role_id;

    // 如果是生产专员（role_id = 3），只更新状态和备注
    if (userRoleId === 3) {
      await pool.query(
        `UPDATE tasks 
         SET status = $1,
             note = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [status, note, id]
      );
    } else {
      // 项目经理可以更新所有字段
      await pool.query(
        `UPDATE tasks 
         SET name = $1,
             step_id = $2,
             start_date = $3,
             end_date = $4,
             type_id = $5,
             priority_id = $6,
             assignee_id = $7,
             description = $8,
             status = $9,
             note = $10,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $11`,
        [name, step_id, start_date, end_date, type_id, priority_id, assignee_id, description, status, note, id]
      );
    }
    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除任务
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取生产专员的统计数据
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // 先获取用户角色
    const roleQuery = `
      SELECT role_id 
      FROM user_roles 
      WHERE user_id = $1
    `;
    const roleResult = await pool.query(roleQuery, [req.user.id]);
    const userRoleId = roleResult.rows[0]?.role_id;

    // 如果不是生产专员，返回错误
    if (userRoleId !== 3) {
      return res.status(403).json({ message: '无权访问此接口' });
    }

    // 获取基本统计数据
    const statsQuery = `
      SELECT
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 2) as in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 4) as abnormal_tasks,
        COUNT(*) FILTER (WHERE status != 3 AND end_date <= CURRENT_DATE + INTERVAL '2 days') as urgent_tasks
      FROM tasks
      WHERE assignee_id = $1
    `;

    // 获取即将截止的任务详情
    const urgentTasksQuery = `
      SELECT 
        t.name as task_name,
        p.name as project_name,
        t.end_date
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = $1
      AND t.status != 3
      AND t.end_date <= CURRENT_DATE + INTERVAL '2 days'
      ORDER BY t.end_date ASC
      LIMIT 3
    `;

    const [statsResult, urgentTasksResult] = await Promise.all([
      pool.query(statsQuery, [req.user.id]),
      pool.query(urgentTasksQuery, [req.user.id])
    ]);

    res.json({ 
      data: {
        ...statsResult.rows[0],
        urgent_tasks_details: urgentTasksResult.rows
      }
    });
  } catch (error) {
    console.error('获取生产专员统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;