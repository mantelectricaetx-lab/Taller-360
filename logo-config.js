(function(){
 const button=document.createElement('button');button.className='button';button.textContent='▧ Logo';
 button.title='Cargar logotipo de la empresa para las OT y cotizaciones';
 const host=document.querySelector('.top .row');if(host)host.insertBefore(button,host.querySelector('.primary'));
 const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.style.display='none';document.body.append(input);
 button.onclick=()=>input.click();
 input.onchange=async()=>{
  const file=input.files?.[0];if(!file)return;
  if(file.size>750000){alert('Usa un logo PNG, JPG o WebP inferior a 750 KB.');return}
  const buffer=await file.arrayBuffer();const bytes=new Uint8Array(buffer);
  const png=bytes.length>8&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
  const jpg=bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const webp=bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  if(!png&&!jpg&&!webp){alert('El archivo no es una imagen PNG, JPG o WebP válida.');return}
  const reader=new FileReader();reader.onload=()=>{db.company.logo=String(reader.result);try{save();alert('Logo actualizado. Se incluirá en las próximas OT impresas.')}catch{alert('No se pudo guardar el logo localmente. Prueba una imagen más pequeña.')}};reader.readAsDataURL(file);
 };
})();