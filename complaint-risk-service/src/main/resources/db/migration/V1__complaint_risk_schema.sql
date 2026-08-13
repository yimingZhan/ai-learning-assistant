create table complaint_risk_config_version (
  id varchar(64) primary key,
  version varchar(32) not null unique,
  status varchar(16) not null,
  checksum varchar(64) not null,
  config_json text not null,
  change_note varchar(500),
  trial_succeeded boolean not null default false,
  created_by varchar(128) not null,
  created_at timestamp with time zone not null,
  published_at timestamp with time zone
);

create index idx_risk_config_status on complaint_risk_config_version(status, created_at desc);

create table complaint_risk_trial_run (
  id varchar(64) primary key,
  config_checksum varchar(64) not null,
  input_json text not null,
  result_json text not null,
  success boolean not null,
  created_by varchar(128) not null,
  created_at timestamp with time zone not null
);

create table complaint_risk_ingest_cursor (
  source varchar(32) primary key,
  cursor_value varchar(500),
  watermark timestamp with time zone,
  updated_at timestamp with time zone not null
);

create table complaint_risk_batch_run (
  id varchar(64) primary key,
  run_type varchar(32) not null,
  status varchar(24) not null,
  window_start timestamp with time zone not null,
  window_end timestamp with time zone not null,
  config_version varchar(32) not null,
  fetched_count integer not null default 0,
  evidence_count integer not null default 0,
  event_count integer not null default 0,
  error_message varchar(1000),
  started_at timestamp with time zone not null,
  completed_at timestamp with time zone
);

create table communication_evidence (
  id varchar(64) primary key,
  tenant_id varchar(64) not null,
  source varchar(32) not null,
  source_message_id varchar(256) not null,
  staff_wechat_account_id varchar(128),
  customer_wechat_id varchar(128),
  conversation_id varchar(256),
  chat_type varchar(24) not null,
  sender_type varchar(24) not null,
  message_type varchar(24) not null,
  content_text text,
  occurred_at timestamp with time zone not null,
  source_updated_at timestamp with time zone not null,
  recalled boolean not null default false,
  student_id varchar(128),
  student_name varchar(128),
  student_number varchar(128),
  owner_id varchar(128),
  owner_name varchar(128),
  employee_id varchar(128),
  employee_name varchar(128),
  employee_role varchar(128),
  data_status varchar(32) not null,
  analysis_status varchar(32) not null,
  first_synced_at timestamp with time zone not null,
  last_synced_at timestamp with time zone not null,
  unique(tenant_id, staff_wechat_account_id, source_message_id)
);

create index idx_evidence_analysis on communication_evidence(analysis_status, occurred_at);
create index idx_evidence_student_time on communication_evidence(student_id, occurred_at desc);
create index idx_evidence_conversation_time on communication_evidence(conversation_id, occurred_at);

create table communication_data_issue (
  id varchar(64) primary key,
  evidence_id varchar(64),
  source_message_id varchar(256),
  issue_type varchar(64) not null,
  description varchar(1000) not null,
  created_at timestamp with time zone not null
);

create table complaint_risk_signal (
  id varchar(64) primary key,
  student_id varchar(128) not null,
  evidence_id varchar(64) not null,
  rule_id varchar(128) not null,
  confidence integer not null,
  rationale varchar(2000) not null,
  summary varchar(1000) not null,
  suggestion varchar(2000) not null,
  config_version varchar(32) not null,
  model_version varchar(128) not null,
  occurred_at timestamp with time zone not null,
  created_at timestamp with time zone not null,
  unique(evidence_id, rule_id, config_version)
);

create index idx_risk_signal_window on complaint_risk_signal(student_id, rule_id, occurred_at desc);

create table complaint_risk_event (
  id varchar(64) primary key,
  student_id varchar(128) not null,
  student_name varchar(128) not null,
  student_number varchar(128) not null,
  owner_id varchar(128),
  owner_name varchar(128),
  event_date date not null,
  rule_id varchar(128) not null,
  rule_name varchar(256) not null,
  theme varchar(256) not null,
  risk_level varchar(16) not null,
  risk_score integer not null,
  confidence integer not null,
  ai_summary varchar(2000) not null,
  ai_suggestion varchar(3000) not null,
  risk_sources varchar(128) not null,
  earliest_risk_at timestamp with time zone not null,
  latest_risk_at timestamp with time zone not null,
  config_version varchar(32) not null,
  model_version varchar(128) not null,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null,
  unique(student_id, event_date, rule_id)
);

create index idx_risk_event_student_time on complaint_risk_event(student_id, event_date desc);
create index idx_risk_event_level_time on complaint_risk_event(risk_level, latest_risk_at desc);

create table complaint_risk_event_evidence (
  event_id varchar(64) not null,
  evidence_id varchar(64) not null,
  created_at timestamp with time zone not null,
  primary key(event_id, evidence_id)
);

create table complaint_risk_event_revision (
  id varchar(64) primary key,
  event_id varchar(64) not null,
  revision_type varchar(64) not null,
  previous_level varchar(16),
  current_level varchar(16) not null,
  description varchar(1000) not null,
  created_at timestamp with time zone not null
);

create table notification_outbox (
  id varchar(64) primary key,
  event_id varchar(64) not null,
  recipient_id varchar(128) not null,
  recipient_name varchar(128) not null,
  dedupe_key varchar(500) not null,
  status varchar(24) not null,
  attempts integer not null default 0,
  available_at timestamp with time zone not null,
  last_error varchar(1000),
  created_at timestamp with time zone not null,
  sent_at timestamp with time zone
);

create index idx_outbox_pending on notification_outbox(status, available_at);
create index idx_outbox_dedupe on notification_outbox(dedupe_key, created_at desc);

create table work_reminder (
  id varchar(64) primary key,
  recipient_id varchar(128) not null,
  reminder_type varchar(32) not null,
  priority varchar(24) not null,
  title varchar(500) not null,
  description varchar(1000) not null,
  target_path varchar(1000) not null,
  student_id varchar(128),
  student_name varchar(128),
  is_read boolean not null default false,
  dedupe_key varchar(500),
  created_at timestamp with time zone not null
);

create index idx_reminder_recipient on work_reminder(recipient_id, is_read, created_at desc);

create table complaint_risk_audit_log (
  id varchar(64) primary key,
  action varchar(64) not null,
  operator_id varchar(128),
  operator_name varchar(128),
  resource_type varchar(64) not null,
  resource_id varchar(128),
  request_id varchar(128),
  summary varchar(1000) not null,
  created_at timestamp with time zone not null
);

create index idx_risk_audit_time on complaint_risk_audit_log(created_at desc);

create table shedlock (
  name varchar(64) not null primary key,
  lock_until timestamp(3) not null,
  locked_at timestamp(3) not null,
  locked_by varchar(255) not null
);
