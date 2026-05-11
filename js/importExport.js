/** IMPORTACIÓN */
        const parseBible = (json) => {
            let res = [];
            const ver = json.local_title || "Biblia";
            // Normalizar nombres canónicos de libros al importar
            const canonicalName = (rawName) => {
                if (!rawName) return rawName;
                const n = normalizeBookName(rawName);
                // Mapa de nombre normalizado → nombre canónico en español
                const canon = {
                    'salmos': 'Salmos', 'salmo': 'Salmos',
                    'cantares': 'Cantares', 'cantar de los cantares': 'Cantares',
                    'hechos': 'Hechos', 'hechos de los apostoles': 'Hechos',
                };
                return canon[n] || rawName;
            };
            const ext = (n, b, c) => {
                if (!n) return;
                if (Array.isArray(n)) n.forEach(x => ext(x, b, c));
                else if (n.type === 'verse' || (n.verse_numbers && n.lines)) {
                    // Generar una entrada por cada número en verse_numbers
                    const nums = (n.verse_numbers && n.verse_numbers.length > 0)
                        ? n.verse_numbers
                        : [n.num || "1"];
                    const sharedText = n.lines ? n.lines.join(" ") : n.text;
                    nums.forEach(v => {
                        let bNorm = canonicalName(b);
                        let info = getBookInfo(bNorm);
                        let reference = `${c}:${v}`;
                        let ex = currentData.find(x => x.type === 'verse' && x.book === bNorm && x.reference === reference && (!x.text));
                        let verseObj = {
                            id: ex ? ex.id : `v_${ver}_${bNorm}_${c}_${v}`,
                            type: 'verse',
                            version: ver,
                            testament: info.testament,
                            category: info.category,
                            book: bNorm,
                            chapter: c,
                            reference: reference,
                            text: sharedText
                        };
                        if (ex) {
                            if (ex.base_perspectives) verseObj.base_perspectives = ex.base_perspectives;
                            if (ex.perspectives) verseObj.perspectives = ex.perspectives;
                            if (ex.tags) verseObj.tags = ex.tags;
                            if (ex.cross_references) verseObj.cross_references = ex.cross_references;
                        }
                        res.push(verseObj);
                    });
                } else ['contents', 'content', 'items', 'verses'].forEach(k => n[k] && ext(n[k], b, c));
            };
            if (json.books) json.books.forEach(b => b.chapters && b.chapters.forEach(c => ext(c, b.name, c.chapter_usfm ? c.chapter_usfm.split('.').pop() : "1")));
            else if (Array.isArray(json)) return json;
            return res;
        };

        const saveChunks = (data, start, cb) => {
            const chunk = data.slice(start, start + 2500);
            if (chunk.length === 0) { toast("¡Carga completa!", true); if (cb) cb(); return; }
            if (!db) return;
            let tx = db.transaction(['verses'], 'readwrite');
            chunk.forEach(x => tx.objectStore('verses').put(x));
            tx.oncomplete = () => {
                toast(`Indexando: ${Math.round((start + chunk.length) / data.length * 100)}%`);
                setTimeout(() => saveChunks(data, start + 2500, cb), 5);
            };
        };

        document.getElementById('btn-import').onclick = () => document.getElementById('file-import').click();
        document.getElementById('file-import').onchange = (e) => {
            const f = e.target.files[0]; if (!f) return;
            const r = new FileReader();
            r.onload = (ev) => {
                const json = JSON.parse(ev.target.result);
                const parsed = parseBible(json);
                if (db) {
                    let tx = db.transaction(['verses'], 'readwrite');
                    currentData.filter(x => x.version === "Biblia Demo").forEach(d => tx.objectStore('verses').delete(d.id));
                    tx.oncomplete = () => { localStorage.setItem('db_cleared', 'true'); saveChunks(parsed, 0, () => { loadData().then(renderSidebarBooks); }); };
                }
            };
            r.readAsText(f);
        };

        document.getElementById('btn-import-study').onclick = () => document.getElementById('file-import-study').click();
        document.getElementById('file-import-study').onchange = (e) => {
            const f = e.target.files[0]; if (!f) return;
            const r = new FileReader();
            r.onload = (ev) => {
                toast("Procesando estudio bíblico...", true);
                const study = JSON.parse(ev.target.result);
                if (!db) return;
                
                let dbMap = new Map();
                let bookNameMap = new Map();
                currentData.forEach(x => {
                    let nb = normalizeBookName(x.book);
                    if (x.type === 'verse') dbMap.set("verse_" + nb + "_" + x.reference, x);
                    else if (x.type === 'chapter_note') dbMap.set("chapter_note_" + nb + "_" + x.chapter, x);
                    else if (x.type === 'book_note') dbMap.set("book_note_" + nb, x);
                    else if (x.type === 'category_note') dbMap.set("category_note_" + x.category, x);
                    else if (x.type === 'testament_note') dbMap.set("testament_note_" + x.testament, x);
                    
                    if (x.book) bookNameMap.set(nb, x.book);
                });

                let toSave = [];
                study.forEach(s => {
                    const stype = s.type || 'verse';
                    let nb = normalizeBookName(s.book);
                    if (bookNameMap.has(nb)) s.book = bookNameMap.get(nb);

                    let key = stype + "_";
                    if (stype === 'verse') key += nb + "_" + s.reference;
                    else if (stype === 'chapter_note') key += nb + "_" + s.chapter;
                    else if (stype === 'book_note') key += nb;
                    else if (stype === 'category_note') key += s.category;
                    else if (stype === 'testament_note') key += s.testament;
                    
                    let ex = dbMap.get(key);
                    
                    if (ex) {
                        ex.base_perspectives = { ...ex.base_perspectives, ...s.perspectives };
                        if (stype === 'verse') {
                            if (s.tags) ex.tags = [...new Set([...(ex.tags || []), ...s.tags])];
                            if (s.cross_references) ex.cross_references = [...new Set([...(ex.cross_references || []), ...s.cross_references])];
                        }
                        toSave.push(ex);
                    } else {
                        s.id = s.id || ((stype === 'verse' ? "s_" : "n_") + Math.random());
                        s.type = stype;
                        s.base_perspectives = s.perspectives;
                        toSave.push(s);
                    }
                });
                
                saveChunks(toSave, 0, () => { loadData().then(() => switchTab(activeTab)); });
            };
            r.readAsText(f);
        };

        document.getElementById('btn-export-unified').onclick = () => {
            const exportData = currentData.map(v => { let exp = { ...v }; delete exp.perspectives; delete exp.tags; return exp; });
            const a = document.createElement('a'); a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData)); a.download = "biblia_estudio_unificada.json"; a.click();
        };

