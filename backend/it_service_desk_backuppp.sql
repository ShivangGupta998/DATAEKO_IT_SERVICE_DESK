--
-- PostgreSQL database dump
--

\restrict 6MKYUaMVxvbwFw1ldcHnnT9bZBzNMebESsaIgCL2TT1afvgbhnd6wWBOwallg67

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.access_requests (
    id integer NOT NULL,
    requester_id integer NOT NULL,
    access_type character varying(100) NOT NULL,
    resource_name character varying(150) NOT NULL,
    reason text NOT NULL,
    status character varying(30) NOT NULL,
    approved_by integer,
    approval_comment text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.access_requests OWNER TO postgres;

--
-- Name: access_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.access_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.access_requests_id_seq OWNER TO postgres;

--
-- Name: access_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.access_requests_id_seq OWNED BY public.access_requests.id;


--
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    asset_tag character varying(50) NOT NULL,
    asset_type character varying(100) NOT NULL,
    manufacturer character varying(100) NOT NULL,
    model character varying(100) NOT NULL,
    serial_number character varying(100) NOT NULL,
    assigned_to integer,
    status character varying(30) NOT NULL,
    purchase_date date,
    created_at timestamp without time zone,
    cost numeric(10,2)
);


ALTER TABLE public.assets OWNER TO postgres;

--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assets_id_seq OWNER TO postgres;

