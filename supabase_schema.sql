-- =====================================================================
-- VICTOTALCOACH V2 · Esquema Supabase (PostgreSQL) con seguridad por filas
-- ESTADO: ESCRITO PERO NO EJECUTADO NI VERIFICADO (no había PostgreSQL en el
-- entorno de desarrollo). Ejecútalo primero en un proyecto de PRUEBA y pasa las
-- pruebas de la guía (backend/GUIA_SUPABASE.md, sección 6) antes de usar datos reales.
-- Ejecutar en: Supabase > SQL Editor > New query > pegar todo > Run.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tipos ----------
do $$ begin
  create type public.account_status as enum ('pending','active','suspended','blocked');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.app_role as enum ('superadmin','coach','collaborator');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.share_scope as enum ('personal','team','org');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.team_perm as enum ('view','edit');
exception when duplicate_object then null; end $$;

-- ---------- Organización y perfiles ----------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'coach',
  status public.account_status not null default 'pending',
  org_id uuid references public.organizations(id),
  created_at timestamptz not null default now(),
  status_changed_at timestamptz,
  status_changed_by uuid
);

-- Perfil automático (siempre PENDIENTE, rol entrenador) al crearse una cuenta
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Funciones de apoyo (leen SIEMPRE el estado actual en la base de datos) ----------
create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'active');
$$;
create or replace function public.is_superadmin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'active' and role = 'superadmin');
$$;

-- Equipos
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id),
  owner_id uuid not null references public.profiles(id),
  name text not null,
  sport text not null default 'handball',
  age_range_id uuid,
  data jsonb not null default '{}'::jsonb,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  perm public.team_perm not null default 'view',
  primary key (team_id, user_id)
);

create or replace function public.can_read_team(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_active() and (
    public.is_superadmin()
    or exists (select 1 from public.teams x where x.id = t and x.owner_id = auth.uid())
    or exists (select 1 from public.team_members m where m.team_id = t and m.user_id = auth.uid()));
$$;
create or replace function public.can_edit_team(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_active() and (
    public.is_superadmin()
    or exists (select 1 from public.teams x where x.id = t and x.owner_id = auth.uid())
    or exists (select 1 from public.team_members m where m.team_id = t and m.user_id = auth.uid() and m.perm = 'edit'));
$$;

-- ---------- Tablas de contenido ligadas a un equipo ----------
-- Clave de propiedad en columnas; contenido flexible en data (jsonb), igual que la app actual.
do $$
declare t text;
begin
  foreach t in array array['players','seasons','microcycles','sessions','matches','evaluations','scouting_projects','scouting_cuts','playlists'] loop
    execute format($f$
      create table if not exists public.%I (
        id uuid primary key default gen_random_uuid(),
        team_id uuid not null references public.teams(id) on delete cascade,
        data jsonb not null default '{}'::jsonb,
        legacy_id text,
        created_by uuid references public.profiles(id),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )$f$, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_select', t);
    execute format('drop policy if exists %I on public.%I', t||'_write', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.can_read_team(team_id))', t||'_select', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.can_edit_team(team_id)) with check (public.can_edit_team(team_id))', t||'_write', t);
  end loop;
end $$;

-- ---------- Biblioteca: ejercicios, categorías, rangos de edad (ámbito personal / equipo / organización) ----------
do $$
declare t text;
begin
  foreach t in array array['exercises','exercise_categories','age_ranges'] loop
    execute format($f$
      create table if not exists public.%I (
        id uuid primary key default gen_random_uuid(),
        scope public.share_scope not null default 'personal',
        owner_id uuid not null references public.profiles(id),
        team_id uuid references public.teams(id) on delete cascade,
        org_id uuid references public.organizations(id),
        shared_edit boolean not null default false,
        sport text not null default 'handball',
        origin_id uuid,
        data jsonb not null default '{}'::jsonb,
        legacy_id text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        constraint %I check ((scope = 'team') = (team_id is not null))
      )$f$, t, t||'_scope_chk');
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_select', t);
    execute format('drop policy if exists %I on public.%I', t||'_write', t);
    execute format($p$create policy %I on public.%I for select to authenticated using (
        public.is_active() and (
          public.is_superadmin()
          or (scope = 'personal' and owner_id = auth.uid())
          or (scope = 'team' and public.can_read_team(team_id))
          or (scope = 'org' and org_id is not null and org_id = (select org_id from public.profiles where id = auth.uid()))))$p$, t||'_select', t);
    execute format($p$create policy %I on public.%I for all to authenticated using (
        public.is_active() and (
          public.is_superadmin()
          or (scope = 'personal' and owner_id = auth.uid())
          or (scope = 'team' and public.can_edit_team(team_id))
          or (scope = 'org' and org_id = (select org_id from public.profiles where id = auth.uid()) and (owner_id = auth.uid() or shared_edit))))
      with check (
        public.is_active() and (
          public.is_superadmin()
          or (scope = 'personal' and owner_id = auth.uid())
          or (scope = 'team' and public.can_edit_team(team_id))
          or (scope = 'org' and org_id = (select org_id from public.profiles where id = auth.uid()) and (owner_id = auth.uid() or shared_edit))))$p$, t||'_write', t);
  end loop;
end $$;

-- Copiar un ejercicio compartido a la biblioteca personal (la copia es independiente del original)
create or replace function public.copy_exercise_to_personal(src uuid) returns uuid
language plpgsql security invoker set search_path = public as $$
declare nid uuid;
begin
  insert into public.exercises (scope, owner_id, sport, origin_id, data)
  select 'personal', auth.uid(), e.sport, e.id, e.data from public.exercises e where e.id = src
  returning id into nid;   -- la política de lectura impide copiar lo que no puedes ver
  if nid is null then raise exception 'Ejercicio no disponible'; end if;
  return nid;
end $$;

-- ---------- Seguridad de perfiles ----------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

revoke insert, update, delete on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;   -- solo el nombre; rol y estado NO

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_superadmin());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Barrera adicional: nadie que no sea superadmin puede cambiar rol, estado u organización
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_superadmin() then
    if new.role is distinct from old.role or new.status is distinct from old.status
       or new.org_id is distinct from old.org_id or new.email is distinct from old.email then
      raise exception 'Operación no permitida';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();

drop policy if exists orgs_select on public.organizations;
create policy orgs_select on public.organizations for select to authenticated
  using (public.is_active() and (public.is_superadmin() or id = (select org_id from public.profiles where id = auth.uid())));

drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams for select to authenticated using (public.can_read_team(id));
drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams for insert to authenticated
  with check (public.is_active() and owner_id = auth.uid());
drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams for update to authenticated
  using (public.can_edit_team(id)) with check (public.can_edit_team(id));
drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams for delete to authenticated
  using (public.is_active() and (owner_id = auth.uid() or public.is_superadmin()));

drop policy if exists tm_select on public.team_members;
create policy tm_select on public.team_members for select to authenticated
  using (user_id = auth.uid() or public.can_edit_team(team_id));
drop policy if exists tm_write on public.team_members;
create policy tm_write on public.team_members for all to authenticated
  using (public.is_superadmin() or exists (select 1 from public.teams x where x.id = team_id and x.owner_id = auth.uid()))
  with check (public.is_superadmin() or exists (select 1 from public.teams x where x.id = team_id and x.owner_id = auth.uid()));

-- ---------- Solicitudes de acceso y auditoría ----------
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
alter table public.access_requests enable row level security;
drop policy if exists ar_insert on public.access_requests;
create policy ar_insert on public.access_requests for insert to anon, authenticated
  with check (status = 'pending' and length(email) < 200 and length(coalesce(message,'')) < 1000);
drop policy if exists ar_admin on public.access_requests;
create policy ar_admin on public.access_requests for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  action text not null,
  target uuid,
  detail jsonb
);
alter table public.audit_log enable row level security;
drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log for select to authenticated using (public.is_superadmin());

