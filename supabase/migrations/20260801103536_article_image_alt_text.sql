alter table public.article_images
  add column alt_text text;

update public.article_images
set alt_text = case
  when original_name = 'project-business.webp'
    then 'Business team reviewing a digital project interface'
  else left(
    coalesce(
      nullif(initcap(regexp_replace(regexp_replace(original_name, '\.webp$', '', 'i'), '[-_]+', ' ', 'g')), ''),
      'Article cover image'
    ),
    180
  )
end;

alter table public.article_images
  alter column alt_text set not null,
  add constraint article_images_alt_text_check
    check (char_length(trim(alt_text)) between 3 and 180);

revoke all on function public.hoza_admin_register_article_image(text, text, text, text, bigint, integer, integer) from public;
drop function public.hoza_admin_register_article_image(text, text, text, text, bigint, integer, integer);

create function public.hoza_admin_register_article_image(
  p_backend_secret text,
  p_storage_path text,
  p_public_url text,
  p_original_name text,
  p_alt_text text,
  p_size_bytes bigint,
  p_width integer,
  p_height integer
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  image_id bigint;
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  if p_storage_path is null or p_storage_path !~ '^[0-9]{6}/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$' then
    raise exception 'Invalid image path' using errcode = '22023';
  end if;

  if p_public_url is null or p_public_url !~ '^/image/[0-9]{6}/[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid image URL' using errcode = '22023';
  end if;

  if p_alt_text is null or char_length(trim(p_alt_text)) not between 3 and 180 then
    raise exception 'Invalid image alt text' using errcode = '22023';
  end if;

  insert into public.article_images (
    storage_path, public_url, original_name, alt_text, size_bytes, width, height
  ) values (
    p_storage_path,
    p_public_url,
    left(coalesce(nullif(trim(p_original_name), ''), 'article-image.webp'), 180),
    trim(p_alt_text),
    p_size_bytes,
    p_width,
    p_height
  )
  on conflict (storage_path) do update
  set public_url = excluded.public_url,
      original_name = excluded.original_name,
      alt_text = excluded.alt_text,
      size_bytes = excluded.size_bytes,
      width = excluded.width,
      height = excluded.height
  returning id into image_id;

  return image_id;
end;
$$;

revoke all on function public.hoza_admin_register_article_image(text, text, text, text, text, bigint, integer, integer) from public;
grant execute on function public.hoza_admin_register_article_image(text, text, text, text, text, bigint, integer, integer) to anon, authenticated;

revoke all on function public.hoza_admin_list_article_images(text) from public;
drop function public.hoza_admin_list_article_images(text);

create function public.hoza_admin_list_article_images(
  p_backend_secret text
)
returns table (
  id bigint,
  storage_path text,
  public_url text,
  original_name text,
  alt_text text,
  size_bytes bigint,
  width integer,
  height integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);

  return query
  select
    image.id,
    image.storage_path,
    image.public_url,
    image.original_name,
    image.alt_text,
    image.size_bytes,
    image.width,
    image.height,
    image.created_at
  from public.article_images image
  order by image.created_at desc
  limit 200;
end;
$$;

revoke all on function public.hoza_admin_list_article_images(text) from public;
grant execute on function public.hoza_admin_list_article_images(text) to anon, authenticated;
