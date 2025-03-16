-- 创建任务重要程度枚举表
CREATE TABLE task_priority (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入任务重要程度数据
INSERT INTO task_priority (name, description) VALUES
('low', '低优先级'),
('medium', '中优先级'),
('high', '高优先级'),
('urgent', '紧急');

-- 创建任务类型表
CREATE TABLE task_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20) NOT NULL, -- 用于甘特图显示的颜色
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入任务类型数据
INSERT INTO task_type (name, description, color) VALUES
('normal', '普通任务', '#67C23A'),  -- 绿色
('material', '物料/原件需求', '#E6A23C');  -- 橙色

-- 创建项目任务表
CREATE TABLE project_tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type_id INTEGER REFERENCES task_type(id),
    priority_id INTEGER REFERENCES task_priority(id),
    assignee_id INTEGER REFERENCES users(id), -- 任务负责人
    created_by INTEGER REFERENCES users(id), -- 创建人（项目经理）
    step_id INTEGER, -- 步骤ID，不再作为外键
    status INTEGER DEFAULT 1, -- 1:未开始 2:进行中 3:已完成 4:异常
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建更新时间触发器
CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：任务详情
CREATE OR REPLACE VIEW task_details AS
SELECT 
    pt.id,
    pt.project_id,
    p.name as project_name,
    pt.name as task_name,
    pt.description,
    pt.start_date,
    pt.end_date,
    tt.name as type_name,
    tt.color as task_color,
    tp.name as priority_name,
    tp.description as priority_description,
    u.full_name as assignee_name,
    u.id as assignee_id,
    c.full_name as creator_name,
    pt.created_at,
    pt.updated_at,
    pt.step_id,
    pt.status
FROM project_tasks pt
JOIN projects p ON pt.project_id = p.id
JOIN task_type tt ON pt.type_id = tt.id
JOIN task_priority tp ON pt.priority_id = tp.id
JOIN users u ON pt.assignee_id = u.id
JOIN users c ON pt.created_by = c.id;

-- 添加权限检查函数
CREATE OR REPLACE FUNCTION check_project_manager_access(project_id INTEGER, user_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM projects 
        WHERE id = project_id 
        AND manager_id = user_id
    );
END;
$$ LANGUAGE plpgsql;

-- 添加索引以提高查询性能
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_assignee_id ON project_tasks(assignee_id);
CREATE INDEX idx_project_tasks_type_id ON project_tasks(type_id);
CREATE INDEX idx_project_tasks_priority_id ON project_tasks(priority_id);
CREATE INDEX idx_project_tasks_dates ON project_tasks(start_date, end_date);
CREATE INDEX idx_project_tasks_step_id ON project_tasks(step_id);
CREATE INDEX idx_project_tasks_status ON project_tasks(status);

-- 添加约束确保结束日期不早于开始日期
ALTER TABLE project_tasks
ADD CONSTRAINT check_task_dates 
CHECK (end_date >= start_date);

-- 添加约束确保任务日期在项目期限内
ALTER TABLE project_tasks
ADD CONSTRAINT check_task_within_project_dates
CHECK (
    start_date >= (SELECT start_date FROM projects WHERE id = project_id)
    AND end_date <= (SELECT end_date FROM projects WHERE id = project_id)
); 