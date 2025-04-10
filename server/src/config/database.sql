-- 更新users表
ALTER TABLE users
ADD COLUMN IF NOT EXISTS real_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);

-- 更新现有记录的real_name为full_name的值（如果存在）
UPDATE users SET real_name = full_name WHERE full_name IS NOT NULL; 