/* Panel compacto de filtros por columna de órdenes de trabajo */
(function(){
const state={open:'',text:{ot:'',patente:'',cliente:'',servicio:'',responsable:''},estado:'',prioridad:'',dateField:'fecha',operator:'between',from:'',to:'',schedule:'all',week:'',overdue:'all'};
const groups=[['ot','▤','N° OT'],['patente','▣','Vehículo'],['cliente','♙','Cliente'],['servicio','⚒','Servicio'],['estado','◉','Estado'],['prioridad','⚑','Prioridad'],['responsable','♧','Responsable'],['fecha','▦','Fechas'],['programacion','◷','Programación'],['atraso','⚠','Atrasos']];
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const todayChile=()=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=Object.fromEntries(parts.map(p=>[p.type,p.value]));return v.year+'-'+v.month+'-'+v.day};
const dateOnly=s=>{const t=String(s||'');return /^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):''};
const datum=(o,k)=>k==='patente'?vehicle(o.vehicleId)?.patente||'':k==='cliente'?client(vehicle(o.vehicleId)?.clienteId)?.nombre||'':k==='responsable'?(o.responsableNombre||o.responsable||o.tecnico||o.tecnicoNombre||''):String(o[k]??'');
const dateValue=o=>dateOnly(o[state.dateField]|| (state.dateField==='programacion'?(o.fechaProgramada||o.fechaProgramacion||o.fecha):''));
const overdue=o=>{const d=dateOnly(o.fechaProgramada||o.fechaProgramacion||o.fecha);return d&&d<todayChile()&&!['terminada','cerrada','finalizada','cancelada'].includes(norm(o.estado))};
const monday=s=>{if(!s)return '';const d=new Date(s+'T12:00:00');if(Number.isNaN(d.getTime()))return '';const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const check=o=>{
 for(const [k,v] of Object.entries(state.text))if(v.trim()&&!norm(datum(o,k)).includes(norm(v.trim())))return false;
 if(state.estado&&o.estado!==state.estado)return false;
 if(state.prioridad&&o.prioridad!==state.prioridad)return false;
 if(state.overdue==='late'&&!overdue(o))return false;
 if(state.overdue==='ontime'&&overdue(o))return false;
 const date=dateValue(o);
 if(state.from){if(!date)return false; if(state.operator==='eq'&&date!==state.from)return false;if(state.operator==='gt'&&date<=state.from)return false;if(state.operator==='lt'&&date>=state.from)return false;if(state.operator==='gte'&&date<state.from)return false;if(state.operator==='lte'&&date>state.from)return false;if(state.operator==='between'&&date<state.from)return false}
 if(state.operator==='between'&&state.to&&(!date||date>state.to))return false;
 if(state.schedule==='week'&&state.week&&monday(dateOnly(o.fechaProgramada||o.fechaProgramacion||o.fecha))!==monday(state.week))return false;
 if(state.schedule==='today'&&dateOnly(o.fechaProgramada||o.fechaProgramacion||o.fecha)!==todayChile())return false;
 if(state.schedule==='unscheduled'&&(o.fechaProgramada||o.fechaProgramacion||o.fecha))return false;
 return true;
};
const oldMatched=window.matched;
window.matched=function(){return oldMatched().filter(check)};
window.t360OTToggle=k=>{state.open=state.open===k?'':k;render()};
window.t360OTSet=(key,value)=>{state[key]=value;refreshOT();updateCount()};
window.t360OTText=(key,value)=>{state.text[key]=value;refreshOT();updateCount()};
window.t360OTClear=()=>{state.open='';Object.keys(state.text).forEach(k=>state.text[k]='');Object.assign(state,{estado:'',prioridad:'',dateField:'fecha',operator:'between',from:'',to:'',schedule:'all',week:'',overdue:'all'});filters={buscar:'',estado:'todos',prioridad:'todos'};render()};
function updateCount(){const c=document.getElementById('t360-ot-count');if(c)c.textContent=matched().length+' de '+db.ots.length+' OT'}
const sel=(key,items)=>'<select onchange="t360OTSet(\''+key+'\',this.value)">'+items.map(([v,l])=>'<option value="'+safe(v)+'" '+(state[key]===v?'selected':'')+'>'+safe(l)+'</option>').join('')+'</select>';
function fields(k){
 if(state.text.hasOwnProperty(k))return '<label class="field">Buscar '+groups.find(x=>x[0]===k)[2]+'<input type="search" autocomplete="off" value="'+safe(state.text[k])+'" placeholder="Escribe para filtrar..." oninput="t360OTText(\''+k+'\',this.value)"></label>';
 if(k==='estado')return '<label class="field">Estado'+sel('estado',[['','Todos'],...Object.entries(statuses)])+'</label>';
 if(k==='prioridad')return '<label class="field">Prioridad'+sel('prioridad',[['','Todas'],...['Normal','Media','Alta','Urgente'].map(x=>[x,x])])+'</label>';
 if(k==='fecha')return '<div class="t360-ot-dategrid"><label class="field">Fecha a consultar'+sel('dateField',[['fecha','Fecha de OT'],['fechaProgramada','Fecha programada'],['fechaInicio','Fecha de inicio'],['fechaTermino','Fecha de término']])+'</label><label class="field">Operador'+sel('operator',[['eq','Igual a'],['gt','Mayor que (después)'],['lt','Menor que (antes)'],['gte','Mayor o igual'],['lte','Menor o igual'],['between','Entre fechas']])+'</label><label class="field">Fecha'+ '<input type="date" value="'+safe(state.from)+'" onchange="t360OTSet(\'from\',this.value)"></label>'+(state.operator==='between'?'<label class="field">Hasta<input type="date" value="'+safe(state.to)+'" onchange="t360OTSet(\'to\',this.value)"></label>':'')+'</div>';
 if(k==='programacion')return '<label class="field">Programación'+sel('schedule',[['all','Cualquier fecha'],['today','Programadas hoy'],['week','Semana seleccionada'],['unscheduled','Sin fecha de programación']])+'</label>'+(state.schedule==='week'?'<label class="field">Seleccionar un día de la semana<input type="date" value="'+safe(state.week)+'" onchange="t360OTSet(\'week\',this.value)"></label>':'');
 if(k==='atraso')return '<label class="field">Situación'+sel('overdue',[['all','Todas las OT'],['late','Atrasadas y abiertas'],['ontime','No atrasadas']])+'</label><p class="muted">Atraso: fecha de OT o programación anterior a hoy y OT sin cerrar.</p>';
 return '';
}
const oldPage=window.otPage;
window.otPage=function(){
 const base=oldPage();
 const toolbar='<div class="t360-ot-tools"><div class="row t360-ot-icons">'+groups.map(([k,ico,label])=>'<button class="button t360-ot-icon '+(state.open===k?'active':'')+'" title="Filtrar '+label+'" aria-expanded="'+(state.open===k)+'" onclick="t360OTToggle(\''+k+'\')"><span aria-hidden="true">'+ico+'</span><small>'+label+'</small></button>').join('')+'</div><div class="row spread"><small id="t360-ot-count" class="muted">'+matched().length+' de '+db.ots.length+' OT</small><button type="button" class="button" onclick="t360OTClear()">Limpiar todos los filtros</button></div>'+(state.open?'<div class="t360-ot-panel"><div class="row spread"><strong>'+groups.find(g=>g[0]===state.open)[2]+'</strong><button class="button" onclick="t360OTToggle(\''+state.open+'\')" aria-label="Cerrar filtros">✕</button></div>'+fields(state.open)+'</div>':'')+'</div>';
 return base.replace('<div class="filter">',toolbar+'<div class="filter">');
};
const style=document.createElement('style');style.textContent='.t360-ot-tools{margin:14px 0;border:1px solid var(--line);border-radius:10px;padding:12px;background:#f8fafc}.t360-ot-icons{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}.t360-ot-icon{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:68px;min-height:59px;gap:2px}.t360-ot-icon span{font-size:20px;line-height:1.2}.t360-ot-icon small{font-size:10px}.t360-ot-icon.active{border-color:var(--blue);color:var(--blue);background:#edf1ff}.t360-ot-panel{background:white;border:1px solid var(--line);border-radius:9px;padding:14px;margin-top:10px}.t360-ot-panel>.field{max-width:500px}.t360-ot-panel input,.t360-ot-panel select{width:100%}.t360-ot-dategrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.t360-ot-dategrid .field{margin:0}@media(max-width:700px){.t360-ot-icons{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.t360-ot-icon{min-width:0;padding:7px 2px}.t360-ot-icon small{font-size:9px}.t360-ot-tools{padding:8px}.t360-ot-dategrid{grid-template-columns:1fr}}';document.head.append(style);
})();