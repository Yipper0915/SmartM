-- 创建项目状态枚举表
CREATE TABLE project_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入项目状态数据
INSERT INTO project_status (name, description) VALUES
('not_started', '未开始'),
('in_progress', '进行中'),
('completed', '已完成'),
('abnormal', '异常');

-- 创建项目表
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    duration_days INTEGER NOT NULL, -- 项目完成时间（天数）
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status_id INTEGER REFERENCES project_status(id),
    manager_id INTEGER REFERENCES users(id), -- 项目经理ID
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建项目-库存管理员关联表
CREATE TABLE project_inventory_managers (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    inventory_manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, inventory_manager_id)
);

-- 创建更新时间触发器
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：季度项目统计
CREATE OR REPLACE VIEW quarterly_project_stats AS
WITH current_quarter AS (
    SELECT 
        date_trunc('quarter', CURRENT_DATE) as quarter_start,
        date_trunc('quarter', CURRENT_DATE) + INTERVAL '3 months' - INTERVAL '1 day' as quarter_end
)
SELECT
    COUNT(*) as total_projects_quarter,
    COUNT(CASE WHEN p.status_id = (SELECT id FROM project_status WHERE name = 'completed') THEN 1 END) as completed_projects_quarter,
    (SELECT COUNT(*) FROM projects) as total_projects_all,
    (SELECT COUNT(*) FROM projects WHERE status_id = (SELECT id FROM project_status WHERE name = 'abnormal')) as abnormal_projects_all
FROM projects p
WHERE p.created_at BETWEEN (SELECT quarter_start FROM current_quarter) AND (SELECT quarter_end FROM current_quarter);

-- 创建视图：项目列表详情
CREATE OR REPLACE VIEW project_details AS
SELECT 
    p.id,
    p.name as project_name,
    p.duration_days,
    p.start_date,
    p.end_date,
    ps.name as status_name,
    ps.description as status_description,
    array_agg(DISTINCT u.full_name) as inventory_managers
FROM projects p
JOIN project_status ps ON p.status_id = ps.id
LEFT JOIN project_inventory_managers pim ON p.id = pim.project_id
LEFT JOIN users u ON pim.inventory_manager_id = u.id
GROUP BY p.id, p.name, p.duration_days, p.start_date, p.end_date, ps.name, ps.description; 