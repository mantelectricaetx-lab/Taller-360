// Extensión del editor: recursos, repuestos, apoyo, terceros y adjuntos por subtarea.
(function(){
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function task(id){return otDraft.tasks.find(t=>t.id===id)}
function init(t){t.extras??={recursos:[],repuestos:[],personal:[],terceros:[],adjuntos:[],enlaces:[]};return t.extras}
const defs={repuestos:['Repuesto / insumo','Cantidad','Costo unitario (CLP)'],personal:['Personal de apoyo','Horas'],terceros:['Proveedor / trabajo','Costo estimado (CLP)']};
window.otExtraAdd=function(id,kind){
 const t=task(id);if(!t)return;const e=init(t);
 e[kind].push({descripcion:'',cantidad:1,costo:0});
 otRenderTasks();
};
window.otExtraRemove=function(id,kind,n){
 const t=task(id);if(!t)return;init(t)[kind].splice(n,1);otRenderTasks();
};
window.otExtraSet=function(id,kind,i,key,value){
 const t=task(id);if(!t)return;
 const record=init(t)[kind][i];if(record)record[key]=key==='cantidad'||key==='costo'?Math.max(0,Number(value)||0):value;
};
window.otExtraFile=async function(id,files){
 const t=task(id);if(!t)return;const e=init(t);
 for(const file of [...files]){
   if(!/^(image\/png|image\/jpeg|image\/webp|application\/pdf|text\/plain|application\/vnd.openxmlformats-officedocument.wordprocessingml.document)$/.test(file.type)||file.size>150000){alert('Solo imágenes, PDF, TXT o DOCX de máximo 150 KB en esta demo local.');continue}
   if(e.adjuntos.length>=3){alert('Máximo 3 adjuntos pequeños por subtarea en la demo.');break}
   const data=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>resolve(null);r.readAsDataURL(file)});
   if(data)e.adjuntos.push({nombre:file.name,tipo:file.type,contenido:data});
 }
 otRenderTasks();
};
window.otExtraFileRemove=function(id,index){const t=task(id);if(!t)return;init(t).adjuntos.splice(index,1);otRenderTasks()};

window.otFindExtraStaff=async function(btn,id,n){
 const row=btn.closest('.ot-extras-row');const q=row?.querySelector('input')?.value||'';
 const existing=row.querySelector('.ot-people-results');if(existing)existing.remove();
 const box=document.createElement('div');box.className='ot-people-results ot-options';box.style.width='100%';box.textContent='Buscando personal real...';row.append(box);
 try{
  const found=await window.T360TechSearch.search(q);
  box.replaceChildren();
  if(!found.length){box.textContent='No se encontró personal activo en Supabase.';return}
  for(const person of found){
   const b=document.createElement('button');b.type='button';b.className='ot-option';b.textContent=person.nombre+' · '+(person.cargo||person.especialidad||'');
   b.onclick=()=>{
    const t=task(id);if(!t)return;const r=init(t).personal[n];if(!r)return;
    r.descripcion=person.nombre;r.personalId=person.id;row.querySelector('input').value=person.nombre;
    box.textContent='Seleccionado de Supabase: '+person.nombre;
   };box.append(b);
  }
 }catch(err){box.textContent=err.message}
};
window.otExtraLinkAdd=id=>{const t=task(id);if(t){init(t).enlaces.push({url:''});otRenderTasks()}};
window.otExtraLinkRemove=(id,n)=>{const t=task(id);if(t){init(t).enlaces.splice(n,1);otRenderTasks()}};
window.otExtraLinkSet=(id,n,value)=>{const t=task(id);if(t&&init(t).enlaces[n])init(t).enlaces[n].url=value};
const orig=otRenderTasks;
otRenderTasks=function(){
 orig();
 const elements=document.querySelectorAll('#ot-task-list>details');
 elements.forEach((el,i)=>{
  const t=otDraft.tasks[i],extras=init(t);
  const area=document.createElement('section');area.className='ot-extras';
  let html='<details open><summary>Adjuntos, recursos, repuestos, personal y terceros</summary><div><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" '+(t.adjuntoObligatorio?'checked':'')+' onchange="otTaskChange(\''+t.id+'\',\'adjuntoObligatorio\',this.checked)"> Adjunto obligatorio para finalizar esta subtarea</label>';
  for(const [kind,labels] of Object.entries(defs)){
    html+='<h4>'+({recursos:'Recursos adicionales',repuestos:'Repuestos e insumos',personal:'Personal de apoyo',terceros:'Servicios de terceros'}[kind])+'</h4>';
    html+=extras[kind].map((x,n)=>'<div class="ot-extras-row"><label>'+labels[0]+'<input value="'+safe(x.descripcion)+'" oninput="otExtraSet(\''+t.id+'\',\''+kind+'\','+n+',\'descripcion\',this.value)" placeholder="Buscar o escribir"></label><label>'+labels[1]+'<input type="number" min="0" value="'+(kind==='terceros'?x.costo:x.cantidad)+'" oninput="otExtraSet(\''+t.id+'\',\''+kind+'\','+n+',\''+(kind==='terceros'?'costo':'cantidad')+'\',this.value)"></label>'+(kind==='repuestos'?'<label>'+labels[2]+'<input type="number" min="0" value="'+x.costo+'" oninput="otExtraSet(\''+t.id+'\',\''+kind+'\','+n+',\'costo\',this.value)"></label>':'')+(kind==='personal'?'<button type="button" class="button" onclick="otFindExtraStaff(this,\''+t.id+'\','+n+')">Buscar en Supabase</button>':'')+'<button type="button" class="button" onclick="otExtraRemove(\''+t.id+'\',\''+kind+'\','+n+')">Quitar</button></div>').join('');
    html+='<button type="button" class="button" onclick="otExtraAdd(\''+t.id+'\',\''+kind+'\')">+ Añadir</button>';
  }
  html+='<h4>Documentos adjuntos (también durante ejecución)</h4><p class="muted">Fotos y PDF pequeños para pruebas; en producción se almacenarán en Supabase Storage.</p><input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.docx" multiple onchange="otExtraFile(\''+t.id+'\',this.files)">';
  html+=extras.adjuntos.map((a,n)=>'<p>📎 '+safe(a.nombre)+' <button type="button" class="button" onclick="otExtraFileRemove(\''+t.id+'\','+n+')">Quitar</button></p>').join('');
  html+='<h4>Enlaces / URL de evidencia</h4>'+extras.enlaces.map((a,n)=>'<div class="ot-extras-row"><input type="url" placeholder="https://..." value="'+safe(a.url)+'" oninput="otExtraLinkSet(\''+t.id+'\','+n+',this.value)"><button type="button" class="button" onclick="otExtraLinkRemove(\''+t.id+'\','+n+')">Quitar</button></div>').join('')+'<button type="button" class="button" onclick="otExtraLinkAdd(\''+t.id+'\')">+ Enlace</button></div></details>';
  area.innerHTML=html;el.append(area);
 });
};
const style=document.createElement('style');style.textContent='.ot-extras{margin-top:12px}.ot-extras h4{font-size:12px;color:#39516c;margin:14px 0 7px}.ot-extras-row{display:flex;flex-wrap:wrap;align-items:end;gap:7px;margin-bottom:7px}.ot-extras-row label{flex:1;min-width:130px}.ot-extras-row input{width:100%}.ot-extras-row .button{margin-bottom:2px}';document.head.append(style);
})();