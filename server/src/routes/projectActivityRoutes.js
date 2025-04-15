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

// 获取项目动态列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, page_size = 10, project_id } = req.query;
    const offset = (page - 1) * page_size;
    
    let queryParams = [];
    let whereClause = '';
    
    if (project_id) {
      whereClause = 'WHERE pa.project_id = $1';
      queryParams.push(project_id);
    }
    
    const activitiesQuery = `
      SELECT 
        pa.id,
        pa.project_id,
        p.name as project_name,
        pa.user_id,
        u.full_name as user_name,
        pa.activity_type,
        pa.description,
        pa.related_id,
        pa.created_at
      FROM 
        project_activities pa
      JOIN 
        projects p ON pa.project_id = p.id
      JOIN 
        users u ON pa.user_id = u.id
      ${whereClause}
      ORDER BY 
        pa.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM project_activities pa
      ${whereClause}
    `;
    
    const [activitiesResult, countResult] = await Promise.all([
      pool.query(activitiesQuery, [...queryParams, page_size, offset]),
      pool.query(countQuery, queryParams)
    ]);
    
    res.json({
      data: {
        activities: activitiesResult.rows,
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('获取项目动态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取首页项目动态（最新10条）
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        pa.id,
        pa.project_id,
        p.name as project_name,
        pa.user_id,
        u.full_name as user_name,
        pa.activity_type,
        pa.description,
        pa.created_at
      FROM 
        project_activities pa
      JOIN 
        projects p ON pa.project_id = p.id
      JOIN 
        users u ON pa.user_id = u.id
      ORDER BY 
        pa.created_at DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    
    res.json({
      data: result.rows
    });
  } catch (error) {
    console.error('获取最新项目动态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加项目动态
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { project_id, activity_type, description, related_id } = req.body;
    
    if (!project_id || !activity_type || !description) {
      return res.status(400).json({ message: '项目ID、活动类型和描述为必填项' });
    }
    
    // 检查项目是否存在
    const projectQuery = 'SELECT 1 FROM projects WHERE id = $1';
    const projectResult = await pool.query(projectQuery, [project_id]);
    
    if (!projectResult.rows.length) {
      return res.status(404).json({ message: '项目不存在' });
    }
    
    const insertQuery = `
      INSERT INTO project_activities (
        project_id, user_id, activity_type, description, related_id
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      project_id,
      req.user.id,
      activity_type,
      description,
      related_id || null
    ]);
    
    res.status(201).json({
      message: '项目动态添加成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('添加项目动态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 