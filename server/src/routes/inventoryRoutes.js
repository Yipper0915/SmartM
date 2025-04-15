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

// 验证是否为库存管理员的中间件
const checkInventoryManagerRole = async (req, res, next) => {
  try {
    const roleQuery = `
      SELECT role_id 
      FROM user_roles 
      WHERE user_id = $1
    `
    const roleResult = await pool.query(roleQuery, [req.user.id])
    if (!roleResult.rows[0] || roleResult.rows[0].role_id !== 4) {
      return res.status(403).json({ message: '只有库存管理员可以访问此资源' })
    }
    next()
  } catch (error) {
    console.error('验证库存管理员角色失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
}

// 获取所有材料
router.get('/materials', authMiddleware, checkInventoryManagerRole, async (req, res) => {
  try {
    const { page = 1, page_size = 10, search = '' } = req.query
    const offset = (page - 1) * page_size

    let materialsQuery = `
      SELECT * FROM materials
      WHERE (material_code ILIKE $1 OR name ILIKE $1 OR supplier ILIKE $1)
      ORDER BY id
      LIMIT $2 OFFSET $3
    `
    let countQuery = `
      SELECT COUNT(*) FROM materials
      WHERE (material_code ILIKE $1 OR name ILIKE $1 OR supplier ILIKE $1)
    `
    
    const searchPattern = `%${search}%`
    const [materialsResult, countResult] = await Promise.all([
      pool.query(materialsQuery, [searchPattern, page_size, offset]),
      pool.query(countQuery, [searchPattern])
    ])

    res.json({
      data: {
        materials: materialsResult.rows,
        total: parseInt(countResult.rows[0].count)
      }
    })
  } catch (error) {
    console.error('获取材料列表失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取单个材料详情
router.get('/materials/:id', authMiddleware, checkInventoryManagerRole, async (req, res) => {
  try {
    const { id } = req.params
    const query = 'SELECT * FROM materials WHERE id = $1'
    const result = await pool.query(query, [id])
    
    if (!result.rows.length) {
      return res.status(404).json({ message: '材料不存在' })
    }
    
    res.json({ data: result.rows[0] })
  } catch (error) {
    console.error('获取材料详情失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 创建新材料
router.post('/materials', authMiddleware, checkInventoryManagerRole, async (req, res) => {
  try {
    const { material_code, name, quantity, supplier, unit_price, unit, image_url, location } = req.body
    
    // 验证必填字段
    if (!material_code || !name || !unit_price || !unit) {
      return res.status(400).json({ message: '材料编号、名称、单价和计量单位为必填项' })
    }
    
    // 检查材料编号是否已存在
    const checkQuery = 'SELECT 1 FROM materials WHERE material_code = $1'
    const checkResult = await pool.query(checkQuery, [material_code])
    if (checkResult.rows.length) {
      return res.status(400).json({ message: '材料编号已存在' })
    }
    
    const insertQuery = `
      INSERT INTO materials (
        material_code, name, quantity, supplier, unit_price, unit, image_url, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    const values = [material_code, name, quantity || 0, supplier, unit_price, unit, image_url, location]
    const result = await pool.query(insertQuery, values)
    
    // 创建入库记录（如果初始数量大于0）
    if (quantity && quantity > 0) {
      const recordQuery = `
        INSERT INTO inventory_records (
          material_id, record_type, quantity, operator_id, description
        ) VALUES ($1, $2, $3, $4, $5)
      `
      await pool.query(recordQuery, [
        result.rows[0].id, 
        'in', 
        quantity, 
        req.user.id, 
        '初始库存录入'
      ])
    }
    
    res.status(201).json({ 
      message: '材料创建成功',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('创建材料失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 更新材料信息
router.put('/materials/:id', authMiddleware, checkInventoryManagerRole, async (req, res) => {
  try {
    const { id } = req.params
    const { material_code, name, supplier, unit_price, unit, image_url, location } = req.body
    
    // 验证必填字段
    if (!material_code || !name || !unit_price || !unit) {
      return res.status(400).json({ message: '材料编号、名称、单价和计量单位为必填项' })
    }
    
    // 检查材料是否存在
    const checkQuery = 'SELECT 1 FROM materials WHERE id = $1'
    const checkResult = await pool.query(checkQuery, [id])
    if (!checkResult.rows.length) {
      return res.status(404).json({ message: '材料不存在' })
    }
    
    // 检查材料编号是否与其他材料冲突
    const codeQuery = 'SELECT 1 FROM materials WHERE material_code = $1 AND id != $2'
    const codeResult = await pool.query(codeQuery, [material_code, id])
    if (codeResult.rows.length) {
      return res.status(400).json({ message: '材料编号已被其他材料使用' })
    }
    
    const updateQuery = `
      UPDATE materials
      SET material_code = $1, name = $2, supplier = $3, unit_price = $4, unit = $5, image_url = $6, location = $7
      WHERE id = $8
      RETURNING *
    `
    const values = [material_code, name, supplier, unit_price, unit, image_url, location, id]
    const result = await pool.query(updateQuery, values)
    
    res.json({ 
      message: '材料信息更新成功',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('更新材料信息失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 材料入库
router.post('/materials/:id/stock-in', authMiddleware, checkInventoryManagerRole, async (req, res) => {
  try {
    const { id } = req.params
    const { quantity, description } = req.body
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: '入库数量必须大于0' })
    }
    
    // 开始事务
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      // 检查材料是否存在
      const checkQuery = 'SELECT quantity FROM materials WHERE id = $1 FOR UPDATE'
      const checkResult = await client.query(checkQuery, [id])
      if (!checkResult.rows.length) {
        await client.query('ROLLBACK')
        return res.status(404).json({ message: '材料不存在' })
      }
      
      const currentQuantity = checkResult.rows[0].quantity
      
      // 更新库存数量
      const updateQuery = `
        UPDATE materials
        SET quantity = $1
        WHERE id = $2
        RETURNING *
      `
      const newQuantity = currentQuantity + quantity
      const updateResult = await client.query(updateQuery, [newQuantity, id])
      
      // 创建入库记录
      const recordQuery = `
        INSERT INTO inventory_records (
          material_id, record_type, quantity, operator_id, description
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `
      const recordResult = await client.query(recordQuery, [
        id, 'in', quantity, req.user.id, description || '材料入库'
      ])
      
      await client.query('COMMIT')
      
      res.json({
        message: '入库成功',
        data: {
          material: updateResult.rows[0],
          record_id: recordResult.rows[0].id
        }
      })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('入库失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 材料出库
router.post('/materials/:id/stock-out', authMiddleware, checkInventoryManagerRole, async (req, res) => {
  try {
    const { id } = req.params
    const { quantity, description, project_id } = req.body
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: '出库数量必须大于0' })
    }
    
    if (!project_id) {
      return res.status(400).json({ message: '必须选择项目' })
    }
    
    // 验证项目是否存在且库存管理员是否关联此项目
    const projectQuery = `
      SELECT 1 
      FROM project_inventory_managers 
      WHERE project_id = $1 AND inventory_manager_id = $2
    `
    const projectResult = await pool.query(projectQuery, [project_id, req.user.id])
    if (!projectResult.rows.length) {
      return res.status(403).json({ message: '您没有权限为此项目出库材料' })
    }
    
    // 开始事务
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      // 检查材料是否存在
      const checkQuery = 'SELECT material_code, name, quantity, unit FROM materials WHERE id = $1 FOR UPDATE'
      const checkResult = await client.query(checkQuery, [id])
      if (!checkResult.rows.length) {
        await client.query('ROLLBACK')
        return res.status(404).json({ message: '材料不存在' })
      }
      
      const material = checkResult.rows[0]
      const currentQuantity = material.quantity
      
      // 检查库存是否足够
      if (currentQuantity < quantity) {
        await client.query('ROLLBACK')
        return res.status(400).json({ message: '库存不足' })
      }
      
      // 获取项目名称
      const projectNameQuery = 'SELECT name FROM projects WHERE id = $1'
      const projectNameResult = await client.query(projectNameQuery, [project_id])
      const projectName = projectNameResult.rows[0]?.name || '未知项目'
      
      // 获取用户姓名
      const userQuery = 'SELECT full_name FROM users WHERE id = $1'
      const userResult = await client.query(userQuery, [req.user.id])
      const userName = userResult.rows[0]?.full_name || '用户'
      
      // 更新库存数量
      const updateQuery = `
        UPDATE materials
        SET quantity = $1
        WHERE id = $2
        RETURNING *
      `
      const newQuantity = currentQuantity - quantity
      const updateResult = await client.query(updateQuery, [newQuantity, id])
      
      // 创建出库记录，添加项目信息
      const recordQuery = `
        INSERT INTO inventory_records (
          material_id, record_type, quantity, operator_id, description, project_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `
      const recordResult = await client.query(recordQuery, [
        id, 'out', quantity, req.user.id, description || '材料出库', project_id
      ])
      
      // 创建项目动态记录
      const activityDescription = `${userName}为项目"${projectName}"出库材料"${material.material_code} - ${material.name}"${quantity}${material.unit}`
      
      const activityQuery = `
        INSERT INTO project_activities (
          project_id, user_id, activity_type, description, related_id
        ) VALUES ($1, $2, $3, $4, $5)
      `
      
      await client.query(activityQuery, [
        project_id,
        req.user.id,
        'material_stock_out',
        activityDescription,
        recordResult.rows[0].id
      ])
      
      await client.query('COMMIT')
      
      res.json({
        message: '出库成功',
        data: {
          material: updateResult.rows[0],
          record_id: recordResult.rows[0].id
        }
      })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('出库失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 删除材料
router.delete('/materials/:id', authMiddleware, checkInventoryManagerRole, async (req, res) => {
  try {
    const { id } = req.params
    
    // 检查材料是否存在
    const checkQuery = 'SELECT * FROM materials WHERE id = $1'
    const checkResult = await pool.query(checkQuery, [id])
    if (!checkResult.rows.length) {
      return res.status(404).json({ message: '材料不存在' })
    }
    
    // 删除材料（库存记录会通过级联删除自动删除）
    const deleteQuery = 'DELETE FROM materials WHERE id = $1'
    await pool.query(deleteQuery, [id])
    
    res.json({ message: '材料删除成功' })
  } catch (error) {
    console.error('删除材料失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取入库出库记录
router.get('/records', authMiddleware, checkInventoryManagerRole, async (req, res) => {
  try {
    const { material_id, page = 1, page_size = 10 } = req.query
    const offset = (page - 1) * page_size
    
    let recordsQuery = `
      SELECT 
        ir.id,
        ir.record_type,
        ir.quantity,
        ir.description,
        ir.created_at,
        m.id as material_id,
        m.material_code,
        m.name as material_name,
        u.full_name as operator_name,
        p.name as project_name,
        pm.full_name as project_manager
      FROM inventory_records ir
      JOIN materials m ON ir.material_id = m.id
      JOIN users u ON ir.operator_id = u.id
      LEFT JOIN projects p ON ir.project_id = p.id
      LEFT JOIN users pm ON p.manager_id = pm.id
    `
    
    let countQuery = `
      SELECT COUNT(*) FROM inventory_records ir
    `
    
    const queryParams = []
    
    if (material_id) {
      recordsQuery += ' WHERE ir.material_id = $1'
      countQuery += ' WHERE ir.material_id = $1'
      queryParams.push(material_id)
    }
    
    recordsQuery += ' ORDER BY ir.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2)
    
    const [recordsResult, countResult] = await Promise.all([
      pool.query(recordsQuery, [...queryParams, page_size, offset]),
      pool.query(countQuery, queryParams)
    ])
    
    res.json({
      data: {
        records: recordsResult.rows,
        total: parseInt(countResult.rows[0].count)
      }
    })
  } catch (error) {
    console.error('获取库存记录失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取库存管理员关联的项目
router.get('/manager-projects', authMiddleware, checkInventoryManagerRole, async (req, res) => {
  try {
    // 获取库存管理员关联的项目
    const query = `
      SELECT 
        p.id,
        p.name,
        p.manager_id,
        u.full_name as manager_name
      FROM projects p
      JOIN project_inventory_managers pim ON p.id = pim.project_id
      JOIN users u ON p.manager_id = u.id
      WHERE pim.inventory_manager_id = $1
      ORDER BY p.id
    `
    
    const result = await pool.query(query, [req.user.id])
    
    if (result.rows.length === 0) {
      return res.json({ 
        message: '该库存管理员未关联任何项目',
        data: [] 
      })
    }
    
    res.json({ data: result.rows })
  } catch (error) {
    console.error('获取库存管理员项目失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取库存管理员统计数据
router.get('/stats', authMiddleware, checkInventoryManagerRole, async (req, res) => {
  try {
    const inventoryManagerId = req.user.id;
    
    // 1. 获取关联项目数
    const projectsQuery = `
      SELECT COUNT(*) as project_count
      FROM project_inventory_managers
      WHERE inventory_manager_id = $1
    `;
    
    // 2. 获取出库记录数
    const stockOutQuery = `
      SELECT COUNT(*) as stock_out_count
      FROM inventory_records
      WHERE record_type = 'out' AND operator_id = $1
    `;
    
    // 3. 获取入库记录数
    const stockInQuery = `
      SELECT COUNT(*) as stock_in_count
      FROM inventory_records
      WHERE record_type = 'in' AND operator_id = $1
    `;
    
    // 4. 获取库存紧缺的材料
    const lowStockQuery = `
      SELECT id, material_code, name, quantity, unit
      FROM materials
      WHERE quantity < 100
      ORDER BY quantity ASC
    `;
    
    // 并行执行查询
    const [projectsResult, stockOutResult, stockInResult, lowStockResult] = await Promise.all([
      pool.query(projectsQuery, [inventoryManagerId]),
      pool.query(stockOutQuery, [inventoryManagerId]),
      pool.query(stockInQuery, [inventoryManagerId]),
      pool.query(lowStockQuery)
    ]);
    
    const projectCount = parseInt(projectsResult.rows[0].project_count);
    const stockOutCount = parseInt(stockOutResult.rows[0].stock_out_count);
    const stockInCount = parseInt(stockInResult.rows[0].stock_in_count);
    const lowStockMaterials = lowStockResult.rows;
    
    res.json({
      data: {
        project_count: projectCount,
        stock_out_count: stockOutCount,
        stock_in_count: stockInCount,
        low_stock_count: lowStockMaterials.length,
        low_stock_materials: lowStockMaterials
      }
    });
  } catch (error) {
    console.error('获取库存管理员统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 