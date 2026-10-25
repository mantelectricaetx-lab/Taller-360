// Planes V3: avisos anticipados, estado próximo/vencido y emisión automática opcional.
(function(){
const icons={horas:'◷',dias:'▦',anos:'◉',km:'▣'};
const labels={horas:'Horas',dias:'Días',anos:'Años',km:'Kilómetros'};
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=()=>new Date();
const lead=(p,u)=>Math.max(0,Number(u==='km'?p.avisoKm:p.avisoDias)||0);
function metrics(p,v){
 const last=p.historialGeneracion?.[v.id]||{};
 const from=last.fecha||p.inicio;if(!from)return [];
 const hours=(now()-new Date(from))/3600000;
 const km0=last.km??p.kmInicio?.[v.id];
 return (p.reglas||[]).filter(r=>Number(r.cada)>0).map(r=>{
  const total=Number(r.cada),unit=r.unidad;
  if(unit==='km'&&km0==null)return {unit,invalid:true,remaining:null};
  const elapsed=unit==='km'?Number(v.km||0)-Number(km0):unit==='horas'?hours:unit==='dias'?hours/24:hours/(365.2425*24);
  const remaining=total-elapsed;
  const threshold=unit==='km'?lead(p,'km'):unit==='horas'?lead(p,'dias')*24:unit==='anos'?lead(p,'dias')/365.2425:lead(p,'dias');
  return {unit,total,elapsed,remaining,threshold,late:remaining<=0,near:remaining<=threshold};
 });
}
function status(p,v){
 const rules=metrics(p,v);
 if(rules.some(x=>x.late))return {level:'vencido',label:'Vencido',rules};
 if(rules.some(x=>x.near))return {level:'proximo',label:'Próximo',rules};
 return {level:'aldia',label:'Al día',rules};
}
window.planStatus=status;
const oldRender=window.planRenderEditor;
window.planRenderEditor=function(edit=false){
 oldRender(edit);
 const form=document.getElementById('plan-v2-form'),p=window.planDraft;
 p.avisoDias??=7;p.avisoKm??=500;p.emitirAnticipado??=false;
 const insertion=document.createElement('section');insertion.className='plan-alert-settings';
 insertion.innerHTML='<h3>🔔 Anticipación, alertas y emisión</h3><div class="grid"><label class="field">Avisar con anticipación (días)<input type="number" min="0" value="'+p.avisoDias+'" id="plan-aviso-dias"></label><label class="field">Avisar con anticipación (km)<input type="number" min="0" value="'+p.avisoKm+'" id="plan-aviso-km"></label></div><label style="display:block;margin:9px 0"><input type="checkbox" id="plan-emitir-antes" '+(p.emitirAnticipado?'checked':'')+'> Emitir OT preventiva cuando entre en el período de aviso (sin esperar al vencimiento)</label><p class="muted">Si esta opción está desactivada, se muestran avisos y la emisión automática se produce al vencer. Requiere activar también «Programación automática».</p>';
 const auto=form.querySelector('[name="automatico"]')?.closest('label');auto?.before(insertion);
 insertion.querySelector('#plan-aviso-dias').oninput=e=>p.avisoDias=Math.max(0,Number(e.target.value)||0);
 insertion.querySelector('#plan-aviso-km').oninput=e=>p.avisoKm=Math.max(0,Number(e.target.value)||0);
 insertion.querySelector('#plan-emitir-antes').onchange=e=>p.emitirAnticipado=e.target.checked;
};
const oldDraw=window.planDrawRules;
window.planDrawRules=function(){
 oldDraw();
 const root=document.getElementById('plan-rules');
 root.querySelectorAll('select').forEach(sel=>{
  sel.style.minWidth='160px';
  Array.from(sel.options).forEach(o=>{o.textContent=(icons[o.value]||'◷')+'  '+(labels[o.value]||o.value)});
 });
};
const oldPage=window.plansPage;
window.plansPage=function(){
 let base=oldPage();
 const details=db.plans.flatMap(p=>(p.vehiculoIds||[]).map(id=>{const v=vehicle(id);if(!v)return null;return {p,v,s:status(p,v)}}).filter(Boolean));
 const late=details.filter(x=>x.s.level==='vencido'),soon=details.filter(x=>x.s.level==='proximo');
 const top='<div class="card"><div class="row spread"><div><h3>🗓️ Calendario de mantenimiento preventivo</h3><p class="muted">Control de fechas, horas y lecturas de odómetro; anticipación por días o kilómetros.</p></div></div><div class="grid"><div class="summary"><b>🔴 Vencidos: '+late.length+'</b><p class="muted">Requieren revisión o emisión de OT.</p></div><div class="summary"><b>🟠 Próximos: '+soon.length+'</b><p class="muted">Dentro del margen de aviso.</p></div></div>'+(details.length?'<div class="scroll"><table><thead><tr><th>Vehículo</th><th>Plan</th><th>Ciclo / margen</th><th>Estado</th></tr></thead><tbody>'+details.map(({p,v,s})=>'<tr><td>'+html(v.patente)+'</td><td>'+html(p.nombre)+'</td><td>'+s.rules.map(r=>r.invalid?'Odómetro sin base':html((icons[r.unit]||'')+' '+Math.round(r.remaining*10)/10+' '+(labels[r.unit]||r.unit)+' restantes')).join('<br>')+'</td><td>'+({vencido:'🔴 Vencido',proximo:'🟠 Próximo',aldia:'🟢 Al día'}[s.level])+'</td></tr>').join('')+'</tbody></table></div>':'<p class="muted">Asocia vehículos a los planes para visualizar el calendario y las alertas.</p>')+'</div>';
 return top+base;
};
const oldAuto=window.planRunAuto;
window.planRunAuto=function(silent=false){
 let early=0;
 for(const p of db.plans){
  if(!p.automatico||!p.emitirAnticipado)continue;
  for(const id of p.vehiculoIds||[]){
   const v=vehicle(id);if(!v)continue;
   const st=status(p,v);
   if(st.level==='proximo'&&planCreateOT(p.id,id,true))early++;
  }
 }
 const due=oldAuto(true);
 if(!silent){alert((early+due)+' OT automáticas generadas. Las próximas y vencidas se muestran en el panel.');render()}
 return early+due;
};
const style=document.createElement('style');style.textContent='.plan-alert-settings{border:1px solid #d9e2f4;background:#f7f9fd;border-radius:10px;padding:12px;margin:12px 0}.plan-alert-settings h3{margin:0 0 12px}.plan-alert-settings label{font-size:13px}';document.head.append(style);
})();