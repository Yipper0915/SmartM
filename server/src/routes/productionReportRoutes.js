const express = require('express')
const router = express.Router()
const { Pool } = require('pg')
const authMiddleware = require('../middleware/auth')

// 创建数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

// 创建生产日报
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 验证用户角色
    const roleQuery = `
      SELECT role_id 
      FROM user_roles 
      WHERE user_id = $1
    `
    const roleResult = await pool.query(roleQuery, [req.user.id])
    if (!roleResult.rows[0] || roleResult.rows[0].role_id !== 3) {
      return res.status(403).json({ message: '只有生产专员可以创建日报' })
    }

    const { project_id, production_quantity, material_consumption, details } = req.body

    // 验证用户是否属于该项目（通过tasks表验证）
    const projectQuery = `
      SELECT 1 
      FROM tasks 
      WHERE assignee_id = $1 AND project_id = $2
    `
    const projectResult = await pool.query(projectQuery, [req.user.id, project_id])
    if (!projectResult.rows.length) {
      return res.status(403).json({ message: '您不属于该项目' })
    }

    // 创建日报
    const insertQuery = `
      INSERT INTO production_reports (
        user_id, 
        project_id, 
        production_quantity, 
        material_consumption, 
        details
      ) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id
    `
    const values = [req.user.id, project_id, production_quantity, material_consumption, details]
    const result = await pool.query(insertQuery, values)

    res.status(201).json({
      message: '日报创建成功',
      data: { id: result.rows[0].id }
    })
  } catch (error) {
    console.error('创建日报失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取日报列表（项目经理）
router.get('/', authMiddleware, async (req, res) => {
  try {
    // 验证用户角色
    const roleQuery = `
      SELECT role_id 
      FROM user_roles 
      WHERE user_id = $1
    `
    const roleResult = await pool.query(roleQuery, [req.user.id])
    if (!roleResult.rows[0] || roleResult.rows[0].role_id !== 2) {
      return res.status(403).json({ message: '只有项目经理可以查看日报列表' })
    }

    const { project_id, page = 1, page_size = 10 } = req.query
    const offset = (page - 1) * page_size

    // 验证项目经理是否管理该项目
    const projectQuery = `
      SELECT 1 
      FROM projects 
      WHERE id = $1 AND manager_id = $2
    `
    const projectResult = await pool.query(projectQuery, [project_id, req.user.id])
    if (!projectResult.rows.length) {
      return res.status(403).json({ message: '您不是该项目的管理者' })
    }

    // 获取日报列表
    const reportsQuery = `
      SELECT 
        pr.id,
        pr.production_quantity,
        pr.material_consumption,
        pr.details,
        pr.created_at,
        u.full_name as user_name,
        p.name as project_name
      FROM production_reports pr
      JOIN users u ON pr.user_id = u.id
      JOIN projects p ON pr.project_id = p.id
      WHERE pr.project_id = $1
      ORDER BY pr.created_at DESC
      LIMIT $2 OFFSET $3
    `
    const countQuery = `
      SELECT COUNT(*) 
      FROM production_reports pr
      WHERE pr.project_id = $1
    `

    const [reportsResult, countResult] = await Promise.all([
      pool.query(reportsQuery, [project_id, page_size, offset]),
      pool.query(countQuery, [project_id])
    ])

    res.json({
      data: {
        reports: reportsResult.rows,
        total: parseInt(countResult.rows[0].count)
      }
    })
  } catch (error) {
    console.error('获取日报列表失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取用户可参与的项目列表
router.get('/projects/user', authMiddleware, async (req, res) => {
  try {
    // 验证用户角色
    const roleQuery = `
      SELECT role_id 
      FROM user_roles 
      WHERE user_id = $1
    `
    const roleResult = await pool.query(roleQuery, [req.user.id])
    if (!roleResult.rows[0] || roleResult.rows[0].role_id !== 3) {
      return res.status(403).json({ message: '只有生产专员可以访问此接口' })
    }

    console.log('正在获取用户ID为', req.user.id, '的可参与项目列表')
    
    const query = `
      SELECT DISTINCT
        p.id,
        p.name
      FROM projects p
      JOIN tasks t ON t.project_id = p.id
      WHERE t.assignee_id = $1
      ORDER BY p.id
    `
    
    const result = await pool.query(query, [req.user.id])
    console.log('查询到', result.rows.length, '个项目')
    
    if (result.rows.length === 0) {
      // 如果没有分配任务，返回一个空数组
      console.log('该用户没有分配任务所属的项目')
      return res.json({ data: [] })
    }
    
    res.json({ data: result.rows })
  } catch (error) {
    console.error('获取用户项目列表失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 快速为生产专员创建测试任务（仅用于测试目的）
router.post('/create-test-task', authMiddleware, async (req, res) => {
  try {
    // 验证是否为系统管理员或项目经理
    const roleQuery = `
      SELECT role_id 
      FROM user_roles 
      WHERE user_id = $1
    `
    const roleResult = await pool.query(roleQuery, [req.user.id])
    if (!roleResult.rows[0] || ![1, 2].includes(roleResult.rows[0].role_id)) {
      return res.status(403).json({ message: '权限不足' })
    }

    const { user_id, project_id } = req.body

    if (!user_id || !project_id) {
      return res.status(400).json({ message: '缺少必要参数' })
    }

    // 检查用户是否为生产专员
    const userRoleQuery = `
      SELECT 1 
      FROM user_roles 
      WHERE user_id = $1 AND role_id = 3
    `
    const userRoleResult = await pool.query(userRoleQuery, [user_id])
    if (!userRoleResult.rows.length) {
      return res.status(400).json({ message: '指定用户不是生产专员' })
    }

    // 检查项目是否存在
    const projectQuery = `
      SELECT 1 
      FROM projects 
      WHERE id = $1
    `
    const projectResult = await pool.query(projectQuery, [project_id])
    if (!projectResult.rows.length) {
      return res.status(404).json({ message: '项目不存在' })
    }

    // 创建一个生产任务
    const insertQuery = `
      INSERT INTO tasks (
        project_id,
        name,
        description,
        start_date,
        end_date,
        type_id,
        priority_id,
        assignee_id,
        step_id,
        status
      ) 
      VALUES (
        $1,
        '生产任务',
        '生产专员测试任务',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        1,
        1,
        $2,
        1,
        1
      )
      RETURNING id
    `
    const result = await pool.query(insertQuery, [project_id, user_id])

    res.status(201).json({
      message: '任务创建成功',
      data: { id: result.rows[0].id }
    })
  } catch (error) {
    console.error('创建测试任务失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router 