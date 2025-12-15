-- =====================================================
-- 路之音智能人才评估系统 - 数据库初始化脚本
-- 数据库: PostgreSQL 16
-- 创建时间: 2025-01-XX
-- =====================================================

-- 设置客户端编码
SET client_encoding = 'UTF8';

-- 创建扩展(如果需要)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 公司背景表 (company_backgrounds)
-- 用于存储公司背景信息,支持多个用户/租户场景
-- =====================================================
CREATE TABLE IF NOT EXISTS company_backgrounds (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,                      -- 公司背景内容
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true              -- 是否为当前使用的公司背景
);

-- 创建索引
CREATE INDEX idx_company_backgrounds_active ON company_backgrounds(is_active);
CREATE INDEX idx_company_backgrounds_created ON company_backgrounds(created_at DESC);

-- 插入默认数据注释
COMMENT ON TABLE company_backgrounds IS '公司背景信息表';
COMMENT ON COLUMN company_backgrounds.content IS '公司背景详细内容';
COMMENT ON COLUMN company_backgrounds.is_active IS '是否为当前激活的公司背景';

-- =====================================================
-- 2. 岗位信息表 (job_positions)
-- 存储岗位名称、JD要求等信息
-- =====================================================
CREATE TABLE IF NOT EXISTS job_positions (
    id SERIAL PRIMARY KEY,
    job_title VARCHAR(200) NOT NULL,            -- 岗位名称
    job_description TEXT NOT NULL,              -- 岗位JD要求
    company_background_id INTEGER,              -- 关联的公司背景ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_company_background
        FOREIGN KEY (company_background_id)
        REFERENCES company_backgrounds(id)
        ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX idx_job_positions_title ON job_positions(job_title);
CREATE INDEX idx_job_positions_created ON job_positions(created_at DESC);
CREATE INDEX idx_job_positions_company ON job_positions(company_background_id);

-- 创建唯一约束:同一岗位名称+描述组合不重复(允许NULL)
CREATE UNIQUE INDEX idx_job_positions_unique
    ON job_positions(job_title, md5(job_description));

-- 添加注释
COMMENT ON TABLE job_positions IS '岗位信息表';
COMMENT ON COLUMN job_positions.job_title IS '岗位名称';
COMMENT ON COLUMN job_positions.job_description IS '岗位职责和任职要求(JD)';

-- =====================================================
-- 3. 评估报告表 (assessment_reports)
-- 存储每次评估的整体报告信息
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_reports (
    id SERIAL PRIMARY KEY,
    job_position_id INTEGER NOT NULL,           -- 关联的岗位ID
    company_background TEXT,                    -- 快照:公司背景
    job_title VARCHAR(200) NOT NULL,            -- 快照:岗位名称
    job_description TEXT NOT NULL,              -- 快照:岗位JD
    total_candidates INTEGER DEFAULT 0,         -- 候选人总数
    assessment_summary TEXT,                    -- 评估总结
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_position
        FOREIGN KEY (job_position_id)
        REFERENCES job_positions(id)
        ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_assessment_reports_job ON assessment_reports(job_position_id);
CREATE INDEX idx_assessment_reports_created ON assessment_reports(created_at DESC);
CREATE INDEX idx_assessment_reports_title ON assessment_reports(job_title);

-- 添加注释
COMMENT ON TABLE assessment_reports IS '评估报告主表';
COMMENT ON COLUMN assessment_reports.company_background IS '评估时的公司背景快照';
COMMENT ON COLUMN assessment_reports.job_title IS '评估时的岗位名称快照';
COMMENT ON COLUMN assessment_reports.total_candidates IS '本次评估的候选人数量';

-- =====================================================
-- 4. 候选人简历表 (candidate_resumes)
-- 存储候选人简历详情和评估结果
-- =====================================================
CREATE TABLE IF NOT EXISTS candidate_resumes (
    id SERIAL PRIMARY KEY,
    assessment_report_id INTEGER NOT NULL,      -- 关联的评估报告ID
    candidate_name VARCHAR(200),                -- 候选人姓名
    resume_file_name VARCHAR(500),              -- 简历文件名
    resume_file_path TEXT,                      -- 简历文件路径(如果本地存储)
    resume_text TEXT,                           -- 简历文本内容

    -- 评估结果字段
    overall_score DECIMAL(5,2),                 -- 综合评分 (0-100)
    technical_match DECIMAL(5,2),               -- 技术匹配度 (0-100)
    experience_match DECIMAL(5,2),              -- 经验匹配度 (0-100)
    culture_fit DECIMAL(5,2),                   -- 文化契合度 (0-100)

    recommendation_level VARCHAR(50),           -- 推荐等级:强烈推荐/推荐/待定/不推荐
    confidence_score DECIMAL(5,2),              -- 置信度 (0-100)
    expected_success_rate DECIMAL(5,2),         -- 预期成功率 (0-100)

    strengths TEXT,                             -- 优势(JSON或纯文本)
    weaknesses TEXT,                            -- 劣势(JSON或纯文本)
    gap_analysis TEXT,                          -- 差距分析
    risk_factors TEXT,                          -- 风险因素

    ai_evaluation_detail JSONB,                 -- AI评估详细结果(JSON格式)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assessment_report
        FOREIGN KEY (assessment_report_id)
        REFERENCES assessment_reports(id)
        ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_candidate_resumes_report ON candidate_resumes(assessment_report_id);
CREATE INDEX idx_candidate_resumes_name ON candidate_resumes(candidate_name);
CREATE INDEX idx_candidate_resumes_score ON candidate_resumes(overall_score DESC);
CREATE INDEX idx_candidate_resumes_created ON candidate_resumes(created_at DESC);
CREATE INDEX idx_candidate_resumes_recommendation ON candidate_resumes(recommendation_level);

-- GIN索引用于JSONB字段
CREATE INDEX idx_candidate_resumes_ai_detail ON candidate_resumes USING GIN (ai_evaluation_detail);

-- 添加注释
COMMENT ON TABLE candidate_resumes IS '候选人简历及评估结果表';
COMMENT ON COLUMN candidate_resumes.resume_text IS '简历的文本内容(OCR识别或提取)';
COMMENT ON COLUMN candidate_resumes.overall_score IS '综合评分(0-100)';
COMMENT ON COLUMN candidate_resumes.recommendation_level IS '推荐等级:强烈推荐/推荐/待定/不推荐';
COMMENT ON COLUMN candidate_resumes.ai_evaluation_detail IS 'AI评估的详细结果,JSON格式存储';

-- =====================================================
-- 5. 评估历史记录表 (assessment_history)
-- 用于快速查询历史评估列表
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_history (
    id SERIAL PRIMARY KEY,
    assessment_report_id INTEGER NOT NULL UNIQUE,
    job_title VARCHAR(200) NOT NULL,
    candidate_count INTEGER DEFAULT 0,
    top_candidate_name VARCHAR(200),            -- 最高分候选人姓名
    top_candidate_score DECIMAL(5,2),           -- 最高分
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assessment_history_report
        FOREIGN KEY (assessment_report_id)
        REFERENCES assessment_reports(id)
        ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_assessment_history_created ON assessment_history(created_at DESC);
CREATE INDEX idx_assessment_history_title ON assessment_history(job_title);

-- 添加注释
COMMENT ON TABLE assessment_history IS '评估历史记录表(用于快速查询)';

-- =====================================================
-- 6. 创建更新时间触发器函数
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表添加更新时间触发器
CREATE TRIGGER update_company_backgrounds_updated_at
    BEFORE UPDATE ON company_backgrounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_positions_updated_at
    BEFORE UPDATE ON job_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_reports_updated_at
    BEFORE UPDATE ON assessment_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_resumes_updated_at
    BEFORE UPDATE ON candidate_resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. 插入示例数据(可选,测试用)
-- =====================================================

-- 插入示例公司背景
INSERT INTO company_backgrounds (content, is_active) VALUES
('我们是一家专注于人工智能技术的创业公司，目前处于快速发展期。团队规模50人，技术团队占比60%。主要业务方向是智能对话系统和知识图谱。技术栈包括Python、React、PostgreSQL等。团队氛围开放创新，鼓励技术分享和自主学习。', true);

-- 初始化完成提示
DO $$
BEGIN
    RAISE NOTICE '✅ 数据库初始化完成!';
    RAISE NOTICE '📊 已创建以下表:';
    RAISE NOTICE '   1. company_backgrounds (公司背景表)';
    RAISE NOTICE '   2. job_positions (岗位信息表)';
    RAISE NOTICE '   3. assessment_reports (评估报告表)';
    RAISE NOTICE '   4. candidate_resumes (候选人简历表)';
    RAISE NOTICE '   5. assessment_history (评估历史记录表)';
    RAISE NOTICE '🔧 已创建索引和触发器';
    RAISE NOTICE '🎉 系统已就绪,可以开始使用!';
END $$;
