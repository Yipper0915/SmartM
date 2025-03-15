const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const DEFAULT_PASSWORD = '123';  // 默认密码

// 确保上传目录存在
const avatarUploadDir = path.resolve(__dirname, '../../uploads/avatars');
console.log('Avatar upload directory:', avatarUploadDir); // 添加日志
if (!fs.existsSync(avatarUploadDir)) {
  console.log('Creating avatar upload directory...'); // 添加日志
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

// 配置头像上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Uploading to:', avatarUploadDir); // 添加日志
    cb(null, avatarUploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'avatar-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename); // 添加日志
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 限制2MB
  },
  fileFilter: function (req, file, cb) {
    // 只允许上传图片
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传图片文件！'));
    }
  }
});

// 获取角色列表
router.get('/roles', authMiddleware, async (req, res) => {
  try {
    console.log('开始获取角色列表...');
    const { rows } = await pool.query(
      `SELECT id, description, created_at 
       FROM roles 
       ORDER BY created_at ASC`
    );
    console.log('获取到的角色列表:', rows);
    res.json({ data: rows });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        u.id, 
        u.username,
        u.password, 
        u.full_name, 
        u.gender, 
        r.description as position, 
        u.department 
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.is_active = true`
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建用户
router.post('/', authMiddleware, async (req, res) => {
  const { username, full_name, gender, position, department } = req.body;
  try {
    // 开启事务
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. 创建用户 - 使用默认密码
      const userResult = await client.query(
        'INSERT INTO users (username, password, full_name, gender, department) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [username, DEFAULT_PASSWORD, full_name, gender, department]
      );
      const userId = userResult.rows[0].id;

      // 2. 查找对应的角色ID
      const roleResult = await client.query(
        'SELECT id FROM roles WHERE description = $1',
        [position]
      );
      
      if (roleResult.rows.length > 0) {
        // 3. 创建用户角色关联
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [userId, roleResult.rows[0].id]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ message: '创建成功', id: userId });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { username, password, full_name, gender, position, department } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('开始更新用户:', { id, username, password, full_name, gender, position, department });
    
    // 1. 更新用户基本信息
    await client.query(
      'UPDATE users SET username = $1, password = $2, full_name = $3, gender = $4, department = $5 WHERE id = $6',
      [username, password, full_name, gender, department, id]
    );
    console.log('用户基本信息更新成功');

    // 2. 查找对应的角色ID
    const roleResult = await client.query(
      'SELECT id FROM roles WHERE description = $1',
      [position]
    );
    console.log('查询到的角色:', roleResult.rows);

    if (roleResult.rows.length > 0) {
      const roleId = roleResult.rows[0].id;
      
      // 3. 检查用户角色关联是否存在
      const userRoleResult = await client.query(
        'SELECT * FROM user_roles WHERE user_id = $1',
        [id]
      );
      
      if (userRoleResult.rows.length > 0) {
        // 更新已存在的用户角色关联
        await client.query(
          'UPDATE user_roles SET role_id = $1 WHERE user_id = $2',
          [roleId, id]
        );
        console.log('更新用户角色关联成功');
      } else {
        // 创建新的用户角色关联
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [id, roleId]
        );
        console.log('创建用户角色关联成功');
      }
    } else {
      console.log('未找到对应的角色:', position);
    }

    await client.query('COMMIT');
    console.log('事务提交成功');
    res.json({ message: '更新成功' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('更新用户失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ 
      message: '服务器错误',
      detail: error.message 
    });
  } finally {
    client.release();
  }
});

// 删除用户
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. 删除用户角色关联
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
      
      // 2. 标记用户为非活动
      await client.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      res.json({ message: '删除成功' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 重置用户密码
router.post('/:id/reset-password', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 更新用户密码为默认密码
      await client.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [DEFAULT_PASSWORD, id]
      );
      
      await client.query('COMMIT');
      res.json({ message: '密码重置成功' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 处理头像上传
router.post('/avatar', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const userId = req.user.id;
    // 修改为相对于服务器根目录的路径
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // 更新用户头像URL
    await pool.query(
      'UPDATE users SET avatar = $1 WHERE id = $2',
      [avatarUrl, userId]
    );

    // 删除旧头像文件
    const { rows } = await pool.query('SELECT avatar FROM users WHERE id = $1', [userId]);
    const oldAvatar = rows[0]?.avatar;
    if (oldAvatar) {
      const oldAvatarPath = path.join(__dirname, '../../../', oldAvatar.replace(/^\//, ''));
      if (fs.existsSync(oldAvatarPath) && !oldAvatarPath.includes('default-avatar')) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    res.json({
      url: avatarUrl
    });
  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新个人资料
router.put('/profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { full_name, department, gender, phone, email, password } = req.body;
  
  try {
    // 1. 更新用户基本信息
    const updateFields = ['full_name', 'department', 'gender', 'phone', 'email'];
    const values = [full_name, department, gender, phone, email];
    let updateQuery = `
      UPDATE users 
      SET ${updateFields.map((field, i) => `${field} = $${i + 1}`).join(', ')}
      WHERE id = $${updateFields.length + 1}`;
    
    // 如果提供了新密码，则更新密码
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password');
      values.push(hashedPassword);
      updateQuery = updateQuery.replace('SET', `SET password = $${updateFields.length}, `);
    }
    
    values.push(userId);
    updateQuery += ' RETURNING id, username, full_name, department, gender, phone, email, avatar';
    
    const { rows } = await pool.query(updateQuery, values);
    
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('更新个人资料失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/current', authMiddleware, async (req, res) => {
  try {
    console.log('获取当前用户信息 - 用户ID:', req.user?.id);
    
    if (!req.user?.id) {
      console.error('用户ID未找到');
      return res.status(400).json({ message: '用户ID未找到' });
    }

    const { rows } = await pool.query(
      `SELECT 
        id, 
        username,
        full_name,
        department,
        gender,
        phone,
        email,
        avatar
       FROM users
       WHERE id = $1 AND is_active = true`,
      [req.user.id]
    );

    console.log('查询结果:', rows);

    if (rows.length === 0) {
      console.log('用户不存在或未激活');
      return res.status(404).json({ message: '用户不存在或未激活' });
    }

    res.json({ data: rows[0] });
  } catch (error) {
    console.error('获取当前用户信息失败:', {
      error: error.message,
      stack: error.stack,
      user: req.user
    });
    res.status(500).json({ 
      message: '服务器错误',
      details: error.message 
    });
  }
});

// 获取在职员工数量
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE is_active = true'
    );
    res.json({ data: rows[0].count });
  } catch (error) {
    console.error('获取在职员工数量失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 