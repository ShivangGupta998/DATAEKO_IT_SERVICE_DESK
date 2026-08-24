--
-- PostgreSQL database dump
--

\restrict awraMwQd7gwy2UYHvysTcapmGi1LWfgr3TAXl6Sxx82vdn1sfleSloZvW6bHS28

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
    cost numeric(10,2) DEFAULT 0.00
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
    sla_due timestamp without time zone,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
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
1	6	Standard Read/Write	GitHub Enterprise	Required for project repository access and deployment pipelines.	Approved	6	\N	2026-08-19 09:12:28.92719	2026-08-19 10:08:00.952363
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assets (id, asset_tag, asset_type, manufacturer, model, serial_number, assigned_to, status, purchase_date, created_at, cost) FROM stdin;
1	HW-MAC-2026-001	Hardware	Apple	A2991	C02G1234MD6R	9	Assigned	\N	2026-08-19 09:08:07.588846	0.00
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name) FROM stdin;
1	IT
2	Human Resources
3	Finance
4	Operations
\.


--
-- Data for Name: knowledge_articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_articles (id, title, content, category, created_by, is_published, created_at, updated_at) FROM stdin;
1	How to Setup Corporate VPN Access	### Overview\nFollow these steps to configure your corporate VPN client.\n\n### Instructions\n1. Download the approved VPN client software.\n2. Import your configuration profile provided by IT.\n3. Authenticate using your Single Sign-On (SSO) credentials.	Hardware	6	f	2026-08-19 09:32:31.677531	2026-08-19 09:32:31.677532
2	How to Connect to Corporate VPN using OpenVPN	### Overview\nFollow this guide to securely connect to the corporate network using OpenVPN from remote locations.\n\n### Prerequisites\n* Active employee credentials (SSO username and password)\n* Dual-factor authentication (2FA) configured on your mobile device\n\n### Setup Instructions\n1. Download and install the latest OpenVPN Connect client for your operating system.\n2. Download your personalized `.ovpn` configuration profile from the IT Portal.\n3. Import the `.ovpn` profile into the OpenVPN client interface.\n4. Click **Connect** and enter your SSO credentials when prompted.	Hardware	6	f	2026-08-19 09:44:31.524179	2026-08-19 09:44:31.524181
3	How to Connect to Corporate VPN using OpenVPN	### Overview\nFollow this guide to securely connect to the corporate network using OpenVPN from remote locations.\n\n### Prerequisites\n* Active employee credentials (SSO username and password)\n* Dual-factor authentication (2FA) configured on your mobile device\n\n### Setup Instructions\n1. Download and install the latest OpenVPN Connect client for your operating system.\n2. Download your personalized `.ovpn` configuration profile from the IT Portal.\n3. Import the `.ovpn` profile into the OpenVPN client interface.\n4. Click **Connect** and enter your SSO credentials when prompted.	Hardware	6	f	2026-08-19 09:52:14.619222	2026-08-19 09:52:14.619224
4	How to Connect to Corporate VPN using OpenVPN	### Overview\nFollow this guide to securely connect to the corporate network using OpenVPN from remote locations.\n\n### Prerequisites\n* Active employee credentials (SSO username and password)\n* Dual-factor authentication (2FA) configured on your mobile device\n\n### Setup Instructions\n1. Download and install the latest OpenVPN Connect client for your operating system.\n2. Download your personalized `.ovpn` configuration profile from the IT Portal.\n3. Import the `.ovpn` profile into the OpenVPN client interface.\n4. Click **Connect** and enter your SSO credentials when prompted.	Hardware	6	f	2026-08-19 09:56:20.847823	2026-08-19 09:56:20.847827
5	How to Connect to Corporate VPN using OpenVPN	## Overview\nFollow this guide to securely connect to the corporate network using OpenVPN from remote locations.\n\n### Prerequisites\n* Active employee credentials (SSO username and password)\n* Dual-factor authentication (2FA) configured on your mobile device\n\n### Setup Instructions\n1. Download and install the latest OpenVPN Connect client for your operating system.\n2. Download your personalized `.ovpn` configuration profile from the IT Portal.\n3. Import the `.ovpn` profile into the OpenVPN client interface.\n4. Click **Connect** and enter your SSO credentials when prompted.	Hardware	6	t	2026-08-19 10:01:34.152374	2026-08-19 10:01:34.152376
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, notification_type, is_read, created_at) FROM stdin;
1	6	Ticket Created	Your ticket #1 has been created	Ticket	t	2026-08-17 19:48:09.313834+05:30
4	8	Ticket Assigned	Ticket #1 has been assigned to you.	Ticket	f	2026-08-17 19:53:50.515855+05:30
3	6	Ticket Updated	Your ticket #1 has been updated	Ticket	t	2026-08-17 19:53:50.489301+05:30
2	9	Ticket Created	Your ticket #2 has been created	Ticket	t	2026-08-17 19:49:34.20209+05:30
7	8	Ticket Assigned	Ticket #3 has been assigned to you.	ticket	f	2026-08-20 11:18:37.366648+05:30
6	6	Ticket Updated	Your ticket #3 has been updated	ticket	t	2026-08-20 11:18:37.355931+05:30
10	8	Ticket Assigned	Ticket #5 has been assigned to you.	ticket	f	2026-08-20 11:39:34.843465+05:30
9	6	Ticket Updated	Your ticket #5 has been updated	ticket	t	2026-08-20 11:39:34.836485+05:30
8	6	Ticket Created	Your ticket #4 has been created	ticket	t	2026-08-20 11:33:56.227378+05:30
5	6	Ticket Created	Your ticket #3 has been created	ticket	t	2026-08-20 11:17:23.286+05:30
12	8	Ticket Assigned	Ticket #6 has been assigned to you.	ticket	f	2026-08-20 11:44:13.328876+05:30
11	6	Ticket Updated	Your ticket #6 has been updated	ticket	t	2026-08-20 11:44:13.321094+05:30
14	8	Ticket Assigned	Ticket #10 has been assigned to you.	ticket	f	2026-08-24 11:59:34.00021+05:30
13	6	Ticket Updated	Your ticket #10 has been updated	ticket	t	2026-08-24 11:59:33.992086+05:30
\.


