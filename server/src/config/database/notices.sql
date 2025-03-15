-- 创建公告表
CREATE TABLE notices (
    id SERIAL PRIMARY KEY,                    -- 自增主键
    title VARCHAR(255) NOT NULL,              -- 公告标题
    content TEXT NOT NULL,                    -- 公告内容
    attachments JSONB DEFAULT '[]'::jsonb,    -- 附件信息，使用 JSONB 存储数组
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notices_updated_at
    BEFORE UPDATE ON notices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建索引
CREATE INDEX idx_notices_created_at ON notices(created_at DESC);