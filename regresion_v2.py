#!/usr/bin/env python3
"""VICTOTALCOACH V2 · batería de regresión.
Uso:   python3 regresion_v2.py [--app RUTA_A_Resources/VICTOTALCOACH] [--backup COPIA.json]
Requiere: pip install playwright && playwright install chromium
Usa un navegador temporal y un servidor local propio: NO toca tus datos reales.
Con --backup añade las pruebas sobre una copia completa tuya (V8). Sin ella, usa datos sintéticos."""
import argparse, asyncio, json, os, subprocess, sys, tempfile, time
from playwright.async_api import async_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--app', default=os.path.join(os.path.dirname(__file__), '..', 'VICTOTALCOACH_V2.app', 'Contents', 'Resources', 'VICTOTALCOACH'))
ap.add_argument('--backup', default=None)
ap.add_argument('--port', type=int, default=8795)
A = ap.parse_args()
RES = []
def check(name, ok, detail=''):
    RES.append((name, 'OK' if ok else 'FALLO', detail)); print(('  ✓ ' if ok else '  ✗ ') + name + (f'  [{detail}]' if detail else ''))
def skip(name, why): RES.append((name, 'OMITIDA', why)); print(f'  · {name}  (omitida: {why})')

MEDIA = """async()=>{const db=await new Promise((r,j)=>{const q=indexedDB.open('handball_coach_media_v1');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});
 if(!db.objectStoreNames.contains('media')){db.close();return -1}
 const n=await new Promise(r=>{const q=db.transaction('media').objectStore('media').count();q.onsuccess=()=>r(q.result)});db.close();return n}"""
PUT = """async()=>{const png=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0));
 const db=await new Promise((r,j)=>{const q=indexedDB.open('handball_coach_media_v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('media');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});
 await new Promise(r=>{const tx=db.transaction('media','readwrite');tx.objectStore('media').put(new Blob([png],{type:'image/png'}),'test_img');tx.oncomplete=r});db.close();return true}"""

