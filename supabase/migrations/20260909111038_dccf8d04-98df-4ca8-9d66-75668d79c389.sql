-- ROLES ------------------------------------------------------------------
create type public.app_role as enum ('admin', 'supervisor', 'student');
create type public.attendance_status as enum ('present', 'late', 'absent', 'half_day', 'leave');
create type public.approval_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ORGANIZATIONS / SUPERVISORS / STUDENTS ---------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  address text,
  department text,
  contact text,
  latitude double precision,
  longitude double precision,
  radius_meters integer not null default 200,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;
alter table public.organizations enable row level security;

create table public.supervisors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  full_name text not null,
  email text not null,
  phone text,
  organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.supervisors to authenticated;
grant all on public.supervisors to service_role;
alter table public.supervisors enable row level security;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  student_no text not null unique,
  full_name text not null,
  email text not null,
  phone text,
  program text,
  university text,
  organization_id uuid references public.organizations(id) on delete set null,
  supervisor_id uuid references public.supervisors(id) on delete set null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.students to authenticated;
grant all on public.students to service_role;
alter table public.students enable row level security;

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null default (now()::date),
  sign_in_time timestamptz,
  sign_out_time timestamptz,
  status public.attendance_status not null default 'present',
  ip_address text,
  latitude double precision,
  longitude double precision,
  distance_meters integer,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);
grant select, insert, update, delete on public.attendance to authenticated;
grant all on public.attendance to service_role;
alter table public.attendance enable row level security;

create table public.daily_activities (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null default (now()::date),
  activity text not null,
  description text,
  skills_learned text,
  challenges text,
  solutions text,
  supervisor_comment text,
  approval_status public.approval_status not null default 'pending',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.daily_activities to authenticated;
grant all on public.daily_activities to service_role;
alter table public.daily_activities enable row level security;

create table public.system_settings (
  id boolean primary key default true,
  work_start time not null default '08:00',
  work_end time not null default '17:00',
  grace_minutes integer not null default 15,
  gps_required boolean not null default true,
  default_radius_meters integer not null default 200,
  constraint singleton check (id)
);
grant select, insert, update on public.system_settings to authenticated;
grant all on public.system_settings to service_role;
alter table public.system_settings enable row level security;

insert into public.system_settings (id) values (true);

-- HELPERS ---------------------------------------------------------------
create or replace function public.current_student_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.students where user_id = auth.uid() limit 1
$$;

create or replace function public.supervises_student(_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students s
    join public.supervisors v on v.id = s.supervisor_id
    where s.id = _student_id and v.user_id = auth.uid()
  )
$$;

-- POLICIES --------------------------------------------------------------
create policy "profiles readable by self and admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "profiles insert self" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles update self" on public.profiles
  for update to authenticated using (id = auth.uid());

create policy "roles readable by self and admin" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "organizations readable" on public.organizations
  for select to authenticated using (true);
create policy "organizations admin insert" on public.organizations
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "organizations admin update" on public.organizations
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "organizations admin delete" on public.organizations
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "supervisors readable" on public.supervisors
  for select to authenticated using (true);
create policy "supervisors admin insert" on public.supervisors
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "supervisors admin update" on public.supervisors
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "supervisors admin delete" on public.supervisors
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "students visible to owner supervisor admin" on public.students
  for select to authenticated using (
    user_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.supervisors v where v.id = students.supervisor_id and v.user_id = auth.uid())
  );
create policy "students admin insert" on public.students
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "students update self or admin" on public.students
  for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "students admin delete" on public.students
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "attendance visible to owner supervisor admin" on public.attendance
  for select to authenticated using (
    student_id = public.current_student_id()
    or public.has_role(auth.uid(), 'admin')
    or public.supervises_student(student_id)
  );
create policy "attendance insert own" on public.attendance
  for insert to authenticated with check (
    student_id = public.current_student_id() or public.has_role(auth.uid(), 'admin')
  );
create policy "attendance update own or admin" on public.attendance
  for update to authenticated using (
    student_id = public.current_student_id() or public.has_role(auth.uid(), 'admin')
  );

create policy "activities visible to owner supervisor admin" on public.daily_activities
  for select to authenticated using (
    student_id = public.current_student_id()
    or public.has_role(auth.uid(), 'admin')
    or public.supervises_student(student_id)
  );
create policy "activities insert own" on public.daily_activities
  for insert to authenticated with check (student_id = public.current_student_id());
create policy "activities update own supervisor admin" on public.daily_activities
  for update to authenticated using (
    student_id = public.current_student_id()
    or public.has_role(auth.uid(), 'admin')
    or public.supervises_student(student_id)
  );
create policy "activities delete own" on public.daily_activities
  for delete to authenticated using (student_id = public.current_student_id());

create policy "settings readable" on public.system_settings
  for select to authenticated using (true);
create policy "settings admin update" on public.system_settings
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- NEW USER TRIGGER ------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- DEMO DATA ------------------------------------------------------------
insert into public.organizations (id, organization_name, address, department, contact, latitude, longitude, radius_meters) values
  ('11111111-1111-4111-8111-111111111101', 'Riverside Public Health Centre', 'Plot 44, Riverside Rd, Dodoma', 'Community Health', '+255 762 118 940', -6.163000, 35.751700, 200),
  ('11111111-1111-4111-8111-111111111102', 'Zenith ICT Solutions Ltd', '3rd Floor, Nyerere Tower, Dar es Salaam', 'ICT & Networks', '+255 715 220 771', -6.792400, 39.208300, 150),
  ('11111111-1111-4111-8111-111111111103', 'National Water Utility Authority', 'Uhuru Ave, Dodoma', 'Engineering', '+255 736 449 002', -6.170900, 35.739500, 250),
  ('11111111-1111-4111-8111-111111111104', 'Mzizima Community Bank', 'Kariakoo Branch, Dar es Salaam', 'Information Systems', '+255 754 660 118', -6.816000, 39.279500, 120);

