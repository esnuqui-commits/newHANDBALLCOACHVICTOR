/* VICTOTALCOACH V2 · vtc-sports.js
   Registro de deportes, pistas vectoriales (fútbol, baloncesto, voleibol),
   deporte por equipo y mejoras de la pizarra (deshacer/rehacer, etiquetas, texto, PNG).
   El balonmano conserva su pizarra original (foto de fondo): no se toca.
   Medidas: IHF 40x20 m · IFAB 105x68 m (habitual) · FIBA 28x15 m · FIVB 18x9 m. */
(function(){
'use strict';
const PI=Math.PI;

/* ---------- Dibujo vectorial ---------- */
function mk(x,court,W,H,L,Wd){
  const m=30,full=court==='full',Lh=full?L:L/2;let s,ox,oy;
  if(full){s=Math.min((W-2*m)/L,(H-2*m)/Wd);ox=(W-L*s)/2;oy=(H-Wd*s)/2}
  else{s=Math.min((W-2*m)/Wd,(H-2*m)/Lh);ox=(W-Wd*s)/2;oy=(H-Lh*s)/2}
  const base=(u,v)=>full?[ox+u*s,oy+v*s]:(court==='halfTop'?[ox+v*s,oy+u*s]:[ox+v*s,oy+(Lh-u)*s]);
  return {x,s,full,Lh,L,Wd,ox,oy,base,court,W,H};
}
function path(g,Q,pts,close){const x=g.x;x.beginPath();pts.forEach((p,i)=>{const a=Q(p[0],p[1]);i?x.lineTo(a[0],a[1]):x.moveTo(a[0],a[1])});if(close)x.closePath()}
function arcPts(cu,cv,r,a0,a1,n){const o=[];n=n||48;for(let i=0;i<=n;i++){const t=a0+(a1-a0)*i/n;o.push([cu+r*Math.cos(t),cv+r*Math.sin(t)])}return o}
function stroke(g,Q,pts,close,dash){const x=g.x;path(g,Q,pts,close);x.setLineDash(dash||[]);x.stroke();x.setLineDash([])}
function dot(g,Q,u,v,rpx,color){const a=Q(u,v);g.x.beginPath();g.x.arc(a[0],a[1],rpx,0,2*PI);g.x.fillStyle=color||'#fff';g.x.fill()}
function lines(x){x.strokeStyle='#fff';x.lineWidth=2.5;x.lineCap='round';x.lineJoin='round'}
function rectFill(g,Q,u0,v0,u1,v1,color){path(g,Q,[[u0,v0],[u1,v0],[u1,v1],[u0,v1]],true);g.x.fillStyle=color;g.x.fill()}

function drawFootball(x,court,W,H){
  const D={L:105,W:68},g=mk(x,court,W,H,D.L,D.W),Lh=g.Lh;
  x.fillStyle='#23702f';x.fillRect(0,0,W,H);
  const st=7.5;for(let u=0,i=0;u<Lh;u+=st,i++)rectFill(g,g.base,u,0,Math.min(Lh,u+st),D.W,i%2?'#2a7d37':'#2f8a3d');
  lines(x);stroke(g,g.base,[[0,0],[Lh,0],[Lh,D.W],[0,D.W]],true);
  if(g.full){stroke(g,g.base,[[52.5,0],[52.5,D.W]]);stroke(g,g.base,arcPts(52.5,34,9.15,0,2*PI,72),true);dot(g,g.base,52.5,34,3.5)}
  else stroke(g,g.base,arcPts(52.5,34,9.15,PI/2,3*PI/2));
  (g.full?[0,1]:[0]).forEach(e=>{
    const Q=e===0?g.base:(u,v)=>g.base(D.L-u,D.W-v);
    stroke(g,Q,[[0,13.84],[16.5,13.84],[16.5,54.16],[0,54.16]]);
    stroke(g,Q,[[0,24.84],[5.5,24.84],[5.5,43.16],[0,43.16]]);
    dot(g,Q,11,34,3);
    const k=(16.5-11)/9.15,a=Math.acos(k);stroke(g,Q,arcPts(11,34,9.15,-a,a,30));
    stroke(g,Q,arcPts(0,0,1,0,PI/2,10));stroke(g,Q,arcPts(0,68,1,-PI/2,0,10));
    x.lineWidth=3;stroke(g,Q,[[0,30.34],[-2.44,30.34],[-2.44,37.66],[0,37.66]]);x.lineWidth=2.5;
  });
}
function drawBasketball(x,court,W,H){
  const D={L:28,W:15},g=mk(x,court,W,H,D.L,D.W),Lh=g.Lh;
  x.fillStyle='#8a5a35';x.fillRect(0,0,W,H);
  rectFill(g,g.base,0,0,Lh,D.W,'#d9a066');
  lines(x);stroke(g,g.base,[[0,0],[Lh,0],[Lh,D.W],[0,D.W]],true);
  if(g.full){stroke(g,g.base,[[14,0],[14,D.W]]);stroke(g,g.base,arcPts(14,7.5,1.8,0,2*PI,48),true)}
  else stroke(g,g.base,arcPts(14,7.5,1.8,PI/2,3*PI/2,24));
  (g.full?[0,1]:[0]).forEach(e=>{
    const Q=e===0?g.base:(u,v)=>g.base(D.L-u,D.W-v);
    path(g,Q,[[0,5.05],[5.8,5.05],[5.8,9.95],[0,9.95]],true);x.fillStyle='rgba(168,70,50,.55)';x.fill();
    stroke(g,Q,[[0,5.05],[5.8,5.05],[5.8,9.95],[0,9.95]]);
    stroke(g,Q,arcPts(5.8,7.5,1.8,-PI/2,PI/2,24));stroke(g,Q,arcPts(5.8,7.5,1.8,PI/2,3*PI/2,24),false,[7,6]);
    stroke(g,Q,[[1.2,6.25],[1.575,6.25]]);stroke(g,Q,[[1.2,8.75],[1.575,8.75]]);stroke(g,Q,arcPts(1.575,7.5,1.25,-PI/2,PI/2,24));
    const dv=6.6,t=Math.asin(dv/6.75),u0=1.575+Math.sqrt(6.75*6.75-dv*dv);
    stroke(g,Q,[[0,0.9],[u0,0.9]]);stroke(g,Q,[[0,14.1],[u0,14.1]]);stroke(g,Q,arcPts(1.575,7.5,6.75,-t,t,48));
    x.lineWidth=4;stroke(g,Q,[[1.2,6.6],[1.2,8.4]]);x.lineWidth=2.5;
    const r=g.s*0.225;const a=Q(1.575,7.5);x.beginPath();x.arc(a[0],a[1],Math.max(4,r),0,2*PI);x.strokeStyle='#ff7a1a';x.lineWidth=3;x.stroke();lines(x);
  });
}
function drawVolleyball(x,court,W,H){
  const g=mk(x,court,W,H,18,9),s=g.s;
  const T=(t,v)=>g.full?[g.ox+(t+9)*s,g.oy+v*s]:(g.court==='halfTop'?[g.ox+v*s,g.oy+t*s]:[g.ox+v*s,g.oy+(9-t)*s]);
  x.fillStyle='#2f5d8a';x.fillRect(0,0,W,H);
  const sides=g.full?[1,-1]:[1];
  sides.forEach(sg=>{const Q=sg===1?T:(t,v)=>T(-t,9-v);rectFill({x},Q,0,0,9,9,'#e8833a')});
  lines(x);
  sides.forEach(sg=>{
    const Q=sg===1?T:(t,v)=>T(-t,9-v);
    stroke({x},Q,[[0,0],[9,0],[9,9],[0,9]]);stroke({x},Q,[[3,0],[3,9]]);
    stroke({x},Q,[[9.2,0],[9.5,0]]);stroke({x},Q,[[9.2,9],[9.5,9]]);
    const lab=Q(9.55,4.5);x.save();x.fillStyle='rgba(255,255,255,.9)';x.font='bold 11px system-ui';x.textAlign='center';x.textBaseline='middle';x.translate(lab[0],lab[1]);if(g.full)x.rotate(sg===1?PI/2:-PI/2);x.fillText('SAQUE',0,0);x.restore();
    if(window.vtcShowZones){
      const Z={1:[6,7.5],2:[1.5,7.5],3:[1.5,4.5],4:[1.5,1.5],5:[6,1.5],6:[6,4.5]};
      Object.keys(Z).forEach(k=>{const a=Q(Z[k][0],Z[k][1]);x.fillStyle='rgba(255,255,255,.55)';x.font='bold '+Math.max(22,Math.round(s*0.7))+'px system-ui';x.fillText(k,a[0],a[1])});
    }
  });
  x.lineWidth=5;x.beginPath();const n0=T(0,-0.5),n1=T(0,9.5);x.moveTo(n0[0],n0[1]);x.lineTo(n1[0],n1[1]);x.stroke();
  x.fillStyle='#111827';[n0,n1].forEach(p=>{x.beginPath();x.arc(p[0],p[1],4,0,2*PI);x.fill()});lines(x);
}

/* ---------- Registro de deportes ---------- */
const SPORTS={
 handball:{id:'handball',name:'Balonmano',icon:'🤾',dims:{L:40,W:20},draw:null,
  positions:['Portero/a','Extremo izquierdo','Lateral izquierdo','Central','Lateral derecho','Extremo derecho','Pivote'],
  formations:['6:0','5:1','3:2:1','4:2','3:3','2:4'],tools:['cone','pole','hurdle','hoop','goal'],categories:[],
  courts:{full:'🏟️ Campo entero',top:'🥅 Media pista · portería arriba',bottom:'🥅 Media pista · portería abajo'},
  intro:'Campo real de balonmano como base. Puedes dibujar movimientos, colocar jugadoras, balón y material y después mover cualquier objeto.'},
 football:{id:'football',name:'Fútbol',icon:'⚽',dims:{L:105,W:68},draw:drawFootball,
  positions:['Portero/a','Lateral derecho','Central','Lateral izquierdo','Pivote','Interior','Extremo','Mediapunta','Delantero centro'],
  formations:['4-4-2','4-3-3','3-5-2','4-2-3-1','3-4-3'],tools:['cone','pole','hurdle','hoop','goal'],
  categories:['Técnica individual','Pases y control','Finalización','Táctica ofensiva','Táctica defensiva','Balón parado','Preparación física (fútbol)','Juegos y espacios reducidos'],
  courts:{full:'🏟️ Campo entero',top:'🥅 Medio campo · portería arriba',bottom:'🥅 Medio campo · portería abajo'},
  intro:'Campo de fútbol (105×68 m) con áreas, punto de penalti, círculo central y porterías. Dibuja movimientos y coloca jugadores y material.'},
 basketball:{id:'basketball',name:'Baloncesto',icon:'🏀',dims:{L:28,W:15},draw:drawBasketball,
  positions:['Base','Escolta','Alero','Ala-pívot','Pívot'],
  formations:['Ataque 5 fuera','Ataque 4 fuera 1 dentro','Zona 2-3','Zona 3-2','Individual'],tools:['cone','pole','hoop'],
  categories:['Fundamentos individuales','Tiro','Pase y bote','Ataque posicional','Defensa','Transición','Rebote','Preparación física (baloncesto)','Juegos y situaciones reducidas'],
  courts:{full:'🏟️ Pista entera',top:'🏀 Media pista · canasta arriba',bottom:'🏀 Media pista · canasta abajo'},
  intro:'Pista FIBA (28×15 m) con zona, línea de tres puntos, tiros libres y canastas. Dibuja movimientos y coloca jugadores y material.'},
 volleyball:{id:'volleyball',name:'Voleibol',icon:'🏐',dims:{L:18,W:9},draw:drawVolleyball,
  positions:['Colocador/a','Opuesto/a','Central','Receptor/a-atacante','Líbero'],
  formations:['5-1','4-2','6-2','Recepción en W','Recepción en 3'],tools:['cone','pole','hoop'],
  categories:['Saque','Recepción','Colocación','Ataque','Bloqueo','Defensa en campo','Rotaciones y sistemas','Preparación física (voleibol)','Juegos y situaciones reducidas'],
  courts:{full:'🏟️ Pista entera',top:'🏐 Media pista · red arriba',bottom:'🏐 Media pista · red abajo'},
  intro:'Pista FIVB (18×9 m) con red, línea de ataque a 3 m y zona de saque. Usa «Rotaciones» para ver las posiciones 1 a 6.'}
};
window.VTC_SPORTS=SPORTS;
const sportOf=id=>SPORTS[id]||SPORTS.handball;
function teamSport(t){return (t&&t.sport&&SPORTS[t.sport])?t.sport:'handball'}
const ST=()=>(typeof state!=='undefined'?state:null);
function activeSport(){const st=ST();const t=st&&st.teams&&st.teams.find(x=>x.id===st.selectedTeam);return teamSport(t)}
function boardSport(){return window.vtcBoardSport&&SPORTS[window.vtcBoardSport]?window.vtcBoardSport:activeSport()}
window.VTC={activeSport,boardSport,teamSport,sportOf};

/* ---------- Fondo de pizarra: vectorial salvo balonmano ---------- */
const _tBg=window.tBg;
window.tBg=function(court,after){
  const sp=SPORTS[boardSport()];
  if(!sp.draw)return _tBg(court,after);
  const c=document.getElementById('tacticalCanvas');if(!c)return;
  const x=c.getContext('2d');tacticalCtx=x;
  x.save();x.setLineDash([]);x.clearRect(0,0,c.width,c.height);sp.draw(x,court,c.width,c.height);x.restore();
  tRender();if(after)after();
};

/* ---------- Etiquetas de jugadores y anotaciones ---------- */
const _tRender=window.tRender;
window.tRender=function(){
  _tRender();const x=tacticalCtx;if(!x)return;
  tacticalObjects.forEach(o=>{
    if(o.type==='text'&&o.text){
      x.save();x.font='bold 20px system-ui';x.textAlign='center';x.textBaseline='middle';
      const w=x.measureText(o.text).width+16;x.fillStyle='rgba(17,24,39,.78)';
      x.beginPath();(x.roundRect?x.roundRect(o.x-w/2,o.y-15,w,30,8):x.rect(o.x-w/2,o.y-15,w,30));x.fill();
      x.fillStyle='#fff';x.fillText(o.text,o.x,o.y+1);x.restore();
    }else if(o.label&&o.x!==undefined){
      x.save();x.textAlign='center';x.textBaseline='middle';
      if(o.type==='player'){x.font='bold '+(String(o.label).length>2?12:16)+'px system-ui';x.fillStyle=(o.team==='visitor')?'#fff':'#111827';x.fillText(o.label,o.x,o.y+1)}
      else{x.font='bold 14px system-ui';x.fillStyle='#fff';x.strokeStyle='#111827';x.lineWidth=3;x.strokeText(o.label,o.x,o.y+26);x.fillText(o.label,o.x,o.y+26)}
      x.restore();
    }
  });
};

/* ---------- Historial (deshacer / rehacer) ---------- */
let hist=[],hi=0;
const snap=()=>JSON.stringify(tacticalObjects||[]);
function histReset(){hist=[snap()];hi=0;syncHistButtons()}
function histPush(){const s=snap();if(s===hist[hi])return;hist=hist.slice(0,hi+1);hist.push(s);if(hist.length>80)hist.shift();hi=hist.length-1;syncHistButtons()}
function histGo(d){
  const n=hi+d;if(n<0||n>=hist.length)return;hi=n;
  tacticalObjects=JSON.parse(hist[hi]);tacticalSelected=null;tacticalMoving=null;tBg(tacticalCourt);syncHistButtons();
  const st=document.getElementById('tacticalStatus');if(st)st.textContent=d<0?'Acción deshecha.':'Acción rehecha.';
}
function syncHistButtons(){
  const u=document.getElementById('vtcUndo'),r=document.getElementById('vtcRedo');
  if(u)u.disabled=hi<=0;if(r)r.disabled=hi>=hist.length-1;
}
document.addEventListener('keydown',e=>{
  if(!document.getElementById('tacticalCanvas'))return;
  const mod=e.metaKey||e.ctrlKey;if(!mod||e.key.toLowerCase()!=='z')return;
  const tag=(e.target&&e.target.tagName)||'';if(/INPUT|TEXTAREA|SELECT/.test(tag))return;
  e.preventDefault();histGo(e.shiftKey?1:-1);
});

/* ---------- Mejora de la pizarra al abrirse ---------- */
function enhanceBoard(){
  const c=document.getElementById('tacticalCanvas');if(!c)return;
  const sp=SPORTS[boardSport()];
  document.querySelectorAll('#modalBox label').forEach(l=>{if(/Pizarra t.ctica/i.test(l.textContent))l.textContent='🧠 Pizarra táctica de '+sp.name.toLowerCase()});
  const intro=document.querySelector('#modalBox .tactical-wrap .muted');if(intro)intro.textContent=sp.intro;
  [['courtFull','full'],['courtTop','top'],['courtBottom','bottom']].forEach(a=>{const b=document.getElementById(a[0]);if(b)b.textContent=sp.courts[a[1]]});
  document.querySelectorAll('#modalBox .material-btn').forEach(b=>{b.style.display=sp.tools.includes(b.dataset.material)?'':'none'});
  const clear=document.getElementById('toolClear');
  if(clear&&!document.getElementById('vtcUndo')){
    const mkBtn=(id,txt,title)=>{const b=document.createElement('button');b.type='button';b.id=id;b.className='secondary';b.textContent=txt;b.title=title;return b};
    const bar=clear.parentElement;
    const undo=mkBtn('vtcUndo','↶ Deshacer','Deshacer (Ctrl/Cmd+Z)'),redo=mkBtn('vtcRedo','↷ Rehacer','Rehacer (Ctrl/Cmd+Mayús+Z)'),
          lab=mkBtn('vtcLabel','🔢 Número / nombre','Pulsa sobre un jugador para ponerle número o nombre'),
          txt=mkBtn('vtcText','🅣 Texto','Añadir una anotación de texto'),png=mkBtn('vtcPng','🖼️ Descargar PNG','Descargar la pizarra como imagen');
    [undo,redo,lab,txt,png].forEach(b=>bar.appendChild(b));
    undo.onclick=()=>histGo(-1);redo.onclick=()=>histGo(1);
    lab.onclick=()=>{tacticalMode='label';document.getElementById('tacticalStatus').textContent='Pulsa sobre un jugador para escribir su número o nombre.'};
    txt.onclick=()=>{tacticalMode='text';document.getElementById('tacticalStatus').textContent='Pulsa sobre la pizarra para añadir un texto.'};
    png.onclick=()=>c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='pizarra_'+sp.id+'.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)},'image/png');
  }
  const zb=document.getElementById('vtcZones');
  if(sp.id==='volleyball'){
    if(!zb&&clear){const z=document.createElement('button');z.type='button';z.id='vtcZones';z.className='secondary';z.textContent='🔄 Rotaciones';z.title='Mostrar u ocultar las posiciones 1 a 6';
      z.onclick=()=>{window.vtcShowZones=!window.vtcShowZones;tBg(tacticalCourt)};clear.parentElement.appendChild(z)}
  }else if(zb){zb.remove();window.vtcShowZones=false}
  /* etiquetas y texto: se procesan después del manejador original */
  if(!c.dataset.vtcBound){c.dataset.vtcBound='1';
  c.addEventListener('pointerdown',e=>{
    if(tacticalMode!=='label'&&tacticalMode!=='text')return;
    const p=tPos(e);
    if(tacticalMode==='text'){const t=(prompt('Texto de la anotación:')||'').trim();if(t){tacticalObjects.push({type:'text',x:p.x,y:p.y,text:t});tBg(tacticalCourt)}histPush();return}
    const hit=tHit(p),o=hit&&tacticalObjects[hit.i];
    if(!o||o.x===undefined||o.type==='text'){document.getElementById('tacticalStatus').textContent='Pulsa justo sobre un jugador.';return}
    const cur=o.label||'';const t=prompt('Número o nombre del jugador (vacío para quitarlo):',cur);
    if(t===null)return;if(t.trim())o.label=t.trim().slice(0,12);else delete o.label;tBg(tacticalCourt);histPush();
  });
  ['pointerup','pointerdown'].forEach(ev=>c.addEventListener(ev,()=>setTimeout(histPush,0)));
  ['toolDelete','toolClear'].forEach(id=>{const b=document.getElementById(id);if(b)b.addEventListener('click',()=>setTimeout(histPush,0))});
  }
  /* selector de deporte del ejercicio */
  const name=document.getElementById('exName');
  if(name&&!document.getElementById('vtcExSport')){
    const wrap=document.createElement('div');
    wrap.innerHTML='<label>Deporte</label><select id="vtcExSport">'+Object.values(SPORTS).map(s=>'<option value="'+s.id+'">'+s.icon+' '+s.name+'</option>').join('')+'</select>';
    name.after(wrap);const sel=wrap.querySelector('select');sel.value=boardSport();
    sel.onchange=()=>{window.vtcBoardSport=sel.value;enhanceBoard();tBg(tacticalCourt)};
  }
  histReset();
}
const _ti=window.tacticalInit;
window.tacticalInit=function(){_ti.apply(this,arguments);try{enhanceBoard()}catch(e){console.error('Pizarra V2:',e)}};
const _oe=window.openExercise;
window.openExercise=async function(id){
  const st=ST(),e=id&&st&&st.exercises.find(x=>x.id===id);
  window.vtcBoardSport=(e&&e.sport&&SPORTS[e.sport])?e.sport:activeSport();window.vtcShowZones=false;
  return _oe.apply(this,arguments);
};

/* ---------- Equipos con deporte ---------- */
function teamSessions(id){let n=0;(state.seasons||[]).forEach(s=>(s.micros||[]).forEach(m=>(m.sessions||[]).forEach(z=>{if(z.teamId===id)n++})));return n}
function ensureSportCategories(spId){
  const sp=SPORTS[spId];if(!sp||!sp.categories.length)return 0;let n=0;
  sp.categories.forEach(c=>{if(!state.exerciseCategories[c]){state.exerciseCategories[c]=['General'];state.exerciseCategoryOrder.push(c);n++}});
  return n;
}
const _ot=window.openTeam;
window.openTeam=function(id){
  _ot.apply(this,arguments);
  const t=id&&state.teams.find(x=>x.id===id),sex=document.getElementById('teamSex');
  if(sex&&!document.getElementById('teamSport')){
    const w=document.createElement('div');
    w.innerHTML='<label>Deporte</label><select id="teamSport">'+Object.values(SPORTS).map(s=>'<option value="'+s.id+'">'+s.icon+' '+s.name+'</option>').join('')+'</select>';
    sex.after(w);w.querySelector('select').value=t?teamSport(t):activeSport();
  }
};
const _stm=window.saveTeam;
window.saveTeam=function(id){
  const sel=document.getElementById('teamSport'),sport=sel?sel.value:null;
  if(id&&sport){
    const t=state.teams.find(x=>x.id===id),old=t?teamSport(t):null;
    if(t&&old!==sport){
      const n=teamSessions(id);
      if(!confirm('Cambiar el deporte de «'+t.name+'» de '+SPORTS[old].name+' a '+SPORTS[sport].name+'.\n\nNo se convierte nada automáticamente: las '+n+' sesión(es) y los ejercicios existentes se conservan tal cual, y los que sean de otro deporte se marcarán con un aviso.\n\n¿Continuar?'))return;
    }
  }
  window._vtcPendingTeam={id:id||null,sport:sport,before:new Set(state.teams.map(t=>t.id))};
  return _stm.apply(this,arguments);
};
const _save=window.save;
window.save=function(){
  const p=window._vtcPendingTeam;
  if(p&&p.sport){
    const t=p.id?state.teams.find(x=>x.id===p.id):state.teams.find(x=>!p.before.has(x.id));
    if(t){t.sport=p.sport;window._vtcPendingTeam=null;const n=ensureSportCategories(p.sport);if(n)setTimeout(()=>window.vtcToast&&vtcToast('Se añadieron '+n+' categorías iniciales de '+SPORTS[p.sport].name+' (editables).'),300)}
  }
  const r=_save.apply(this,arguments);try{refreshStatus()}catch(e){}return r;
};

/* ---------- Barra de estado: deporte y equipo activos ---------- */
function refreshStatus(){
  const bar=document.getElementById('vtcStatusBar');if(!bar||!ST())return;
  const t=state.teams.find(x=>x.id===state.selectedTeam),sp=SPORTS[teamSport(t)];
  bar.innerHTML='<span class="chip">💻 Modo local · un usuario</span><span class="chip">Deporte activo: <b>'+sp.icon+' '+sp.name+'</b></span>'+
    (t?'<span class="chip">Equipo: <b>'+esc(t.name)+'</b></span>':'<span class="chip warn">Sin equipo seleccionado</span>');
}
function initStatus(){
  if(document.getElementById('vtcStatusBar'))return;
  const nav=document.querySelector('nav');if(!nav)return;
  const bar=document.createElement('div');bar.id='vtcStatusBar';nav.before(bar);refreshStatus();
}
setTimeout(initStatus,200);setInterval(()=>{try{initStatus();refreshStatus()}catch(e){}},1500);

/* ---------- Posiciones según el deporte del equipo (modal de jugador) ---------- */
new MutationObserver(()=>{
  const pos=document.getElementById('pPos');if(!pos||pos.dataset.vtc)return;pos.dataset.vtc='1';
  const sp=SPORTS[activeSport()];if(sp.id==='handball')return;
  const cur=pos.value;pos.innerHTML=sp.positions.map(p=>'<option>'+esc(p)+'</option>').join('');
  if(cur&&!sp.positions.includes(cur)){const o=document.createElement('option');o.textContent=cur;pos.prepend(o)}
  pos.value=cur||sp.positions[0];
}).observe(document.body,{childList:true,subtree:true});
})();
