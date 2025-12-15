--
-- PostgreSQL database dump
--

\restrict yaE1dke5l3BznPTlbon6HTTpwJ3nwCavYi2Kb0PR1kqkpTlKrMQ6E7iXeY3OT9X

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.assessment_reports DROP CONSTRAINT IF EXISTS fk_job_position;
ALTER TABLE IF EXISTS ONLY public.job_positions DROP CONSTRAINT IF EXISTS fk_company_background;
ALTER TABLE IF EXISTS ONLY public.candidate_resumes DROP CONSTRAINT IF EXISTS fk_assessment_report;
ALTER TABLE IF EXISTS ONLY public.assessment_history DROP CONSTRAINT IF EXISTS fk_assessment_history_report;
DROP TRIGGER IF EXISTS update_job_positions_updated_at ON public.job_positions;
DROP TRIGGER IF EXISTS update_company_backgrounds_updated_at ON public.company_backgrounds;
DROP TRIGGER IF EXISTS update_candidate_resumes_updated_at ON public.candidate_resumes;
DROP TRIGGER IF EXISTS update_assessment_reports_updated_at ON public.assessment_reports;
DROP INDEX IF EXISTS public.idx_job_positions_unique;
DROP INDEX IF EXISTS public.idx_job_positions_title;
DROP INDEX IF EXISTS public.idx_job_positions_created;
DROP INDEX IF EXISTS public.idx_job_positions_company;
DROP INDEX IF EXISTS public.idx_company_backgrounds_created;
DROP INDEX IF EXISTS public.idx_company_backgrounds_active;
DROP INDEX IF EXISTS public.idx_candidate_resumes_score;
DROP INDEX IF EXISTS public.idx_candidate_resumes_report;
DROP INDEX IF EXISTS public.idx_candidate_resumes_recommendation;
DROP INDEX IF EXISTS public.idx_candidate_resumes_name;
DROP INDEX IF EXISTS public.idx_candidate_resumes_created;
DROP INDEX IF EXISTS public.idx_candidate_resumes_ai_detail;
DROP INDEX IF EXISTS public.idx_assessment_reports_title;
DROP INDEX IF EXISTS public.idx_assessment_reports_job;
DROP INDEX IF EXISTS public.idx_assessment_reports_created;
DROP INDEX IF EXISTS public.idx_assessment_history_title;
DROP INDEX IF EXISTS public.idx_assessment_history_created;
ALTER TABLE IF EXISTS ONLY public.job_positions DROP CONSTRAINT IF EXISTS job_positions_pkey;
ALTER TABLE IF EXISTS ONLY public.company_backgrounds DROP CONSTRAINT IF EXISTS company_backgrounds_pkey;
ALTER TABLE IF EXISTS ONLY public.candidate_resumes DROP CONSTRAINT IF EXISTS candidate_resumes_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_reports DROP CONSTRAINT IF EXISTS assessment_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_history DROP CONSTRAINT IF EXISTS assessment_history_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_history DROP CONSTRAINT IF EXISTS assessment_history_assessment_report_id_key;
ALTER TABLE IF EXISTS public.job_positions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.company_backgrounds ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.candidate_resumes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_reports ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_history ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.job_positions_id_seq;
DROP TABLE IF EXISTS public.job_positions;
DROP SEQUENCE IF EXISTS public.company_backgrounds_id_seq;
DROP TABLE IF EXISTS public.company_backgrounds;
DROP SEQUENCE IF EXISTS public.candidate_resumes_id_seq;
DROP TABLE IF EXISTS public.candidate_resumes;
DROP SEQUENCE IF EXISTS public.assessment_reports_id_seq;
DROP TABLE IF EXISTS public.assessment_reports;
DROP SEQUENCE IF EXISTS public.assessment_history_id_seq;
DROP TABLE IF EXISTS public.assessment_history;
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: talent_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO talent_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assessment_history; Type: TABLE; Schema: public; Owner: talent_user
--

