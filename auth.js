// Conexión inicial: sólo autenticación y lectura del perfil propio.
// No consulta clientes, vehículos, OT ni otras tablas operacionales.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const URL = 'https://ynbfijurdsyjymppoqnh.supabase.co';
const KEY = 'sb_publishable_qHJqwkmBzBFa-p6MYUq2gw_6kVAYpK0';
const supabase = createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const theme = document.createElement('style');
theme.textContent = `
#auth-badge{font-size:12px;color:#66758a}#auth-trigger{border:1px solid #d6deec;border-radius:8px;padding:9px 12px;background:#fff;color:#1c376f;cursor:pointer}
#auth-overlay{position:fixed;inset:0;background:#152036a8;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px}
#auth-overlay[hidden]{display:none}
#auth-panel{width:min(420px,100%);padding:28px;background:white;border-radius:15px;box-shadow:0 20px 60px #1116;font:14px system-ui;color:#243047}
#auth-panel h2{margin:0 0 8px;font-size:21px}#auth-panel p{color:#6d7b8d;line-height:1.45}
#auth-panel label{display:block;margin:14px 0;font-size:12px}#auth-panel input{display:block;width:100%;margin-top:6px;padding:11px;border:1px solid #d6deeb;border-radius:8px}
#auth-panel .a-btn{padding:10px 13px;border:0;border-radius:8px;background:#3c68e8;color:white;cursor:pointer}
#auth-panel .a-close{float:right;cursor:pointer;background:none;border:0;font-size:20px}
#auth-error{color:#b91c1c!important;min-height:18px;font-size:12px}
`;
document.head.append(theme);
const toolbar=document.querySelector('.top .row');
const badge=document.createElement('span');badge.id='auth-badge';badge.textContent='Sin sesión Supabase';
const trigger=document.createElement('button');trigger.id='auth-trigger';trigger.textContent='Iniciar sesión';
toolbar?.prepend(trigger);toolbar?.prepend(badge);
const overlay=document.createElement('div');overlay.id='auth-overlay';overlay.hidden=true;
overlay.innerHTML=`<div id="auth-panel"><button type="button" class="a-close" id="auth-close">✕</button><h2>Acceso a Taller 360</h2><p>Conecta tu cuenta de Supabase. Por seguridad, esta etapa solo verifica el perfil; los datos operativos siguen siendo ficticios.</p><form id="auth-form"><label>Correo electrónico<input id="auth-email" required type="email" autocomplete="username"></label><label>Contraseña<input id="auth-password" required type="password" autocomplete="current-password"></label><p id="auth-error" role="alert"></p><button class="a-btn">Ingresar</button></form><button id="auth-logout" class="a-btn" style="display:none;background:#58677e">Cerrar sesión</button></div>`;
document.body.append(overlay);
const status=(msg,logged)=>{badge.textContent=msg;trigger.textContent=logged?'Cuenta':'Iniciar sesión';overlay.querySelector('#auth-form').style.display=logged?'none':'block';overlay.querySelector('#auth-logout').style.display=logged?'inline-block':'none'};
trigger.onclick=()=>{overlay.hidden=false};
overlay.querySelector('#auth-close').onclick=()=>{overlay.hidden=true};
overlay.onclick=e=>{if(e.target===overlay)overlay.hidden=true};
overlay.querySelector('#auth-form').onsubmit=async e=>{
 e.preventDefault();
 const err=document.querySelector('#auth-error');err.textContent='Verificando...';
 const {error}=await supabase.auth.signInWithPassword({email:document.querySelector('#auth-email').value.trim(),password:document.querySelector('#auth-password').value});
 if(error){err.textContent='No se pudo iniciar sesión: '+error.message;return}
 err.textContent='';document.querySelector('#auth-password').value='';overlay.hidden=true;
 await refresh();
};
overlay.querySelector('#auth-logout').onclick=async()=>{await supabase.auth.signOut();await refresh();overlay.hidden=true};
async function refresh(){
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user){status('Sin sesión Supabase',false);return}
 // La única consulta de datos es el propio usuario y su perfil.
 const {data:profile,error:pe}=await supabase.schema('rubinstein').from('usuarios').select('nombre,activo,perfil_id,perfiles(codigo,nombre)').eq('id',user.id).maybeSingle();
 if(pe){status('Sesión iniciada · perfil no disponible',true);console.warn('Perfil no disponible. Verifica Data API / RLS:',pe.message);return}
 if(!profile?.activo){status('Cuenta sin autorización',true);return}
 status((profile.nombre||user.email)+' · '+(profile.perfiles?.nombre||'Perfil asignado'),true);
}
supabase.auth.onAuthStateChange(()=>{ /* La actualización del perfil se hace explícitamente tras cada acción */ });
refresh();
