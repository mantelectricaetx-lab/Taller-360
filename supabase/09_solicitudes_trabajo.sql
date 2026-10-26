-- Taller 360 · Solicitudes de trabajo: ejecutar en Supabase SQL Editor.
-- Este archivo crea tablas dedicadas al portal. NO asigna vehículos a ningún usuario automáticamente.
create extension if not exists pgcrypto;
create table if not exists rubinstein.solicitud_servicios (
 id uuid primary key default gen_random_uuid(), taller_id uuid not null,
 codigo text, nombre text not null, categoria text not null default 'General',
 descripcion text, activo boolean not null default true, creado_en timestamptz not null default now()
);
create unique index if not exists sol_serv_taller_codigo on rubinstein.solicitud_servicios(taller_id,codigo) where codigo is not null;
create table if not exists rubinstein.solicitud_vehiculos (
 id uuid primary key default gen_random_uuid(), taller_id uuid not null,
 usuario_id uuid not null references auth.users(id),
 -- vinculación con vehículo maestro, si tiene UUID; mantener el vínculo admin verificado.
 vehiculo_id text not null, patente text not null,
 marca text, modelo text, anio integer,
 activo boolean not null default true, creado_en timestamptz not null default now(),
 unique(taller_id,usuario_id,vehiculo_id)
);
create table if not exists rubinstein.solicitudes_trabajo (
 id uuid primary key default gen_random_uuid(),
 taller_id uuid not null, usuario_id uuid not null references auth.users(id),
 vinculo_vehiculo_id uuid not null references rubinstein.solicitud_vehiculos(id),
 servicio_id uuid references rubinstein.solicitud_servicios(id),
 tipo text not null check(tipo in ('catalogo','abierta')),
 asunto text not null, descripcion text not null,
 urgencia text not null default 'normal' check(urgencia in ('baja','normal','alta')),
 contacto text, estado text not null default 'recibida'
 check(estado in ('recibida','evaluacion','aprobada','rechazada','convertida_ot','cerrada')),
 fecha_solicitada date, creada_en timestamptz not null default now(),
 constraint catalogo_requiere_servicio check ((tipo='catalogo' and servicio_id is not null) or (tipo='abierta' and servicio_id is null))
);
create index if not exists st_usuario_idx on rubinstein.solicitudes_trabajo(usuario_id,creada_en desc);
create index if not exists st_taller_idx on rubinstein.solicitudes_trabajo(taller_id,estado);
create index if not exists st_vehiculo_usuario_idx on rubinstein.solicitud_vehiculos(usuario_id,taller_id);
-- No confiar en taller_id, usuario_id o en el nombre del vehículo enviado desde navegador.
create or replace function rubinstein.validar_solicitud_cliente()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_taller uuid; v_usuario uuid; v_serv_taller uuid;
begin
 if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
 select taller_id,usuario_id into v_taller,v_usuario
 from rubinstein.solicitud_vehiculos where id=new.vinculo_vehiculo_id and activo=true;
 if v_usuario is distinct from auth.uid() then raise exception 'Vehículo no autorizado'; end if;
 new.usuario_id:=auth.uid();new.taller_id:=v_taller;
 if new.tipo='catalogo' then
  select taller_id into v_serv_taller from rubinstein.solicitud_servicios
   where id=new.servicio_id and activo=true;
  if v_serv_taller is distinct from v_taller then raise exception 'Servicio no disponible para este taller'; end if;
 else new.servicio_id:=null;
 end if;
 new.estado:='recibida';
 return new;
end $$;
drop trigger if exists validar_solicitud_cliente on rubinstein.solicitudes_trabajo;
create trigger validar_solicitud_cliente before insert on rubinstein.solicitudes_trabajo
for each row execute function rubinstein.validar_solicitud_cliente();
alter table rubinstein.solicitud_servicios enable row level security;
alter table rubinstein.solicitud_vehiculos enable row level security;
alter table rubinstein.solicitudes_trabajo enable row level security;
drop policy if exists solicitud_vehiculos_mios on rubinstein.solicitud_vehiculos;
create policy solicitud_vehiculos_mios on rubinstein.solicitud_vehiculos for select to authenticated
 using (usuario_id=(select auth.uid()) and activo=true);
drop policy if exists solicitud_servicios_mi_taller on rubinstein.solicitud_servicios;
create policy solicitud_servicios_mi_taller on rubinstein.solicitud_servicios for select to authenticated
 using (activo=true and exists (select 1 from rubinstein.solicitud_vehiculos v where v.taller_id=solicitud_servicios.taller_id and v.usuario_id=(select auth.uid()) and v.activo=true));
drop policy if exists solicitudes_solo_propias on rubinstein.solicitudes_trabajo;
create policy solicitudes_solo_propias on rubinstein.solicitudes_trabajo for select to authenticated
 using (usuario_id=(select auth.uid()));
drop policy if exists solicitudes_insert_propias on rubinstein.solicitudes_trabajo;
create policy solicitudes_insert_propias on rubinstein.solicitudes_trabajo for insert to authenticated
 with check (usuario_id=(select auth.uid()) and exists(
 select 1 from rubinstein.solicitud_vehiculos v where v.id=vinculo_vehiculo_id and v.usuario_id=(select auth.uid()) and v.taller_id=solicitudes_trabajo.taller_id and v.activo=true));
grant usage on schema rubinstein to authenticated;
grant select on rubinstein.solicitud_servicios,rubinstein.solicitud_vehiculos to authenticated;
grant select,insert on rubinstein.solicitudes_trabajo to authenticated;
-- Vincular vehículos a usuarios: solamente desde SQL Editor/admin confiable (service_role).
-- Primero cargar servicios: insert into rubinstein.solicitud_servicios(taller_id,codigo,nombre,categoria) values ('UUID_DEL_TALLER','MANT','Mantención general','Mantenimiento');
-- Luego insertar vínculos usuario-vehículo verificados en solicitud_vehiculos usando el UUID de auth.users.
