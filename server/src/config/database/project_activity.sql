-- 创建项目动态表
CREATE TABLE IF NOT EXISTS project_activities (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL, -- 'task_status_changed', 'material_stock_out' 等
    description TEXT NOT NULL, -- "陆库管改变任务'清点物料'为已完成"
    related_id INTEGER, -- 关联的任务ID或库存记录ID等
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_project_activities_project_id ON project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_user_id ON project_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_created_at ON project_activities(created_at);

-- 创建视图以便更方便地查询项目动态
CREATE OR REPLACE VIEW project_activities_view AS
SELECT 
    pa.id,
    pa.project_id,
    p.name as project_name,
    pa.user_id,
    u.full_name as user_name,
    pa.activity_type,
    pa.description,
    pa.related_id,
    pa.created_at
FROM 
    project_activities pa
JOIN 
    projects p ON pa.project_id = p.id
JOIN 
    users u ON pa.user_id = u.id
ORDER BY 
    pa.created_at DESC; 