--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (63f4182)
-- Dumped by pg_dump version 16.9

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

--
-- Name: enum_CallLogs_direction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_CallLogs_direction" AS ENUM (
    'inbound',
    'outbound'
);


--
-- Name: enum_CallLogs_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_CallLogs_status" AS ENUM (
    'completed',
    'missed',
    'voicemail',
    'busy',
    'failed'
);


--
-- Name: enum_EmailLogs_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_EmailLogs_status" AS ENUM (
    'draft',
    'sent',
    'failed',
    'delivered',
    'opened'
);


--
-- Name: enum_Notifications_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Notifications_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


--
-- Name: enum_Notifications_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Notifications_status" AS ENUM (
    'unread',
    'read',
    'archived'
);


--
-- Name: enum_Notifications_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Notifications_type" AS ENUM (
    'DEAL_STAGE_CHANGED',
    'TASK_DUE_SOON',
    'TASK_OVERDUE',
    'PROPERTY_STATUS_CHANGE',
    'DOCUMENT_UPLOADED',
    'CONTACT_ASSIGNED',
    'REPORT_READY',
    'SYSTEM_ALERT'
);


--
-- Name: enum_activities_communication_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_activities_communication_method AS ENUM (
    'phone',
    'email',
    'text',
    'in_person',
    'video_call'
);


--
-- Name: enum_activities_direction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_activities_direction AS ENUM (
    'inbound',
    'outbound'
);


--
-- Name: enum_activities_outcome; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_activities_outcome AS ENUM (
    'successful',
    'unsuccessful',
    'follow_up_required',
    'no_answer'
);


--
-- Name: enum_activities_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_activities_type AS ENUM (
    'call',
    'email',
    'meeting',
    'property_visit',
    'showing',
    'note',
    'task_completed',
    'document_uploaded',
    'deal_stage_change',
    'property_update',
    'contact_update',
    'system_event',
    'other'
);


--
-- Name: enum_companies_company_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_companies_company_type AS ENUM (
    'corporation',
    'llc',
    'partnership',
    'sole_proprietorship',
    'trust',
    'non_profit',
    'government',
    'other'
);


--
-- Name: enum_companies_credit_rating; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_companies_credit_rating AS ENUM (
    'AAA',
    'AA',
    'A',
    'BBB',
    'BB',
    'B',
    'CCC',
    'CC',
    'C',
    'D',
    'unrated'
);


--
-- Name: enum_companies_industry; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_companies_industry AS ENUM (
    'real_estate_investment',
    'real_estate_development',
    'property_management',
    'retail',
    'hospitality',
    'healthcare',
    'manufacturing',
    'technology',
    'finance',
    'legal',
    'construction',
    'other'
);


--
-- Name: enum_companies_lead_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_companies_lead_source AS ENUM (
    'referral',
    'website',
    'cold_call',
    'email_campaign',
    'social_media',
    'networking',
    'advertisement',
    'trade_show',
    'existing_client',
    'other'
);


--
-- Name: enum_companies_lead_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_companies_lead_status AS ENUM (
    'cold',
    'warm',
    'hot',
    'qualified',
    'customer',
    'inactive'
);


--
-- Name: enum_contacts_communication_frequency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_contacts_communication_frequency AS ENUM (
    'daily',
    'weekly',
    'bi_weekly',
    'monthly',
    'quarterly',
    'as_needed'
);


--
-- Name: enum_contacts_contact_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_contacts_contact_role AS ENUM (
    'tenant',
    'landlord',
    'buyer',
    'seller',
    'investor',
    'broker',
    'attorney',
    'lender',
    'contractor',
    'vendor',
    'other'
);


--
-- Name: enum_contacts_credit_rating; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_contacts_credit_rating AS ENUM (
    'A',
    'B',
    'C',
    'D',
    'unrated'
);


--
-- Name: enum_contacts_lead_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_contacts_lead_source AS ENUM (
    'referral',
    'website',
    'cold_call',
    'email_campaign',
    'social_media',
    'networking',
    'advertisement',
    'trade_show',
    'other'
);


--
-- Name: enum_contacts_lead_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_contacts_lead_status AS ENUM (
    'cold',
    'warm',
    'hot',
    'qualified',
    'converted',
    'lost',
    'inactive'
);


--
-- Name: enum_contacts_preferred_contact_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_contacts_preferred_contact_method AS ENUM (
    'email',
    'phone',
    'text',
    'mail'
);


--
-- Name: enum_contacts_timeframe; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_contacts_timeframe AS ENUM (
    'immediate',
    '30_days',
    '60_days',
    '90_days',
    '6_months',
    '1_year',
    'flexible'
);


--
-- Name: enum_contacts_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_contacts_type AS ENUM (
    'individual',
    'company'
);


--
-- Name: enum_deals_deal_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_deals_deal_type AS ENUM (
    'sale',
    'lease',
    'investment'
);


--
-- Name: enum_deals_lead_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_deals_lead_source AS ENUM (
    'referral',
    'website',
    'cold_call',
    'email_campaign',
    'social_media',
    'networking',
    'advertisement',
    'mls',
    'existing_client',
    'other'
);


--
-- Name: enum_deals_lost_reason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_deals_lost_reason AS ENUM (
    'price',
    'timing',
    'location',
    'terms',
    'competition',
    'financing',
    'condition',
    'other',
    'no_response'
);


--
-- Name: enum_deals_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_deals_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


--
-- Name: enum_deals_stage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_deals_stage AS ENUM (
    'prospecting',
    'qualification',
    'proposal',
    'negotiation',
    'contract',
    'due_diligence',
    'closing',
    'won',
    'lost'
);


--
-- Name: enum_documents_access_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_documents_access_level AS ENUM (
    'private',
    'team',
    'company',
    'client',
    'public'
);


--
-- Name: enum_documents_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_documents_category AS ENUM (
    'purchase_agreement',
    'lease_agreement',
    'listing_agreement',
    'offer_letter',
    'financial_statement',
    'rent_roll',
    'operating_statement',
    'appraisal',
    'environmental_report',
    'survey',
    'title_report',
    'insurance_certificate',
    'permit',
    'inspection_report',
    'marketing_material',
    'photo',
    'floorplan',
    'email',
    'letter',
    'memo',
    'other'
);


--
-- Name: enum_documents_document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_documents_document_type AS ENUM (
    'contract',
    'lease',
    'financial',
    'legal',
    'marketing',
    'inspection',
    'survey',
    'insurance',
    'permit',
    'correspondence',
    'image',
    'other'
);


--
-- Name: enum_documents_e_signature_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_documents_e_signature_status AS ENUM (
    'not_required',
    'pending',
    'partial',
    'completed',
    'declined'
);


