// Asignaciones por subtarea en planes de mantenimiento: repuestos, herramientas, RRHH y terceros.
(function(){
const kinds={repuestos:'Repuestos e insumos',herramientas:'Herramientas y equipos',personal:'Personal de apoyo',terceros:'Trabajos de terceros'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function extras(t){t.asignaciones??={repuestos:[],herramientas:[],personal:[],terceros:[]};return t.asignaciones}
window.planAssignAdd=(i,k)=>{extras(planDraft.subtareas[i])[k].push({descripcion:'',cantidad:1,costo:0,referenciaId:null});planDrawSubtasks()};
window.planAssignRemove=(i,k,j)=>{extras(planDraft.subtareas[i])[k].splice(j,1);planDrawSubtasks()};
window.planAssignChange=(i,k,j,key,value)=>{let item=extras(planDraft.subtareas[i])[k][j];if(item){item[key]=key==='cantidad'||key==='costo'?Math.max(0,Number(value)||0):value;if(key==='descripcion')item.referenciaId=null}};
window.planAssignStaff=async(btn,i,j)=>{
 const row=btn.closest('.passign-row'),item=extras(planDraft.subtareas[i]).personal[j],results=row.querySelector('.passign-results');
 results.textContent='Consultando personal en Supabase...';
 try{
  const people=await window.T360TechSearch.search(item.descripcion);
  results.replaceChildren();
  if(!people.length){results.textContent='Sin coincidencias; puedes ingresar el nombre manualmente.';return}
  people.forEach(person=>{const b=document.createElement('button');b.type='button';b.className='button';b.textContent=person.nombre+' · '+(person.cargo||'');b.onclick=()=>{item.descripcion=person.nombre;item.referenciaId=person.id;row.querySelector('input').value=person.nombre;results.textContent='Seleccionado de Supabase: '+person.nombre};results.append(b)})
 }catch(e){results.textContent=e.message}
};
const previous=window.planDrawSubtasks;
window.planDrawSubtasks=function(){
 previous();
 const list=document.getElementById('plan-subtasks');if(!list)return;
 [...list.children].forEach((element,i)=>{
  const t=planDraft.subtareas[i];if(!t)return;const data=extras(t);
  const wrap=document.createElement('details');wrap.className='passign';wrap.innerHTML='<summary>Asignaciones: repuestos · herramientas · personal · terceros</summary>'+
    Object.entries(kinds).map(([k,title])=>'<div class="passign-group"><div class="row spread"><b>'+title+'</b><button class="button" type="button" onclick="planAssignAdd('+i+',\''+k+'\')">+ Asignar</button></div>'+
    data[k].map((a,j)=>'<div class="passign-row"><label class="field">'+(k==='terceros'?'Proveedor / servicio':k==='personal'?'Trabajador / especialidad':k==='herramientas'?'Herramienta / equipo':'Repuesto / insumo')+'<input value="'+esc(a.descripcion)+'" placeholder="Escribir o seleccionar" oninput="planAssignChange('+i+',\''+k+'\','+j+',\'descripcion\',this.value)"></label><label class="field">'+(k==='personal'?'Horas':'Cantidad')+'<input type="number" min="0" step="any" value="'+Number(a.cantidad||0)+'" oninput="planAssignChange('+i+',\''+k+'\','+j+',\'cantidad\',this.value)"></label>'+(k==='repuestos'||k==='terceros'?'<label class="field">Costo estimado CLP<input type="number" min="0" value="'+Number(a.costo||0)+'" oninput="planAssignChange('+i+',\''+k+'\','+j+',\'costo\',this.value)"></label>':'')+(k==='personal'?'<button class="button" type="button" onclick="planAssignStaff(this,'+i+','+j+')">Buscar en Supabase</button>':'')+'<button class="button" type="button" onclick="planAssignRemove('+i+',\''+k+'\','+j+')">Quitar</button><div class="passign-results"></div></div>').join('')+'</div>').join('');
  element.append(wrap);
 });
};
const style=document.createElement('style');style.textContent='.passign{margin:12px 0;padding:12px;border:1px solid #dae4f1;border-radius:12px;background:#f8fafd}.passign>summary{font-weight:700;cursor:pointer}.passign-group{padding:12px 0;border-top:1px solid #e3e9f3}.passign-group:first-of-type{margin-top:12px}.passign-row{display:flex;flex-wrap:wrap;align-items:end;gap:8px;margin:10px 0;padding:9px;border:1px solid #e1e8f2;border-radius:9px;background:white}.passign-row>.field{flex:1 1 145px;margin:0}.passign-row>.button{margin-bottom:3px}.passign-results{width:100%;display:flex;gap:6px;flex-wrap:wrap}';document.head.append(style);
})();