async def main():
    root = os.path.abspath(A.app)
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(A.port), '--bind', '127.0.0.1', '--directory', root], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2); URL = f'http://127.0.0.1:{A.port}/VICTOTALCOACH.html'
    prof = tempfile.mkdtemp(prefix='vtc_test_')
    try:
        async with async_playwright() as p:
            ctx = await p.chromium.launch_persistent_context(prof, viewport={'width': 1280, 'height': 900}, accept_downloads=True)
            pg = ctx.pages[0]; errs = []; seq = []; downloads = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
            pg.on('download', lambda d: downloads.append(d.suggested_filename))
            mode = {'v': 'merge'}
            async def ond(d):
                seq.append(d.type + ':' + d.message[:30].replace('\n', ' '))
                if d.type == 'confirm' and d.message.startswith('RESTAURAR') and mode['v'] == 'replace': await d.dismiss()
                else: await d.accept()
            pg.on('dialog', lambda d: asyncio.ensure_future(ond(d)))
            await pg.goto(URL); await pg.wait_for_timeout(2500)

            print('\n== 1. Arranque y aspecto')
            check('Arranca sin errores de JavaScript', not errs, str(errs[:2]))
            check('Título V2', 'V2.0' in await pg.title())
            check('Barra multiusuario falsa oculta', await pg.evaluate("()=>getComputedStyle(document.getElementById('v19UserBar')).display") == 'none')
            check('Barra de estado con deporte y modo local', 'Modo local' in await pg.inner_text('#vtcStatusBar'))
            navs = await pg.eval_on_selector_all('nav button[data-page]', 'e=>e.map(x=>x.dataset.page)')
            bad = []
            for n in navs:
                await pg.click(f'nav button[data-page="{n}"]'); await pg.wait_for_timeout(250)
                if not await pg.evaluate(f"()=>document.getElementById('{n}').innerText.length>10"): bad.append(n)
            check('Las 10 pestañas cargan contenido', len(navs) == 10 and not bad, f'{len(navs)} pestañas; vacías: {bad}')

            print('\n== 2. Equipos y deportes')
            for sp, nm in [('basketball', 'T Baloncesto'), ('football', 'T Futbol'), ('volleyball', 'T Voleibol'), ('handball', 'T Balonmano')]:
                await pg.click('nav button[data-page="teams"]'); await pg.wait_for_timeout(300)
                await pg.click('#teams button:has-text("Crear equipo")'); await pg.wait_for_timeout(300)
                await pg.fill('#teamName', nm); await pg.select_option('#teamSport', sp)
                await pg.click('#modalBox button:has-text("Guardar")'); await pg.wait_for_timeout(900)
            sports = await pg.evaluate("()=>state.teams.filter(t=>t.name.startsWith('T ')).map(t=>t.sport)")
            check('Se crean equipos de los 4 deportes', sorted(sports) == ['basketball', 'football', 'handball', 'volleyball'], str(sports))
            cats = await pg.evaluate("()=>state.exerciseCategoryOrder")
            check('Se añaden categorías iniciales editables por deporte', 'Tiro' in cats and 'Saque' in cats and 'Pases y control' in cats)
            check('Estado muestra el deporte del equipo activo', 'Balonmano' in await pg.inner_text('#vtcStatusBar'))

            print('\n== 3. Pizarras por deporte')
            await pg.click('nav button[data-page="exercises"]'); await pg.wait_for_timeout(500)
            sigs = {}
            for sp in ['basketball', 'football', 'volleyball', 'handball']:
                await pg.click('#exercises button:has-text("Nuevo ejercicio")'); await pg.wait_for_timeout(600)
                await pg.select_option('#vtcExSport', sp); await pg.wait_for_timeout(400)
                for court, btn in [('full', 'courtFull'), ('halfTop', 'courtTop'), ('halfBottom', 'courtBottom')]:
                    await pg.click('#' + btn); await pg.wait_for_timeout(450)
                    sigs[(sp, court)] = await pg.evaluate("()=>{const c=document.getElementById('tacticalCanvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0,n=0;for(let i=0;i<d.length;i+=16){h=(h*31+d[i]+d[i+1]*3+d[i+2]*7)|0;if(!(d[i]>250&&d[i+1]>250&&d[i+2]>250))n++}return [h,n]}")
                mats = await pg.eval_on_selector_all('#modalBox .material-btn', 'e=>e.filter(x=>x.style.display!=="none").map(x=>x.dataset.material)')
                if sp == 'basketball': check('Baloncesto no muestra miniportería ni vallas', 'goal' not in mats and 'hurdle' not in mats, str(mats))
                if sp == 'volleyball': check('Voleibol ofrece botón de rotaciones', bool(await pg.query_selector('#vtcZones')))
                await pg.click('#modalBox button:has-text("Cancelar")'); await pg.wait_for_timeout(250)
            check('Cada deporte dibuja una pista con contenido', all(v[1] > 1000 for v in sigs.values()))
            check('Las pistas de deportes distintos son distintas', len({sigs[(s, 'full')][0] for s in ['basketball', 'football', 'volleyball', 'handball']}) == 4)
            check('Media pista distinta de pista completa', sigs[('football', 'full')][0] != sigs[('football', 'halfTop')][0] != sigs[('football', 'halfBottom')][0])

            print('\n== 4. Pizarra: edición')
            await pg.click('#exercises button:has-text("Nuevo ejercicio")'); await pg.wait_for_timeout(600)
            await pg.fill('#exName', 'TEST pizarra'); await pg.select_option('#vtcExSport', 'football'); await pg.wait_for_timeout(300)
            c = await pg.query_selector('#tacticalCanvas'); await c.scroll_into_view_if_needed(); bb = await c.bounding_box()
            O = "()=>({n:tacticalObjects.length,l:tacticalObjects.filter(o=>o.label).map(o=>o.label),t:tacticalObjects.filter(o=>o.type==='text').length})"
            await pg.click('#modalBox button:has-text("Jugadoras")'); await pg.mouse.click(bb['x'] + bb['width'] * .5, bb['y'] + bb['height'] * .5); await pg.wait_for_timeout(250)
            await pg.evaluate("()=>{window.prompt=()=>'9'}"); await pg.click('#vtcLabel'); await pg.mouse.click(bb['x'] + bb['width'] * .5, bb['y'] + bb['height'] * .5); await pg.wait_for_timeout(250)
            await pg.evaluate("()=>{window.prompt=()=>'Pivote'}"); await pg.click('#vtcText'); await pg.mouse.click(bb['x'] + bb['width'] * .3, bb['y'] + bb['height'] * .3); await pg.wait_for_timeout(250)
            o = await pg.evaluate(O); check('Añadir jugador, número y texto', o['n'] == 2 and o['l'] == ['9'] and o['t'] == 1, str(o))
            await pg.click('#vtcUndo'); await pg.wait_for_timeout(120); await pg.click('#vtcUndo'); await pg.wait_for_timeout(120)
            check('Deshacer', (await pg.evaluate(O))['n'] == 1 and (await pg.evaluate(O))['t'] == 0)
            await pg.click('#vtcRedo'); await pg.wait_for_timeout(120)
            check('Rehacer', (await pg.evaluate(O))['l'] == ['9'])
            async with pg.expect_download() as di: await pg.click('#vtcPng')
            check('Descargar la pizarra como PNG', (await di.value).suggested_filename.endswith('.png'))
            await pg.click('#modalBox button:has-text("Guardar ejercicio")'); await pg.wait_for_timeout(1800)
            ex = await pg.evaluate("()=>{const e=state.exercises.find(x=>x.name==='TEST pizarra');return e&&{sport:e.sport,key:!!e.boardKey,objs:e.boardObjects.length}}")
            check('Guarda deporte y pizarra (PNG automático)', bool(ex) and ex['sport'] == 'football' and ex['key'] and ex['objs'] == 1, str(ex))

            print('\n== 5. Biblioteca por edades')
            await pg.click('#vtcFSport') if False else None
            await pg.select_option('#vtcFSport', 'football'); await pg.wait_for_timeout(300)
            await pg.click('#vtcAgeBtn'); await pg.wait_for_timeout(300)
            await pg.fill('#vtcAgeList .vtc-row:nth-child(3) .amin', '12'); await pg.fill('#vtcAgeList .vtc-row:nth-child(3) .amax', '13')
            await pg.click('#modalBox button:has-text("Guardar rangos")'); await pg.wait_for_timeout(400)
            check('Rangos de edad editables', await pg.evaluate("()=>state.vtcAgeRanges[2].min===12&&state.vtcAgeRanges[2].max===13"))
            await pg.fill('#exerciseSearch', 'TEST pizarra'); await pg.wait_for_timeout(400)
            await pg.click('#exerciseList button:has-text("Editar")'); await pg.wait_for_timeout(1000)
            await pg.check('#vtcMeta .vtc-age[value="age_3"]'); await pg.select_option('#vtcDiff', 'Avanzado'); await pg.fill('#vtcErrors', 'Error de prueba'); await pg.fill('#vtcTags', 'a, b')
            await pg.click('#modalBox button:has-text("Guardar ejercicio")'); await pg.wait_for_timeout(1500)
            await pg.reload(); await pg.wait_for_timeout(2500)
            e = await pg.evaluate("()=>{const e=state.exercises.find(x=>x.name==='TEST pizarra');return {a:e.ageRangeIds,d:e.difficulty,t:e.tags,u:!!e.updatedAt,c:!!e.createdAt}}")
            check('Ficha profesional se guarda y persiste tras recargar', e['a'] == ['age_3'] and e['d'] == 'Avanzado' and e['t'] == ['a', 'b'] and e['u'] and e['c'], str(e))
            await pg.click('nav button[data-page="exercises"]'); await pg.wait_for_timeout(500)
            await pg.select_option('#vtcFSport', 'all'); await pg.select_option('#vtcFAge', 'age_3'); await pg.wait_for_timeout(400)
            check('Filtro por edad', '1 de' in await pg.inner_text('#vtcFCount'), await pg.inner_text('#vtcFCount'))
            await pg.select_option('#vtcFAge', ''); await pg.select_option('#vtcFSport', 'auto')

            print('\n== 6. Categorías editables')
            await pg.click('#exercises button:has-text("Gestionar categorías")'); await pg.wait_for_timeout(400)
            await pg.evaluate("()=>{window.prompt=()=>'CAT PRUEBA'}"); await pg.click('#modalBox button:has-text("Nueva categoría")'); await pg.wait_for_timeout(400)
            check('Crear categoría', await pg.evaluate("()=>state.exerciseCategories['CAT PRUEBA']!==undefined"))
            await pg.evaluate("()=>{window.prompt=()=>'CAT RENOMBRADA'}"); await pg.evaluate("()=>vtcCatRename(state.exerciseCategoryOrder.indexOf('CAT PRUEBA'))"); await pg.wait_for_timeout(300)
            await pg.evaluate("()=>vtcCatMove(state.exerciseCategoryOrder.indexOf('CAT RENOMBRADA'),-1)"); await pg.wait_for_timeout(300)
            await pg.evaluate("()=>vtcCatToggle(state.exerciseCategoryOrder.indexOf('CAT RENOMBRADA'))"); await pg.wait_for_timeout(300)
            st = await pg.evaluate("()=>({n:state.exerciseCategories['CAT RENOMBRADA']!==undefined,dis:!!(state.vtcCatDisabled||{})['CAT RENOMBRADA']})")
            check('Renombrar, reordenar y desactivar', st['n'] and st['dis'], str(st))
            tot = await pg.evaluate("()=>state.exercises.length"); first = await pg.evaluate("()=>state.exerciseCategoryOrder.find(c=>c!=='Otros'&&c!=='SISTEMA DE JUEGO'&&state.exercises.some(e=>(e.categories||[]).some(a=>a.category===c)))")
            if first:
                await pg.evaluate("(c)=>vtcCatDelete(state.exerciseCategoryOrder.indexOf(c))", first); await pg.wait_for_timeout(400)
                dlg = await pg.inner_text('#modalBox'); await pg.click('#vtcDoReassign'); await pg.wait_for_timeout(500)
                after = await pg.evaluate("(c)=>({tot:state.exercises.length,gone:!state.exerciseCategoryOrder.includes(c),sin:state.exercises.filter(e=>!(e.categories&&e.categories.length)).length})", first)
                check('Eliminar categoría en uso exige reasignar y no pierde ejercicios', 'Reasign' in dlg or 'reasign' in dlg and after['tot'] == tot and after['gone'] and after['sin'] == 0, str(after))
            else: skip('Eliminar categoría en uso con reasignación', 'no hay ejercicios con categoría')

            print('\n== 7. Copias de seguridad (datos sintéticos)')
            await pg.evaluate("()=>closeModal()")
            await pg.evaluate(PUT); m0 = await pg.evaluate(MEDIA)
            tiny = os.path.join(prof, 'tiny.json')
            json.dump({'format': 'HC_BACKUP_V8_CLEAN', 'createdAt': '2026-01-01T00:00:00Z', 'main': {'teams': [], 'exercises': [], 'seasons': []}, 'matches': [], 'evaluations': [], 'media': [], 'scouting': {}}, open(tiny, 'w'))
            await pg.click('#hcBkBtn,#hcBackupButton,#hcSingleBackupBtn'); await pg.wait_for_timeout(300)
            await pg.set_input_files('#hcCleanFile', tiny); await pg.wait_for_timeout(9000)
            check('Fusionar una copia SIN imágenes conserva las existentes', await pg.evaluate(MEDIA) == m0 and m0 >= 1, f'antes {m0}, después {await pg.evaluate(MEDIA)}')
            mode['v'] = 'replace'; downloads.clear()
            await pg.click('#hcBkBtn,#hcBackupButton,#hcSingleBackupBtn'); await pg.wait_for_timeout(300)
            await pg.set_input_files('#hcCleanFile', tiny); await pg.wait_for_timeout(12000)
            check('Reemplazar con una copia SIN imágenes NO borra las imágenes', await pg.evaluate(MEDIA) == m0, f'antes {m0}, después {await pg.evaluate(MEDIA)}')
            check('Reemplazar descarga antes una copia automática', any('Copia_Completa' in d for d in downloads), str(downloads))
            mode['v'] = 'merge'

            if A.backup and os.path.exists(A.backup):
                print('\n== 8. Con tu copia real (' + os.path.basename(A.backup) + ')')
                await pg.click('#hcBkBtn,#hcBackupButton,#hcSingleBackupBtn'); await pg.wait_for_timeout(300)
                await pg.set_input_files('#hcCleanFile', A.backup); await pg.wait_for_timeout(30000)
                bk = json.load(open(A.backup, encoding='utf-8')); mm = bk['main']
                C = "()=>({teams:state.teams.length,ex:state.exercises.length,micros:state.seasons.reduce((a,s)=>a+s.micros.length,0),players:state.teams.reduce((a,t)=>a+t.players.length,0)})"
                got = await pg.evaluate(C)
                check('Restaura todos los equipos, ejercicios y microciclos', got['ex'] >= len(mm['exercises']) and got['teams'] >= len(mm['teams']), str(got))
                check('Restaura todos los archivos multimedia', await pg.evaluate(MEDIA) >= len(bk.get('media', [])), f"{await pg.evaluate(MEDIA)} / {len(bk.get('media', []))}")
                await pg.click('nav button[data-page="planning"]'); await pg.wait_for_timeout(800)
                await pg.evaluate("()=>{const t=state.teams.find(x=>x.sport!=='x'&&state.seasons.some(s=>s.micros.some(m=>m.sessions.some(z=>z.teamId===x.id))));if(t){state.selectedTeam=t.id}}")
                n0 = await pg.evaluate("()=>state.seasons.reduce((a,s)=>a+s.micros.reduce((b,m)=>b+m.sessions.length,0),0)")
                if await pg.query_selector('#sessionDetail .vtc-dup'):
                    await pg.click('#sessionDetail .vtc-dup'); await pg.wait_for_timeout(800)
                    n1 = await pg.evaluate("()=>state.seasons.reduce((a,s)=>a+s.micros.reduce((b,m)=>b+m.sessions.length,0),0)")
                    check('Duplicar sesión', n1 == n0 + 1, f'{n0} → {n1}')
                else: skip('Duplicar sesión', 'no hay sesión seleccionada')
                if await pg.query_selector('#vtcPdfMulti'):
                    await pg.click('#vtcPdfMulti'); await pg.wait_for_timeout(500); await pg.click('#vtcPdfAll'); await pg.click('#vtcPdfGo'); await pg.wait_for_timeout(2500)
                    r = await pg.evaluate("()=>{const m=document.querySelector('#modalBox .pdf-preview');return m?{b:m.querySelectorAll('.pdf-session-block').length,s:[...m.querySelectorAll('.pdf-session-block')].filter(x=>(x.getAttribute('style')||'').includes('page-break-before')).length,i:m.querySelectorAll('img').length}:null}")
                    check('PDF de varias sesiones: bloques, saltos de página e imágenes', bool(r) and r['b'] > 1 and r['s'] == r['b'] - 1 and r['i'] > 0, str(r))
                else: skip('PDF de varias sesiones', 'no se mostró el botón')
                await pg.evaluate("()=>closeModal()")
                c2 = await pg.evaluate(C); await pg.click('#hcBkBtn,#hcBackupButton,#hcSingleBackupBtn'); await pg.wait_for_timeout(300)
                await pg.set_input_files('#hcCleanFile', A.backup); await pg.wait_for_timeout(30000)
                c3 = await pg.evaluate(C)
                check('Fusionar dos veces no duplica equipos ni ejercicios', c3['teams'] == c2['teams'] and c3['ex'] == c2['ex'], f'{c2} → {c3}')
            else:
                print('\n== 8. Con copia real: omitido (usa --backup)'); skip('Pruebas con copia real', 'no se indicó --backup')

            check('Sin errores de JavaScript durante toda la batería', not errs, str(errs[:3]))
            await ctx.close()
    finally:
        srv.terminate()
    ok = sum(1 for r in RES if r[1] == 'OK'); bad = [r for r in RES if r[1] == 'FALLO']; sk = sum(1 for r in RES if r[1] == 'OMITIDA')
    print(f'\nRESULTADO: {ok} correctas, {len(bad)} con fallo, {sk} omitidas')
    for r in bad: print('  FALLO:', r[0], r[2])
    sys.exit(1 if bad else 0)
asyncio.run(main())