--
-- Name: enum_documents_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_documents_status AS ENUM (
    'draft',
    'pending_review',
    'approved',
    'executed',
    'expired',
    'archived'
);


--
-- Name: enum_documents_storage_provider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_documents_storage_provider AS ENUM (
    'local',
    'aws_s3',
    'google_drive',
    'dropbox',
    'onedrive'
);


--
-- Name: enum_properties_building_class; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_properties_building_class AS ENUM (
    'A',
    'B',
    'C'
);


--
-- Name: enum_properties_lease_rate_unit; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_properties_lease_rate_unit AS ENUM (
    'monthly',
    'annual',
    'per_sqft_monthly',
    'per_sqft_annual'
);


--
-- Name: enum_properties_lease_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_properties_lease_type AS ENUM (
    'NNN',
    'Gross',
    'Modified',
    'Full Service'
);


--
-- Name: enum_properties_listing_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_properties_listing_type AS ENUM (
    'sale',
    'lease',
    'both'
);


--
-- Name: enum_properties_lot_size_unit; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_properties_lot_size_unit AS ENUM (
    'sqft',
    'acres',
    'hectares'
);


--
-- Name: enum_properties_marketing_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_properties_marketing_status AS ENUM (
    'draft',
    'published',
    'expired',
    'suspended'
);


--
-- Name: enum_properties_property_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_properties_property_type AS ENUM (
    'office',
    'retail',
    'industrial',
    'warehouse',
    'multifamily',
    'hotel',
    'land',
    'mixed_use',
    'medical',
    'restaurant',
    'other'
);


--
-- Name: enum_properties_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_properties_status AS ENUM (
    'available',
    'under_contract',
    'sold',
    'leased',
    'off_market',
    'coming_soon'
);


--
-- Name: enum_tasks_outcome; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_tasks_outcome AS ENUM (
    'successful',
    'unsuccessful',
    'rescheduled',
    'cancelled',
    'no_show'
);


--
-- Name: enum_tasks_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_tasks_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


--
-- Name: enum_tasks_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_tasks_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- Name: enum_tasks_task_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_tasks_task_type AS ENUM (
    'call',
    'email',
    'meeting',
    'follow_up',
    'property_showing',
    'document_review',
    'market_analysis',
    'site_visit',
    'other'
);


