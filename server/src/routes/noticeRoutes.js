const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/notices';
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 获取公告列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('开始获取公告列表...');
    const { rows } = await pool.query(
      `SELECT id, title, content, created_at 
       FROM notices 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    
    res.json({ data: rows });
  } catch (error) {
    console.error('获取公告列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 新增公告
router.post('/', authMiddleware, async (req, res) => {
  const { title, content, attachments } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO notices (title, content, attachments, created_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
       RETURNING id, title, content, attachments, created_at`,
      [title, content, JSON.stringify(attachments)]
    );
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('新增公告失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新公告
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, content, attachments } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE notices 
       SET title = $1, content = $2, attachments = $3 
       WHERE id = $4 
       RETURNING id, title, content, attachments, created_at`,
      [title, content, JSON.stringify(attachments), id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '公告不存在' });
    }
    
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('更新公告失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除公告
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM notices WHERE id = $1', [id]);
    
    if (rowCount === 0) {
      return res.status(404).json({ message: '公告不存在' });
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除公告失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 上传附件
router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    // 返回文件信息
    res.json({
      url: `/uploads/notices/${req.file.filename}`,
      name: req.file.originalname
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 