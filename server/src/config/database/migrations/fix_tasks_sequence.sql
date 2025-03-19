-- 删除旧的序列（如果存在）
DROP SEQUENCE IF EXISTS tasks_id_seq CASCADE;

-- 创建新的序列
CREATE SEQUENCE tasks_id_seq;

-- 将序列的所有权给予tasks表
ALTER SEQUENCE tasks_id_seq OWNED BY tasks.id;

-- 设置tasks表的id列默认值为新序列的下一个值
ALTER TABLE tasks ALTER COLUMN id SET DEFAULT nextval('tasks_id_seq');

-- 更新序列的当前值为表中最大的id值
SELECT setval('tasks_id_seq', COALESCE((SELECT MAX(id) FROM tasks), 0)); 