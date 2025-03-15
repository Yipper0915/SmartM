-- 创建 notices 表（如果不存在）
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入一些测试数据
INSERT INTO notices (title, content) VALUES 
('系统更新通知', '尊敬的用户，系统将于本周六凌晨2点进行例行维护更新，预计耗时2小时，请提前做好相关工作安排。'),
('项目管理规范更新', '为了提高项目管理效率，公司发布了新版项目管理规范，请所有项目经理及相关人员务必查看并遵照执行。'),
('新功能发布通知', '系统新增了项目进度追踪功能，现已上线。您可以在项目详情页面查看具体的进度图表。'),
('重要：安全更新提醒', '请所有用户及时修改密码，确保密码强度符合要求。系统将在下周开始强制执行新的密码策略。'),
('节日放假通知', '值此中秋佳节来临之际，公司将于9月29日至10月1日放假三天，10月2日正常上班。祝大家节日快乐！'); 