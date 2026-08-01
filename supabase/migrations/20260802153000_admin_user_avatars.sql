alter table public.admin_users
  add column if not exists avatar_path text;

alter table public.admin_users
  drop constraint if exists admin_users_avatar_path_check;

alter table public.admin_users
  add constraint admin_users_avatar_path_check
  check (
    avatar_path is null
    or avatar_path ~ '^[0-9]{6}/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$'
  );

drop function if exists public.hoza_admin_list_users(text, bigint);

create function public.hoza_admin_list_users(
  p_backend_secret text,
  p_actor_id bigint
)
returns table (
  id bigint,
  name text,
  email text,
  role text,
  avatar_path text,
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
  select u.id, u.name, u.email, u.role, u.avatar_path, u.active, u.created_at
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

create or replace function public.hoza_admin_create_user_with_avatar(
  p_backend_secret text,
  p_actor_id bigint,
  p_name text,
  p_email text,
  p_role text,
  p_password_hash text,
  p_avatar_path text
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

  if p_avatar_path is not null
    and p_avatar_path !~ '^[0-9]{6}/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$'
  then
    raise exception 'Invalid user avatar path' using errcode = '22023';
  end if;

  if not (
    actor_role = 'super_admin'
    or (actor_role = 'admin' and p_role <> 'super_admin')
    or (actor_role = 'marketing' and p_role = 'marketing')
    or (actor_role = 'writer' and p_role = 'writer')
  ) then
    raise exception 'Role assignment is not allowed' using errcode = '42501';
  end if;

  insert into public.admin_users (name, email, role, password_hash, avatar_path, active)
  values (
    trim(p_name),
    lower(trim(p_email)),
    p_role,
    p_password_hash,
    nullif(trim(p_avatar_path), ''),
    true
  )
  returning id into new_user_id;

  return new_user_id;
exception
  when unique_violation then
    raise exception 'A user with this email already exists' using errcode = '23505';
end;
$$;

revoke all on function public.hoza_admin_list_users(text, bigint) from public;
revoke all on function public.hoza_admin_create_user_with_avatar(text, bigint, text, text, text, text, text) from public;

grant execute on function public.hoza_admin_list_users(text, bigint) to anon, authenticated;
grant execute on function public.hoza_admin_create_user_with_avatar(text, bigint, text, text, text, text, text) to anon, authenticated;