-- ---------- Funciones de administración (solo superadministrador) ----------
create or replace function public.admin_set_status(uid uuid, new_status public.account_status) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_superadmin() then raise exception 'Solo el superadministrador'; end if;
  if uid = auth.uid() and new_status <> 'active' then raise exception 'No puedes desactivar tu propia cuenta'; end if;
  update public.profiles set status = new_status, status_changed_at = now(), status_changed_by = auth.uid() where id = uid;
  insert into public.audit_log(actor, action, target, detail) values (auth.uid(), 'set_status', uid, jsonb_build_object('status', new_status));
end $$;

create or replace function public.admin_set_role(uid uuid, new_role public.app_role) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_superadmin() then raise exception 'Solo el superadministrador'; end if;
  if uid = auth.uid() and new_role <> 'superadmin' then raise exception 'No puedes quitarte a ti mismo el rol de superadministrador'; end if;
  update public.profiles set role = new_role where id = uid;
  insert into public.audit_log(actor, action, target, detail) values (auth.uid(), 'set_role', uid, jsonb_build_object('role', new_role));
end $$;

create or replace function public.admin_assign_team(uid uuid, tid uuid, p public.team_perm) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_superadmin() then raise exception 'Solo el superadministrador'; end if;
  insert into public.team_members(team_id, user_id, perm) values (tid, uid, p)
  on conflict (team_id, user_id) do update set perm = excluded.perm;
  insert into public.audit_log(actor, action, target, detail) values (auth.uid(), 'assign_team', uid, jsonb_build_object('team', tid, 'perm', p));
end $$;

revoke all on function public.admin_set_status(uuid, public.account_status) from public, anon;
revoke all on function public.admin_set_role(uuid, public.app_role) from public, anon;
revoke all on function public.admin_assign_team(uuid, uuid, public.team_perm) from public, anon;
grant execute on function public.admin_set_status(uuid, public.account_status) to authenticated;
grant execute on function public.admin_set_role(uuid, public.app_role) to authenticated;
grant execute on function public.admin_assign_team(uuid, uuid, public.team_perm) to authenticated;

-- ---------- Archivos (imágenes, pizarras, fotos): bucket privado, carpeta = id del propietario ----------
insert into storage.buckets (id, name, public) values ('media', 'media', false) on conflict (id) do nothing;
drop policy if exists media_rw on storage.objects;
create policy media_rw on storage.objects for all to authenticated
  using (bucket_id = 'media' and public.is_active() and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'media' and public.is_active() and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- PRIMER SUPERADMINISTRADOR (ejecutar UNA SOLA VEZ, a mano, tras crear tu cuenta) ----------
-- 1) Crea tu usuario en Authentication > Users > Add user (con tu correo).
-- 2) Ejecuta esto cambiando el correo:
--   insert into public.organizations(name) values ('Mi club') returning id;      -- copia el id
--   update public.profiles set role='superadmin', status='active', org_id='<ID_DE_LA_ORGANIZACIÓN>'
--   where email='tu_correo@ejemplo.com';
-- Esta sentencia solo funciona desde el SQL Editor (rol de servicio); ningún usuario puede hacerla desde la app.
