-- KaamProof MVP — PRD §10. PostgreSQL / Supabase.
-- Run with: supabase db push  (or psql against your Supabase project).
-- Evidence files themselves live in the PRIVATE `evidence` storage bucket
-- (create it in the Supabase dashboard / storage API with public = false);
-- only metadata and short-lived signed URLs are used by the app. Never put
-- private image URLs in a public bucket or in client-visible rows.
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_path text,
  business_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  name text not null,
  description text not null,
  category text not null,
  site_label text,
  planned_start_date date,
  expected_completion_date date,
  status text not null default 'draft' check (status in ('draft','active','awaiting_review','completed','archived')),
  currency text default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists idx_projects_owner on projects(owner_id);

create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('owner','provider','reviewer')),
  invitation_status text not null default 'pending' check (invitation_status in ('pending','accepted','declined','expired')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);
create index if not exists idx_members_project on project_members(project_id);
create index if not exists idx_members_user on project_members(user_id);

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  inviter_id uuid not null references profiles(id),
  invitee_email text,
  invitee_user_id uuid references profiles(id),
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_invitations_project on invitations(project_id);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'not_started' check (status in ('not_started','in_progress','submitted_for_review','needs_more_evidence','revision_requested','reviewed','accepted_by_customer','rejected_by_customer','blocked')),
  assigned_to uuid references profiles(id),
  due_date date,
  current_version integer not null default 1,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tasks_project on tasks(project_id);

create table if not exists task_versions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  version_number integer not null,
  title text not null,
  description text not null,
  completion_criteria jsonb not null default '[]'::jsonb,
  required_evidence jsonb not null default '[]'::jsonb,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  unique (task_id, version_number)
);

create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  uploader_id uuid not null references profiles(id),
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png')),
  file_size_bytes integer not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  caption text,
  stage text not null default 'supporting' check (stage in ('before','during','after','supporting')),
  user_claimed_capture_at timestamptz,
  uploaded_at timestamptz not null default now(),
  processing_status text not null default 'ready',
  related_evidence_id uuid references evidence(id)
);
create index if not exists idx_evidence_task on evidence(task_id);
create index if not exists idx_evidence_project on evidence(project_id);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  task_version_id uuid references task_versions(id),
  status text not null default 'queued' check (status in ('queued','processing','completed','failed')),
  overall_finding text not null check (overall_finding in ('supported','not_supported','potential_discrepancy','insufficient_evidence','not_assessable')),
  model_provider text not null,
  model_identifier text not null,
  prompt_version text not null,
  input_evidence_ids jsonb not null default '[]'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  missing_evidence jsonb not null default '[]'::jsonb,
  limitations jsonb not null default '[]'::jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_assessments_task on assessments(task_id);

create table if not exists review_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  assessment_id uuid references assessments(id),
  reviewer_id uuid not null references profiles(id),
  decision text not null check (decision in ('accepted','request_more_evidence','revision_requested','rejected','disputed')),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists idx_decisions_task on review_decisions(task_id);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  assessment_id uuid references assessments(id),
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index if not exists idx_comments_project on comments(project_id);

create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  actor_id uuid references profiles(id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_project on activity_events(project_id, created_at desc);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_recipient on notifications(recipient_id, created_at desc);

-- Row Level Security: a user can only touch rows of projects they are an
-- accepted member of. Server-side checks in the API routes enforce the same
-- rules (never rely on hidden UI alone). Service-role keys stay server-side.
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table invitations enable row level security;
alter table tasks enable row level security;
alter table task_versions enable row level security;
alter table evidence enable row level security;
alter table assessments enable row level security;
alter table review_decisions enable row level security;
alter table comments enable row level security;
alter table activity_events enable row level security;
alter table notifications enable row level security;

create policy "users read own profile" on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

create policy "members read projects" on projects for select using (
  exists (select 1 from project_members m where m.project_id = projects.id and m.user_id = auth.uid() and m.invitation_status = 'accepted'));
create policy "owners update projects" on projects for update using (
  exists (select 1 from project_members m where m.project_id = projects.id and m.user_id = auth.uid() and m.role = 'owner' and m.invitation_status = 'accepted'));
create policy "members read tasks" on tasks for select using (
  exists (select 1 from project_members m where m.project_id = tasks.project_id and m.user_id = auth.uid() and m.invitation_status = 'accepted'));
create policy "members read evidence" on evidence for select using (
  exists (select 1 from project_members m where m.project_id = evidence.project_id and m.user_id = auth.uid() and m.invitation_status = 'accepted'));
create policy "members read assessments" on assessments for select using (
  exists (select 1 from project_members m where m.project_id = assessments.project_id and m.user_id = auth.uid() and m.invitation_status = 'accepted'));
create policy "members read activity" on activity_events for select using (
  exists (select 1 from project_members m where m.project_id = activity_events.project_id and m.user_id = auth.uid() and m.invitation_status = 'accepted'));
-- Note: insert/update/delete for the remaining tables are intentionally left
-- to server-side service-role operations behind the API routes' role checks,
-- so a compromised client token alone cannot write another user's project.
-- Private storage bucket (run in Supabase dashboard / storage API):
--   insert into storage.buckets (id, name, public) values ('evidence','evidence', false);
--   then add storage policies mirroring the member checks above.
