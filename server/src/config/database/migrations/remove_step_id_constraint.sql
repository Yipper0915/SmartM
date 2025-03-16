-- 先删除原有的外键约束
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_step;

-- 确保step_id列存在，如果不存在则添加
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'step_id') THEN
        ALTER TABLE tasks ADD COLUMN step_id INTEGER;
    END IF;
END $$;

-- 确保status列存在，如果不存在则添加
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'status') THEN
        ALTER TABLE tasks ADD COLUMN status INTEGER DEFAULT 1;
    END IF;
END $$;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tasks_step_id ON tasks(step_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status); 