insert into public.supervisors (id, full_name, email, phone, organization_id) values
  ('22222222-2222-4222-8222-222222222201', 'Dr. Amina Okafor', 'amina.okafor@riverside.org', '+255 762 118 941', '11111111-1111-4111-8111-111111111101'),
  ('22222222-2222-4222-8222-222222222202', 'Eng. John Doe', 'john.doe@zenithict.co.tz', '+255 715 220 772', '11111111-1111-4111-8111-111111111102'),
  ('22222222-2222-4222-8222-222222222203', 'Grace Mwakalinga', 'grace.m@nwua.go.tz', '+255 736 449 003', '11111111-1111-4111-8111-111111111103'),
  ('22222222-2222-4222-8222-222222222204', 'Peter Shayo', 'peter.shayo@mzizimabank.co.tz', '+255 754 660 119', '11111111-1111-4111-8111-111111111104');

insert into public.students (id, student_no, full_name, email, phone, program, university, organization_id, supervisor_id, start_date, end_date) values
  ('33333333-3333-4333-8333-333333333301', 'UDOM/2022/04871', 'Jiana Joseph', 'jiana.joseph@student.udom.ac.tz', '+255 719 445 220', 'Computer Networks and Information Security', 'University of Dodoma', '11111111-1111-4111-8111-111111111102', '22222222-2222-4222-8222-222222222202', current_date - 40, current_date + 20),
  ('33333333-3333-4333-8333-333333333302', 'UDOM/2022/04872', 'Ruth Mensah', 'ruth.mensah@student.udom.ac.tz', '+255 719 445 221', 'B.Sc. Public Health', 'University of Dodoma', '11111111-1111-4111-8111-111111111101', '22222222-2222-4222-8222-222222222201', current_date - 40, current_date + 20),
  ('33333333-3333-4333-8333-333333333303', 'UDOM/2022/04873', 'Salim Abdallah', 'salim.abdallah@student.udom.ac.tz', '+255 719 445 222', 'B.Sc. Civil Engineering', 'University of Dodoma', '11111111-1111-4111-8111-111111111103', '22222222-2222-4222-8222-222222222203', current_date - 40, current_date + 20),
  ('33333333-3333-4333-8333-333333333304', 'UDOM/2022/04874', 'Neema Kilonzo', 'neema.kilonzo@student.udom.ac.tz', '+255 719 445 223', 'B.Sc. Information Systems', 'University of Dodoma', '11111111-1111-4111-8111-111111111104', '22222222-2222-4222-8222-222222222204', current_date - 40, current_date + 20),
  ('33333333-3333-4333-8333-333333333305', 'UDOM/2022/04875', 'Baraka Mushi', 'baraka.mushi@student.udom.ac.tz', '+255 719 445 224', 'Computer Networks and Information Security', 'University of Dodoma', '11111111-1111-4111-8111-111111111102', '22222222-2222-4222-8222-222222222202', current_date - 40, current_date + 20),
  ('33333333-3333-4333-8333-333333333306', 'UDOM/2022/04876', 'Halima Suleiman', 'halima.suleiman@student.udom.ac.tz', '+255 719 445 225', 'B.Sc. Public Health', 'University of Dodoma', '11111111-1111-4111-8111-111111111101', '22222222-2222-4222-8222-222222222201', current_date - 40, current_date + 20);

insert into public.attendance (student_id, date, sign_in_time, sign_out_time, status, ip_address, latitude, longitude, distance_meters)
select
  s.id,
  d::date,
  case when r.pick = 3 then null else (d::date + time '08:00' - interval '4 minutes' + (r.pick * interval '9 minutes')) at time zone 'Africa/Dar_es_Salaam' end,
  case when r.pick = 3 then null else (d::date + time '16:40' + (r.pick * interval '7 minutes')) at time zone 'Africa/Dar_es_Salaam' end,
  case when r.pick = 3 then 'absent'::public.attendance_status
       when r.pick = 2 then 'late'::public.attendance_status
       else 'present'::public.attendance_status end,
  '196.44.' || (10 + r.pick)::text || '.' || (20 + r.pick)::text,
  o.latitude, o.longitude, (12 + r.pick * 17)
from public.students s
join public.organizations o on o.id = s.organization_id
cross join generate_series(current_date - 39, current_date - 1, interval '1 day') d
cross join lateral (
  select (abs(hashtext(s.student_no || d::text)) % 10) / 3 as pick
) r
where extract(isodow from d) < 6;

insert into public.daily_activities (student_id, date, activity, description, skills_learned, challenges, solutions, supervisor_comment, approval_status)
select
  a.student_id,
  a.date,
  'Configured network devices and troubleshot connectivity problems.',
  'Worked with the ICT team on switch configuration, cable testing and user support tickets for the day.',
  'Network troubleshooting, IP configuration and device configuration.',
  'Limited access to the core switch during working hours.',
  'Scheduled configuration changes with the supervisor outside peak hours.',
  case when a.date < current_date - 12 then 'Good progress. Keep documenting each change.' else null end,
  case when a.date < current_date - 12 then 'approved'::public.approval_status else 'pending'::public.approval_status end
from public.attendance a
where a.status <> 'absent' and a.date > current_date - 25 and extract(isodow from a.date) in (1,3,5);