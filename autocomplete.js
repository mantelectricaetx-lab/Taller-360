/* Taller 360 - autocomplete reusable for editable text fields. */
(()=>{
const css=document.createElement('style');css.textContent='.t360-suggestions{position:fixed;z-index:25000;max-height:210px;overflow:auto;background:#fff;border:1px solid #cbd7e8;border-radius:9px;box-shadow:0 12px 32px #17213d2a;padding:4px;min-width:180px}.t360-suggestions button{display:block;width:100%;text-align:left;background:white;border:0;border-radius:6px;padding:9px 11px;cursor:pointer;color:#22314b;font:13px system-ui}.t360-suggestions button:hover,.t360-suggestions button:focus{background:#edf3ff;outline:none}.t360-suggestions[hidden]{display:none}';document.head.append(css);
const panel=document.createElement('div');panel.className='t360-suggestions';panel.hidden=true;document.body.append(panel);
let current=null,items=[];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function suggestions(el){
const label=norm([el.name,el.id,el.placeholder,el.closest('label')?.textContent].join(' '));
let values=[];
const clients=(typeof db !== 'undefined' ? db : {})?.clients||[];
const vehicles=(typeof db !== 'undefined' ? db : {})?.vehicles||[];
const plans=(typeof db !== 'undefined' ? db : {})?.plans||[];
const ots=(typeof db !== 'undefined' ? db : {})?.ots||[];
if(/cliente|propietario|nombre|razon|contacto/.test(label))values.push(...clients.map(x=>x.nombre));
if(/patente|vehiculo|modelo|marca|motor|vin/.test(label))values.push(...vehicles.flatMap(x=>[x.patente,x.marca,x.modelo,x.marca+' '+x.modelo]));
if(/rut/.test(label))values.push(...clients.map(x=>x.rut));
if(/telefono/.test(label))values.push(...clients.map(x=>x.telefono));
if(/email|correo/.test(label))values.push(...clients.map(x=>x.email));
if(/plan|servicio|descripcion|actividad|tarea|procedimiento|diagnostico/.test(label))values.push(...plans.flatMap(p=>[p.nombre,...p.tareas]),...ots.map(x=>x.servicio));
if(/tecnico|responsable|personal/.test(label))values.push(...ots.map(x=>x.tecnico));
if(/recurso|repuesto|herramienta|insumo/.test(label))values.push('Aceite de motor','Filtro de aceite','Filtro de aire','Escáner automotriz','Elevador hidráulico','Juego de llaves','Líquido de frenos','Torquímetro');
if(/ubicacion/.test(label))values.push('Taller principal','Recepción','Zona de diagnóstico','Bahía de servicio');
const q=norm(el.value.trim());
return [...new Set(values.filter(Boolean).map(String))].filter(x=>q&&norm(x).includes(q)&&norm(x)!==q).slice(0,9);
}
function hide(){panel.hidden=true;current=null}
function place(el){const r=el.getBoundingClientRect();panel.style.left=Math.max(5,Math.min(r.left,innerWidth-230))+'px';panel.style.top=(r.bottom+3)+'px';panel.style.width=Math.min(Math.max(r.width,230),innerWidth-12)+'px'}
function show(el){if(!el||el.disabled||el.readOnly)return hide();items=suggestions(el);if(!items.length)return hide();current=el;panel.replaceChildren();items.forEach(v=>{let b=document.createElement('button');b.type='button';b.textContent=v;b.addEventListener('mousedown',e=>e.preventDefault());b.onclick=()=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));hide();el.focus()};panel.append(b)});place(el);panel.hidden=false}
document.addEventListener('input',e=>{if(e.target.matches('input:not([type=number]):not([type=date]):not([type=time]):not([type=password]):not([type=color]),textarea'))show(e.target)});
document.addEventListener('focusin',e=>{if(e.target.matches('input[type=text],input[type=search],input[type=email],textarea')&&e.target.value)show(e.target)});
document.addEventListener('keydown',e=>{if(panel.hidden||e.target!==current)return;if(e.key==='Escape')hide();if(e.key==='ArrowDown'){e.preventDefault();panel.querySelector('button')?.focus()}});
document.addEventListener('pointerdown',e=>{if(!panel.contains(e.target)&&e.target!==current)hide()});
window.addEventListener('scroll',()=>{if(current&&!panel.hidden)place(current)},true);
window.addEventListener('resize',()=>{if(current&&!panel.hidden)place(current)});
})();