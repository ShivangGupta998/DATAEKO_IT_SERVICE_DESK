--
-- PostgreSQL database dump
--

\restrict Ih3dY7nsoH9zUc4OVMDvujOPtzOc6yjLJ7wzD6llZuMWiMDbPWvhcrSX3rx5Z7X

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
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


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
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name) FROM stdin;
1	IT
2	HR
3	Finance
4	Operations
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
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, title, description, category, priority, status, source, requester_id, assignee_id, created_at, updated_at, sla_due, resolved_at) FROM stdin;
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
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, hashed_password, is_active, role_id, department_id, slack_user_id) FROM stdin;
3	admin	admin@test.com	$2b$12$8NEGnEG/Yk85aZGpNEvj4uMDgjpyGWTYp289PGmLqmTbxNgsObuDS	t	1	1	\N
5	technician1	technician@itservicedesk.com	$2b$12$BSiPUN3ujJqxCm8EvBs4S.T04vr4xy1fw/aaAGhKS5dcRzNaT/pIW	t	3	1	\N
4	abhi	abhi@itservicedesk.com	$2b$12$9N52Lmma62v0bI.UYesOSeeceQP.AIkZSWy8QnGfuH/tE2UpeJHFm	t	1	1	U0BBD6HR2JC
\.


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 4, true);


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

SELECT pg_catalog.setval('public.ticket_activities_id_seq', 27, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_id_seq', 11, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


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
-- Name: ix_departments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_departments_id ON public.departments USING btree (id);


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

\unrestrict Ih3dY7nsoH9zUc4OVMDvujOPtzOc6yjLJ7wzD6llZuMWiMDbPWvhcrSX3rx5Z7X

