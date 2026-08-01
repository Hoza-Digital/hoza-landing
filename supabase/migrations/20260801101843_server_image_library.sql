alter table public.article_images
  drop constraint if exists article_images_storage_path_check,
  drop constraint if exists article_images_public_url_check;

update public.article_images
set storage_path = '260801/project-business.webp',
    public_url = '/image/260801/project-business'
where original_name = 'project-business.webp'
  and storage_path ~ '^[0-9]{4}/[0-9]{2}/[0-9a-f-]+\.webp$';

alter table public.article_images
  add constraint article_images_storage_path_check
    check (storage_path ~ '^[0-9]{6}/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$'),
  add constraint article_images_public_url_check
    check (public_url ~ '^/image/[0-9]{6}/[a-z0-9]+(?:-[a-z0-9]+)*$');

create or replace function public.hoza_admin_register_article_image(
  p_backend_secret text,
  p_storage_path text,
  p_public_url text,
  p_original_name text,
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

  insert into public.article_images (
    storage_path, public_url, original_name, size_bytes, width, height
  ) values (
    p_storage_path,
    p_public_url,
    left(coalesce(nullif(trim(p_original_name), ''), 'article-image.webp'), 180),
    p_size_bytes,
    p_width,
    p_height
  )
  on conflict (storage_path) do update
  set public_url = excluded.public_url,
      original_name = excluded.original_name,
      size_bytes = excluded.size_bytes,
      width = excluded.width,
      height = excluded.height
  returning id into image_id;

  return image_id;
end;
$$;

revoke all on function public.hoza_admin_register_article_image(text, text, text, text, bigint, integer, integer) from public;
grant execute on function public.hoza_admin_register_article_image(text, text, text, text, bigint, integer, integer) to anon, authenticated;

revoke all on function public.hoza_admin_validate_backend_secret(text) from public;
drop function public.hoza_admin_validate_backend_secret(text);
