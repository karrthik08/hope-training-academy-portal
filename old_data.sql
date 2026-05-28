--
-- PostgreSQL database dump
--

\restrict 8wqwMlWxRI6Y3I3shM4tJA41awF9Q1MJ3VqHBWhaivZIXzuVv2v90xf8z45aeHf

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg12+1)
-- Dumped by pg_dump version 18.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: hope_database_6709_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO hope_database_6709_user;

--
-- Name: attendancestatus; Type: TYPE; Schema: public; Owner: hope_database_6709_user
--

CREATE TYPE public.attendancestatus AS ENUM (
    'present',
    'absent',
    'excused'
);


ALTER TYPE public.attendancestatus OWNER TO hope_database_6709_user;

--
-- Name: progressstatus; Type: TYPE; Schema: public; Owner: hope_database_6709_user
--

CREATE TYPE public.progressstatus AS ENUM (
    'not_started',
    'in_progress',
    'completed'
);


ALTER TYPE public.progressstatus OWNER TO hope_database_6709_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO hope_database_6709_user;

--
-- Name: assessment_attempts; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.assessment_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assessment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    enrollment_id uuid,
    attempt_number integer NOT NULL,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    submitted_at timestamp without time zone,
    score numeric(5,2),
    total_points integer,
    points_earned integer,
    passed boolean,
    time_spent_seconds integer
);


ALTER TABLE public.assessment_attempts OWNER TO hope_database_6709_user;

--
-- Name: assessments; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    training_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    assessment_type character varying(50) NOT NULL,
    time_limit_minutes integer,
    passing_score integer DEFAULT 70,
    max_attempts integer DEFAULT 3,
    randomize_questions boolean DEFAULT false,
    show_correct_answers boolean DEFAULT true,
    is_required boolean DEFAULT false,
    available_from timestamp without time zone,
    available_until timestamp without time zone,
    order_index integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    CONSTRAINT assessments_assessment_type_check CHECK (((assessment_type)::text = ANY ((ARRAY['pre_test'::character varying, 'post_test'::character varying, 'quiz'::character varying, 'knowledge_check'::character varying, 'assignment'::character varying])::text[])))
);


ALTER TABLE public.assessments OWNER TO hope_database_6709_user;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.attendance (
    id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    session_date timestamp with time zone NOT NULL,
    status public.attendancestatus DEFAULT 'absent'::public.attendancestatus NOT NULL,
    marked_by uuid NOT NULL,
    marked_at timestamp with time zone DEFAULT now(),
    notes character varying(500),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.attendance OWNER TO hope_database_6709_user;

--
-- Name: attendances; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.attendances (
    id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    attendance_status character varying(50) NOT NULL,
    marked_by uuid NOT NULL,
    marked_at timestamp with time zone NOT NULL
);


ALTER TABLE public.attendances OWNER TO hope_database_6709_user;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    actor_user_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO hope_database_6709_user;

--
-- Name: completion_criteria; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.completion_criteria (
    id uuid NOT NULL,
    training_id uuid NOT NULL,
    require_all_modules boolean DEFAULT true,
    require_assessment_pass boolean DEFAULT false,
    required_assessment_score character varying(10) DEFAULT '80'::character varying,
    require_attendance boolean DEFAULT false,
    required_attendance_percentage character varying(10) DEFAULT '80'::character varying,
    auto_complete_enabled boolean DEFAULT true,
    additional_criteria json
);


ALTER TABLE public.completion_criteria OWNER TO hope_database_6709_user;

--
-- Name: completions; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.completions (
    id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    completed_by uuid NOT NULL,
    completed_at timestamp with time zone NOT NULL,
    certificate_id character varying(100) NOT NULL,
    certificate_url character varying(500),
    verification_code character varying(100) NOT NULL
);


ALTER TABLE public.completions OWNER TO hope_database_6709_user;

--
-- Name: content_items; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.content_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid,
    content_type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    content_url text,
    file_path text,
    file_size integer,
    duration_minutes integer,
    order_index integer DEFAULT 0 NOT NULL,
    is_required boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.content_items OWNER TO hope_database_6709_user;

--
-- Name: content_progress; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.content_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    enrollment_id uuid NOT NULL,
    content_id uuid,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    content_item_id uuid,
    CONSTRAINT check_content_reference CHECK ((((content_id IS NOT NULL) AND (content_item_id IS NULL)) OR ((content_id IS NULL) AND (content_item_id IS NOT NULL))))
);


ALTER TABLE public.content_progress OWNER TO hope_database_6709_user;

--
-- Name: course_content; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.course_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    training_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    content_type character varying(50) NOT NULL,
    content_value text,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.course_content OWNER TO hope_database_6709_user;

--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.enrollments (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    training_id uuid NOT NULL,
    enrollment_status character varying(50) NOT NULL,
    enrolled_at timestamp with time zone NOT NULL,
    canceled_at timestamp with time zone
);


ALTER TABLE public.enrollments OWNER TO hope_database_6709_user;

--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.lesson_progress (
    id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    status public.progressstatus DEFAULT 'not_started'::public.progressstatus NOT NULL,
    time_spent integer DEFAULT 0,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    last_accessed timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lesson_progress OWNER TO hope_database_6709_user;

--
-- Name: lessons; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid,
    title character varying(255) NOT NULL,
    description text,
    order_index integer DEFAULT 0 NOT NULL,
    is_required boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lessons OWNER TO hope_database_6709_user;

--
-- Name: module_progress; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.module_progress (
    id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    module_id uuid NOT NULL,
    status public.progressstatus DEFAULT 'not_started'::public.progressstatus NOT NULL,
    completion_percentage integer DEFAULT 0,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.module_progress OWNER TO hope_database_6709_user;

--
-- Name: modules; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    training_id uuid,
    title character varying(255) NOT NULL,
    description text,
    order_index integer DEFAULT 0 NOT NULL,
    is_required boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.modules OWNER TO hope_database_6709_user;

--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.notification_preferences (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    email_on_enrollment boolean DEFAULT true,
    email_on_completion boolean DEFAULT true,
    email_on_reminder boolean DEFAULT true,
    inapp_on_enrollment boolean DEFAULT true,
    inapp_on_completion boolean DEFAULT true,
    inapp_on_reminder boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notification_preferences OWNER TO hope_database_6709_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    notification_type character varying(50) NOT NULL,
    is_read boolean DEFAULT false,
    is_sent_email boolean DEFAULT false,
    related_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO hope_database_6709_user;

--
-- Name: onboarding_progress; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.onboarding_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    training_id uuid NOT NULL,
    proof_link character varying(500),
    initials character varying(10),
    submitted_at timestamp with time zone,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.onboarding_progress OWNER TO hope_database_6709_user;

--
-- Name: onboarding_submissions; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.onboarding_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    submitted_at timestamp with time zone,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    status character varying(50) DEFAULT 'pending'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.onboarding_submissions OWNER TO hope_database_6709_user;

--
-- Name: participant_responses; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.participant_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assessment_id uuid NOT NULL,
    question_id uuid NOT NULL,
    user_id uuid NOT NULL,
    enrollment_id uuid,
    response_text text,
    selected_option_id uuid,
    is_correct boolean,
    points_earned integer DEFAULT 0,
    attempt_number integer DEFAULT 1,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    graded_at timestamp without time zone,
    graded_by uuid,
    feedback text
);


ALTER TABLE public.participant_responses OWNER TO hope_database_6709_user;

--
-- Name: question_options; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.question_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false,
    order_index integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.question_options OWNER TO hope_database_6709_user;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assessment_id uuid NOT NULL,
    question_text text NOT NULL,
    question_type character varying(50) NOT NULL,
    points integer DEFAULT 1,
    order_index integer DEFAULT 0,
    correct_answer text,
    explanation text,
    is_required boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT questions_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['multiple_choice'::character varying, 'true_false'::character varying, 'short_answer'::character varying, 'essay'::character varying, 'matching'::character varying])::text[])))
);


ALTER TABLE public.questions OWNER TO hope_database_6709_user;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO hope_database_6709_user;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: hope_database_6709_user
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO hope_database_6709_user;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hope_database_6709_user
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: training_comments; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.training_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    training_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.training_comments OWNER TO hope_database_6709_user;

--
-- Name: trainings; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.trainings (
    id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) NOT NULL,
    created_by uuid NOT NULL,
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    category character varying(100),
    video_url character varying(500),
    flyer_url character varying(500),
    certificate_template character varying(50),
    duration_hours integer,
    is_published boolean DEFAULT true,
    target_audience character varying(255),
    delivery_type character varying(50) DEFAULT 'self-paced'::character varying,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    submitted_at timestamp with time zone,
    approved_at timestamp with time zone,
    approved_by_id uuid,
    prerequisites text,
    learning_objectives text,
    agenda text,
    disclaimer text,
    accessibility_notes text,
    language_options character varying(100),
    ceu_alignment character varying(255),
    instructor_name character varying(255),
    self_enrollment_enabled boolean DEFAULT false,
    dropbox_url character varying(500),
    instructor_manual_url character varying(500),
    knowledge_mgmt_folder_url character varying(500),
    student_handbook_url character varying(500),
    student_workbook_url character varying(500),
    slides_url character varying(500),
    qrc_surveys_url character varying(500),
    instructor_email character varying(255),
    price numeric(10,2) DEFAULT 0.00
);


ALTER TABLE public.trainings OWNER TO hope_database_6709_user;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id integer NOT NULL,
    assigned_at timestamp with time zone NOT NULL
);


ALTER TABLE public.user_roles OWNER TO hope_database_6709_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: hope_database_6709_user
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    status character varying(50) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO hope_database_6709_user;

--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.alembic_version (version_num) FROM stdin;
565aa35fd205
\.


--
-- Data for Name: assessment_attempts; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.assessment_attempts (id, assessment_id, user_id, enrollment_id, attempt_number, started_at, submitted_at, score, total_points, points_earned, passed, time_spent_seconds) FROM stdin;
a6d06dd5-bb11-4c2e-ae6e-1952f25a6482	f09817a9-d7c7-4354-9844-04ee636f237a	ef6dccbe-098f-4500-be6e-27191d5e46bb	728b6197-39db-4df2-9eb4-3e663bbd5da3	1	2026-04-05 02:34:34.076493	2026-04-05 02:34:56.337383	100.00	10	10	t	19
5b8318e3-190b-468b-8615-a274d056a48f	f09817a9-d7c7-4354-9844-04ee636f237a	e7ae440c-aa34-4788-a39d-2150ae058f50	2abd7481-794e-44a3-a994-a35499b0ec59	1	2026-04-08 19:16:16.753707	2026-04-08 19:16:23.864734	100.00	10	10	t	4
68b7f825-c6a0-4b06-b9ff-5e9fcb1389e0	2a713e39-4e89-4b6f-b73f-d9d8908238a1	ef6dccbe-098f-4500-be6e-27191d5e46bb	d432324e-d398-4c43-9d70-7377874a0355	1	2026-04-17 22:56:45.74283	\N	\N	\N	\N	\N	\N
03341987-3fef-4288-8781-da7607201f1b	2a713e39-4e89-4b6f-b73f-d9d8908238a1	ef6dccbe-098f-4500-be6e-27191d5e46bb	d432324e-d398-4c43-9d70-7377874a0355	2	2026-04-17 22:56:47.259965	\N	\N	\N	\N	\N	\N
36b5e5a8-81a3-451f-8c9a-92083a7d3fc3	2a713e39-4e89-4b6f-b73f-d9d8908238a1	ef6dccbe-098f-4500-be6e-27191d5e46bb	d432324e-d398-4c43-9d70-7377874a0355	3	2026-04-17 22:57:11.157691	2026-04-17 22:57:17.35123	0.00	0	0	f	4
\.


