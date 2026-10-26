(function(){
const queries={clientes:'',vehiculos:''},norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.\-\s]/g,'');
function sync(){
 const title=document.getElementById('heading')?.textContent?.trim().toLowerCase(),type=title==='clientes'?'clientes':title==='vehículos'||title==='vehiculos'?'vehiculos':null;
 const card=document.querySelector('#app>.card');if(!type||!card||card.querySelector('.t360-live-search'))return;
 const records=type==='clientes'?db.clients:db.vehicles,rows=[...card.querySelectorAll('tbody tr')];
 const wrap=document.createElement('div');wrap.className='t360-live-search';
 const input=document.createElement('input');input.type='search';input.autocomplete='off';input.setAttribute('aria-label','Búsqueda inteligente');input.placeholder=type==='clientes'?'⌕ Buscar cliente, RUT, teléfono, correo...':'⌕ Buscar patente, marca, modelo, propietario...';input.value=queries[type];
 const clear=document.createElement('button');clear.type='button';clear.className='button';clear.textContent='Limpiar';
 const line=document.createElement('div');line.className='t360-live-line';line.append(input,clear);
 const hint=document.createElement('small');hint.className='muted';
 const suggestions=document.createElement('div');suggestions.className='t360-live-suggestions';suggestions.hidden=true;
 wrap.append(line,hint,suggestions);
 (card.querySelector('.t360-filter-heading')||card.querySelector('.row.spread'))?.after(wrap);
 function searchable(o){const a=Object.values(o).filter(v=>typeof v==='string'||typeof v==='number');if(type==='vehiculos'){const owner=db.clients.find(c=>c.id===o.clienteId);if(owner)a.push(owner.nombre,owner.rut)}return a.join(' ')}
 function apply(){
  queries[type]=input.value;const q=norm(input.value),matches=records.filter(o=>norm(searchable(o)).includes(q)),ids=new Set(matches.map(o=>String(o.id)));
  rows.forEach((tr,i)=>tr.hidden=!ids.has(String(records[i]?.id)));
  hint.textContent=matches.length+' de '+records.length+' registros';
  suggestions.replaceChildren();suggestions.hidden=!q;if(!q)return;
  matches.slice(0,7).forEach(o=>{const b=document.createElement('button');b.type='button';b.textContent=type==='clientes'?(o.nombre||'')+' · '+(o.rut||''):(o.patente||'')+' · '+(o.marca||'')+' '+(o.modelo||'');b.onclick=()=>{suggestions.hidden=true;type==='clientes'?openClient(o.id):openVehicle(o.id)};suggestions.append(b)});
  if(!matches.length){const p=document.createElement('p');p.className='muted';p.textContent='No se encontraron coincidencias';suggestions.append(p)}
 }
 input.addEventListener('input',apply);input.addEventListener('keydown',e=>{if(e.key==='Escape')suggestions.hidden=true;if(e.key==='Enter'&&suggestions.firstElementChild?.tagName==='BUTTON')suggestions.firstElementChild.click()});
 clear.onclick=()=>{input.value='';apply();input.focus()};apply();
}
const style=document.createElement('style');style.textContent='.t360-live-search{margin:12px 0;position:relative}.t360-live-line{display:flex;gap:8px;align-items:center}.t360-live-line input{width:100%;flex:1;min-width:0;font-size:14px;padding:11px;border:1px solid var(--line);border-radius:8px}.t360-live-search small{display:block;margin:6px 1px}.t360-live-suggestions:not([hidden]){position:absolute;left:0;right:0;top:47px;max-height:260px;overflow:auto;z-index:40;background:white;border:1px solid var(--line);border-radius:9px;box-shadow:0 12px 28px #17233b24;padding:5px}.t360-live-suggestions button{display:block;text-align:left;width:100%;padding:12px;background:white;color:var(--ink);border:0;border-radius:7px}.t360-live-suggestions button:hover,.t360-live-suggestions button:focus{background:#edf1ff}.t360-live-suggestions p{padding:8px}';document.head.append(style);
new MutationObserver(sync).observe(document.getElementById('app'),{childList:true});sync();
})();