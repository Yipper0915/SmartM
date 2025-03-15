const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');

// 登录路由
router.post('/login', authController.login);

// 获取当前用户信息
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router; 