--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.assessments (id, training_id, title, description, assessment_type, time_limit_minutes, passing_score, max_attempts, randomize_questions, show_correct_answers, is_required, available_from, available_until, order_index, created_at, updated_at, created_by) FROM stdin;
56ee4627-7649-4f83-92b6-8fa9263bbf41	7e7ee6bf-4493-4562-9620-b6f18ee1978c	Pre-Test	Knowledge Test	quiz	\N	70	3	f	t	f	\N	\N	0	2026-04-05 02:03:30.447971	2026-04-05 02:03:30.44799	9b22830e-166d-42a5-a5fa-4115ec2db547
6a5ccb95-3ee6-497a-88ae-63722f470db1	07866f14-aa57-4e33-aa00-2015cbf8ccf8	Pre test	knowledge test	quiz	\N	70	3	f	t	t	\N	\N	0	2026-04-05 02:04:49.526133	2026-04-05 02:04:49.526143	9b22830e-166d-42a5-a5fa-4115ec2db547
0eeb8df5-9c36-48e8-996b-278c43025dc4	07866f14-aa57-4e33-aa00-2015cbf8ccf8	Pre test	knowledge test	quiz	\N	70	3	f	t	t	\N	\N	0	2026-04-05 02:04:50.661964	2026-04-05 02:04:50.661972	9b22830e-166d-42a5-a5fa-4115ec2db547
7eb92f4a-1850-4e08-9433-37eb2151d470	07866f14-aa57-4e33-aa00-2015cbf8ccf8	jwbch	kbxkqb	quiz	\N	70	3	f	t	f	\N	\N	0	2026-04-05 02:09:38.272691	2026-04-05 02:09:38.272698	9b22830e-166d-42a5-a5fa-4115ec2db547
f09817a9-d7c7-4354-9844-04ee636f237a	60d534cc-d822-4581-88ad-2d9490b7bbc8	Pre test	...!!	pre_test	3	70	3	f	t	f	\N	\N	0	2026-04-05 02:23:19.170921	2026-04-05 02:23:19.170927	9b22830e-166d-42a5-a5fa-4115ec2db547
2a713e39-4e89-4b6f-b73f-d9d8908238a1	c00670f9-b9d8-4fed-bd61-79db591e40d0	quiz	sample	quiz	\N	70	3	f	t	f	\N	\N	0	2026-04-10 02:02:41.300119	2026-04-10 02:02:41.300131	9b22830e-166d-42a5-a5fa-4115ec2db547
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.attendance (id, enrollment_id, session_date, status, marked_by, marked_at, notes, created_at, updated_at) FROM stdin;
5c3b0228-f490-4b35-8e29-9631de78f2de	ae52f95d-0922-44a5-a5f8-33521c6b73c2	2026-03-05 00:00:00+00	present	9b22830e-166d-42a5-a5fa-4115ec2db547	2026-04-07 23:54:07.257791+00	\N	2026-04-07 23:54:07.257791+00	2026-04-07 23:54:07.257791+00
00256cd5-736d-4f47-b2d4-d9bec0781412	ae52f95d-0922-44a5-a5f8-33521c6b73c2	2026-04-07 00:00:00+00	absent	9b22830e-166d-42a5-a5fa-4115ec2db547	2026-04-07 23:54:52.414805+00	\N	2026-04-07 23:52:17.182495+00	2026-04-07 23:54:51.973627+00
23dd8273-dcb8-47ae-bac2-1ca3bc90e750	ae52f95d-0922-44a5-a5f8-33521c6b73c2	2026-04-05 00:00:00+00	absent	9b22830e-166d-42a5-a5fa-4115ec2db547	2026-04-07 23:55:02.80171+00	\N	2026-04-07 23:55:02.80171+00	2026-04-07 23:55:02.80171+00
c4e82293-47aa-49ba-93f7-33a1c7fec773	80f62a9d-6045-4c32-8e3d-45a2be7488e9	2026-04-09 00:00:00+00	absent	9b22830e-166d-42a5-a5fa-4115ec2db547	2026-04-09 14:17:40.706302+00	\N	2026-04-09 14:17:27.409182+00	2026-04-09 14:17:40.359883+00
d360d488-dec0-4a23-b8eb-6059ec974213	a22ce6e7-5257-4749-accb-cc5875e45175	2026-04-12 00:00:00+00	excused	9b22830e-166d-42a5-a5fa-4115ec2db547	2026-04-12 01:49:29.445261+00	\N	2026-04-12 01:49:22.442784+00	2026-04-12 01:49:29.061587+00
\.


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.attendances (id, enrollment_id, attendance_status, marked_by, marked_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.audit_logs (id, actor_user_id, action, entity_type, entity_id, created_at) FROM stdin;
98265927-be71-41f5-90e8-f45f7a47c860	e7ae440c-aa34-4788-a39d-2150ae058f50	enroll	Enrollment	9a2de078-749d-420c-9795-ca0d5b90b917	2026-03-26 03:32:22.547051+00
761aff6e-6d3a-4ad7-87b5-e6bff1279e30	e7ae440c-aa34-4788-a39d-2150ae058f50	enroll	Enrollment	9d2fa62a-d15f-42f2-80ae-8814c7831920	2026-03-26 13:39:35.689169+00
f547b0d3-8c83-4866-9539-aa92fc0d1b26	e7ae440c-aa34-4788-a39d-2150ae058f50	enroll	Enrollment	a4d6f532-8898-45d7-a505-d45d083ffb2f	2026-03-26 18:51:28.373533+00
b2c1a034-2739-4b1f-8f8d-f873ecd2c754	e7ae440c-aa34-4788-a39d-2150ae058f50	enroll	Enrollment	a7b38415-b6b2-4d67-be5c-f2105e65af99	2026-03-26 18:51:53.911341+00
80c5ed69-c216-4fb2-86ab-f4cdb4ae83b7	e7ae440c-aa34-4788-a39d-2150ae058f50	complete	Enrollment	a7b38415-b6b2-4d67-be5c-f2105e65af99	2026-03-26 18:52:01.377631+00
d3c0f025-b827-4218-a95d-eabe57310e10	e7ae440c-aa34-4788-a39d-2150ae058f50	enroll	Enrollment	80f62a9d-6045-4c32-8e3d-45a2be7488e9	2026-03-27 01:20:12.337973+00
4a04a45e-16fb-454f-9af4-994299398a2a	e7ae440c-aa34-4788-a39d-2150ae058f50	complete	Enrollment	80f62a9d-6045-4c32-8e3d-45a2be7488e9	2026-03-27 01:26:32.510265+00
4eaba85d-90e4-475b-bdf9-004620a1f561	e7ae440c-aa34-4788-a39d-2150ae058f50	enroll	Enrollment	1d92c443-a39b-430c-826e-9f668c5a5061	2026-03-28 23:13:32.444052+00
566b22b2-b17a-4b2d-9d38-cdc5cc9538f5	e7ae440c-aa34-4788-a39d-2150ae058f50	enroll	Enrollment	431997a2-3550-471c-94e6-736f2275950e	2026-03-28 23:14:07.826586+00
703e260d-6ebb-4227-b5fc-a04cf44c97af	df1d650c-8825-4368-8d28-38c1a16d6c6c	enroll	Enrollment	a31997d4-a844-4392-bc29-d6d3de49dba3	2026-03-28 23:58:04.023577+00
72544575-a50b-4eae-8a67-c6d23ea0a8f1	e7ae440c-aa34-4788-a39d-2150ae058f50	complete	Enrollment	a4d6f532-8898-45d7-a505-d45d083ffb2f	2026-03-29 00:20:38.660429+00
2ead51be-95d6-41f2-bb8d-43acf829efc6	e7ae440c-aa34-4788-a39d-2150ae058f50	complete	Enrollment	431997a2-3550-471c-94e6-736f2275950e	2026-03-29 00:20:44.857118+00
21b8588e-2a94-418b-8dd0-5be42688ebca	e7ae440c-aa34-4788-a39d-2150ae058f50	enroll	Enrollment	6616357e-a5a0-43dc-b34e-26b75b086e5e	2026-03-29 00:51:41.513176+00
585b13ca-b4c2-4b15-bd00-f350347cad05	e7ae440c-aa34-4788-a39d-2150ae058f50	complete	Enrollment	6616357e-a5a0-43dc-b34e-26b75b086e5e	2026-03-29 00:51:47.445197+00
27731037-f92c-4b5b-8ea5-951308c45c13	e7ae440c-aa34-4788-a39d-2150ae058f50	enroll	Enrollment	1910359d-1113-4f9c-a4b9-bba4c83b408b	2026-03-29 00:57:43.066522+00
a6828c0b-4840-424c-85bb-909915c15475	e7ae440c-aa34-4788-a39d-2150ae058f50	complete	Enrollment	1910359d-1113-4f9c-a4b9-bba4c83b408b	2026-03-29 00:57:47.332392+00
758f7a70-89c4-41a4-a86b-60d7ae08a5b6	e7ae440c-aa34-4788-a39d-2150ae058f50	enroll	Enrollment	1f6f0e6c-c8f7-41e7-a7ce-63e86317abf3	2026-03-31 15:14:13.26602+00
d23ab459-4b40-4998-9289-8ea59b227552	e7ae440c-aa34-4788-a39d-2150ae058f50	complete	Enrollment	1f6f0e6c-c8f7-41e7-a7ce-63e86317abf3	2026-03-31 15:14:30.408617+00
cabbcee4-b3bd-48c8-9d09-ecd27b1f3393	9b22830e-166d-42a5-a5fa-4115ec2db547	create	Training	0e85049e-3f07-4161-ba3a-84444689f6c9	2026-03-31 15:36:40.646542+00
10360d70-0909-4238-8f79-e9696914ea2f	9b22830e-166d-42a5-a5fa-4115ec2db547	create	Training	159a10f4-7d7f-442a-be80-73733454ab40	2026-03-31 15:39:35.808693+00
1973b39b-5353-45d6-bfb3-9098d5c666fd	9b22830e-166d-42a5-a5fa-4115ec2db547	create	Training	f64dc5b0-b82c-4128-a59f-47626d08feeb	2026-04-01 00:18:44.320106+00
9e0d1c73-6e70-4571-91c4-354a6ededa47	9b22830e-166d-42a5-a5fa-4115ec2db547	create	Training	21d49133-3bbe-4256-b769-03a04fb156cf	2026-04-01 01:28:23.656055+00
d5c789d5-080b-4951-ba27-a74b3fbf2ffd	9b22830e-166d-42a5-a5fa-4115ec2db547	create	Training	45d8a16e-eed5-4192-a066-fa7ac595c3f7	2026-04-01 01:30:29.82536+00
d938246e-5ac8-4207-87ac-0f7c4994cd30	9b22830e-166d-42a5-a5fa-4115ec2db547	create	Training	f8b1bc82-f75a-4847-a5b6-99546d91e52c	2026-04-01 21:51:07.751235+00
1cf8b0ab-0107-4d8f-9f67-bbd7af1c190d	9b22830e-166d-42a5-a5fa-4115ec2db547	submit	Training	0e85049e-3f07-4161-ba3a-84444689f6c9	2026-04-01 22:14:41.902706+00
7811663c-112e-4dae-bd04-6083c8fd3877	9b22830e-166d-42a5-a5fa-4115ec2db547	submit	Training	159a10f4-7d7f-442a-be80-73733454ab40	2026-04-01 22:15:11.032932+00
b3e36b5c-9a07-44cf-ad13-6ba362b4ffa2	9b22830e-166d-42a5-a5fa-4115ec2db547	submit	Training	f64dc5b0-b82c-4128-a59f-47626d08feeb	2026-04-01 22:16:13.027263+00
c4a32c11-98ed-42d2-910e-ccf16f9a62cc	2f93b673-76d9-451a-a080-cc5f80165dbd	approve	Training	0e85049e-3f07-4161-ba3a-84444689f6c9	2026-04-02 01:52:10.649022+00
47e1733e-d680-4935-8c4b-7967d13c7401	2f93b673-76d9-451a-a080-cc5f80165dbd	reject	Training	159a10f4-7d7f-442a-be80-73733454ab40	2026-04-02 01:59:48.16097+00
9a857c30-9114-4e27-b048-0d358f202d14	ef6dccbe-098f-4500-be6e-27191d5e46bb	enroll	Enrollment	d432324e-d398-4c43-9d70-7377874a0355	2026-04-03 01:58:56.043451+00
7e0b3b75-f0cb-4223-91b9-952b2cf04008	ef6dccbe-098f-4500-be6e-27191d5e46bb	enroll	Enrollment	4b2e04cf-6cf8-4f32-b5cf-c1cf12be31bd	2026-04-03 02:06:56.746786+00
d9a20509-d58d-4d29-89e7-f83df26a8084	ef6dccbe-098f-4500-be6e-27191d5e46bb	complete_course	Enrollment	4b2e04cf-6cf8-4f32-b5cf-c1cf12be31bd	2026-04-03 22:32:48.003216+00
8df67e77-ea39-4165-a496-4177a726a60a	ef6dccbe-098f-4500-be6e-27191d5e46bb	complete_course	Enrollment	4b2e04cf-6cf8-4f32-b5cf-c1cf12be31bd	2026-04-03 22:32:49.435113+00
22ac907a-b561-4efb-b94f-b261039bf6f2	ef6dccbe-098f-4500-be6e-27191d5e46bb	complete_course	Enrollment	4b2e04cf-6cf8-4f32-b5cf-c1cf12be31bd	2026-04-03 22:33:10.874329+00
d34bd839-320a-45b2-89c5-58298c630ef3	ef6dccbe-098f-4500-be6e-27191d5e46bb	enroll	Enrollment	5528ce0e-72e9-45e3-a186-c827b98c0d19	2026-04-04 17:14:28.060878+00
7032788b-5fbb-4fb6-8472-8a61a6d8faa7	ef6dccbe-098f-4500-be6e-27191d5e46bb	complete_course	Enrollment	5528ce0e-72e9-45e3-a186-c827b98c0d19	2026-04-04 19:40:33.158774+00
4f8507d3-927c-4bd0-ab12-3f152de8c7e4	ef6dccbe-098f-4500-be6e-27191d5e46bb	complete_course	Enrollment	5528ce0e-72e9-45e3-a186-c827b98c0d19	2026-04-04 19:40:34.613021+00
503b37c2-9eee-465d-9c3e-48fbd86ebbde	ef6dccbe-098f-4500-be6e-27191d5e46bb	complete_course	Enrollment	5528ce0e-72e9-45e3-a186-c827b98c0d19	2026-04-04 19:40:39.06657+00
74eb04a1-5cf1-491c-9c8c-335f712c552c	ef6dccbe-098f-4500-be6e-27191d5e46bb	complete_course	Enrollment	5528ce0e-72e9-45e3-a186-c827b98c0d19	2026-04-04 19:40:39.665959+00
9b1b4948-7def-4a0c-b430-f9e809034c18	ef6dccbe-098f-4500-be6e-27191d5e46bb	complete_course	Enrollment	5528ce0e-72e9-45e3-a186-c827b98c0d19	2026-04-04 19:40:40.149438+00
e2e5125c-3c06-4c74-8660-0bfd890a52af	ef6dccbe-098f-4500-be6e-27191d5e46bb	complete_course	Enrollment	5528ce0e-72e9-45e3-a186-c827b98c0d19	2026-04-04 19:40:45.4617+00
3285776a-3821-42dd-bb45-7bf26858669c	ef6dccbe-098f-4500-be6e-27191d5e46bb	complete_course	Enrollment	5528ce0e-72e9-45e3-a186-c827b98c0d19	2026-04-04 19:40:46.235381+00
04de9b76-2a24-44a6-922f-03157a8fd8fc	ef6dccbe-098f-4500-be6e-27191d5e46bb	complete_course	Enrollment	5528ce0e-72e9-45e3-a186-c827b98c0d19	2026-04-04 19:45:46.047443+00
a7f03666-2376-4ce7-aa99-ac4658bee300	9b22830e-166d-42a5-a5fa-4115ec2db547	create	Training	7f6df527-4741-483f-bfb1-4780f704ecfe	2026-04-04 20:00:43.628947+00
8b02bcf0-0932-41e9-b2a5-a1e580cf6f48	9b22830e-166d-42a5-a5fa-4115ec2db547	create	Training	63a1b0d5-4eea-4d01-bc09-63b6aae2dbcf	2026-04-04 20:34:01.994072+00
da21adb3-8459-4069-b1db-18464b73e37d	ef6dccbe-098f-4500-be6e-27191d5e46bb	enroll	Enrollment	728b6197-39db-4df2-9eb4-3e663bbd5da3	2026-04-05 02:27:04.758774+00
ff3f6ae9-dc08-4ec0-bc76-ffccab1ca77b	e7ae440c-aa34-4788-a39d-2150ae058f50	enroll	Enrollment	13e6eab9-452c-4fa3-b8da-286ad991f14a	2026-04-05 03:21:25.084348+00
52f8fe56-8861-4431-a82e-70ad06b5df83	9b22830e-166d-42a5-a5fa-4115ec2db547	enroll	Enrollment	69006a56-0486-4b58-84de-b47183b92fac	2026-04-05 23:29:23.784692+00
2ad0ac02-9436-4b3c-af2e-75065750452d	4e5c6d9e-3605-42ef-92bf-50c612cf1220	enroll	Enrollment	55641828-cf54-4c45-989a-9f154ef6b94f	2026-04-08 16:50:36.51472+00
dde7791a-4c02-457a-a7ed-c784a6932c17	cc11f2a5-9123-4489-aae0-546bff6aced5	enroll	Enrollment	8c02047a-7704-4a34-9049-12bd2803ab0b	2026-04-08 16:50:38.450791+00
724e2193-264c-4f35-81db-e5d756198089	99c5bc72-d494-4068-b2da-d6f4542eedd7	enroll	Enrollment	5c718a30-2535-404a-8cd8-069076e1ccde	2026-04-08 16:50:38.656908+00
dab4cf54-164d-43db-82c7-1fadc81e5fac	ce458ccf-40f8-405b-a6e7-29d6cb9f49f2	enroll	Enrollment	9f5776a1-68bf-4efa-ae28-7784f405be04	2026-04-08 16:50:39.521383+00
c365d2ee-172d-4ee7-8235-77a671f3b820	97c527a7-0ece-4391-85dc-a772e3c0a805	enroll	Enrollment	4c0df0fa-9c06-49f9-b4b2-250db666e431	2026-04-08 16:50:40.642287+00
a7df5e65-c73b-4d76-9a0f-23c56405b768	a04658b3-bb2d-4006-9279-634db63092cf	enroll	Enrollment	9c51472e-eb29-4643-a040-79460f2dc826	2026-04-08 16:50:43.238142+00
65fb2f39-7724-4118-ac4c-8f4e1a802e47	4e5c6d9e-3605-42ef-92bf-50c612cf1220	complete	Enrollment	55641828-cf54-4c45-989a-9f154ef6b94f	2026-04-08 16:50:46.025791+00
ac10fb18-852e-4ae9-ae1d-28ccd0c440b5	d6435aed-141e-4c69-85b6-dce84ff64749	enroll	Enrollment	c542403b-83a0-4607-a47e-a26a15cd13cb	2026-04-08 16:50:46.545085+00
501b183a-e822-4b58-b47c-39ae314fe7ea	6e123cc1-0754-48d8-8981-0966a6b54932	enroll	Enrollment	7984748a-0629-4995-9019-3948ca82bf6b	2026-04-08 16:51:29.60412+00
541924e4-03d4-44bd-9713-ae4f27cfaf5d	ce458ccf-40f8-405b-a6e7-29d6cb9f49f2	complete	Enrollment	9f5776a1-68bf-4efa-ae28-7784f405be04	2026-04-08 16:51:38.903512+00
33c7aa36-f425-4c40-9639-ba63b32c8aa0	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	00796b62-b0fc-4319-b626-426be01d1b6c	2026-04-08 16:52:00.055014+00
c9301472-d14a-4319-af6c-af002487d1c6	3c162039-9cae-4363-87ff-d55364aa7450	complete	Enrollment	00796b62-b0fc-4319-b626-426be01d1b6c	2026-04-08 16:52:12.75425+00
98a10308-5434-4fed-b55f-5e10bef8858e	d6435aed-141e-4c69-85b6-dce84ff64749	complete	Enrollment	c542403b-83a0-4607-a47e-a26a15cd13cb	2026-04-08 16:52:43.508453+00
2979310f-21fc-4aad-b657-99b4b64146a6	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	97e2338a-4738-474d-adc8-c541bb25b98a	2026-04-08 16:53:02.251742+00
51336254-c722-4c2d-a850-50c6d4a7967a	ce458ccf-40f8-405b-a6e7-29d6cb9f49f2	enroll	Enrollment	49be9b08-dfcf-4157-808e-ec41a1c17ecd	2026-04-08 16:53:16.449713+00
28be9444-2822-4738-b9f8-ed139451bd2a	4e5c6d9e-3605-42ef-92bf-50c612cf1220	enroll	Enrollment	e866e89b-dae6-47e8-91e9-54fe65e902ee	2026-04-08 16:53:17.745493+00
f13e866c-c4a2-4a08-b02a-b245bb258ef7	ce458ccf-40f8-405b-a6e7-29d6cb9f49f2	complete	Enrollment	49be9b08-dfcf-4157-808e-ec41a1c17ecd	2026-04-08 16:53:22.948258+00
ffa2e8e3-b6d7-483f-b9fc-755afdc85d79	55a24e05-5430-4482-bf73-7d93fcdae8c9	enroll	Enrollment	3662fc1f-d693-42cd-983c-c415a3686b8a	2026-04-08 16:53:37.344697+00
06e324a6-451c-4a64-98ca-ff76134bf18e	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	4ae00ef9-2d54-49ba-ab94-dafe4b3593db	2026-04-08 16:54:29.643842+00
d753b667-c805-4878-aaca-a0603a8bcad6	97c527a7-0ece-4391-85dc-a772e3c0a805	enroll	Enrollment	4601fc5d-aa5b-4439-ab2c-de8154db7ed1	2026-04-08 16:54:53.777604+00
92a31a70-234f-4088-a178-2164225bbbb4	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	a9080142-8f4a-410f-a982-6b023c110f8e	2026-04-08 16:55:44.482562+00
dc319a1e-ad6d-49b9-8531-9f5e1f0d9ffc	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	a22ce6e7-5257-4749-accb-cc5875e45175	2026-04-08 16:55:59.244259+00
645ddb2b-53d4-44f2-bd70-bd73c753badf	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	5cae544e-7b96-4ba8-ab75-bd95a9e56a2e	2026-04-08 16:56:08.058305+00
e6214dfe-fb08-46b5-87c7-5a907d69f115	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	54b0d427-2173-4f2e-93e6-a6c43e179be0	2026-04-08 16:56:16.055499+00
1c3afa29-f860-4e6b-af83-8e8695d71e3f	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	a6a3d5e6-3c12-45e1-8371-440a2c2f1701	2026-04-08 16:56:21.772766+00
a8dc8f4d-1390-4391-b61e-8c847feef07c	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	0a098ded-75bb-40fb-9d37-6801333824bb	2026-04-08 16:56:28.948751+00
0df0c543-b966-4802-a409-7d8cfae1d2f3	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	2696fe2f-201d-4e78-bba5-0afe38f339d6	2026-04-08 16:56:35.183687+00
ac493682-693d-4c5c-94ef-87045f7caffc	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	51c8f90d-f374-43b0-bbfa-77a75bf7d16e	2026-04-08 16:56:40.322752+00
a4eee1f4-a7d1-430a-8e7a-63c8de302bb6	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	363ff623-c184-4ff1-a80d-53e0a4bcd773	2026-04-08 16:56:49.84291+00
ddb516e3-b967-4b0c-b4d2-3f31f6d3d1ec	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	543b16bc-d868-4851-81af-e5ade0dc7db6	2026-04-08 16:56:55.179593+00
77afd44c-f2bf-4ecd-b551-3c937227dedf	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	79785d65-d4bc-4995-a533-16e7f3eca4c1	2026-04-08 16:56:59.884622+00
89aed239-a7ba-42ce-83c3-3e0385d778c8	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	00796b62-b0fc-4319-b626-426be01d1b6c	2026-04-08 16:53:50.086446+00
cebab5b8-4f3d-4e07-be64-b8c6789cdb7b	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	1cd276d0-2efb-4f3e-b056-e13e71f94885	2026-04-08 16:56:05.782661+00
76756d67-1fe2-447f-b6a6-090e640c44fc	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	e6c0b9ca-183f-484c-b5db-11571fded735	2026-04-08 16:56:10.174878+00
be485412-4b27-48b1-a8d2-e6456ba468f0	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	b2d8f018-8870-4c7b-a8eb-aefbba81f503	2026-04-08 16:56:18.349826+00
3e473468-6b5a-44ed-a233-181c765dafd9	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	58218133-3bc5-410a-b920-ac36ee482b4a	2026-04-08 16:56:27.30576+00
26d9e6af-4048-4776-bf0e-5ba81af00b4e	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	93f4e02b-3c5d-43e5-9b6c-39a3b393374a	2026-04-08 16:56:39.897281+00
8542144e-c83e-4db4-86b7-ea758bc9fdf2	2350ac3c-1c02-42a6-8202-1d9b7073c1a1	complete	Enrollment	351854f9-a5aa-45ec-b7bc-22045a853ab1	2026-04-08 16:56:43.905853+00
5c402a33-aabc-40ea-9ca0-03fc961eef4e	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	efa13c5e-4af6-4034-93e5-aa628c6d7f90	2026-04-08 16:56:48.502527+00
8ae89f21-f8b9-42d6-bc3e-e617023cc93e	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	26d0e6d5-17f7-4329-b879-2a07e026ab3f	2026-04-08 16:56:53.734068+00
51ad61bb-dcf0-4547-96b7-7ceb7c7c12e3	99c5bc72-d494-4068-b2da-d6f4542eedd7	enroll	Enrollment	9e8439b7-63bb-450f-906a-0aa892441032	2026-04-08 16:54:49.43277+00
ea61470a-2d31-4c65-83c7-9c3a31f3632e	55a24e05-5430-4482-bf73-7d93fcdae8c9	enroll	Enrollment	15a1340e-7533-41e7-bb71-e4d044271786	2026-04-08 16:55:23.729351+00
8022908c-d398-4f49-8741-d2364f89688c	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	190e3313-b72b-46ab-b7b4-9f6f41388ed4	2026-04-08 16:55:49.843708+00
ac6c0a07-33b7-4f7a-bee0-db752fe10a1f	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	e1e8932f-9931-4b0b-9c6c-c5e5bf6ac237	2026-04-08 16:56:02.458875+00
73c636f5-81b0-44a8-a0b2-514e4e4cb274	55a24e05-5430-4482-bf73-7d93fcdae8c9	cancel_enrollment	Enrollment	ba5525a7-cf35-4c62-847a-dc214474f6ec	2026-04-08 16:56:07.496469+00
af612422-e1c6-4a39-acfc-ea6239db11fa	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	77e94cce-d8af-4e19-b4d3-5840c882aaea	2026-04-08 16:56:17.524938+00
28d28e1e-be8e-4070-8b4a-60617b76c884	6e123cc1-0754-48d8-8981-0966a6b54932	enroll	Enrollment	4414a73e-8a87-48e6-a55b-ad825af787ac	2026-04-08 16:56:25.119408+00
b1f70004-ca0a-4157-aa74-b584899a9c43	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	533726b9-0678-41c9-bb8a-18282ff4d293	2026-04-08 16:56:29.903769+00
a6944c74-a429-4ac6-a682-37517520eaff	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	1fe74d9d-43e5-4405-9d02-469930eca31b	2026-04-08 16:56:36.121288+00
e958cc4b-cd05-4ec9-b354-e69c06011c51	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	d033e682-2850-4b1b-864b-0496171c66b4	2026-04-08 16:56:43.717757+00
097b01ac-b63a-4af8-b111-a43ae4735fbf	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	30f0eead-6fd4-40ba-9152-7b0e1a67a8d0	2026-04-08 16:56:45.026718+00
bee38710-70b1-46ed-b9a9-b8da4c06dbc2	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	11d74aeb-e817-4cf7-8761-07b91bc91f8c	2026-04-08 16:56:59.004804+00
43a3c1ed-f929-455b-ab25-05d37caf1858	a04658b3-bb2d-4006-9279-634db63092cf	enroll	Enrollment	0abf1b9b-261a-42b1-af77-f869852ca3c0	2026-04-08 16:55:03.381675+00
a8e4f667-4f30-454c-b807-b58e3ddbc6e2	2350ac3c-1c02-42a6-8202-1d9b7073c1a1	enroll	Enrollment	2430f605-b9b7-498d-8221-f51a6416d143	2026-04-08 16:55:06.461053+00
1737bed7-74a1-4b18-a108-09d2124d3415	2350ac3c-1c02-42a6-8202-1d9b7073c1a1	complete	Enrollment	2430f605-b9b7-498d-8221-f51a6416d143	2026-04-08 16:55:12.689064+00
194bcf01-efc4-4a7c-8b29-4dec96af2e15	55a24e05-5430-4482-bf73-7d93fcdae8c9	enroll	Enrollment	ba5525a7-cf35-4c62-847a-dc214474f6ec	2026-04-08 16:55:18.620897+00
4e327ef4-6b83-4a5a-9f4e-857bed8d0450	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	625370ce-cf48-494f-a82d-7b0b2c7905df	2026-04-08 16:55:58.202088+00
a2adf465-52d5-46b3-beff-c50329e61861	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	0ea561a7-6c3d-4c3a-9d6e-c819cd3a6e1a	2026-04-08 16:56:07.434693+00
06b17d6d-67cf-4fd1-aa3c-68db100983c5	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	9d037ad1-9097-4931-96b8-f45a19a99a2b	2026-04-08 16:56:11.192158+00
83c247b4-d904-43d1-b77c-b02aa66aca70	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	82ccc52b-58b1-4f78-ac27-5b439e356727	2026-04-08 16:56:12.309019+00
22451545-e25c-4449-865f-82a6e53158e8	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	327e6ace-b19b-4b49-bc7e-de845c73426d	2026-04-08 16:56:19.695325+00
2f1745ef-bec5-4bdd-9076-18180018467f	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	df8ed2b1-a7c9-42da-9c25-01449756d872	2026-04-08 16:56:21.156137+00
76256a15-c326-4bd0-b70d-14bf2d1f6613	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	db56ce6e-7061-4c47-b209-b912092a9496	2026-04-08 16:56:25.359157+00
326322c8-590f-4072-bc9a-71612ee2b934	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	9c2a3814-b1a9-4996-808f-737aa09538d0	2026-04-08 16:56:26.103721+00
887d959d-d1ec-49f1-be82-996db4f71a05	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	fbea2da7-791e-4270-bd5f-6ee47241bb35	2026-04-08 16:56:30.638842+00
7f944938-d757-4ce1-b955-90bdb2721732	2350ac3c-1c02-42a6-8202-1d9b7073c1a1	enroll	Enrollment	351854f9-a5aa-45ec-b7bc-22045a853ab1	2026-04-08 16:56:31.582944+00
f0f34378-105f-44de-a2c4-26b80c3de9fc	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	8fd7a2af-646a-4cdc-abe4-b6fa660137c1	2026-04-08 16:56:36.878133+00
2010f1e4-6bf5-451c-a67a-7ee97eb0a10f	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	c5378ea9-47e0-41cd-8da0-e9854e587db7	2026-04-08 16:56:38.466499+00
4f4b8b36-b404-4fdc-8d8b-6d925ec81904	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	a3c4dfe7-dbfb-4d65-820b-1820d6cb3e03	2026-04-08 16:56:45.803296+00
1221e9a3-d979-4d45-b2b0-4fcb4923fa98	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	2fd39dfb-6754-4ab1-8190-f67cf5e21492	2026-04-08 16:56:47.405689+00
40878825-e5b5-497e-a924-61966629aff6	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	3407ff72-0d4c-464c-a272-ad6f82307e7f	2026-04-08 16:56:55.489714+00
e148d43f-443c-45cb-b00c-a3a6bca18391	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	8f3e05a9-53c9-421c-9bde-752b34fc8f4d	2026-04-08 16:56:57.63459+00
2d73c6d4-3655-44f7-a20a-3e1a1f052d00	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	f4466ad2-580a-4ef8-9ff9-6b80f2041b2f	2026-04-08 16:57:07.866137+00
cf85b28f-2650-4051-9460-2d0bd5ee8ead	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	e7871608-7023-4148-af23-2e31c00723ac	2026-04-08 16:57:09.350533+00
13c70a68-a5fa-48c1-9ca7-681ef8112d5a	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	d03d4383-7e75-42c5-8d59-73abb29dc458	2026-04-08 16:57:09.7192+00
eadd5d9c-8c1a-47e6-9597-9ed15440b386	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	0277a84a-b091-45ce-87ab-0d8324f17efb	2026-04-08 16:57:16.847755+00
62db38fc-1c1c-4efe-9554-050b290e7ec2	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	dcbcd033-dc65-4fa0-8d46-3a80de54be07	2026-04-08 16:57:21.589187+00
b2a4974b-3df0-418d-abc5-f4425a64b15d	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	587bf552-2d73-4d11-be8d-589de64feb9a	2026-04-08 16:57:22.106864+00
de3747dd-f7f6-41ef-8da0-3db35ffc04cb	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	a5939020-2d8b-45fa-b452-896f3e09ba18	2026-04-08 16:57:23.220368+00
ebba3060-4e4f-49ab-b1f0-962351a1d744	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	b7b8f1c6-49dd-491b-bcf6-5e001bb68540	2026-04-08 16:57:24.954582+00
f6b6c5d3-43df-46ba-b7ad-e98fd8368b41	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	a60cd6e7-27d2-4f7f-b5a6-cda229cd1c39	2026-04-08 16:57:25.826673+00
6d436964-1628-4ad3-ab44-aa4f409457e6	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	e4203ab7-1195-464b-b109-1a3e48e721e2	2026-04-08 16:59:04.411411+00
b9291290-d6ad-4bac-8a7d-0bdedb5858d7	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	d99797ae-c400-4cbb-b612-a6aac29640a0	2026-04-08 16:59:05.779941+00
d8c570f8-5fb5-4223-93b9-0f9674701f38	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	84f72753-3cd9-4f47-9670-15c9e3a84691	2026-04-08 16:59:06.649667+00
fcb6ef7c-6e9b-4a75-8361-e3b083f53f70	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	d0bd0b99-ec17-474d-9bea-16ea7916395b	2026-04-08 16:59:08.307546+00
d02818eb-c8f0-4a22-a43d-6c22e40894f2	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	1e871f1a-f32d-423f-b2c9-4778ba0c7806	2026-04-08 16:59:09.057509+00
ef0ba159-e4c8-4770-bbfe-f29650f87ab8	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	c2f3d7c7-b706-43b4-8247-4bf4cba0f45c	2026-04-08 16:59:10.545006+00
ae3ff1ac-765d-41ae-9658-08d1ee09d227	cc11f2a5-9123-4489-aae0-546bff6aced5	enroll	Enrollment	5b8c77f5-da49-4069-9155-e63236ab04ef	2026-04-08 16:59:13.514282+00
be02bfba-0417-47cf-92f1-042c05f84299	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	3f158783-0726-4446-91f5-a1b1cf191673	2026-04-08 16:59:17.377513+00
a96b04b9-c0ad-4d4e-9c08-7f5c448f5542	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	38ffacc2-509e-458d-b143-fe3415611f88	2026-04-08 16:59:18.199652+00
fc6ad09b-1547-45c3-9bac-9f0592835a9a	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	7ac98fae-56a8-4501-9a67-90d824f02b45	2026-04-08 16:59:20.43726+00
e876d52f-6600-4a72-878c-f15d34df7b3a	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	01999adc-f382-4424-91da-bde4b6c345a0	2026-04-08 16:59:25.609662+00
bf5dc04d-0bda-41e4-869e-cab6b57f9e31	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	cb2e004c-ad37-4273-bc10-84e103046c91	2026-04-08 16:59:26.835055+00
54021cf9-8fbf-4fb8-8670-890d6ce17779	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	0feb0421-9519-426f-b3f5-2b416aa7b495	2026-04-08 16:59:29.385227+00
47eae363-dd75-49b5-94da-5e8158530139	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	a32a6ba4-3fd9-47de-b443-17daac0db896	2026-04-08 16:59:35.295532+00
18b0ad3e-5867-4099-83f2-c32f0a0747b7	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	58804def-ebb4-4dc2-bef6-de05e84d6745	2026-04-08 16:59:36.334857+00
4d128d13-6909-4187-a433-0da41cee85b4	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	a184fca2-554b-436e-9f7a-f01bf828fd2c	2026-04-08 16:59:38.425791+00
ff157c9b-de9e-4e53-91a4-0ca0830029bd	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	68d7bb08-abab-4e15-a2f0-5ff9280397da	2026-04-08 16:59:43.536788+00
9c4ff505-22e2-436c-ab30-29159c7796f7	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	a380141e-8a9c-4bc7-93f8-71d11b0e3b7e	2026-04-08 16:59:44.789668+00
a3990ec4-e9dc-44ce-b257-161066d0d30f	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	4d4d35a9-4f24-4123-a934-8c87976302d6	2026-04-08 16:59:45.729375+00
134e9047-99f7-44b4-a68c-deebfe5f52a4	99c5bc72-d494-4068-b2da-d6f4542eedd7	complete_course	Enrollment	5c718a30-2535-404a-8cd8-069076e1ccde	2026-04-08 17:01:07.602209+00
6aca25d0-46f5-4590-b268-62d4e75cbe93	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	c172cea7-9552-482b-a9f3-2eae6592a1be	2026-04-08 17:03:07.888913+00
3a9ded33-40a4-4980-a543-9116f98c1675	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	7498c556-0494-43e2-8982-99be43b09494	2026-04-08 17:03:08.74797+00
0440f313-c566-4357-a7eb-53772b63c622	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	bd04645c-2991-49a7-8703-7a0534d8ae1a	2026-04-08 17:03:10.549462+00
ce02758f-40d2-4b24-970b-38d4f972c945	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	fbb8afb4-1ae8-462f-9f78-2f8b9909b0cf	2026-04-08 17:03:11.789459+00
03453286-29d0-411c-b5e0-252b64970d62	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	4731bec1-7504-42ca-9372-7006cb4a4031	2026-04-08 17:03:13.133983+00
bc3532eb-19e4-4505-924a-dd40f4ca9235	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	855c1268-33f1-4aef-8e9e-3e828c23c296	2026-04-08 17:03:13.732178+00
f34a1aa5-3e72-4568-a118-bc5a9d908598	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	9ade81e3-fe53-4a5c-a32a-8b2006d6d8ed	2026-04-08 17:03:18.723313+00
79a01d27-00e3-4cbe-8045-1c14866e69c3	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	c7cd09fe-b5c5-4595-a2dd-94b7c7699d09	2026-04-08 17:03:19.299718+00
47ee1a92-6374-4717-9525-cc0887e627a6	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	0e4d383c-2c89-4458-abe8-6263c6136a0b	2026-04-08 17:03:20.898779+00
ea656135-79e9-4ec0-a83d-bf78a8c8497c	3c162039-9cae-4363-87ff-d55364aa7450	enroll	Enrollment	3dac64c3-1e87-4b0e-b75b-8e7ef152e0a8	2026-04-08 17:03:21.863965+00
c00cf550-2e64-426c-855c-bcbb4b170cc6	e7627500-2e1c-4355-b53d-104bbfd69af2	enroll	Enrollment	29068de7-ef36-41b8-aba8-7e75ff3cd1e0	2026-04-08 17:15:26.772787+00
ffdcb53c-ea76-432d-81fa-2be2e2d5dd70	e7627500-2e1c-4355-b53d-104bbfd69af2	complete_course	Enrollment	29068de7-ef36-41b8-aba8-7e75ff3cd1e0	2026-04-08 17:40:40.806235+00
9953edf9-8962-4f05-8cd7-30c0e9977685	e7627500-2e1c-4355-b53d-104bbfd69af2	complete_course	Enrollment	29068de7-ef36-41b8-aba8-7e75ff3cd1e0	2026-04-08 17:40:41.676979+00
e323a52a-d833-47b5-8ed3-834f951ad9b2	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-08 23:40:39.305629+00
22a527ae-9f8d-4671-a44d-349f2e753627	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-08 23:43:40.82455+00
1f671e9c-22d4-4d75-9293-a7ff65a30fdb	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-09 00:40:33.568122+00
3f470380-96e2-412e-90e4-2be4c94450de	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-09 00:42:36.069788+00
fea2c40e-cf45-4dc2-a468-e056ed6a0451	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-09 00:51:02.117343+00
5adb3b48-08f0-44b6-afd4-903f676483fd	e7ae440c-aa34-4788-a39d-2150ae058f50	cancel_enrollment	Enrollment	7d3f5cc5-505e-4439-82cf-48311cc37a3f	2026-04-09 00:52:03.225995+00
b6c90bab-4e63-455e-b3dd-4520f7626b88	ef6dccbe-098f-4500-be6e-27191d5e46bb	cancel_enrollment	Enrollment	8253e6dc-341b-454c-8255-5d89ead74210	2026-04-09 00:52:59.564078+00
cb4a7d4f-c4ca-4d87-a5cd-2b0c8f0fee10	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-09 00:58:23.566783+00
035615e3-ed6f-4d6f-b6dc-edf9b9d05394	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-09 01:55:17.412794+00
b966d3b3-d158-4ed4-a565-d5a9abff447d	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	efba61da-d37e-4523-9d44-05bd2ac38bb9	2026-04-09 01:57:54.629816+00
e5d34801-f7cc-4258-ab68-64ea24c144d9	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	c00670f9-b9d8-4fed-bd61-79db591e40d0	2026-04-09 02:39:50.65105+00
a376c679-5452-440e-9285-0cecabed217c	e7ae440c-aa34-4788-a39d-2150ae058f50	complete	Enrollment	1d92c443-a39b-430c-826e-9f668c5a5061	2026-04-10 23:46:51.474031+00
935ea3a7-d9f4-4206-892f-97b18c48412e	e7ae440c-aa34-4788-a39d-2150ae058f50	complete	Enrollment	7c3baf94-5deb-4555-88d2-e63a3e87be9d	2026-04-10 23:46:56.697625+00
edfd3808-b76d-4a4f-8340-f4a93f59e990	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-11 04:05:27.761691+00
f2c41898-a1cf-4725-be93-849f5dcd8c41	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-11 04:11:41.479527+00
565bec44-8bc9-4ad2-95cb-d69d48e12ef1	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-11 04:17:45.009766+00
62150c66-adfe-453f-bf7e-b496e712d23a	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-11 17:18:34.140091+00
2b5255a7-453a-4b06-8cbc-e327a7e8d18b	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-11 18:09:35.681261+00
d9c8c4eb-9829-4365-8b55-e988e16f6924	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-11 18:19:32.198741+00
1e1d706b-a767-4da6-a94e-5996589a3303	4d88a7c5-29ff-4794-afe1-e92c309c51a8	enroll	Enrollment	e5ee9a9e-04fb-43af-82ed-09a5de76fe86	2026-04-11 18:52:11.329867+00
d1804622-aac4-4d26-acb0-3235640e9356	4d88a7c5-29ff-4794-afe1-e92c309c51a8	complete	Enrollment	e5ee9a9e-04fb-43af-82ed-09a5de76fe86	2026-04-11 18:57:58.583635+00
c1e78faa-0c0e-4db7-85a7-ece0039cafc8	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	efba61da-d37e-4523-9d44-05bd2ac38bb9	2026-04-11 19:08:09.097214+00
0e089bf2-50c1-483e-a929-da9d085b8249	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	03f95ab2-5fd9-4824-8a9a-d164a4fe1818	2026-04-11 19:30:41.582838+00
8f29bccd-6da9-48a2-a840-04416ce5a0a2	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	c00670f9-b9d8-4fed-bd61-79db591e40d0	2026-04-12 01:47:23.291112+00
6f299dc4-9d77-4528-8d98-9af874908268	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	c00670f9-b9d8-4fed-bd61-79db591e40d0	2026-04-12 01:47:36.431889+00
be67779b-3f3e-4684-83b3-b0e718360173	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	b36aa691-3bce-4959-a453-f30bdad9e0e1	2026-04-16 02:18:40.631956+00
d99581e3-618d-44d8-9b96-ac3cac5ea6a6	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	c736d17c-c5f5-4cf2-b798-8246e9133753	2026-04-28 15:50:43.258638+00
6b73913c-3309-46c7-85d1-3e249981e998	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	c736d17c-c5f5-4cf2-b798-8246e9133753	2026-04-28 15:51:26.553289+00
bfbe3335-b0b4-43fb-9e81-e496782f5da0	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 16:01:18.08388+00
bc1a97e4-31b8-40d3-bd0b-8671ccbf42f7	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	efba61da-d37e-4523-9d44-05bd2ac38bb9	2026-04-28 16:08:11.057707+00
1b21af41-9e98-40a7-adbf-fc474313425a	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	efba61da-d37e-4523-9d44-05bd2ac38bb9	2026-04-28 16:08:55.576228+00
b321ad93-83e2-42fc-9736-b848d4930f69	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	efba61da-d37e-4523-9d44-05bd2ac38bb9	2026-04-28 16:13:08.69149+00
ff36aee7-a60c-4222-80a6-d588041e4b42	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	efba61da-d37e-4523-9d44-05bd2ac38bb9	2026-04-28 16:14:57.501174+00
77302951-6e88-47de-bc95-9fed64f7d392	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	efba61da-d37e-4523-9d44-05bd2ac38bb9	2026-04-28 16:20:46.944624+00
221f0b5e-2acc-412b-bc14-2e1738f3bb5d	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 16:27:32.777905+00
5c2be753-02f2-4da5-ab54-016a42a2dacd	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 16:34:20.102096+00
97571a5f-4eff-4a36-b4c8-0a4429cbb3d8	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 16:39:59.524164+00
c5ff2ace-6070-43de-b6d0-5685bd4f1d25	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 16:53:33.630958+00
f36efa24-0a43-4794-af8d-bbed2aeb4745	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 17:00:06.73111+00
a423782c-d898-4c08-b5d2-3c85049756bd	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 17:07:12.048769+00
b2b47fb4-ee76-4c72-9ffa-d2efaca50b73	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 17:11:44.655659+00
1b935154-2e39-49c9-999d-a5f1eb89dd69	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 17:16:04.126043+00
acc5b51e-cfc3-44c4-8f72-585729001351	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 17:19:21.007881+00
0dd98fc6-33d7-4162-b83d-ba865594af94	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 17:20:55.089925+00
79921d18-6397-4f30-9a1c-ff81e60a6087	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 17:22:50.853806+00
2c68e658-47a5-485f-a1be-430a817fbcee	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 17:23:16.999837+00
739b8cdb-4d2e-4378-afc2-3d40016ab03e	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 17:43:52.14895+00
7d741cc5-e542-4ada-9f4e-db6fd431ea7c	537511af-dd0d-45dd-9ea9-fd24d275ce58	cancel_enrollment	Enrollment	94cb64e9-46bc-482a-9d81-b4d5812053fe	2026-04-28 18:14:26.71793+00
d8840b1e-0bfa-4856-a0f0-441f98a308e5	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	efba61da-d37e-4523-9d44-05bd2ac38bb9	2026-04-28 18:17:32.102102+00
04a8cc71-e466-4741-941d-b1aacb539801	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	efba61da-d37e-4523-9d44-05bd2ac38bb9	2026-04-28 18:48:36.000679+00
095c1695-6804-437e-9b23-c34c124474dc	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 18:50:40.703959+00
0b8e3405-d297-42b8-9043-1270dfce5cbc	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	efba61da-d37e-4523-9d44-05bd2ac38bb9	2026-04-28 18:50:59.428221+00
6def4c37-6c3b-4d5d-8779-bb61fc6cfb18	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-28 18:56:38.971272+00
48ecce3e-6f02-46bd-b752-9e75d5104014	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	efba61da-d37e-4523-9d44-05bd2ac38bb9	2026-04-28 18:56:54.828692+00
d8703b53-3c0d-4d8f-bb90-ea017c5d4f25	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	8f39f837-94e2-424f-acdb-d94a8d4c7261	2026-04-28 23:10:48.896109+00
b9ee5e82-e954-4c7d-ab19-66b12af6ecf4	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	0799b005-7ebd-4841-a917-2f2600ab2165	2026-04-28 23:11:33.045294+00
69c7fecf-11ab-4e93-a798-967e4f45b188	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	e612fce5-c64e-40b0-84d9-9872c0bdd361	2026-04-28 23:11:50.549102+00
f5db53de-ad03-4032-9bbd-e928da5527d2	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	3d704095-0eb0-46c3-a82b-cdfbe1a1c511	2026-04-28 23:12:11.967135+00
9c96e197-8d65-46e1-af1c-38afe2658e4e	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	a8ca51fc-e477-4a31-9622-22aa74e52581	2026-04-28 23:12:28.491883+00
a5049911-fb6b-45e5-91d8-44bb5edc160a	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	6da93a14-2048-4f5f-b266-6a32c46fdb9c	2026-04-28 23:13:15.690083+00
be115b75-f467-459d-a8ab-44dd5de9428c	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	e6609e86-6158-46b2-b851-ee8a55f08fa3	2026-04-28 23:13:45.319083+00
c7b2b272-1f47-441f-bb5a-e12c6d4bb18c	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	c9345894-9d91-4123-a5f8-96aeaf74d76e	2026-04-28 23:15:27.298649+00
8749d5ef-5129-427b-84af-ad3ae4496cbb	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-29 01:35:14.463143+00
8ab84451-c1b3-445c-9d87-202a6fcfe15a	9b22830e-166d-42a5-a5fa-4115ec2db547	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-04-29 02:51:02.486278+00
78e66c31-6a8e-47d4-ba47-ac7239a5eb42	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-10 02:34:40.40973+00
439d8ec6-3858-4d32-9e81-1d1295626b07	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-10 04:25:33.024512+00
0c98e91f-3c1f-40de-bdac-486b9536295e	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-10 05:02:49.188635+00
076e3279-6246-4f1e-aed8-d9639d568211	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-10 05:05:51.131264+00
f1f69709-4a0e-4668-8ef3-dcf76ec2f37e	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-10 05:19:51.188767+00
6c6fdbc8-ad1f-49b8-b36d-b36bf910f069	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-10 05:25:30.940915+00
360c8ced-7849-4fb0-823f-f2acc0136dd7	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	3b8bab5c-bebe-47d4-8e66-b09c1cbc8704	2026-05-10 05:28:58.097571+00
ad695e0a-001f-44c5-b752-5fe1761aee4d	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-10 05:40:52.226116+00
bfee4393-6208-4deb-b927-3b12d7dbecd5	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-10 05:46:41.604321+00
4a70a97d-80d1-47dc-9571-a8e258df8338	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-10 20:13:16.386197+00
dc434cab-9221-466d-b6a0-7c878ce5c1dd	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	3b8bab5c-bebe-47d4-8e66-b09c1cbc8704	2026-05-10 20:13:20.190749+00
2c1a8593-8064-4bab-91ba-e6f8c2f04ffa	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	3b8bab5c-bebe-47d4-8e66-b09c1cbc8704	2026-05-10 20:13:27.877437+00
ac896abd-8a15-49ae-a1b2-f8136a1a2c3b	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-10 20:30:59.553064+00
e8e3d07a-933d-4e62-9b2f-26e58d98fd7f	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-11 00:26:33.765911+00
c1e68a8d-d3a9-431c-b25e-a02a75f73b9b	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-11 03:17:02.046371+00
9311bf92-f2b9-42cc-a027-791ff26e517c	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-13 14:27:14.087892+00
00775bf2-6b87-46f1-8c2e-36b9d884032e	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-15 18:39:30.442026+00
63b9ba2e-5c41-401a-9f02-546783067b66	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	64f87c7a-9647-4754-8820-21403991d992	2026-05-26 20:17:36.485214+00
c5beb31d-4ea8-4c5b-bb40-3a43c2c8c138	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	3b8bab5c-bebe-47d4-8e66-b09c1cbc8704	2026-05-27 20:09:34.792455+00
6516f7f2-6765-4034-848e-a8fbc2b2c91f	2f93b673-76d9-451a-a080-cc5f80165dbd	update	Training	3b8bab5c-bebe-47d4-8e66-b09c1cbc8704	2026-05-27 20:09:46.857151+00
\.


--
-- Data for Name: completion_criteria; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.completion_criteria (id, training_id, require_all_modules, require_assessment_pass, required_assessment_score, require_attendance, required_attendance_percentage, auto_complete_enabled, additional_criteria) FROM stdin;
\.


--
-- Data for Name: completions; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.completions (id, enrollment_id, completed_by, completed_at, certificate_id, certificate_url, verification_code) FROM stdin;
795b031c-2465-4baa-9f77-70b0b35be9bd	9a2de078-749d-420c-9795-ca0d5b90b917	7f125d1b-cfdc-407d-bc7c-d0387af65197	2026-03-26 04:47:31.84828+00	CERT-15A60BAF	/certificate/9a2de078-749d-420c-9795-ca0d5b90b917	VERIFY-48AF08
a695a47f-b2b9-4d8c-ae78-08c86ca26aba	9d2fa62a-d15f-42f2-80ae-8814c7831920	7f125d1b-cfdc-407d-bc7c-d0387af65197	2026-03-26 13:44:33.402631+00	CERT-449853EB	/certificate/9d2fa62a-d15f-42f2-80ae-8814c7831920	VERIFY-F01D31
0597f9d6-a502-431b-b0aa-21fa085710dc	80f62a9d-6045-4c32-8e3d-45a2be7488e9	e7ae440c-aa34-4788-a39d-2150ae058f50	2026-03-27 01:26:32.33822+00	HOPE-053C3B8B	\N	4f7dd52a-ca50-4b0b-a761-2aaabe9c6200
0a55a3ac-3011-4180-9f34-372b89787a3d	431997a2-3550-471c-94e6-736f2275950e	e7ae440c-aa34-4788-a39d-2150ae058f50	2026-03-29 00:20:44.726718+00	HOPE-328C818E	\N	72870009-6482-49a2-b2b2-86997f50a089
bdbb4278-9168-435a-931e-dbbc00450207	6616357e-a5a0-43dc-b34e-26b75b086e5e	e7ae440c-aa34-4788-a39d-2150ae058f50	2026-03-29 00:51:47.389983+00	HOPE-22EA75C1	\N	6e52b654-8b8e-4cd8-baa9-8126e6f66f04
b6d48af8-5171-4aaa-8865-e4644c317209	1910359d-1113-4f9c-a4b9-bba4c83b408b	e7ae440c-aa34-4788-a39d-2150ae058f50	2026-03-29 00:57:47.304843+00	HOPE-F0EF9EAA	\N	0462d988-426d-432a-bfbb-0ce32b55dea1
dadba0ff-ff58-4df4-a485-d2bd4c6c00d4	1d92c443-a39b-430c-826e-9f668c5a5061	e7ae440c-aa34-4788-a39d-2150ae058f50	2026-04-10 23:46:51.261353+00	HOPE-006F0B7C	\N	1ce7c9ba-b16c-4ee3-aa8b-1c50d67c3714
4030dfc1-253c-49d3-8db3-d9125ea512b8	7c3baf94-5deb-4555-88d2-e63a3e87be9d	e7ae440c-aa34-4788-a39d-2150ae058f50	2026-04-10 23:46:56.600912+00	HOPE-4C1E15DF	\N	62759fa1-53d5-4cb5-801f-c1717b00d9cc
309aeced-3d71-4b2b-9fac-246def72f6d1	e5ee9a9e-04fb-43af-82ed-09a5de76fe86	4d88a7c5-29ff-4794-afe1-e92c309c51a8	2026-04-11 18:57:58.501652+00	HOPE-F60959FD	\N	b8ee9ad9-0075-4ed5-8bca-f40521dd2a07
\.


--
-- Data for Name: content_items; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.content_items (id, lesson_id, content_type, title, description, content_url, file_path, file_size, duration_minutes, order_index, is_required, created_at, updated_at) FROM stdin;
2a7ce4cf-1785-4079-bdf2-a368f0f97be2	f30cfe24-c0c7-41e2-ada0-436f4fe56611	link	Test	\N	https://hope-frontend-qm4p.onrender.com	\N	\N	\N	0	t	2026-04-04 05:39:57.502654	2026-04-04 05:39:57.502654
53afd100-ad36-4924-a2ce-30e9b66c9643	f30cfe24-c0c7-41e2-ada0-436f4fe56611	video	Video	\N	https://www.youtube.com/watch?v=YleIZgpTF6w&list=RDYleIZgpTF6w&start_radio=1	\N	\N	\N	1	t	2026-04-04 17:16:24.945413	2026-04-04 17:16:24.945413
8d985520-5ff4-4974-a6ac-3490457c39ab	6334f836-8fa5-4e0c-b96a-31c99775cd6c	video	Video	\N	https://www.youtube.com/shorts/XRwI2wSTTB4	\N	\N	\N	0	t	2026-04-08 00:21:54.933563	2026-04-08 00:21:54.933563
\.


--
-- Data for Name: content_progress; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.content_progress (id, enrollment_id, content_id, completed, completed_at, created_at, content_item_id) FROM stdin;
dfdb4360-aac1-4de3-a90d-8c7a75503e5c	5528ce0e-72e9-45e3-a186-c827b98c0d19	\N	f	\N	2026-04-04 19:35:46.104864+00	2a7ce4cf-1785-4079-bdf2-a368f0f97be2
3de106c8-dd69-4e88-9743-15ef9238a22c	5528ce0e-72e9-45e3-a186-c827b98c0d19	\N	f	\N	2026-04-04 19:36:04.40179+00	53afd100-ad36-4924-a2ce-30e9b66c9643
\.


--
-- Data for Name: course_content; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.course_content (id, training_id, title, content_type, content_value, order_index, created_at, updated_at) FROM stdin;
759a344a-ec31-4c9b-86fc-b0900dd40f29	07866f14-aa57-4e33-aa00-2015cbf8ccf8	Welcome Video	video	https://www.youtube.com/watch?v=dQw4w9WgXcQ	0	2026-04-02 02:37:52.997302+00	2026-04-02 02:37:52.997302+00
2f6e2c95-49d1-4b6b-942b-2c4b170914b5	64f87c7a-9647-4754-8820-21403991d992	Sports Test	video	https://www.youtube.com/watch?v=liBGgbLym3s	0	2026-04-03 22:32:04.186181+00	2026-04-03 22:32:04.186181+00
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.enrollments (id, user_id, training_id, enrollment_status, enrolled_at, canceled_at) FROM stdin;
9a2de078-749d-420c-9795-ca0d5b90b917	e7ae440c-aa34-4788-a39d-2150ae058f50	7e7ee6bf-4493-4562-9620-b6f18ee1978c	completed	2026-03-26 03:32:22.368239+00	\N
9d2fa62a-d15f-42f2-80ae-8814c7831920	e7ae440c-aa34-4788-a39d-2150ae058f50	4c2d1689-683f-463e-85e2-7bb9aa254fbe	completed	2026-03-26 13:39:35.686723+00	\N
80f62a9d-6045-4c32-8e3d-45a2be7488e9	e7ae440c-aa34-4788-a39d-2150ae058f50	c00670f9-b9d8-4fed-bd61-79db591e40d0	completed	2026-03-27 01:20:12.170605+00	\N
a31997d4-a844-4392-bc29-d6d3de49dba3	df1d650c-8825-4368-8d28-38c1a16d6c6c	07866f14-aa57-4e33-aa00-2015cbf8ccf8	enrolled	2026-03-28 23:58:03.966062+00	\N
1d92c443-a39b-430c-826e-9f668c5a5061	e7ae440c-aa34-4788-a39d-2150ae058f50	96320f08-b599-4bc5-a8c4-7ce441366f91	completed	2026-03-28 23:13:32.383971+00	\N
431997a2-3550-471c-94e6-736f2275950e	e7ae440c-aa34-4788-a39d-2150ae058f50	6eef48d9-d397-4801-9ee6-3776f8fa3f27	completed	2026-03-28 23:14:07.769732+00	\N
6616357e-a5a0-43dc-b34e-26b75b086e5e	e7ae440c-aa34-4788-a39d-2150ae058f50	006c9ca1-c104-49ca-b927-14f0027f8452	completed	2026-03-29 00:51:41.45766+00	\N
1910359d-1113-4f9c-a4b9-bba4c83b408b	e7ae440c-aa34-4788-a39d-2150ae058f50	07866f14-aa57-4e33-aa00-2015cbf8ccf8	completed	2026-03-29 00:57:43.039208+00	\N
54b0d427-2173-4f2e-93e6-a6c43e179be0	3c162039-9cae-4363-87ff-d55364aa7450	6a77debd-9b26-41c9-a1cf-4d311c5fb93f	enrolled	2026-04-08 16:56:16.027691+00	\N
d432324e-d398-4c43-9d70-7377874a0355	ef6dccbe-098f-4500-be6e-27191d5e46bb	c00670f9-b9d8-4fed-bd61-79db591e40d0	enrolled	2026-04-03 01:58:55.815451+00	\N
5528ce0e-72e9-45e3-a186-c827b98c0d19	ef6dccbe-098f-4500-be6e-27191d5e46bb	07866f14-aa57-4e33-aa00-2015cbf8ccf8	completed	2026-04-04 17:14:27.867994+00	\N
728b6197-39db-4df2-9eb4-3e663bbd5da3	ef6dccbe-098f-4500-be6e-27191d5e46bb	60d534cc-d822-4581-88ad-2d9490b7bbc8	enrolled	2026-04-05 02:27:04.56671+00	\N
c2a26e65-dad0-4131-bc98-6d6f00b7919d	df1d650c-8825-4368-8d28-38c1a16d6c6c	60d534cc-d822-4581-88ad-2d9490b7bbc8	enrolled	2026-04-05 20:54:40.685293+00	\N
69006a56-0486-4b58-84de-b47183b92fac	9b22830e-166d-42a5-a5fa-4115ec2db547	7e7ee6bf-4493-4562-9620-b6f18ee1978c	enrolled	2026-04-05 23:29:23.524474+00	\N
ae52f95d-0922-44a5-a5f8-33521c6b73c2	ef6dccbe-098f-4500-be6e-27191d5e46bb	28099d1c-8ad2-4d09-8ad4-64a425b6c03a	enrolled	2026-04-06 21:57:31.496704+00	\N
62630996-a275-41d8-8427-ec3aceb84b22	9b22830e-166d-42a5-a5fa-4115ec2db547	c249f55d-2deb-4703-b148-450070f00554	enrolled	2026-04-08 00:36:35.380282+00	\N
77e94cce-d8af-4e19-b4d3-5840c882aaea	3c162039-9cae-4363-87ff-d55364aa7450	0d9da486-1f8c-4f7f-a817-29548cb7e99d	enrolled	2026-04-08 16:56:17.494264+00	\N
b2d8f018-8870-4c7b-a8eb-aefbba81f503	3c162039-9cae-4363-87ff-d55364aa7450	a353a172-f5c1-4fbf-af90-8e59fbc87fb3	enrolled	2026-04-08 16:56:18.312395+00	\N
0528f1cb-966e-492f-b47a-062afbca2cf6	9b22830e-166d-42a5-a5fa-4115ec2db547	c3355aed-2d4d-4790-ab8e-65867a99f552	enrolled	2026-04-08 02:25:05.96078+00	\N
d3ae731f-eac4-4d8c-8a06-4e4f4b54cfc7	ef6dccbe-098f-4500-be6e-27191d5e46bb	c249f55d-2deb-4703-b148-450070f00554	completed	2026-04-08 02:26:35.579184+00	\N
327e6ace-b19b-4b49-bc7e-de845c73426d	3c162039-9cae-4363-87ff-d55364aa7450	34f3870e-07b1-45e8-be7e-28ba9ea7a13e	enrolled	2026-04-08 16:56:19.666997+00	\N
4ae00ef9-2d54-49ba-ab94-dafe4b3593db	3c162039-9cae-4363-87ff-d55364aa7450	d73b2f40-b6ae-4ad7-8ee1-05d95ec953b3	enrolled	2026-04-08 16:54:29.616244+00	\N
a9080142-8f4a-410f-a982-6b023c110f8e	3c162039-9cae-4363-87ff-d55364aa7450	17ddaabc-d5bc-4e93-bd9b-6fcc28994629	enrolled	2026-04-08 16:55:44.442599+00	\N
190e3313-b72b-46ab-b7b4-9f6f41388ed4	3c162039-9cae-4363-87ff-d55364aa7450	67182331-4d60-4bf0-b46c-5bc7c789fc11	enrolled	2026-04-08 16:55:49.813257+00	\N
625370ce-cf48-494f-a82d-7b0b2c7905df	3c162039-9cae-4363-87ff-d55364aa7450	28099d1c-8ad2-4d09-8ad4-64a425b6c03a	enrolled	2026-04-08 16:55:58.168946+00	\N
a22ce6e7-5257-4749-accb-cc5875e45175	3c162039-9cae-4363-87ff-d55364aa7450	b36aa691-3bce-4959-a453-f30bdad9e0e1	enrolled	2026-04-08 16:55:59.213394+00	\N
1cd276d0-2efb-4f3e-b056-e13e71f94885	3c162039-9cae-4363-87ff-d55364aa7450	061e48ce-8242-4d7f-96c7-507809ad8c34	enrolled	2026-04-08 16:56:05.756268+00	\N
0ea561a7-6c3d-4c3a-9d6e-c819cd3a6e1a	3c162039-9cae-4363-87ff-d55364aa7450	077e0220-97d9-4da6-ab3d-0eac7e17c039	enrolled	2026-04-08 16:56:07.407165+00	\N
ba5525a7-cf35-4c62-847a-dc214474f6ec	55a24e05-5430-4482-bf73-7d93fcdae8c9	539e9279-9e63-468b-b4a0-53bc4633d55a	canceled	2026-04-08 16:55:18.587554+00	2026-04-08 16:56:07.49593+00
5cae544e-7b96-4ba8-ab75-bd95a9e56a2e	3c162039-9cae-4363-87ff-d55364aa7450	55d58fe6-4c83-42c8-9d75-67bbf275826f	enrolled	2026-04-08 16:56:08.029592+00	\N
e6c0b9ca-183f-484c-b5db-11571fded735	3c162039-9cae-4363-87ff-d55364aa7450	9a59db91-9416-4268-ba5d-185eea17d18a	enrolled	2026-04-08 16:56:10.110515+00	\N
9d037ad1-9097-4931-96b8-f45a19a99a2b	3c162039-9cae-4363-87ff-d55364aa7450	4de4886c-a91c-4402-a75f-f5996b7f6cea	enrolled	2026-04-08 16:56:11.16331+00	\N
82ccc52b-58b1-4f78-ac27-5b439e356727	3c162039-9cae-4363-87ff-d55364aa7450	2544d554-4b0c-4065-890f-ca9150122f68	enrolled	2026-04-08 16:56:12.2813+00	\N
df8ed2b1-a7c9-42da-9c25-01449756d872	3c162039-9cae-4363-87ff-d55364aa7450	147fea7f-b285-48bd-afb1-9cfd7f32fad6	enrolled	2026-04-08 16:56:21.059357+00	\N
a6a3d5e6-3c12-45e1-8371-440a2c2f1701	3c162039-9cae-4363-87ff-d55364aa7450	6fe6ad90-a482-442b-90a5-fc641a9674dd	enrolled	2026-04-08 16:56:21.744804+00	\N
db56ce6e-7061-4c47-b209-b912092a9496	3c162039-9cae-4363-87ff-d55364aa7450	e1a7fb1b-824e-4b27-a7e1-75833e725e1e	enrolled	2026-04-08 16:56:25.316341+00	\N
9c2a3814-b1a9-4996-808f-737aa09538d0	3c162039-9cae-4363-87ff-d55364aa7450	faa04825-f8e4-4da8-8a0e-3b1e9badc594	enrolled	2026-04-08 16:56:26.07002+00	\N
58218133-3bc5-410a-b920-ac36ee482b4a	3c162039-9cae-4363-87ff-d55364aa7450	6d8a5f0e-4dec-429d-94a0-132f5dc6243c	enrolled	2026-04-08 16:56:27.277952+00	\N
0a098ded-75bb-40fb-9d37-6801333824bb	3c162039-9cae-4363-87ff-d55364aa7450	1798350c-9995-4b00-9927-a0eccdb0fdd7	enrolled	2026-04-08 16:56:28.918814+00	\N
533726b9-0678-41c9-bb8a-18282ff4d293	3c162039-9cae-4363-87ff-d55364aa7450	d5a5030f-73e7-4bdf-baac-48c81e6b72e3	enrolled	2026-04-08 16:56:29.849549+00	\N
fbea2da7-791e-4270-bd5f-6ee47241bb35	3c162039-9cae-4363-87ff-d55364aa7450	902b432c-4910-4ef2-8ee5-0ea93f32faa9	enrolled	2026-04-08 16:56:30.589997+00	\N
2696fe2f-201d-4e78-bba5-0afe38f339d6	3c162039-9cae-4363-87ff-d55364aa7450	c7002752-d966-452e-a876-c675fef66503	enrolled	2026-04-08 16:56:35.154665+00	\N
1fe74d9d-43e5-4405-9d02-469930eca31b	3c162039-9cae-4363-87ff-d55364aa7450	679d7bee-d146-4f50-b10a-c0625e03f222	enrolled	2026-04-08 16:56:36.093849+00	\N
8fd7a2af-646a-4cdc-abe4-b6fa660137c1	3c162039-9cae-4363-87ff-d55364aa7450	6e90dd96-5af3-419f-b9a6-90a1cd80fd0b	enrolled	2026-04-08 16:56:36.848711+00	\N
c5378ea9-47e0-41cd-8da0-e9854e587db7	3c162039-9cae-4363-87ff-d55364aa7450	ae98c7a0-d462-42a1-ad2c-145ff6f6a7d2	enrolled	2026-04-08 16:56:38.416437+00	\N
93f4e02b-3c5d-43e5-9b6c-39a3b393374a	3c162039-9cae-4363-87ff-d55364aa7450	9f2e7915-b87f-45ac-bc7e-3dfeaee505e8	enrolled	2026-04-08 16:56:39.867557+00	\N
51c8f90d-f374-43b0-bbfa-77a75bf7d16e	3c162039-9cae-4363-87ff-d55364aa7450	ebf5d2a8-4e90-4677-88e0-0606192d3379	enrolled	2026-04-08 16:56:40.294868+00	\N
d033e682-2850-4b1b-864b-0496171c66b4	3c162039-9cae-4363-87ff-d55364aa7450	6b361137-0f77-4e46-a2db-da2029481691	enrolled	2026-04-08 16:56:43.682261+00	\N
30f0eead-6fd4-40ba-9152-7b0e1a67a8d0	3c162039-9cae-4363-87ff-d55364aa7450	488083cd-5674-4cfe-80c5-afc8a7ece3cf	enrolled	2026-04-08 16:56:44.994733+00	\N
a3c4dfe7-dbfb-4d65-820b-1820d6cb3e03	3c162039-9cae-4363-87ff-d55364aa7450	04427c6c-5300-41be-870d-0795d9dbbd6d	enrolled	2026-04-08 16:56:45.768504+00	\N
2fd39dfb-6754-4ab1-8190-f67cf5e21492	3c162039-9cae-4363-87ff-d55364aa7450	a41d46ce-a51a-46bc-ae25-e7134bc23e5f	enrolled	2026-04-08 16:56:47.3761+00	\N
efa13c5e-4af6-4034-93e5-aa628c6d7f90	3c162039-9cae-4363-87ff-d55364aa7450	7dcf70c9-44a7-494c-aa39-dbdf59fc6bdf	enrolled	2026-04-08 16:56:48.474375+00	\N
363ff623-c184-4ff1-a80d-53e0a4bcd773	3c162039-9cae-4363-87ff-d55364aa7450	7c84b765-6efd-4bba-ae48-d92c25cbfa6d	enrolled	2026-04-08 16:56:49.814954+00	\N
26d0e6d5-17f7-4329-b879-2a07e026ab3f	3c162039-9cae-4363-87ff-d55364aa7450	9af95f92-08b4-4d4c-ab7e-75712fc7a0ea	enrolled	2026-04-08 16:56:53.704279+00	\N
543b16bc-d868-4851-81af-e5ade0dc7db6	3c162039-9cae-4363-87ff-d55364aa7450	e4999097-a547-45e0-9609-573bd75d8572	enrolled	2026-04-08 16:56:55.139888+00	\N
3407ff72-0d4c-464c-a272-ad6f82307e7f	3c162039-9cae-4363-87ff-d55364aa7450	88b3ab9c-7c48-42f8-b2d7-5dec1104e35b	enrolled	2026-04-08 16:56:55.461007+00	\N
8f3e05a9-53c9-421c-9bde-752b34fc8f4d	3c162039-9cae-4363-87ff-d55364aa7450	ad7e4ac5-88fd-4bea-9385-fc5580213d65	enrolled	2026-04-08 16:56:57.603801+00	\N
11d74aeb-e817-4cf7-8761-07b91bc91f8c	3c162039-9cae-4363-87ff-d55364aa7450	d7506a4c-1a22-4392-84c5-0acf8424f64b	enrolled	2026-04-08 16:56:58.968161+00	\N
79785d65-d4bc-4995-a533-16e7f3eca4c1	3c162039-9cae-4363-87ff-d55364aa7450	baf0eda9-a01f-4ecc-a232-0600bd5e7065	enrolled	2026-04-08 16:56:59.850481+00	\N
f4466ad2-580a-4ef8-9ff9-6b80f2041b2f	3c162039-9cae-4363-87ff-d55364aa7450	2dac044d-c39e-4770-b9f4-c3b3617abd58	enrolled	2026-04-08 16:57:07.833881+00	\N
e7871608-7023-4148-af23-2e31c00723ac	3c162039-9cae-4363-87ff-d55364aa7450	0ef875d9-1bda-4432-815b-1f43f0b88d46	enrolled	2026-04-08 16:57:09.253314+00	\N
d03d4383-7e75-42c5-8d59-73abb29dc458	3c162039-9cae-4363-87ff-d55364aa7450	52220bb8-45fc-4792-9372-4bfae3d4bac2	enrolled	2026-04-08 16:57:09.689145+00	\N
0277a84a-b091-45ce-87ab-0d8324f17efb	3c162039-9cae-4363-87ff-d55364aa7450	e632481c-2a12-4372-a865-90d97a171c50	enrolled	2026-04-08 16:57:16.819474+00	\N
dcbcd033-dc65-4fa0-8d46-3a80de54be07	3c162039-9cae-4363-87ff-d55364aa7450	68cd3a13-94a6-4f37-9050-1a0d1dcca3b0	enrolled	2026-04-08 16:57:21.554574+00	\N
587bf552-2d73-4d11-be8d-589de64feb9a	3c162039-9cae-4363-87ff-d55364aa7450	de1cee5a-c814-4625-bf29-57e4e6de2d7d	enrolled	2026-04-08 16:57:22.078129+00	\N
a5939020-2d8b-45fa-b452-896f3e09ba18	3c162039-9cae-4363-87ff-d55364aa7450	e4589b03-880e-4914-b519-a119a0d7a0c5	enrolled	2026-04-08 16:57:23.183654+00	\N
b7b8f1c6-49dd-491b-bcf6-5e001bb68540	3c162039-9cae-4363-87ff-d55364aa7450	a6ce8637-aca8-41cb-85e8-497069ca1642	enrolled	2026-04-08 16:57:24.853754+00	\N
a60cd6e7-27d2-4f7f-b5a6-cda229cd1c39	3c162039-9cae-4363-87ff-d55364aa7450	100db447-8ae5-4429-8c07-5462a69bf82a	enrolled	2026-04-08 16:57:25.796108+00	\N
e4203ab7-1195-464b-b109-1a3e48e721e2	3c162039-9cae-4363-87ff-d55364aa7450	7d1fbc26-9a41-4f52-8339-64ea12ba5cec	enrolled	2026-04-08 16:59:04.382924+00	\N
d99797ae-c400-4cbb-b612-a6aac29640a0	3c162039-9cae-4363-87ff-d55364aa7450	4dca983f-b516-4ba6-82d1-d13af53e1149	enrolled	2026-04-08 16:59:05.649883+00	\N
84f72753-3cd9-4f47-9670-15c9e3a84691	3c162039-9cae-4363-87ff-d55364aa7450	3910fa4c-8cc4-4438-906c-c334d91b3ffd	enrolled	2026-04-08 16:59:06.611988+00	\N
d0bd0b99-ec17-474d-9bea-16ea7916395b	3c162039-9cae-4363-87ff-d55364aa7450	07866f14-aa57-4e33-aa00-2015cbf8ccf8	enrolled	2026-04-08 16:59:08.279065+00	\N
1e871f1a-f32d-423f-b2c9-4778ba0c7806	3c162039-9cae-4363-87ff-d55364aa7450	7e7ee6bf-4493-4562-9620-b6f18ee1978c	enrolled	2026-04-08 16:59:09.026365+00	\N
c2f3d7c7-b706-43b4-8247-4bf4cba0f45c	3c162039-9cae-4363-87ff-d55364aa7450	c3355aed-2d4d-4790-ab8e-65867a99f552	enrolled	2026-04-08 16:59:10.514485+00	\N
3f158783-0726-4446-91f5-a1b1cf191673	3c162039-9cae-4363-87ff-d55364aa7450	3074c7d8-a626-494e-a840-6e03349d6f61	enrolled	2026-04-08 16:59:17.33082+00	\N
38ffacc2-509e-458d-b143-fe3415611f88	3c162039-9cae-4363-87ff-d55364aa7450	dd5e432b-d2a7-4404-a2c2-c0182f46b870	enrolled	2026-04-08 16:59:18.171412+00	\N
7ac98fae-56a8-4501-9a67-90d824f02b45	3c162039-9cae-4363-87ff-d55364aa7450	2f99b6a6-e37d-40c8-8ed2-916c097eff05	enrolled	2026-04-08 16:59:20.390873+00	\N
01999adc-f382-4424-91da-bde4b6c345a0	3c162039-9cae-4363-87ff-d55364aa7450	03667ac4-6eff-4510-aeb3-afcff242ccbc	enrolled	2026-04-08 16:59:25.555611+00	\N
cb2e004c-ad37-4273-bc10-84e103046c91	3c162039-9cae-4363-87ff-d55364aa7450	006c9ca1-c104-49ca-b927-14f0027f8452	enrolled	2026-04-08 16:59:26.805107+00	\N
0feb0421-9519-426f-b3f5-2b416aa7b495	3c162039-9cae-4363-87ff-d55364aa7450	b89a3528-cf90-4016-8d1f-65ab20f0af40	enrolled	2026-04-08 16:59:29.356345+00	\N
a32a6ba4-3fd9-47de-b443-17daac0db896	3c162039-9cae-4363-87ff-d55364aa7450	886459aa-bdf1-4a37-ad2a-c45c504beb3b	enrolled	2026-04-08 16:59:35.267728+00	\N
58804def-ebb4-4dc2-bef6-de05e84d6745	3c162039-9cae-4363-87ff-d55364aa7450	a8ca51fc-e477-4a31-9622-22aa74e52581	enrolled	2026-04-08 16:59:36.306776+00	\N
a184fca2-554b-436e-9f7a-f01bf828fd2c	3c162039-9cae-4363-87ff-d55364aa7450	e6609e86-6158-46b2-b851-ee8a55f08fa3	enrolled	2026-04-08 16:59:38.361998+00	\N
68d7bb08-abab-4e15-a2f0-5ff9280397da	3c162039-9cae-4363-87ff-d55364aa7450	8a507336-72bd-4409-aeb0-d45563884358	enrolled	2026-04-08 16:59:43.508155+00	\N
a380141e-8a9c-4bc7-93f8-71d11b0e3b7e	3c162039-9cae-4363-87ff-d55364aa7450	23542a74-e510-43c5-8843-03a536360308	enrolled	2026-04-08 16:59:44.756176+00	\N
4d4d35a9-4f24-4123-a934-8c87976302d6	3c162039-9cae-4363-87ff-d55364aa7450	28781274-daef-4a97-9bec-9a0136e472f6	enrolled	2026-04-08 16:59:45.698909+00	\N
c172cea7-9552-482b-a9f3-2eae6592a1be	3c162039-9cae-4363-87ff-d55364aa7450	3a8569a8-19f5-457d-8dfc-1802761eef32	enrolled	2026-04-08 17:03:07.85909+00	\N
7498c556-0494-43e2-8982-99be43b09494	3c162039-9cae-4363-87ff-d55364aa7450	ef949f7e-012d-4446-9edd-3a15b656bb7e	enrolled	2026-04-08 17:03:08.69941+00	\N
bd04645c-2991-49a7-8703-7a0534d8ae1a	3c162039-9cae-4363-87ff-d55364aa7450	849f7d4b-6117-43ac-8bd7-aff3da11ab1c	enrolled	2026-04-08 17:03:10.519121+00	\N
fbb8afb4-1ae8-462f-9f78-2f8b9909b0cf	3c162039-9cae-4363-87ff-d55364aa7450	cf3c3f49-770b-49ef-81df-34e6767e445f	enrolled	2026-04-08 17:03:11.761026+00	\N
4731bec1-7504-42ca-9372-7006cb4a4031	3c162039-9cae-4363-87ff-d55364aa7450	1321396c-ef66-4eba-be1c-975c1571aea0	enrolled	2026-04-08 17:03:13.107784+00	\N
855c1268-33f1-4aef-8e9e-3e828c23c296	3c162039-9cae-4363-87ff-d55364aa7450	43d612d6-c848-4217-bff0-4c842e69291a	enrolled	2026-04-08 17:03:13.702918+00	\N
9ade81e3-fe53-4a5c-a32a-8b2006d6d8ed	3c162039-9cae-4363-87ff-d55364aa7450	3dcb44ce-93e9-4c0d-816e-7d8660417ff7	enrolled	2026-04-08 17:03:18.672716+00	\N
c7cd09fe-b5c5-4595-a2dd-94b7c7699d09	3c162039-9cae-4363-87ff-d55364aa7450	31b8325e-6627-4e8b-969d-ab321defdb8b	enrolled	2026-04-08 17:03:19.272239+00	\N
0e4d383c-2c89-4458-abe8-6263c6136a0b	3c162039-9cae-4363-87ff-d55364aa7450	65cde926-e790-4484-9914-b3ea85a4540f	enrolled	2026-04-08 17:03:20.86899+00	\N
3dac64c3-1e87-4b0e-b75b-8e7ef152e0a8	3c162039-9cae-4363-87ff-d55364aa7450	c820b4e9-7916-47c5-af1a-dc7b423ff2e6	enrolled	2026-04-08 17:03:21.835843+00	\N
63a7e336-6d16-4edb-a403-00e6026e5242	e7ae440c-aa34-4788-a39d-2150ae058f50	efba61da-d37e-4523-9d44-05bd2ac38bb9	enrolled	2026-04-28 18:49:38.864064+00	\N
f41548b1-ee18-4487-a03d-232893d1e1bc	ef6dccbe-098f-4500-be6e-27191d5e46bb	061e48ce-8242-4d7f-96c7-507809ad8c34	enrolled	2026-04-08 18:50:36.007499+00	\N
0868a123-a551-4cba-b099-4e9afce74464	e7ae440c-aa34-4788-a39d-2150ae058f50	17ddaabc-d5bc-4e93-bd9b-6fcc28994629	completed	2026-04-08 18:55:41.3769+00	\N
7bc04e84-267d-4ef5-813c-43761226413d	86cd3cb7-b88f-47f5-b173-dbc548373991	efba61da-d37e-4523-9d44-05bd2ac38bb9	enrolled	2026-04-28 18:51:32.219649+00	\N
7c3baf94-5deb-4555-88d2-e63a3e87be9d	e7ae440c-aa34-4788-a39d-2150ae058f50	b36aa691-3bce-4959-a453-f30bdad9e0e1	completed	2026-04-09 15:09:50.232198+00	\N
2abd7481-794e-44a3-a994-a35499b0ec59	e7ae440c-aa34-4788-a39d-2150ae058f50	60d534cc-d822-4581-88ad-2d9490b7bbc8	completed	2026-04-08 19:15:32.249358+00	\N
e5ee9a9e-04fb-43af-82ed-09a5de76fe86	4d88a7c5-29ff-4794-afe1-e92c309c51a8	c00670f9-b9d8-4fed-bd61-79db591e40d0	completed	2026-04-11 18:52:11.257231+00	\N
d4d94140-5169-48bb-8dcf-c32d5c24aa7c	e7ae440c-aa34-4788-a39d-2150ae058f50	03f95ab2-5fd9-4824-8a9a-d164a4fe1818	enrolled	2026-04-11 19:32:15.857033+00	\N
66f45d3b-ca3d-4fe1-a12e-8bf1b956b6e9	e7ae440c-aa34-4788-a39d-2150ae058f50	28099d1c-8ad2-4d09-8ad4-64a425b6c03a	enrolled	2026-04-12 01:26:12.24866+00	\N
9fb3f126-ea3e-4a61-88bc-cc8a1ddd035b	ef6dccbe-098f-4500-be6e-27191d5e46bb	b36aa691-3bce-4959-a453-f30bdad9e0e1	enrolled	2026-04-16 02:17:11.286964+00	\N
23942cd7-1505-495c-9d3a-8f93737777de	5591125c-9124-403d-850e-bd6de2df0c68	efba61da-d37e-4523-9d44-05bd2ac38bb9	enrolled	2026-04-28 18:54:16.68076+00	\N
6a45382f-9c09-4e15-8766-639f717daa09	537511af-dd0d-45dd-9ea9-fd24d275ce58	efba61da-d37e-4523-9d44-05bd2ac38bb9	enrolled	2026-04-28 18:17:46.872509+00	\N
57734bd0-272d-4245-b6a6-9d73bb200eb2	86cd3cb7-b88f-47f5-b173-dbc548373991	64f87c7a-9647-4754-8820-21403991d992	enrolled	2026-04-29 02:29:31.899069+00	\N
67c6939c-0da1-4d75-a325-adb76e383627	537511af-dd0d-45dd-9ea9-fd24d275ce58	64f87c7a-9647-4754-8820-21403991d992	enrolled	2026-04-29 02:35:25.868037+00	\N
34cc6748-bf72-45b7-9f4a-4307f1f31aff	e7ae440c-aa34-4788-a39d-2150ae058f50	64f87c7a-9647-4754-8820-21403991d992	enrolled	2026-05-27 19:46:30.139085+00	\N
b1ffe2af-0213-4e30-bb4a-2bc9b11485fe	6c6a66ef-e561-49fe-b5b6-81512bae53bb	28099d1c-8ad2-4d09-8ad4-64a425b6c03a	enrolled	2026-05-27 19:59:21.488876+00	\N
\.


--
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.lesson_progress (id, enrollment_id, lesson_id, status, time_spent, started_at, completed_at, last_accessed, created_at, updated_at) FROM stdin;
8fd9fa36-f212-49a2-98e1-caf1f0583762	62630996-a275-41d8-8427-ec3aceb84b22	6334f836-8fa5-4e0c-b96a-31c99775cd6c	completed	0	2026-04-08 00:36:56.860271+00	2026-04-08 00:36:56.860776+00	2026-04-08 00:36:56.860288+00	2026-04-08 00:36:56.069802+00	2026-04-08 00:36:56.069802+00
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.lessons (id, module_id, title, description, order_index, is_required, created_at, updated_at) FROM stdin;
f30cfe24-c0c7-41e2-ada0-436f4fe56611	d7e50821-c962-46d9-8e16-f76c32b72064	Sub Test		0	t	2026-04-04 05:39:18.301449	2026-04-04 05:39:18.301449
ed182006-d635-4a95-a4b3-cd689dac6c0d	f8a3ca20-c76e-4058-b774-62395e63a615	01. Test		0	t	2026-04-07 15:49:30.446076	2026-04-07 15:49:30.446076
4d40dfb7-c187-4418-a4ad-bdc55b107595	9c2b3dbe-fc79-4ee1-b3a9-0bdcbeb79884	Test 2 		0	t	2026-04-07 16:08:16.639869	2026-04-07 16:08:16.639869
6334f836-8fa5-4e0c-b96a-31c99775cd6c	0a683a84-a5e0-4b20-b9bd-2beef2fb0fba	01 . sample		0	t	2026-04-07 17:00:59.691112	2026-04-07 17:00:59.691112
22db12f7-7733-4851-bee4-2425827ec36d	28dcad9b-c941-4829-bddf-b0621b62b52c	02.sample		0	t	2026-04-07 17:01:10.843637	2026-04-07 17:01:10.843637
5bc562c1-bf83-4bd0-b647-c589babea981	f9a003d4-f58f-4d84-9fa3-6943589da3d5	01.		0	t	2026-04-09 16:21:00.60879	2026-04-09 16:21:00.60879
\.


--
-- Data for Name: module_progress; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.module_progress (id, enrollment_id, module_id, status, completion_percentage, started_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.modules (id, training_id, title, description, order_index, is_required, created_at, updated_at) FROM stdin;
d7e50821-c962-46d9-8e16-f76c32b72064	07866f14-aa57-4e33-aa00-2015cbf8ccf8	test1		0	t	2026-04-04 05:38:12.03517	2026-04-04 05:38:12.03517
f8a3ca20-c76e-4058-b774-62395e63a615	21d49133-3bbe-4256-b769-03a04fb156cf	sample		0	t	2026-04-07 15:48:34.471294	2026-04-07 15:48:34.471294
9c2b3dbe-fc79-4ee1-b3a9-0bdcbeb79884	21d49133-3bbe-4256-b769-03a04fb156cf	Sample test 2 		1	t	2026-04-07 16:08:02.719902	2026-04-07 16:08:02.719902
0a683a84-a5e0-4b20-b9bd-2beef2fb0fba	c249f55d-2deb-4703-b148-450070f00554	Test1 sample		0	t	2026-04-07 17:00:39.632462	2026-04-07 17:00:39.632462
28dcad9b-c941-4829-bddf-b0621b62b52c	c249f55d-2deb-4703-b148-450070f00554	test 2 		1	t	2026-04-07 17:00:48.933795	2026-04-07 17:00:48.933795
f9a003d4-f58f-4d84-9fa3-6943589da3d5	c00670f9-b9d8-4fed-bd61-79db591e40d0	01.sample test		0	t	2026-04-09 16:20:40.821027	2026-04-09 16:20:40.821027
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.notification_preferences (id, user_id, email_on_enrollment, email_on_completion, email_on_reminder, inapp_on_enrollment, inapp_on_completion, inapp_on_reminder, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.notifications (id, user_id, title, message, notification_type, is_read, is_sent_email, related_id, created_at, read_at) FROM stdin;
e0cd897b-fff3-4af8-a6be-dfac98c3ae2d	ef6dccbe-098f-4500-be6e-27191d5e46bb	Training Completed! 🎉	Congratulations! You've completed 'Admin Office Procedures'. Your certificate is ready!	completion	t	f	d3ae731f-eac4-4d8c-8a06-4e4f4b54cfc7	2026-04-08 02:28:41.414906+00	2026-04-08 02:42:00.181374+00
1f31c024-f74f-4880-8625-0b99d7aafae8	e7ae440c-aa34-4788-a39d-2150ae058f50	Training Completed! 🎉	Congratulations! You've completed 'Anger Management'. Your certificate is ready!	completion	t	f	0868a123-a551-4cba-b099-4e9afce74464	2026-04-08 18:56:14.837813+00	2026-04-08 18:56:56.134621+00
0a394145-af6c-43a8-a025-3b01b3668f2b	e7ae440c-aa34-4788-a39d-2150ae058f50	Training Completed! 🎉	Congratulations! You've completed 'Access Essentials'. Your certificate is ready!	completion	t	f	2abd7481-794e-44a3-a994-a35499b0ec59	2026-04-11 01:08:50.957319+00	2026-04-11 01:09:09.204964+00
1d22c06c-df75-49da-b6c8-9077ceb579eb	ef6dccbe-098f-4500-be6e-27191d5e46bb	Training Completed! 🎉	Congratulations! You've completed 'SPORTS Prevention Plus Wellness'. Your certificate is ready!	completion	t	f	dbfb9f9d-a806-49e8-83c6-52aa744f8782	2026-04-12 01:34:29.49256+00	2026-04-12 01:34:57.244452+00
d88f5985-b394-4985-999d-62bf50d4e943	e7ae440c-aa34-4788-a39d-2150ae058f50	Training Completed! 🎉	Congratulations! You've completed 'SPORTS Prevention Plus Wellness'. Your certificate is ready!	completion	t	f	4155547f-2004-4759-98a9-1da7a108897f	2026-04-22 13:57:13.420204+00	2026-04-22 14:58:54.276361+00
48891c48-6d91-4281-8282-fafaa5fe1c4a	6c6a66ef-e561-49fe-b5b6-81512bae53bb	Training Completed! 🎉	Congratulations! You've completed 'SPORTS Prevention Plus Wellness'. Your certificate is ready!	completion	t	f	73865dfb-44b0-4d85-876c-ef944ad8394c	2026-04-26 20:25:30.273303+00	2026-04-26 20:25:53.741106+00
\.


--
-- Data for Name: onboarding_progress; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.onboarding_progress (id, user_id, training_id, proof_link, initials, submitted_at, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: onboarding_submissions; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.onboarding_submissions (id, user_id, submitted_at, reviewed_at, reviewed_by, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: participant_responses; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.participant_responses (id, assessment_id, question_id, user_id, enrollment_id, response_text, selected_option_id, is_correct, points_earned, attempt_number, submitted_at, graded_at, graded_by, feedback) FROM stdin;
e64383e6-a9a2-4e87-8934-3694b4fb4f1b	f09817a9-d7c7-4354-9844-04ee636f237a	d6a8f504-a0a4-4909-aae5-b17fade782d5	ef6dccbe-098f-4500-be6e-27191d5e46bb	728b6197-39db-4df2-9eb4-3e663bbd5da3		def0ae97-4185-4ba9-80df-ac757f8f4ba7	t	10	1	2026-04-05 02:34:56.553448	\N	\N	\N
b6ebdecd-88a3-421f-8e2a-077a3dc69973	f09817a9-d7c7-4354-9844-04ee636f237a	d6a8f504-a0a4-4909-aae5-b17fade782d5	e7ae440c-aa34-4788-a39d-2150ae058f50	2abd7481-794e-44a3-a994-a35499b0ec59		def0ae97-4185-4ba9-80df-ac757f8f4ba7	t	10	1	2026-04-08 19:16:23.947643	\N	\N	\N
\.


--
-- Data for Name: question_options; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.question_options (id, question_id, option_text, is_correct, order_index, created_at) FROM stdin;
9a6f821c-c417-4778-98ea-2a90be4bb324	d6a8f504-a0a4-4909-aae5-b17fade782d5	3	f	0	2026-04-05 02:25:52.31464
29044c79-6063-44e2-9ff4-07c193632a63	d6a8f504-a0a4-4909-aae5-b17fade782d5	3.86	f	0	2026-04-05 02:25:52.31467
def0ae97-4185-4ba9-80df-ac757f8f4ba7	d6a8f504-a0a4-4909-aae5-b17fade782d5	4	t	0	2026-04-05 02:25:52.314681
fbd8a947-6479-4ce2-8773-a78437b38e56	d6a8f504-a0a4-4909-aae5-b17fade782d5	5	f	0	2026-04-05 02:25:52.314691
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.questions (id, assessment_id, question_text, question_type, points, order_index, correct_answer, explanation, is_required, created_at, updated_at) FROM stdin;
d6a8f504-a0a4-4909-aae5-b17fade782d5	f09817a9-d7c7-4354-9844-04ee636f237a	What is 2 + 2	multiple_choice	10	0		2 + 2 equals 4	t	2026-04-05 02:25:52.11024	2026-04-05 02:25:52.110251
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.roles (id, name) FROM stdin;
1	Admin
2	Instructor
3	Participant
\.


--
-- Data for Name: training_comments; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.training_comments (id, training_id, user_id, comment_text, created_at, updated_at) FROM stdin;
768202e8-1d68-4346-ba65-18cbfcbad518	64f87c7a-9647-4754-8820-21403991d992	e7ae440c-aa34-4788-a39d-2150ae058f50	Sample Test@Comment	2026-04-11 20:47:19.010066+00	2026-04-11 20:47:19.010077+00
022b7618-002b-4564-8222-ddd69d4c590c	64f87c7a-9647-4754-8820-21403991d992	ead3b963-d3de-447f-9f9a-6587398252bd	Hey Guys!!	2026-04-16 02:40:02.354845+00	2026-04-16 02:40:02.354851+00
75f7ee6b-82d3-4a43-9356-5b4692e35008	efba61da-d37e-4523-9d44-05bd2ac38bb9	e7ae440c-aa34-4788-a39d-2150ae058f50	Hey gus how is it going..	2026-04-22 14:59:36.212985+00	2026-04-22 14:59:36.212994+00
\.


--
-- Data for Name: trainings; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.trainings (id, title, description, status, created_by, start_at, end_at, created_at, updated_at, category, video_url, flyer_url, certificate_template, duration_hours, is_published, target_audience, delivery_type, start_date, end_date, submitted_at, approved_at, approved_by_id, prerequisites, learning_objectives, agenda, disclaimer, accessibility_notes, language_options, ceu_alignment, instructor_name, self_enrollment_enabled, dropbox_url, instructor_manual_url, knowledge_mgmt_folder_url, student_handbook_url, student_workbook_url, slides_url, qrc_surveys_url, instructor_email, price) FROM stdin;
b36aa691-3bce-4959-a453-f30bdad9e0e1	Adult Learning Mental Skills	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Explore methods for enhancing cognitive learning, memory retention, and problem-solving abilities in adult education. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:20.231841+00	2026-04-16 02:18:40.689519+00	Peer Recovery & Coaching			CORPORATE	3	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t								\N	0.00
28099d1c-8ad2-4d09-8ad4-64a425b6c03a	Business Acumen	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build a deeper understanding of business fundamentals, strategy, and decision-making for organizational success. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:21.236111+00	2026-03-26 02:50:21.236121+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	0.00
60d534cc-d822-4581-88ad-2d9490b7bbc8	Access Essentials	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn the fundamentals of Microsoft Access, including database creation, data management, and reporting for efficient information handling. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:19.964695+00	2026-03-26 02:50:19.964702+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	0.00
c249f55d-2deb-4703-b148-450070f00554	Admin Office Procedures	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Master the core administrative functions and procedures required to keep an office organized, efficient, and professional. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:20.053483+00	2026-03-26 02:50:20.053491+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	0.00
b6ae0e41-437f-45b1-8f61-90e700863249	Admin Support	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build essential administrative and organizational skills to effectively support teams, executives, and office operations. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:20.144579+00	2026-03-26 02:50:20.144589+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	0.00
17ddaabc-d5bc-4e93-bd9b-6fcc28994629	Anger Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Gain tools to recognize, control, and channel anger constructively for better communication and relationships. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:20.419661+00	2026-03-26 02:50:20.419668+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	0.00
67182331-4d60-4bf0-b46c-5bc7c789fc11	Appreciative Inquiry	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn a strengths-based approach to organizational development that focuses on positive change and innovation. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:20.504058+00	2026-03-26 02:50:20.504067+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	0.00
c00670f9-b9d8-4fed-bd61-79db591e40d0	Peer Supervisor Refresher Training	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Updates supervisors' knowledge of evolving peer support best practices and ethical guidelines, focusing on role clarification, supervision models, boundary management, and self-care for supervisors in the peer support field. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:19.780633+00	2026-04-12 01:47:36.492865+00	Peer Recovery & Coaching		https://www.dropbox.com/scl/fi/1tizcai46v4f1i4y5expa/Peer-Support-Specialist-Brochure.pdf?rlkey=lkom843l9yk6xtvaslofthfjk&e=1&st=dajv6m74&dl=0	CORPORATE	3	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t								\N	0.00
55d58fe6-4c83-42c8-9d75-67bbf275826f	Assertiveness and Self Confidence	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build personal confidence and assertive communication skills to improve workplace interactions and decision-making. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:20.687491+00	2026-03-26 02:50:20.687498+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
077e0220-97d9-4da6-ab3d-0eac7e17c039	Attention Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn how to focus your attention strategically to improve productivity and reduce workplace distractions. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:20.778505+00	2026-03-26 02:50:20.778512+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
9a59db91-9416-4268-ba5d-185eea17d18a	Being a Likeable Boss	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop leadership traits that inspire respect, trust, and cooperation from your team. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:20.958668+00	2026-03-26 02:50:20.958675+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
4de4886c-a91c-4402-a75f-f5996b7f6cea	Body Language Basics	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to read and use nonverbal communication to enhance workplace interactions and presentations. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:21.04914+00	2026-03-26 02:50:21.049146+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2544d554-4b0c-4065-890f-ca9150122f68	Budget and Financial Reports	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand budgeting principles and how to analyze and present financial data effectively. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:21.14523+00	2026-03-26 02:50:21.145239+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
5ed11c30-79ff-4f83-a912-f024e6800d77	Creativity	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Unlock creative thinking skills to generate fresh ideas and innovative solutions. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.818736+00	2026-03-26 02:50:32.818743+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3fdd403d-645e-4306-be99-4b5b581a0ebc	Business Ethics	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn the principles of ethical decision-making and how to promote integrity in business practices. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:21.324477+00	2026-03-26 02:50:21.324483+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
8ec823d4-f957-4f58-acad-dad4950d104b	Business Etiquette	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Master professional etiquette in business communication, meetings, and cross-cultural interactions. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:21.417919+00	2026-03-26 02:50:21.417931+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
afdc7505-bb72-4136-b531-9b2827584572	Business Succession Planning	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Explore strategies to ensure business continuity through effective leadership and talent transitions. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:21.501953+00	2026-03-26 02:50:21.501962+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
0ac680e6-7fe2-4862-b8ce-dbe1e10f7827	Business Writing	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop clear, concise, and professional writing skills for reports, emails, and proposals. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:21.592844+00	2026-03-26 02:50:21.592853+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
f33fe601-e27a-45c2-b1dd-29904066e6a3	Call Center Training	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn customer service best practices for managing calls, resolving issues, and building client loyalty. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:21.683084+00	2026-03-26 02:50:21.68309+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
df111dd3-1023-4d6b-b68d-0ec98f7001de	Civility in the Workplace	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Promote respect, professionalism, and positive communication across all levels of your organization. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:21.77211+00	2026-03-26 02:50:21.77212+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
7d6afece-6f2b-4381-9ba8-232a4bfcf936	Collaborative Business Writing	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Improve team-based writing processes for consistency, clarity, and efficiency in documents. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:22.045985+00	2026-03-26 02:50:22.045995+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
ed031f08-5dea-465d-82d8-092233a56144	Communication Strategies	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn how to communicate clearly and effectively across diverse audiences and workplace situations. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:22.141794+00	2026-03-26 02:50:22.141803+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
90ba641a-ddfb-4d56-9a69-6c5c2e85bb1c	Conducting Annual Employee reviews	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Master the process of delivering productive performance reviews that drive employee growth. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:22.229799+00	2026-03-26 02:50:22.229809+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
fb25e4a2-6a3e-4014-981a-99890fbb22f3	Conflict Resolution	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Gain practical methods to manage and resolve conflicts constructively in the workplace. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:22.318735+00	2026-03-26 02:50:22.318743+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
276abfb3-1a6c-4a41-a896-8395bb41b999	Contact Center Training	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Enhance communication, empathy, and service efficiency in a multi-channel customer support environment. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:22.409+00	2026-03-26 02:50:22.409006+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
a353a172-f5c1-4fbf-af90-8e59fbc87fb3	Contract Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn the key principles of drafting, negotiating, and managing business contracts. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:22.49982+00	2026-03-26 02:50:22.499826+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
0d9da486-1f8c-4f7f-a817-29548cb7e99d	Creating a Great Webinar	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop engaging, effective webinars through strong content design, delivery, and audience engagement. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:22.590502+00	2026-03-26 02:50:22.590509+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6a77debd-9b26-41c9-a1cf-4d311c5fb93f	Creative Problem Solving	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Cultivate creativity and innovation in addressing business challenges and generating solutions. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:22.674841+00	2026-03-26 02:50:22.674849+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
34f3870e-07b1-45e8-be7e-28ba9ea7a13e	Crisis Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Prepare for and effectively respond to unexpected crises to minimize organizational impact. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:22.764004+00	2026-03-26 02:50:22.76401+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
147fea7f-b285-48bd-afb1-9cfd7f32fad6	Critical Thinking	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Strengthen analytical skills to assess information, solve problems, and make sound decisions. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:22.853201+00	2026-03-26 02:50:22.853211+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6fe6ad90-a482-442b-90a5-fc641a9674dd	Customer Service	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Deliver exceptional customer experiences through empathy, communication, and problem-solving skills. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:22.944678+00	2026-03-26 02:50:22.944688+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
67c48d9f-a614-4248-bc6e-2c6c07aa746e	Customer Support	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn techniques for providing timely, effective, and customer-focused technical or service assistance. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:23.034245+00	2026-03-26 02:50:23.034251+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
1cd1c62f-798f-41a5-b0f6-5a3880793718	Cyber Security	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand the principles of protecting organizational data, systems, and networks from cyber threats. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:23.124477+00	2026-03-26 02:50:23.124482+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2b26ee59-99a4-4412-b369-3c838abef8db	Delivering Constructive Criticism	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to provide feedback that promotes improvement and maintains positive working relationships. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:23.213361+00	2026-03-26 02:50:23.213368+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
efc90615-ce6d-4eae-a02e-a781f0f89ab2	Developing a Launch and Learn	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Plan and execute effective informal learning sessions to promote continuous employee development. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:23.295471+00	2026-03-26 02:50:23.295481+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
73eccade-222e-4ecc-93a6-276f54031f35	Developing Corporate Behavior	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Align personal conduct with corporate values to strengthen company culture and professionalism. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:23.385412+00	2026-03-26 02:50:23.38542+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
ead27bcd-192c-4812-a9f7-08a972eb1121	Developing Creativity	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Enhance innovative thinking and problem-solving within individual and team contexts. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:23.474901+00	2026-03-26 02:50:23.474908+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
509d1b76-d4c8-4a89-9c32-75560cced0f8	Developing New Managers	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Prepare emerging leaders with essential management, communication, and leadership skills. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:23.566774+00	2026-03-26 02:50:23.566783+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d827878a-5553-48d9-be66-513d6ea9ee6b	Digital Citzenship	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand responsible and ethical behavior when using technology and engaging in digital spaces. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:23.657269+00	2026-03-26 02:50:23.657278+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e3339f21-f54e-4425-82f9-06f0b47ac1f5	Diversity and Inclusion	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn strategies to create a respectful, equitable, and inclusive workplace environment. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:23.745971+00	2026-03-26 02:50:23.745979+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e7a42170-95fc-4151-a993-162d8a34217c	Emotional Intelligence	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build awareness of emotions and interpersonal dynamics to improve leadership and collaboration. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:23.835127+00	2026-03-26 02:50:23.83513+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
57657680-8421-4252-98eb-17908781e2f4	Employee motivation	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Explore motivational techniques to inspire engagement and high performance in your workforce. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:23.917685+00	2026-03-26 02:50:23.917691+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e368b9b2-97c7-42c6-acce-5ecb9d42b36e	Employee Onboarding	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Create structured onboarding programs that foster engagement and long-term employee success. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.007434+00	2026-03-26 02:50:24.00744+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6d8a5f0e-4dec-429d-94a0-132f5dc6243c	Employee Recognition	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn how to design recognition programs that boost morale and reinforce organizational values. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.098152+00	2026-03-26 02:50:24.098158+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
faa04825-f8e4-4da8-8a0e-3b1e9badc594	Empoyee Recruitment	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Master recruitment strategies for attracting, selecting, and retaining top talent. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.188815+00	2026-03-26 02:50:24.18882+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e1a7fb1b-824e-4b27-a7e1-75833e725e1e	Employee Termination Process	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to manage employee separations legally, ethically, and respectfully. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.280336+00	2026-03-26 02:50:24.280342+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
1798350c-9995-4b00-9927-a0eccdb0fdd7	Entrepreneurship	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand how to plan, launch, and manage successful entrepreneurial ventures. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.370857+00	2026-03-26 02:50:24.370863+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d5a5030f-73e7-4bdf-baac-48c81e6b72e3	Event Planning	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Gain skills to organize professional events from concept to execution. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.462758+00	2026-03-26 02:50:24.462767+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
902b432c-4910-4ef2-8ee5-0ea93f32faa9	Excel essentials	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn the key functions, formulas, and tools to manage data efficiently in Microsoft Excel. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.551337+00	2026-03-26 02:50:24.551346+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3d4037f3-9d8c-447b-bbc4-1ae0c32bbc57	Excel Expert	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Advance your Excel skills with complex formulas, automation, and data analysis techniques. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.641086+00	2026-03-26 02:50:24.641091+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
9f48f8cc-7d30-4ef6-b7c1-4807be8de304	Executive and Personal Assistants	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Strengthen your ability to manage schedules, communication, and high-level administrative tasks. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.730725+00	2026-03-26 02:50:24.730731+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
8000b208-b4fd-4775-8d08-25a2fad36fdb	Facilitation Skills	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn how to lead productive meetings and training sessions that engage participants and achieve results. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.820386+00	2026-03-26 02:50:24.820391+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
cbce9514-51d8-464d-8390-a235e465b348	Generation Gaps	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand generational differences and how to bridge them in a multigenerational workplace. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.909777+00	2026-03-26 02:50:24.909783+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
4c99ea5e-4db4-43a0-b2a7-b7e384a0df1c	Goal Setting and Getting things Done	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn proven methods to set clear goals and maintain focus to achieve success. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:24.991266+00	2026-03-26 02:50:24.99127+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2170db1c-51bd-4e22-af2b-a9072463e075	Handling a Difficult Client	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop techniques to manage challenging clients while maintaining professionalism and results. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:25.079931+00	2026-03-26 02:50:25.079935+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6e90dd96-5af3-419f-b9a6-90a1cd80fd0b	High Performance  Teams Inside the Company	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build collaborative, results-oriented teams within your organization. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:25.261074+00	2026-03-26 02:50:25.261081+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
679d7bee-d146-4f50-b10a-c0625e03f222	High Performance  Teams Remote Workforce	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to manage and engage high-performing remote and hybrid teams effectively. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:25.346374+00	2026-03-26 02:50:25.346377+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
c7002752-d966-452e-a876-c675fef66503	Hiring Strategies	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop structured hiring processes to find and retain the best candidates. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:25.436848+00	2026-03-26 02:50:25.436858+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
ae98c7a0-d462-42a1-ad2c-145ff6f6a7d2	Human Resource Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand core HR functions including recruitment, performance, and employee relations. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:25.527538+00	2026-03-26 02:50:25.527548+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
9f2e7915-b87f-45ac-bc7e-3dfeaee505e8	Improving Mindfulness	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn mindfulness practices to enhance focus, reduce stress, and improve work-life balance. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:25.616239+00	2026-03-26 02:50:25.616247+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
ebf5d2a8-4e90-4677-88e0-0606192d3379	Improving self Awareness	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Increase understanding of your strengths, values, and behavior for personal and professional growth. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:25.708201+00	2026-03-26 02:50:25.708208+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
4c440548-05cc-4b7d-8691-1ec266392efc	In Person Sales	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Master face-to-face sales techniques that build relationships and close deals effectively. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:25.799972+00	2026-03-26 02:50:25.799976+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
828901f9-8222-42a8-9f22-5d7cca20bc53	Increasing  Your Happiness	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn habits and strategies to foster positivity and satisfaction in your work and life. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:25.882385+00	2026-03-26 02:50:25.882394+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
abfc87f9-ea30-441a-a9b3-c0fbdcc48765	Internet Marketing Fundamentals	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Gain insight into online marketing channels, SEO, and digital strategies for business growth. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:25.971725+00	2026-03-26 02:50:25.971732+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
8998a3d8-5c7e-4e08-873e-88d1239440ea	Intropersonal Skills	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Strengthen communication, empathy, and collaboration for more effective workplace relationships. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:26.061518+00	2026-03-26 02:50:26.061528+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
22548e45-203f-4574-8e14-1d7af9018629	Job Search Skills	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn effective strategies for resumes, networking, and interviewing to secure your ideal job. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:26.14628+00	2026-03-26 02:50:26.146289+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
fa788b20-639c-4fe6-9de2-eba0f31f6357	Knowledge Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop systems for capturing, sharing, and leveraging organizational knowledge. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:26.235393+00	2026-03-26 02:50:26.235397+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
04427c6c-5300-41be-870d-0795d9dbbd6d	Leadership and Influence	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build leadership presence and the ability to positively influence others toward shared goals. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:26.327506+00	2026-03-26 02:50:26.327509+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
488083cd-5674-4cfe-80c5-afc8a7ece3cf	Lean Process and Six Sigma	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn process improvement techniques to increase efficiency and reduce waste. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:26.416263+00	2026-03-26 02:50:26.41627+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6b361137-0f77-4e46-a2db-da2029481691	Manager Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Equip managers with tools to lead teams, manage performance, and drive organizational success. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:26.597699+00	2026-03-26 02:50:26.597702+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
a41d46ce-a51a-46bc-ae25-e7134bc23e5f	Managing Personal Finances	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Gain practical knowledge to budget, save, and plan for financial stability. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:26.687713+00	2026-03-26 02:50:26.687719+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
7dcf70c9-44a7-494c-aa39-dbdf59fc6bdf	Managing Workplace Anxiety	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn coping strategies to manage stress and maintain mental wellness at work. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:26.776824+00	2026-03-26 02:50:26.776827+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
7c84b765-6efd-4bba-ae48-d92c25cbfa6d	Managing Workplace Harassment	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand how to identify, prevent, and respond to workplace harassment. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:26.867181+00	2026-03-26 02:50:26.867184+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6bc680e1-3ebe-46b4-8da1-c3c2f6c383ec	Marketing Basic	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Explore core marketing principles and strategies to effectively promote products or services. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:26.958295+00	2026-03-26 02:50:26.958303+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
10821228-d09c-4411-9b76-2fdec0d2861c	Measureing Results from Training	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to evaluate training programs and demonstrate their business impact. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:27.048971+00	2026-03-26 02:50:27.048977+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d75575e2-e35e-4038-a573-4ed59da27ad2	Media and Public Relations	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop PR strategies to manage your organization’s public image and communication. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:27.14159+00	2026-03-26 02:50:27.141594+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
88b3ab9c-7c48-42f8-b2d7-5dec1104e35b	Meeting Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Master the skills to plan, lead, and follow up on productive business meetings. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:27.232215+00	2026-03-26 02:50:27.232222+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e4999097-a547-45e0-9609-573bd75d8572	Middle Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Strengthen leadership, communication, and decision-making skills for mid-level managers. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:27.316649+00	2026-03-26 02:50:27.316656+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
9af95f92-08b4-4d4c-ab7e-75712fc7a0ea	Millenial Onboarding	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Design onboarding programs that align with millennial values and engagement styles. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:27.407465+00	2026-03-26 02:50:27.407475+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
baf0eda9-a01f-4ecc-a232-0600bd5e7065	mLearning Essentials	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand the design and delivery of mobile learning experiences for modern workplaces. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:27.497474+00	2026-03-26 02:50:27.49748+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
ad7e4ac5-88fd-4bea-9385-fc5580213d65	Motivating your Sales Team	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to inspire, reward, and guide sales teams to exceed performance goals. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:27.587576+00	2026-03-26 02:50:27.587581+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d7506a4c-1a22-4392-84c5-0acf8424f64b	Multi level Marketing	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Explore the structure, ethics, and success strategies of network marketing models. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:27.680545+00	2026-03-26 02:50:27.680568+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2baeb17e-6b52-40fd-9fc5-d8784419450f	Negotiation Skills	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop techniques to reach win-win outcomes in business negotiations. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:27.877597+00	2026-03-26 02:50:27.877611+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
7d727c66-915f-455a-bb2a-e023519a9b4b	Networking outside the company	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn how to build and leverage external professional relationships for career growth. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:27.994823+00	2026-03-26 02:50:27.994832+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
802449a8-877f-43b2-b0e7-3b48ffc0c28c	Networking within the company	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Strengthen internal connections to enhance collaboration and opportunities. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:28.129445+00	2026-03-26 02:50:28.129471+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
5ed672ad-2943-44e6-9731-96c59db5c585	Office Health and Safety	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand workplace safety standards and how to maintain a healthy work environment. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:28.221155+00	2026-03-26 02:50:28.221167+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
feda505e-9f80-47c4-88c0-e667dd614adb	Office Politics for Managers	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to navigate office dynamics ethically and effectively to maintain team harmony. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:28.304478+00	2026-03-26 02:50:28.304484+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
c01a14c2-333e-4841-a2f6-8eeac7a3a7e9	Organizational Skills	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Improve planning, prioritization, and time management to maximize efficiency. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:28.396482+00	2026-03-26 02:50:28.396488+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
9a8148f0-f238-4634-9c8d-7291e2cbca3e	Outlook Essentials	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to manage emails, calendars, and tasks effectively using Microsoft Outlook. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:28.481286+00	2026-03-26 02:50:28.481292+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
8b9c9941-2ea6-4af7-8400-a4be509dbf6a	Overcoming Sales Objections	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Master techniques to handle and convert objections into successful sales outcomes. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:28.571787+00	2026-03-26 02:50:28.571791+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2eaad2f3-1a5a-4f89-a7c0-7fe5807a7d18	Performance Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to set expectations, monitor progress, and guide employees toward success. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:28.662093+00	2026-03-26 02:50:28.662097+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
21d49133-3bbe-4256-b769-03a04fb156cf	Draft Course Test	This is a draft	draft	9b22830e-166d-42a5-a5fa-4115ec2db547	\N	\N	2026-04-01 01:28:23.408698+00	2026-04-01 01:28:23.408709+00	CORPORATE	\N	\N	\N	8	t	Managers	live	2026-05-01 09:00:00+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
cc77bf0b-08a9-43eb-915f-94ecf0613b32	Personal Branding	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build a strong professional identity that supports career advancement and credibility. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:28.750639+00	2026-03-26 02:50:28.750648+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d4bfe004-e1f7-4d11-a591-33076578b292	PowerPoint Essentials	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop professional presentation design and delivery skills using Microsoft PowerPoint. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:28.840082+00	2026-03-26 02:50:28.840085+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
ec79f7ca-7ad5-41b5-a8e0-032b629d7edc	Presentation Skills	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn how to plan, design, and deliver engaging, confident presentations. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:28.933515+00	2026-03-26 02:50:28.933523+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
a512d59f-a6e7-4d0d-8651-7cb9712549b9	Project Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand project planning, execution, and control using recognized management frameworks. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:29.025474+00	2026-03-26 02:50:29.02548+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
9423140f-bed1-460b-8f55-ee4616489a2a	Proposal Writing	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to craft clear, persuasive proposals that win support and funding. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:29.115282+00	2026-03-26 02:50:29.115292+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
ac6758d3-14a9-447e-8936-a187494e788e	Prospecting and Lead Generation	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop methods to identify, attract, and convert potential clients. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:29.208385+00	2026-03-26 02:50:29.208389+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
ee913de5-3ba5-4b7b-bbdf-daa802abf8f7	Public Speaking	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build confidence and skill in delivering impactful speeches and presentations. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:29.297941+00	2026-03-26 02:50:29.297948+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
f6aca034-5279-4268-8a75-d08352e9341b	Safety in the Workplace	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand key safety protocols and compliance measures for a secure work environment. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:29.391386+00	2026-03-26 02:50:29.391393+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
79e453cc-c7cb-47df-bc02-ac203b8b93df	Sales Fundamentals	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn core sales techniques to build customer relationships and close deals. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:29.48011+00	2026-03-26 02:50:29.480114+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
bf3e7906-be8d-4312-be05-3d792564b490	Self Leaderships	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Strengthen self-management and accountability to enhance personal and professional performance. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:29.568873+00	2026-03-26 02:50:29.568881+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e33285d8-48d6-4f55-ab11-af87973b32cc	Servant Leadership	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to lead through service, empathy, and empowerment to build strong teams. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:29.65861+00	2026-03-26 02:50:29.658619+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e4496337-5fcd-4a66-93bc-fb224d2f6913	Social Intellegience	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop awareness of social dynamics to improve communication and influence. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:29.749009+00	2026-03-26 02:50:29.749019+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
65cde926-e790-4484-9914-b3ea85a4540f	Social Learning	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Explore how collaboration and shared knowledge enhance learning and performance. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:29.837936+00	2026-03-26 02:50:29.837942+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
31b8325e-6627-4e8b-969d-ab321defdb8b	Social Media in the Workplace	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand how to use social platforms responsibly and productively at work. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:29.931745+00	2026-03-26 02:50:29.931752+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
45d8a16e-eed5-4192-a066-fa7ac595c3f7	Live Course Test	This is live	draft	9b22830e-166d-42a5-a5fa-4115ec2db547	\N	\N	2026-04-01 01:30:29.733762+00	2026-04-01 01:30:29.733779+00	OOH	\N	\N	\N	\N	t	\N	live	2026-06-01 14:00:00+00	2026-06-01 16:00:00+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3dcb44ce-93e9-4c0d-816e-7d8660417ff7	Social Media Marketing	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to create and manage social media campaigns that drive engagement and results. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:30.022083+00	2026-03-26 02:50:30.02209+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
c820b4e9-7916-47c5-af1a-dc7b423ff2e6	Stress Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Gain strategies to manage stress and maintain well-being under pressure. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:30.115821+00	2026-03-26 02:50:30.115828+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
100d4513-8368-459d-aea7-9c5149db0638	Supervising Others	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build essential supervision skills to lead teams effectively and maintain performance. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:30.208034+00	2026-03-26 02:50:30.20804+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
10d4b313-0085-4e49-be33-2c7b4424ac2a	Supply Chain Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand logistics, procurement, and operations for efficient supply chain flow. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:30.298282+00	2026-03-26 02:50:30.29829+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
01bef0f7-fefe-464c-838b-090ca15bbb1f	Taking Initiative	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn how to act proactively and take ownership to drive results. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:30.385934+00	2026-03-26 02:50:30.385941+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
04ef3212-dd9f-49b4-8a4f-ca23f9795fd5	Talent Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop strategies to attract, develop, and retain top talent across your organization. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:30.47664+00	2026-03-26 02:50:30.476647+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
fb70546b-90a7-4e61-a96d-7a2a7213dbb5	Team Building Through Chemistry	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to build cohesive teams by leveraging personality strengths and collaboration. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:30.566185+00	2026-03-26 02:50:30.566192+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6fd3984d-3fe4-4a47-a251-384cd64047e2	Team Building for Managers	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Equip managers with tools to foster trust, motivation, and team unity. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:30.657233+00	2026-03-26 02:50:30.657241+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
fd5d869a-1ca2-4184-9566-1e87e6d7853a	Teamwork and Team Building	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Strengthen collaboration and trust to achieve team success. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:30.745413+00	2026-03-26 02:50:30.745416+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
8fe5796e-3b40-40fc-9c6a-8420fcea2111	Telephone Etiquette	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Master professional phone communication skills to represent your organization effectively. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:30.83562+00	2026-03-26 02:50:30.835626+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
5a598133-b3ba-444a-8aaa-23822c631026	Telework and Telecommuting	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn best practices for managing and thriving in remote work environments. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:30.927004+00	2026-03-26 02:50:30.927011+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
97accd7f-494d-4784-b114-fa5eed3e60ba	Ten Soft skills you need	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop key interpersonal skills essential for career success and professional growth. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:31.01592+00	2026-03-26 02:50:31.015924+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
c04390aa-6cf4-40c4-9754-79e614f65e8a	The cloud and Business	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand how cloud technology transforms business operations and scalability. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:31.106157+00	2026-03-26 02:50:31.106161+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d6a7736b-565c-450d-993f-2b119165182b	Time Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn strategies to prioritize tasks, meet deadlines, and boost productivity. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:31.196198+00	2026-03-26 02:50:31.196201+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
f8b1bc82-f75a-4847-a5b6-99546d91e52c	UI Test Course	Testing the new form	draft	9b22830e-166d-42a5-a5fa-4115ec2db547	\N	\N	2026-04-01 21:51:07.543777+00	2026-04-01 21:51:07.543784+00	Life & Resilience Skills Training			\N	2	t	All Staff	live	2026-04-15 22:50:00+00	2026-04-16 22:50:00+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
c263293b-67eb-409a-9203-10dd7612c6b6	Top 10 sales secrets	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Discover proven sales techniques that drive revenue and customer loyalty. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:31.287802+00	2026-03-26 02:50:31.287807+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
a257dd17-cbc1-480d-b607-bc1d2a947dd2	Trade Show Staff Training	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Train teams to represent your brand and engage prospects effectively at trade shows. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:31.376079+00	2026-03-26 02:50:31.376083+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
b38acd77-27e6-4ef3-9f05-db857445fbbc	Universal Safety Practices	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand general workplace safety principles applicable to any environment. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:31.557072+00	2026-03-26 02:50:31.557081+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6a1cd349-ebf3-44c2-bfff-9f722c2a3639	Virtual team building and Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to lead and engage teams effectively in virtual work settings. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:31.648919+00	2026-03-26 02:50:31.648924+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
7bad9526-ab49-4ece-a71b-0a8463619c58	Women in Leadership	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Empower women to build leadership confidence, influence, and career advancement. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:31.741734+00	2026-03-26 02:50:31.741741+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
849f7d4b-6117-43ac-8bd7-aff3da11ab1c	Word Essentials	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to create, format, and manage professional documents using Microsoft Word. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:31.829987+00	2026-03-26 02:50:31.829995+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
ef949f7e-012d-4446-9edd-3a15b656bb7e	Word Expert	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Master advanced Word features for automation, collaboration, and document design. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:31.920681+00	2026-03-26 02:50:31.920694+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3a8569a8-19f5-457d-8dfc-1802761eef32	Work Life Balance	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn strategies to maintain balance between professional responsibilities and personal well-being. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.008717+00	2026-03-26 02:50:32.008723+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
cf3c3f49-770b-49ef-81df-34e6767e445f	Workplace diversity	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Promote an inclusive and equitable workplace that values diverse perspectives. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.102117+00	2026-03-26 02:50:32.102123+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
1321396c-ef66-4eba-be1c-975c1571aea0	Achieve your Goals	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn proven strategies to clarify your goals, stay focused, and create actionable plans that drive long-term success. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.285137+00	2026-03-26 02:50:32.285143+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
43d612d6-c848-4217-bff0-4c842e69291a	Anger Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build awareness and emotional regulation skills to respond calmly and constructively in challenging situations. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.374542+00	2026-03-26 02:50:32.37455+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
35104aae-b861-41a7-a060-e76223a209e6	Anxiety	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Gain tools to manage anxious thoughts, reduce stress, and build resilience in daily life. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.463871+00	2026-03-26 02:50:32.463878+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
08b52765-a7e4-413c-9c3f-8fe46d9001cb	Attraction	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Explore mindset and behavioral shifts that help you naturally attract positive relationships and opportunities. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.5542+00	2026-03-26 02:50:32.554207+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3f87a74f-8ace-4958-b0b3-bea439d80c37	Depression	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand supportive strategies to navigate low moods, build healthy habits, and foster emotional well-being. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.90683+00	2026-03-26 02:50:32.906837+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
8cb19115-c0d7-4e5e-81e2-2ff7029004c3	Failure	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Reframe failure as a learning opportunity and develop the resilience needed to move forward confidently. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.994992+00	2026-03-26 02:50:32.994999+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
fe5fba3d-5e58-4c01-af85-3a6caf967027	Fears	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Identify limiting fears and learn strategies to overcome them through clarity, confidence, and action. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:33.087718+00	2026-03-26 02:50:33.087722+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3e395853-8457-4239-ab5a-bc99d824da6b	Finding your passion	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Discover your strengths, interests, and purpose to build a fulfilling personal and professional path. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:33.177616+00	2026-03-26 02:50:33.17762+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
28781274-daef-4a97-9bec-9a0136e472f6	Goal setting	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to set clear, actionable goals that align with your long-term vision and values. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:33.266266+00	2026-03-26 02:50:33.266272+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
23542a74-e510-43c5-8843-03a536360308	Happiness	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Explore practical habits and mindsets that cultivate a more positive, fulfilling, and joyful life. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:33.465462+00	2026-03-26 02:50:33.465466+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
8a507336-72bd-4409-aeb0-d45563884358	Healthy self and Healthy Relationships	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Strengthen self-awareness and communication skills to build balanced, supportive relationships. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:33.556005+00	2026-03-26 02:50:33.556009+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
746eee57-e989-408a-9e71-8a67713bf261	Innovation	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn techniques to think creatively, solve complex problems, and drive innovation in personal or professional projects. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:33.645143+00	2026-03-26 02:50:33.645147+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e72a11d3-841a-4bb8-8043-8f08721f1313	Inspirational	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop skills to inspire yourself and others through mindset, motivation, and purposeful action. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:33.735341+00	2026-03-26 02:50:33.73535+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
92b776fd-e9cd-4e5a-ba6d-e1156591330a	Law of attraction	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand how focused intention, mindset, and beliefs help attract desired outcomes. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:33.816097+00	2026-03-26 02:50:33.816103+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6d7a578e-f837-4e60-9a28-e8e5770ebb5a	Leadership	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build leadership presence, decision-making confidence, and the ability to influence others effectively. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:33.906722+00	2026-03-26 02:50:33.906727+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2279b743-7c4d-4735-abf5-8e057e09c90c	Meditation	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn practical meditation techniques to improve focus, calm the mind, and reduce stress. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:33.996559+00	2026-03-26 02:50:33.996564+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e865fbd1-4e83-45ec-b6b6-b627026648fa	Mental Health	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Gain foundational insights into maintaining emotional well-being and building healthy mental habits. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:34.083308+00	2026-03-26 02:50:34.083322+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
23136f18-c490-498a-bce3-edf7ded57d71	Motivation	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop strategies to ignite and sustain intrinsic motivation to achieve meaningful results. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:34.17394+00	2026-03-26 02:50:34.17395+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d5f436fd-25aa-45b0-b950-5cb4a775e8a8	Personal Development	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Strengthen personal growth through self-awareness, skill-building, and continuous improvement. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:34.261931+00	2026-03-26 02:50:34.261937+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
51304aa4-167a-4591-a4dd-3e2f58ccdd6f	Personal Life Improvement	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Identify key areas for growth and implement changes that enhance your quality of life. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:34.348449+00	2026-03-26 02:50:34.348484+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
c56263d9-74ca-43d7-a88d-1063e024eeb3	Personal Mastery	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build discipline, clarity, and self-leadership to excel in both personal and professional pursuits. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:34.43827+00	2026-03-26 02:50:34.438277+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3e7c0217-ddbb-40ab-8986-7470583a3351	Public Speaking	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop confidence, clarity, and presence to deliver compelling presentations to any audience. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:34.529609+00	2026-03-26 02:50:34.529618+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
990eaa46-1f33-47c1-88ff-f1941595e247	Relationships	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn communication and emotional skills that build stronger and more meaningful relationships. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:34.61769+00	2026-03-26 02:50:34.617699+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3b5532b6-5f8d-4fd4-b966-b314dee71fba	Self Development with Astrology	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Use astrological insights to enhance self-awareness, decision-making, and personal growth. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:34.705281+00	2026-03-26 02:50:34.705286+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
69c840a4-9da8-405f-9078-05967157a240	Self-Assessment	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Evaluate personal strengths, weaknesses, and goals to create a clear roadmap for improvement. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:34.794617+00	2026-03-26 02:50:34.794624+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
5e072f63-01f1-4991-be07-d78593ec37fd	Self Confidence and Self Esteem	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build a strong sense of self, embrace your abilities, and approach challenges with confidence. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:34.884287+00	2026-03-26 02:50:34.884296+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
305f2bd1-b609-4370-91c0-f9139897370c	Self Confidence	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop the mindset and skills needed to believe in yourself and take decisive action. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:34.973832+00	2026-03-26 02:50:34.973839+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
7faf8596-4350-45c9-8af8-7c0918621a5b	Self Esteem	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn techniques to strengthen self-worth and create a positive internal narrative. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:35.063688+00	2026-03-26 02:50:35.063697+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e34f8014-c6c9-43e9-89e5-fa101ce89bb1	Self Determination	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build inner drive and discipline to take control of your life and pursue meaningful goals. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:35.153831+00	2026-03-26 02:50:35.153839+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3422c94b-6bb5-4b61-86b5-f30763997eb2	Self Development	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Engage in continuous personal growth through reflection, skill-building, and positive change. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:35.243924+00	2026-03-26 02:50:35.24393+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
5ac42f68-da66-486f-a03f-8a16526b4a08	Self Help	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Explore practical tools and strategies for improving mindset, habits, and emotional well-being. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:35.332283+00	2026-03-26 02:50:35.33229+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
a601f0fe-c38b-4a3c-b5f4-7453c97a6ec2	Self Improvement	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Identify areas for self-enhancement and apply actionable steps for ongoing progress. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:35.423037+00	2026-03-26 02:50:35.423047+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
cec4cf9d-0146-4cf8-85d6-4022fb169b20	Self Insight	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Deepen your understanding of your thoughts, behaviors, and motivations for more intentional living. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:35.513727+00	2026-03-26 02:50:35.513743+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
33969109-b506-4b13-9cd0-d6bdeaab33ad	Self Mastery	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Strengthen self-control, clarity, and purpose to achieve peak personal performance. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:35.603131+00	2026-03-26 02:50:35.603137+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
5b27aabd-0bfa-475a-a9eb-8ab1ee7533f7	Setting Goals	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn to create clear, measurable goals that drive productivity and personal success. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:35.686102+00	2026-03-26 02:50:35.686108+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
f2f620ac-9ea8-41f0-be92-aac3e2f3f458	Stress	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Understand the sources of stress and learn healthy ways to manage and reduce its impact. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:35.872617+00	2026-03-26 02:50:35.872625+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6bb565ca-8461-4ed3-84e9-69eb8989a139	Stress Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build strategies to maintain calm, clarity, and resilience in stressful situations. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:35.963023+00	2026-03-26 02:50:35.963033+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e4589b03-880e-4914-b519-a119a0d7a0c5	Success	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn the habits, mindset, and strategies that support consistent achievement and growth. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:36.056922+00	2026-03-26 02:50:36.056931+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
de1cee5a-c814-4625-bf29-57e4e6de2d7d	Time Management	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Improve productivity through prioritization, planning, and effective use of time. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:36.146484+00	2026-03-26 02:50:36.14649+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
68cd3a13-94a6-4f37-9050-1a0d1dcca3b0	Transformation	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop tools for meaningful personal change and breakthrough results in your life. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:36.235267+00	2026-03-26 02:50:36.235273+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
a6ce8637-aca8-41cb-85e8-497069ca1642	Visualization	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Use guided mental imagery to strengthen focus, motivation, and goal achievement. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:36.327901+00	2026-03-26 02:50:36.327907+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
100db447-8ae5-4429-8c07-5462a69bf82a	Virtual Peer Specialist Training Support (VPST)	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Calling all Peer Support Specialists and Supervisors! Enhance your skills and gain valuable insights at our monthly Virtual Peer Specialist Training. This free session, hosted by HOPEYA and Bridging Hope, will equip you with the tools to navigate your role with confidence. Whether you're new to the field or a seasoned supervisor, this group offers support and practical advice. Don’t miss out—reserve your spot today for the second Tuesday of every month!. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:36.954796+00	2026-03-26 02:50:36.954803+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e632481c-2a12-4372-a865-90d97a171c50	Virtual Veteran Support Group (VVSG)	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Veterans, your well-being matters. Join our Virtual Veteran Support Group to connect with others who understand your journey and get the support you deserve. This peer-led group, hosted by HOPEYA and Bridging Hope, offers a space to share, heal, and find strength in community. Don’t wait—register now for our next session on the second Tuesday of each month and begin your path to recovery and support!. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:37.218696+00	2026-03-26 02:50:37.218703+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
52220bb8-45fc-4792-9372-4bfae3d4bac2	Opiod and Stimulant Young Adult Program	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Quick and easy to use positive youth development program for prevention and health professionals who want to prevent opioid and stimulant misuse and promote healthy lifestyle behaviors and positive identities among young adults. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:15.027983+00	2026-03-26 02:50:15.02799+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
f64dc5b0-b82c-4128-a59f-47626d08feeb	Test Workflow Course	Testing new fields	submitted	9b22830e-166d-42a5-a5fa-4115ec2db547	\N	\N	2026-04-01 00:18:44.121742+00	2026-04-01 22:16:13.129652+00	CORPORATE	\N	\N	\N	4	t	New employees	self-paced	\N	\N	2026-04-02 02:16:13.025315+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
0ef875d9-1bda-4432-815b-1f43f0b88d46	Recovery Basics for Parents	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Training program designed to provide parents and caregivers with the knowledge and skills to support a loved one in recovery from addiction. Drawing from the core principles of the CCAR Recovery Coach Academy, this course offers an introductory, one-day, emotionally-rich experience that teaches parents how to understand the impact of addiction, define and use the "language of recovery," advocate for recovery, and apply recovery coaching skills to build their loved one's recovery capital. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:15.297345+00	2026-03-26 02:50:15.297355+00	Family & Community Support	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2dac044d-c39e-4770-b9f4-c3b3617abd58	Ethic in Prevention Training of Trainers	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Details a program for experienced prevention professionals to become certified facilitators of the SAMHSA Ethics in Prevention curriculum. Participants learn the curriculum's content and specific facilitation techniques, including guided walkthroughs of the material, role-playing, and strategies for managing group dynamics and challenging conversations related to the Prevention Code of Ethics. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:15.386543+00	2026-03-26 02:50:15.386553+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
886459aa-bdf1-4a37-ad2a-c45c504beb3b	WRAP Facilitation Training for Trainer	This mental health & wellness course gives participants actionable tools to recognize needs early, respond effectively, and support long-term wellbeing. Intensive course for individuals with lived experience or those interested in facilitating WRAP groups, teaching how to lead others in creating their own WRAP plans by mastering the key concepts, history, values, and practical application of the WRAP model. Ideal for staff, community leaders, peer workers, and anyone supporting others under stress seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.452327+00	2026-03-26 02:50:17.452332+00	Mental Health & Wellness	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
bf527476-d03a-47b0-9d97-3e665423391f	HIV/STI/STD Training	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Provides foundational knowledge on sexually transmitted infections and HIV, covering their epidemiology, transmission, testing, prevention. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.71552+00	2026-03-26 02:50:17.715526+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
5d9ec1e9-ff13-4750-a42f-36ba9a867856	SmokeScreen	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. An evidence-based, story-driven behavioral health video game focused on smoking and vaping, with an emphasis on risk prevention, well-being, social intelligence. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:18.792345+00	2026-03-26 02:50:18.792392+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2e04d81c-06b6-4780-91c0-1d2694303666	Syringe Services Program Training	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Prepares staff and volunteers to run Syringe Services Programs by covering essential topics like harm reduction principles, infectious disease prevention (including safe injection practices and HIV/HCV testing), overdose prevention and naloxone administration, stigma reduction, community engagement, and the legal and ethical considerations of operating an SSP. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.804635+00	2026-03-26 02:50:17.804642+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
b89a3528-cf90-4016-8d1f-65ab20f0af40	Youth Advocacy and Strategic Prevention Framework	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Eaches participants to understand the issues affecting young people, develop advocacy plans and strategies, learn how to communicate effectively with decision-makers, and build partnerships to empower youth and promote prevention programming and policy. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.985391+00	2026-03-26 02:50:17.985397+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
006c9ca1-c104-49ca-b927-14f0027f8452	Harm Reduction 101 for Youth and Young Adults	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Youth focused Harm Reduction curriculum taught at schools, and centers as part of a SEL program. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:18.706114+00	2026-03-26 02:50:18.706121+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e6609e86-6158-46b2-b851-ee8a55f08fa3	REACH Training	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Evidence-based drug education curriculum for middle and high school students, focusing on harm reduction principles to provide scientifically accurate information about drug use, risks, and safer practices, empowering teens to make informed decisions about their health. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:15.567101+00	2026-04-28 23:13:45.422163+00	Peer Support Specialist			OOH	2	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		f									0.00
03667ac4-6eff-4510-aeb3-afcff242ccbc	Vape Prevention Workshops	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Highlights educating participants about the health risks, ingredients, and marketing of e-cigarettes, while also equipping them with media literacy, social competence, and refusal skills to make informed decisions and resist peer pressure. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:18.076247+00	2026-03-26 02:50:18.076257+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
96320f08-b599-4bc5-a8c4-7ce441366f91	Youth and Family Focused MHFA	This mental health & wellness course gives participants actionable tools to recognize needs early, respond effectively, and support long-term wellbeing. Evidence-based course for adults who regularly interact with young people (ages 12-24) to help them recognize and respond to signs of mental health challenges and crises. Ideal for staff, community leaders, peer workers, and anyone supporting others under stress seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:18.160223+00	2026-03-26 02:50:18.160228+00	Family & Community Support	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6eef48d9-d397-4801-9ee6-3776f8fa3f27	Adverse Childhood Experience Family Training	This mental health & wellness course gives participants actionable tools to recognize needs early, respond effectively, and support long-term wellbeing. Teaches what adverse childhood experiences are, how they cause toxic stress impacting brain development, and their long-term consequences on physical and mental health, behavior, and community well-being. Ideal for staff, community leaders, peer workers, and anyone supporting others under stress seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:18.249317+00	2026-03-26 02:50:18.249323+00	Family & Community Support	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
94f1189e-8f66-4648-841d-b3c7f66f019c	PlaySmart	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Opioid Misuse Prevention & Mental Health Promotion. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:18.878575+00	2026-03-26 02:50:18.878578+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e895b8ab-82fe-465b-b455-1853ab059ed5	ReFresh	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. This intervention is designed to help middle and high school students address vaping behaviors and the underlying causes. By emphasizing education over punishment, the program educates students about the harmful effects of vaping while incorporating research-based therapeutic models to foster self-awareness and promote positive change. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:18.969577+00	2026-03-26 02:50:18.969584+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
8b5e6ee4-9291-4227-a2f6-796dd4312366	Trauma Informed Training	This mental health & wellness course gives participants actionable tools to recognize needs early, respond effectively, and support long-term wellbeing. How Being Trauma Informed Improves Criminal Justice System Response. Ideal for staff, community leaders, peer workers, and anyone supporting others under stress seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:19.41601+00	2026-03-26 02:50:19.41602+00	Mental Health & Wellness	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
9b9a6d5c-0879-432e-997d-dccead66820d	STRETCH Training	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Look at exercise as a prevention method. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:19.690218+00	2026-03-26 02:50:19.690225+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
84d23689-9a85-4f42-8441-15a6d55d66b0	Workplace violence	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Understand prevention, awareness, and response strategies for maintaining a safe workplace. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.194289+00	2026-03-26 02:50:32.194299+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
fdfc292c-408b-4b4e-a4a8-6ea7e0184b08	Virtual Family & Friends Recovery Support Group (VFFR)	This family & community support course helps families and trusted supporters better understand challenges, respond with confidence, and stay engaged in the recovery process. Is someone you love going through recovery? You don’t have to go through this alone. Join our Virtual Family & Friends Recovery Support Group to connect with others, gain insights, and learn how to best support your loved ones. Hosted by HOPEYA and Bridging Hope, this is a safe space to share your experiences and receive expert guidance. Reserve your seat for the third Tuesday of the month now and take the next step in supporting recovery. Ideal for parents, caregivers, families, and trusted natural supports seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:37.035423+00	2026-03-26 02:50:37.035429+00	Family & Community Support	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2e2e0007-e214-4524-b275-56d2d48d27ed	Virtual Youth Violence & Prevention Group (VVPG)	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Be a part of the solution! Youth can change the future, and it starts with you. Join us in the Virtual Youth Violence Prevention Group to share your voice, learn from other youth advocates, and make a difference in your community. Hosted by HOPEYA and Bridging Hope, this event will give you the tools and platform to stand against violence. Let’s create safer communities together—sign up now for the fourth Tuesday of every month!. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:37.129308+00	2026-03-26 02:50:37.129321+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
0e85049e-3f07-4161-ba3a-84444689f6c9	OOH	Test Document!!	approved	9b22830e-166d-42a5-a5fa-4115ec2db547	\N	\N	2026-03-31 15:36:40.58356+00	2026-04-02 01:52:10.8546+00	Workforce Readiness			\N	\N	t	\N	self-paced	\N	\N	2026-04-02 02:14:41.899542+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
9a4cb922-228a-4295-bda4-ba5f3318e14a	Ethical Consideration for Recovery Coaches Training for Trainers	This train-the-trainer course prepares participants to confidently deliver Ethical Consideration for Recovery Coaches Training for Trainers content with consistency, credibility, and learner engagement. The TOT program trains individuals to become facilitators, providing them with the curriculum and confidence to deliver this essential ethical training to other recovery coach. Ideal for facilitators, supervisors, and organizations expanding internal training capacity seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:16.112137+00	2026-03-26 02:50:16.112146+00	Train-the-Trainer	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
7a4d13fa-82b7-4950-86c8-29ba2388ac10	ED Recovery Coaching Training for Trainers	This train-the-trainer course prepares participants to confidently deliver ED Recovery Coaching Training for Trainers content with consistency, credibility, and learner engagement. ToT course would focus on training existing recovery coaches to train others for this specific ED-based role, building on the core principles of recovery coaching with a focus on the unique challenges and opportunities within an ED setting. Ideal for facilitators, supervisors, and organizations expanding internal training capacity seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:16.662737+00	2026-03-26 02:50:16.662743+00	Train-the-Trainer	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
b02a7002-1624-41cf-8e19-aee4c1aeecea	Advocacy Training for Trainers	This train-the-trainer course prepares participants to confidently deliver Advocacy Training for Trainers content with consistency, credibility, and learner engagement. Equips experienced individuals with the skills and materials to become effective trainers, teaching them how to deliver advocacy training to others by covering subject matter, adult learning principles, effective communication, lesson planning, and presentation techniques. Ideal for facilitators, supervisors, and organizations expanding internal training capacity seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.105414+00	2026-03-26 02:50:17.105422+00	Train-the-Trainer	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
af3fa448-3c32-43fb-a1d7-cfe5b7f3473c	Harm Reduction Training for Peer Support Specialist	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Courses on harm reduction principles and substance use disorders, such as the Harm Reduction 101 course which covers drug use harms and benefits and harm reduction practices, and the Syringe Services Programs 101 course on community programs and services for people who use drugs. Other topics include using person-centered language to build trust and provide care for people who use drugs and building resilience to navigate the stressors of harm reduction work. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.363772+00	2026-03-26 02:50:17.363778+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
f46f2424-7b52-4fe7-929c-0092aa60b895	Naloxone Training Sessions	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Courses teach participants to recognize the signs of an opioid overdose, understand how the medication naloxone works to reverse an overdose, and how to safely administer naloxone (such as nasal spray) in an emergency. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.541834+00	2026-03-26 02:50:17.54184+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
bf6f5ea9-6d60-4cea-8965-f751651c874e	Harm Reduction Vending Machine Training Sessions	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Go over the logistics of starting a Harm Reduction Vending Machine Program. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.631691+00	2026-03-26 02:50:17.631698+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d422f1ae-79ff-4412-9308-dad58c40fe2b	Overdose Response Training	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. How to respond to an overdose. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.894641+00	2026-03-26 02:50:17.894647+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
29319802-a2d0-4696-8dc9-4e0ba50bac8b	Youth Train the Trainer	This train-the-trainer course prepares participants to confidently deliver Youth Train the Trainer content with consistency, credibility, and learner engagement. Prepares individuals to effectively deliver training to young people by providing skills in adult learning principles, facilitation, communication, and curriculum design, often including hands-on practice and feedback to build confidence and capability. Ideal for facilitators, supervisors, and organizations expanding internal training capacity seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:18.614928+00	2026-03-26 02:50:18.614936+00	Train-the-Trainer	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
0799b005-7ebd-4841-a917-2f2600ab2165	Recovery Coaching and Professionalism Training for Trainers	This train-the-trainer course prepares participants to confidently deliver Recovery Coaching and Professionalism Training for Trainers content with consistency, credibility, and learner engagement. Designed to train the trainer in CCAR professionalism class. Ideal for facilitators, supervisors, and organizations expanding internal training capacity seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:16.474814+00	2026-04-28 23:11:33.236412+00	Peer Support Specialist			PPW	4	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		f									0.00
8497a601-7536-45a3-a786-b0f3ad3b0502	Regrouping our Responses (ROR) ToT	This train-the-trainer course prepares participants to confidently deliver Regrouping our Responses (ROR) ToT content with consistency, credibility, and learner engagement. Engage master trainers in coaching new trainers in the 5 Evidence Based Core Concepts of Regrounding Our Response. Ideal for facilitators, supervisors, and organizations expanding internal training capacity seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:19.05882+00	2026-03-26 02:50:19.05883+00	Train-the-Trainer	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
04f46efe-2361-4372-9277-519d4554814c	Stages of Change/ Stages of Recovery	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. A framework for understanding how individuals move through phases of behavioral change, particularly in addiction recovery. It covers the stages of Precontemplation (unaware of the problem), Contemplation (aware but undecided), Preparation (ready to act), Action (taking steps to change), and Maintenance (sustaining the new behavior). A sixth stage, Relapse, is discussed as a common occurrence where individuals temporarily return to old behaviors before resuming their recovery journey. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:19.150061+00	2026-03-26 02:50:19.15007+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
9d30859f-c61c-4e8a-aef8-80b7be8fc9ef	Opiod Response Training	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Teach participants to recognize the signs and symptoms of an opioid overdose, understand the mechanisms of opioids and naloxone, and safely administer naloxone (a life-saving overdose reversal medication). Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:19.509019+00	2026-03-26 02:50:19.509024+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
102fdd25-5023-4233-a63a-3e5cc11d7707	Archiving and Records Management	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Understand how to organize, store, and protect organizational records to ensure compliance and accessibility. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:20.59668+00	2026-03-26 02:50:20.596689+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2f99b6a6-e37d-40c8-8ed2-916c097eff05	Train the Trainer	This train-the-trainer course prepares participants to confidently deliver Train the Trainer content with consistency, credibility, and learner engagement. Learn how to design, deliver, and evaluate impactful training programs. Ideal for facilitators, supervisors, and organizations expanding internal training capacity seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:31.466063+00	2026-03-26 02:50:31.466066+00	Train-the-Trainer	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
dd5e432b-d2a7-4404-a2c2-c0182f46b870	Harm Reduction and Street Outreach Specialist	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. This course is perfect for peer recovery support specialists who may want to work in a syringe service program, outreach work, and community based organizations servicing people experiencing homelessness and chronic substance use. By completing this learning pathway you will earn a certificate of completion to help you stand out to employers as a PRSS with continued specialization in harm reduction and outreach. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:37.304992+00	2026-03-26 02:50:37.304999+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3074c7d8-a626-494e-a840-6e03349d6f61	Naloxone 101 Training Course	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. This is a self-guided, interactive course on how to recognize and respond to a drug poisoning, including how to use naloxone. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:37.392274+00	2026-03-26 02:50:37.392284+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
eedeadbc-ebae-419f-81c1-d5486010e082	Exploring The Social Determinants of Health	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Understand how the social determinants of health interact in the opioid crisis, and the health equity factors that influence change. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:37.843092+00	2026-03-26 02:50:37.843099+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d9611350-7fed-4075-9778-d9ffa26b0738	RELATE supervisory framework	This course helps participants strengthen practical skills, build confidence, and apply learning directly in community and workforce settings. Training that will give supervisors of team members who work directly with participants the knowledge, tools, and experience to implement our RELATE supervisory framework. Ideal for students, emerging professionals, and community-serving teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.272226+00	2026-03-26 02:50:17.272236+00	Workforce Development	\N	\N	CORPORATE	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
4c2d1689-683f-463e-85e2-7bb9aa254fbe	Lived Experience Training Academy (LETA)	This course helps participants strengthen practical skills, build confidence, and apply learning directly in community and workforce settings. LETA builds on the knowledge and skills of diverse people with lived experience and focuses on systemic change to ensure housing as a human righ. Ideal for students, emerging professionals, and community-serving teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:19.240415+00	2026-03-26 02:50:19.240624+00	Workforce Development	\N	\N	CORPORATE	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
f8527d6a-a9a1-4b74-9739-4335039fb307	Lean Six Sigma Awareness Training	This course helps participants strengthen practical skills, build confidence, and apply learning directly in community and workforce settings. Participants leave with clear strategies, usable tools, and a stronger understanding of how to apply the content in daily practice. Ideal for students, emerging professionals, and community-serving teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:36.414306+00	2026-03-26 02:50:36.414376+00	Workforce Development	\N	\N	CORPORATE	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
159a10f4-7d7f-442a-be80-73733454ab40	PPW	for TeSt!!	draft	9b22830e-166d-42a5-a5fa-4115ec2db547	\N	\N	2026-03-31 15:39:35.750856+00	2026-04-02 01:59:48.349438+00	Peer Support Certification Training			\N	\N	t	\N	self-paced	\N	\N	2026-04-02 02:15:11.031039+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
eefc1455-78f4-4b8e-af1c-85fe16cec03c	Lean Six Sigma (LSS) Green Belt	This course helps participants strengthen practical skills, build confidence, and apply learning directly in community and workforce settings. Participants leave with clear strategies, usable tools, and a stronger understanding of how to apply the content in daily practice. Ideal for students, emerging professionals, and community-serving teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:36.506625+00	2026-03-26 02:50:36.506635+00	Workforce Development	\N	\N	CORPORATE	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
b1a69157-136b-4b3d-89bc-d57b072fa5bb	LSS Executive Project Selection	This course helps participants strengthen practical skills, build confidence, and apply learning directly in community and workforce settings. Participants leave with clear strategies, usable tools, and a stronger understanding of how to apply the content in daily practice. Ideal for students, emerging professionals, and community-serving teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:36.59597+00	2026-03-26 02:50:36.595976+00	Workforce Development	\N	\N	CORPORATE	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
5248e73d-1e81-48ce-b71a-6b22991cdb26	International for Organization for Standardization (ISO)	This course helps participants strengthen practical skills, build confidence, and apply learning directly in community and workforce settings. Participants leave with clear strategies, usable tools, and a stronger understanding of how to apply the content in daily practice. Ideal for students, emerging professionals, and community-serving teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:36.773061+00	2026-03-26 02:50:36.773069+00	Workforce Development	\N	\N	CORPORATE	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d73b2f40-b6ae-4ad7-8ee1-05d95ec953b3	CCAR Recovery Coach Academy	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Teaches participants how to mentor and guide others in their addiction recovery journey by focusing on the individual's goals and strengths. Key topics include the role of a recovery coach, recovery principles, recovery wellness planning, the stages of recovery, cultural awareness, and managing ethical situations and boundaries. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:15.747825+00	2026-03-26 02:50:15.747832+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
539e9279-9e63-468b-b4a0-53bc4633d55a	Youth Public Health Safety Training	This safety & compliance course gives learners practical, job-ready skills they can use immediately in real-world settings. Typically includes skills in childcare safety, like first aid and prevention of emergencies, alongside training in mental health support for youth, with topics like recognizing struggles and fostering resilience. Ideal for frontline staff, volunteers, caregivers, and workforce trainees seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:18.523932+00	2026-03-26 02:50:18.523939+00	Safety & Compliance	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2ff2b301-af3e-4443-8e7f-32be9cbcb0db	Youth Substance Use Prevention and Wellness SBIRT	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Focus on equipping providers with the Screening, Brief Intervention, and Referral to Treatment (SBIRT) model to identify, motivate, and assist young people in making healthier choices regarding substance use. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:14.663352+00	2026-03-26 02:50:14.663356+00	Prevention & Youth Education	\N	\N	PPW	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
74cedcd6-c81e-452f-8cfa-679aee253c0d	Vaping High School Program	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Includes prevention and education for students, educators, and parents, focusing on the health risks, industry tactics, and nicotine addiction. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:14.937742+00	2026-03-26 02:50:14.937752+00	Family & Community Support	\N	\N	PPW	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
7f6df527-4741-483f-bfb1-4780f704ecfe	Test Course with All Fields		draft	9b22830e-166d-42a5-a5fa-4115ec2db547	\N	\N	2026-04-04 20:00:43.424574+00	2026-04-04 20:00:43.424588+00	Life & Resilience Skills Training			\N	\N	t	Test Users	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
c736d17c-c5f5-4cf2-b798-8246e9133753	Implementing SPORT and other Substance Use PPW Prgm	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. A brief substance use prevention and health promotion intervention designed to highlight the positive image benefits of an active lifestyle to reduce the use of alcohol, tobacco, and drugs by youth. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:14.755376+00	2026-04-28 15:50:43.322235+00	Prevention & Youth Education			PPW	2	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f								\N	0.00
3d704095-0eb0-46c3-a82b-cdfbe1a1c511	Ethical Consideration for Recovery Coaches (CCAR ethics)	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Equips professionals with a framework and practical skills to navigate ethical challenges, maintain professionalism, and uphold boundaries in peer-based recovery support services. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:16.019195+00	2026-04-28 23:12:12.062688+00	Peer Support Specialist			OOH	3	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		f									0.00
5826060b-db4a-43b4-8269-de1b6f677156	CCAR Coachervision	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Focused on providing participants with supervision skills to "coach coaches" and foster long-term success in recovery coaching. The course equips individuals, organizations, and businesses to offer effective support to recovery coaches, addressing the unique challenges of the profession, ensuring performance support, and preventing compassion fatigue through a structured, "coaching coaches" approach to supervision. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:16.200553+00	2026-03-26 02:50:16.200561+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d8f84464-4441-43b2-9046-077702da787a	CCAR Recovery Coaching and Professionalism	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Designed for recovery coaches to enhance their skills and understanding of professional conduct in various settings, including healthcare and justice systems. The course focuses on developing professional characteristics, defining personal accountabilities, establishing clear boundaries, and learning to navigate different professional environments while maintaining their role as peer supporters. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:16.384298+00	2026-03-26 02:50:16.384306+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
222e4584-a1c9-4235-8390-2c0d384b8f9e	CCAR Emergency Department Recovery Coaching	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Focuses on equipping peer recovery coaches to provide compassionate, confident, and professional support to individuals in crisis within a fast-paced emergency department (ED) setting by teaching them to effectively support patients in crisis, advocate for peer support, and navigate complex hospital systems. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:16.569253+00	2026-03-26 02:50:16.569259+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
1a2701af-1645-46d5-a65c-14231b3c85b3	CCAR Spirituality for Recovery Coaches	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Helps recovery coaches understand spirituality as a key element of long-term recovery, focusing on building a non-religious, inclusive framework for discussing personal values, beliefs, and a sense of purpose. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:16.751094+00	2026-03-26 02:50:16.751103+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
d5f58634-6582-47ec-84e5-e90d7737d96d	Spirituality for Recovery Coaches Training for the Trainer	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Trains recovery coaches to understand, explore, and support individuals' spiritual journeys without imposing personal beliefs, emphasizing inclusivity, self-reflection, and the use of appropriate tools and language to foster a non-biased, welcoming space for spiritual exploration in recovery. The course aims to deepen empathy, strengthen recovery connections. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:16.840561+00	2026-03-26 02:50:16.840568+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
755922f2-834f-4a41-ae8d-1895a1adf88e	COACH Course	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. The COACH: Moving out of the “fix it” framework towards sustainable change course can be taken in two or four virtual instructor-led sessions. Each training includes supplemental course work, learning materials, and activities. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.187002+00	2026-03-26 02:50:17.187012+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
191f7cab-1a98-476f-8d8e-f6ea3c0c66b4	Youth Peer Support Specialist Training	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Raining on using lived experiences in a professional manner to support other young people, along with topics like ethics, mental health and adolescent development, diversity, and cultural considerations. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:18.339753+00	2026-03-26 02:50:18.339759+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
812d43b6-9ca2-4643-b3a1-c0cfd8043ba5	Youth Wellness Recovery Action Plan (WRAP)	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Involves a supportive group process where young people develop a personalized plan to get well, stay well, and handle challenges. Participants learn and use self-help tools like relaxation techniques, mindfulness, and peer support to identify early warning signs, create action plans for triggers, and establish a daily maintenance plan. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:18.431812+00	2026-03-26 02:50:18.431818+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
76ba219b-cf98-4e34-bde9-1fd5cb1c157c	Grief and Loss Counseling	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Grief and Loss Centers of America presents an Informational Webinar for grief and loss assistance. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:19.329125+00	2026-03-26 02:50:19.32913+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
06387ca0-39a5-436e-9ad0-4d8a8fdbef78	Certified Peer Recovery Specialis Prep session	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Review for the Certified Peer recovery specialist certification exam. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:19.599542+00	2026-03-26 02:50:19.599552+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
fb46ff1e-6567-4711-974b-fb4d67560586	Peer Support Community of Practice Chats (Peers supporting Peers)	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Discourse for Peers to speak with other peers, and exchange ideas and experiences. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:19.875837+00	2026-03-26 02:50:19.875843+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
71447e71-a5e1-471c-bb6b-98cedd3ba858	Coaching and Mentoring	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Discover effective coaching and mentoring techniques to develop talent and boost performance. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:21.863198+00	2026-03-26 02:50:21.863208+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
b34d3789-8506-458d-9cac-ccf74bf0b05d	Coaching Salespeople	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Equip managers with tools to coach sales teams toward achieving and exceeding sales goals. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:21.954448+00	2026-03-26 02:50:21.954454+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
e3e820cc-8ce9-4530-8c89-a5f061f1b818	Health and Wellness at Work	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Promote workplace wellness initiatives that support employee health and productivity. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:25.173952+00	2026-03-26 02:50:25.173958+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
959c00bc-96cb-4767-a8e2-f6b802ba4cba	Life Coaching Essentials	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Acquire foundational coaching skills to guide others toward achieving personal and professional goals. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:26.506112+00	2026-03-26 02:50:26.506122+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
30ad4f55-114e-4e5f-93cb-6c4b3e6d9536	Coaching	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Learn core coaching principles to guide others toward personal and professional growth. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.638255+00	2026-03-26 02:50:32.638258+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6a05fc9b-132e-486c-a6e1-736ff1de662c	Coaching success	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop advanced coaching methods that enhance client outcomes, engagement, and goal achievement. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:32.729543+00	2026-03-26 02:50:32.729546+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
ba89e721-e78c-4635-b8d9-d0867208dd0a	Grief	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Build coping skills that support emotional processing, healing, and personal strength through loss. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:33.372491+00	2026-03-26 02:50:33.372497+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
83e06b00-a39e-4d8d-b705-06c49431008f	Virtual Youth Wellness Group (VWG)	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Join us for a transformative youth wellness session! Are you looking for a safe space to share your thoughts and learn healthy coping skills? Our Virtual Youth Wellness Group is designed just for you! Sign up today to be part of this empowering community event hosted by HOPEYA and Bridging Hope. Don’t miss out on the chance to connect, share, and grow together—register now for our next session on the first Tuesday of every month!. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:36.864566+00	2026-03-26 02:50:36.864572+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
2570901e-c936-4b99-895f-d081217b052c	Blood Borne Pathogens	This safety & compliance course gives learners practical, job-ready skills they can use immediately in real-world settings. Provides essential knowledge on identifying, preventing, and responding to occupational exposure to infectious microorganisms found in human blood and bodily fluids. Ideal for frontline staff, volunteers, caregivers, and workforce trainees seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:14.480563+00	2026-03-26 02:50:14.480571+00	Safety & Compliance	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
5b42ef80-ee05-47d4-9359-c07ba31d88d7	Advocacy Training Big A, little a	This ethics & professional practice course helps professionals lead with integrity, sound judgment, and confidence in complex situations. Aim to develop skills for building advocacy strategies, engaging stakeholders and parliamentarians, crafting compelling messages, and applying ethical considerations, preparing participants to act as effective advocates for individuals, communities, and social change. Ideal for peer professionals, supervisors, and staff in helping roles seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:17.017542+00	2026-03-26 02:50:17.01755+00	Ethics & Professional Practice	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
63a1b0d5-4eea-4d01-bc09-63b6aae2dbcf	Start from Template test 	A focused 1-hour live training session covering key concepts.	draft	9b22830e-166d-42a5-a5fa-4115ec2db547	\N	\N	2026-04-04 20:34:01.785788+00	2026-04-04 20:34:01.785801+00	Professional Development			\N	1	t	All staff	live	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3b8bab5c-bebe-47d4-8e66-b09c1cbc8704	CPR/First Aid	This safety & compliance course gives learners practical, job-ready skills they can use immediately in real-world settings. Teaches how to respond to medical emergencies by providing immediate care for conditions like cardiac arrest, choking, bleeding, and shock, until professional medical help arrives. Ideal for frontline staff, volunteers, caregivers, and workforce trainees seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:13.900476+00	2026-05-27 20:09:46.88236+00	Safety & Compliance	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
10ab9fca-c687-4463-8805-511b7ceb6dcd	Capability Maturity Model  (CMM)	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Participants leave with clear strategies, usable tools, and a stronger understanding of how to apply the content in daily practice. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:36.684888+00	2026-03-26 02:50:36.684894+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
b7d47d61-31a5-48d5-9555-6a7169be04f5	Understanding Adverse Childhood Experiences	This mental health & wellness course gives participants actionable tools to recognize needs early, respond effectively, and support long-term wellbeing. Understand the impacts of trauma on brain development; how adverse childhood experiences effect health and well-being; and identify key protective factors. Ideal for staff, community leaders, peer workers, and anyone supporting others under stress seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:37.57412+00	2026-03-26 02:50:37.574127+00	Mental Health & Wellness	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
b888e4d3-98c9-4ab6-950f-6d29d4675739	Medications For Addiction Treatment As Overdose Prevention	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Understand medications used for opioid use disorder; the science behind addiction; how MAT saves and improves lives; and how medications can prevent overdose death. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:37.933036+00	2026-03-26 02:50:37.933044+00	Prevention & Youth Education	\N	\N	OOH	2	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
10020db2-c050-486b-a367-ab19217b399a	Harm Reduction 101	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Youtube video on harm reduction principles, myths, and information around substances and how we can support individuals who use those substances. Also includes information on Narcan and how to support someone in an active overdose. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:37.484622+00	2026-03-26 02:50:37.484629+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
7d1fbc26-9a41-4f52-8339-64ea12ba5cec	Comprehensive Care Framework For PWUD	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Understand how infectious disease relates to the opioid overdose crisis; how to apply harm reduction strategies in your organization; and learn strategies for addressing stigma. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:37.661759+00	2026-03-26 02:50:37.661767+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
4dca983f-b516-4ba6-82d1-d13af53e1149	Exploring The Stages of Change	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Understand how addiction relates to the opioid crisis; the key tasks for each stage of change; and debunk common misconceptions of harm reduction. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:37.754045+00	2026-03-26 02:50:37.754055+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	0.00
3910fa4c-8cc4-4438-906c-c334d91b3ffd	Adult Learning Physical Skills	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Develop strategies for teaching and improving physical and kinesthetic skills in adult learners. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:20.326108+00	2026-03-26 02:50:20.326116+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	0.00
64f87c7a-9647-4754-8820-21403991d992	SPORTS Prevention Plus Wellness	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Designed to prevent substance use and promote healthy lifestyles by highlighting the positive image benefits of active, healthy behaviors. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:14.571862+00	2026-05-26 20:17:36.550291+00	Prevention & Youth Education		https://www.dropbox.com/scl/fi/plvf9vshalbb1eegqwype/PPW-Flyer.pdf?rlkey=lzwdrvk9hdahjw1p65knp5ma7&e=1&st=4vkhd2pu&dl=0	PPW	2	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Dr. Patrecia Williams	t	https://www.dropbox.com/scl/fi/bb8vuduu9aqlrjc81417g/Prevention-Plus-Wellness-PPW-SPORT-Tng.mp4?rlkey=f0jhtpfdgh7d6q8g7cgdms54d&e=1&st=n9vf6gfy&dl=0	https://www.dropbox.com/scl/fi/5w9cksx4k4ht2946cpxpu/PPW-Instructor-Manual.pdf?rlkey=dd10ece7m6u35upuy579dqr0j&st=5k387tpk&dl=0	https://www.dropbox.com/scl/fo/a1euk5e39i88xj8q10pvz/AIFaUT7OlZy36te-BGoUvcQ?rlkey=nreg66n27txr7aw2z6kh50fuf&e=1&st=8ugi2z1z&dl=0			https://www.dropbox.com/scl/fi/fkz2hx6luhiyiqprw9gc5/2Sport-AC-HS-12.8.22.pptx?rlkey=m77wzbibq4xnlm4ncarrjah5g&st=387i2c7e&dl=0	https://qr1.me-qr.com/link-list/Mqr8XrMG/show	Patrecia.Williams@organizationofhope.org	0.00
07866f14-aa57-4e33-aa00-2015cbf8ccf8	Supervising Peer  Refresher Course	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Provides experienced peer supporters with updated knowledge and skills to effectively provide supervision, mentorship, and support to other peer workers, focusing on best practices in communication, ethical considerations, boundary setting, and fostering an environment of trust and professional growth within a peer support framework. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:15.659516+00	2026-03-26 02:50:15.659526+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	0.00
8f39f837-94e2-424f-acdb-d94a8d4c7261	Recovery Coach Academy Training for Trainers	This train-the-trainer course prepares participants to confidently deliver Recovery Coach Academy Training for Trainers content with consistency, credibility, and learner engagement. Trains recovery coaches by focusing on the art and science of recovery coaching, including relationship-building, communication, ethics, and recovery planning. Ideal for facilitators, supervisors, and organizations expanding internal training capacity seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:15.835683+00	2026-04-28 23:10:49.103002+00	Peer Support Specialist			PPW	4	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		f									0.00
e612fce5-c64e-40b0-84d9-9872c0bdd361	Spirituality	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Explore practices and perspectives that deepen inner peace, meaning, and connection. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:35.78002+00	2026-04-28 23:11:50.645342+00	Peer Support Specialist			CORPORATE	3	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		f									0.00
a8ca51fc-e477-4a31-9622-22aa74e52581	Wellness Recovery Action Plan (WRAP)	This mental health & wellness course gives participants actionable tools to recognize needs early, respond effectively, and support long-term wellbeing. Teaches individuals how to create a personalized, self-designed plan for managing mental and physical health challenges and improving overall well-being. Through group learning and self-exploration, participants identify and develop a toolbox of wellness strategies and coping skills, culminating in an individualized WRAP to navigate daily stressors, identify early warning signs of declining well-being, and plan for crises. Ideal for staff, community leaders, peer workers, and anyone supporting others under stress seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:16.927353+00	2026-04-28 23:12:28.588283+00	Peer Support Specialist			OOH	2	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		f									0.00
7e7ee6bf-4493-4562-9620-b6f18ee1978c	Recovery Coach Professional	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Comprehensive pathway to achieve professional recognition as a recovery coach, requiring foundational training, specific core competency coursework, and often a professional panel interview or other experiential process. Participants learn key recovery coaching skills, including active listening, motivational interviewing, setting ethical boundaries, and supporting recovery capital, all while learning to advocate for individuals in recovery across various settings. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:15.20943+00	2026-03-26 02:50:15.209436+00	Peer Recovery & Coaching	\N	\N	OOH	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	0.00
6da93a14-2048-4f5f-b266-6a32c46fdb9c	Mental Health First Aid (MHFA)	This safety & compliance course gives learners practical, job-ready skills they can use immediately in real-world settings. An internationally recognized course that teaches participants how to recognize, understand, and respond to signs of mental health problems or crises in others. Similar to physical first aid, it provides the skills and knowledge to offer initial support and guide individuals toward professional help until appropriate treatment can be found or the crisis resolves. Ideal for frontline staff, volunteers, caregivers, and workforce trainees seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:16.290927+00	2026-04-28 23:13:15.791659+00	Peer Support Specialist			OOH	2	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		f									0.00
c9345894-9d91-4123-a5f8-96aeaf74d76e	Recovery Coaching a Harm Reduction Pathway	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Teaches individuals to support others in their recovery journey by embracing harm reduction principles and person-centered coaching skills. It provides knowledge on harm reduction as a practice and social movement, helps participants examine their own beliefs, teaches practical coaching techniques for safety and risk reduction. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:15.927697+00	2026-04-28 23:15:27.39548+00	Peer Support Specialist			PPW	4	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		f									0.00
c3355aed-2d4d-4790-ab8e-65867a99f552	Safety First	This harm reduction & public health safety course builds evidence-informed skills that help teams reduce risk, save lives, and strengthen community trust. Will focus on our updated Safety First curriculum, a comprehensive, harm reduction based, drug intervention curriculum. Ideal for outreach teams, public health workers, peer staff, and community responders seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:15.475951+00	2026-03-26 02:50:15.475961+00	Harm Reduction & Public Health Safety	\N	\N	PPW	4	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	0.00
061e48ce-8242-4d7f-96c7-507809ad8c34	Basic Bookkeeping	This peer recovery & coaching course strengthens the skills needed to walk alongside people in recovery with empathy, structure, and purpose. Gain practical knowledge of financial record-keeping, including ledgers, reconciliations, and accounting basics. Ideal for peer recovery specialists, recovery coaches, and behavioral health teams seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:20.867433+00	2026-03-26 02:50:20.867443+00	Peer Recovery & Coaching	\N	\N	CORPORATE	3	t	\N	self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	0.00
efba61da-d37e-4523-9d44-05bd2ac38bb9	Project Towards No Drug Abuse Training	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. A drug prevention program for high school youth who are at risk for drug use and violence-related behavior. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:15.117687+00	2026-04-28 18:56:54.984252+00	Prevention & Youth Education		https://www.dropbox.com/scl/fi/0n5jrli36y4bqka5kmxjh/PTND-PPW-Combo-Flyer.pdf?rlkey=zmtcz3r7x8ebnfscotqc01wae&e=1&st=vxlnaoow&dl=0	OOH	2	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Dr. Patrecia Williams	t	https://www.dropbox.com/scl/fo/833xcromgamyurvhtdb22/AKSuQfvPP_E2X8s4Njo6wYQ?rlkey=cxmawtjgdtbb55muu8m9l9fxj&st=0zaqsn1l&dl=0	https://www.dropbox.com/scl/fo/1qdm4lfv398szm0f1s290/AFJzkyIym6qTTt2HFcqbGWw/TND%20Instructor%20Manual.pdf?rlkey=eeco763pomjklrxzbozye76fp&st=xx52q9np&dl=0		https://www.dropbox.com/scl/fo/1qdm4lfv398szm0f1s290/AGLU5EOt_-PzeagophVdy5Y/TND%20Student%20Manual.pdf?rlkey=eeco763pomjklrxzbozye76fp&st=b8n4dc04&dl=0			https://qr1.me-qr.com/link-list/Mqr8XrMG/show	Patrecia.Williams@organizationofhope.org	0.00
03f95ab2-5fd9-4824-8a9a-d164a4fe1818	Prevention Plus Wellness Youth Programs Training of Trainer	This high-impact prevention & youth education course equips participants with practical strategies to engage youth, strengthen protective factors, and support healthier decision-making. Equips professionals to train other individuals to implement PPW youth programs with fidelity. This workshop teaches you to describe PPW's underlying theory and research, effectively implement selected PPW programs, monitor implementation using evaluation tools, and practice presenting the program lesson scripts to trainees. Ideal for youth leaders, educators, prevention staff, and community-based programs seeking a credible, engaging learning experience through the OOH Training Portal.\n\nYouth Prevention Training - 5 Module Comprehensive Program\n\nThis training consists of 5 modules covering essential topics for youth prevention education:\n- Module 1 Package\n- Module 2 Package\n- Module 3 Package\n- Module 4 Package\n- Module 5 Package\n\nEach module package includes:\n- Instructor Manual\n- Training Manual\n- Student Workbook\n- PowerPoint Presentations\n\nAccess all module materials via the Training Materials section.	published	2f93b673-76d9-451a-a080-cc5f80165dbd	\N	\N	2026-03-26 02:50:14.847339+00	2026-04-11 19:30:41.696983+00	Prevention & Youth Education			PPW	2	t		self-paced	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	https://www.dropbox.com/scl/fo/utlaiylmwunq6wiqcykcf/AELOQ8C_7PLmsvbLsOJpJas?rlkey=etgthbfhig6p15a5kmz01jpll&e=1&st=hkjmyzsb&dl=0							\N	0.00
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.user_roles (user_id, role_id, assigned_at) FROM stdin;
2f93b673-76d9-451a-a080-cc5f80165dbd	1	2026-03-26 02:23:36.975598+00
9b22830e-166d-42a5-a5fa-4115ec2db547	2	2026-03-26 03:00:55.930315+00
e7ae440c-aa34-4788-a39d-2150ae058f50	3	2026-03-26 03:00:55.930315+00
ef6dccbe-098f-4500-be6e-27191d5e46bb	3	2026-03-27 01:15:36.320603+00
df1d650c-8825-4368-8d28-38c1a16d6c6c	3	2026-03-27 20:36:53.540386+00
ad9ec08d-277f-43cd-a18b-5f8fadfd9a64	3	2026-03-31 15:30:17.34184+00
4e5c6d9e-3605-42ef-92bf-50c612cf1220	3	2026-04-08 16:40:11.586065+00
a04658b3-bb2d-4006-9279-634db63092cf	3	2026-04-08 16:42:45.771406+00
d6435aed-141e-4c69-85b6-dce84ff64749	3	2026-04-08 16:42:53.78807+00
99c5bc72-d494-4068-b2da-d6f4542eedd7	3	2026-04-08 16:44:01.294551+00
2350ac3c-1c02-42a6-8202-1d9b7073c1a1	3	2026-04-08 16:45:45.249072+00
97c527a7-0ece-4391-85dc-a772e3c0a805	3	2026-04-08 16:48:20.026354+00
cc11f2a5-9123-4489-aae0-546bff6aced5	3	2026-04-08 16:49:43.284607+00
ce458ccf-40f8-405b-a6e7-29d6cb9f49f2	3	2026-04-08 16:50:26.725522+00
6e123cc1-0754-48d8-8981-0966a6b54932	3	2026-04-08 16:51:05.46796+00
3c162039-9cae-4363-87ff-d55364aa7450	3	2026-04-08 16:51:47.023362+00
55a24e05-5430-4482-bf73-7d93fcdae8c9	3	2026-04-08 16:53:16.239639+00
e7627500-2e1c-4355-b53d-104bbfd69af2	3	2026-04-08 17:05:45.823298+00
4d88a7c5-29ff-4794-afe1-e92c309c51a8	3	2026-04-11 18:42:29.510243+00
a9f58df5-d5a7-4892-bb98-df922ea9f8c9	3	2026-04-13 00:05:48.612123+00
f3d4b3dc-846f-4b01-adb6-61ed63e03980	3	2026-04-13 00:22:58.505231+00
6a00cc98-8166-4996-9498-551ed89c5288	3	2026-04-13 00:25:10.557277+00
6c6a66ef-e561-49fe-b5b6-81512bae53bb	3	2026-04-13 01:23:29.765047+00
ead3b963-d3de-447f-9f9a-6587398252bd	3	2026-04-16 02:35:35.071915+00
537511af-dd0d-45dd-9ea9-fd24d275ce58	3	2026-04-28 17:46:58.145731+00
86cd3cb7-b88f-47f5-b173-dbc548373991	3	2026-04-28 18:16:29.603647+00
5591125c-9124-403d-850e-bd6de2df0c68	3	2026-04-28 18:53:54.298322+00
ef6dccbe-098f-4500-be6e-27191d5e46bb	1	2026-04-29 14:00:52.548981+00
ef6dccbe-098f-4500-be6e-27191d5e46bb	2	2026-04-29 14:00:52.548981+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hope_database_6709_user
--

COPY public.users (id, full_name, email, password_hash, status, created_at, updated_at) FROM stdin;
7f125d1b-cfdc-407d-bc7c-d0387af65197	System	system@hope.local	$2b$12$jKTxnLmNDdOGN5C73RNsF.cbBxHkiomnUE44GITh8pW0H/orHGWVS	active	2026-03-26 02:13:20.981241+00	2026-03-26 02:13:20.981245+00
2f93b673-76d9-451a-a080-cc5f80165dbd	Admin	admin@hope.local	$2b$12$f6zvXW3iYcdBF0LQYEcSDuDHNSmUzut3RVd.Gt.x42RLNuGwbld6a	active	2026-03-26 02:23:36.975598+00	2026-03-26 02:59:41.330734+00
ef6dccbe-098f-4500-be6e-27191d5e46bb	Karrthik B	karrthikburugupally@gmail.com	$2b$12$wYsQt9J.S8k6xlNQyiNgbe5LTvDf4hN0MaGt8IrZF0TbxxfMuf0z6	active	2026-03-27 01:15:35.974583+00	2026-03-27 01:15:35.974589+00
df1d650c-8825-4368-8d28-38c1a16d6c6c	Manee	maneeburgupally@gmail.com	$2b$12$RGED2kHCPX632Rua0S6W9.YHgQFVjs7VTmElV0onMeMTZ3ytO0CVW	active	2026-03-27 20:36:53.395375+00	2026-03-27 20:36:53.39538+00
ad9ec08d-277f-43cd-a18b-5f8fadfd9a64	karthik	karthikburugy@gmail.com	$2b$12$yJdHlsa9Vdjq99.7QAT63uFWst5blw6BL2QTmtZB9mmfHgz9Pmtcy	active	2026-03-31 15:30:17.226402+00	2026-03-31 15:30:17.226408+00
4e5c6d9e-3605-42ef-92bf-50c612cf1220	Sahniya Sprolling	sahniyasprolling87@gmail.com	$2b$12$hFaHCUA16ME.KFkmcuSc1eNugG933zj9Gjkbw4lrA4PH.IkpIAVeu	active	2026-04-08 16:40:11.464653+00	2026-04-08 16:40:11.46466+00
a04658b3-bb2d-4006-9279-634db63092cf	Joshua Wilson	lordsparegrim@gmail.com	$2b$12$tau8YWuWff/Hm2y.JUXpl.gy8L8uuEGfte7XpcoxgajCfWMAW.mNK	active	2026-04-08 16:42:45.660901+00	2026-04-08 16:42:45.660909+00
d6435aed-141e-4c69-85b6-dce84ff64749	jaylin brown	jaylinbrown877@gmail.com	$2b$12$OOAG//8Uf.6887aERbUG4.u6All1vro2BL1XRXVND4HQZCIejMN1G	active	2026-04-08 16:42:53.672995+00	2026-04-08 16:42:53.673003+00
99c5bc72-d494-4068-b2da-d6f4542eedd7	Akai.R	akairobinson1230@gmail.com	$2b$12$RqCNQos3/4yIiH/Oki/UNOoNgXWivOqpyLMSmOHPqjN2mxmPHJ/su	active	2026-04-08 16:44:01.160066+00	2026-04-08 16:44:01.160073+00
2350ac3c-1c02-42a6-8202-1d9b7073c1a1	Clinton Watterson III	clintonwatterson5@gmail.com	$2b$12$GFVFxXSvYwvAixxZIuwJEOtY.oeJaaPYfSDnXwJRibIxcjYKzC.0y	active	2026-04-08 16:45:45.161315+00	2026-04-08 16:45:45.161323+00
97c527a7-0ece-4391-85dc-a772e3c0a805	Mark Barnes	markbarnes2006@gmail.com	$2b$12$R.P0Xw788iaEOsO8CWPL0Ol38UhNNpjjlQbKDSaLFyZgQYS.H61R6	active	2026-04-08 16:48:19.963836+00	2026-04-08 16:48:19.963843+00
cc11f2a5-9123-4489-aae0-546bff6aced5	Dae'shaun Terell Ward	parlayfanduel73@gmail.com	$2b$12$99/vSqK2Oe4xT2pQTmB2J.ddqeb2bq2u5HcV.rQw41.y9zlCvYLZm	active	2026-04-08 16:49:43.163003+00	2026-04-08 16:49:43.163011+00
ce458ccf-40f8-405b-a6e7-29d6cb9f49f2	Bruce Davis	bruced2004@icloud.com	$2b$12$9F25GT2eukiEbKiMK9rateOYnN1OCntY2p2zmwNyUqlOA2KBXJv56	active	2026-04-08 16:50:26.560855+00	2026-04-08 16:50:26.560862+00
6e123cc1-0754-48d8-8981-0966a6b54932	Denarii Crosby	bigdoubleup0@icloud.com	$2b$12$uR7iRS1hQi85AUsE5oKwIOxpC.wXTiLd6Ed9a/9NyppYEGt2Ubwwy	active	2026-04-08 16:51:05.266191+00	2026-04-08 16:51:05.266199+00
3c162039-9cae-4363-87ff-d55364aa7450	Donte	dontepeterkin1@gmail.com	$2b$12$MK6fD44U8RUcXmwrDiflROwlqk3tIryriFVbw1kAlwYX4Z6VQzaBy	active	2026-04-08 16:51:46.962006+00	2026-04-08 16:51:46.962012+00
55a24e05-5430-4482-bf73-7d93fcdae8c9	daquante	daquantepeterkin81@gmail.com	$2b$12$KcJBdjBVB4Hc/I2w1SgjGuoivZx./e06vbqYu7Dm53Vf46ALkYKqi	active	2026-04-08 16:53:16.072254+00	2026-04-08 16:53:16.072264+00
e7627500-2e1c-4355-b53d-104bbfd69af2	Delontae Smith	delontaesmith5@gmail.com	$2b$12$jqUMiLxlO7xLuRanLnFpnO.zCL92E0JQj1A2HRLZz2h0BjkzBpL42	active	2026-04-08 17:05:45.766752+00	2026-04-08 17:05:45.76676+00
e7ae440c-aa34-4788-a39d-2150ae058f50	partcipant	participant@hope.local	$2b$12$3aIeBs8yv.3NiNQuOaqNSO.iPo3oQlVoq.t80vUgbA4ttlpKbREae	active	2026-03-26 03:00:55.930315+00	2026-04-09 00:40:53.188138+00
4d88a7c5-29ff-4794-afe1-e92c309c51a8	Raabit Hassan	raabithassan@gmail.com	$2b$12$qVUg27mV0Xvg1DwhYrL/RuqfijrXt3BRfuXR6QHGv68Ojq0d9Xdfu	active	2026-04-11 18:42:29.364007+00	2026-04-11 18:42:29.364012+00
a9f58df5-d5a7-4892-bb98-df922ea9f8c9	Test User	test@example.com	$2b$12$aJ4Gc3hTpGFVnIHXmCpNKuY7COZPpqguFVNWgnny2KJIzcQeeSCTS	active	2026-04-13 00:05:48.270206+00	2026-04-13 00:05:48.270212+00
f3d4b3dc-846f-4b01-adb6-61ed63e03980	jjjb	saampletest@gmail.com	$2b$12$2aBLCiZaukcT34xHryzJDOB1rHMcWpBK/YHFxwqSqouLkaTrLrl9C	active	2026-04-13 00:22:58.399175+00	2026-04-13 00:22:58.39918+00
6a00cc98-8166-4996-9498-551ed89c5288	New Test User	newtest@example.com	$2b$12$gXiil0Qfflyl8AmuIiI8Z.Ev4eyIYnY7l8A9OVTaltCCV7NHWERKi	active	2026-04-13 00:25:10.501832+00	2026-04-13 00:25:10.501838+00
6c6a66ef-e561-49fe-b5b6-81512bae53bb	Ananath	anana@gmail.com	$2b$12$2lewPZ4QGbTysLqgxmM4s.L8XRMscU0HvynPg1z9/Evv0gcHnMakS	active	2026-04-13 01:23:29.644478+00	2026-04-13 01:23:29.644486+00
9b22830e-166d-42a5-a5fa-4115ec2db547	Instructor	instructor@hope.local	$2b$12$DXpZL7nLbl3fDrPpS.E/POwbNZYdGd9Bymvh5H/hdu1Q3rUcDUbNq	active	2026-03-26 03:00:55.930315+00	2026-04-16 02:13:45.466503+00
ead3b963-d3de-447f-9f9a-6587398252bd	Iris	iris@hope.local	$2b$12$DOW5iYMrI9hat6lDAIBMXOPLvrhrjCbt4cwdXywV1jM.I1n3S7.s.	active	2026-04-16 02:35:34.950398+00	2026-04-16 02:35:34.950404+00
537511af-dd0d-45dd-9ea9-fd24d275ce58	kar	rc62373@umbc.edu	$2b$12$cQYJbBuwAjDri2/.6Klmfe643UdfXUMWBXjlLqf.sDypk3Amcmgc.	active	2026-04-28 17:46:57.826165+00	2026-04-28 17:46:57.826176+00
86cd3cb7-b88f-47f5-b173-dbc548373991	ana	anantest@gmail.com	$2b$12$9n0XXfxUKthLVqz1U8M0R.yA8VK30OSeGc9W56l9vhbQ6iAM4ElUG	active	2026-04-28 18:16:29.284081+00	2026-04-28 18:16:29.284089+00
5591125c-9124-403d-850e-bd6de2df0c68	test	test@gmail.com	$2b$12$dp2RnCS41HyIBkb3x/nKMuYbXgeENrW2iRu3uzJ/qJYgCMWRQZ/QG	active	2026-04-28 18:53:53.980123+00	2026-04-28 18:53:53.980133+00
\.


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hope_database_6709_user
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: assessment_attempts assessment_attempts_assessment_id_user_id_attempt_number_key; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_assessment_id_user_id_attempt_number_key UNIQUE (assessment_id, user_id, attempt_number);


--
-- Name: assessment_attempts assessment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_pkey PRIMARY KEY (id);


--
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: completion_criteria completion_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.completion_criteria
    ADD CONSTRAINT completion_criteria_pkey PRIMARY KEY (id);


--
-- Name: completion_criteria completion_criteria_training_id_key; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.completion_criteria
    ADD CONSTRAINT completion_criteria_training_id_key UNIQUE (training_id);


--
-- Name: completions completions_certificate_id_key; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.completions
    ADD CONSTRAINT completions_certificate_id_key UNIQUE (certificate_id);


--
-- Name: completions completions_enrollment_id_key; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.completions
    ADD CONSTRAINT completions_enrollment_id_key UNIQUE (enrollment_id);


--
-- Name: completions completions_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.completions
    ADD CONSTRAINT completions_pkey PRIMARY KEY (id);


--
-- Name: completions completions_verification_code_key; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.completions
    ADD CONSTRAINT completions_verification_code_key UNIQUE (verification_code);


--
-- Name: content_items content_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_pkey PRIMARY KEY (id);


--
-- Name: content_progress content_progress_enrollment_id_content_id_key; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.content_progress
    ADD CONSTRAINT content_progress_enrollment_id_content_id_key UNIQUE (enrollment_id, content_id);


--
-- Name: content_progress content_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.content_progress
    ADD CONSTRAINT content_progress_pkey PRIMARY KEY (id);


--
-- Name: course_content course_content_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.course_content
    ADD CONSTRAINT course_content_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_user_id_training_id_key; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_training_id_key UNIQUE (user_id, training_id);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: module_progress module_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.module_progress
    ADD CONSTRAINT module_progress_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: onboarding_progress onboarding_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.onboarding_progress
    ADD CONSTRAINT onboarding_progress_pkey PRIMARY KEY (id);


--
-- Name: onboarding_progress onboarding_progress_user_id_training_id_key; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.onboarding_progress
    ADD CONSTRAINT onboarding_progress_user_id_training_id_key UNIQUE (user_id, training_id);


--
-- Name: onboarding_submissions onboarding_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.onboarding_submissions
    ADD CONSTRAINT onboarding_submissions_pkey PRIMARY KEY (id);


--
-- Name: participant_responses participant_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.participant_responses
    ADD CONSTRAINT participant_responses_pkey PRIMARY KEY (id);


--
-- Name: participant_responses participant_responses_question_id_user_id_attempt_number_key; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.participant_responses
    ADD CONSTRAINT participant_responses_question_id_user_id_attempt_number_key UNIQUE (question_id, user_id, attempt_number);


--
-- Name: question_options question_options_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT question_options_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: training_comments training_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.training_comments
    ADD CONSTRAINT training_comments_pkey PRIMARY KEY (id);


--
-- Name: trainings trainings_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_assessments_training; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_assessments_training ON public.assessments USING btree (training_id);


--
-- Name: idx_attempts_assessment; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_attempts_assessment ON public.assessment_attempts USING btree (assessment_id);


--
-- Name: idx_attempts_user; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_attempts_user ON public.assessment_attempts USING btree (user_id);


--
-- Name: idx_comments_training; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_comments_training ON public.training_comments USING btree (training_id);


--
-- Name: idx_comments_user; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_comments_user ON public.training_comments USING btree (user_id);


--
-- Name: idx_content_lesson; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_content_lesson ON public.content_items USING btree (lesson_id);


--
-- Name: idx_lessons_module; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_lessons_module ON public.lessons USING btree (module_id);


--
-- Name: idx_modules_training; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_modules_training ON public.modules USING btree (training_id);


--
-- Name: idx_options_question; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_options_question ON public.question_options USING btree (question_id);


--
-- Name: idx_questions_assessment; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_questions_assessment ON public.questions USING btree (assessment_id);


--
-- Name: idx_responses_assessment; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_responses_assessment ON public.participant_responses USING btree (assessment_id);


--
-- Name: idx_responses_user; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX idx_responses_user ON public.participant_responses USING btree (user_id);


--
-- Name: ix_content_progress_enrollment; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX ix_content_progress_enrollment ON public.content_progress USING btree (enrollment_id);


--
-- Name: ix_course_content_training_id; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE INDEX ix_course_content_training_id ON public.course_content USING btree (training_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: hope_database_6709_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: assessment_attempts assessment_attempts_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;


--
-- Name: assessment_attempts assessment_attempts_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- Name: assessment_attempts assessment_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: assessments assessments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: assessments assessments_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.users(id);


--
-- Name: attendances attendances_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id);


--
-- Name: attendances attendances_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id);


--
-- Name: completion_criteria completion_criteria_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.completion_criteria
    ADD CONSTRAINT completion_criteria_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: completions completions_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.completions
    ADD CONSTRAINT completions_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id);


--
-- Name: completions completions_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.completions
    ADD CONSTRAINT completions_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id);


--
-- Name: content_items content_items_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: content_progress content_progress_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.content_progress
    ADD CONSTRAINT content_progress_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.course_content(id) ON DELETE CASCADE;


--
-- Name: content_progress content_progress_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.content_progress
    ADD CONSTRAINT content_progress_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: content_progress content_progress_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.content_progress
    ADD CONSTRAINT content_progress_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- Name: course_content course_content_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.course_content
    ADD CONSTRAINT course_content_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id);


--
-- Name: enrollments enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lesson_progress lesson_progress_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: module_progress module_progress_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.module_progress
    ADD CONSTRAINT module_progress_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- Name: module_progress module_progress_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.module_progress
    ADD CONSTRAINT module_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: modules modules_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: onboarding_progress onboarding_progress_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.onboarding_progress
    ADD CONSTRAINT onboarding_progress_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id);


