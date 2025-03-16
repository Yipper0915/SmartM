-- 创建项目步骤表
CREATE TABLE IF NOT EXISTS project_steps (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 修改任务表，添加step_id字段
ALTER TABLE tasks
ADD COLUMN step_id INTEGER;

-- 添加外键约束
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_step
FOREIGN KEY (step_id) REFERENCES project_steps(id) ON DELETE CASCADE;

-- 设置step_id为非空
ALTER TABLE tasks
ALTER COLUMN step_id SET NOT NULL;

-- 创建步骤相关索引
CREATE INDEX idx_project_steps_project_id ON project_steps(project_id);
CREATE INDEX idx_tasks_step_id ON tasks(step_id); 