--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: knowledge_articles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_articles (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    category character varying(100) NOT NULL,
    created_by integer NOT NULL,
    is_published boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.knowledge_articles OWNER TO postgres;

--
-- Name: knowledge_articles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knowledge_articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knowledge_articles_id_seq OWNER TO postgres;

--
-- Name: knowledge_articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.knowledge_articles_id_seq OWNED BY public.knowledge_articles.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    message character varying(500) NOT NULL,
    notification_type character varying(50) NOT NULL,
    is_read boolean,
    created_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: offboarding_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offboarding_requests (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    initiated_by integer NOT NULL,
    last_working_date date NOT NULL,
    reason character varying(100) NOT NULL,
    status character varying(30) NOT NULL,
    asset_returned boolean,
    access_revoked boolean,
    completed_by integer,
    completion_comment text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.offboarding_requests OWNER TO postgres;

--
-- Name: offboarding_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.offboarding_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offboarding_requests_id_seq OWNER TO postgres;

--
-- Name: offboarding_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.offboarding_requests_id_seq OWNED BY public.offboarding_requests.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer,
    permission_id integer
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: ticket_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_activities (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    user_id integer NOT NULL,
    action character varying(100) NOT NULL,
    comment text,
    created_at timestamp without time zone
);


ALTER TABLE public.ticket_activities OWNER TO postgres;

--
-- Name: ticket_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_activities_id_seq OWNER TO postgres;

--
-- Name: ticket_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_activities_id_seq OWNED BY public.ticket_activities.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    priority character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    source character varying(50) NOT NULL,
    requester_id integer NOT NULL,
    assignee_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    sla_due timestamp without time zone,
    resolved_at timestamp without time zone
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_id_seq OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    is_active boolean,
    role_id integer,
    department_id integer,
    slack_user_id character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: access_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests ALTER COLUMN id SET DEFAULT nextval('public.access_requests_id_seq'::regclass);


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: knowledge_articles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_articles ALTER COLUMN id SET DEFAULT nextval('public.knowledge_articles_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: offboarding_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offboarding_requests ALTER COLUMN id SET DEFAULT nextval('public.offboarding_requests_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: ticket_activities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_activities ALTER COLUMN id SET DEFAULT nextval('public.ticket_activities_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: access_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.access_requests (id, requester_id, access_type, resource_name, reason, status, approved_by, approval_comment, created_at, updated_at) FROM stdin;
1	6	VPN	Production VPN	Need access for deployment work	Approved	4	Approved for deployment work	2026-08-07 06:59:18.470893	2026-08-07 07:02:45.636082
2	4	Software	Jira	Admin RBAC testing	Rejected	4	Rejected during testing	2026-08-16 09:50:06.584183	2026-08-16 09:51:42.161068
3	6	Read/Write	GitHub Enterprise	azxdtfcygvuhbjnmcgvhbn	Approved	4	\N	2026-08-26 06:32:51.840813	2026-08-26 10:27:51.705362
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assets (id, asset_tag, asset_type, manufacturer, model, serial_number, assigned_to, status, purchase_date, created_at, cost) FROM stdin;
1	LAP-001	Laptop	HP	EliteBook 840 G11	SN123456	6	Assigned	2026-08-07	2026-08-07 06:08:29.894981	\N
2	dfgh	Hardware	Apple	fight	xdfcgvhbjk	6	Assigned	\N	2026-08-26 06:45:23.273346	12000.00
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name) FROM stdin;
1	IT
2	HR
3	Finance
4	Operations
\.


--
-- Data for Name: knowledge_articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_articles (id, title, content, category, created_by, is_published, created_at, updated_at) FROM stdin;
1	VPN Connection Issue	If VPN is not connecting, restart the VPN client and login again.	VPN	4	t	2026-08-07 07:38:01.978333	2026-08-07 07:38:01.978334
3	Persistent Test Article	Testing persistent storage directly in PostgreSQL.	General	3	t	2026-08-26 12:48:23.413811	2026-08-26 12:48:23.413811
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, notification_type, is_read, created_at) FROM stdin;
2	6	Ticket Created	Your ticket #16 has been created	Ticket	t	2026-08-07 18:09:41.212025+05:30
1	4	Ticket Created	Your ticket #15 has been created	Ticket	t	2026-08-07 15:13:23.530022+05:30
4	6	Ticket Updated	Your ticket #17 has been updated	Ticket	t	2026-08-12 11:11:18.787602+05:30
3	6	Ticket Created	Your ticket #17 has been created	Ticket	t	2026-08-12 11:05:22.619548+05:30
5	6	Ticket Created	Your ticket #18 has been created	Ticket	t	2026-08-12 11:51:12.990542+05:30
7	5	Ticket Assigned	Ticket #18 has been assigned to you.	Ticket	t	2026-08-12 12:02:22.452281+05:30
8	6	Ticket Updated	Your ticket #18 has been updated	Ticket	t	2026-08-12 12:21:32.28198+05:30
6	6	Ticket Updated	Your ticket #18 has been updated	Ticket	t	2026-08-12 12:02:22.427987+05:30
19	6	Ticket Created	Your ticket #22 has been created	Ticket	t	2026-08-16 16:02:43.804052+05:30
18	6	Ticket Updated	Your ticket #21 has been updated	Ticket	t	2026-08-16 15:55:43.885619+05:30
17	6	Ticket Updated	Your ticket #21 has been updated	Ticket	t	2026-08-16 15:52:25.156142+05:30
15	6	Ticket Updated	Your ticket #21 has been updated	Ticket	t	2026-08-16 15:51:15.632207+05:30
14	6	Ticket Created	Your ticket #21 has been created	Ticket	t	2026-08-16 15:49:16.191239+05:30
9	4	Ticket Created	Your ticket #19 has been created	Ticket	t	2026-08-16 14:27:31.964827+05:30
10	4	Ticket Created	Your ticket #20 has been created	Ticket	t	2026-08-16 15:11:27.826691+05:30
11	4	Ticket Updated	Your ticket #20 has been updated	Ticket	t	2026-08-16 15:12:12.733085+05:30
12	4	Ticket Updated	Your ticket #20 has been updated	Ticket	t	2026-08-16 15:15:21.275235+05:30
20	6	Ticket Updated	Your ticket #22 has been updated	Ticket	t	2026-08-16 16:04:21.994466+05:30
21	5	Ticket Assigned	Ticket #22 has been assigned to you.	Ticket	t	2026-08-16 16:04:21.999489+05:30
16	5	Ticket Assigned	Ticket #21 has been assigned to you.	Ticket	t	2026-08-16 15:51:15.649539+05:30
13	5	Ticket Assigned	Ticket #20 has been assigned to you.	Ticket	t	2026-08-16 15:15:21.285426+05:30
22	6	Ticket Created	Your ticket #23 has been created	Ticket	t	2026-08-16 20:44:34.120945+05:30
23	6	Ticket Updated	Your ticket #23 has been updated	Ticket	t	2026-08-16 21:56:15.298197+05:30
24	5	Ticket Assigned	Ticket #23 has been assigned to you.	Ticket	t	2026-08-16 21:56:15.32771+05:30
25	4	Ticket Updated	Your ticket #25 has been updated	Ticket	t	2026-08-17 15:08:12.142323+05:30
26	5	Ticket Assigned	Ticket #25 has been assigned to you.	Ticket	t	2026-08-17 15:08:12.162493+05:30
\.


--
-- Data for Name: offboarding_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offboarding_requests (id, employee_id, initiated_by, last_working_date, reason, status, asset_returned, access_revoked, completed_by, completion_comment, created_at, updated_at) FROM stdin;
1	6	4	2026-08-30	Resignation	Completed	t	t	4	Laptop collected and all accounts disabled	2026-08-07 07:22:50.449164	2026-08-07 07:27:31.975938
2	6	4	2026-08-30	Admin RBAC testing	In Progress	f	f	\N	Process started	2026-08-16 09:52:17.375107	2026-08-16 09:53:29.420828
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, description) FROM stdin;
1	manage_users	Create, update and delete users
2	manage_settings	Manage application settings
3	view_reports	View reports and analytics
4	manage_tickets	Manage all tickets
5	update_ticket	Update assigned tickets
6	create_ticket	Create new tickets
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, permission_id) FROM stdin;
1	1	1
2	1	2
3	1	3
4	1	4
5	1	5
6	1	6
7	4	6
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description) FROM stdin;
1	Admin	System Administrator
2	Manager	Department Manager
3	Technician	IT Support Technician
4	Employee	End User
\.


