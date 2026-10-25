// Catálogo integral de configuración de automatizaciones. Opciones de interfaz guardadas en plan local.
// Los envíos por correo/WhatsApp, tareas de servidor y reservas de inventario requieren backend.
(function(){
const sections=[
 ['eventos','⚡ Activadores',[
 ['anticipacion','Entrada en período de aviso'],['vencimiento','Fecha / kilometraje vencidos'],['horometro','Horas de operación alcanzadas'],['odometro','Nueva lectura de odómetro'],['ot_creada','Al crear OT'],['ot_iniciada','Al comenzar ejecución'],['ot_terminada','Al terminar OT'],['firma_tecnico','Firma del técnico'],['firma_revisor','Aprobación del supervisor'],['firma_cliente','Conformidad del cliente'],['stock_bajo','Stock bajo mínimos'],['falla_reportada','Falla registrada'],['manual','Disparador manual']
 ]],
 ['condiciones','🔎 Condiciones y controles',[
 ['plan_activo','Plan activo'],['vehiculo_activo','Vehículo habilitado'],['sin_ot_abierta','No existe OT equivalente abierta'],['horario_laboral','Solo horario de taller'],['excluir_feriados','Excluir días no laborales'],['cliente_notificable','Contacto válido y autorizado'],['stock_disponible','Existencias suficientes'],['tecnico_disponible','Técnico disponible'],['requiere_aprobacion','Solicitar autorización antes de emitir']
 ]],
 ['acciones','⚙️ Acciones',[
 ['crear_ot','Crear OT preventiva'],['asignar_tecnico','Asignar técnico por especialidad'],['copiar_subtareas','Copiar subtareas y procedimientos'],['reservar_repuestos','Reservar repuestos requeridos'],['solicitar_compra','Solicitar compra por faltantes'],['coordinar_terceros','Solicitar trabajo externo'],['actualizar_estado','Actualizar estado de OT'],['recalcular_ciclo','Calcular siguiente vencimiento'],['crear_tarea','Crear tarea de seguimiento'],['escalar_supervisor','Escalar al jefe de taller'],['bloquear_cierre','Impedir cierre sin evidencias o firmas']
 ]],
 ['canales','✉️ Canales de aviso',[
 ['en_app','Centro de notificaciones'],['correo','Correo electrónico'],['whatsapp','WhatsApp'],['sms','SMS'],['webhook','Webhook / integración']
 ]],
 ['destinatarios','👥 Destinatarios',[
 ['administrador','Administrador'],['jefe','Jefe del taller'],['tecnico','Técnico responsable'],['cliente','Propietario / cliente'],['aprobador','Aprobador final'],['compras','Área de compras'],['proveedor','Proveedor externo']
 ]]
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults={eventos:['anticipacion','vencimiento'],condiciones:['plan_activo','sin_ot_abierta'],acciones:['crear_ot','copiar_subtareas','recalcular_ciclo'],canales:['en_app'],destinatarios:['jefe'],diasAviso:7,kmAviso:500,reintentoHoras:24,maxRecordatorios:3,prioridad:'Normal',modo:'al_vencer',plantillaAsunto:'Mantenimiento {patente} · {plan}',plantillaMensaje:'El plan {plan} del vehículo {patente} está {estado}. Vence: {vencimiento}.',zonaHoraria:'America/Santiago',silenciarDuplicados:true,requiereConfirmacion:false};
window.planAutomationOpen=function(id){
 const p=db.plans.find(x=>x.id===id);if(!p)return;
 const config=JSON.parse(JSON.stringify({...defaults,...(p.automatizaciones||{})}));
 for(const [key] of sections)config[key]=[...(p.automatizaciones?.[key]||defaults[key])];
 window.planAutomationDraft=config;
 const nav='<div class="auto-tabs">'+sections.map(([key,label])=>'<a href="#auto-'+key+'">'+label+'</a>').join('')+'<a href="#auto-avanzado">🛠️ Avanzado</a></div>';
 const panels=sections.map(([key,title,options])=>'<section class="auto-section" id="auto-'+key+'"><h3>'+title+'</h3><div class="auto-grid">'+options.map(([value,label])=>'<label class="auto-check"><input type="checkbox" data-autogroup="'+key+'" value="'+value+'" '+(config[key].includes(value)?'checked':'')+'><span>'+label+'</span></label>').join('')+'</div></section>').join('');
 const advanced='<section class="auto-section" id="auto-avanzado"><h3>🛠️ Reglas avanzadas y mensajes</h3><div class="grid"><label class="field">Modo de emisión<select data-field="modo"><option value="solo_avisar">Solo avisar</option><option value="al_vencer">Emitir al vencer</option><option value="anticipada">Emitir durante aviso</option><option value="manual">Solo manual</option></select></label><label class="field">Prioridad de OT<select data-field="prioridad">'+['Baja','Normal','Alta','Urgente'].map(v=>'<option>'+v+'</option>').join('')+'</select></label><label class="field">Anticipación en días<input data-field="diasAviso" type="number" min="0" value="'+config.diasAviso+'"></label><label class="field">Anticipación en km<input data-field="kmAviso" type="number" min="0" value="'+config.kmAviso+'"></label><label class="field">Recordar cada horas<input data-field="reintentoHoras" type="number" min="1" value="'+config.reintentoHoras+'"></label><label class="field">Máximo de recordatorios<input data-field="maxRecordatorios" type="number" min="0" value="'+config.maxRecordatorios+'"></label><label class="field">Zona horaria<input data-field="zonaHoraria" value="'+esc(config.zonaHoraria)+'"></label></div><div class="auto-grid"><label class="auto-check"><input data-field="silenciarDuplicados" type="checkbox" '+(config.silenciarDuplicados?'checked':'')+'> Evitar avisos duplicados</label><label class="auto-check"><input data-field="requiereConfirmacion" type="checkbox" '+(config.requiereConfirmacion?'checked':'')+'> Exigir confirmación antes de generar OT</label></div><label class="field">Asunto de correo<input data-field="plantillaAsunto" value="'+esc(config.plantillaAsunto)+'"></label><label class="field">Mensaje para correo o WhatsApp<textarea rows="3" data-field="plantillaMensaje">'+esc(config.plantillaMensaje)+'</textarea></label><p class="muted">Variables: {plan}, {patente}, {estado}, {vencimiento}. Las integraciones externas aún no están conectadas; elegirlas NO envía mensajes.</p></section>';
 showModal('Automatizaciones · '+p.nombre,'<div class="auto-editor"><div class="notice">Configuración del plan. Se guarda localmente. Los avisos por WhatsApp, email y trabajos de servidor están pendientes de integración real.</div>'+nav+panels+advanced+'<div class="row spread" style="position:sticky;bottom:0;background:white;padding:12px 0;border-top:1px solid #dce3ee"><button class="button" type="button" onclick="modal.close()">Cancelar</button><button class="button primary" type="button" id="auto-save">Guardar configuraciones</button></div></div>');
 const root=document.querySelector('.auto-editor');
 root.querySelector('[data-field="modo"]').value=config.modo;root.querySelector('[data-field="prioridad"]').value=config.prioridad;
 root.querySelector('#auto-save').onclick=()=>{
  const next={};
  for(const [key] of sections)next[key]=[...root.querySelectorAll('[data-autogroup="'+key+'"]:checked')].map(x=>x.value);
  for(const [field] of Object.entries(defaults).filter(([k])=>!sections.some(([s])=>k===s))){
   const el=root.querySelector('[data-field="'+field+'"]');if(!el)continue;
   next[field]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;
  }
  p.automatizaciones=next;
  p.avisoDias=next.diasAviso;p.avisoKm=next.kmAviso;
  p.automatico=next.modo==='anticipada'||next.modo==='al_vencer';
  p.emitirAnticipado=next.modo==='anticipada';
  try{save()}catch(err){alert('Error guardando la configuración local.');return}
  modal.close();render();
 };
};
const oldPlans=window.plansPage;
window.plansPage=function(){
 const current=oldPlans();
 const target='<button class="button" onclick="planOpen(';
 return current.replaceAll(target,'<button class="button" onclick="planAutomationOpen('); 
};
const style=document.createElement('style');style.textContent='.auto-editor{font-size:13px}.auto-tabs{display:flex;gap:6px;overflow:auto;position:sticky;top:-20px;background:white;padding:12px 0;z-index:2}.auto-tabs a{white-space:nowrap;border:1px solid #dce5f2;border-radius:20px;padding:8px 12px;color:#294b82;text-decoration:none}.auto-section{border:1px solid #dce5f2;border-radius:12px;padding:16px;margin:15px 0;scroll-margin-top:75px}.auto-section h3{margin:0 0 12px}.auto-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}.auto-check{display:flex;gap:9px;align-items:center;padding:9px;border:1px solid #e0e7f1;border-radius:9px;background:#f9fbfe}.auto-check input{flex:none}.auto-section .field{margin-bottom:10px}';document.head.append(style);
})();