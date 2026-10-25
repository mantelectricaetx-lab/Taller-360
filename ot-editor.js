// Editor avanzado de OT. Datos locales de demostración.
let otDraft={tasks:[],selectedVehicle:null,selectedPlan:null,tecnicoId:null};
const normOT=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function otOptions(){
 const q=normOT(document.getElementById('ot-vehicle-search')?.value);
 const cli=document.getElementById('ot-client-filter')?.value||'';
 const list=db.vehicles.filter(v=>(!cli||v.clienteId===cli)&&[v.patente,v.marca,v.modelo,v.anio,client(v.clienteId)?.nombre,client(v.clienteId)?.rut].some(z=>normOT(z).includes(q)));
 document.getElementById('ot-vehicle-list').innerHTML=list.slice(0,80).map(v=>'<button type="button" class="ot-option '+(otDraft.selectedVehicle===v.id?'selected':'')+'" onclick="otPickVehicle(\''+v.id+'\')"><b>'+esc(v.patente)+'</b> · '+esc(v.marca+' '+v.modelo)+' <small>'+esc(client(v.clienteId)?.nombre)+'</small></button>').join('')||'<p class="muted">No se encontraron vehículos.</p>';
}
function otPickVehicle(id){otDraft.selectedVehicle=id;const v=vehicle(id);document.getElementById('ot-current-vehicle').textContent=v.patente+' · '+v.marca+' '+v.modelo+' · '+(client(v.clienteId)?.nombre||'');otOptions()}
function otPlanOptions(){
 const q=normOT(document.getElementById('ot-plan-search').value);
 document.getElementById('ot-plan-list').innerHTML=db.plans.filter(p=>[p.nombre,p.tipo,p.intervalo,...p.tareas].some(x=>normOT(x).includes(q))).map(p=>'<button type="button" class="ot-option '+(otDraft.selectedPlan===p.id?'selected':'')+'" onclick="otPickPlan(\''+p.id+'\')">'+esc(p.nombre)+' <small>'+esc(p.tipo)+' / '+p.intervalo+'</small></button>').join('')+'<button type="button" class="ot-option" onclick="otPickPlan(null)">Sin plan · trabajo correctivo</button>';
}
function otPickPlan(id){
 otDraft.selectedPlan=id;
 const p=db.plans.find(x=>x.id===id);
 if(p){
 document.getElementById('ot-servicio').value=p.nombre;
 if(confirm('¿Añadir las '+p.tareas.length+' subtareas del plan seleccionado?'))p.tareas.forEach(nombre=>otAddTask({nombre}));
 }
 otPlanOptions();
}
function otAddTask(task={}){
 const id='t'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 otDraft.tasks.push({id,nombre:task.nombre||'',detalle:task.detalle||'',recursos:task.recursos||'',responsable:task.responsable||'',minutos:task.minutos||0,obligatoria:task.obligatoria??true,done:false});
 otRenderTasks();
}
function otRemoveTask(id){otDraft.tasks=otDraft.tasks.filter(t=>t.id!==id);otRenderTasks()}
function otTaskChange(id,k,value){const t=otDraft.tasks.find(x=>x.id===id);if(t)t[k]=value}
function otRenderTasks(){
 document.getElementById('ot-task-count').textContent=otDraft.tasks.length;
 document.getElementById('ot-task-list').innerHTML=otDraft.tasks.map((t,i)=>'<details open class="ot-task"><summary>Subtarea '+(i+1)+' · '+esc(t.nombre||'Nueva actividad')+'</summary><div class="grid"><label class="field">Nombre / actividad<input required value="'+esc(t.nombre)+'" oninput="otTaskChange(\''+t.id+'\',\'nombre\',this.value)"></label><label class="field">Responsable (Supabase)<input id="ot-task-tech-'+t.id+'" autocomplete="off" value="'+esc(t.responsable)+'" placeholder="Buscar técnico real"><div id="ot-task-tech-results-'+t.id+'" class="ot-options"></div></label><label class="field">Duración estimada (minutos)<input type="number" min="0" value="'+t.minutos+'" oninput="otTaskChange(\''+t.id+'\',\'minutos\',Number(this.value))"></label><label class="field">Recursos necesarios<input value="'+esc(t.recursos)+'" oninput="otTaskChange(\''+t.id+'\',\'recursos\',this.value)" placeholder="Herramientas, repuestos, insumos"></label></div><label class="field">Procedimiento / detalle de tarea<textarea rows="3" oninput="otTaskChange(\''+t.id+'\',\'detalle\',this.value)">'+esc(t.detalle)+'</textarea></label><div class="row spread"><label><input type="checkbox" '+(t.obligatoria?'checked':'')+' onchange="otTaskChange(\''+t.id+'\',\'obligatoria\',this.checked)"> Obligatoria</label><button type="button" class="button" onclick="otRemoveTask(\''+t.id+'\')">Eliminar subtarea</button></div></details>').join('')||'<div class="notice">Sin subtareas. Presiona «Agregar subtarea» tantas veces como necesites.</div>';
 setTimeout(()=>otDraft.tasks.forEach(t=>window.T360TechSearch?.render('ot-task-tech-'+t.id,'ot-task-tech-results-'+t.id,p=>{t.responsable=p?.nombre||'';t.responsableId=p?.id||null})),0);
}
function openOT(forVehicle=null,planId=null){
 otDraft={tasks:[],selectedVehicle:forVehicle||db.vehicles[0]?.id||null,selectedPlan:null,tecnicoId:null};
 showModal('Crear orden de trabajo · Editor avanzado',`<form id="ot-advanced-form" onsubmit="otSave(event)">
 <div class="notice">Busca por patente, cliente, RUT, marca o modelo. El propietario se asocia automáticamente al vehículo.</div>
 <details open><summary>1 · Cliente y vehículo</summary><div>
 <div class="grid"><label class="field">Cliente / propietario<select id="ot-client-filter" onchange="otOptions()"><option value="">Todos los clientes</option>${db.clients.map(c=>'<option value="'+c.id+'">'+esc(c.nombre)+'</option>').join('')}</select></label><label class="field">Búsqueda inteligente<input id="ot-vehicle-search" placeholder="Patente, nombre, RUT, marca o modelo" oninput="otOptions()"></label></div>
 <div id="ot-vehicle-list" class="ot-options"></div><p class="notice"><b>Seleccionado:</b> <span id="ot-current-vehicle">Ninguno</span></p></div></details>
 <details open><summary>2 · Servicio, plan y programación</summary><div>
 <label class="field">Buscar plan por nombre, frecuencia o tarea<input id="ot-plan-search" placeholder="Aceite, 10.000 km, preventivo..." oninput="otPlanOptions()"></label><div id="ot-plan-list" class="ot-options"></div>
 <div class="grid"><label class="field">Descripción del servicio<input id="ot-servicio" required placeholder="Ej. Mantención, diagnóstico, reparación"></label><label class="field">Técnico responsable (Supabase)<input id="ot-tecnico" autocomplete="off" placeholder="Buscar por nombre, cargo o especialidad"><div id="ot-tecnico-results" class="ot-options"></div></label><label class="field">Prioridad<select id="ot-prioridad"><option>Normal</option><option>Media</option><option>Alta</option><option>Urgente</option></select></label><label class="field">Estado<select id="ot-estado"><option value="pendiente">Pendiente / Programada</option><option value="ejecucion">En ejecución</option><option value="revision">Control y revisión</option></select></label><label class="field">Fecha prevista<input id="ot-fecha" type="date" required></label><label class="field">Hora estimada<input id="ot-hora" type="time" value="09:00"></label></div></div></details>
 <details open><summary>3 · Subtareas y requerimientos (<span id="ot-task-count">0</span>)</summary><div>
 <p class="muted">Cada subtarea tiene su propio procedimiento, responsable, recursos, duración y obligatoriedad.</p><div id="ot-task-list"></div><button type="button" class="button primary" onclick="otAddTask()">+ Agregar subtarea</button></div></details>
 <div class="row spread" style="margin-top:18px"><button type="button" class="button" onclick="modal.close()">Cancelar</button><button type="submit" class="button primary">Crear orden de trabajo</button></div></form>`);
 document.getElementById('ot-fecha').value=new Date().toLocaleDateString('en-CA');
 if(forVehicle)otPickVehicle(forVehicle);else if(otDraft.selectedVehicle)otPickVehicle(otDraft.selectedVehicle);
 otOptions();otPlanOptions();
 window.T360TechSearch?.render('ot-tecnico','ot-tecnico-results',p=>{otDraft.tecnicoId=p?.id||null});
 if(planId)otPickPlan(planId);
}
async function otSave(event){
 event.preventDefault();
 if(!otDraft.selectedVehicle){alert('Selecciona un vehículo');return}
 if(otDraft.tasks.some(x=>!x.nombre.trim())){alert('Cada subtarea necesita un nombre');return}
 const o={id:'OT-'+Date.now().toString().slice(-9),vehicleId:otDraft.selectedVehicle,servicio:document.getElementById('ot-servicio').value.trim(),prioridad:document.getElementById('ot-prioridad').value,estado:document.getElementById('ot-estado').value,fecha:document.getElementById('ot-fecha').value,tecnico:document.getElementById('ot-tecnico').value,tareas:otDraft.tasks.map(t=>({...t}))};
 if(document.getElementById('ot-tecnico').value.trim()&&!otDraft.tecnicoId){alert('Selecciona un técnico de los resultados de Supabase.');return}
 if(otDraft.tasks.some(t=>t.responsable.trim()&&!t.responsableId)){alert('Selecciona los responsables de subtareas desde Supabase.');return}
 o.tecnicoId=otDraft.tecnicoId;
 if(!o.servicio){alert('Describe el servicio');return}
 db.ots.unshift(o);save();try{await window.T360OTCloud.save(o)}catch(err){alert('La OT se guardó solo en este navegador. '+err.message)}modal.close();goto('ot');openOTDetail(o.id);
}
