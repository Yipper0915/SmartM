const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 配置静态文件服务，使用绝对路径
const uploadsPath = path.resolve(__dirname, '../../uploads');
console.log('Static files directory:', uploadsPath); // 添加日志
app.use('/uploads', express.static(uploadsPath));

// 路由
app.use('/api/users', userRoutes);
app.use('/api/notices', noticeRoutes);

// ... 其他现有的代码 ...

module.exports = app; 