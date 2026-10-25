// Planes de mantenimiento V2: reglas por tiempo y odómetro, creación manual y revisión automática local.
(function(){
const escp=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unitNames={horas:'horas',dias:'días',anos:'años',km:'km'};
function ensure(p){p.reglas??=[];p.subtareas??=(p.tareas||[]).map(nombre=>({nombre,detalle:'',minutos:0,obligatoria:true}));p.descripcion??='';p.vehiculoIds??=[];p.automatico??=false;p.historialGeneracion??={};return p}
function due(p,v,now=new Date()){
 const key=v.id,last=p.historialGeneracion?.[key]||{},beg=last.fecha||p.inicio||new Date().toISOString();
 const elapsed=(now-new Date(beg))/3600000;
 const dist=Math.max(0,Number(v.km||0)-Number(last.km??p.kmInicio?.[key]??v.km));
 return p.reglas.some(r=>{
  const n=Number(r.cada);if(!Number.isFinite(n)||n<=0)return false;
  if(r.unidad==='horas')return elapsed>=n;
  if(r.unidad==='dias')return elapsed>=n*24;
  if(r.unidad==='anos')return elapsed>=n*365.2425*24;
  if(r.unidad==='km')return dist>=n;
  return false
 });
}
window.planCreateOT=function(planId,vehicleId,auto=false){
 const p=ensure(db.plans.find(x=>x.id===planId)||{}),v=vehicle(vehicleId);if(!p.id||!v)return;
 const token=planId+':'+vehicleId;
 const o={id:'OT-'+Date.now().toString().slice(-9),vehicleId,planId,servicio:p.nombre,prioridad:'Normal',estado:'pendiente',fecha:new Date().toLocaleDateString('en-CA'),tecnico:'',tecnicoId:null,origen:auto?'programacion':'manual',tareas:p.subtareas.map(t=>({...t,done:false}))};
 if(auto&&db.ots.some(x=>x.planId===planId&&x.vehicleId===vehicleId&&x.estado!=='terminada'))return false;
 db.ots.unshift(o);p.historialGeneracion[vehicleId]={fecha:new Date().toISOString(),km:Number(v.km)||0,otId:o.id};save();return true;
};
window.planRunAuto=function(silent=false){
 let total=0;for(const p of db.plans){ensure(p);if(!p.automatico||!p.reglas.length)continue;for(const vid of p.vehiculoIds){const v=vehicle(vid);if(v&&due(p,v)&&planCreateOT(p.id,vid,true))total++}}
 if(!silent){alert(total?total+' OT automáticas programadas.':'No hay mantenimientos vencidos que generen nuevas OT.');render()}
 return total;
};
window.planOpen=function(id){
 let p=db.plans.find(x=>x.id===id);const edit=!!p;
 if(!p)p={id:'P'+Date.now(),nombre:'',descripcion:'',tipo:'Preventivo',reglas:[{unidad:'km',cada:10000}],subtareas:[{nombre:'',detalle:'',minutos:30,obligatoria:true}],vehiculoIds:[],automatico:false,historialGeneracion:{},kmInicio:{},inicio:new Date().toISOString()};
 ensure(p);window.planDraft=JSON.parse(JSON.stringify(p));
 planRenderEditor(edit);
};
window.planRenderEditor=function(edit=false){
 const p=window.planDraft;showModal((edit?'Editar':'Nuevo')+' plan de mantenimiento','<form id="plan-v2-form"><div class="grid"><label class="field">Nombre del plan<input required name="nombre" value="'+escp(p.nombre)+'"></label><label class="field">Tipo<select name="tipo">'+['Preventivo','Correctivo','Predictivo','Inspección','Lubricación','Otro'].map(t=>'<option '+(p.tipo===t?'selected':'')+'>'+t+'</option>').join('')+'</select></label></div><label class="field">Descripción detallada<textarea name="descripcion" rows="3">'+escp(p.descripcion)+'</textarea></label><h3>Frecuencias y ciclos</h3><p class="muted">Las reglas disparan el plan cuando se cumple cualquiera de ellas. El ciclo se reinicia al generar una OT. Años equivalen a 365,2425 días para el cálculo inicial.</p><div id="plan-rules"></div><button class="button" type="button" onclick="planAddRule()">+ Frecuencia</button><h3>Subtareas del plan</h3><div id="plan-subtasks"></div><button class="button" type="button" onclick="planAddSubtask()">+ Subtarea</button><h3>Vehículos asignados</h3><div id="plan-vehicles" style="max-height:150px;overflow:auto"></div><label style="display:flex;align-items:center;gap:8px;margin:15px 0"><input type="checkbox" name="automatico" '+(p.automatico?'checked':'')+'> Programación automática al abrir/revisar Taller 360</label><div class="row spread"><button class="button" type="button" onclick="modal.close()">Cancelar</button><button class="button primary" type="submit">Guardar plan</button></div></form>');
 const form=document.getElementById('plan-v2-form');
 form.onsubmit=e=>{e.preventDefault();p.nombre=form.nombre.value.trim();p.tipo=form.tipo.value;p.descripcion=form.descripcion.value.trim();p.automatico=form.automatico.checked;p.vehiculoIds=[...form.querySelectorAll('[data-plan-vehicle]:checked')].map(x=>x.value);if(!p.nombre||p.subtareas.some(t=>!t.nombre.trim())||p.reglas.some(r=>!(Number(r.cada)>0))){alert('Completa nombre, subtareas y frecuencias positivas.');return}if(!edit)db.plans.push(p);else Object.assign(db.plans.find(x=>x.id===p.id),p);save();modal.close();render()};
 planDrawRules();planDrawSubtasks();
 document.getElementById('plan-vehicles').innerHTML=db.vehicles.map(v=>'<label style="display:block;margin:5px 0"><input data-plan-vehicle type="checkbox" value="'+v.id+'" '+(p.vehiculoIds.includes(v.id)?'checked':'')+'> '+escp(v.patente+' · '+v.marca+' '+v.modelo)+'</label>').join('')||'<p class="muted">Registra vehículos para asignarlos al plan.</p>';
};
window.planDrawRules=()=>document.getElementById('plan-rules').innerHTML=window.planDraft.reglas.map((r,i)=>'<div class="row" style="margin:7px 0"><label>Cada <input type="number" min="0.01" step="any" value="'+r.cada+'" style="width:115px" oninput="planDraft.reglas['+i+'].cada=Number(this.value)"></label><select onchange="planDraft.reglas['+i+'].unidad=this.value">'+Object.entries(unitNames).map(([k,n])=>'<option value="'+k+'" '+(r.unidad===k?'selected':'')+'>'+n+'</option>').join('')+'</select><button class="button" type="button" onclick="planDraft.reglas.splice('+i+',1);planDrawRules()">Quitar</button></div>').join('');
window.planAddRule=()=>{planDraft.reglas.push({unidad:'dias',cada:30});planDrawRules()};
window.planDrawSubtasks=()=>document.getElementById('plan-subtasks').innerHTML=planDraft.subtareas.map((t,i)=>'<div style="border:1px solid #dce3ef;border-radius:9px;padding:9px;margin-bottom:7px"><div class="grid"><label class="field">Actividad<input value="'+escp(t.nombre)+'" oninput="planDraft.subtareas['+i+'].nombre=this.value"></label><label class="field">Duración (minutos)<input type="number" min="0" value="'+(t.minutos||0)+'" oninput="planDraft.subtareas['+i+'].minutos=Number(this.value)"></label></div><label class="field">Procedimiento<textarea rows="2" oninput="planDraft.subtareas['+i+'].detalle=this.value">'+escp(t.detalle||'')+'</textarea></label><label><input type="checkbox" '+(t.obligatoria!==false?'checked':'')+' onchange="planDraft.subtareas['+i+'].obligatoria=this.checked"> Obligatoria</label> <button class="button" type="button" onclick="planDraft.subtareas.splice('+i+',1);planDrawSubtasks()">Quitar</button></div>').join('');
window.planAddSubtask=()=>{planDraft.subtareas.push({nombre:'',detalle:'',minutos:30,obligatoria:true});planDrawSubtasks()};
window.planManual=function(id){
 const p=ensure(db.plans.find(x=>x.id===id));if(!p)return;
 showModal('Generar OT desde plan · '+p.nombre,'<p>Selecciona el vehículo y crea la OT manualmente.</p><select id="plan-manual-vehicle">'+db.vehicles.map(v=>'<option value="'+v.id+'">'+escp(v.patente+' · '+v.marca+' '+v.modelo)+'</option>').join('')+'</select><button class="button primary" onclick="if(planCreateOT(\''+id+'\',document.getElementById(\'plan-manual-vehicle\').value)){modal.close();goto(\'ot\')}">Generar OT</button>');
};
const prior=window.plansPage;
window.plansPage=function(){
 const plans=db.plans.map(ensure);
 return '<div class="card"><div class="row spread"><h3>Planes de mantenimiento</h3><div class="row"><button class="button" onclick="planRunAuto()">Revisar vencimientos</button><button class="button primary" onclick="planOpen()">+ Nuevo plan</button></div></div><p class="muted">Programación por horas, días, años u odómetro. Revisión automática local cuando se abre la aplicación; no es un servicio de fondo.</p>'+plans.map(p=>'<details><summary><b>'+escp(p.nombre)+'</b> · '+escp(p.tipo)+' · '+(p.automatico?'Automático':'Manual')+'</summary><p>'+escp(p.descripcion)+'</p><p><b>Ciclos:</b> '+(p.reglas.length?p.reglas.map(r=>'cada '+r.cada+' '+unitNames[r.unidad]).join(' O '):escp(String(p.intervalo||'Sin reglas')) )+'</p><p><b>Subtareas:</b> '+p.subtareas.length+' · <b>Vehículos:</b> '+p.vehiculoIds.length+'</p><div class="row"><button class="button" onclick="planOpen(\''+p.id+'\')">Editar</button><button class="button primary" onclick="planManual(\''+p.id+'\')">Generar OT manual</button></div></details>').join('')+'</div>';
};
const oldGoto=window.goto;window.goto=function(p){oldGoto(p);if(p==='planes')planRunAuto(true)};
setTimeout(()=>{try{planRunAuto(true)}catch(e){console.warn('Revisión planes:',e.message)}},350);
})();