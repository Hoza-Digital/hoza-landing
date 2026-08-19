-- Add archived status support to articles table constraints
alter table public.articles
  drop constraint if exists articles_status_check;

alter table public.articles
  add constraint articles_status_check
  check (status in ('draft', 'published', 'archived'));

alter table public.articles
  drop constraint if exists articles_schedule_state_check;

alter table public.articles
  add constraint articles_schedule_state_check
  check (
    (status = 'published' and scheduled_for is null and published_at is not null)
    or
    (status = 'draft' and scheduled_for is not null and published_at is null)
    or
    (status = 'archived')
  );

-- Create RPC to fetch single article by ID for editing
create or replace function public.hoza_admin_get_article(
  p_backend_secret text,
  p_id bigint
)
returns table (
  id bigint,
  title text,
  slug text,
  category text,
  excerpt text,
  content text,
  cover_image_url text,
  cover_image_path text,
  cover_image_alt text,
  author_name text,
  seo_title text,
  seo_description text,
  geo_summary text,
  status text,
  publish_date date,
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  return query
  select
    article.id,
    article.title,
    article.slug,
    article.category,
    article.excerpt,
    article.content,
    article.cover_image_url,
    article.cover_image_path,
    article.cover_image_alt,
    article.author_name,
    article.seo_title,
    article.seo_description,
    article.geo_summary,
    article.status,
    article.publish_date,
    article.scheduled_for,
    article.published_at,
    article.created_at,
    article.updated_at
  from public.articles article
  where article.id = p_id
  limit 1;
end;
$$;

-- Create RPC to update an article
create or replace function public.hoza_admin_update_article(
  p_backend_secret text,
  p_id bigint,
  p_title text,
  p_slug text,
  p_category text,
  p_excerpt text,
  p_content text,
  p_cover_image_url text,
  p_cover_image_path text,
  p_cover_image_alt text,
  p_seo_title text,
  p_seo_description text,
  p_geo_summary text,
  p_status text,
  p_publish_date date,
  p_scheduled_for timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  date_code text;
  existing_published_at timestamptz;
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  if p_status not in ('draft', 'published', 'archived') then
    raise exception 'Invalid article status' using errcode = '22023';
  end if;

  if p_status = 'draft' and p_scheduled_for is null then
    raise exception 'Drafts require a target publication time' using errcode = '22023';
  end if;

  if p_status = 'published' and p_scheduled_for is not null then
    raise exception 'Published articles cannot have a draft schedule' using errcode = '22023';
  end if;

  if p_status = 'draft'
    and (p_scheduled_for at time zone 'Asia/Jakarta')::date <> p_publish_date then
    raise exception 'The publication date and time do not match' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.article_images image
    where image.storage_path = p_cover_image_path
      and image.public_url = p_cover_image_url
  ) then
    raise exception 'Select an image from the registered gallery' using errcode = '22023';
  end if;

  select published_at into existing_published_at
  from public.articles
  where id = p_id;

  if not found then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;

  update public.articles
  set
    title = trim(p_title),
    slug = lower(trim(p_slug)),
    category = trim(p_category),
    excerpt = trim(p_excerpt),
    content = trim(p_content),
    cover_image_url = p_cover_image_url,
    cover_image_path = p_cover_image_path,
    cover_image_alt = trim(p_cover_image_alt),
    seo_title = trim(p_seo_title),
    seo_description = trim(p_seo_description),
    geo_summary = trim(coalesce(p_geo_summary, '')),
    status = p_status,
    publish_date = p_publish_date,
    scheduled_for = case when p_status = 'draft' then p_scheduled_for else null end,
    published_at = case
      when p_status = 'published' then coalesce(existing_published_at, now())
      when p_status = 'draft' then null
      else existing_published_at
    end,
    updated_at = now()
  where id = p_id;

  date_code := to_char(p_publish_date, 'YYMMDD');

  return jsonb_build_object(
    'id', p_id,
    'slug', lower(trim(p_slug)),
    'dateCode', date_code,
    'status', p_status,
    'path', '/article/' || date_code || '/' || lower(trim(p_slug))
  );
end;
$$;

-- Create RPC to toggle archive status
create or replace function public.hoza_admin_toggle_article_archive(
  p_backend_secret text,
  p_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_article record;
  new_status text;
  new_scheduled_for timestamptz;
  new_published_at timestamptz;
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  select * into target_article
  from public.articles
  where id = p_id;

  if not found then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;

  if target_article.status = 'archived' then
    if target_article.published_at is not null then
      new_status := 'published';
      new_scheduled_for := null;
      new_published_at := target_article.published_at;
    else
      new_status := 'draft';
      new_scheduled_for := coalesce(target_article.scheduled_for, now() + interval '1 day');
      new_published_at := null;
    end if;
  else
    new_status := 'archived';
    new_scheduled_for := target_article.scheduled_for;
    new_published_at := target_article.published_at;
  end if;

  update public.articles
  set
    status = new_status,
    scheduled_for = new_scheduled_for,
    published_at = new_published_at,
    updated_at = now()
  where id = p_id;

  return jsonb_build_object(
    'id', p_id,
    'status', new_status
  );
end;
$$;

-- Create RPC to permanently delete an article
create or replace function public.hoza_admin_delete_article(
  p_backend_secret text,
  p_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_row record;
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  delete from public.articles
  where id = p_id
  returning id, title, slug into deleted_row;

  if not found then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'id', deleted_row.id,
    'title', deleted_row.title,
    'slug', deleted_row.slug,
    'deleted', true
  );
end;
$$;

revoke all on function public.hoza_admin_get_article(text, bigint) from public;
revoke all on function public.hoza_admin_update_article(text, bigint, text, text, text, text, text, text, text, text, text, text, text, text, date, timestamptz) from public;
revoke all on function public.hoza_admin_toggle_article_archive(text, bigint) from public;
revoke all on function public.hoza_admin_delete_article(text, bigint) from public;

grant execute on function public.hoza_admin_get_article(text, bigint) to anon, authenticated;
grant execute on function public.hoza_admin_update_article(text, bigint, text, text, text, text, text, text, text, text, text, text, text, text, date, timestamptz) to anon, authenticated;
grant execute on function public.hoza_admin_toggle_article_archive(text, bigint) to anon, authenticated;
grant execute on function public.hoza_admin_delete_article(text, bigint) to anon, authenticated;