--
-- Name: onboarding_progress onboarding_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.onboarding_progress
    ADD CONSTRAINT onboarding_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: onboarding_submissions onboarding_submissions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.onboarding_submissions
    ADD CONSTRAINT onboarding_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: onboarding_submissions onboarding_submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.onboarding_submissions
    ADD CONSTRAINT onboarding_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: participant_responses participant_responses_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.participant_responses
    ADD CONSTRAINT participant_responses_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;


--
-- Name: participant_responses participant_responses_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.participant_responses
    ADD CONSTRAINT participant_responses_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- Name: participant_responses participant_responses_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.participant_responses
    ADD CONSTRAINT participant_responses_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.users(id);


--
-- Name: participant_responses participant_responses_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.participant_responses
    ADD CONSTRAINT participant_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: participant_responses participant_responses_selected_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.participant_responses
    ADD CONSTRAINT participant_responses_selected_option_id_fkey FOREIGN KEY (selected_option_id) REFERENCES public.question_options(id);


--
-- Name: participant_responses participant_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.participant_responses
    ADD CONSTRAINT participant_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: question_options question_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT question_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: questions questions_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;


--
-- Name: training_comments training_comments_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.training_comments
    ADD CONSTRAINT training_comments_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: training_comments training_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.training_comments
    ADD CONSTRAINT training_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trainings trainings_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: trainings trainings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hope_database_6709_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO hope_database_6709_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO hope_database_6709_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO hope_database_6709_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO hope_database_6709_user;


--
-- PostgreSQL database dump complete
--

\unrestrict 8wqwMlWxRI6Y3I3shM4tJA41awF9Q1MJ3VqHBWhaivZIXzuVv2v90xf8z45aeHf

