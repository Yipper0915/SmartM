const sequelize = require('../database');
const Role = require('../../models/Role');
const User = require('../../models/User');

const roles = [
  {
    name: 'system_admin',
    description: '系统管理员'
  },
  {
    name: 'project_manager',
    description: '项目经理'
  },
  {
    name: 'production_specialist',
    description: '生产专员'
  },
  {
    name: 'inventory_manager',
    description: '库存管理员'
  }
];

const users = [
  {
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    fullName: '系统管理员',
    RoleId: 1
  },
  {
    username: 'manager',
    password: 'manager123',
    email: 'manager@example.com',
    fullName: '项目经理',
    RoleId: 2
  },
  {
    username: 'production',
    password: 'production123',
    email: 'production@example.com',
    fullName: '生产专员',
    RoleId: 3
  },
  {
    username: 'inventory',
    password: 'inventory123',
    email: 'inventory@example.com',
    fullName: '库存管理员',
    RoleId: 4
  }
];

async function migrate() {
  try {
    // 同步数据库模型
    await sequelize.sync({ force: true });
    console.log('数据库表已创建');

    // 创建角色
    await Role.bulkCreate(roles);
    console.log('角色已创建');

    // 创建用户
    await User.bulkCreate(users);
    console.log('用户已创建');

    console.log('数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

migrate(); 