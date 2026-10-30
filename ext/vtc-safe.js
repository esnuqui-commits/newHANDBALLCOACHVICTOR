/* VICTOTALCOACH V2 · vtc-safe.js
   Restauración segura (fusionar / reemplazar), copia automática previa,
   avisos (toast) y migración aditiva de evaluaciones antiguas.
   Nada de este módulo borra datos. */
(function(){
'use strict';
const isObj=x=>x&&typeof x==='object'&&!Array.isArray(x);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

/* FUSIÓN: añade lo que falta y NUNCA sobrescribe lo que ya existe. */
function mergeState(cur,inc){
  if(!isObj(cur))return inc;
  const out=Object.assign({},cur);
  Object.keys(inc||{}).forEach(k=>{
    const a=out[k],b=inc[k];
    if(Array.isArray(a)&&Array.isArray(b)){
      const withId=L=>L.length&&L.every(x=>isObj(x)&&x.id!=null);
      if((withId(a)||!a.length)&&withId(b)){
        const m=new Map(a.map(x=>[String(x.id),x]));
        b.forEach(x=>{const id=String(x.id);m.set(id,m.has(id)?mergeState(m.get(id),x):x)});
        out[k]=[...m.values()];
      }else{
        out[k]=[...a,...b.filter(x=>!a.some(y=>same(y,x)))];
      }
    }else if(isObj(a)&&isObj(b)){out[k]=mergeState(a,b)}
    else if(a===undefined||a===null||a===''){out[k]=b}
  });
  return out;
}
window.vtcMergeState=mergeState;

/* Resumen legible de lo que contiene una copia */
function resumen(p){
  const m=p.main||{},n=x=>Array.isArray(x)?x.length:0;
  return 'Equipos: '+n(m.teams)+' · Ejercicios: '+n(m.exercises)+' · Temporadas: '+n(m.seasons)+
    '\nPartidos: '+n(p.matches)+' · Evaluaciones: '+n(p.evaluations)+
    '\nCortes de scouting: '+n(p.scouting&&p.scouting.cuts)+' · Archivos multimedia: '+n(p.media)+
    (p.createdAt?'\nCopia creada: '+String(p.createdAt).slice(0,10):'');
}

/* Copia automática de los datos actuales antes de reemplazar */
window.vtcAutoBackup=async function(){
  if(typeof window.exportHCBackup==='function'){await window.exportHCBackup();return true}
  return false;
};


/* Aviso visible mientras se restaura (la operación puede tardar ~30 s con copias grandes) */
function showRestoring(mode){
  let o=document.getElementById('vtcRestoring');
  if(!o){o=document.createElement('div');o.id='vtcRestoring';document.body.appendChild(o)}
  o.innerHTML='<div><div style="font-size:34px">⏳</div><h2 style="margin:6px 0">Restaurando la copia ('+(mode==='merge'?'fusionar':'reemplazar')+')…</h2>'+
    '<p>Puede tardar <b>hasta un minuto</b> con copias grandes.<br><b>No cierres esta pestaña ni el navegador.</b><br>Al terminar verás un aviso y la aplicación se recargará sola.</p>'+
    '<button type="button" onclick="this.closest(\'#vtcRestoring\').remove()">Ocultar este aviso</button></div>';
  clearTimeout(o._h);o._h=setTimeout(()=>{try{o.remove()}catch(e){}},180000);
}

/* Pregunta el modo de restauración. Devuelve 'merge', 'replace' o null (cancelar). */
window.vtcAskRestoreMode=async function(p){
  const info=resumen(p);
  if(confirm('RESTAURAR COPIA\n\n'+info+
     '\n\nACEPTAR = FUSIONAR (recomendado): se añade lo que falta y NO se borra ni se sobrescribe nada de lo actual.\nCANCELAR = ver más opciones.'))return(showRestoring('merge'),'merge');
  if(confirm('REEMPLAZAR TODO\n\nLos datos actuales serán sustituidos por los de la copia.\nANTES se descargará automáticamente una copia de seguridad de lo que tienes ahora.\n\n¿Reemplazar?')){
    try{await window.vtcAutoBackup()}catch(e){
      if(!confirm('No se pudo crear la copia automática previa ('+(e&&e.message||e)+').\n\n¿Reemplazar de todos modos? No se podrá deshacer.'))return null;
    }
    return(showRestoring('replace'),'replace');
  }
  return null;
};

/* Aviso discreto no bloqueante */
window.vtcToast=function(msg,ms){
  let t=document.getElementById('vtcToast');
  if(!t){t=document.createElement('div');t.id='vtcToast';t.setAttribute('role','status');document.body.appendChild(t)}
  t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),ms||2600);
};

