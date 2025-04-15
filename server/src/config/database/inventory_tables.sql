-- 创建材料表
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    material_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    supplier VARCHAR(100),
    unit_price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    image_url VARCHAR(255),
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建库存记录表（用于追踪入库和出库记录）
CREATE TABLE IF NOT EXISTS inventory_records (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    record_type VARCHAR(20) NOT NULL, -- 'in' 入库 或 'out' 出库
    quantity INTEGER NOT NULL,
    operator_id INTEGER REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 为材料表添加更新时间触发器
CREATE TRIGGER update_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建材料查询视图
CREATE OR REPLACE VIEW material_details AS
SELECT 
    m.id,
    m.material_code,
    m.name,
    m.quantity,
    m.supplier,
    m.unit_price,
    m.unit,
    m.image_url,
    m.location,
    m.created_at,
    m.updated_at
FROM materials m
ORDER BY m.id; 