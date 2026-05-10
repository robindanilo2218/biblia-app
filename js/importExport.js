/** IMPORTACIÓN */
        const parseBible = (json) => {
            let res = [];
            const ver = json.local_title || "Biblia";
            const ext = (n, b, c) => {
                if (!n) return;
                if (Array.isArray(n)) n.forEach(x => ext(x, b, c));
                else if (n.type === 'verse' || (n.verse_numbers && n.lines)) {
                    let v = n.verse_numbers ? n.verse_numbers[0] : (n.num || "1");
                    let info = getBookInfo(b);
                    res.push({ id: `v_${ver}_${b}_${c}_${v}`, type: 'verse', version: ver, testament: info.testament, category: info.category, book: b, chapter: c, reference: `${c}:${v}`, text: n.lines ? n.lines.join(" ") : n.text });
                } else['contents', 'content', 'items', 'verses'].forEach(k => n[k] && ext(n[k], b, c));
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
                const study = JSON.parse(ev.target.result);
                if (!db) return;
                let tx = db.transaction(['verses'], 'readwrite');
                let store = tx.objectStore('verses');
                                study.forEach(s => {
                    let ex = currentData.find(x => x.type === 'verse' && x.book === s.book && x.reference === s.reference);
                    if (ex) {
                        ex.base_perspectives = { ...ex.base_perspectives, ...s.perspectives };
                        if (s.tags) ex.tags = [...new Set([...(ex.tags || []), ...s.tags])];
                        if (s.cross_references) ex.cross_references = [...new Set([...(ex.cross_references || []), ...s.cross_references])];
                        store.put(ex);
                    }
                    else { s.id = s.id || ("s_" + Math.random()); s.type = 'verse'; s.base_perspectives = s.perspectives; store.put(s); }
                });
                tx.oncomplete = () => { loadData().then(() => switchTab(activeTab)); };
            };
            r.readAsText(f);
        };

        document.getElementById('btn-export-unified').onclick = () => {
            const exportData = currentData.map(v => { let exp = { ...v }; delete exp.perspectives; delete exp.tags; return exp; });
            const a = document.createElement('a'); a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData)); a.download = "biblia_estudio_unificada.json"; a.click();
        };

/** BORRAR TODO */
        document.getElementById('btn-clear-db').onclick = () => {
            if (confirm("¿Borrar todo el contenido local?")) {
                if (!db) return;
                let tx = db.transaction(['verses'], 'readwrite');
                tx.objectStore('verses').clear();
                tx.oncomplete = () => { localStorage.setItem('db_cleared', 'true'); location.reload(); };
            }
        };