/* Estilos de los módulos V2 */
const css=document.createElement('style');css.id='vtcStyles';css.textContent=`
#vtcToast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);background:#111827;color:#fff;padding:10px 16px;border-radius:12px;font:600 14px system-ui;opacity:0;pointer-events:none;transition:.25s;z-index:99999;max-width:90vw}
#vtcRestoring{position:fixed;inset:0;background:rgba(15,23,42,.88);color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;z-index:100000;font:16px system-ui}#vtcRestoring button{margin-top:12px;padding:8px 14px;border-radius:10px;border:0;font:600 14px system-ui;cursor:pointer}
#vtcToast.on{opacity:1;transform:translateX(-50%) translateY(0)}
#v19UserBar,#v19HomeCard,#v19AdminPanel{display:none!important}
#vtcStatusBar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;background:#0f172a;color:#e5e7eb;padding:8px 14px;font:600 13px system-ui}
#vtcStatusBar b{color:#fff}#vtcStatusBar .chip{background:#1e293b;border-radius:999px;padding:4px 10px}
#vtcStatusBar .warn{background:#78350f;color:#fde68a}
.vtc-box{border:1px solid #d6dde6;border-radius:12px;padding:12px;margin:10px 0;background:#f8fafc}
.vtc-box summary{cursor:pointer;font-weight:800}
.vtc-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0}
.vtc-row input[type=text],.vtc-row input[type=number],.vtc-row select{padding:7px;border:1px solid #ccd3da;border-radius:8px;font:inherit}
.vtc-warn{display:inline-block;background:#fef3c7;color:#92400e;border-radius:8px;padding:2px 8px;font-size:12px;font-weight:700;margin:2px 4px 0 0}
.vtc-inactive{opacity:.55}
.vtc-filters{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.vtc-filters select{padding:8px;border:1px solid #ccd3da;border-radius:8px}
`;
document.head.appendChild(css);

/* Migración ADITIVA de evaluaciones antiguas guardadas dentro del estado general.
   Solo añade a la base de datos las que no existan; no borra nada del estado. */
async function migrateLegacyEvaluations(){
  try{
    const st=(typeof state!=='undefined'?state:null);if(!st||!Array.isArray(st.evaluations)||!st.evaluations.length)return;
    const cand=st.evaluations.filter(e=>e&&e.id!=null);if(!cand.length)return;
    const db=await new Promise((res,rej)=>{const r=indexedDB.open('VICTOTALCOACH_DATA_V1');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
    if(!db.objectStoreNames.contains('evaluations')){db.close();return}
    const have=await new Promise(res=>{const q=db.transaction('evaluations').objectStore('evaluations').getAllKeys();q.onsuccess=()=>res(new Set((q.result||[]).map(String)));q.onerror=()=>res(new Set())});
    const missing=cand.filter(e=>!have.has(String(e.id)));
    if(missing.length){
      await new Promise(res=>{const tx=db.transaction('evaluations','readwrite'),os=tx.objectStore('evaluations');
        missing.forEach(e=>{const r=os.add(e);r.onerror=ev=>{ev.preventDefault();ev.stopPropagation()}});tx.oncomplete=res;tx.onerror=res;tx.onabort=res});
      window.vtcToast('Se recuperaron '+missing.length+' evaluación(es) antigua(s). Recarga la pestaña Evaluación para verlas.',5000);
    }
    db.close();
  }catch(e){console.warn('Migración de evaluaciones:',e)}
}
setTimeout(migrateLegacyEvaluations,2500);
/* Hace la app instalable (icono, ventana propia) en Brave/Chrome/Edge */
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(e=>console.warn('Service worker:',e)))}
})();
