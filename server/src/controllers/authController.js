const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// 创建数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 查询用户信息，包括角色
    const userQuery = `
      SELECT 
        u.id,
        u.username,
        u.password,
        u.full_name,
        u.avatar,
        json_agg(DISTINCT r.name) as roles,
        json_agg(DISTINCT r.id) as role_ids,
        json_object_agg(DISTINCT r.name, r.permissions) as permissions
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.username = $1 AND u.is_active = true
      GROUP BY u.id, u.username, u.password, u.full_name, u.avatar
    `;

    const { rows } = await pool.query(userQuery, [username]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 直接比较密码，因为数据库存储的是明文密码
    if (password !== user.password) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 更新最后登录时间
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // 生成JWT令牌
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        avatar: user.avatar,
        roles: user.roles,
        roleIds: user.role_ids,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 返回用户信息和令牌
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        avatar: user.avatar,
        roles: user.roles,
        roleIds: user.role_ids,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, full_name, email FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  login,
  getCurrentUser
}; 