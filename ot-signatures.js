// Firmas manuscritas secuenciales de demostración local.
(function(){
const roles=[['tecnico','Técnico ejecutor'],['revisor','Jefe / revisor de taller'],['aprobador','Cliente / aprobador final']];
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.otSignaturesUI=function(id){
 const o=db.ots.find(x=>x.id===id);if(!o)return '';
 const signed=o.firmas||{};
 return '<details open><summary>Firmas digitales y aprobación</summary><div><p class="muted">Orden: técnico → revisor → cliente/aprobador. Se registra nombre, fecha y trazo.</p>'+roles.map(([key,title],i)=>{
 const sig=signed[key],ready=i===0||!!signed[roles[i-1][0]];
 return '<div class="summary" style="margin:8px 0"><b>'+title+'</b> · '+(sig?'Firmado por '+safe(sig.nombre)+' ('+safe(sig.fecha)+')':ready?'Pendiente de firma':'Esperando firma anterior')+(sig?'<div><img src="'+sig.imagen+'" style="max-width:220px;max-height:65px" alt="Firma"></div>':ready?'<div><button class="button" onclick="otOpenSignature(\''+id+'\',\''+key+'\')">Firmar digitalmente</button></div>':'')+'</div>'
 }).join('')+'</div></details>';
};
window.otOpenSignature=function(id,role){
 const o=db.ots.find(x=>x.id===id);if(!o)return;
 const idx=roles.findIndex(x=>x[0]===role);
 if(idx<0||o.firmas?.[role]||(idx>0&&!o.firmas?.[roles[idx-1][0]])){alert('Debe respetarse el orden de firmas.');return}
 showModal('Firma digital · '+roles[idx][1],'<p>Firma con mouse, dedo o lápiz digital.</p><label class="field">Nombre completo<input id="sign-name" required placeholder="Nombre del firmante"></label><canvas id="sign-pad" width="640" height="190" style="width:100%;height:190px;border:1px solid #a9b8d0;border-radius:8px;touch-action:none;background:white"></canvas><div class="row" style="margin-top:10px"><button class="button" id="sign-clear">Borrar trazo</button><button class="button primary" id="sign-save">Confirmar firma</button></div>');
 const canvas=document.getElementById('sign-pad'),ctx=canvas.getContext('2d');ctx.strokeStyle='#17233b';ctx.lineWidth=2.6;ctx.lineCap='round';let drawing=false,hasStroke=false;
 const point=ev=>{const b=canvas.getBoundingClientRect();return {x:(ev.clientX-b.left)*canvas.width/b.width,y:(ev.clientY-b.top)*canvas.height/b.height}};
 canvas.onpointerdown=ev=>{drawing=true;canvas.setPointerCapture(ev.pointerId);let p=point(ev);ctx.beginPath();ctx.moveTo(p.x,p.y)};
 canvas.onpointermove=ev=>{if(!drawing)return;let p=point(ev);ctx.lineTo(p.x,p.y);ctx.stroke();hasStroke=true};
 canvas.onpointerup=()=>drawing=false;canvas.onpointercancel=()=>drawing=false;
 document.getElementById('sign-clear').onclick=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);hasStroke=false};
 document.getElementById('sign-save').onclick=()=>{const name=document.getElementById('sign-name').value.trim();if(!name||!hasStroke){alert('Indica tu nombre y dibuja la firma.');return}if(!o.firmas)o.firmas={};o.firmas[role]={nombre:name,fecha:new Date().toLocaleString('es-CL'),imagen:canvas.toDataURL('image/png')};try{save()}catch{delete o.firmas[role];alert('No se pudo guardar la firma localmente');return}openOTDetail(id)};
};
})();