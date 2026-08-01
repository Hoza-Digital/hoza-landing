alter table public.admin_users
  add column if not exists name text,
  add column if not exists role text;

update public.admin_users
set name = initcap(replace(split_part(email, '@', 1), '.', ' '))
where name is null or trim(name) = '';

update public.admin_users
set role = 'admin'
where role is null or role not in ('super_admin', 'admin', 'marketing', 'writer');

alter table public.admin_users
  alter column name set default '',
  alter column name set not null,
  alter column role set default 'admin',
  alter column role set not null;

alter table public.admin_users
  drop constraint if exists admin_users_role_check;

alter table public.admin_users
  add constraint admin_users_role_check
  check (role in ('super_admin', 'admin', 'marketing', 'writer'));

update public.admin_users
set name = case when trim(name) = '' then 'Thrive Story' else name end,
    role = 'super_admin',
    active = true,
    updated_at = now()
where lower(email) = 'thrivestory@gmail.com';

drop function if exists public.hoza_admin_get_user_by_email(text, text);
drop function if exists public.hoza_admin_get_user_by_id(text, bigint);

create function public.hoza_admin_get_user_by_email(
  p_backend_secret text,
  p_email text
)
returns table (
  id bigint,
  name text,
  email text,
  role text,
  password_hash text,
  active boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  return query
  select u.id, u.name, u.email, u.role, u.password_hash, u.active
  from public.admin_users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;
end;
$$;

create function public.hoza_admin_get_user_by_id(
  p_backend_secret text,
  p_id bigint
)
returns table (
  id bigint,
  name text,
  email text,
  role text,
  password_hash text,
  active boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  return query
  select u.id, u.name, u.email, u.role, u.password_hash, u.active
  from public.admin_users u
  where u.id = p_id
  limit 1;
end;
$$;

create or replace function public.hoza_admin_list_users(
  p_backend_secret text,
  p_actor_id bigint
)
returns table (
  id bigint,
  name text,
  email text,
  role text,
  active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role text;
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  select u.role into actor_role
  from public.admin_users u
  where u.id = p_actor_id and u.active;

  if actor_role is null then
    raise exception 'Active user required' using errcode = '42501';
  end if;

  return query
  select u.id, u.name, u.email, u.role, u.active, u.created_at
  from public.admin_users u
  where u.active
    and (
      actor_role = 'super_admin'
      or (actor_role = 'admin' and u.role <> 'super_admin')
      or (actor_role = 'marketing' and u.role = 'marketing')
      or (actor_role = 'writer' and u.role = 'writer')
    )
  order by
    case u.role
      when 'super_admin' then 1
      when 'admin' then 2
      when 'marketing' then 3
      else 4
    end,
    lower(u.name),
    lower(u.email);
end;
$$;

create or replace function public.hoza_admin_create_user(
  p_backend_secret text,
  p_actor_id bigint,
  p_name text,
  p_email text,
  p_role text,
  p_password_hash text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role text;
  new_user_id bigint;
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  select u.role into actor_role
  from public.admin_users u
  where u.id = p_actor_id and u.active;

  if actor_role is null then
    raise exception 'Active user required' using errcode = '42501';
  end if;

  if p_name is null or char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 100 then
    raise exception 'Invalid user name' using errcode = '22023';
  end if;

  if p_email is null or p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid user email' using errcode = '22023';
  end if;

  if p_role not in ('super_admin', 'admin', 'marketing', 'writer') then
    raise exception 'Invalid user role' using errcode = '22023';
  end if;

  if p_password_hash is null or p_password_hash not like 'scrypt$%$%' then
    raise exception 'Invalid user password hash' using errcode = '22023';
  end if;

  if not (
    actor_role = 'super_admin'
    or (actor_role = 'admin' and p_role <> 'super_admin')
    or (actor_role = 'marketing' and p_role = 'marketing')
    or (actor_role = 'writer' and p_role = 'writer')
  ) then
    raise exception 'Role assignment is not allowed' using errcode = '42501';
  end if;

  insert into public.admin_users (name, email, role, password_hash, active)
  values (trim(p_name), lower(trim(p_email)), p_role, p_password_hash, true)
  returning id into new_user_id;

  return new_user_id;
exception
  when unique_violation then
    raise exception 'A user with this email already exists' using errcode = '23505';
end;
$$;

create or replace function public.hoza_admin_update_user_role(
  p_backend_secret text,
  p_actor_id bigint,
  p_target_id bigint,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role text;
  target_role text;
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  select u.role into actor_role
  from public.admin_users u
  where u.id = p_actor_id and u.active;

  select u.role into target_role
  from public.admin_users u
  where u.id = p_target_id and u.active;

  if actor_role is null or target_role is null then
    raise exception 'Active user required' using errcode = '42501';
  end if;

  if p_role not in ('super_admin', 'admin', 'marketing', 'writer') then
    raise exception 'Invalid user role' using errcode = '22023';
  end if;

  if target_role = 'super_admin' then
    raise exception 'Super Admin roles are protected' using errcode = '42501';
  end if;

  if not (
    actor_role = 'super_admin'
    or (
      actor_role = 'admin'
      and target_role in ('marketing', 'writer')
      and p_role in ('marketing', 'writer')
    )
  ) then
    raise exception 'Role update is not allowed' using errcode = '42501';
  end if;

  update public.admin_users
  set role = p_role,
      updated_at = now()
  where id = p_target_id;
end;
$$;

create or replace function public.hoza_admin_delete_user(
  p_backend_secret text,
  p_actor_id bigint,
  p_target_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role text;
  target_role text;
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  select u.role into actor_role
  from public.admin_users u
  where u.id = p_actor_id and u.active;

  select u.role into target_role
  from public.admin_users u
  where u.id = p_target_id and u.active;

  if actor_role is null or target_role is null then
    raise exception 'Active user required' using errcode = '42501';
  end if;

  if target_role = 'super_admin' then
    raise exception 'Super Admin users cannot be deleted' using errcode = '42501';
  end if;

  if not (
    actor_role = 'super_admin'
    or (actor_role = 'admin' and target_role in ('marketing', 'writer'))
  ) then
    raise exception 'User deletion is not allowed' using errcode = '42501';
  end if;

  delete from public.admin_users
  where id = p_target_id;
end;
$$;

revoke all on function public.hoza_admin_get_user_by_email(text, text) from public;
revoke all on function public.hoza_admin_get_user_by_id(text, bigint) from public;
revoke all on function public.hoza_admin_list_users(text, bigint) from public;
revoke all on function public.hoza_admin_create_user(text, bigint, text, text, text, text) from public;
revoke all on function public.hoza_admin_update_user_role(text, bigint, bigint, text) from public;
revoke all on function public.hoza_admin_delete_user(text, bigint, bigint) from public;

grant execute on function public.hoza_admin_get_user_by_email(text, text) to anon, authenticated;
grant execute on function public.hoza_admin_get_user_by_id(text, bigint) to anon, authenticated;
grant execute on function public.hoza_admin_list_users(text, bigint) to anon, authenticated;
grant execute on function public.hoza_admin_create_user(text, bigint, text, text, text, text) to anon, authenticated;
grant execute on function public.hoza_admin_update_user_role(text, bigint, bigint, text) to anon, authenticated;
grant execute on function public.hoza_admin_delete_user(text, bigint, bigint) to anon, authenticated;