CREATE TABLE public.assessment_history (
    id integer NOT NULL,
    assessment_report_id integer NOT NULL,
    job_title character varying(200) NOT NULL,
    candidate_count integer DEFAULT 0,
    top_candidate_name character varying(200),
    top_candidate_score numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assessment_history OWNER TO talent_user;

--
-- Name: TABLE assessment_history; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON TABLE public.assessment_history IS '评估历史记录表(用于快速查询)';


--
-- Name: assessment_history_id_seq; Type: SEQUENCE; Schema: public; Owner: talent_user
--

CREATE SEQUENCE public.assessment_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_history_id_seq OWNER TO talent_user;

--
-- Name: assessment_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: talent_user
--

ALTER SEQUENCE public.assessment_history_id_seq OWNED BY public.assessment_history.id;


--
-- Name: assessment_reports; Type: TABLE; Schema: public; Owner: talent_user
--

CREATE TABLE public.assessment_reports (
    id integer NOT NULL,
    job_position_id integer NOT NULL,
    company_background text,
    job_title character varying(200) NOT NULL,
    job_description text NOT NULL,
    total_candidates integer DEFAULT 0,
    assessment_summary text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assessment_reports OWNER TO talent_user;

--
-- Name: TABLE assessment_reports; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON TABLE public.assessment_reports IS '评估报告主表';


--
-- Name: COLUMN assessment_reports.company_background; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON COLUMN public.assessment_reports.company_background IS '评估时的公司背景快照';


--
-- Name: COLUMN assessment_reports.job_title; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON COLUMN public.assessment_reports.job_title IS '评估时的岗位名称快照';


--
-- Name: COLUMN assessment_reports.total_candidates; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON COLUMN public.assessment_reports.total_candidates IS '本次评估的候选人数量';


--
-- Name: assessment_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: talent_user
--

CREATE SEQUENCE public.assessment_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_reports_id_seq OWNER TO talent_user;

--
-- Name: assessment_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: talent_user
--

ALTER SEQUENCE public.assessment_reports_id_seq OWNED BY public.assessment_reports.id;


--
-- Name: candidate_resumes; Type: TABLE; Schema: public; Owner: talent_user
--

CREATE TABLE public.candidate_resumes (
    id integer NOT NULL,
    assessment_report_id integer NOT NULL,
    candidate_name character varying(200),
    resume_file_name character varying(500),
    resume_file_path text,
    resume_text text,
    overall_score numeric(5,2),
    technical_match numeric(5,2),
    experience_match numeric(5,2),
    culture_fit numeric(5,2),
    recommendation_level character varying(50),
    confidence_score numeric(5,2),
    expected_success_rate numeric(5,2),
    strengths text,
    weaknesses text,
    gap_analysis text,
    risk_factors text,
    ai_evaluation_detail jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.candidate_resumes OWNER TO talent_user;

--
-- Name: TABLE candidate_resumes; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON TABLE public.candidate_resumes IS '候选人简历及评估结果表';


--
-- Name: COLUMN candidate_resumes.resume_text; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON COLUMN public.candidate_resumes.resume_text IS '简历的文本内容(OCR识别或提取)';


--
-- Name: COLUMN candidate_resumes.overall_score; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON COLUMN public.candidate_resumes.overall_score IS '综合评分(0-100)';


--
-- Name: COLUMN candidate_resumes.recommendation_level; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON COLUMN public.candidate_resumes.recommendation_level IS '推荐等级:强烈推荐/推荐/待定/不推荐';


--
-- Name: COLUMN candidate_resumes.ai_evaluation_detail; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON COLUMN public.candidate_resumes.ai_evaluation_detail IS 'AI评估的详细结果,JSON格式存储';


--
-- Name: candidate_resumes_id_seq; Type: SEQUENCE; Schema: public; Owner: talent_user
--

CREATE SEQUENCE public.candidate_resumes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidate_resumes_id_seq OWNER TO talent_user;

--
-- Name: candidate_resumes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: talent_user
--

ALTER SEQUENCE public.candidate_resumes_id_seq OWNED BY public.candidate_resumes.id;


--
-- Name: company_backgrounds; Type: TABLE; Schema: public; Owner: talent_user
--

CREATE TABLE public.company_backgrounds (
    id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.company_backgrounds OWNER TO talent_user;

--
-- Name: TABLE company_backgrounds; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON TABLE public.company_backgrounds IS '公司背景信息表';


--
-- Name: COLUMN company_backgrounds.content; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON COLUMN public.company_backgrounds.content IS '公司背景详细内容';


--
-- Name: COLUMN company_backgrounds.is_active; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON COLUMN public.company_backgrounds.is_active IS '是否为当前激活的公司背景';


--
-- Name: company_backgrounds_id_seq; Type: SEQUENCE; Schema: public; Owner: talent_user
--

CREATE SEQUENCE public.company_backgrounds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_backgrounds_id_seq OWNER TO talent_user;

--
-- Name: company_backgrounds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: talent_user
--

ALTER SEQUENCE public.company_backgrounds_id_seq OWNED BY public.company_backgrounds.id;


--
-- Name: job_positions; Type: TABLE; Schema: public; Owner: talent_user
--

CREATE TABLE public.job_positions (
    id integer NOT NULL,
    job_title character varying(200) NOT NULL,
    job_description text NOT NULL,
    company_background_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.job_positions OWNER TO talent_user;

--
-- Name: TABLE job_positions; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON TABLE public.job_positions IS '岗位信息表';


--
-- Name: COLUMN job_positions.job_title; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON COLUMN public.job_positions.job_title IS '岗位名称';


--
-- Name: COLUMN job_positions.job_description; Type: COMMENT; Schema: public; Owner: talent_user
--

COMMENT ON COLUMN public.job_positions.job_description IS '岗位职责和任职要求(JD)';


--
-- Name: job_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: talent_user
--

CREATE SEQUENCE public.job_positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_positions_id_seq OWNER TO talent_user;

--
-- Name: job_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: talent_user
--

ALTER SEQUENCE public.job_positions_id_seq OWNED BY public.job_positions.id;


--
-- Name: assessment_history id; Type: DEFAULT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.assessment_history ALTER COLUMN id SET DEFAULT nextval('public.assessment_history_id_seq'::regclass);


--
-- Name: assessment_reports id; Type: DEFAULT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.assessment_reports ALTER COLUMN id SET DEFAULT nextval('public.assessment_reports_id_seq'::regclass);


--
-- Name: candidate_resumes id; Type: DEFAULT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.candidate_resumes ALTER COLUMN id SET DEFAULT nextval('public.candidate_resumes_id_seq'::regclass);


--
-- Name: company_backgrounds id; Type: DEFAULT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.company_backgrounds ALTER COLUMN id SET DEFAULT nextval('public.company_backgrounds_id_seq'::regclass);


--
-- Name: job_positions id; Type: DEFAULT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.job_positions ALTER COLUMN id SET DEFAULT nextval('public.job_positions_id_seq'::regclass);


--
-- Data for Name: assessment_history; Type: TABLE DATA; Schema: public; Owner: talent_user
--

COPY public.assessment_history (id, assessment_report_id, job_title, candidate_count, top_candidate_name, top_candidate_score, created_at) FROM stdin;
\.


--
-- Data for Name: assessment_reports; Type: TABLE DATA; Schema: public; Owner: talent_user
--

COPY public.assessment_reports (id, job_position_id, company_background, job_title, job_description, total_candidates, assessment_summary, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: candidate_resumes; Type: TABLE DATA; Schema: public; Owner: talent_user
--

COPY public.candidate_resumes (id, assessment_report_id, candidate_name, resume_file_name, resume_file_path, resume_text, overall_score, technical_match, experience_match, culture_fit, recommendation_level, confidence_score, expected_success_rate, strengths, weaknesses, gap_analysis, risk_factors, ai_evaluation_detail, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: company_backgrounds; Type: TABLE DATA; Schema: public; Owner: talent_user
--

COPY public.company_backgrounds (id, content, created_at, updated_at, is_active) FROM stdin;
1	我们是一家专注于人工智能技术的创业公司，目前处于快速发展期。团队规模50人，技术团队占比60%。主要业务方向是智能对话系统和知识图谱。技术栈包括Python、React、PostgreSQL等。团队氛围开放创新，鼓励技术分享和自主学习。	2025-11-22 13:32:51.867218	2025-11-24 13:10:06.272347	f
2	深圳路之音科技有限公司于2009年在香港成立，2014年在深圳设立公司。核心团队在研发、市场、销售等方面拥有10年以上的车载电子行业经验。核心业务是专注于 CarPlay/Android Auto手机车机互联解决方案的研发与出海。车载音视频导航的资源整合、研发、生产和销售；为全球客户提供 OEM/ODM方案，产品主要面向海外市场，旗下已拥有 “CARTIZAN”和“OTTOCAST” 两个行业内知名品牌，产品已销往欧洲、北美、南美、韩国、日本、东南亚等全球87个国家和地区。	2025-11-23 02:31:40.838683	2025-11-24 13:10:06.272347	f
3	深圳路之音科技有限公司于2009年在香港成立，2014年在深圳设立公司。核心团队在研发、市场、销售等方面拥有10年以上的车载电子行业经验。核心业务是专注于 CarPlay/Android Auto手机车机互联解决方案的研发与出海。车载音视频导航的资源整合、研发、生产和销售；为全球客户提供 OEM/ODM方案，产品主要面向海外市场，旗下已拥有 “CARTIZAN”和“OTTOCAST” 两个行业内知名品牌，产品已销往欧洲、北美、南美、韩国、日本、东南亚等全球87个国家和地区。	2025-11-24 13:10:06.339162	2025-11-24 13:10:06.339162	t
\.


--
-- Data for Name: job_positions; Type: TABLE DATA; Schema: public; Owner: talent_user
--

COPY public.job_positions (id, job_title, job_description, company_background_id, created_at, updated_at) FROM stdin;
1	AI高级工程师	高级AI应用工程师\n岗位核心价值：\n负责将AI能力（特别是大模型与Agent技术）转化为实际的业务解决方案与产品功能。主导对内“研-产-销”智能化升级的Agent平台搭建，以及对外“车载智能场景”多Agent系统的架构设计与工程实现。\n岗位职责：\n一、 【对内】提效平台搭建（多Agent系统）\n1、配合AI产品经理进行需求分析与规划：深入“研产销”各部门（研发、生产、市场、销售、客服），调研并分析可被AI优化的业务流程，制定Agent落地路线图。\n2、平台设计与开发：主导内部AI Agent平台的设计与搭建。基于 Dify/MaxKB/LangChain 等工具，构建包括但不限于：\n（1）智能客服Agent：自动回答产品咨询、故障排查，降低人工客服成本。\n（2）智能调研Agent：自动搜集、分析竞品信息、市场动态，生成调研报告。\n（3）数据分析Agent：连接内部数据库，通过自然语言问答形式，为管理层提供销售、库存等数据洞察。\n（4）系统集成：将AI Agent与公司现有内部系统（如ERP、CRM、OA）进行集成，实现数据流与工作流的自动化。\n二、 【对外】产品功能实现（车载多Agent场景）\n1、车载Agent框架设计：设计并实现车载环境下的多Agent协作框架，确保语音指令能可靠地触发、执行并完成复杂任务。\n2、服务集成与API治理：\n（1）负责对接、封装和管理各类第三方服务API（如地图导航、停车预约、外卖、充电桩查询等）。\n（2）设计统一的“工具调用”规范，供NLP团队的大模型Agent进行调用。\n（3）车机交互SDK开发：开发与车机系统（Android Automotive, AAOS）或手机投屏协议（CarPlay/Android Auto）进行交互的中间件/SDK，实现“语音指挥屏幕操作”的核心能力。\n（4）端云协同架构：设计低延迟、高可用的端云协同架构，确保车载场景下语音交互的实时性和稳定性。\n三、 技术领导与协作\n1、与算法团队紧密合作，将NLP模型、语音模型高效地集成到应用系统中。\n2、编写高质量、可维护、可扩展的代码，并负责核心模块的部署与运维。\n3、主导技术文档的编写，并对内分享最佳实践，提升整个团队的技术应用能力。\n任职要求（必备技能）\n1、技术栈广度：\n后端开发：精通 Go/Python/Java 中至少一门语言，具备高并发、分布式系统开发经验。\n前端开发：熟悉现代前端框架（如 Vue/React），能够开发管理后台界面。\n嵌入式/移动端基础：了解 Android/Linux 应用开发基础，掌握 JNI/进程间通信者优先。\n\n2、大模型与Agent实战经验：\n（1）必须有使用LangChain/LlamaIndex/Dify 等框架构建AI Agent的实际项目经验。\n（2）必须精通 OpenAI/国内主流大模型 的API调用、Function Calling工具调用技术。\n（3）熟悉Prompt工程原则，有知识库（RAG）系统（如使用Dify/Coze/Maxkb）搭建经验者优先。\n3、系统架构与集成能力：\n（1）有复杂的系统集成经验，能够设计RESTful/gRPC API，并与内外部的多个系统进行数据对接。\n（2）具备扎实的软件架构设计能力，能绘制并实现清晰的技术架构图。\n（4）业务与软技能：\n强大的业务理解能力：能快速理解“研产销”各环节的痛点，并将之转化为技术方案。\n出色的沟通协调能力：能够与非技术部门（如市场、销售、客服）流畅沟通，引导需求，管理期望。\n卓越的问题解决能力和主人翁精神，能主导项目从概念到上线的全过程。\n优先考虑条件（加分项）\n1、有车载行业、IoT或智能硬件领域的应用开发经验。\n2、有在资源受限的嵌入式设备上进行AI应用部署和优化的经验。	3	2025-11-23 02:36:02.849098	2025-12-03 03:03:49.59734
2	高级AI应用工程师	高级AI应用工程师\n岗位核心价值：\n负责将AI能力（特别是大模型与Agent技术）转化为实际的业务解决方案与产品功能。主导对内“研-产-销”智能化升级的Agent平台搭建，以及对外“车载智能场景”多Agent系统的架构设计与工程实现。\n岗位职责：\n一、 【对内】提效平台搭建（多Agent系统）\n1、配合AI产品经理进行需求分析与规划：深入“研产销”各部门（研发、生产、市场、销售、客服），调研并分析可被AI优化的业务流程，制定Agent落地路线图。\n2、平台设计与开发：主导内部AI Agent平台的设计与搭建。基于 Dify/MaxKB/LangChain 等工具，构建包括但不限于：\n（1）智能客服Agent：自动回答产品咨询、故障排查，降低人工客服成本。\n（2）智能调研Agent：自动搜集、分析竞品信息、市场动态，生成调研报告。\n（3）数据分析Agent：连接内部数据库，通过自然语言问答形式，为管理层提供销售、库存等数据洞察。\n（4）系统集成：将AI Agent与公司现有内部系统（如ERP、CRM、OA）进行集成，实现数据流与工作流的自动化。\n二、 【对外】产品功能实现（车载多Agent场景）\n1、车载Agent框架设计：设计并实现车载环境下的多Agent协作框架，确保语音指令能可靠地触发、执行并完成复杂任务。\n2、服务集成与API治理：\n（1）负责对接、封装和管理各类第三方服务API（如地图导航、停车预约、外卖、充电桩查询等）。\n（2）设计统一的“工具调用”规范，供NLP团队的大模型Agent进行调用。\n（3）车机交互SDK开发：开发与车机系统（Android Automotive, AAOS）或手机投屏协议（CarPlay/Android Auto）进行交互的中间件/SDK，实现“语音指挥屏幕操作”的核心能力。\n（4）端云协同架构：设计低延迟、高可用的端云协同架构，确保车载场景下语音交互的实时性和稳定性。\n三、 技术领导与协作\n1、与算法团队紧密合作，将NLP模型、语音模型高效地集成到应用系统中。\n2、编写高质量、可维护、可扩展的代码，并负责核心模块的部署与运维。\n3、主导技术文档的编写，并对内分享最佳实践，提升整个团队的技术应用能力。\n任职要求（必备技能）\n1、技术栈广度：\n后端开发：精通 Go/Python/Java 中至少一门语言，具备高并发、分布式系统开发经验。\n前端开发：熟悉现代前端框架（如 Vue/React），能够开发管理后台界面。\n嵌入式/移动端基础：了解 Android/Linux 应用开发基础，掌握 JNI/进程间通信者优先。\n\n2、大模型与Agent实战经验：\n（1）必须有使用LangChain/LlamaIndex/Dify 等框架构建AI Agent的实际项目经验。\n（2）必须精通 OpenAI/国内主流大模型 的API调用、Function Calling工具调用技术。\n（3）熟悉Prompt工程原则，有知识库（RAG）系统（如使用Dify/Coze/Maxkb）搭建经验者优先。\n3、系统架构与集成能力：\n（1）有复杂的系统集成经验，能够设计RESTful/gRPC API，并与内外部的多个系统进行数据对接。\n（2）具备扎实的软件架构设计能力，能绘制并实现清晰的技术架构图。\n（4）业务与软技能：\n强大的业务理解能力：能快速理解“研产销”各环节的痛点，并将之转化为技术方案。\n出色的沟通协调能力：能够与非技术部门（如市场、销售、客服）流畅沟通，引导需求，管理期望。\n卓越的问题解决能力和主人翁精神，能主导项目从概念到上线的全过程。\n优先考虑条件（加分项）\n1、有车载行业、IoT或智能硬件领域的应用开发经验。\n2、有在资源受限的嵌入式设备上进行AI应用部署和优化的经验。	3	2025-11-24 13:14:57.631384	2025-12-08 03:05:40.287455
\.


--
-- Name: assessment_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: talent_user
--

SELECT pg_catalog.setval('public.assessment_history_id_seq', 1, false);


--
-- Name: assessment_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: talent_user
--

SELECT pg_catalog.setval('public.assessment_reports_id_seq', 1, false);


--
-- Name: candidate_resumes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: talent_user
--

SELECT pg_catalog.setval('public.candidate_resumes_id_seq', 1, false);


--
-- Name: company_backgrounds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: talent_user
--

SELECT pg_catalog.setval('public.company_backgrounds_id_seq', 3, true);


--
-- Name: job_positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: talent_user
--

SELECT pg_catalog.setval('public.job_positions_id_seq', 2, true);


--
-- Name: assessment_history assessment_history_assessment_report_id_key; Type: CONSTRAINT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.assessment_history
    ADD CONSTRAINT assessment_history_assessment_report_id_key UNIQUE (assessment_report_id);


--
-- Name: assessment_history assessment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.assessment_history
    ADD CONSTRAINT assessment_history_pkey PRIMARY KEY (id);


--
-- Name: assessment_reports assessment_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.assessment_reports
    ADD CONSTRAINT assessment_reports_pkey PRIMARY KEY (id);


--
-- Name: candidate_resumes candidate_resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.candidate_resumes
    ADD CONSTRAINT candidate_resumes_pkey PRIMARY KEY (id);


--
-- Name: company_backgrounds company_backgrounds_pkey; Type: CONSTRAINT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.company_backgrounds
    ADD CONSTRAINT company_backgrounds_pkey PRIMARY KEY (id);


--
-- Name: job_positions job_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT job_positions_pkey PRIMARY KEY (id);


--
-- Name: idx_assessment_history_created; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_assessment_history_created ON public.assessment_history USING btree (created_at DESC);


--
-- Name: idx_assessment_history_title; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_assessment_history_title ON public.assessment_history USING btree (job_title);


--
-- Name: idx_assessment_reports_created; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_assessment_reports_created ON public.assessment_reports USING btree (created_at DESC);


--
-- Name: idx_assessment_reports_job; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_assessment_reports_job ON public.assessment_reports USING btree (job_position_id);


--
-- Name: idx_assessment_reports_title; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_assessment_reports_title ON public.assessment_reports USING btree (job_title);


--
-- Name: idx_candidate_resumes_ai_detail; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_candidate_resumes_ai_detail ON public.candidate_resumes USING gin (ai_evaluation_detail);


--
-- Name: idx_candidate_resumes_created; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_candidate_resumes_created ON public.candidate_resumes USING btree (created_at DESC);


--
-- Name: idx_candidate_resumes_name; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_candidate_resumes_name ON public.candidate_resumes USING btree (candidate_name);


--
-- Name: idx_candidate_resumes_recommendation; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_candidate_resumes_recommendation ON public.candidate_resumes USING btree (recommendation_level);


--
-- Name: idx_candidate_resumes_report; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_candidate_resumes_report ON public.candidate_resumes USING btree (assessment_report_id);


--
-- Name: idx_candidate_resumes_score; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_candidate_resumes_score ON public.candidate_resumes USING btree (overall_score DESC);


--
-- Name: idx_company_backgrounds_active; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_company_backgrounds_active ON public.company_backgrounds USING btree (is_active);


--
-- Name: idx_company_backgrounds_created; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_company_backgrounds_created ON public.company_backgrounds USING btree (created_at DESC);


--
-- Name: idx_job_positions_company; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_job_positions_company ON public.job_positions USING btree (company_background_id);


--
-- Name: idx_job_positions_created; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_job_positions_created ON public.job_positions USING btree (created_at DESC);


--
-- Name: idx_job_positions_title; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE INDEX idx_job_positions_title ON public.job_positions USING btree (job_title);


--
-- Name: idx_job_positions_unique; Type: INDEX; Schema: public; Owner: talent_user
--

CREATE UNIQUE INDEX idx_job_positions_unique ON public.job_positions USING btree (job_title, md5(job_description));


--
-- Name: assessment_reports update_assessment_reports_updated_at; Type: TRIGGER; Schema: public; Owner: talent_user
--

CREATE TRIGGER update_assessment_reports_updated_at BEFORE UPDATE ON public.assessment_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: candidate_resumes update_candidate_resumes_updated_at; Type: TRIGGER; Schema: public; Owner: talent_user
--

CREATE TRIGGER update_candidate_resumes_updated_at BEFORE UPDATE ON public.candidate_resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: company_backgrounds update_company_backgrounds_updated_at; Type: TRIGGER; Schema: public; Owner: talent_user
--

CREATE TRIGGER update_company_backgrounds_updated_at BEFORE UPDATE ON public.company_backgrounds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: job_positions update_job_positions_updated_at; Type: TRIGGER; Schema: public; Owner: talent_user
--

CREATE TRIGGER update_job_positions_updated_at BEFORE UPDATE ON public.job_positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assessment_history fk_assessment_history_report; Type: FK CONSTRAINT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.assessment_history
    ADD CONSTRAINT fk_assessment_history_report FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_reports(id) ON DELETE CASCADE;


--
-- Name: candidate_resumes fk_assessment_report; Type: FK CONSTRAINT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.candidate_resumes
    ADD CONSTRAINT fk_assessment_report FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_reports(id) ON DELETE CASCADE;


--
-- Name: job_positions fk_company_background; Type: FK CONSTRAINT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT fk_company_background FOREIGN KEY (company_background_id) REFERENCES public.company_backgrounds(id) ON DELETE SET NULL;


--
-- Name: assessment_reports fk_job_position; Type: FK CONSTRAINT; Schema: public; Owner: talent_user
--

ALTER TABLE ONLY public.assessment_reports
    ADD CONSTRAINT fk_job_position FOREIGN KEY (job_position_id) REFERENCES public.job_positions(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict yaE1dke5l3BznPTlbon6HTTpwJ3nwCavYi2Kb0PR1kqkpTlKrMQ6E7iXeY3OT9X