--
-- Data for Name: offboarding_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offboarding_requests (id, employee_id, initiated_by, last_working_date, reason, status, asset_returned, access_revoked, completed_by, completion_comment, created_at, updated_at) FROM stdin;
4	6	6	2026-08-19	Employee departure and deprovisioning	Completed	f	f	6	\N	2026-08-19 09:30:34.97027	2026-08-19 10:10:21.051829
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, description) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, permission_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description) FROM stdin;
1	Admin	Full System Access
2	Manager	Tickets & Assets Management
3	Technician	Support & Operations
4	Employee	Standard User Access
\.


--
-- Data for Name: ticket_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_activities (id, ticket_id, user_id, action, comment, created_at) FROM stdin;
1	1	6	created	Ticket created	2026-08-17 14:18:09.31523
2	2	9	created	Ticket created	2026-08-17 14:19:34.202609
3	1	6	updated	Assigned to technician technician1 | Comment: 3ef3r4frfr	2026-08-17 14:23:50.502652
4	3	6	created	Ticket created	2026-08-20 05:47:23.287871
5	3	6	updated	Assigned to technician technician1 | Comment: ftdasdfghjk	2026-08-20 05:48:37.362275
6	4	6	created	Ticket created	2026-08-20 06:03:56.229043
7	5	6	created	Ticket created from Slack	2026-08-20 06:08:58.479242
8	5	6	updated	Assigned to technician technician1 | Comment: sdfghertyuiksdfghjkwertyuizxcvbnm,	2026-08-20 06:09:34.840241
9	6	6	created	Ticket created from Slack	2026-08-20 06:13:21.68371
10	6	6	updated	Assigned to technician technician1 | Comment: asdfghjkqwertyuizxcvbnmasdfghj	2026-08-20 06:14:13.324905
11	7	6	created	Ticket created from Slack	2026-08-24 05:17:24.324736
12	10	6	updated	Status changed from open to in_progress | Priority changed from Medium to medium | Assigned to technician technician1 | Comment: asdfghjqwertyuizxcvbnm,	2026-08-24 06:29:33.996921
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, title, description, category, priority, status, source, requester_id, assignee_id, sla_due, resolved_at, created_at, updated_at) FROM stdin;
2	technical prob in lapi	dvhcvcogfrfhr3ifhrjfbhrbfhifojbjbchvchee	hardware	high	open	web	9	\N	2026-08-17 22:19:34.19924	\N	2026-08-17 14:19:34.199792	2026-08-17 14:19:34.199793
1	vpn not connecting	hdweufwihfwihvdihwevhijcbdjcbojdwbcdvfhivwhfv	hardware	medium	open	web	6	8	2026-08-18 14:18:09.306942	\N	2026-08-17 14:18:09.308383	2026-08-17 14:23:50.4993
3	wifi not working	zxcvbnm,asdfghjklqwertyuioasdfghjklzxcvbnm,	hardware	medium	open	web	6	8	2026-08-21 05:47:23.271612	\N	2026-08-20 05:47:23.274372	2026-08-20 05:48:37.358752
4	net not working	asdfghjkwertyuiosdfghjkertyui	hardware	medium	open	web	6	\N	2026-08-21 06:03:56.21665	\N	2026-08-20 06:03:56.218481	2026-08-20 06:03:56.218483
5	Unable to access the company portal on Safari	Unable to access the company portal on Safari	general	medium	open	slack	6	8	\N	\N	2026-08-20 06:08:58.469699	2026-08-20 06:09:34.838489
6	Unable to access the company portal on Safari	Unable to access the company portal on Safari	general	medium	open	slack	6	8	\N	\N	2026-08-20 06:13:21.675543	2026-08-20 06:14:13.32253
7	Unable to access the company portal on Safari	Unable to access the company portal on Safari	general	medium	open	slack	6	\N	\N	\N	2026-08-24 05:17:24.313617	2026-08-24 05:17:24.313624
8	<@U0BMFNGF329> Unable to access the company wifi	<@U0BMFNGF329> Unable to access the company wifi	General	Medium	open	slack	6	\N	\N	\N	2026-08-24 06:26:05.85359	2026-08-24 06:26:05.853606
9	<@U0BMFNGF329> Unable to access the company wifi	<@U0BMFNGF329> Unable to access the company wifi	General	Medium	open	slack	6	\N	\N	\N	2026-08-24 06:26:35.374145	2026-08-24 06:26:35.374147
10	<@U0BMFNGF329> Unable to access the company wifi	<@U0BMFNGF329> Unable to access the company wifi	General	medium	in_progress	slack	6	8	2026-08-26 17:00:00	\N	2026-08-24 06:28:41.578785	2026-08-24 06:29:33.993962
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, hashed_password, is_active, role_id, department_id, slack_user_id) FROM stdin;
6	abhi	abhi@itservicedesk.com	$2b$12$yyrYmG0yigvxhkbtZpUdXuq09LJlOfE2fZHVlNprTlOn36c1Fiiki	t	1	1	\N
7	manager1	manager1@itservicedesk.com	$2b$12$f3JpkAmyFybrslD8dJJs9eEzoHEDfSoIgE31OhndfIUVBzwQCDo3K	t	2	1	\N
8	technician1	technician@itservicedesk.com	$2b$12$fSJHJBy42NTK3MSNavynm.Mn8VUkOfJZmilkZBK1NzH1qpWqXNQVG	t	3	1	\N
9	employee1	employee@test.com	$2b$12$emuxWvXzkzvTpy6V2hb7p.rtddn97dWWOY8H3htr/Ck1WUAiNjXO2	t	4	1	\N
10	testemployee	testemployee@gmail.com	$2b$12$Ux70HXK/WmZt1VtegDGFtuw0TM8E.wzorJjhw2J6RsUkw9wYkFTAy	t	4	1	\N
\.


--
-- Name: access_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.access_requests_id_seq', 1, true);


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assets_id_seq', 1, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 4, true);


--
-- Name: knowledge_articles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knowledge_articles_id_seq', 5, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 14, true);


--
-- Name: offboarding_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.offboarding_requests_id_seq', 4, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 1, false);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: ticket_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_activities_id_seq', 12, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


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
-- Name: ix_users_slack_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_slack_user_id ON public.users USING btree (slack_user_id);


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

\unrestrict awraMwQd7gwy2UYHvysTcapmGi1LWfgr3TAXl6Sxx82vdn1sfleSloZvW6bHS28

