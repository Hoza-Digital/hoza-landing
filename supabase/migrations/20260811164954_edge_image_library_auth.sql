create or replace function public.hoza_edge_validate_backend_secret(
  p_backend_secret text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.hoza_assert_backend_secret(p_backend_secret);
  return true;
exception
  when insufficient_privilege then
    return false;
end;
$$;

revoke all on function public.hoza_edge_validate_backend_secret(text) from public, anon, authenticated;
grant execute on function public.hoza_edge_validate_backend_secret(text) to service_role;
