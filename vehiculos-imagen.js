// Vehículos: carga de foto en alta calidad razonable para demo local.
(function(){
 const oldOpen=window.openVehicle;
 const htmlEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const photo=v=>v.imagen?'<img src="'+v.imagen+'" alt="Fotografía del vehículo" style="width:240px;max-width:100%;max-height:180px;object-fit:contain;border-radius:10px;border:1px solid #dbe3ee;background:#f8fafc">':'<div class="muted">Vehículo sin fotografía</div>';
 let selectedPhoto='';
 window.newVehicle=function(){
 selectedPhoto='';
 showModal('Nuevo vehículo','<form id="vehicle-photo-form"><div class="grid"><label class="field">Propietario<select name="clienteId" required>'+db.clients.map(c=>'<option value="'+c.id+'">'+htmlEscape(c.nombre)+'</option>').join('')+'</select></label>'+['patente','marca','modelo','anio','km'].map(k=>'<label class="field">'+k.toUpperCase()+'<input required name="'+k+'" '+(['anio','km'].includes(k)?'type="number" min="0"':'type="text"')+'></label>').join('')+'</div><label class="field" style="margin-top:12px">Imagen del vehículo (PNG, JPG o WebP)<input type="file" id="vehicle-photo-input" accept="image/png,image/jpeg,image/webp"></label><div id="vehicle-photo-preview" style="margin:8px 0 18px;padding:12px;border:1px dashed #cbd5e1;border-radius:12px">Sin imagen seleccionada</div><p class="muted">La foto se optimiza y se guarda en esta demostración local. El almacenamiento de imágenes en Supabase se habilitará por separado.</p><button class="button primary" type="submit">Guardar vehículo</button></form>');
 document.getElementById('vehicle-photo-input').onchange=async function(){
  const file=this.files?.[0];if(!file){selectedPhoto='';return}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){alert('Selecciona PNG, JPG o WebP de hasta 5 MB.');this.value='';return}
  const reader=new FileReader();
  reader.onload=()=>{
   const img=new Image();img.onload=()=>{
    const scale=Math.min(1,960/img.width,720/img.height);
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    selectedPhoto=canvas.toDataURL('image/jpeg',.68);
    document.getElementById('vehicle-photo-preview').innerHTML='<img src="'+selectedPhoto+'" alt="Vista previa" style="max-width:100%;max-height:190px;object-fit:contain;border-radius:9px">';
   };img.onerror=()=>alert('No se pudo abrir la imagen');img.src=String(reader.result);
  };reader.readAsDataURL(file);
 };
 document.getElementById('vehicle-photo-form').onsubmit=e=>{
  e.preventDefault();const f=e.currentTarget;
  const v={id:'V'+Date.now(),clienteId:f.elements.clienteId.value,patente:f.elements.patente.value.trim().toUpperCase(),marca:f.elements.marca.value.trim(),modelo:f.elements.modelo.value.trim(),anio:Number(f.elements.anio.value),km:Number(f.elements.km.value),imagen:selectedPhoto};
  if(db.vehicles.some(x=>x.patente?.toUpperCase()===v.patente)){alert('Ya existe un vehículo con esa patente.');return}
  db.vehicles.push(v);try{save()}catch(err){db.vehicles.pop();alert('No hay espacio para guardar la imagen local. Prueba una fotografía más pequeña.');return}
  modal.close();render();
 };
 };
 window.openVehicle=function(id){
  oldOpen(id);
  const v=vehicle(id),el=document.querySelector('#modal-body .summary');
  if(v&&el){const holder=document.createElement('div');holder.style.marginBottom='12px';holder.innerHTML=photo(v);el.prepend(holder)}
 };
})();