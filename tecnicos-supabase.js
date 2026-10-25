import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const sb=createClient('https://ynbfijurdsyjymppoqnh.supabase.co','sb_publishable_qHJqwkmBzBFa-p6MYUq2gw_6kVAYpK0');
let debounce=0;
window.T360TechSearch={
 async search(q=''){
  const {data:{session}}=await sb.auth.getSession();
  if(!session)throw new Error('Inicia sesión en Supabase para buscar técnicos reales.');
  const {data,error}=await sb.rpc('buscar_tecnicos_taller',{termino:q});
  if(error)throw new Error('Consulta no disponible. Ejecuta primero el SQL supabase/03_busqueda_tecnicos.sql. '+error.message);
  return data||[];
 },
 render(inputId,targetId,select){
  const input=document.getElementById(inputId),dest=document.getElementById(targetId);
  if(!input||!dest)return;
  const run=async()=>{
   const q=input.value;dest.textContent='Buscando técnicos...';
   try{
    const found=await this.search(q);
    dest.replaceChildren();
    if(!found.length){dest.textContent='Sin resultados en el personal activo de tu taller.';return}
    found.forEach(p=>{
     const b=document.createElement('button');b.type='button';b.className='ot-option';
     b.textContent=p.nombre+' · '+(p.cargo||p.especialidad||'Técnico');
     b.onclick=()=>{input.value=p.nombre;select(p);dest.replaceChildren();const info=document.createElement('span');info.className='pill green';info.textContent='Seleccionado: '+p.nombre;dest.append(info)};
     dest.append(b);
    });
   }catch(e){dest.textContent=e.message}
  };
  input.addEventListener('input',()=>{clearTimeout(debounce);select(null);debounce=setTimeout(run,220)});
  input.addEventListener('focus',run);
  run();
 }
};
