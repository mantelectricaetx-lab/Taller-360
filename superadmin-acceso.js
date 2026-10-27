import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const sb=createClient('https://ynbfijurdsyjymppoqnh.supabase.co','sb_publishable_qHJqwkmBzBFa-p6MYUq2gw_6kVAYpK0');
window.T360SuperadminAllowed=false;
async function check(){
 let allowed=false;
 try{const {data:{user}}=await sb.auth.getUser();if(user){const {data,error}=await sb.rpc('t360_es_superadmin');allowed=!error&&data===true}}catch(e){console.warn('Validación administrador no disponible:',e.message)}
 const prior=window.T360SuperadminAllowed;window.T360SuperadminAllowed=allowed;
 const items=navGroups.find(x=>x[0]==='GESTIÓN')?.[1];
 if(items){const exists=items.some(x=>x[0]==='superadmin');if(allowed&&!exists)items.push(['superadmin','♜','Superadministración']);if(!allowed&&exists)items.splice(items.findIndex(x=>x[0]==='superadmin'),1)}
 if(!allowed&&page==='superadmin')page='dashboard';
 if(prior!==allowed||page==='superadmin')render();
}
sb.auth.onAuthStateChange(()=>{setTimeout(check,50)});
check();
