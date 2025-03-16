-- 创建角色表
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户角色关联表
CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表添加更新时间触发器
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入初始角色数据
INSERT INTO roles (name, description, permissions) VALUES
('system_admin', '系统管理员', '{"all": true}'::jsonb),
('project_manager', '项目经理', '{"project_management": true, "report_view": true}'::jsonb),
('production_specialist', '生产专员', '{"production_management": true, "inventory_view": true}'::jsonb),
('inventory_manager', '库存管理员', '{"inventory_management": true, "inventory_view": true}'::jsonb);

-- 插入初始用户数据（密码需要在应用层进行哈希处理）
INSERT INTO users (username, password, email, full_name) VALUES
('admin', '$2a$10$your_hashed_password', 'admin@example.com', '系统管理员'),
('manager', '$2a$10$your_hashed_password', 'manager@example.com', '项目经理'),
('production', '$2a$10$your_hashed_password', 'production@example.com', '生产专员'),
('inventory', '$2a$10$your_hashed_password', 'inventory@example.com', '库存管理员');

-- 关联用户和角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE (u.username = 'admin' AND r.name = 'system_admin')
   OR (u.username = 'manager' AND r.name = 'project_manager')
   OR (u.username = 'production' AND r.name = 'production_specialist')
   OR (u.username = 'inventory' AND r.name = 'inventory_manager');

-- 创建角色权限视图
CREATE VIEW user_permissions AS
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    json_agg(DISTINCT r.name) as roles,
    json_object_agg(DISTINCT r.name, r.permissions) as role_permissions
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.username, u.full_name;

-- 任务类型表
CREATE TABLE IF NOT EXISTS task_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 任务优先级表
CREATE TABLE IF NOT EXISTS task_priority (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type_id INTEGER NOT NULL REFERENCES task_type(id),
    priority_id INTEGER NOT NULL REFERENCES task_priority(id),
    assignee_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认任务类型
INSERT INTO task_type (name, description, color) VALUES
('normal', '普通任务', '#67C23A'),
('material', '物料需求', '#E6A23C')
ON CONFLICT (name) DO NOTHING;

-- 插入默认任务优先级
INSERT INTO task_priority (name, description) VALUES
('low', '低优先级'),
('medium', '中优先级'),
('high', '高优先级')
ON CONFLICT (name) DO NOTHING;

-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    duration_days INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status_id INTEGER NOT NULL,
    manager_id INTEGER NOT NULL REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建项目状态表
CREATE TABLE IF NOT EXISTS project_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认项目状态
INSERT INTO project_status (name, description) VALUES
('pending', '待启动'),
('in_progress', '进行中'),
('completed', '已完成'),
('abnormal', '异常')
ON CONFLICT (name) DO NOTHING;

-- 为项目表添加更新时间触发器
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入测试项目数据
INSERT INTO projects (
    name,
    duration_days,
    start_date,
    end_date,
    status_id,
    manager_id,
    description
) 
SELECT 
    '测试项目 1',
    30,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    (SELECT id FROM project_status WHERE name = 'in_progress'),
    (SELECT id FROM users WHERE username = 'manager'),
    '这是一个测试项目'
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE name = '测试项目 1'
);

INSERT INTO projects (
    name,
    duration_days,
    start_date,
    end_date,
    status_id,
    manager_id,
    description
)
SELECT 
    '测试项目 2',
    60,
    CURRENT_DATE + INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '75 days',
    (SELECT id FROM project_status WHERE name = 'pending'),
    (SELECT id FROM users WHERE username = 'manager'),
    '这是另一个测试项目'
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE name = '测试项目 2'
); 