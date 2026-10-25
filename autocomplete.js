/* Taller 360 · Selector inteligente en todos los formularios, incluso subformularios dinámicos. */
(()=>{
const css=document.createElement('style');
css.textContent='.t360-suggestions{position:fixed;z-index:25000;max-height:250px;overflow:auto;background:#fff;border:1px solid #c6d6ef;border-radius:10px;box-shadow:0 15px 42px #12224435;padding:5px;min-width:200px}.t360-suggestions[hidden]{display:none}.t360-suggestions button{display:block;width:100%;text-align:left;border:0;background:#fff;padding:10px 12px;border-radius:7px;color:#1d3050;cursor:pointer;font:13px system-ui}.t360-suggestions button:hover,.t360-suggestions button.active{background:#eaf1ff}.t360-hint{color:#64748b;font:11px system-ui;padding:6px 10px;border-bottom:1px solid #e9edf6}.t360-suggestions small{display:block;color:#74839a;font-size:11px;margin-top:2px}';
document.head.append(css);
const panel=document.createElement('div');panel.className='t360-suggestions';panel.hidden=true;document.body.append(panel);
let current=null,options=[],selected=-1;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const model=()=>typeof db==='undefined'?{}:db;
function typeOf(el){
 const parent=el.closest('label');
 const label=norm([el.name,el.id,el.getAttribute('placeholder'),parent?.firstChild?.textContent,parent?.textContent?.slice(0,65)].join(' '));
 if(/recurso|repuesto|herramienta|insumo|material/.test(label))return 'recursos';
 if(/tecnico|responsable|mecanico|personal/.test(label))return 'personal';
 if(/cliente|propietario|razon|contacto/.test(label))return 'clientes';
 if(/patente|vehiculo|modelo|marca|motor|vin/.test(label))return 'vehiculos';
 if(/rut/.test(label))return 'rut';
 if(/telefono/.test(label))return 'telefono';
 if(/email|correo/.test(label))return 'email';
 if(/plan|servicio|descripcion|actividad|tarea|procedimiento|diagnostico/.test(label))return 'servicios';
 if(/ubicacion/.test(label))return 'ubicacion';
 return 'general';
}
const resources=['Aceite de motor 5W30','Aceite de motor 10W40','Filtro de aceite','Filtro de aire','Filtro de combustible','Pastillas de freno','Discos de freno','Líquido de frenos DOT 4','Refrigerante','Correa de distribución','Bujías','Juego de llaves','Torquímetro','Escáner automotriz OBD-II','Elevador hidráulico','Compresor de aire','Gata hidráulica','Multímetro','Guantes de seguridad','Paños de limpieza'];
const categories={
 recursos:resources,
 personal:['Carlos – Técnico mecánico','Diego – Técnico mecánico','Mario – Técnico mecánico','Andrés – Técnico mecánico','Jefe de taller','Recepción'],
 ubicacion:['Taller principal','Recepción','Zona de diagnóstico','Bahía de servicio','Almacén de repuestos'],
 general:[]
};
function source(kind){
 const d=model(),clients=d.clients||[],vehicles=d.vehicles||[],plans=d.plans||[],ots=d.ots||[];
 if(kind==='personal')return [...(d.tecnicos||[]).map(x=>x.nombre),...ots.map(x=>x.tecnico),...ots.flatMap(o=>(o.tareas||[]).map(t=>t.responsable)),...categories.personal];
 if(kind==='recursos')return [...(d.productos||[]).map(x=>x.nombre),...ots.flatMap(o=>(o.tareas||[]).map(t=>t.recursos)),...categories.recursos];
 if(kind==='clientes')return clients.map(x=>x.nombre);
 if(kind==='vehiculos')return vehicles.flatMap(x=>[x.patente,x.marca,x.modelo,x.marca+' '+x.modelo]);
 if(kind==='rut')return clients.map(x=>x.rut);
 if(kind==='telefono')return clients.map(x=>x.telefono);
 if(kind==='email')return clients.map(x=>x.email);
 if(kind==='servicios')return [...plans.flatMap(p=>[p.nombre,...p.tareas]),...ots.map(x=>x.servicio),...ots.flatMap(o=>(o.tareas||[]).map(t=>t.nombre))];
 return categories[kind]||[];
}
function token(el,kind){const s=el.value||'';return kind==='recursos'?s.split(',').pop().trim():s.trim()}
function results(el){const kind=typeOf(el), q=norm(token(el,kind));const uniques=[...new Set(source(kind).flatMap(x=>String(x||'').split(kind==='recursos'?/[;,]/:/\n/).map(z=>z.trim()).filter(Boolean)))];return {kind,values:uniques.filter(x=>!q||norm(x).includes(q)).slice(0,12)}}
function hide(){panel.hidden=true;current=null;options=[];selected=-1}
function locate(el){const r=el.getBoundingClientRect();let width=Math.min(Math.max(r.width,260),innerWidth-16);let left=Math.max(8,Math.min(r.left,innerWidth-width-8));panel.style.width=width+'px';panel.style.left=left+'px';panel.style.top=(r.bottom+4)+'px';if(r.bottom+270>innerHeight&&r.top>260)panel.style.top='auto',panel.style.bottom=(innerHeight-r.top+4)+'px';else panel.style.bottom='auto'}
function choose(s){const el=current;if(!el)return;const kind=typeOf(el);if(kind==='recursos'){let parts=el.value.split(',');parts[parts.length-1]=s;el.value=parts.map(p=>p.trim()).filter(Boolean).join(', ')+', '}else el.value=s;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));hide();el.focus()}
function show(el){if(!el||el.disabled||el.readOnly)return hide();const r=results(el);if(!r.values.length)return hide();current=el;options=r.values;selected=-1;panel.replaceChildren();const hint=document.createElement('div');hint.className='t360-hint';hint.textContent=r.kind==='recursos'?'Selecciona varios recursos; se separan por coma':r.kind==='personal'?'Selecciona un responsable o escribe uno nuevo':'Sugerencias según el campo';panel.append(hint);options.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=s;b.onmousedown=e=>e.preventDefault();b.onclick=()=>choose(s);panel.append(b)});locate(el);panel.hidden=false}
const selector='input[type=text],input:not([type]),input[type=search],input[type=email],textarea';
document.addEventListener('input',e=>{if(e.target.matches(selector))show(e.target)});
document.addEventListener('focusin',e=>{if(e.target.matches(selector))show(e.target)});
document.addEventListener('keydown',e=>{if(panel.hidden||e.target!==current)return;if(e.key==='Escape'){hide();return}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();selected=(selected+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;panel.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===selected))}if(e.key==='Enter'&&selected>=0){e.preventDefault();choose(options[selected])}});
document.addEventListener('pointerdown',e=>{if(!panel.contains(e.target)&&e.target!==current)hide()});
window.addEventListener('scroll',()=>{if(current&&!panel.hidden)locate(current)},true);
window.addEventListener('resize',()=>{if(current&&!panel.hidden)locate(current)});
})();