// Permite al técnico complementar subtareas de una OT ya creada (demo local).
window.otExecuteTask=function(id){
 const o=db.ots.find(x=>x.id===id);if(!o)return;
 otDraft={tasks:(o.tareas||[]).map((x,i)=>({...x,id:x.id||'exec'+i+Date.now(),extras:x.extras?structuredClone(x.extras):{recursos:[],repuestos:[],personal:[],terceros:[],adjuntos:[]}})),selectedVehicle:o.vehicleId};
 showModal('Ejecución OT '+o.id+' · Evidencia y recursos','<p class="notice">Registra actividades, adjuntos, repuestos, apoyo y servicios de terceros. Esta etapa guarda en la demo local; aún no registra movimientos de inventario en Supabase.</p><div id="ot-task-count" hidden></div><div id="ot-task-list"></div><div class="row spread"><button class="button" onclick="openOTDetail(\''+id+'\')">Volver</button><button class="button primary" id="exec-save">Guardar avances</button></div>');
 otRenderTasks();
 document.getElementById('exec-save').onclick=()=>{
  if(otDraft.tasks.some(t=>!t.nombre.trim())){alert('Completa los nombres de las subtareas.');return}
  o.tareas=otDraft.tasks.map(({id:temporaryId,...t})=>({...t,id:temporaryId}));
  try{save()}catch(e){alert('No se pudo guardar; revisa tamaño de los adjuntos.');return}
  openOTDetail(id);
 };
};
