alter table public.articles
  add column scheduled_for timestamptz;

alter table public.articles
  add constraint articles_schedule_state_check
  check (
    (status = 'published' and scheduled_for is null and published_at is not null)
    or
    (status = 'draft' and scheduled_for is not null and published_at is null)
  );

revoke all on function public.hoza_admin_create_article(text, text, text, text, text, text, text, text, text, text, text, text, text, text, date) from public;
drop function public.hoza_admin_create_article(text, text, text, text, text, text, text, text, text, text, text, text, text, text, date);

create function public.hoza_admin_create_article(
  p_backend_secret text,
  p_title text,
  p_slug text,
  p_category text,
  p_excerpt text,
  p_content text,
  p_cover_image_url text,
  p_cover_image_path text,
  p_cover_image_alt text,
  p_author_name text,
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
  article_id bigint;
  date_code text;
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  if p_status not in ('draft', 'published') then
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

  insert into public.articles (
    title,
    slug,
    category,
    excerpt,
    content,
    cover_image_url,
    cover_image_path,
    cover_image_alt,
    author_name,
    seo_title,
    seo_description,
    geo_summary,
    status,
    publish_date,
    scheduled_for,
    published_at
  ) values (
    trim(p_title),
    lower(trim(p_slug)),
    trim(p_category),
    trim(p_excerpt),
    trim(p_content),
    p_cover_image_url,
    p_cover_image_path,
    trim(p_cover_image_alt),
    trim(p_author_name),
    trim(p_seo_title),
    trim(p_seo_description),
    trim(coalesce(p_geo_summary, '')),
    p_status,
    p_publish_date,
    case when p_status = 'draft' then p_scheduled_for else null end,
    case when p_status = 'published' then now() else null end
  )
  returning id into article_id;

  date_code := to_char(p_publish_date, 'YYMMDD');

  return jsonb_build_object(
    'id', article_id,
    'slug', lower(trim(p_slug)),
    'dateCode', date_code,
    'status', p_status,
    'path', '/article/' || date_code || '/' || lower(trim(p_slug))
  );
end;
$$;

revoke all on function public.hoza_admin_create_article(text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, timestamptz) from public;
grant execute on function public.hoza_admin_create_article(text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, timestamptz) to anon, authenticated;
