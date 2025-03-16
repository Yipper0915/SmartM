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
    step_id,
    name,
    start_date,
    end_date,
    type_id,
    priority_id,
    assignee_id,
    description
  } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (
        project_id, step_id, name, start_date, end_date,
        type_id, priority_id, assignee_id, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [project_id, step_id, name, start_date, end_date, type_id, priority_id, assignee_id, description]
    );
    res.status(201).json({ message: '创建成功', id: rows[0].id });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ message: '服务器错误' });
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
    description
  } = req.body;

  try {
    await pool.query(
      `UPDATE tasks 
       SET name = $1, step_id = $2, start_date = $3, end_date = $4,
           type_id = $5, priority_id = $6, assignee_id = $7,
           description = $8
       WHERE id = $9`,
      [name, step_id, start_date, end_date, type_id, priority_id, assignee_id, description, id]
    );
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

module.exports = router;