--
-- Data for Name: ticket_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_activities (id, ticket_id, user_id, action, comment, created_at) FROM stdin;
1	1	4	created	Ticket created	2026-07-31 08:16:49.23081
2	2	4	created	Ticket created	2026-07-31 08:16:50.072909
3	2	4	updated	Ticket assigned to user 3	2026-08-02 09:11:29.243711
4	2	4	updated	Status changed to in_progress | IT agent started investigating the issue.	2026-08-02 09:12:49.974001
5	2	4	updated	Status changed to resolved | Wi-Fi driver was repaired and connection restored.	2026-08-02 09:13:33.700406
6	2	4	updated	Status changed to resolved | Wi-Fi driver was repaired and connection restored.	2026-08-02 09:13:39.435033
7	2	4	updated	Status changed to closed | Employee confirmed that the issue is resolved.	2026-08-02 09:14:12.118275
8	3	4	created	Ticket created	2026-08-02 11:29:37.007287
9	1	4	updated	Ticket assigned to user 4	2026-08-02 11:38:26.739533
10	4	4	created	Ticket created from Slack	2026-08-02 11:49:22.990037
11	5	4	created	Ticket created	2026-08-03 11:52:29.88611
12	6	4	created	Ticket created	2026-08-03 12:02:17.675707
13	6	4	updated	Status changed from open to in_progress | Priority changed from high to high | Comment: Technician started investigating the VPN issue.	2026-08-04 05:44:38.407711
14	6	4	updated	Ticket assigned from None to 5	2026-08-04 06:23:49.70222
15	6	5	updated	Status changed from in_progress to resolved | Comment: VPN configuration was fixed and connectivity was restored.	2026-08-04 06:34:13.91837
16	6	5	updated	Status changed from resolved to in_progress | Comment: Technician is continuing investigation.	2026-08-04 06:38:46.145805
17	7	4	created	Ticket created from Slack	2026-08-04 06:50:25.253823
18	8	4	created	Ticket created from Slack	2026-08-04 06:52:25.960168
19	9	4	created	Ticket created from Slack	2026-08-04 07:06:12.379545
20	10	4	created	Ticket created from Slack	2026-08-04 07:08:03.394209
21	9	4	updated	Ticket assigned from None to 5	2026-08-04 07:09:12.294643
22	9	5	updated	Status changed from open to in_progress | Comment: Technician started investigating the VPN issue.	2026-08-04 09:06:59.315567
23	9	5	updated	Status changed from in_progress to in_progress | Comment: Technician started investigating the VPN issue.	2026-08-04 09:07:00.631978
24	9	5	updated	Status changed from in_progress to resolved | Comment: VPN configuration was fixed and connectivity was restored.	2026-08-04 11:39:53.225981
25	11	4	created	Ticket created from Slack	2026-08-04 11:54:17.478811
26	11	4	updated	Ticket assigned from None to 5	2026-08-04 12:20:16.793287
27	11	5	updated	Status changed from open to in_progress	2026-08-05 05:02:40.857373
28	12	4	created	Ticket created	2026-08-06 09:32:28.157203
29	13	4	created	Ticket created	2026-08-06 09:36:20.614972
30	14	4	created	Ticket created	2026-08-06 10:12:00.090127
31	14	4	updated	Status changed from open to resolved	2026-08-06 10:26:29.049732
32	15	4	created	Ticket created	2026-08-07 09:43:23.53391
33	16	6	created	Ticket created	2026-08-07 12:39:41.214725
34	17	6	created	Ticket created	2026-08-12 05:35:22.622659
35	17	4	updated	Assigned to technician technician1	2026-08-12 05:41:18.807438
36	18	6	created	Ticket created	2026-08-12 06:21:12.993751
37	18	4	updated	Assigned to technician technician1	2026-08-12 06:32:22.446214
38	18	5	updated	Status changed from open to in_progress | Comment: soon will done	2026-08-12 06:51:32.312787
39	19	4	created	Ticket created	2026-08-16 08:57:31.968512
40	20	4	created	Ticket created	2026-08-16 09:41:27.828606
41	20	4	updated	Priority changed from medium to high	2026-08-16 09:42:12.738647
42	20	4	updated	Assigned to technician technician1	2026-08-16 09:45:21.279457
43	21	6	created	Ticket created	2026-08-16 10:19:16.196241
44	21	4	updated	Assigned to technician technician1	2026-08-16 10:21:15.646065
45	21	4	updated	Status changed from open to closed | Priority changed from medium to critical | Comment: done bro	2026-08-16 10:22:25.160633
46	21	5	updated	Status changed from closed to resolved | Priority changed from critical to high | Comment: done	2026-08-16 10:25:43.900021
47	22	6	created	Ticket created	2026-08-16 10:32:43.80464
48	22	4	updated	Assigned to technician technician1	2026-08-16 10:34:21.995694
49	23	6	created	Ticket created	2026-08-16 15:14:34.123663
50	23	7	updated	Assigned to technician technician1 | Comment: fgv4ferf34rf	2026-08-16 16:26:15.316084
51	24	4	created	Ticket created from Slack	2026-08-17 09:30:10.14314
52	25	4	created	Ticket created from Slack	2026-08-17 09:34:26.822947
53	25	7	updated	Status changed from open to in_progress | Assigned to technician technician1 | Comment: go to safari and go to setting	2026-08-17 09:38:12.160088
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, title, description, category, priority, status, source, requester_id, assignee_id, created_at, updated_at, sla_due, resolved_at) FROM stdin;
25	Unable to access the company portal on Safari	Unable to access the company portal on Safari	general	medium	in_progress	slack	4	5	2026-08-17 09:34:26.798173	2026-08-17 09:38:12.155459	\N	\N
2	Laptop Wi-Fi is not working	My laptop cannot connect to the office Wi-Fi network.	Hardware	high	closed	web	4	3	2026-07-31 08:16:50.070525	2026-08-02 09:14:12.115536	\N	\N
3	Laptop WiFi issue	My laptop cannot connect to the office WiFi network.	network	high	open	web	4	\N	2026-08-02 11:29:36.992767	2026-08-02 11:29:36.99277	\N	\N
1	Laptop Wi-Fi is not working	My laptop cannot connect to the office Wi-Fi network.	Hardware	high	open	web	4	4	2026-07-31 08:16:49.179945	2026-08-02 11:38:26.726009	\N	\N
4	My laptop WiFi is not working	My laptop WiFi is not working	general	medium	open	slack	4	\N	2026-08-02 11:49:22.959569	2026-08-02 11:49:22.959575	\N	\N
5	VPN is not working	I cannot connect to the company VPN from my laptop.	Network	high	open	web	4	\N	2026-08-03 11:52:29.840099	2026-08-03 11:52:29.840101	\N	\N
6	VPN is not working	I cannot connect to the company VPN from my laptop.	Network	high	in_progress	web	4	5	2026-08-03 12:02:17.642252	2026-08-04 06:38:46.137343	\N	\N
7	My laptop WiFi is not working	My laptop WiFi is not working	general	medium	open	slack	4	\N	2026-08-04 06:50:25.205359	2026-08-04 06:50:25.205361	\N	\N
8	My laptop WiFi is not working	My laptop WiFi is not working	general	medium	open	slack	4	\N	2026-08-04 06:52:25.954095	2026-08-04 06:52:25.954099	\N	\N
10	hello boy	hello boy	general	medium	open	slack	4	\N	2026-08-04 07:08:03.342519	2026-08-04 07:08:03.342521	\N	\N
9	My laptop VPN is not working	My laptop VPN is not working	general	medium	resolved	slack	4	5	2026-08-04 07:06:12.365667	2026-08-04 11:39:53.208776	\N	\N
11	test	test	general	medium	in_progress	slack	4	5	2026-08-04 11:54:17.46861	2026-08-05 05:02:40.831937	\N	\N
12	VPN not working	Unable to connect to company VPN	Network	critical	open	web	4	\N	2026-08-06 09:32:27.973507	2026-08-06 09:32:27.973508	2026-08-06 11:32:27.970787	\N
13	VPN not working	Unable to connect to company VPN	Network	critical	open	web	4	\N	2026-08-06 09:36:20.607994	2026-08-06 09:36:20.607995	2026-08-06 11:36:20.606983	\N
14	Laptop not working	System is not booting	Hardware	high	resolved	web	4	\N	2026-08-06 10:12:00.047586	2026-08-06 10:26:29.030682	2026-08-06 18:12:00.043846	2026-08-06 10:26:29.026198
15	VPN issue	VPN is not connecting	Network	high	open	web	4	\N	2026-08-07 09:43:23.516953	2026-08-07 09:43:23.516954	2026-08-07 17:43:23.515721	\N
16	Unable to access company VPN	I am unable to connect to the company VPN since this morning. It shows "Connection timed out". I have restarted my laptop and internet connection, but the issue still exists. Please investigate.	network	medium	open	web	6	\N	2026-08-07 12:39:41.192538	2026-08-07 12:39:41.19254	2026-08-08 12:39:41.187868	\N
17	VPN is not working	I cannot connect to the company VPN	network	medium	open	web	6	5	2026-08-12 05:35:22.598728	2026-08-12 05:41:18.802743	2026-08-13 05:35:22.589482	\N
18	tic tic	tooooo  foooooo.  looooo	hardware	low	in_progress	web	6	5	2026-08-12 06:21:12.982069	2026-08-12 06:51:32.308316	2026-08-15 06:21:12.980923	\N
19	RBAC Admin Test Ticket	Testing ticket creation using Admin role	hardware	low	open	web	4	\N	2026-08-16 08:57:31.935999	2026-08-16 08:57:31.936002	2026-08-19 08:57:31.934109	\N
20	Admin RBAC Test	Testing administrator permissions	IT	high	open	web	4	5	2026-08-16 09:41:27.799609	2026-08-16 09:45:21.277784	2026-08-16 17:42:12.732473	\N
21	Laptop not connecting to WiFi	My office laptop cannot connect to the company WiFi.	hardware	high	resolved	web	6	5	2026-08-16 10:19:16.174095	2026-08-16 10:25:43.895133	2026-08-16 18:25:43.883164	2026-08-16 15:55:43.883119
22	Notification Test	Testing notification	hardware	high	open	web	6	5	2026-08-16 10:32:43.788587	2026-08-16 10:34:21.995306	2026-08-16 18:32:43.787372	\N
23	heloo brp	oooooojbhedvchvcuhvwdhibihvchwevdcihbvwjcbxjwdbc	hardware	medium	open	web	6	5	2026-08-16 15:14:34.104031	2026-08-16 16:26:15.311579	2026-08-17 15:14:34.097647	\N
24	Unable to access the company portal on Safari	Unable to access the company portal on Safari	general	medium	open	slack	4	\N	2026-08-17 09:30:10.116878	2026-08-17 09:30:10.116884	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, hashed_password, is_active, role_id, department_id, slack_user_id) FROM stdin;
3	admin	admin@test.com	$2b$12$8NEGnEG/Yk85aZGpNEvj4uMDgjpyGWTYp289PGmLqmTbxNgsObuDS	t	1	1	\N
5	technician1	technician@itservicedesk.com	$2b$12$BSiPUN3ujJqxCm8EvBs4S.T04vr4xy1fw/aaAGhKS5dcRzNaT/pIW	t	3	1	\N
4	abhi	abhi@itservicedesk.com	$2b$12$9N52Lmma62v0bI.UYesOSeeceQP.AIkZSWy8QnGfuH/tE2UpeJHFm	t	1	1	U0BBD6HR2JC
6	employee1	employee@test.com	$2b$12$TfSC.MuiuJ.AP/9eqvrf2uNXgeo81Htbo9qrSdWxvcOgfKzFGwAOG	t	4	1	\N
7	manager1	manager1@itservicedesk.com	$2b$12$RhF1bLOHO.TmphvBwNsKL.WNA62X1RygTfFPBStCSjv3tP9KcB30.	t	2	1	\N
10	S.Gupta	s.gupta@dataeko.ai	$2b$12$ywnXvy5kJoas5rnw2pEB0erq7J42O4bUVQXeyf1mthUPNAvXrNwyO	t	2	2	\N
11	Prasanna.ch	p.chettu@dataeko.ai	$2b$12$R0CC9wVfu0qH/2FLcpu3reCwPNwquWjbN9LuBQBT/fEFNRO/h7mWC	t	3	2	\N
\.


