import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const sb=createClient('https://ynbfijurdsyjymppoqnh.supabase.co','sb_publishable_qHJqwkmBzBFa-p6MYUq2gw_6kVAYpK0');
async function scope(){
 const {data:{user},error:authError}=await sb.auth.getUser();if(authError||!user)throw Error('Debes iniciar sesión para guardar en Supabase.');
 const {data,error}=await sb.schema('rubinstein').from('usuarios').select('taller_id,activo').eq('id',user.id).single();
 if(error)throw Error('No se puede identificar el taller: '+error.message);
 if(!data?.activo||!data.taller_id)throw Error('Cuenta sin taller activo.');
 return data.taller_id;
}
window.T360OTCloud={
 async save(o){
  const taller_id=await scope();
  const payload={taller_id,ot_ref:o.id,datos:{tareas:o.tareas||[]},actualizado_en:new Date().toISOString()};
  const {error}=await sb.schema('rubinstein').from('ot_complementos').upsert(payload,{onConflict:'taller_id,ot_ref'});
  if(error)throw Error('No se guardaron complementos en Supabase: '+error.message+'; ejecuta supabase/07_ot_complementos.sql si falta la tabla.');
  return true;
 },
 async load(o){
  const taller_id=await scope();
  const {data,error}=await sb.schema('rubinstein').from('ot_complementos').select('datos').eq('taller_id',taller_id).eq('ot_ref',o.id).maybeSingle();
  if(error)throw Error('No se pudieron recuperar los complementos: '+error.message);
  if(data?.datos?.tareas?.length){
   const byId=new Map(data.datos.tareas.map((t,i)=>[String(t.id||i),t]));
   o.tareas=(o.tareas||[]).map((t,i)=>({...t,...(byId.get(String(t.id||i))||{})}));
   save();
  }
  return !!data;
 }
};
