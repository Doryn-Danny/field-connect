revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.current_student_id() from public, anon;
revoke all on function public.supervises_student(uuid) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.current_student_id() to authenticated;
grant execute on function public.supervises_student(uuid) to authenticated;