--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_users_role AS ENUM (
    'admin',
    'manager',
    'agent',
    'assistant'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: CallLogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CallLogs" (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    contact_id uuid,
    deal_id uuid,
    property_id uuid,
    phone_number character varying(255) NOT NULL,
    direction public."enum_CallLogs_direction" NOT NULL,
    duration integer,
    status public."enum_CallLogs_status" DEFAULT 'completed'::public."enum_CallLogs_status",
    notes text,
    outcome character varying(255),
    recording_url character varying(255),
    twilio_sid character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: COLUMN "CallLogs".duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CallLogs".duration IS 'Duration in seconds';


--
-- Name: CallLogs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CallLogs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CallLogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CallLogs_id_seq" OWNED BY public."CallLogs".id;


--
-- Name: EmailLogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmailLogs" (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    contact_id uuid,
    deal_id uuid,
    property_id uuid,
    "to" text NOT NULL,
    cc text,
    bcc text,
    subject character varying(255) NOT NULL,
    body text NOT NULL,
    status public."enum_EmailLogs_status" DEFAULT 'draft'::public."enum_EmailLogs_status",
    attachments jsonb DEFAULT '[]'::jsonb,
    sendgrid_message_id character varying(255),
    sent_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: COLUMN "EmailLogs"."to"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."EmailLogs"."to" IS 'Comma-separated email addresses';


--
-- Name: EmailLogs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."EmailLogs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: EmailLogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."EmailLogs_id_seq" OWNED BY public."EmailLogs".id;


--
-- Name: Notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notifications" (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    type public."enum_Notifications_type" NOT NULL,
    title character varying(255) NOT NULL,
    body text,
    metadata jsonb DEFAULT '{}'::jsonb,
    entity_type character varying(255),
    entity_id integer,
    priority public."enum_Notifications_priority" DEFAULT 'medium'::public."enum_Notifications_priority",
    status public."enum_Notifications_status" DEFAULT 'unread'::public."enum_Notifications_status",
    read_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Notifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Notifications_id_seq" OWNED BY public."Notifications".id;


--
-- Name: Permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Permissions" (
    id integer NOT NULL,
    resource character varying(255) NOT NULL,
    action character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: COLUMN "Permissions".resource; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Permissions".resource IS 'Resource name: properties, contacts, deals, etc.';


--
-- Name: COLUMN "Permissions".action; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Permissions".action IS 'Action: create, read, update, delete, list';


--
-- Name: Permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Permissions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Permissions_id_seq" OWNED BY public."Permissions".id;


--
-- Name: RolePermissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RolePermissions" (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: RolePermissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."RolePermissions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: RolePermissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."RolePermissions_id_seq" OWNED BY public."RolePermissions".id;


--
-- Name: Roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Roles" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: COLUMN "Roles".is_system; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Roles".is_system IS 'System roles cannot be deleted';


--
-- Name: Roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Roles_id_seq" OWNED BY public."Roles".id;


--
-- Name: TeamMemberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TeamMemberships" (
    id integer NOT NULL,
    team_id integer NOT NULL,
    user_id uuid NOT NULL,
    is_lead boolean DEFAULT false,
    joined_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: TeamMemberships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."TeamMemberships_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: TeamMemberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."TeamMemberships_id_seq" OWNED BY public."TeamMemberships".id;


--
-- Name: Teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Teams" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    leader_id uuid,
    parent_team_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: Teams_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Teams_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Teams_id_seq" OWNED BY public."Teams".id;


--
-- Name: UserRoles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserRoles" (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    role_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: UserRoles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."UserRoles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: UserRoles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."UserRoles_id_seq" OWNED BY public."UserRoles".id;


--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid NOT NULL,
    type public.enum_activities_type NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    duration integer,
    outcome public.enum_activities_outcome DEFAULT 'successful'::public.enum_activities_outcome,
    direction public.enum_activities_direction DEFAULT 'outbound'::public.enum_activities_direction,
    communication_method public.enum_activities_communication_method DEFAULT 'phone'::public.enum_activities_communication_method,
    attendees character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    location character varying(255),
    email_subject character varying(255),
    email_body text,
    email_attachments character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    user_id uuid NOT NULL,
    contact_id uuid,
    property_id uuid,
    deal_id uuid,
    company_id uuid,
    task_id uuid,
    follow_up_required boolean DEFAULT false,
    follow_up_date timestamp with time zone,
    follow_up_notes text,
    is_system_generated boolean DEFAULT false,
    source character varying(255) DEFAULT 'manual'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    legal_name character varying(255),
    dba_name character varying(255),
    company_type public.enum_companies_company_type,
    industry public.enum_companies_industry,
    primary_email character varying(255),
    primary_phone character varying(255),
    fax character varying(255),
    website character varying(255),
    address character varying(255),
    city character varying(255),
    state character varying(255),
    zip_code character varying(255),
    country character varying(255) DEFAULT 'US'::character varying,
    tax_id character varying(255),
    duns_number character varying(255),
    license_number character varying(255),
    incorporation_date timestamp with time zone,
    incorporation_state character varying(255),
    annual_revenue numeric(15,2),
    employee_count integer,
    credit_rating public.enum_companies_credit_rating DEFAULT 'unrated'::public.enum_companies_credit_rating,
    net_worth numeric(15,2),
    portfolio_value numeric(15,2),
    property_types character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    investment_criteria jsonb DEFAULT '{"capRateRange": {"max": null, "min": null}, "maxInvestment": null, "minInvestment": null, "cashOnCashRange": {"max": null, "min": null}, "preferredLocations": []}'::jsonb,
    primary_contact_id uuid,
    assigned_agent_id uuid,
    parent_company_id uuid,
    lead_source public.enum_companies_lead_source,
    lead_status public.enum_companies_lead_status DEFAULT 'cold'::public.enum_companies_lead_status,
    linked_in_url character varying(255),
    facebook_url character varying(255),
    twitter_url character varying(255),
    description text,
    notes text,
    tags character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    last_contact_date timestamp with time zone,
    next_follow_up_date timestamp with time zone,
    is_active boolean DEFAULT true,
    logo character varying(255),
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid NOT NULL,
    type public.enum_contacts_type DEFAULT 'individual'::public.enum_contacts_type,
    first_name character varying(255),
    last_name character varying(255),
    company_name character varying(255),
    title character varying(255),
    primary_email character varying(255),
    secondary_email character varying(255),
    primary_phone character varying(255),
    secondary_phone character varying(255),
    mobile_phone character varying(255),
    fax character varying(255),
    website character varying(255),
    mailing_address character varying(255),
    mailing_city character varying(255),
    mailing_state character varying(255),
    mailing_zip_code character varying(255),
    contact_role public.enum_contacts_contact_role DEFAULT 'other'::public.enum_contacts_contact_role NOT NULL,
    lead_source public.enum_contacts_lead_source,
    lead_status public.enum_contacts_lead_status DEFAULT 'cold'::public.enum_contacts_lead_status,
    credit_rating public.enum_contacts_credit_rating DEFAULT 'unrated'::public.enum_contacts_credit_rating,
    net_worth numeric(15,2),
    liquidity numeric(15,2),
    property_type_interest character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    budget_min numeric(12,2),
    budget_max numeric(12,2),
    square_footage_min integer,
    square_footage_max integer,
    preferred_locations character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    timeframe public.enum_contacts_timeframe,
    assigned_agent_id uuid,
    parent_contact_id uuid,
    preferred_contact_method public.enum_contacts_preferred_contact_method DEFAULT 'email'::public.enum_contacts_preferred_contact_method,
    communication_frequency public.enum_contacts_communication_frequency DEFAULT 'as_needed'::public.enum_contacts_communication_frequency,
    do_not_call boolean DEFAULT false,
    do_not_email boolean DEFAULT false,
    do_not_text boolean DEFAULT false,
    linked_in_url character varying(255),
    facebook_url character varying(255),
    twitter_url character varying(255),
    notes text,
    tags character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    last_contact_date timestamp with time zone,
    next_follow_up_date timestamp with time zone,
    is_active boolean DEFAULT true,
    source character varying(255) DEFAULT 'manual'::character varying,
    avatar character varying(255),
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    company_id uuid
);


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    deal_type public.enum_deals_deal_type NOT NULL,
    stage public.enum_deals_stage DEFAULT 'prospecting'::public.enum_deals_stage,
    value numeric(15,2),
    commission numeric(12,2),
    commission_rate numeric(5,4),
    lease_term_months integer,
    monthly_rent numeric(10,2),
    annual_rent numeric(12,2),
    security_deposit numeric(10,2),
    property_id uuid,
    primary_contact_id uuid,
    listing_agent_id uuid,
    buyer_agent_id uuid,
    expected_close_date timestamp with time zone,
    actual_close_date timestamp with time zone,
    contract_date timestamp with time zone,
    lease_start_date timestamp with time zone,
    lease_end_date timestamp with time zone,
    probability integer DEFAULT 10,
    priority public.enum_deals_priority DEFAULT 'medium'::public.enum_deals_priority,
    description text,
    terms jsonb DEFAULT '{}'::jsonb,
    competitors character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    lost_reason public.enum_deals_lost_reason,
    lost_reason_notes text,
    lead_source public.enum_deals_lead_source,
    referral_source character varying(255),
    documents character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    stage_history jsonb DEFAULT '[]'::jsonb,
    activities jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    description text,
    file_name character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    file_size integer,
    mime_type character varying(255),
    file_extension character varying(255),
    document_type public.enum_documents_document_type DEFAULT 'other'::public.enum_documents_document_type,
    category public.enum_documents_category,
    status public.enum_documents_status DEFAULT 'draft'::public.enum_documents_status,
    version integer DEFAULT 1,
    parent_document_id uuid,
    e_signature_status public.enum_documents_e_signature_status DEFAULT 'not_required'::public.enum_documents_e_signature_status,
    e_signature_envelope_id character varying(255),
    signers jsonb DEFAULT '[]'::jsonb,
    uploaded_by_id uuid NOT NULL,
    contact_id uuid,
    property_id uuid,
    deal_id uuid,
    company_id uuid,
    is_public boolean DEFAULT false,
    access_level public.enum_documents_access_level DEFAULT 'private'::public.enum_documents_access_level,
    allowed_users uuid[] DEFAULT ARRAY[]::uuid[],
    expiration_date timestamp with time zone,
    reminder_dates timestamp with time zone[] DEFAULT ARRAY[]::timestamp with time zone[],
    tags character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    custom_fields jsonb DEFAULT '{}'::jsonb,
    download_count integer DEFAULT 0,
    last_accessed_at timestamp with time zone,
    storage_provider public.enum_documents_storage_provider DEFAULT 'local'::public.enum_documents_storage_provider,
    external_id character varying(255),
    public_url character varying(255),
    has_ocr boolean DEFAULT false,
    ocr_text text,
    checksum character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties (
    id uuid NOT NULL,
    mls_number character varying(255),
    name character varying(255) NOT NULL,
    property_type public.enum_properties_property_type NOT NULL,
    building_class public.enum_properties_building_class,
    status public.enum_properties_status DEFAULT 'available'::public.enum_properties_status,
    marketing_status public.enum_properties_marketing_status DEFAULT 'draft'::public.enum_properties_marketing_status,
    listing_type public.enum_properties_listing_type NOT NULL,
    address character varying(255) NOT NULL,
    city character varying(255) NOT NULL,
    state character varying(255) NOT NULL,
    zip_code character varying(255) NOT NULL,
    county character varying(255),
    country character varying(255) DEFAULT 'US'::character varying,
    latitude numeric(10,8),
    longitude numeric(11,8),
    total_square_footage integer,
    available_square_footage integer,
    lot_size numeric(12,2),
    lot_size_unit public.enum_properties_lot_size_unit DEFAULT 'sqft'::public.enum_properties_lot_size_unit,
    year_built integer,
    floors integer,
    units integer,
    parking_spaces integer,
    parking_ratio numeric(4,2),
    ceiling_height numeric(4,1),
    clear_height numeric(4,1),
    loading_docks integer DEFAULT 0,
    drive_in_doors integer DEFAULT 0,
    lot_dimensions character varying(255),
    list_price numeric(12,2),
    price_per_square_foot numeric(10,2),
    lease_rate numeric(10,2),
    lease_rate_unit public.enum_properties_lease_rate_unit DEFAULT 'per_sqft_annual'::public.enum_properties_lease_rate_unit,
    lease_type public.enum_properties_lease_type,
    operating_expenses numeric(10,2),
    taxes numeric(10,2),
    cap_rate numeric(5,4),
    net_operating_income numeric(12,2),
    amenities character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    zoning character varying(255),
    occupancy_percentage numeric(5,2) DEFAULT 0,
    vacancy_percentage numeric(5,2) DEFAULT 0,
    utilities jsonb DEFAULT '{"gas": false, "sewer": false, "water": false, "internet": false, "electricity": false}'::jsonb,
    images character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    floor_plans character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    site_plans character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    documents character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    offering_memorandum character varying(255),
    virtual_tour_url character varying(255),
    description text,
    marketing_remarks text,
    key_features character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    highlights text,
    lease_terms jsonb DEFAULT '{"maxTerm": null, "minTerm": null, "renewalOptions": null, "securityDeposit": null, "personalGuaranteeRequired": false}'::jsonb,
    availability_date timestamp with time zone,
    days_on_market integer DEFAULT 0,
    views integer DEFAULT 0,
    inquiries integer DEFAULT 0,
    showings integer DEFAULT 0,
    owner_id uuid,
    landlord_name character varying(255),
    tenant_roster jsonb DEFAULT '[]'::jsonb,
    listing_agent_id uuid,
    internal_property_id character varying(255),
    notes text,
    tags character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    linked_deals uuid[] DEFAULT ARRAY[]::uuid[],
    is_active boolean DEFAULT true,
    source character varying(255) DEFAULT 'manual'::character varying,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    task_type public.enum_tasks_task_type DEFAULT 'other'::public.enum_tasks_task_type,
    status public.enum_tasks_status DEFAULT 'pending'::public.enum_tasks_status,
    priority public.enum_tasks_priority DEFAULT 'medium'::public.enum_tasks_priority,
    due_date timestamp with time zone,
    start_date timestamp with time zone,
    completed_date timestamp with time zone,
    estimated_duration integer,
    actual_duration integer,
    assigned_to_id uuid NOT NULL,
    created_by_id uuid NOT NULL,
    contact_id uuid,
    property_id uuid,
    deal_id uuid,
    company_id uuid,
    reminder_date timestamp with time zone,
    reminder_sent boolean DEFAULT false,
    is_recurring boolean DEFAULT false,
    recurring_pattern jsonb,
    outcome public.enum_tasks_outcome,
    notes text,
    attachments character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    phone character varying(255),
    role public.enum_users_role DEFAULT 'agent'::public.enum_users_role,
    title character varying(255),
    department character varying(255),
    avatar character varying(255),
    license_number character varying(255),
    license_state character varying(255),
    commission_rate numeric(5,4),
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    email_verified boolean DEFAULT false,
    email_verification_token character varying(255),
    password_reset_token character varying(255),
    password_reset_expires timestamp with time zone,
    login_attempts integer DEFAULT 0 NOT NULL,
    lock_until timestamp with time zone,
    last_failed_login timestamp with time zone,
    preferences jsonb DEFAULT '{"theme": "light", "language": "en", "timezone": "America/New_York", "notifications": {"sms": true, "email": true, "browser": true}}'::jsonb,
    permissions jsonb DEFAULT '{"admin": [], "deals": ["read", "create", "update"], "reports": ["read"], "contacts": ["read", "create", "update"], "properties": ["read", "create", "update"]}'::jsonb,
    refresh_token text,
    refresh_token_expiry timestamp with time zone,
    mfa_secret character varying(255),
    mfa_enabled boolean DEFAULT false NOT NULL,
    mfa_backup_codes jsonb,
    mfa_failed_attempts integer DEFAULT 0 NOT NULL,
    mfa_lock_until timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: CallLogs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CallLogs" ALTER COLUMN id SET DEFAULT nextval('public."CallLogs_id_seq"'::regclass);


--
-- Name: EmailLogs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailLogs" ALTER COLUMN id SET DEFAULT nextval('public."EmailLogs_id_seq"'::regclass);


--
-- Name: Notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notifications" ALTER COLUMN id SET DEFAULT nextval('public."Notifications_id_seq"'::regclass);


--
-- Name: Permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Permissions" ALTER COLUMN id SET DEFAULT nextval('public."Permissions_id_seq"'::regclass);


--
-- Name: RolePermissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermissions" ALTER COLUMN id SET DEFAULT nextval('public."RolePermissions_id_seq"'::regclass);


--
-- Name: Roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Roles" ALTER COLUMN id SET DEFAULT nextval('public."Roles_id_seq"'::regclass);


--
-- Name: TeamMemberships id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamMemberships" ALTER COLUMN id SET DEFAULT nextval('public."TeamMemberships_id_seq"'::regclass);


--
-- Name: Teams id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Teams" ALTER COLUMN id SET DEFAULT nextval('public."Teams_id_seq"'::regclass);


--
-- Name: UserRoles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoles" ALTER COLUMN id SET DEFAULT nextval('public."UserRoles_id_seq"'::regclass);


--
-- Data for Name: CallLogs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CallLogs" (id, user_id, contact_id, deal_id, property_id, phone_number, direction, duration, status, notes, outcome, recording_url, twilio_sid, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: EmailLogs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EmailLogs" (id, user_id, contact_id, deal_id, property_id, "to", cc, bcc, subject, body, status, attachments, sendgrid_message_id, sent_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notifications" (id, user_id, type, title, body, metadata, entity_type, entity_id, priority, status, read_at, expires_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: Permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Permissions" (id, resource, action, description, created_at, updated_at, deleted_at) FROM stdin;
1	users	create	Create users	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
2	users	read	Read users	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
3	users	update	Update users	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
4	users	delete	Delete users	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
5	users	list	List users	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
6	teams	create	Create teams	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
7	teams	read	Read teams	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
8	teams	update	Update teams	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
9	teams	delete	Delete teams	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
10	teams	list	List teams	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
11	properties	create	Create properties	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
12	properties	read	Read properties	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
13	properties	update	Update properties	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
14	properties	delete	Delete properties	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
15	properties	list	List properties	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
16	contacts	create	Create contacts	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
17	contacts	read	Read contacts	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
18	contacts	update	Update contacts	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
19	contacts	delete	Delete contacts	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
20	contacts	list	List contacts	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
21	deals	create	Create deals	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
22	deals	read	Read deals	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
23	deals	update	Update deals	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
24	deals	delete	Delete deals	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
25	deals	list	List deals	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
26	documents	create	Create documents	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
27	documents	read	Read documents	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
28	documents	update	Update documents	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
29	documents	delete	Delete documents	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
30	documents	list	List documents	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
31	tasks	create	Create tasks	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
32	tasks	read	Read tasks	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
33	tasks	update	Update tasks	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
34	tasks	delete	Delete tasks	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
35	tasks	list	List tasks	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
36	reports	create	Create reports	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
37	reports	read	Read reports	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
38	reports	update	Update reports	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
39	reports	delete	Delete reports	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
40	reports	list	List reports	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
41	analytics	create	Create analytics	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
42	analytics	read	Read analytics	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
43	analytics	update	Update analytics	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
44	analytics	delete	Delete analytics	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
45	analytics	list	List analytics	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
46	communications	create	Create communications	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
47	communications	read	Read communications	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
48	communications	update	Update communications	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
49	communications	delete	Delete communications	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
50	communications	list	List communications	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
51	imports	create	Create imports	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
52	imports	read	Read imports	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
53	imports	update	Update imports	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
54	imports	delete	Delete imports	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
55	imports	list	List imports	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
56	settings	create	Create settings	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
57	settings	read	Read settings	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
58	settings	update	Update settings	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
59	settings	delete	Delete settings	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
60	settings	list	List settings	2025-09-30 15:27:49.085+00	2025-09-30 15:27:49.085+00	\N
\.


--
-- Data for Name: RolePermissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RolePermissions" (id, role_id, permission_id, created_at, updated_at, deleted_at) FROM stdin;
1	1	1	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
2	1	2	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
3	1	3	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
4	1	4	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
5	1	5	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
6	1	6	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
7	1	7	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
8	1	8	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
9	1	9	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
10	1	10	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
11	1	11	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
12	1	12	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
13	1	13	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
14	1	14	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
15	1	15	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
16	1	16	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
17	1	17	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
18	1	18	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
19	1	19	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
20	1	20	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
21	1	21	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
22	1	22	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
23	1	23	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
24	1	24	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
25	1	25	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
26	1	26	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
27	1	27	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
28	1	28	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
29	1	29	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
30	1	30	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
31	1	31	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
32	1	32	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
33	1	33	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
34	1	34	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
35	1	35	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
36	1	36	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
37	1	37	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
38	1	38	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
39	1	39	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
40	1	40	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
41	1	41	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
42	1	42	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
43	1	43	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
44	1	44	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
45	1	45	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
46	1	46	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
47	1	47	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
48	1	48	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
49	1	49	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
50	1	50	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
51	1	51	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
52	1	52	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
53	1	53	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
54	1	54	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
55	1	55	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
56	1	56	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
57	1	57	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
58	1	58	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
59	1	59	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
60	1	60	2025-09-30 15:27:49.379+00	2025-09-30 15:27:49.379+00	\N
61	2	1	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
62	2	2	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
63	2	3	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
64	2	5	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
65	2	6	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
66	2	7	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
67	2	8	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
68	2	9	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
69	2	10	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
70	2	11	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
71	2	12	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
72	2	13	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
73	2	14	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
74	2	15	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
75	2	16	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
76	2	17	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
77	2	18	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
78	2	19	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
79	2	20	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
80	2	21	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
81	2	22	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
82	2	23	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
83	2	24	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
84	2	25	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
85	2	26	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
86	2	27	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
87	2	28	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
88	2	29	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
89	2	30	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
90	2	31	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
91	2	32	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
92	2	33	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
93	2	34	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
94	2	35	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
95	2	36	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
96	2	37	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
97	2	38	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
98	2	39	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
99	2	40	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
100	2	41	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
101	2	42	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
102	2	43	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
103	2	44	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
104	2	45	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
105	2	46	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
106	2	47	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
107	2	48	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
108	2	49	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
109	2	50	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
110	2	51	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
111	2	52	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
112	2	53	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
113	2	54	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
114	2	55	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
115	2	56	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
116	2	57	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
117	2	60	2025-09-30 15:27:49.598+00	2025-09-30 15:27:49.598+00	\N
118	3	11	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
119	3	12	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
120	3	13	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
121	3	15	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
122	3	16	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
123	3	17	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
124	3	18	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
125	3	20	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
126	3	21	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
127	3	22	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
128	3	23	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
129	3	25	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
130	3	31	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
131	3	32	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
132	3	33	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
133	3	35	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
134	3	26	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
135	3	27	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
136	3	30	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
137	3	46	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
138	3	47	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
139	3	50	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
140	3	37	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
141	3	40	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
142	3	42	2025-09-30 15:27:49.814+00	2025-09-30 15:27:49.814+00	\N
143	4	2	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
144	4	5	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
145	4	7	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
146	4	10	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
147	4	12	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
148	4	15	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
149	4	17	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
150	4	20	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
151	4	22	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
152	4	25	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
153	4	27	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
154	4	30	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
155	4	32	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
156	4	35	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
157	4	37	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
158	4	40	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
159	4	42	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
160	4	45	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
161	4	47	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
162	4	50	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
163	4	52	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
164	4	55	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
165	4	57	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
166	4	60	2025-09-30 15:27:50.026+00	2025-09-30 15:27:50.026+00	\N
\.


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Roles" (id, name, description, is_system, created_at, updated_at, deleted_at) FROM stdin;
1	admin	Administrator with full system access	t	2025-09-30 15:27:49.254+00	2025-09-30 15:27:49.254+00	\N
2	manager	Manager with most permissions except system configuration	t	2025-09-30 15:27:49.497+00	2025-09-30 15:27:49.497+00	\N
3	agent	Agent with standard permissions	t	2025-09-30 15:27:49.714+00	2025-09-30 15:27:49.714+00	\N
4	assistant	Assistant with read-only permissions	t	2025-09-30 15:27:49.926+00	2025-09-30 15:27:49.926+00	\N
\.


--
-- Data for Name: TeamMemberships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeamMemberships" (id, team_id, user_id, is_lead, joined_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: Teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Teams" (id, name, description, leader_id, parent_team_id, is_active, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: UserRoles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserRoles" (id, user_id, role_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activities (id, type, title, description, duration, outcome, direction, communication_method, attendees, location, email_subject, email_body, email_attachments, user_id, contact_id, property_id, deal_id, company_id, task_id, follow_up_required, follow_up_date, follow_up_notes, is_system_generated, source, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, name, legal_name, dba_name, company_type, industry, primary_email, primary_phone, fax, website, address, city, state, zip_code, country, tax_id, duns_number, license_number, incorporation_date, incorporation_state, annual_revenue, employee_count, credit_rating, net_worth, portfolio_value, property_types, investment_criteria, primary_contact_id, assigned_agent_id, parent_company_id, lead_source, lead_status, linked_in_url, facebook_url, twitter_url, description, notes, tags, last_contact_date, next_follow_up_date, is_active, logo, custom_fields, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contacts (id, type, first_name, last_name, company_name, title, primary_email, secondary_email, primary_phone, secondary_phone, mobile_phone, fax, website, mailing_address, mailing_city, mailing_state, mailing_zip_code, contact_role, lead_source, lead_status, credit_rating, net_worth, liquidity, property_type_interest, budget_min, budget_max, square_footage_min, square_footage_max, preferred_locations, timeframe, assigned_agent_id, parent_contact_id, preferred_contact_method, communication_frequency, do_not_call, do_not_email, do_not_text, linked_in_url, facebook_url, twitter_url, notes, tags, last_contact_date, next_follow_up_date, is_active, source, avatar, custom_fields, created_at, updated_at, deleted_at, company_id) FROM stdin;
\.


--
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deals (id, name, deal_type, stage, value, commission, commission_rate, lease_term_months, monthly_rent, annual_rent, security_deposit, property_id, primary_contact_id, listing_agent_id, buyer_agent_id, expected_close_date, actual_close_date, contract_date, lease_start_date, lease_end_date, probability, priority, description, terms, competitors, lost_reason, lost_reason_notes, lead_source, referral_source, documents, stage_history, activities, is_active, custom_fields, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, name, original_name, description, file_name, file_path, file_size, mime_type, file_extension, document_type, category, status, version, parent_document_id, e_signature_status, e_signature_envelope_id, signers, uploaded_by_id, contact_id, property_id, deal_id, company_id, is_public, access_level, allowed_users, expiration_date, reminder_dates, tags, custom_fields, download_count, last_accessed_at, storage_provider, external_id, public_url, has_ocr, ocr_text, checksum, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.properties (id, mls_number, name, property_type, building_class, status, marketing_status, listing_type, address, city, state, zip_code, county, country, latitude, longitude, total_square_footage, available_square_footage, lot_size, lot_size_unit, year_built, floors, units, parking_spaces, parking_ratio, ceiling_height, clear_height, loading_docks, drive_in_doors, lot_dimensions, list_price, price_per_square_foot, lease_rate, lease_rate_unit, lease_type, operating_expenses, taxes, cap_rate, net_operating_income, amenities, zoning, occupancy_percentage, vacancy_percentage, utilities, images, floor_plans, site_plans, documents, offering_memorandum, virtual_tour_url, description, marketing_remarks, key_features, highlights, lease_terms, availability_date, days_on_market, views, inquiries, showings, owner_id, landlord_name, tenant_roster, listing_agent_id, internal_property_id, notes, tags, linked_deals, is_active, source, last_synced_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, title, description, task_type, status, priority, due_date, start_date, completed_date, estimated_duration, actual_duration, assigned_to_id, created_by_id, contact_id, property_id, deal_id, company_id, reminder_date, reminder_sent, is_recurring, recurring_pattern, outcome, notes, attachments, custom_fields, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, first_name, last_name, email, password, phone, role, title, department, avatar, license_number, license_state, commission_rate, is_active, last_login, email_verified, email_verification_token, password_reset_token, password_reset_expires, login_attempts, lock_until, last_failed_login, preferences, permissions, refresh_token, refresh_token_expiry, mfa_secret, mfa_enabled, mfa_backup_codes, mfa_failed_attempts, mfa_lock_until, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Name: CallLogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."CallLogs_id_seq"', 1, false);


--
-- Name: EmailLogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."EmailLogs_id_seq"', 1, false);


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Notifications_id_seq"', 1, false);


--
-- Name: Permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Permissions_id_seq"', 60, true);


--
-- Name: RolePermissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."RolePermissions_id_seq"', 166, true);


--
-- Name: Roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Roles_id_seq"', 4, true);


--
-- Name: TeamMemberships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."TeamMemberships_id_seq"', 1, false);


--
-- Name: Teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Teams_id_seq"', 1, false);


--
-- Name: UserRoles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."UserRoles_id_seq"', 1, false);


--
-- Name: CallLogs CallLogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CallLogs"
    ADD CONSTRAINT "CallLogs_pkey" PRIMARY KEY (id);


--
-- Name: CallLogs CallLogs_twilio_sid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CallLogs"
    ADD CONSTRAINT "CallLogs_twilio_sid_key" UNIQUE (twilio_sid);


--
-- Name: CallLogs CallLogs_twilio_sid_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CallLogs"
    ADD CONSTRAINT "CallLogs_twilio_sid_key1" UNIQUE (twilio_sid);


--
-- Name: CallLogs CallLogs_twilio_sid_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CallLogs"
    ADD CONSTRAINT "CallLogs_twilio_sid_key2" UNIQUE (twilio_sid);


--
-- Name: CallLogs CallLogs_twilio_sid_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CallLogs"
    ADD CONSTRAINT "CallLogs_twilio_sid_key3" UNIQUE (twilio_sid);


--
-- Name: EmailLogs EmailLogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailLogs"
    ADD CONSTRAINT "EmailLogs_pkey" PRIMARY KEY (id);


--
-- Name: Notifications Notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Permissions Permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_pkey" PRIMARY KEY (id);


--
-- Name: RolePermissions RolePermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermissions"
    ADD CONSTRAINT "RolePermissions_pkey" PRIMARY KEY (id);


--
-- Name: RolePermissions RolePermissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermissions"
    ADD CONSTRAINT "RolePermissions_role_id_permission_id_key" UNIQUE (role_id, permission_id);


--
-- Name: Roles Roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key" UNIQUE (name);


--
-- Name: Roles Roles_name_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key1" UNIQUE (name);


--
-- Name: Roles Roles_name_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key2" UNIQUE (name);


--
-- Name: Roles Roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_pkey" PRIMARY KEY (id);


--
-- Name: TeamMemberships TeamMemberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamMemberships"
    ADD CONSTRAINT "TeamMemberships_pkey" PRIMARY KEY (id);


--
-- Name: TeamMemberships TeamMemberships_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamMemberships"
    ADD CONSTRAINT "TeamMemberships_team_id_user_id_key" UNIQUE (team_id, user_id);


--
-- Name: Teams Teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Teams"
    ADD CONSTRAINT "Teams_pkey" PRIMARY KEY (id);


--
-- Name: UserRoles UserRoles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoles"
    ADD CONSTRAINT "UserRoles_pkey" PRIMARY KEY (id);


--
-- Name: UserRoles UserRoles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoles"
    ADD CONSTRAINT "UserRoles_user_id_role_id_key" UNIQUE (user_id, role_id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: properties properties_internal_property_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_internal_property_id_key UNIQUE (internal_property_id);


--
-- Name: properties properties_internal_property_id_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_internal_property_id_key1 UNIQUE (internal_property_id);


--
-- Name: properties properties_internal_property_id_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_internal_property_id_key2 UNIQUE (internal_property_id);


--
-- Name: properties properties_internal_property_id_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_internal_property_id_key3 UNIQUE (internal_property_id);


--
-- Name: properties properties_internal_property_id_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_internal_property_id_key4 UNIQUE (internal_property_id);


--
-- Name: properties properties_internal_property_id_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_internal_property_id_key5 UNIQUE (internal_property_id);


--
-- Name: properties properties_internal_property_id_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_internal_property_id_key6 UNIQUE (internal_property_id);


--
-- Name: properties properties_mls_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_mls_number_key UNIQUE (mls_number);


--
-- Name: properties properties_mls_number_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_mls_number_key1 UNIQUE (mls_number);


--
-- Name: properties properties_mls_number_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_mls_number_key2 UNIQUE (mls_number);


--
-- Name: properties properties_mls_number_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_mls_number_key3 UNIQUE (mls_number);


--
-- Name: properties properties_mls_number_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_mls_number_key4 UNIQUE (mls_number);


--
-- Name: properties properties_mls_number_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_mls_number_key5 UNIQUE (mls_number);


--
-- Name: properties properties_mls_number_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_mls_number_key6 UNIQUE (mls_number);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- Name: users users_email_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key2 UNIQUE (email);


--
-- Name: users users_email_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key3 UNIQUE (email);


--
-- Name: users users_email_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key4 UNIQUE (email);


--
-- Name: users users_email_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key5 UNIQUE (email);


--
-- Name: users users_email_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key6 UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activities_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_company_id ON public.activities USING btree (company_id);


--
-- Name: activities_contact_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_contact_id_created_at ON public.activities USING btree (contact_id, created_at);


--
-- Name: activities_deal_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_deal_id_created_at ON public.activities USING btree (deal_id, created_at);


--
-- Name: activities_property_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_property_id_created_at ON public.activities USING btree (property_id, created_at);


--
-- Name: activities_user_id_type_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_user_id_type_created_at ON public.activities USING btree (user_id, type, created_at);


--
-- Name: call_logs_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX call_logs_contact_id ON public."CallLogs" USING btree (contact_id);


--
-- Name: call_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX call_logs_created_at ON public."CallLogs" USING btree (created_at);


--
-- Name: call_logs_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX call_logs_deal_id ON public."CallLogs" USING btree (deal_id);


--
-- Name: call_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX call_logs_user_id ON public."CallLogs" USING btree (user_id);


--
-- Name: companies_assigned_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX companies_assigned_agent_id ON public.companies USING btree (assigned_agent_id);


--
-- Name: companies_city_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX companies_city_state ON public.companies USING btree (city, state);


--
-- Name: companies_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX companies_created_at ON public.companies USING btree (created_at DESC);


--
-- Name: companies_industry_company_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX companies_industry_company_type ON public.companies USING btree (industry, company_type);


--
-- Name: companies_lead_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX companies_lead_status ON public.companies USING btree (lead_status);


--
-- Name: companies_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX companies_name ON public.companies USING btree (name);


--
-- Name: companies_primary_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX companies_primary_contact_id ON public.companies USING btree (primary_contact_id);


--
-- Name: contacts_assigned_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_assigned_agent_id ON public.contacts USING btree (assigned_agent_id);


--
-- Name: contacts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_created_at ON public.contacts USING btree (created_at DESC);


--
-- Name: contacts_lead_source_contact_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_lead_source_contact_role ON public.contacts USING btree (lead_source, contact_role);


--
-- Name: contacts_lead_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_lead_status ON public.contacts USING btree (lead_status);


--
-- Name: contacts_primary_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_primary_email ON public.contacts USING btree (primary_email);


--
-- Name: deals_actual_close_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deals_actual_close_date ON public.deals USING btree (actual_close_date);


--
-- Name: deals_buyer_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deals_buyer_agent_id ON public.deals USING btree (buyer_agent_id);


--
-- Name: deals_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deals_created_at ON public.deals USING btree (created_at DESC);


--
-- Name: deals_expected_close_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deals_expected_close_date ON public.deals USING btree (expected_close_date);


--
-- Name: deals_listing_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deals_listing_agent_id ON public.deals USING btree (listing_agent_id);


--
-- Name: deals_primary_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deals_primary_contact_id ON public.deals USING btree (primary_contact_id);


--
-- Name: deals_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deals_property_id ON public.deals USING btree (property_id);


--
-- Name: deals_stage_deal_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deals_stage_deal_type ON public.deals USING btree (stage, deal_type);


--
-- Name: deals_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deals_value ON public.deals USING btree (value);


--
-- Name: documents_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_company_id ON public.documents USING btree (company_id);


--
-- Name: documents_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_contact_id ON public.documents USING btree (contact_id);


--
-- Name: documents_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_created_at ON public.documents USING btree (created_at DESC);


--
-- Name: documents_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_deal_id ON public.documents USING btree (deal_id);


--
-- Name: documents_document_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_document_type ON public.documents USING btree (document_type);


--
-- Name: documents_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_property_id ON public.documents USING btree (property_id);


--
-- Name: documents_uploaded_by_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_uploaded_by_id ON public.documents USING btree (uploaded_by_id);


--
-- Name: email_logs_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_logs_contact_id ON public."EmailLogs" USING btree (contact_id);


--
-- Name: email_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_logs_created_at ON public."EmailLogs" USING btree (created_at);


--
-- Name: email_logs_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_logs_deal_id ON public."EmailLogs" USING btree (deal_id);


--
-- Name: email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_logs_status ON public."EmailLogs" USING btree (status);


--
-- Name: email_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_logs_user_id ON public."EmailLogs" USING btree (user_id);


--
-- Name: notifications_unread_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_unread_idx ON public."Notifications" USING btree (user_id, status) WHERE (status = 'unread'::public."enum_Notifications_status");


--
-- Name: notifications_user_id_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id_status_created_at ON public."Notifications" USING btree (user_id, status, created_at);


--
-- Name: permissions_resource_action; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_resource_action ON public."Permissions" USING btree (resource, action);


--
-- Name: properties_city_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_city_state ON public.properties USING btree (city, state);


--
-- Name: properties_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_created_at ON public.properties USING btree (created_at DESC);


--
-- Name: properties_list_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_list_price ON public.properties USING btree (list_price);


--
-- Name: properties_listing_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_listing_agent_id ON public.properties USING btree (listing_agent_id);


--
-- Name: properties_listing_type_marketing_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_listing_type_marketing_status ON public.properties USING btree (listing_type, marketing_status);


--
-- Name: properties_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_owner_id ON public.properties USING btree (owner_id);


--
-- Name: properties_property_type_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_property_type_status ON public.properties USING btree (property_type, status);


--
-- Name: properties_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_status ON public.properties USING btree (status);


--
-- Name: properties_total_square_footage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_total_square_footage ON public.properties USING btree (total_square_footage);


--
-- Name: role_permissions_role_id_permission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX role_permissions_role_id_permission_id ON public."RolePermissions" USING btree (role_id, permission_id);


--
-- Name: tasks_assigned_to_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_assigned_to_id_status ON public.tasks USING btree (assigned_to_id, status);


--
-- Name: tasks_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_company_id ON public.tasks USING btree (company_id);


--
-- Name: tasks_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_contact_id ON public.tasks USING btree (contact_id);


--
-- Name: tasks_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_deal_id ON public.tasks USING btree (deal_id);


--
-- Name: tasks_due_date_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_due_date_status ON public.tasks USING btree (due_date, status);


--
-- Name: tasks_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_property_id ON public.tasks USING btree (property_id);


--
-- Name: team_memberships_team_id_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_memberships_team_id_user_id ON public."TeamMemberships" USING btree (team_id, user_id);


--
-- Name: user_roles_user_id_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_roles_user_id_role_id ON public."UserRoles" USING btree (user_id, role_id);


--
-- Name: users_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_is_active ON public.users USING btree (is_active);


--
-- Name: users_last_login; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_last_login ON public.users USING btree (last_login DESC);


--
-- Name: users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role ON public.users USING btree (role);


--
-- Name: users_role_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_is_active ON public.users USING btree (role, is_active);


--
-- Name: CallLogs CallLogs_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CallLogs"
    ADD CONSTRAINT "CallLogs_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CallLogs CallLogs_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CallLogs"
    ADD CONSTRAINT "CallLogs_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CallLogs CallLogs_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CallLogs"
    ADD CONSTRAINT "CallLogs_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CallLogs CallLogs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CallLogs"
    ADD CONSTRAINT "CallLogs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: EmailLogs EmailLogs_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailLogs"
    ADD CONSTRAINT "EmailLogs_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmailLogs EmailLogs_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailLogs"
    ADD CONSTRAINT "EmailLogs_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmailLogs EmailLogs_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailLogs"
    ADD CONSTRAINT "EmailLogs_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmailLogs EmailLogs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailLogs"
    ADD CONSTRAINT "EmailLogs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: Notifications Notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: RolePermissions RolePermissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermissions"
    ADD CONSTRAINT "RolePermissions_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES public."Permissions"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermissions RolePermissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermissions"
    ADD CONSTRAINT "RolePermissions_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public."Roles"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMemberships TeamMemberships_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamMemberships"
    ADD CONSTRAINT "TeamMemberships_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public."Teams"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMemberships TeamMemberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamMemberships"
    ADD CONSTRAINT "TeamMemberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Teams Teams_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Teams"
    ADD CONSTRAINT "Teams_leader_id_fkey" FOREIGN KEY (leader_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Teams Teams_parent_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Teams"
    ADD CONSTRAINT "Teams_parent_team_id_fkey" FOREIGN KEY (parent_team_id) REFERENCES public."Teams"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserRoles UserRoles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoles"
    ADD CONSTRAINT "UserRoles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public."Roles"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRoles UserRoles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoles"
    ADD CONSTRAINT "UserRoles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activities activities_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE;


--
-- Name: activities activities_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activities activities_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activities activities_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activities activities_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: activities activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: companies companies_assigned_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_assigned_agent_id_fkey FOREIGN KEY (assigned_agent_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: companies companies_parent_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_parent_company_id_fkey FOREIGN KEY (parent_company_id) REFERENCES public.companies(id);


--
-- Name: companies companies_primary_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_primary_contact_id_fkey FOREIGN KEY (primary_contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE;


--
-- Name: contacts contacts_assigned_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_assigned_agent_id_fkey FOREIGN KEY (assigned_agent_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contacts contacts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contacts contacts_parent_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_parent_contact_id_fkey FOREIGN KEY (parent_contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE;


--
-- Name: deals deals_buyer_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_buyer_agent_id_fkey FOREIGN KEY (buyer_agent_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deals deals_listing_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_listing_agent_id_fkey FOREIGN KEY (listing_agent_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deals deals_primary_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_primary_contact_id_fkey FOREIGN KEY (primary_contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deals deals_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE;


--
-- Name: documents documents_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE;


--
-- Name: documents documents_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_parent_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_parent_document_id_fkey FOREIGN KEY (parent_document_id) REFERENCES public.documents(id);


--
-- Name: documents documents_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: properties properties_listing_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_listing_agent_id_fkey FOREIGN KEY (listing_agent_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: properties properties_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.contacts(id) ON UPDATE CASCADE;


--
-- Name: tasks tasks_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE;


--
-- Name: tasks tasks_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

