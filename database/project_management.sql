-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建任务类型表
CREATE TABLE IF NOT EXISTS task_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建任务优先级表
CREATE TABLE IF NOT EXISTS task_priorities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建项目步骤表
CREATE TABLE IF NOT EXISTS project_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 创建任务表
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    step_id INT NOT NULL,
    task_name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type_id INT NOT NULL,
    priority_id INT NOT NULL,
    assignee_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES project_steps(id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES task_types(id),
    FOREIGN KEY (priority_id) REFERENCES task_priorities(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- 插入示例数据：任务类型
INSERT INTO task_types (name, description, color) VALUES
('development', '开发任务', '#409EFF'),
('design', '设计任务', '#67C23A'),
('testing', '测试任务', '#E6A23C'),
('bug', 'Bug修复', '#F56C6C'),
('documentation', '文档编写', '#909399');

-- 插入示例数据：任务优先级
INSERT INTO task_priorities (name, description, level) VALUES
('low', '低优先级', 1),
('medium', '中优先级', 2),
('high', '高优先级', 3),
('urgent', '紧急', 4);

-- 创建索引
CREATE INDEX idx_project_steps_project_id ON project_steps(project_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_step_id ON tasks(step_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id); 