--
-- Name: access_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.access_requests_id_seq', 3, true);


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assets_id_seq', 2, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 4, true);


--
-- Name: knowledge_articles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knowledge_articles_id_seq', 3, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 26, true);


--
-- Name: offboarding_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.offboarding_requests_id_seq', 2, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 6, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 7, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: ticket_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_activities_id_seq', 53, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_id_seq', 25, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: access_requests access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_pkey PRIMARY KEY (id);


--
-- Name: assets assets_asset_tag_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_asset_tag_key UNIQUE (asset_tag);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: assets assets_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_serial_number_key UNIQUE (serial_number);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: knowledge_articles knowledge_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_articles
    ADD CONSTRAINT knowledge_articles_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: offboarding_requests offboarding_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offboarding_requests
    ADD CONSTRAINT offboarding_requests_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: ticket_activities ticket_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_activities
    ADD CONSTRAINT ticket_activities_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_slack_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_slack_user_id_key UNIQUE (slack_user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: ix_access_requests_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_access_requests_id ON public.access_requests USING btree (id);


--
-- Name: ix_assets_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_assets_id ON public.assets USING btree (id);


--
-- Name: ix_departments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_departments_id ON public.departments USING btree (id);


--
-- Name: ix_knowledge_articles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_knowledge_articles_id ON public.knowledge_articles USING btree (id);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_offboarding_requests_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_offboarding_requests_id ON public.offboarding_requests USING btree (id);


--
-- Name: ix_permissions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_permissions_id ON public.permissions USING btree (id);


--
-- Name: ix_role_permissions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_role_permissions_id ON public.role_permissions USING btree (id);


--
-- Name: ix_roles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_roles_id ON public.roles USING btree (id);


--
-- Name: ix_ticket_activities_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ticket_activities_id ON public.ticket_activities USING btree (id);


--
-- Name: ix_tickets_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tickets_id ON public.tickets USING btree (id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: access_requests access_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: access_requests access_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id);


--
-- Name: assets assets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: knowledge_articles knowledge_articles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_articles
    ADD CONSTRAINT knowledge_articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: offboarding_requests offboarding_requests_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offboarding_requests
    ADD CONSTRAINT offboarding_requests_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id);


--
-- Name: offboarding_requests offboarding_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offboarding_requests
    ADD CONSTRAINT offboarding_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: offboarding_requests offboarding_requests_initiated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offboarding_requests
    ADD CONSTRAINT offboarding_requests_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: ticket_activities ticket_activities_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_activities
    ADD CONSTRAINT ticket_activities_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);


--
-- Name: ticket_activities ticket_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_activities
    ADD CONSTRAINT ticket_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tickets tickets_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id);


--
-- Name: tickets tickets_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id);


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 6MKYUaMVxvbwFw1ldcHnnT9bZBzNMebESsaIgCL2TT1afvgbhnd6wWBOwallg67

