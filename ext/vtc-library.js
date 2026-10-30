/* VICTOTALCOACH V2 · vtc-library.js
   Biblioteca por edades, ficha profesional del ejercicio, filtros, gestor de categorías completo,
   sesiones (suma de duración, duplicar, avisos) y PDF de varias sesiones.
   Las edades son ORIENTATIVAS por defecto; no se inventan recomendaciones científicas. */
(function(){
'use strict';
const ST=()=>(typeof state!=='undefined'?state:null);
const $$=id=>document.getElementById(id);
const nowISO=()=>new Date().toISOString();
const rid=p=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const E=s=>esc(s);
const SP=()=>window.VTC_SPORTS||{};
const sportName=id=>(SP()[id]||SP().handball||{name:'Balonmano'}).name;

/* ===================== RANGOS DE EDAD ===================== */
const DEFAULT_AGES=['Benjamín','Alevín','Infantil','Cadete','Juvenil','Sénior'];
function ages(){const s=ST();if(!Array.isArray(s.vtcAgeRanges))s.vtcAgeRanges=DEFAULT_AGES.map((n,i)=>({id:'age_'+(i+1),name:n,min:null,max:null,active:true}));return s.vtcAgeRanges}
const ageName=id=>{const a=ages().find(x=>x.id===id);return a?a.name:''};
function ageRows(list){
  return list.map(a=>'<div class="vtc-row" data-id="'+E(a.id)+'"><input type="text" class="an" value="'+E(a.name)+'" placeholder="Nombre">'+
   '<input type="number" class="amin" value="'+(a.min??'')+'" placeholder="Edad mín." style="width:100px" min="0"><input type="number" class="amax" value="'+(a.max??'')+'" placeholder="Edad máx." style="width:100px" min="0">'+
   '<label><input type="checkbox" class="aon" '+(a.active!==false?'checked':'')+'> activo</label>'+
   '<button type="button" class="danger" onclick="vtcAgeDel(\''+E(a.id)+'\')">Eliminar</button></div>').join('');
}
function readAgeRows(){return [...document.querySelectorAll('#vtcAgeList .vtc-row')].map(r=>({id:r.dataset.id,name:r.querySelector('.an').value.trim()||'Sin nombre',min:r.querySelector('.amin').value===''?null:Number(r.querySelector('.amin').value),max:r.querySelector('.amax').value===''?null:Number(r.querySelector('.amax').value),active:r.querySelector('.aon').checked}))}
function openAges(list){
  const L=list||ages();
  openModal('<h2>🎂 Rangos de edad</h2><p class="muted">Crea, renombra y ajusta los rangos. Los límites son opcionales y los defines tú: la aplicación no impone edades. Un ejercicio asociado a un rango es una <b>recomendación orientativa</b>, nunca una prohibición.</p><div id="vtcAgeList">'+ageRows(L)+'</div>'+
    '<div class="form-actions"><button type="button" class="secondary" onclick="vtcAgeAdd()">+ Añadir rango</button><button type="button" class="secondary" onclick="closeModal()">Cancelar</button><button type="button" class="primary" onclick="vtcAgeSave()">Guardar rangos</button></div>');
}
window.vtcOpenAges=()=>openAges();
window.vtcAgeAdd=()=>{const l=readAgeRows();l.push({id:rid('age'),name:'Nuevo rango',min:null,max:null,active:true});openAges(l)};
window.vtcAgeDel=id=>{
  const l=readAgeRows(),s=ST(),nEx=s.exercises.filter(e=>(e.ageRangeIds||[]).includes(id)).length,nT=s.teams.filter(t=>t.ageRangeId===id).length;
  if((nEx||nT)&&!confirm('Este rango se usa en '+nEx+' ejercicio(s) y '+nT+' equipo(s). Se quitará esa asociación (los ejercicios y equipos NO se borran).\n\n¿Eliminar el rango?'))return;
  s.exercises.forEach(e=>{if(e.ageRangeIds)e.ageRangeIds=e.ageRangeIds.filter(x=>x!==id)});s.teams.forEach(t=>{if(t.ageRangeId===id)delete t.ageRangeId});
  s.vtcAgeRanges=l.filter(x=>x.id!==id);save();openAges(s.vtcAgeRanges);renderExercises();
};
window.vtcAgeSave=()=>{const s=ST();s.vtcAgeRanges=readAgeRows();save();closeModal();renderExercises();vtcToast('Rangos de edad guardados.')};

/* ===================== FICHA PROFESIONAL DEL EJERCICIO ===================== */
const DIFF=['','Básico','Medio','Avanzado'],CONT=['','Técnico','Táctico','Físico','Coordinativo','Mixto'];
function metaHTML(e){
  e=e||{};const my=new Set(e.ageRangeIds||[]);
  const ta=(id,l,v)=>'<label>'+l+'</label><textarea id="'+id+'" rows="2">'+E(v||'')+'</textarea>';
  const sel=(id,l,opts,v)=>'<label>'+l+'</label><select id="'+id+'">'+opts.map(o=>'<option value="'+E(o)+'" '+(o===(v||'')?'selected':'')+'>'+(o||'— sin indicar —')+'</option>').join('')+'</select>';
  return '<details class="vtc-box" id="vtcMeta" open><summary>📋 Ficha profesional (opcional)</summary>'+
   '<label>Edades recomendadas <span class="muted">(orientativo)</span></label><div class="vtc-row">'+ages().filter(a=>a.active!==false||my.has(a.id)).map(a=>'<label style="font-weight:600"><input type="checkbox" class="vtc-age" value="'+E(a.id)+'" '+(my.has(a.id)?'checked':'')+'> '+E(a.name)+(a.min!=null||a.max!=null?' ('+(a.min??'')+'–'+(a.max??'')+')':'')+'</label>').join('')+'</div>'+
   '<label style="font-weight:600"><input type="checkbox" id="vtcAgeStrict" '+(e.ageStrict?'checked':'')+'> Tratar estas edades como restricción (avisará con más énfasis fuera de ellas)</label>'+
   sel('vtcDiff','Nivel de dificultad',DIFF,e.difficulty)+sel('vtcContent','Tipo de contenido',CONT,e.contentType)+
   ta('vtcSecGoals','Objetivos secundarios',e.secondaryGoals)+ta('vtcSpace','Espacio y material necesarios',e.spaceMaterial)+
   ta('vtcProg','Progresiones',e.progressions)+ta('vtcAdapt','Adaptaciones por nivel',e.adaptations)+
   ta('vtcErrors','Errores frecuentes',e.commonErrors)+ta('vtcCoach','Indicaciones del entrenador',e.coachNotes)+
   '<label>Etiquetas libres (separadas por comas)</label><input type="text" id="vtcTags" value="'+E((e.tags||[]).join(', '))+'">'+
   '<label>Autor</label><input type="text" id="vtcAuthor" value="'+E(e.authorName||'')+'">'+
   (e.createdAt?'<p class="muted">Creado: '+E(String(e.createdAt).slice(0,10))+(e.updatedAt?' · Última modificación: '+E(String(e.updatedAt).slice(0,10)):'')+'</p>':'')+
   '</details>';
}
function readMeta(){
  if(!$$('vtcMeta'))return null;
  const v=id=>($$(id)?$$(id).value.trim():'');
  const o={ageRangeIds:[...document.querySelectorAll('#vtcMeta .vtc-age:checked')].map(x=>x.value),ageStrict:!!($$('vtcAgeStrict')&&$$('vtcAgeStrict').checked),
    difficulty:v('vtcDiff'),contentType:v('vtcContent'),secondaryGoals:v('vtcSecGoals'),spaceMaterial:v('vtcSpace'),progressions:v('vtcProg'),adaptations:v('vtcAdapt'),
    commonErrors:v('vtcErrors'),coachNotes:v('vtcCoach'),tags:v('vtcTags').split(',').map(x=>x.trim()).filter(Boolean),authorName:v('vtcAuthor')};
  if($$('vtcExSport'))o.sport=$$('vtcExSport').value;
  return o;
}
const _oe=window.openExercise;
window.openExercise=async function(id){
  const r=await _oe.apply(this,arguments);
  try{
    const s=ST(),e=id?s.exercises.find(x=>x.id===id):null,box=$$('modalBox');if(!box||$$('vtcMeta'))return r;
    let anchor=null;box.querySelectorAll('label').forEach(l=>{if(!anchor&&/Pizarra t.ctica/i.test(l.textContent))anchor=l});
    const w=document.createElement('div');w.innerHTML=metaHTML(e);
    if(!e&&!w.querySelector('#vtcAuthor').value){try{w.querySelector('#vtcAuthor').value=JSON.parse(localStorage.getItem('hc_club_header_v1')||'{}').coach||''}catch(x){}}
    if(anchor)anchor.before(w.firstChild);else box.querySelector('form,div')&&box.appendChild(w.firstChild);
    const dis=s.vtcCatDisabled||{},sel=$$('exCategory');
    if(sel)[...sel.options].forEach(o=>{if(dis[o.value]&&o.value!==sel.value)o.remove()});
  }catch(x){console.error('Ficha del ejercicio:',x)}
  return r;
};
async function boardBlob(e){
  const c=$$('tacticalCanvas');if(!c||window._exerciseBoardBlob)return;
  const objs=JSON.stringify(tacticalObjects||[]);
  const changed=!e||objs!==JSON.stringify(e.boardObjects||[])||(e.boardCourt||'full')!==tacticalCourt||(window.VTC&&(e.sport||'handball')!==VTC.boardSport());
  if(!changed||(!tacticalObjects.length&&!(e&&e.boardKey)))return;
  tacticalSelected=null;tBg(tacticalCourt);await new Promise(r=>setTimeout(r,60));
  await new Promise(res=>c.toBlob(b=>{if(b)window._exerciseBoardBlob=b;res()},'image/png'));
}
const _se=window.saveExercise;
window.saveExercise=async function(id){
  const s=ST(),meta=readMeta(),prev=id?s.exercises.find(x=>x.id===id):null;
  try{await boardBlob(prev)}catch(x){console.warn('Pizarra automática:',x)}
  const before=new Set(s.exercises.map(x=>x.id));
  const r=await _se.apply(this,arguments);
  if(!meta||$$('modal').classList.contains('open'))return r;
  const e=id?s.exercises.find(x=>x.id===id):s.exercises.find(x=>!before.has(x.id));
  if(e){Object.assign(e,meta);if(!e.createdAt)e.createdAt=nowISO();e.updatedAt=nowISO();save();
    const sp=e.sport||'handball',f=window.vtcEF;
    if(f.sport!=='all'&&sp!==(f.sport==='auto'?VTC.activeSport():f.sport)){f.sport=sp;const sel=$$('vtcFSport');if(sel)sel.value=sp;vtcToast('Ejercicio guardado. Mostrando la biblioteca de '+sportName(sp)+'.',3500)}
    renderExercises()}
  return r;
};

/* ===================== FILTROS DE LA BIBLIOTECA ===================== */
window.vtcEF=window.vtcEF||{sport:'auto',age:'',diff:'',content:''};
function passFilter(e){
  const f=window.vtcEF,s=ST();
  const sp=f.sport==='auto'?VTC.activeSport():f.sport;
  if(sp!=='all'&&(e.sport||'handball')!==sp)return false;
  if(f.age==='__team'){const t=s.teams.find(x=>x.id===s.selectedTeam);if(t&&t.ageRangeId&&!(e.ageRangeIds||[]).includes(t.ageRangeId))return false}
  else if(f.age&&!(e.ageRangeIds||[]).includes(f.age))return false;
  if(f.diff&&e.difficulty!==f.diff)return false;
  if(f.content&&e.contentType!==f.content)return false;
  return true;
}
function filterBar(){
  const f=window.vtcEF,sps=Object.values(SP());
  const opt=(v,t,cur)=>'<option value="'+E(v)+'" '+(cur===v?'selected':'')+'>'+E(t)+'</option>';
  return '<div class="vtc-filters" id="vtcFilters">'+
   '<select id="vtcFSport" title="Deporte">'+opt('auto','Deporte del equipo activo',f.sport)+opt('all','Todos los deportes',f.sport)+sps.map(s=>opt(s.id,s.icon+' '+s.name,f.sport)).join('')+'</select>'+
   '<select id="vtcFAge" title="Edad">'+opt('','Todas las edades',f.age)+opt('__team','Ajustados al equipo activo',f.age)+ages().map(a=>opt(a.id,a.name,f.age)).join('')+'</select>'+
   '<select id="vtcFDiff" title="Dificultad">'+opt('','Cualquier dificultad',f.diff)+DIFF.filter(Boolean).map(d=>opt(d,d,f.diff)).join('')+'</select>'+
   '<select id="vtcFContent" title="Contenido">'+opt('','Cualquier contenido',f.content)+CONT.filter(Boolean).map(d=>opt(d,d,f.content)).join('')+'</select>'+
   '<span class="muted" id="vtcFCount"></span></div>';
}
const _re=window.renderExercises;
window.renderExercises=function(){
  const s=ST(),full=s.exercises,shown=full.filter(passFilter);let r;
  s.exercises=shown;try{r=_re.apply(this,arguments)}finally{s.exercises=full}
  const c=$$('vtcFCount');if(c)c.textContent='Mostrando '+shown.length+' de '+full.length+' ejercicios';
  const dis=s.vtcCatDisabled||{};
  document.querySelectorAll('#exerciseList summary, #exerciseList .group-title').forEach(el=>{
    const nm=Object.keys(dis).find(k=>dis[k]&&el.textContent.replace(/^[▶▼\s]+/,'').startsWith(k));
    if(nm&&!el.dataset.vtcInact){el.dataset.vtcInact='1';el.classList.add('vtc-inactive');el.insertAdjacentHTML('beforeend',' <span class="vtc-warn">inactiva</span>')}
  });
  return r;
};
new MutationObserver(()=>{
  const list=$$('exerciseList');if(!list||$$('vtcFilters'))return;
  list.insertAdjacentHTML('beforebegin',filterBar());
  ['vtcFSport:sport','vtcFAge:age','vtcFDiff:diff','vtcFContent:content'].forEach(p=>{const a=p.split(':');$$(a[0]).onchange=ev=>{window.vtcEF[a[1]]=ev.target.value;renderExercises()}});
  const b=[...document.querySelectorAll('#exercises button')].find(x=>/Gestionar categor/.test(x.textContent));
  if(b&&!$$('vtcAgeBtn'))b.insertAdjacentHTML('afterend','<button class="secondary" id="vtcAgeBtn" onclick="vtcOpenAges()">🎂 Rangos de edad</button>');
  renderExercises();
}).observe(document.body,{childList:true,subtree:true});

/* ===================== EQUIPO: RANGO DE EDAD ===================== */
const _ot=window.openTeam;
window.openTeam=function(id){
  _ot.apply(this,arguments);
  const t=id&&ST().teams.find(x=>x.id===id),host=$$('teamSport')||$$('teamSex');
  if(host&&!$$('teamAge')){const w=document.createElement('div');
    w.innerHTML='<label>Rango de edad del equipo</label><select id="teamAge"><option value="">— sin indicar —</option>'+ages().filter(a=>a.active!==false).map(a=>'<option value="'+E(a.id)+'">'+E(a.name)+'</option>').join('')+'</select>';
    (host.parentElement&&host.parentElement.tagName==='DIV'&&host.parentElement.id!=='modalBox'?host.parentElement:host).after(w);
    w.querySelector('select').value=(t&&t.ageRangeId)||'';}
};
const _st=window.saveTeam;
window.saveTeam=function(id){
  const v=$$('teamAge')?$$('teamAge').value:null;
  window._vtcPendingAge={id:id||null,age:v,before:new Set(ST().teams.map(t=>t.id))};
  return _st.apply(this,arguments);
};
const _sv=window.save;
window.save=function(){
  const p=window._vtcPendingAge;
  if(p&&p.age!==null){const s=ST(),t=p.id?s.teams.find(x=>x.id===p.id):s.teams.find(x=>!p.before.has(x.id));
    if(t){if(p.age)t.ageRangeId=p.age;else delete t.ageRangeId;window._vtcPendingAge=null}}
  return _sv.apply(this,arguments);
};

/* ===================== GESTOR DE CATEGORÍAS COMPLETO ===================== */
const PROT={ 'Otros':'no se puede renombrar ni eliminar','SISTEMA DE JUEGO':'se gestiona desde Sistema de juego' };
function assocs(e){return exerciseAssociations(e)}
function useCount(cat,sub){return ST().exercises.filter(e=>assocs(e).some(a=>a.category===cat&&(sub==null||a.subcategory===sub))).length}
function writeAssocs(e,list){
  const seen=new Set(),out=[];list.forEach(a=>{const k=a.category+'||'+a.subcategory;if(!seen.has(k)){seen.add(k);out.push({category:a.category,subcategory:a.subcategory})}});
  if(!out.length)out.push({category:'Otros',subcategory:'General'});
  e.categories=out;e.category=out[0].category;e.subcategory=out[0].subcategory;
}
function remap(fn){ST().exercises.forEach(e=>{writeAssocs(e,assocs(e).map(fn).filter(Boolean))})}
function afterCat(){save();renderExercises();openCatManager()}
function openCatManager(){
  ensureExerciseCategories();const s=ST(),dis=s.vtcCatDisabled=s.vtcCatDisabled||{},ord=s.exerciseCategoryOrder;
  const rows=ord.map((c,i)=>{
    const prot=PROT[c],subs=s.exerciseCategories[c]||[];
    return '<div class="vtc-box'+(dis[c]?' vtc-inactive':'')+'"><div class="vtc-row"><b style="flex:1">'+E(c)+'</b><span class="muted">'+useCount(c)+' ejercicio(s)</span>'+(dis[c]?'<span class="vtc-warn">inactiva</span>':'')+'</div>'+
     '<div class="vtc-row"><button type="button" class="secondary" onclick="vtcCatMove('+i+',-1)" '+(i===0?'disabled':'')+'>↑</button><button type="button" class="secondary" onclick="vtcCatMove('+i+',1)" '+(i===ord.length-1?'disabled':'')+'>↓</button>'+
     (prot&&c!=='Otros'?'':'')+
     '<button type="button" class="secondary" onclick="vtcCatRename('+i+')" '+(prot?'disabled title="'+E(prot)+'"':'')+'>Renombrar</button>'+
     '<button type="button" class="secondary" onclick="vtcCatToggle('+i+')">'+(dis[c]?'Activar':'Desactivar')+'</button>'+
     '<button type="button" class="danger" onclick="vtcCatDelete('+i+')" '+(prot?'disabled title="'+E(prot)+'"':'')+'>Eliminar</button></div>'+
     '<details><summary>Subcategorías ('+subs.length+')</summary>'+subs.map((sb,j)=>'<div class="vtc-row"><span style="flex:1">'+E(sb)+' <span class="muted">('+useCount(c,sb)+')</span></span>'+
       (c==='SISTEMA DE JUEGO'?'':'<button type="button" class="secondary" onclick="vtcSubMove('+i+','+j+',-1)" '+(j===0?'disabled':'')+'>↑</button><button type="button" class="secondary" onclick="vtcSubMove('+i+','+j+',1)" '+(j===subs.length-1?'disabled':'')+'>↓</button><button type="button" class="secondary" onclick="vtcSubRename('+i+','+j+')">Renombrar</button><button type="button" class="danger" onclick="vtcSubDelete('+i+','+j+')">Eliminar</button>')+'</div>').join('')+
     (c==='SISTEMA DE JUEGO'?'':'<div class="vtc-row"><button type="button" class="secondary" onclick="vtcSubAdd('+i+')">+ Subcategoría</button></div>')+'</details></div>';
  }).join('');
  openModal('<h2>⚙️ Gestionar categorías</h2><p class="muted">Puedes crear, renombrar, reordenar, desactivar y eliminar. Antes de eliminar una categoría en uso se te pedirá a dónde reasignar sus ejercicios. «Desactivar» la oculta al crear ejercicios nuevos pero conserva los existentes.</p>'+rows+
   '<div class="form-actions"><button type="button" class="secondary" onclick="vtcCatAdd()">+ Nueva categoría</button><button type="button" class="primary" onclick="closeModal()">Cerrar</button></div>');
}
window.openExerciseCategoryManager=openCatManager;
const cname=i=>ST().exerciseCategoryOrder[i];
window.vtcCatMove=(i,d)=>{const o=ST().exerciseCategoryOrder,j=i+d;if(j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];afterCat()};
window.vtcCatToggle=i=>{const s=ST(),c=cname(i);s.vtcCatDisabled=s.vtcCatDisabled||{};if(s.vtcCatDisabled[c])delete s.vtcCatDisabled[c];else s.vtcCatDisabled[c]=true;afterCat()};
window.vtcCatAdd=()=>{
  const n=(prompt('Nombre de la nueva categoría:')||'').trim();if(!n)return;const s=ST();
  if(s.exerciseCategories[n])return alert('Ya existe una categoría con ese nombre.');
  s.exerciseCategories[n]=['General'];s.exerciseCategoryOrder.push(n);afterCat();
};
window.vtcCatRename=i=>{
  const s=ST(),old=cname(i),n=(prompt('Nuevo nombre para «'+old+'»:',old)||'').trim();if(!n||n===old)return;
  if(s.exerciseCategories[n])return alert('Ya existe una categoría con ese nombre.');
  const rebuilt={};Object.keys(s.exerciseCategories).forEach(k=>{rebuilt[k===old?n:k]=s.exerciseCategories[k]});s.exerciseCategories=rebuilt;
  s.exerciseCategoryOrder[i]=n;if(s.vtcCatDisabled&&s.vtcCatDisabled[old]){delete s.vtcCatDisabled[old];s.vtcCatDisabled[n]=true}
  remap(a=>a.category===old?{category:n,subcategory:a.subcategory}:a);afterCat();
};
function reassignDialog(title,targets,cb){
  /* targets: [{cat,sub}] */
  openModal('<h2>'+title+'</h2><p>Hay ejercicios asociados. Elige a dónde reasignarlos antes de eliminar (no se borra ningún ejercicio):</p>'+
   '<select id="vtcTarget" style="width:100%;padding:9px">'+targets.map((t,k)=>'<option value="'+k+'">'+E(t.cat)+' › '+E(t.sub)+'</option>').join('')+'</select>'+
   '<div class="form-actions"><button type="button" class="secondary" onclick="vtcCatBack()">Cancelar</button><button type="button" class="danger" id="vtcDoReassign">Reasignar y eliminar</button></div>');
  $$('vtcDoReassign').onclick=()=>cb(targets[Number($$('vtcTarget').value)]);
}
window.vtcCatBack=()=>openCatManager();
function targetsExcept(cat){const s=ST(),o=[];s.exerciseCategoryOrder.forEach(c=>{if(c===cat)return;(s.exerciseCategories[c]||['General']).forEach(sb=>o.push({cat:c,sub:sb}))});return o.sort((a,b)=>(a.cat==='Otros'?-1:0)-(b.cat==='Otros'?-1:0))}
window.vtcCatDelete=i=>{
  const s=ST(),c=cname(i),n=useCount(c);
  const finish=t=>{if(t)remap(a=>a.category===c?{category:t.cat,subcategory:t.sub}:a);delete s.exerciseCategories[c];s.exerciseCategoryOrder=s.exerciseCategoryOrder.filter(x=>x!==c);if(s.vtcCatDisabled)delete s.vtcCatDisabled[c];afterCat()};
  if(!n){if(confirm('¿Eliminar la categoría «'+c+'»? No tiene ejercicios asociados.'))finish(null);return}
  reassignDialog('Eliminar «'+E(c)+'» ('+n+' ejercicios)',targetsExcept(c),finish);
};
window.deleteExerciseCategory=cat=>{const i=ST().exerciseCategoryOrder.indexOf(cat);if(i>=0)vtcCatDelete(i)};
window.vtcSubMove=(i,j,d)=>{const s=ST(),a=s.exerciseCategories[cname(i)],k=j+d;if(k<0||k>=a.length)return;[a[j],a[k]]=[a[k],a[j]];afterCat()};
window.vtcSubAdd=i=>{const n=(prompt('Nombre de la subcategoría:')||'').trim();if(!n)return;const a=ST().exerciseCategories[cname(i)];if(a.includes(n))return alert('Ya existe.');a.push(n);afterCat()};
window.vtcSubRename=(i,j)=>{
  const c=cname(i),a=ST().exerciseCategories[c],old=a[j],n=(prompt('Nuevo nombre para «'+old+'»:',old)||'').trim();if(!n||n===old)return;
  if(a.includes(n))return alert('Ya existe.');a[j]=n;remap(x=>(x.category===c&&x.subcategory===old)?{category:c,subcategory:n}:x);afterCat();
};
window.vtcSubDelete=(i,j)=>{
  const s=ST(),c=cname(i),a=s.exerciseCategories[c],sb=a[j],n=useCount(c,sb);
  if(a.length<=1)return alert('Una categoría necesita al menos una subcategoría.');
  const finish=t=>{if(t)remap(x=>(x.category===c&&x.subcategory===sb)?{category:t.cat,subcategory:t.sub}:x);a.splice(j,1);afterCat()};
  if(!n){if(confirm('¿Eliminar la subcategoría «'+sb+'»?'))finish(null);return}
  const t=[];s.exerciseCategoryOrder.forEach(cc=>(s.exerciseCategories[cc]||[]).forEach(ss=>{if(!(cc===c&&ss===sb))t.push({cat:cc,sub:ss})}));
  reassignDialog('Eliminar «'+E(sb)+'» ('+n+' ejercicios)',t,finish);
};

/* ===================== SESIONES: SUMA, DUPLICAR, AVISOS ===================== */
function sumMinutes(p){return (p.exercises||[]).reduce((t,x)=>{const e=ST().exercises.find(z=>z.id===x.exerciseId);const d=Number(x.duration||e&&e.duration||0);return t+(isFinite(d)?d:0)},0)}
const _rsd=window.renderSessionDetail;
window.renderSessionDetail=function(micro){
  const r=_rsd.apply(this,arguments);
  try{
    const el=$$('sessionDetail'),p=micro&&micro.sessions.find(x=>x.id===ST().selectedSession);if(!el||!p)return r;
    const sum=sumMinutes(p),n=(p.exercises||[]).length,m=el.querySelector('.muted');
    if(m&&!m.dataset.vtc){m.dataset.vtc='1';
      m.insertAdjacentHTML('beforeend',' · <b>Suma de ejercicios: '+sum+' min</b> ('+n+')'+((Number(p.duration)||0)!==sum&&n?' <button type="button" class="secondary" style="padding:2px 8px" onclick="vtcUseSum(\''+p.id+'\')">Usar '+sum+' min como duración</button>':''));}
    const tb=el.querySelector('.toolbar');
    if(tb&&!tb.querySelector('.vtc-dup'))tb.insertAdjacentHTML('beforeend','<button type="button" class="secondary vtc-dup" onclick="vtcDuplicateSession(\''+p.id+'\')">⧉ Duplicar sesión</button>');
  }catch(x){console.error('Detalle de sesión:',x)}
  return r;
};
function curMicro(){const s=ST(),se=s.seasons.find(x=>x.id===s.selectedSeason);return se&&se.micros.find(x=>x.id===s.selectedMicro)}
window.vtcUseSum=id=>{const m=curMicro(),p=m&&m.sessions.find(x=>x.id===id);if(!p)return;p.duration=String(sumMinutes(p));save();renderSessionDetail(m);vtcToast('Duración de la sesión actualizada a '+p.duration+' min.')};
window.vtcDuplicateSession=id=>{
  const s=ST(),m=curMicro(),p=m&&m.sessions.find(x=>x.id===id);if(!p)return;
  const c=JSON.parse(JSON.stringify(p));c.id=rid('ses');c.number=String(Math.max(0,...m.sessions.map(x=>Number(x.number)||0))+1);
  c.attendance={};c.wellness={};c.rpe={};c.cmj={};c.goal=(p.goal||'')+(p.goal?' (copia)':'');
  (c.exercises||[]).forEach(x=>{x.id=rid('sx')});
  m.sessions.push(c);s.selectedSession=c.id;save();
  if(typeof renderPlanning==='function')try{renderPlanning()}catch(e){}
  try{renderSessionDetail(m)}catch(e){}
  vtcToast('Sesión duplicada como nº '+c.number+'. Los datos de asistencia, wellness y RPE no se copian.');
  setTimeout(()=>{const b=document.querySelector('[onclick*="selectSession(\''+c.id+'\')"]');if(b&&b.click){}},0);
};
/* Avisos en el selector de ejercicios */
const _rep=window.renderExercisePicker;
window.renderExercisePicker=function(){
  const r=_rep.apply(this,arguments);
  try{
    const s=ST(),p=getSelectedSession(),t=p&&s.teams.find(x=>x.id===p.teamId),tsp=window.VTC?VTC.teamSport(t):'handball';
    document.querySelectorAll('#exercisePicker .session-ex-row').forEach(row=>{
      if(row.dataset.vtc)return;row.dataset.vtc='1';
      const b=row.querySelector('button[onclick*="addExerciseToSession"]');const mm=b&&b.getAttribute('onclick').match(/addExerciseToSession\('([^']+)'/);
      const e=mm&&s.exercises.find(x=>x.id===mm[1]);if(!e)return;const info=row.querySelector('.session-ex-info'),w=[];
      if((e.sport||'handball')!==tsp)w.push('Deporte distinto: '+sportName(e.sport||'handball'));
      if(t&&t.ageRangeId&&(e.ageRangeIds||[]).length&&!e.ageRangeIds.includes(t.ageRangeId))w.push((e.ageStrict?'Fuera de las edades indicadas':'Fuera del rango de edad recomendado')+' ('+(e.ageRangeIds.map(ageName).join(', '))+')');
      if(info&&w.length)info.insertAdjacentHTML('beforeend',w.map(x=>'<span class="vtc-warn">⚠ '+E(x)+'</span>').join('')+'<span class="muted" style="font-size:12px"> Puedes usarlo igualmente.</span>');
    });
  }catch(x){console.error('Avisos del selector:',x)}
  return r;
};

/* ===================== PDF DE UNA O VARIAS SESIONES ===================== */
window.vtcPdfOpts=window.vtcPdfOpts||{img:true,board:true,notes:true,detail:true,meta:true};
function allSessions(){
  const out=[];ST().seasons.forEach(se=>(se.micros||[]).forEach(mi=>(mi.sessions||[]).forEach(z=>out.push({z,mi,se}))));
  return out.sort((a,b)=>String(a.z.date||'').localeCompare(String(b.z.date||''))||(Number(a.z.number)||0)-(Number(b.z.number)||0));
}
function pdfList(sel){
  const s=ST(),f=window.vtcPdfF||{team:s.selectedTeam||'',from:'',to:''};window.vtcPdfF=f;
  const rows=allSessions().filter(x=>(!f.team||x.z.teamId===f.team)&&(!f.from||(x.z.date||'')>=f.from)&&(!f.to||(x.z.date||'')<=f.to));
  return {rows,html:rows.map(x=>{const t=s.teams.find(y=>y.id===x.z.teamId);return '<label class="vtc-row" style="font-weight:500"><input type="checkbox" class="vtc-pdf-s" value="'+E(x.z.id)+'" '+(sel.has(x.z.id)?'checked':'')+'> <span><b>Sesión '+E(x.z.number||'')+'</b> · '+E(x.z.date||'sin fecha')+' · '+E(t?t.name:'sin equipo')+' · '+E(x.mi.name||'')+' — '+E(x.z.goal||'sin objetivo')+'</span></label>'}).join('')||'<p class="muted">No hay sesiones con esos filtros.</p>'};
}
function openPdfDialog(pre){
  const s=ST(),f=window.vtcPdfF=window.vtcPdfF||{team:s.selectedTeam||'',from:'',to:''},sel=new Set(pre||[]),o=window.vtcPdfOpts,L=pdfList(sel);
  const ck=(k,l)=>'<label style="font-weight:600"><input type="checkbox" id="vtcO_'+k+'" '+(o[k]?'checked':'')+'> '+l+'</label>';
  openModal('<h2>📄 Exportar sesiones a PDF</h2>'+
   '<div class="vtc-row"><select id="vtcPdfTeam"><option value="">Todos los equipos</option>'+s.teams.map(t=>'<option value="'+E(t.id)+'" '+(f.team===t.id?'selected':'')+'>'+E(t.name)+'</option>').join('')+'</select>'+
   '<label>Desde <input type="date" id="vtcPdfFrom" value="'+E(f.from)+'"></label><label>Hasta <input type="date" id="vtcPdfTo" value="'+E(f.to)+'"></label>'+
   '<button type="button" class="secondary" id="vtcPdfApply">Filtrar</button><button type="button" class="secondary" id="vtcPdfAll">Marcar todas las visibles</button><button type="button" class="secondary" id="vtcPdfNone">Quitar marcas</button></div>'+
   '<div id="vtcPdfList" style="max-height:34vh;overflow:auto;border:1px solid #d6dde6;border-radius:10px;padding:8px">'+L.html+'</div>'+
   '<div class="vtc-box"><b>Contenido del documento</b><div class="vtc-row">'+ck('img','Imágenes de los ejercicios')+ck('board','Pizarras')+ck('detail','Detalle del ejercicio')+ck('meta','Ficha profesional (edad, dificultad…)')+ck('notes','Observaciones')+'</div></div>'+
   '<div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Cancelar</button><button type="button" class="primary" id="vtcPdfGo">Generar vista previa</button></div>');
  const keep=()=>{const set=new Set([...document.querySelectorAll('.vtc-pdf-s:checked')].map(x=>x.value));return set};
  const readF=()=>{window.vtcPdfF={team:$$('vtcPdfTeam').value,from:$$('vtcPdfFrom').value,to:$$('vtcPdfTo').value}};
  const readO=()=>{['img','board','detail','meta','notes'].forEach(k=>{window.vtcPdfOpts[k]=$$('vtcO_'+k).checked})};
  $$('vtcPdfApply').onclick=()=>{const k=keep();readF();readO();openPdfDialog([...k])};
  $$('vtcPdfAll').onclick=()=>document.querySelectorAll('.vtc-pdf-s').forEach(x=>x.checked=true);
  $$('vtcPdfNone').onclick=()=>document.querySelectorAll('.vtc-pdf-s').forEach(x=>x.checked=false);
  $$('vtcPdfGo').onclick=()=>{const ids=[...keep()];readO();if(!ids.length)return alert('Marca al menos una sesión.');buildPdf(ids)};
}
window.vtcOpenPdfDialog=pre=>openPdfDialog(pre);
window.printSelectedSessionPDF=id=>openPdfDialog([id]);
async function exBlock(x,idx,o){
  const s=ST(),e=s.exercises.find(z=>z.id===x.exerciseId);if(!e)return '';
  let img='',board='';
  if(o.img&&e.imageKey){const u=await mediaURL(e.imageKey);if(u)img='<img class="pdf-media-img" src="'+u+'">'}
  if(o.board&&e.boardKey){const u=await mediaURL(e.boardKey);if(u)board='<img class="pdf-media-img pdf-half-fill" src="'+u+'">'}
  const bc=e.boardCourt==='halfTop'?' pdf-board-half pdf-board-half-top':(e.boardCourt==='halfBottom'?' pdf-board-half pdf-board-half-bottom':'');
  const visual=board?'<div class="pdf-visual'+bc+'"><div class="pdf-visual-title">Pizarra</div>'+board+'</div>':img?'<div class="pdf-visual">'+img.replace('pdf-media-img','pdf-media-img')+'</div>':(o.img||o.board?'<div class="pdf-visual pdf-no-image">Sin imagen</div>':'');
  const p=(l,v)=>v?'<p><b>'+l+':</b> '+E(v)+'</p>':'';
  let d='';
  if(o.detail)d=p('Objetivo',e.goal)+p('Organización',e.organization)+p('Participantes',e.players)+p('Descripción',e.description)+(x.variant?p('Variante',x.variant):p('Variantes',e.variants))+p('Puntos clave',e.points)+p('Notas de la sesión',x.notes);
  else d=p('Objetivo',e.goal);
  let m='';
  if(o.meta)m=(((e.ageRangeIds||[]).length)?'<div class="pdf-meta"><b>Edades:</b> '+E(e.ageRangeIds.map(ageName).filter(Boolean).join(', '))+(e.difficulty?' · <b>Dificultad:</b> '+E(e.difficulty):'')+(e.contentType?' · <b>Contenido:</b> '+E(e.contentType):'')+'</div>':(e.difficulty||e.contentType?'<div class="pdf-meta">'+(e.difficulty?'<b>Dificultad:</b> '+E(e.difficulty):'')+(e.contentType?' · <b>Contenido:</b> '+E(e.contentType):'')+'</div>':''))+
    p('Espacio y material',e.spaceMaterial)+p('Progresiones',e.progressions)+p('Adaptaciones',e.adaptations)+p('Errores frecuentes',e.commonErrors)+p('Indicaciones del entrenador',e.coachNotes);
  return '<div class="pdf-ex"><div class="pdf-ex-info"><h3>'+idx+'. '+E(e.name)+'</h3><div class="pdf-meta"><b>Categoría:</b> '+E(e.category||'Otros')+' · <b>Subcategoría:</b> '+E(e.subcategory||'General')+' · <b>Deporte:</b> '+E(sportName(e.sport||'handball'))+'</div>'+
    '<div class="pdf-data"><b>Duración:</b> '+E(x.duration||e.duration||'—')+' min'+(x.sets?' · <b>Series:</b> '+E(x.sets):'')+(x.reps?' · <b>Repeticiones:</b> '+E(x.reps):'')+'</div>'+d+m+'</div>'+visual+'</div>';
}
async function buildPdf(ids){
  const s=ST(),o=window.vtcPdfOpts,club=JSON.parse(localStorage.getItem('hc_club_header_v1')||'{}'),map=new Map(allSessions().map(x=>[x.z.id,x]));
  const sel=ids.map(i=>map.get(i)).filter(Boolean).sort((a,b)=>String(a.z.date||'').localeCompare(String(b.z.date||''))||(Number(a.z.number)||0)-(Number(b.z.number)||0));
  const blocks=[];
  for(let k=0;k<sel.length;k++){
    const {z,mi}=sel[k],t=s.teams.find(y=>y.id===z.teamId),sp=window.VTC?VTC.teamSport(t):'handball',rows=[];
    for(const x of (z.exercises||[])){const h=await exBlock(x,rows.length+1,o);if(h)rows.push(h)}
    const sum=sumMinutes(z);
    blocks.push('<div class="pdf-session-block" style="'+(k?'page-break-before:always;break-before:page;':'')+'">'+
      '<div class="pdf-session-head"><h2>SESIÓN '+E(z.number||'')+'</h2><div class="pdf-session-grid">'+
      '<div><b>Fecha</b><span>'+E(z.date||'')+'</span></div><div><b>Equipo</b><span>'+E(t?t.name:'')+' · '+E(sportName(sp))+(t&&t.ageRangeId?' · '+E(ageName(t.ageRangeId)):'')+'</span></div>'+
      '<div><b>Microciclo</b><span>'+E(mi.name||'')+'</span></div><div><b>Duración</b><span>'+E(z.duration||'—')+' min'+(rows.length?' (suma de ejercicios: '+sum+' min)':'')+'</span></div>'+
      '<div><b>Objetivo</b><span>'+E(z.goal||'Sin objetivo')+'</span></div></div></div>'+
      '<div class="pdf-session-content"><div><b>Calentamiento:</b> '+E((z.warmup&&z.warmup.content)||'Sin contenido')+' · '+E((z.warmup&&z.warmup.duration)||0)+' min</div>'+
      '<div><b>Parte principal:</b> '+E((z.main&&z.main.content)||'Sin contenido')+' · '+E((z.main&&z.main.duration)||0)+' min</div>'+
      '<div><b>Vuelta a la calma:</b> '+E((z.cooldown&&z.cooldown.content)||'Sin contenido')+' · '+E((z.cooldown&&z.cooldown.duration)||0)+' min</div></div>'+
      '<h2 class="pdf-exercises-title">EJERCICIOS</h2><div class="pdf-exercises">'+(rows.join('')||'<p>No hay ejercicios añadidos a esta sesión.</p>')+'</div>'+
      (o.notes&&z.notes?'<div class="pdf-session-notes"><b>Observaciones:</b> '+E(z.notes)+'</div>':'')+'</div>');
  }
  const logo=club.logo?'<img src="'+club.logo+'" style="width:60px;height:60px;object-fit:contain">':'';
  const first=sel[0]&&s.teams.find(y=>y.id===sel[0].z.teamId);
  $$('modalBox').innerHTML='<div class="pdf-preview"><div class="pdf-head">'+logo+'<div><h1>'+E(club.club||'VICTOTALCOACH')+'</h1><div>'+E(club.team||(first&&first.name)||'')+' · '+E(club.coach||'')+'</div><div style="font-size:11px">'+sel.length+' sesión(es) · '+E(sel[0].z.date||'')+(sel.length>1?' → '+E(sel[sel.length-1].z.date||''):'')+'</div></div></div>'+blocks.join('')+'</div>'+
    '<div class="form-actions"><button class="secondary" onclick="closeModal()">Cerrar</button><button class="secondary" onclick="vtcOpenPdfDialog('+E(JSON.stringify(ids))+')">← Cambiar selección</button><button class="primary" onclick="printSessionDocument()">🖨️ Imprimir / Guardar PDF</button></div>';
  $$('modal').classList.add('open');
}
/* "PDF de esta sesión" y el nuevo botón general pasan por el mismo diálogo */
const _printSession=window.printSessionPDF;
window.printSessionPDF=async function(session){openPdfDialog([session.id])};
new MutationObserver(()=>{
  const b=[...document.querySelectorAll('#planning button')].find(x=>/PDF microciclo/.test(x.textContent));
  if(b&&!$$('vtcPdfMulti'))b.insertAdjacentHTML('afterend','<button class="secondary" id="vtcPdfMulti" onclick="vtcOpenPdfDialog([])">📄 PDF de varias sesiones</button>');
}).observe(document.body,{childList:true,subtree:true});
})();
