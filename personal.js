// Módulo RRHH: formulario real de personal del taller con Supabase.
// Requiere sesión y permisos RLS adecuados.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const sb=createClient('https://ynbfijurdsyjymppoqnh.supabase.co','sb_publishable_qHJqwkmBzBFa-p6MYUq2gw_6kVAYpK0');
const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let personnel=[],myTaller=null;
async function ctx(){
 const {data:{user}}=await sb.auth.getUser();
 if(!user)throw Error('Inicia sesión en Supabase para administrar técnicos.');
 const {data,error}=await sb.schema('rubinstein').from('usuarios').select('taller_id,activo').eq('id',user.id).single();
 if(error)throw Error('Consulta de perfil: '+error.message+' (código '+(error.code||'sin código')+').');
 if(!data)throw Error('La cuenta autenticada no tiene una ficha visible en rubinstein.usuarios.');
 if(!data.activo)throw Error('El usuario está inactivo.');
 if(!data.taller_id)throw Error('El usuario no tiene taller_id asignado.');
 return data.taller_id;
}
async function load(){
 const container=document.getElementById('staff-data');if(!container)return;
 container.textContent='Cargando personal...';
 try{
 myTaller=await ctx();
 const {data,error}=await sb.schema('rubinstein').from('personal').select('*').eq('taller_id',myTaller).order('nombre').limit(500);
 if(error)throw Error(error.message);
 personnel=data||[];
 draw();
 }catch(err){container.innerHTML='<div class="notice">'+clean(err.message)+'</div>'}
}
function draw(){
 const container=document.getElementById('staff-data');if(!container)return;
 const q=(document.getElementById('staff-q')?.value||'').toLowerCase();
 const rows=personnel.filter(p=>[p.nombre,p.cargo,p.especialidad,p.telefono].some(x=>String(x||'').toLowerCase().includes(q)));
 container.innerHTML='<p class="muted">'+rows.length+' trabajadores encontrados</p><div class="scroll"><table><thead><tr><th>Nombre</th><th>Cargo</th><th>Especialidad</th><th>Teléfono</th><th>Estado</th><th></th></tr></thead><tbody>'+rows.map(p=>'<tr><td>'+clean(p.nombre)+'</td><td>'+clean(p.cargo)+'</td><td>'+clean(p.especialidad)+'</td><td>'+clean(p.telefono)+'</td><td>'+ (p.activo?'Activo':'Inactivo')+'</td><td><button class="button" data-edit="'+clean(p.id)+'">Editar</button></td></tr>').join('')+'</tbody></table></div>';
 container.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>form(personnel.find(p=>p.id===b.dataset.edit)));
}
function form(p={}){
 const editing=!!p.id;
 const el=document.getElementById('staff-editor');
 el.innerHTML='<div class="card"><div class="row spread"><h3>'+(editing?'Editar':'Nuevo')+' trabajador</h3><button class="button" type="button" id="staff-close">✕</button></div><form id="staff-form"><div class="grid">'+[['nombre','Nombre completo'],['cargo','Cargo'],['especialidad','Especialidad'],['telefono','Teléfono']].map(([k,l])=>'<label class="field">'+l+'<input name="'+k+'" '+(k==='nombre'?'required':'')+' value="'+clean(p[k]||'')+'"></label>').join('')+'</div><label class="field">Estado<select name="activo"><option value="true" '+(p.activo!==false?'selected':'')+'>Activo</option><option value="false" '+(p.activo===false?'selected':'')+'>Inactivo</option></select></label><p id="staff-msg" role="status"></p><button class="button primary" type="submit">Guardar trabajador</button></form></div>';
 el.querySelector('#staff-close').onclick=()=>el.replaceChildren();
 el.querySelector('form').onsubmit=async e=>{
 e.preventDefault();const f=e.target;const get=k=>f.elements.namedItem(k).value;const payload={nombre:get('nombre').trim(),cargo:get('cargo').trim(),especialidad:get('especialidad').trim(),telefono:get('telefono').trim(),activo:get('activo')==='true'};
 try{
 if(!myTaller)myTaller=await ctx();
 let response;
 if(editing)response=await sb.schema('rubinstein').from('personal').update(payload).eq('id',p.id).eq('taller_id',myTaller).select('id');
 else response=await sb.schema('rubinstein').from('personal').insert({...payload,taller_id:myTaller}).select('id');
 if(response.error)throw Error(response.error.message);
 if(!response.data?.length)throw Error('Sin cambios. Verifica permisos del usuario.');
 el.replaceChildren();await load();
 }catch(err){el.querySelector('#staff-msg').textContent='Error: '+err.message}
 };
}

async function seedTechnicians(){
 const output=document.getElementById('staff-seed-status');
 const button=document.getElementById('staff-seed');
 if(!output||!button)return;
 if(!confirm('¿Crear hasta 3 técnicos FICTICIOS en la base real de tu taller? Se identificarán como DEMO.'))return;
 button.disabled=true;output.textContent='Comprobando registros existentes...';
 try{
  const taller=await ctx();
  const examples=[
   {nombre:'DEMO - Alejandro Morales',cargo:'Técnico mecánico',especialidad:'Diagnóstico y mecánica general',telefono:null,activo:true},
   {nombre:'DEMO - Camila Rojas',cargo:'Técnico automotriz',especialidad:'Electricidad y electrónica',telefono:null,activo:true},
   {nombre:'DEMO - Diego Fernández',cargo:'Técnico mecánico',especialidad:'Frenos y suspensión',telefono:null,activo:true}
  ];
  const {data:existing,error:queryError}=await sb.schema('rubinstein').from('personal').select('nombre').eq('taller_id',taller);
  if(queryError)throw Error(queryError.message);
  const names=new Set((existing||[]).map(x=>x.nombre.trim().toLowerCase()));
  const newRows=examples.filter(x=>!names.has(x.nombre.toLowerCase())).map(x=>({...x,taller_id:taller}));
  if(!newRows.length){output.textContent='Los tres técnicos DEMO ya existen. No se generaron duplicados.';return}
  const {data,error}=await sb.schema('rubinstein').from('personal').insert(newRows).select('id,nombre');
  if(error)throw Error(error.message);
  output.textContent='Técnicos de prueba agregados: '+(data?.length||0)+'.';
  await load();
 }catch(err){output.textContent='Error: '+err.message}
 finally{button.disabled=false}
}

window.T360Personnel={
 page(){return '<div class="card"><div class="row spread"><h3>Directorio de técnicos y personal</h3><div class="row"><button class="button" id="staff-seed">+ Crear 3 técnicos DEMO</button><button class="button primary" id="staff-new">+ Nuevo técnico</button></div></div><p class="muted">Personal registrado en Supabase para tu taller. Cada técnico podrá ser asignado como responsable de OT y subtareas.</p><div class="filter"><input id="staff-q" type="search" placeholder="Buscar nombre, cargo o especialidad"></div><p id="staff-seed-status" role="status" class="muted"></p><div id="staff-data"></div></div><div id="staff-editor"></div>'},
 init(){document.getElementById('staff-new').onclick=()=>form();document.getElementById('staff-seed').onclick=seedTechnicians;document.getElementById('staff-q').oninput=draw;load()}
};
