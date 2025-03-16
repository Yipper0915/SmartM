-- 删除外键约束
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_step;

-- 修改 step_id 列定义为普通整数列
ALTER TABLE tasks ALTER COLUMN step_id TYPE integer; 