/** BORRAR TODO */
        document.getElementById('btn-clear-db').onclick = () => {
            const pin = prompt("⚠️ ZONA DE PELIGRO\nPara borrar la base de datos, ingrese el PIN de seguridad:");
            if (pin !== "1234") {
                if (pin !== null) alert("PIN incorrecto. Operación cancelada.");
                return;
            }
            if (!confirm("Se va a proceder a borrar toda la base de datos.\n¿Está seguro? Se generarán copias de seguridad automáticas antes de borrar.")) return;

            toast("Generando backups...", true);
            
            // 1. Export Unified (Biblia + Estudio base)
            const exportData = currentData.map(v => { let exp = { ...v }; delete exp.perspectives; delete exp.tags; return exp; });
            const a1 = document.createElement('a'); 
            a1.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData)); 
            a1.download = "biblia_backup_unificada.json"; 
            a1.click();

            // 2. Export Personal Notes (Solo lo que tiene perspectivas, tags o refs cruzadas)
            const personalNotes = currentData.filter(v => (v.perspectives && Object.keys(v.perspectives).length > 0) || (v.tags && v.tags.length > 0) || (v.cross_references && v.cross_references.length > 0))
                .map(v => {
                    let exp = { type: v.type, book: v.book, chapter: v.chapter, reference: v.reference, testament: v.testament, category: v.category };
                    if (v.perspectives) exp.perspectives = v.perspectives;
                    if (v.tags) exp.tags = v.tags;
                    if (v.cross_references) exp.cross_references = v.cross_references;
                    return exp;
                });
            
            setTimeout(() => {
                const a2 = document.createElement('a');
                a2.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(personalNotes));
                a2.download = "biblia_backup_mis_notas.json";
                a2.click();
                
                // 3. Borrar de la base de datos (con leve retraso para que las descargas inicien)
                setTimeout(() => {
                    if (!db) return;
                    let tx = db.transaction(['verses'], 'readwrite');
                    tx.objectStore('verses').clear();
                    tx.oncomplete = () => { localStorage.setItem('db_cleared', 'true'); location.reload(); };
                }, 1000);
            }, 500);
        };