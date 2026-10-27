-- Activación manual de consola Superadministración Taller 360.
-- Ejecutar en Supabase SQL Editor, como dueño de la base. No activa ningún usuario automáticamente.
create table if not exists rubinstein.superadministradores (
 usuario_id uuid primary key references auth.users(id) on delete cascade,
 activo boolean not null default true,
 creado_en timestamptz not null default now()
);
alter table rubinstein.superadministradores enable row level security;
revoke all on rubinstein.superadministradores from anon,authenticated;
grant select on rubinstein.superadministradores to authenticated;
drop policy if exists superadmin_consultar_propio on rubinstein.superadministradores;
create policy superadmin_consultar_propio on rubinstein.superadministradores
 for select to authenticated using (usuario_id=(select auth.uid()));
create or replace function public.t360_es_superadmin()
returns boolean language sql stable security definer set search_path = ''
as $$select exists(select 1 from rubinstein.superadministradores s where s.usuario_id=(select auth.uid()) and s.activo=true);$$;
revoke all on function public.t360_es_superadmin() from public,anon;
grant execute on function public.t360_es_superadmin() to authenticated;
-- Para habilitar un administrador VERIFICADO:
-- insert into rubinstein.superadministradores(usuario_id,activo) values ('UUID_AUTH_USERS_VALIDADO',true)
-- on conflict(usuario_id) do update set activo=excluded.activo;
-- Importante: los permisos editados en el prototipo son locales y NO conceden accesos efectivos.
-- No almacenar ni cambiar contraseñas desde la interfaz web administrativa. Para producción usar Supabase Auth Admin vía backend confiable.
