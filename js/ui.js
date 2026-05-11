/** MOTOR DE VISTA */
        const pushHistory = (fn, params) => {
            if (historyStack.length > 0) {
                let last = historyStack[historyStack.length - 1];
                if (last.fn === fn && JSON.stringify(last.params) === JSON.stringify(params)) return;
            }
            historyStack.push({ fn, params });
            if (btnBack) btnBack.style.display = historyStack.length > 1 ? 'block' : 'none';
        };

        if (btnBack) {
            btnBack.onclick = () => {
                if (historyStack.length > 1) {
                    historyStack.pop();
                    let prev = historyStack[historyStack.length - 1];
                    window[prev.fn](...prev.params, true);
                }
                btnBack.style.display = historyStack.length > 1 ? 'block' : 'none';
            };
        }

        const setEditor = (target, placeholder) => {
            editorTarget = target;
            if (globalEditor) globalEditor.style.display = 'block';
            if (editorContainer) editorContainer.style.display = 'none';
            const nameInp = document.getElementById('new-persp-name');
            const textInp = document.getElementById('new-persp-text');
            if (nameInp) { nameInp.placeholder = placeholder; nameInp.value = ''; }
            if (textInp) textInp.value = '';
        };

        window.viewSingleVerse = (id, fromHistory = false) => {
            if (!fromHistory) pushHistory('viewSingleVerse', [id]);
            if (!mainView) return;
            mainView.innerHTML = '';
            const v = currentData.find(x => x.id === id);
            if (!v) return;

            mainView.innerHTML = `
                <div class="verse-card">
                    <h2>${v.book} ${v.reference}</h2>
                    <p style="font-size:1.4rem; font-style:italic;">"${v.text || ''}"</p>
                    ${v.tags && v.tags.length > 0 ? `<div class="verse-tags">${v.tags.map(t => `<span>#${t}</span>`).join('')}</div>` : ''}
                </div>
                <div id="v-sections">
                    ${v.base_perspectives ? `<h3 class="study-section-title">📚 Estudio Bíblico</h3><div class="perspective-selector" id="b-btns"></div><div id="b-cont" class="perspective-content" style="display:none; border-color:var(--secondary);"></div>` : ''}
                    <h3 class="study-section-title">✍️ Mis Notas Personales</h3><div class="perspective-selector" id="p-btns"></div><div id="p-cont" class="perspective-content" style="display:none;"></div>
                    ${v.cross_references && v.cross_references.length > 0 ? `<h3 class="study-section-title">🔗 Referencias Cruzadas</h3><div id="cross-ref-list" style="margin-top:8px;"></div>` : ''}
                </div>
            `;
            setEditor({ type: 'verse', id: v.id }, "Título de mi nota personal...");

            const fill = (data, btnDivId, contDivId, isBase) => {
                const btnDiv = document.getElementById(btnDivId);
                const contDiv = document.getElementById(contDivId);
                if (!data || !btnDiv) return;
                Object.keys(data).forEach((k, i) => {
                    let btn = document.createElement('button');
                    btn.className = isBase ? 'btn-persp base-study' : 'btn-persp';
                    btn.textContent = k.replace(/_/g, ' ').toUpperCase();
                    btn.onclick = () => {
                        const selector = isBase ? '.base-study' : '.btn-persp:not(.base-study)';
                        document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        contDiv.style.display = 'block';
                        contDiv.innerHTML = `<h3>${btn.textContent}</h3><p>${data[k]}</p>`;
                        if (!isBase) {
                            document.getElementById('new-persp-name').value = k;
                            document.getElementById('new-persp-text').value = data[k];
                        }
                    };
                    btnDiv.appendChild(btn);
                    if (i === 0) btn.click();
                });
            };
            fill(v.base_perspectives, 'b-btns', 'b-cont', true);
            fill(v.perspectives, 'p-btns', 'p-cont', false);

            // Renderizar referencias cruzadas con contenido real
            if (v.cross_references && v.cross_references.length > 0) {
                const crList = document.getElementById('cross-ref-list');
                if (crList) {
                    let lastBookCr = null, lastChapCr = null;
                    v.cross_references.forEach(ref => {
                        const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
                        if (!m) return;
                        const bName = m[1], chapNum = m[2], verNum = m[3];
                        const found = currentData.find(x => x.type === 'verse' &&
                            normalizeBookName(x.book) === normalizeBookName(bName) &&
                            (x.chapter === chapNum || (x.reference||'').startsWith(chapNum+':')) &&
                            (x.reference||'').endsWith(':'+verNum));
                        
                        // Separador de libro
                        if (bName !== lastBookCr) {
                            const bd = document.createElement('div');
                            bd.style.cssText = 'background:var(--primary);color:white;padding:6px 12px;margin:12px 0 4px;border-radius:6px;font-weight:bold;font-size:0.95rem;';
                            bd.textContent = `📖 ${bName}`;
                            crList.appendChild(bd);
                            lastBookCr = bName; lastChapCr = null;
                        }
                        // Separador de capítulo
                        if (chapNum !== lastChapCr) {
                            const cd = document.createElement('div');
                            cd.style.cssText = 'color:var(--secondary);font-weight:bold;font-size:0.85rem;padding:2px 2px;border-bottom:1px solid var(--secondary);margin-bottom:3px;';
                            cd.textContent = `Capítulo ${chapNum}`;
                            crList.appendChild(cd);
                            lastChapCr = chapNum;
                        }

                        const row = document.createElement('div');
                        row.style.cssText = 'padding:5px 8px;margin:2px 0;border-radius:5px;cursor:pointer;background:#f8f9fa;border-left:3px solid var(--secondary);font-size:0.92rem;';
                        row.innerHTML = found
                            ? `<b style="color:var(--secondary)">${ref}</b> — ${found.text}`
                            : `<b style="color:var(--secondary)">${ref}</b> <i style="opacity:0.5">(no cargado)</i>`;
                        row.onmouseenter = () => row.style.background = '#e8f4f8';
                        row.onmouseleave = () => row.style.background = '#f8f9fa';
                        if (found) row.onclick = () => window.viewSingleVerse(found.id);
                        crList.appendChild(row);
                    });
                }
            }
        };

        window.viewReading = (title, items, target, fromHistory = false) => {
            if (!fromHistory) pushHistory('viewReading', [title, items, target]);
            if (!mainView) return;
            mainView.innerHTML = '';

            const verses = items.filter(x => x.type === 'verse').sort((a, b) => {
                let idxA = BIBLE_BOOKS.indexOf(normalizeBookName(a.book));
                let idxB = BIBLE_BOOKS.indexOf(normalizeBookName(b.book));
                return (idxA - idxB) || (parseInt(a.chapter) - parseInt(b.chapter)) || (parseInt((a.reference||'').split(':')[1]) - parseInt((b.reference||'').split(':')[1]));
            });

            // 1. Detectar notas repetidas POR CAPÍTULO
            // Si una nota aparece en 2+ versículos del mismo capítulo = nota de libro/cap, filtrarla del tooltip
            const chapNoteSets = {}; // { "book_cap": Set(valores repetidos) }
            const chapGroups = {};
            verses.forEach(v => {
                const cKey = `${normalizeBookName(v.book)}_${v.chapter || (v.reference||'').split(':')[0]}`;
                if (!chapGroups[cKey]) chapGroups[cKey] = [];
                chapGroups[cKey].push(v);
            });
            Object.entries(chapGroups).forEach(([cKey, cvs]) => {
                const cnt = {};
                cvs.forEach(v => {
                    if (v.base_perspectives) Object.values(v.base_perspectives).forEach(val => { cnt[val] = (cnt[val]||0)+1; });
                });
                const rep = new Set();
                Object.entries(cnt).forEach(([val, c]) => { if (c > 1) rep.add(val); });
                chapNoteSets[cKey] = rep;
            });

            mainView.innerHTML = `
                <div class="sticky-tracker" style="display:flex; justify-content:space-between; align-items:center;">
                    <div id="tracker-ref" class="tracker-info">${title}</div>
                    <div class="tracker-nav" id="tracker-nav">
                        ${target.type === 'chapter' ? '<button id="tr-prev" style="display:none;">⬅️</button><button id="tr-next" style="display:none;">➡️</button>' : ''}
                        <button id="btn-range-toggle" title="Filtrar por Rango" style="margin-left:10px; background:var(--secondary); border:none; border-radius:50%; width:28px; height:28px; color:white; font-weight:bold; cursor:pointer; font-size:1.1rem; line-height:1;">+</button>
                    </div>
                </div>
                <div id="range-selector" style="display:none; background:var(--primary); color:white; padding:10px; border-radius:0 0 10px 10px; margin-top:-15px; margin-bottom:15px; z-index:49; position:relative; box-shadow:0 4px 10px rgba(0,0,0,0.2); justify-content:center; align-items:center; gap:10px; flex-wrap:wrap;">
                    <span>Versículos del</span>
                    <input type="number" id="range-start" style="width:60px; border-radius:5px; border:none; padding:4px; text-align:center;" min="1" placeholder="Ini"> 
                    <span>al</span>
                    <input type="number" id="range-end" style="width:60px; border-radius:5px; border:none; padding:4px; text-align:center;" min="1" placeholder="Fin">
                    <button id="btn-apply-range" style="background:var(--secondary); border:none; color:white; padding:5px 12px; border-radius:5px; cursor:pointer; font-weight:bold;">Filtrar</button>
                    <button id="btn-clear-range" style="background:#e74c3c; border:none; color:white; padding:5px 12px; border-radius:5px; cursor:pointer; font-weight:bold;" title="Borrar Filtro">X</button>
                </div>
                <div class="reading-container">
                    <h2>${title}</h2>
                    <div id="notes-top"></div>
                    <div id="read-text"></div>
                </div>`;

            // Event listeners para rango de versículos
            const btnRangeToggle = document.getElementById('btn-range-toggle');
            const rangeSelector = document.getElementById('range-selector');
            if(btnRangeToggle) {
                btnRangeToggle.onclick = () => {
                    rangeSelector.style.display = rangeSelector.style.display === 'none' ? 'flex' : 'none';
                    if (rangeSelector.style.display === 'flex' && window.currentTrackerRef) {
                        document.getElementById('range-start').value = window.currentTrackerRef.verse;
                        document.getElementById('range-end').value = window.currentTrackerRef.verse;
                    }
                };
            }
            const btnApplyRange = document.getElementById('btn-apply-range');
            if (btnApplyRange) btnApplyRange.onclick = () => {
                let s = parseInt(document.getElementById('range-start').value);
                let e = parseInt(document.getElementById('range-end').value);
                if (isNaN(s) || isNaN(e)) return;
                if (s > e) [s, e] = [e, s];
                document.querySelectorAll('.verse-text-span').forEach(span => {
                    // data-ref = "Libro Cap:Ver" — extraer el número de versículo después de ':'
                    const ref = span.dataset.ref || '';
                    const colon = ref.lastIndexOf(':');
                    if (colon !== -1) {
                        const vn = parseInt(ref.substring(colon + 1));
                        span.style.display = (!isNaN(vn) && vn >= s && vn <= e) ? 'inline' : 'none';
                    }
                });
            };
            const btnClearRange = document.getElementById('btn-clear-range');
            if (btnClearRange) btnClearRange.onclick = () => {
                document.getElementById('range-start').value = '';
                document.getElementById('range-end').value = '';
                document.querySelectorAll('.verse-text-span').forEach(span => span.style.display = 'inline');
            };

            // Notas del nivel actual (testamento/categoría/libro/capítulo)
            const notesTop = document.getElementById('notes-top');
            const notes = currentData.filter(x => {
                if (x.type !== target.type + '_note') return false;
                if (target.type === 'chapter') return normalizeBookName(x.book) === normalizeBookName(target.book) && x.chapter === target.chapter;
                if (target.type === 'book') return normalizeBookName(x.book) === normalizeBookName(target.book);
                if (target.type === 'category') return x.category === target.category;
                if (target.type === 'testament') return x.testament === target.testament;
                return false;
            });
            notes.forEach(n => {
                if (n.base_perspectives) Object.entries(n.base_perspectives).forEach(([k, v]) => notesTop.innerHTML += `<div class="level-note-card"><h4>📚 ${k}</h4><p>${v}</p></div>`);
                if (n.perspectives) Object.entries(n.perspectives).forEach(([k, v]) => notesTop.innerHTML += `<div class="level-note-card personal"><h4>✍️ ${k}</h4><p>${v}</p></div>`);
            });

            // Tracker de posición
            window.currentTrackerRef = null;
            window.globalUpdateTracker = (refStr, version) => {
                if (!refStr) return;
                const match = refStr.match(/^(.*?)\s+(\d+):(\d+)(?:\s*-\s*\d+)?$/);
                if (!match) return;
                window.currentTrackerRef = { book: match[1], chapter: parseInt(match[2]), verse: parseInt(match[3]), version: version || (window.currentTrackerRef && window.currentTrackerRef.version) || null };
                const t = document.getElementById('tracker-ref');
                if (!t) return;
                t.innerHTML = `
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:0.85rem;">
                        <button onclick="window.navTracker('verse',-1)" style="background:transparent;border:none;color:white;cursor:pointer;font-size:1.1rem;">◀</button>
                        <div style="display:flex;flex-direction:column;align-items:center;">
                            <button onclick="window.navTracker('book',-1)" style="background:transparent;border:none;color:white;cursor:pointer;font-size:0.75rem;line-height:1;">▲</button>
                            <b style="white-space:nowrap;">${match[1]}</b>
                            <button onclick="window.navTracker('book',1)" style="background:transparent;border:none;color:white;cursor:pointer;font-size:0.75rem;line-height:1;">▼</button>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center;">
                            <button onclick="window.navTracker('chapter',-1)" style="background:transparent;border:none;color:white;cursor:pointer;font-size:0.75rem;line-height:1;">▲</button>
                            <b style="white-space:nowrap;">Cap.${match[2]}</b>
                            <button onclick="window.navTracker('chapter',1)" style="background:transparent;border:none;color:white;cursor:pointer;font-size:0.75rem;line-height:1;">▼</button>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center;">
                            <button onclick="window.navTracker('verse',-1)" style="background:transparent;border:none;color:white;cursor:pointer;font-size:0.75rem;line-height:1;">▲</button>
                            <b style="white-space:nowrap;">v.${match[3]}</b>
                            <button onclick="window.navTracker('verse',1)" style="background:transparent;border:none;color:white;cursor:pointer;font-size:0.75rem;line-height:1;">▼</button>
                        </div>
                        <button onclick="window.navTracker('verse',1)" style="background:transparent;border:none;color:white;cursor:pointer;font-size:1.1rem;">▶</button>
                    </div>`;
            };

            // Observer de lectura activa
            const readText = document.getElementById('read-text');
            if (readingObserver) readingObserver.disconnect();
            window.manualHighlightMode = false;
            let currentlyVisibleVerses = new Set();
            readingObserver = new IntersectionObserver(es => {
                if (window.manualHighlightMode) return;
                es.forEach(e => {
                    if (e.isIntersecting) currentlyVisibleVerses.add(e.target);
                    else { currentlyVisibleVerses.delete(e.target); e.target.classList.remove('active-reading'); }
                });
                let activeVerse = null, minDiff = Infinity, centerY = window.innerHeight / 2;
                currentlyVisibleVerses.forEach(el => {
                    let rect = el.getBoundingClientRect();
                    let diff = Math.abs(rect.top + rect.height/2 - centerY);
                    if (diff < minDiff) { minDiff = diff; activeVerse = el; }
                });
                document.querySelectorAll('.active-reading').forEach(el => { if (el !== activeVerse) el.classList.remove('active-reading'); });
                if (activeVerse) {
                    activeVerse.classList.add('active-reading');
                    if(window.globalUpdateTracker) window.globalUpdateTracker(activeVerse.dataset.ref, activeVerse.dataset.version);
                }
            }, { rootMargin: '-20% 0px -20% 0px' });

            // Renderizar versículos con separadores libro/capítulo en vistas multi-capítulo
            const isMultiCap = (target.type !== 'chapter');
            let lastBook = null, lastChap = null;
            verses.forEach(v => {
                const vChap = v.chapter || (v.reference||'').split(':')[0];
                // Separador libro
                if (isMultiCap && v.book !== lastBook) {
                    const bd = document.createElement('div');
                    bd.style.cssText = 'background:var(--primary);color:white;padding:10px 14px;margin:20px 0 6px;border-radius:8px;font-weight:bold;font-size:1.05rem;box-shadow:0 2px 6px rgba(0,0,0,0.2);';
                    bd.textContent = `📖 ${v.book}`;
                    readText.appendChild(bd);
                    lastBook = v.book; lastChap = null;
                }
                // Separador capítulo
                if (isMultiCap && vChap !== lastChap) {
                    const cd = document.createElement('div');
                    cd.style.cssText = 'color:var(--secondary);font-weight:bold;padding:4px 2px;margin-top:10px;border-bottom:2px solid var(--secondary);margin-bottom:4px;';
                    cd.textContent = `Capítulo ${vChap}`;
                    readText.appendChild(cd);
                    lastChap = vChap;
                }

                // Calcular notas únicas del versículo (no repetidas en el capítulo)
                const capKey = `${normalizeBookName(v.book)}_${vChap}`;
                const repeatSet = chapNoteSets[capKey] || new Set();
                let bFiltered = [];
                if (v.base_perspectives) {
                    Object.entries(v.base_perspectives).forEach(([k, val]) => {
                        if (!repeatSet.has(val)) bFiltered.push(`<b>${k.replace(/_/g,' ').toUpperCase()}:</b><br>${val}`);
                    });
                }
                let pFiltered = v.perspectives ? Object.entries(v.perspectives).map(([k,val]) => `<b>${k.replace(/_/g,' ').toUpperCase()}:</b><br>${val}`) : [];
                
                // Construir tooltip: tags + notas únicas + referencias cruzadas con contenido
                let ttParts = [];
                if (v.tags?.length) ttParts.push(`<span style="font-size:0.8em;opacity:0.75;">${v.tags.map(t=>'#'+t).join(' ')}</span>`);
                if (bFiltered.length) ttParts.push(...bFiltered);
                if (pFiltered.length) ttParts.push(...pFiltered);

                // Referencias cruzadas con texto del versículo referenciado
                if (v.cross_references?.length) {
                    let crHtml = '<b>🔗 REFERENCIAS:</b>';
                    let lastCrBook = null, lastCrChap = null;
                    v.cross_references.slice(0, 6).forEach(ref => {
                        const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
                        if (!m) return;
                        const found = currentData.find(x => x.type === 'verse' &&
                            normalizeBookName(x.book) === normalizeBookName(m[1]) &&
                            (x.reference||'').endsWith(':'+m[3]) &&
                            (x.chapter === m[2] || (x.reference||'').startsWith(m[2]+':')));
                        if (m[1] !== lastCrBook) { crHtml += `<br><b style="color:#aef;">${m[1]}</b>`; lastCrBook = m[1]; lastCrChap = null; }
                        if (m[2] !== lastCrChap) { crHtml += ` <i>Cap.${m[2]}</i>`; lastCrChap = m[2]; }
                        crHtml += `<br><span style="font-size:0.85em;"><b>${m[3]}.</b> ${found ? found.text : ref}</span>`;
                    });
                    ttParts.push(crHtml);
                }

                const tt = ttParts.join('<hr style="margin:4px 0;opacity:0.3;">');
                const hasDot = bFiltered.length > 0 || pFiltered.length > 0;
                const hasRef = v.cross_references?.length > 0;
                const dot = (hasDot ? `<span class="has-persp-dot base"></span>` : '') + (hasRef ? `<span class="has-persp-dot" style="background:#3498db;width:6px;height:6px;"></span>` : '');
                
                let span = document.createElement('span');
                span.className = tt ? 'verse-text-span tooltip' : 'verse-text-span';
                span.dataset.ref = `${v.book} ${v.reference}`;
                span.dataset.version = v.version || '';
                // Extraer número de versículo de forma segura
                const refStr = v.reference || '';
                const colonIdx = refStr.lastIndexOf(':');
                const vNum = colonIdx !== -1 ? refStr.substring(colonIdx + 1) : refStr;
                span.innerHTML = `<span class="verse-num">${vNum}</span>${v.text || ''} ${dot}${tt ? `<span class="tooltiptext">${tt}</span>` : ''}`;
                span.onclick = () => viewSingleVerse(v.id);
                readText.appendChild(span);
                readingObserver.observe(span);
            });

            if (target.type === 'chapter') {
                const p = document.getElementById('tr-prev');
                const n = document.getElementById('tr-next');
                if (p) p.onclick = () => navTracker('chapter', -1);
                if (n) n.onclick = () => navTracker('chapter', 1);
            }
            setEditor(target, "Añadir nota a este bloque...");
        };

        const nav = (t, off) => {
            const all = currentData.filter(x => x.type === 'verse' && x.version === t.version);
            const chaps = []; const seen = new Set();
            all.forEach(v => { let k = v.book + "_" + v.chapter; if (!seen.has(k)) { seen.add(k); chaps.push({ b: v.book, c: v.chapter }); } });
            let idx = chaps.findIndex(x => x.b === t.book && x.c === t.chapter);
            if (idx !== -1 && chaps[idx + off]) {
                let n = chaps[idx + off];
                viewReading(`${n.b} ${n.c}`, all.filter(x => x.book === n.b && x.chapter === n.c), { type: 'chapter', version: t.version, book: n.b, chapter: n.c });
                const sc = document.getElementById('scrollable-content');
                if (sc) sc.scrollTop = 0;
            }
        };

        window.navTracker = (type, dir) => {
            try {
                if (!window.currentTrackerRef) { alert("Ref null"); return; }
                let { book, chapter, verse } = window.currentTrackerRef;
                let bIdx = BIBLE_BOOKS.indexOf(normalizeBookName(book));
                if (bIdx === -1) { alert("Libro no encontrado en índice"); return; }
                
                if (type === 'book') {
                    bIdx += dir;
                    if (bIdx < 0 || bIdx >= BIBLE_BOOKS.length) return;
                    book = BIBLE_BOOKS[bIdx];
                } else if (type === 'chapter') {
                    chapter += dir;
                } else if (type === 'verse') {
                    verse += dir;
                }
                
                window.navToBCV(book, chapter, verse);
            } catch(e) {
                alert("Error navTracker: " + e.message);
            }
        };

        window.navToBCV = (bName, cNum, vNum) => {
            try {
                let bReal = normalizeBookName(bName);
                // Obtener versión del trackerRef o del primer versículo en currentData
                let version = (window.currentTrackerRef && window.currentTrackerRef.version) || null;
                let allVerses = currentData.filter(x => x.type === 'verse');
                if (!version && allVerses.length > 0) version = allVerses[0].version;
                let all = version ? allVerses.filter(x => x.version === version) : allVerses;
                
                let inBook = all.filter(x => normalizeBookName(x.book) === bReal);
                if (inBook.length === 0) {
                    // Intentar sin normalización estricta (buscar por includes)
                    inBook = all.filter(x => x.book && normalizeBookName(x.book).includes(bReal.substring(0,5)));
                    if (inBook.length === 0) { alert(`Libro vacío: '${bReal}' en ${all.length} versículos`); return; }
                }
                
                const getC = (x) => parseInt(x.chapter) || parseInt((x.reference||'0:0').split(':')[0]);
                const getV = (x) => parseInt((x.reference||'0:0').split(':')[1]);

                let maxChap = Math.max(...inBook.map(getC));
                if (cNum > maxChap) { cNum = 1; let bIdx = BIBLE_BOOKS.indexOf(bReal); if(bIdx < BIBLE_BOOKS.length-1) bReal = BIBLE_BOOKS[bIdx+1]; inBook = all.filter(x => normalizeBookName(x.book) === bReal); maxChap = Math.max(...inBook.map(getC)); }
                if (cNum < 1) { let bIdx = BIBLE_BOOKS.indexOf(bReal); if(bIdx > 0) bReal = BIBLE_BOOKS[bIdx-1]; inBook = all.filter(x => normalizeBookName(x.book) === bReal); maxChap = Math.max(...inBook.map(getC)); cNum = maxChap; }
                
                let inChap = inBook.filter(x => getC(x) === cNum);
                if (inChap.length === 0) { alert("Capitulo vacio"); return; }
                
                let maxVerse = Math.max(...inChap.map(getV));
                if (vNum > maxVerse) {
                    if (cNum < maxChap) {
                        cNum++;
                        vNum = 1;
                        inChap = inBook.filter(x => getC(x) === cNum);
                    } else {
                        let bIdx = BIBLE_BOOKS.indexOf(bReal);
                        if(bIdx < BIBLE_BOOKS.length-1) {
                            bReal = BIBLE_BOOKS[bIdx+1];
                            cNum = 1;
                            vNum = 1;
                            inBook = all.filter(x => normalizeBookName(x.book) === bReal);
                            inChap = inBook.filter(x => getC(x) === cNum);
                        } else {
                            vNum = maxVerse;
                        }
                    }
                } else if (vNum < 1) {
                    if (cNum > 1) {
                        cNum--;
                        let prevChap = inBook.filter(x => getC(x) === cNum);
                        vNum = Math.max(...prevChap.map(getV));
                        inChap = prevChap;
                    } else {
                        let bIdx = BIBLE_BOOKS.indexOf(bReal);
                        if(bIdx > 0) {
                            bReal = BIBLE_BOOKS[bIdx-1];
                            inBook = all.filter(x => normalizeBookName(x.book) === bReal);
                            cNum = Math.max(...inBook.map(getC));
                            inChap = inBook.filter(x => getC(x) === cNum);
                            vNum = Math.max(...inChap.map(getV));
                        } else {
                            vNum = 1;
                        }
                    }
                }
                
                let isAlreadyRendered = false;
                let sampleVerse = document.querySelector('.verse-text-span');
                if (sampleVerse && sampleVerse.dataset.ref) {
                    let match = sampleVerse.dataset.ref.match(/^(.*?)\s+(\d+):/);
                    if (match && normalizeBookName(match[1]) === bReal && parseInt(match[2]) === cNum) {
                        isAlreadyRendered = true;
                    }
                }
                
                if (isAlreadyRendered) {
                    if(window.currentTrackerRef) window.currentTrackerRef.verse = vNum;
                    window.scrollToVerseAndHighlight(bReal, cNum, vNum);
                } else {
                    let newBookOriginal = inChap[0].book;
                    window.viewReading(`${newBookOriginal} ${cNum}`, inChap, { type: 'chapter', version: version, book: newBookOriginal, chapter: cNum.toString() });
                    setTimeout(() => window.scrollToVerseAndHighlight(bReal, cNum, vNum), 150);
                }
            } catch(e) {
                alert("Error navToBCV: " + e.message);
            }
        };

        window.scrollToVerseAndHighlight = (bReal, cNum, vNum) => {
            try {
                let spans = document.querySelectorAll('.verse-text-span');
                let found = false;
                for (let span of spans) {
                    let ref = span.dataset.ref; 
                    if (ref) {
                        let match = ref.match(/^(.*?)\s+(\d+):(\d+)(?:\s*-\s*\d+)?$/);
                        if (match && normalizeBookName(match[1]) === bReal && parseInt(match[2]) === cNum && parseInt(match[3]) === vNum) {
                            window.manualHighlightMode = true;
                            document.querySelectorAll('.active-reading').forEach(el => el.classList.remove('active-reading'));
                            span.classList.add('active-reading');
                            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            if(window.globalUpdateTracker) window.globalUpdateTracker(ref, span.dataset.version);
                        
                        clearTimeout(window.manualHighlightTimer);
                        window.manualHighlightTimer = setTimeout(() => {
                            window.manualHighlightMode = false;
                        }, 1000);
                            found = true;
                            break;
                        }
                    }
                }
                if(!found) {
                    // Si no lo encuentra, intentar buscar el más cercano o simplemente forzar actualización del tracker con lo que sabemos
                    // Por si vNum es mayor a los versículos renderizados por algún error en la data
                    if(window.globalUpdateTracker && inChap && inChap.length > 0) {
                        // find closest
                    }
                }
            } catch(e) {
                alert("Error scrollToVerse: " + e.message);
            }
        };

        window.viewSession = (session, fromHistory = false) => {
            if (!fromHistory) pushHistory('viewSession', [session]);
            if (!mainView) return;
            mainView.innerHTML = `
                <div class="verse-card" style="margin-bottom:20px; background:var(--primary); color:white;">
                    <h2>📅 ${session.title}</h2>
                    <p><b>Fecha:</b> ${session.date}</p>
                    <p style="white-space:pre-wrap; font-size:0.9rem; margin-top:10px; border-top:1px solid rgba(255,255,255,0.3); padding-top:10px;"><b>Contenido de la Sesión:</b><br>${session.refs}</p>
                </div>
                <div id="session-read-text" class="reading-container" style="margin-top:0;"></div>
            `;
            const readText = document.getElementById('session-read-text');
            
            // Parse references
            let lines = session.refs.split(/[,;\n]/).map(x => x.trim()).filter(x => x);
            
            lines.forEach(line => {
                let match = line.match(/(.+?)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?/);
                if(match) {
                    let bName = normalizeBookName(match[1].trim());
                    let chap = match[2];
                    let vStart = parseInt(match[3]);
                    let vEnd = match[4] ? parseInt(match[4]) : vStart;
                    
                    let verses = currentData.filter(v => {
                        if(v.type !== 'verse') return false;
                        if(normalizeBookName(v.book) !== bName) return false;
                        if(v.chapter != chap) return false;
                        let vNum = parseInt((v.reference||'').split(':')[1] || 0);
                        return vNum >= vStart && vNum <= vEnd;
                    });
                    
                    if(verses.length > 0) {
                        let divBlock = document.createElement('div');
                        divBlock.style.marginBottom = '20px';
                        divBlock.innerHTML = `<h3 style="color:var(--primary); border-bottom:2px solid var(--secondary); padding-bottom:5px;">📖 ${match[1].trim()} ${chap}:${vStart}${match[4] ? '-'+match[4] : ''}</h3>`;
                        
                        verses.sort((a,b) => parseInt((a.reference||'').split(':')[1]) - parseInt((b.reference||'').split(':')[1])).forEach(v => {
                            let hasB = v.base_perspectives && Object.keys(v.base_perspectives).length > 0;
                            let hasP = v.perspectives && Object.keys(v.perspectives).length > 0;
                            let span = document.createElement('span');
                            span.className = 'verse-text-span tooltip';
                            
                            let tooltipContent = '';
                            if(session.showStudy && hasB) {
                                tooltipContent += `<b>ESTUDIO:</b><br>${Object.values(v.base_perspectives).join('<br>')}<br><br>`;
                            }
                            if(hasP) {
                                tooltipContent += `<b>MI NOTA:</b><br>${Object.values(v.perspectives).join('<br>')}`;
                            }

                            let vNum = (v.reference && v.reference.includes(':')) ? v.reference.split(':')[1] : (v.reference || '');
                            span.innerHTML = `<span class="verse-num">${vNum}</span>${v.text || ''} ${tooltipContent ? '<span class="has-persp-dot"></span><span class="tooltiptext">'+tooltipContent+'</span>' : ''}`;
                            
                            span.onclick = () => window.viewSingleVerse(v.id);
                            divBlock.appendChild(span);
                            
                            if(session.showStudy && hasB) {
                                let studyDiv = document.createElement('div');
                                studyDiv.style = "background:#f9f9f9; padding:10px; margin:10px 0; border-left:4px solid var(--secondary); font-size:0.95rem; border-radius:5px;";
                                let sText = Object.entries(v.base_perspectives).map(([k,val]) => `<b>${k.replace(/_/g,' ').toUpperCase()}:</b> ${val}`).join('<br><br>');
                                studyDiv.innerHTML = sText;
                                divBlock.appendChild(studyDiv);
                            }
                        });
                        readText.appendChild(divBlock);
                    }
                } else {
                    // Texto libre o búsqueda
                    let matches = currentData.filter(x => x.type === 'verse' && x.text && x.text.toLowerCase().includes(line.toLowerCase()));
                    if(matches.length > 0) {
                        let divBlock = document.createElement('div');
                        divBlock.style.marginBottom = '20px';
                        divBlock.innerHTML = `<h3 style="color:var(--primary); border-bottom:2px solid var(--secondary); padding-bottom:5px;">🔍 Búsqueda rápida: ${line}</h3>`;
                        matches.slice(0, 5).forEach(v => { 
                            let p = document.createElement('p');
                            p.style.cursor = 'pointer';
                            p.style.padding = '5px';
                            p.style.borderBottom = '1px dashed #ccc';
                            p.innerHTML = `<b>${v.book} ${v.reference}:</b> "${v.text}"`;
                            p.onclick = () => window.viewSingleVerse(v.id);
                            divBlock.appendChild(p);
                        });
                        readText.appendChild(divBlock);
                    }
                }
            });
            setEditor({ type: 'session', id: session.id }, "Añadir nota general a la sesión...");
        };