/** MOTOR DE VISTA */
let isTyping = false;

        window.formatVerseText = (text) => {
            if (!text) return '';
            return text.replace(/#([a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_]+)/g, '<span class="hashtag-link" style="color:var(--secondary);cursor:pointer;font-weight:bold;" onclick="event.stopPropagation(); window.goToTopic(\'$1\');">#$1</span>');
        };
        
        window.goToTopic = (topic) => {
            if(typeof switchTab !== 'undefined') switchTab('persp');
            else if(window.switchTab) window.switchTab('persp');
            setTimeout(() => {
                const search = document.getElementById('w-search');
                if (search) {
                    search.value = topic;
                    search.dispatchEvent(new KeyboardEvent('keyup', {'key':'Enter'}));
                }
            }, 150);
        };

        const pushHistory = (fn, params) => {
            if (historyStack.length > 0) {
                let last = historyStack[historyStack.length - 1];
                if (last.fn === fn && JSON.stringify(last.params) === JSON.stringify(params)) return;
            }
            historyStack.push({ fn, params });
            
            if (historyStack.length === 1) {
                window.history.replaceState({ appNav: true, stackLen: 1 }, "");
            } else {
                window.history.pushState({ appNav: true, stackLen: historyStack.length }, "");
            }
            
            if (btnBack) btnBack.style.display = historyStack.length > 1 ? 'flex' : 'none';
        };

        if (btnBack) {
            btnBack.onclick = () => {
                if (historyStack.length > 1) {
                    window.history.back(); // Activa el evento popstate
                }
            };
        }

        window.addEventListener('popstate', (e) => {
            let targetLen = e.state ? e.state.stackLen : 1;
            
            if (targetLen < historyStack.length) {
                let dropCount = historyStack.length - targetLen;
                for(let i=0; i<dropCount; i++) historyStack.pop();
                
                let prev = historyStack[historyStack.length - 1];
                if (prev) window[prev.fn](...prev.params, true);
            } else if (targetLen > historyStack.length) {
                window.history.back();
                return;
            }
            
            if (btnBack) btnBack.style.display = historyStack.length > 1 ? 'flex' : 'none';
        });

        window.focusVerse = (span) => {
            if (!span) return;
            document.querySelectorAll('.verse-text-span.selected-verse').forEach(el => el.classList.remove('selected-verse'));
            span.classList.add('selected-verse');
            window.manualHighlightMode = true;
            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (window.globalUpdateTracker) window.globalUpdateTracker(span.dataset.ref, span.dataset.version);
        };

        const attachVerseTapBehavior = (span, verseId) => {
            // Variables para calcular los gestos en el móvil
            let touchTimer;
            let lastTapTime = 0;
            const SHORT_HOLD = 300; // 300ms para mostrar la burbuja amarilla
            const DOUBLE_TAP = 300; // Tiempo máximo entre dos toques rápidos

            // A. El dedo TOCA la pantalla
            span.addEventListener('touchstart', (e) => {
                // Iniciamos el cronómetro para la burbuja amarilla
                touchTimer = setTimeout(() => {
                    // Si el dedo se quedó quieto 300ms, forzamos la burbuja amarilla
                    document.querySelectorAll('.force-yellow').forEach(el => el.classList.remove('force-yellow'));
                    span.classList.add('force-yellow');
                }, SHORT_HOLD);
            }, { passive: true });

            // B. El dedo se MUEVE (quiere hacer scroll/celeste)
            span.addEventListener('touchmove', () => {
                // Cancelamos la burbuja amarilla porque el usuario está deslizando
                clearTimeout(touchTimer);
                span.classList.remove('force-yellow');
            }, { passive: true });

            // C. El dedo SUELTA la pantalla
            span.addEventListener('touchend', (e) => {
                clearTimeout(touchTimer); // Evitar burbujas accidentales si soltó rápido
                
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapTime;

                // ¿Fue un Doble Toque Rápido?
                if (tapLength < DOUBLE_TAP && tapLength > 0) {
                    e.preventDefault(); 
                    span.classList.remove('force-yellow');
                    viewSingleVerse(verseId); // Entra a las notas del versículo
                } 
                lastTapTime = currentTime;
            });

            // Clic Normal (Para el doble clic en el ratón de escritorio)
            span.addEventListener('dblclick', () => {
                viewSingleVerse(verseId);
            });
        };

        const setEditor = (target, placeholder) => {
            editorTarget = target;
            if (globalEditor) globalEditor.style.display = 'block';
            if (editorContainer) editorContainer.style.display = 'none';
            const nameInp = document.getElementById('new-persp-name');
            const textInp = document.getElementById('new-persp-text');
            if (nameInp) { nameInp.placeholder = placeholder; nameInp.value = ''; }
            if (textInp) textInp.value = '';
        };

        // ── Tooltip flotante global ────────────────────────────────────────
        const floatTip = document.getElementById('floating-tooltip');
        window._positionFloatTip = (e) => {
            if (!floatTip || floatTip.style.display === 'none') return;
            const margin = 18;
            const gapY = 25; // Separación para no tapar la lectura (una línea)
            const tw = floatTip.offsetWidth;
            const th = floatTip.offsetHeight;
            
            // Horizontal: centrar respecto al cursor, respetando bordes
            let x = e.clientX - (tw / 2);
            if (x < margin) x = margin;
            if (x + tw > window.innerWidth - margin) x = window.innerWidth - tw - margin;
            
            // Vertical: por defecto abajo del cursor, si no cabe, lo pasa arriba
            let y = e.clientY + gapY;
            if (y + th > window.innerHeight - margin) {
                let yAbove = e.clientY - th - gapY;
                if (yAbove > margin) {
                    y = yAbove;
                } else {
                    // Si el tooltip es inmenso, lo pegamos al borde
                    y = window.innerHeight - th - margin;
                    if (y < margin) y = margin;
                }
            }
            
            floatTip.style.left = x + 'px';
            floatTip.style.top = y + 'px';
        };
        window._showFloatTip = (e) => {
            const tt = e.currentTarget.dataset.tt;
            if (!tt || !floatTip) return;
            floatTip.innerHTML = tt;
            floatTip.style.display = 'block';
            window._positionFloatTip(e);
        };
        window._hideFloatTip = () => { if (floatTip) floatTip.style.display = 'none'; };

        window.viewSingleVerse = (id, fromHistory = false) => {
            if (!fromHistory) pushHistory('viewSingleVerse', [id]);
            if (!mainView) return;
            mainView.innerHTML = '';
            const tb = document.getElementById('sticky-tracker-bar'); if(tb) tb.style.display='none';
            const rb = document.getElementById('range-selector-bar'); if(rb) { rb.style.display='none'; rb.innerHTML=''; }
            const v = currentData.find(x => x.id === id);
            if (!v) return;

            mainView.innerHTML = `
                <div class="verse-card">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
                        <h2 style="margin:0;">${v.book} ${v.reference}</h2>
                        <button id="btn-ver-capitulo" style="background:var(--primary);color:white;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.85rem;font-weight:bold;flex-shrink:0;">📖 Ver Capítulo</button>
                    </div>
                    <p style="font-size:1.4rem; font-style:italic; margin-top:12px;">&ldquo;${window.formatVerseText(v.text)}&rdquo;</p>
                    ${v.tags && v.tags.length > 0 ? `<div class="verse-tags">${v.tags.map(t => `<span class="hashtag-link" style="color:var(--secondary);cursor:pointer;font-weight:bold;" onclick="event.stopPropagation(); window.goToTopic('${t}');">#${t}</span>`).join(' ')}</div>` : ''}
                </div>
                <div id="v-sections">
                    ${v.base_perspectives ? `<h3 class="study-section-title">📚 Notas de Estudio <span style="font-size:0.75rem;font-weight:400;color:var(--text-muted);">(libro/capítulo)</span></h3><div class="perspective-selector" id="b-btns"></div><div id="b-cont" class="perspective-content" style="display:none; border-color:var(--secondary);"></div>` : ''}
                    <h3 class="study-section-title">✍️ Mis Notas Personales <span style="font-size:0.75rem;font-weight:400;color:var(--text-muted);">(este versículo)</span></h3><div class="perspective-selector" id="p-btns"></div><div id="p-cont" class="perspective-content" style="display:none;"></div>
                    ${v.cross_references && v.cross_references.length > 0 ? `<h3 class="study-section-title">🔗 Referencias Cruzadas</h3><div id="cross-ref-list" style="margin-top:8px;"></div>` : ''}
                </div>
            `;
            // Botón Ver Capítulo
            const btnVerCap = document.getElementById('btn-ver-capitulo');
            if (btnVerCap) {
                btnVerCap.onmouseenter = () => btnVerCap.style.opacity = '0.85';
                btnVerCap.onmouseleave = () => btnVerCap.style.opacity = '1';
                btnVerCap.onclick = () => {
                    const chapNum = parseInt((v.reference || '').split(':')[0]) || parseInt(v.chapter) || 1;
                    const allVersesInChap = currentData.filter(x =>
                        x.type === 'verse' && normalizeBookName(x.book) === normalizeBookName(v.book) &&
                        (parseInt(x.chapter) === chapNum || parseInt((x.reference||'').split(':')[0]) === chapNum)
                    );
                    if (allVersesInChap.length > 0) {
                        window.viewReading(`${v.book} ${chapNum}`, allVersesInChap,
                            { type: 'chapter', version: v.version, book: v.book, chapter: chapNum.toString() });
                        const verseNum = parseInt((v.reference || '').split(':')[1]) || 1;
                        setTimeout(() => window.scrollToVerseAndHighlight(normalizeBookName(v.book), chapNum, verseNum), 200);
                    }
                };
            }
            if (v.text) setEditor({ type: 'verse', id: v.id }, "Nota para este versículo...");
            else setEditor(null);

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

            // Renderizar referencias cruzadas con contenido real — mapa O(1)
            if (v.cross_references && v.cross_references.length > 0) {
                const crList = document.getElementById('cross-ref-list');
                if (crList) {
                    // Construir mapa local para búsqueda instantánea
                    const crMap = new Map();
                    currentData.forEach(x => {
                        if (x.type === 'verse' && x.book && x.reference)
                            crMap.set(`${normalizeBookName(x.book)}_${x.reference}`, x);
                    });
                    const findCR = (ref) => {
                        const m = ref.trim().match(/^(.+?)\s+(\d+):(\d+)$/);
                        return m ? (crMap.get(`${normalizeBookName(m[1])}_${m[2]}:${m[3]}`) || null) : null;
                    };
                    let lastBookCr = null, lastChapCr = null;
                    v.cross_references.forEach(ref => {
                        const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
                        if (!m) return;
                        const bName = m[1], chapNum = m[2];
                        const found = findCR(ref);
                        
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
                            ? `<b style="color:var(--secondary)">${ref}</b> — ${window.formatVerseText(found.text)}`
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

            const verses = items.filter(x => x.type === 'verse' && x.text).sort((a, b) => {
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

            // Mapa O(1) para buscar versículos por referencia cruzada — CRÍTICO para rendimiento
            // Sin este mapa, cada tooltip haría hasta 6 × 31,194 comparaciones = el navegador se congela
            const verseRefMap = new Map();
            currentData.forEach(x => {
                if (x.type === 'verse' && x.book && x.reference) {
                    const key = `${normalizeBookName(x.book)}_${x.reference}`;
                    if (!verseRefMap.has(key)) verseRefMap.set(key, x);
                }
            });
            // Helper para buscar versículo por referencia tipo "Génesis 1:3" en O(1)
            const findVerseByRef = (refStr) => {
                const m = refStr.trim().match(/^(.+?)\s+(\d+):(\d+)$/);
                if (!m) return null;
                const key = `${normalizeBookName(m[1])}_${m[2]}:${m[3]}`;
                return verseRefMap.get(key) || null;
            };

            // Mostrar barra fija del tracker (se llenará por globalUpdateTracker)
            const trackerBar = document.getElementById('sticky-tracker-bar');
            if (trackerBar) { trackerBar.style.display = 'flex'; trackerBar.innerHTML = `<div id="tracker-ref" class="tracker-info" style="flex:1;">${title}</div><button id="btn-range-toggle" title="Filtrar por Rango" style="background:var(--secondary);border:none;border-radius:6px;padding:4px 10px;color:white;font-weight:bold;cursor:pointer;font-size:0.9rem;flex-shrink:0;">⊟ Rango</button>`; }

            // Panel de rango de versículos (barra separada, colapsable)
            const rangeBar = document.getElementById('range-selector-bar');
            if (rangeBar) { rangeBar.style.display = 'none'; rangeBar.innerHTML = `<span>Versículos del</span><input type="number" id="range-start" style="width:60px;border-radius:5px;border:none;padding:4px;text-align:center;" min="1" placeholder="Ini"><span>al</span><input type="number" id="range-end" style="width:60px;border-radius:5px;border:none;padding:4px;text-align:center;" min="1" placeholder="Fin"><button id="btn-apply-range" style="background:var(--secondary);border:none;color:white;padding:5px 12px;border-radius:5px;cursor:pointer;font-weight:bold;">Filtrar</button><button id="btn-clear-range" style="background:#e74c3c;border:none;color:white;padding:5px 12px;border-radius:5px;cursor:pointer;font-weight:bold;">✕</button>`; }

            mainView.innerHTML = `
                <div class="reading-container">
                    <h2 style="display:flex; align-items:center; gap:10px;">${title} <button onclick="window.addToDraftSession('${target.type === 'chapter' ? target.book + ' ' + target.chapter : title}')" style="background:none;border:none;color:var(--primary);font-weight:bold;cursor:pointer;font-size:1.5rem;" title="Añadir a sesión">+</button></h2>
                    <div id="notes-top"></div>
                    <div id="read-text"></div>
                </div>`;

            // Event listeners rango de versículos (delegado para soportar recreación del DOM)
            const trackerBarEvt = document.getElementById('sticky-tracker-bar');
            if(trackerBarEvt) {
                trackerBarEvt.onclick = (ev) => {
                    const btn = ev.target.closest('#btn-range-toggle');
                    if (!btn) return;
                    const rb = document.getElementById('range-selector-bar');
                    if (!rb) return;
                    rb.style.display = rb.style.display === 'none' ? 'flex' : 'none';
                    if (rb.style.display === 'flex' && window.currentTrackerRef) {
                        const rs = document.getElementById('range-start');
                        const re = document.getElementById('range-end');
                        if(rs) rs.value = window.currentTrackerRef.verse;
                        if(re) re.value = window.currentTrackerRef.verse;
                    }
                };
            }
            // delegación de eventos en range-selector-bar
            const rangeBar2 = document.getElementById('range-selector-bar');
            if (rangeBar2) {
                rangeBar2.onclick = (ev) => {
                    const btn = ev.target.closest('button');
                    if (!btn) return;
                    if (btn.id === 'btn-apply-range') {
                        let s = parseInt(document.getElementById('range-start').value);
                        let e2 = parseInt(document.getElementById('range-end').value);
                        if (isNaN(s) || isNaN(e2)) return;
                        if (s > e2) [s, e2] = [e2, s];
                        document.querySelectorAll('.verse-text-span').forEach(span => {
                            const ref = span.dataset.ref || '';
                            const colon = ref.lastIndexOf(':');
                            if (colon !== -1) { const vn = parseInt(ref.substring(colon+1)); span.style.display = (!isNaN(vn) && vn>=s && vn<=e2)?'inline':'none'; }
                        });
                    } else if (btn.id === 'btn-clear-range') {
                        document.getElementById('range-start').value = '';
                        document.getElementById('range-end').value = '';
                        document.querySelectorAll('.verse-text-span').forEach(s => s.style.display='inline');
                    }
                };
            }

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

            // Tracker de posición con autocompletar
            window.currentTrackerRef = null;
            window.globalUpdateTracker = (refStr, version) => {
                if (!refStr) return;
                const match = refStr.match(/^(.*?)\s+(\d+):(\d+)(?:\s*-\s*\d+)?$/);
                if (!match) return;
                window.currentTrackerRef = { book: match[1], chapter: parseInt(match[2]), verse: parseInt(match[3]), version: version || (window.currentTrackerRef && window.currentTrackerRef.version) || null };

                // Calcular límites dinámicos para el libro/capítulo actual
                const allVerses = currentData.filter(x => x.type === 'verse' && x.text);
                const bReal = normalizeBookName(match[1]);
                const inBook = allVerses.filter(x => normalizeBookName(x.book) === bReal);
                const getC = x => parseInt(x.chapter) || parseInt((x.reference||'0:0').split(':')[0]);
                const getV = x => parseInt((x.reference||'0:0').split(':')[1]);
                const maxChap = inBook.length > 0 ? Math.max(...inBook.map(getC)) : 999;
                const inChapNow = inBook.filter(x => getC(x) === parseInt(match[2]));
                const maxVerse = inChapNow.length > 0 ? Math.max(...inChapNow.map(getV)) : 999;

                // Lista canónica de nombres para el autocompletar (nombres originales no normalizados)
                const bookDisplayNames = [...new Set(allVerses.map(x => x.book).filter(Boolean))];

                // Poblar la barra fija del tracker con el nuevo layout
                const trackerBarEl = document.getElementById('sticky-tracker-bar');
                if (trackerBarEl) {
                    trackerBarEl.innerHTML = `
                        <div class="tracker-smart-nav">
                            <div class="trk-field-group">
                                <button class="trk-side-arrow" onclick="window.navTracker('book',-1)" title="Libro anterior">◀</button>
                                <div class="trk-field-wrap" id="trk-book-wrap">
                                    <label class="trk-label">Libro</label>
                                    <input id="trk-book-input" class="trk-input" type="text"
                                        value="${match[1]}" autocomplete="off" spellcheck="false" placeholder="Buscar libro…">
                                    <div id="trk-book-suggestions" class="trk-suggestions"></div>
                                </div>
                                <button class="trk-side-arrow" onclick="window.navTracker('book',1)" title="Libro siguiente">▶</button>
                            </div>
                            <div class="trk-field-group">
                                <button class="trk-side-arrow" onclick="window.navTracker('chapter',-1)" title="Capítulo anterior">◀</button>
                                <div class="trk-field-wrap">
                                    <label class="trk-label">Cap. <span id="trk-chap-hint" class="trk-hint">(máx ${maxChap})</span></label>
                                    <input id="trk-chap-input" class="trk-input trk-num" type="number"
                                        value="${match[2]}" min="1" max="${maxChap}" autocomplete="off">
                                </div>
                                <button class="trk-side-arrow" onclick="window.navTracker('chapter',1)" title="Capítulo siguiente">▶</button>
                            </div>
                            <div class="trk-field-group">
                                <button class="trk-side-arrow" onclick="window.navTracker('verse',-1)" title="Versículo anterior">◀</button>
                                <div class="trk-field-wrap">
                                    <label class="trk-label">Vers. <span id="trk-verse-hint" class="trk-hint">(máx ${maxVerse})</span></label>
                                    <input id="trk-verse-input" class="trk-input trk-num" type="number"
                                        value="${match[3]}" min="1" max="${maxVerse}" autocomplete="off">
                                </div>
                                <button class="trk-side-arrow" onclick="window.navTracker('verse',1)" title="Versículo siguiente">▶</button>
                            </div>
                            <button id="btn-range-toggle" title="Filtrar por Rango" style="background:var(--secondary);border:none;border-radius:6px;padding:4px 8px;color:white;font-weight:bold;cursor:pointer;font-size:0.85rem;flex-shrink:0;align-self:center;">⊟</button>
                        </div>`;
                    trackerBarEl.style.display = 'flex';
                }
                // Limpiar también tracker-ref si existe (por compatibilidad)
                const oldT = document.getElementById('tracker-ref');
                if (oldT) oldT.style.display = 'none';


                // ── Lógica del autocompletar de Libro ──────────────────────────────
                const bookInput = document.getElementById('trk-book-input');
                const sugBox    = document.getElementById('trk-book-suggestions');
                const chapInput = document.getElementById('trk-chap-input');
                const verseInput= document.getElementById('trk-verse-input');
                const chapHint  = document.getElementById('trk-chap-hint');
                const verseHint = document.getElementById('trk-verse-hint');

                const closeSug = () => { sugBox.innerHTML = ''; sugBox.style.display = 'none'; };

                const showSuggestions = (query) => {
                    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
                    // Filtrar por prefijo O por inclusión — también expandir "san " a nombre real
                    const filtered = bookDisplayNames.filter(b => {
                        const norm = b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
                        const normFull = 'san ' + norm;
                        return norm.includes(q) || normFull.includes(q) || normalizeBookName(b).includes(q);
                    }).slice(0, 8);

                    if (filtered.length === 0 || (filtered.length === 1 && normalizeBookName(filtered[0]) === normalizeBookName(query))) {
                        closeSug(); return;
                    }
                    sugBox.innerHTML = '';
                    filtered.forEach(name => {
                        const item = document.createElement('div');
                        item.className = 'trk-sug-item';
                        item.textContent = name;
                        item.onmousedown = (e) => {
                            e.preventDefault();
                            bookInput.value = name;
                            closeSug();
                            // Navegar inmediatamente al libro seleccionado
                            const chapVal = parseInt(chapInput.value) || 1;
                            const verseVal = parseInt(verseInput.value) || 1;
                            window.navToBCV(name, chapVal, verseVal);
                        };
                        sugBox.appendChild(item);
                    });
                    sugBox.style.display = 'block';
                };

                bookInput.addEventListener('input', () => showSuggestions(bookInput.value));
                bookInput.addEventListener('focus', () => { if (bookInput.value) showSuggestions(bookInput.value); });
                bookInput.addEventListener('blur', () => setTimeout(closeSug, 150));
                bookInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        closeSug();
                        const chapVal = parseInt(chapInput.value) || 1;
                        const verseVal = parseInt(verseInput.value) || 1;
                        window.navToBCV(bookInput.value, chapVal, verseVal);
                    }
                    if (e.key === 'Escape') closeSug();
                });

                // ── Lógica de Capítulo ────────────────────────────────────────────
                const refreshVerseLimits = () => {
                    const bName = bookInput.value;
                    const bR = normalizeBookName(bName);
                    const inB = allVerses.filter(x => normalizeBookName(x.book) === bR);
                    const mxC = inB.length > 0 ? Math.max(...inB.map(getC)) : 999;
                    chapInput.max = mxC;
                    if (chapHint) chapHint.textContent = `(máx ${mxC})`;
                    const cNum = parseInt(chapInput.value) || 1;
                    const inC = inB.filter(x => getC(x) === cNum);
                    const mxV = inC.length > 0 ? Math.max(...inC.map(getV)) : 999;
                    verseInput.max = mxV;
                    if (verseHint) verseHint.textContent = `(máx ${mxV})`;
                };

                chapInput.addEventListener('change', () => {
                    let v = parseInt(chapInput.value);
                    const mx = parseInt(chapInput.max) || 999;
                    if (isNaN(v) || v < 1) { chapInput.value = 1; v = 1; }
                    if (v > mx) { chapInput.value = mx; v = mx; }
                    refreshVerseLimits();
                });
                chapInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        let v = parseInt(chapInput.value);
                        const mx = parseInt(chapInput.max) || 999;
                        if (isNaN(v) || v < 1) v = 1;
                        if (v > mx) v = mx;
                        chapInput.value = v;
                        refreshVerseLimits();
                        window.navToBCV(bookInput.value, v, parseInt(verseInput.value) || 1);
                    }
                });

                // ── Lógica de Versículo ───────────────────────────────────────────
                verseInput.addEventListener('change', () => {
                    let v = parseInt(verseInput.value);
                    const mx = parseInt(verseInput.max) || 999;
                    if (isNaN(v) || v < 1) { verseInput.value = 1; v = 1; }
                    if (v > mx) { verseInput.value = mx; v = mx; }
                });
                verseInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        let vv = parseInt(verseInput.value);
                        const mx = parseInt(verseInput.max) || 999;
                        if (isNaN(vv) || vv < 1) vv = 1;
                        if (vv > mx) vv = mx;
                        verseInput.value = vv;
                        window.navToBCV(bookInput.value, parseInt(chapInput.value) || 1, vv);
                    }
                });
            };

            // Observer de lectura activa
            const readText = document.getElementById('read-text');
            if (readingObserver) readingObserver.disconnect();
            window.manualHighlightMode = false;
            let currentlyVisibleVerses = new Set();
            readingObserver = new IntersectionObserver(es => {
                if (window.manualHighlightMode) return;
                if (isTyping) return;
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
                    if(window.markVerseAsRead) window.markVerseAsRead(activeVerse.dataset.ref, activeVerse.textContent);
                }
            }, { rootMargin: '-30% 0px -50% 0px' }); // Margen matemático: detecta justo el centro de la pantalla

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
                    cd.style.cssText = 'color:var(--secondary);font-weight:bold;padding:4px 2px;margin-top:10px;border-bottom:2px solid var(--secondary);margin-bottom:4px; display:flex; align-items:center;';
                    cd.innerHTML = `<button class="add-to-session-btn" onclick="window.addToDraftSession('${v.book} ${vChap}')" title="Añadir capítulo a sesión" style="background:none;border:none;color:var(--secondary);font-weight:bold;cursor:pointer;padding:0 8px;font-size:1.2rem; margin-right:5px;">+</button>Capítulo ${vChap}`;
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
                
                // Tooltip: SOLO referencias cruzadas + tags (las notas de estudio son del capítulo, no del versículo)
                let ttParts = [];
                if (v.tags?.length) ttParts.push(`<span style="font-size:0.8em;opacity:0.75;">${v.tags.map(t=>'#'+t).join(' ')}</span>`);
                // Notas personales del versículo (perspectives) sí pueden aparecer en tooltip
                if (pFiltered.length) ttParts.push(...pFiltered);

                // Referencias cruzadas con texto — búsqueda O(1) con el mapa preconstruido
                if (v.cross_references?.length) {
                    let crHtml = '<b>🔗 REFERENCIAS:</b>';
                    let lastCrBook = null, lastCrChap = null;
                    v.cross_references.slice(0, 6).forEach(ref => {
                        const m = ref.trim().match(/^(.+?)\s+(\d+):(\d+)$/);
                        if (!m) return;
                        const found = findVerseByRef(ref);
                        if (m[1] !== lastCrBook) { crHtml += `<br><b style="color:#aef;">${m[1]}</b>`; lastCrBook = m[1]; lastCrChap = null; }
                        if (m[2] !== lastCrChap) { crHtml += ` <i>Cap.${m[2]}</i>`; lastCrChap = m[2]; }
                        crHtml += `<br><span style="font-size:0.85em;"><b>${m[3]}.</b> ${found ? window.formatVerseText(found.text) : ref}</span>`;
                    });
                    ttParts.push(crHtml);
                }

                const tt = ttParts.join('<hr style="margin:4px 0;opacity:0.3;">');
                const hasDot   = pFiltered.length > 0;                          // nota personal del vers.
                const hasStudy = v.base_perspectives && Object.keys(v.base_perspectives).length > 0; // notas de capítulo
                const hasRef   = v.cross_references?.length > 0;                // referencias cruzadas
                // ● naranja = notas de estudio (cap/libro)  ● verde = nota personal  ● azul = ref cruzada
                const dot = (hasStudy ? `<span class="has-persp-dot base" title="Notas de estudio"></span>` : '')
                          + (hasDot   ? `<span class="has-persp-dot" style="background:#27ae60;width:6px;height:6px;" title="Nota personal"></span>` : '')
                          + (hasRef   ? `<span class="has-persp-dot" style="background:#3498db;width:6px;height:6px;" title="Referencias cruzadas"></span>` : '');
                
                let span = document.createElement('span');
                span.className = 'verse-text-span';
                span.dataset.ref = `${v.book} ${v.reference}`;
                span.dataset.version = v.version || '';
                if (tt) span.dataset.tt = tt;  // tooltip almacenado en data attr
                const refStr = v.reference || '';
                const colonIdx = refStr.lastIndexOf(':');
                const vNum = colonIdx !== -1 ? refStr.substring(colonIdx + 1) : refStr;
                span.innerHTML = `<button class="add-to-session-btn" onclick="event.stopPropagation(); window.addToDraftSession('${v.book} ${v.reference}')" onpointerup="event.stopPropagation();" title="Añadir a sesión" style="background:none;border:none;color:var(--primary);font-weight:bold;cursor:pointer;padding:0 4px;font-size:1.1rem; vertical-align: baseline;">+</button><span class="verse-num">${vNum}</span>${window.formatVerseText(v.text)} ${dot}`;
                if (tt) {
                    span.addEventListener('mouseenter', window._showFloatTip);
                    span.addEventListener('mousemove', window._positionFloatTip);
                    span.addEventListener('mouseleave', window._hideFloatTip);
                }
                attachVerseTapBehavior(span, v.id);
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

            // Detectar teclado para congelar el observer
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    isTyping = true;
                });
                input.addEventListener('blur', () => {
                    setTimeout(() => {
                        isTyping = false;
                    }, 200);
                });
            });

            // Limpieza: Si tocas en cualquier espacio vacío del móvil, la burbuja amarilla desaparece
            document.addEventListener('touchstart', (e) => {
                if (!e.target.closest('.verse-text-span')) {
                    document.querySelectorAll('.force-yellow').forEach(el => el.classList.remove('force-yellow'));
                }
            }, { passive: true });
        };

        const nav = (t, off) => {
            const all = currentData.filter(x => x.type === 'verse' && x.version === t.version && x.text);
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
                if (!window.currentTrackerRef) return;
                let { book, chapter, verse } = window.currentTrackerRef;
                let bIdx = BIBLE_BOOKS.indexOf(normalizeBookName(book));
                if (bIdx === -1) return;
                if (type === 'book') {
                    bIdx += dir;
                    if (bIdx < 0 || bIdx >= BIBLE_BOOKS.length) return;
                    book = BIBLE_BOOKS[bIdx]; chapter = 1; verse = 1;
                } else if (type === 'chapter') {
                    chapter += dir; verse = 1;
                } else if (type === 'verse') {
                    verse += dir;
                }
                window.navToBCV(book, chapter, verse, true); // sequential=true
            } catch(e) { console.error('navTracker', e); }
        };

        window.navToBCV = (bName, cNum, vNum, sequential = false) => {
            try {
                let bReal = normalizeBookName(bName);
                // Obtener versión del trackerRef o del primer versículo en currentData
                let version = (window.currentTrackerRef && window.currentTrackerRef.version) || null;
                let allVerses = currentData.filter(x => x.type === 'verse' && x.text);
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
                    if (sequential) {
                        // Navegación secuencial (flechas): avanzar al siguiente capítulo/libro
                        if (cNum < maxChap) {
                            cNum++; vNum = 1;
                            inChap = inBook.filter(x => getC(x) === cNum);
                        } else {
                            let bIdx = BIBLE_BOOKS.indexOf(bReal);
                            if(bIdx < BIBLE_BOOKS.length-1) {
                                bReal = BIBLE_BOOKS[bIdx+1]; cNum = 1; vNum = 1;
                                inBook = all.filter(x => normalizeBookName(x.book) === bReal);
                                inChap = inBook.filter(x => getC(x) === cNum);
                            } else { vNum = maxVerse; }
                        }
                    } else {
                        // Navegación directa (escribir): clamp al último versículo
                        vNum = maxVerse;
                    }
                } else if (vNum < 1) {
                    if (sequential) {
                        if (cNum > 1) {
                            cNum--;
                            let prevChap = inBook.filter(x => getC(x) === cNum);
                            vNum = Math.max(...prevChap.map(getV)); inChap = prevChap;
                        } else {
                            let bIdx = BIBLE_BOOKS.indexOf(bReal);
                            if(bIdx > 0) {
                                bReal = BIBLE_BOOKS[bIdx-1];
                                inBook = all.filter(x => normalizeBookName(x.book) === bReal);
                                cNum = Math.max(...inBook.map(getC));
                                inChap = inBook.filter(x => getC(x) === cNum);
                                vNum = Math.max(...inChap.map(getV));
                            } else { vNum = 1; }
                        }
                    } else {
                        vNum = 1;
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

        window.addToDraftSession = (ref) => {
            let refs = JSON.parse(localStorage.getItem('biblia_draft_refs') || '[]');
            refs.push(ref);
            localStorage.setItem('biblia_draft_refs', JSON.stringify(refs));
            if (window.toast) window.toast("Añadido a la sesión en borrador", false);
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
                <div id="session-notes-container" style="margin-top:20px; margin-bottom:20px; padding:0 15px;"></div>
            `;
            const readText = document.getElementById('session-read-text');
            const notesContainer = document.getElementById('session-notes-container');
            
            const verseRefMap = new Map();
            currentData.forEach(x => {
                if (x.type === 'verse' && x.book && x.reference) {
                    const key = `${normalizeBookName(x.book)}_${x.reference}`;
                    if (!verseRefMap.has(key)) verseRefMap.set(key, x);
                }
            });
            const findVerseByRef = (refStr) => {
                const m = refStr.trim().match(/^(.+?)\s+(\d+):(\d+)$/);
                if (!m) return null;
                const key = `${normalizeBookName(m[1])}_${m[2]}:${m[3]}`;
                return verseRefMap.get(key) || null;
            };

            // Parse references
            let lines = session.refs.split(/[,;\n]/).map(x => x.trim()).filter(x => x);
            
            lines.forEach(line => {
                let match = line.match(/(.+?)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?/);
                if(match) {
                    let bName = normalizeBookName(match[1].trim());
                    let chap = match[2];
                    let vStart = match[3] ? parseInt(match[3]) : 1;
                    let vEnd = match[4] ? parseInt(match[4]) : (match[3] ? vStart : 999);
                    
                    let verses = currentData.filter(v => {
                        if(v.type !== 'verse') return false;
                        if(normalizeBookName(v.book) !== bName) return false;
                        if(v.chapter != chap) return false;
                        let vNum = parseInt((v.reference||'').split(':')[1] || 0);
                        return vNum >= vStart && vNum <= vEnd;
                    });
                    
                    if(verses.length > 0) {
                        let chapterBlock = document.createElement('div');
                        chapterBlock.style.marginBottom = '20px';
                        chapterBlock.innerHTML = `<h3 style="color:var(--primary); border-bottom:2px solid var(--secondary); padding-bottom:5px;">📖 ${match[1].trim()} ${chap}:${vStart}${match[4] ? '-'+match[4] : ''}</h3>`;
                        
                        verses.sort((a,b) => parseInt((a.reference||'').split(':')[1]) - parseInt((b.reference||'').split(':')[1])).forEach((v) => {
                            let hasB = v.base_perspectives && Object.keys(v.base_perspectives).length > 0;
                            let hasP = v.perspectives && Object.keys(v.perspectives).length > 0;
                            let hasR = v.cross_references && v.cross_references.length > 0;

                            let span = document.createElement('span');
                            span.className = 'verse-text-span tooltip';
                            
                            let tooltipContent = '';
                            
                            // Cross references en tooltip
                            if(hasR) {
                                tooltipContent += `<b style="color:#aef;">🔗 REFERENCIAS:</b><br>`;
                                v.cross_references.forEach(ref => {
                                    const crFound = findVerseByRef(ref);
                                    tooltipContent += `<span style="font-size:0.9em;"><b>${ref}</b> - ${crFound ? window.formatVerseText(crFound.text) : ''}</span><br>`;
                                });
                                tooltipContent += `<br>`;
                            }
                            
                            if(session.showStudy && hasB) {
                                tooltipContent += `<b style="color:#f1c40f;">📚 ESTUDIO:</b><br>${Object.entries(v.base_perspectives).map(([k,val])=>`<b>${k.replace(/_/g,' ').toUpperCase()}:</b> ${val}`).join('<br>')}<br><br>`;
                            }
                            if(hasP) {
                                tooltipContent += `<b style="color:#2ecc71;">✍️ MI NOTA:</b><br>${Object.entries(v.perspectives).map(([k,val])=>`<b>${k}:</b> ${val}`).join('<br>')}`;
                            }

                            let vNum = (v.reference && v.reference.includes(':')) ? v.reference.split(':')[1] : (v.reference || '');
                            let dotHTML = '';
                            if (hasB) dotHTML += `<span class="has-persp-dot base" title="Notas de estudio"></span>`;
                            if (hasP) dotHTML += `<span class="has-persp-dot" style="background:#27ae60;width:6px;height:6px;" title="Nota personal"></span>`;
                            if (hasR) dotHTML += `<span class="has-persp-dot" style="background:#3498db;width:6px;height:6px;" title="Referencias cruzadas"></span>`;

                            span.innerHTML = `<span class="verse-num">${vNum}</span>${window.formatVerseText(v.text)} ${tooltipContent ? dotHTML + '<span class="tooltiptext">'+tooltipContent+'</span>' : ''}`;
                            span.onclick = () => window.viewSingleVerse(v.id);
                            
                            chapterBlock.appendChild(span);
                            
                            // Mis notas (perspectives) inline después del versículo si se pidió
                            if (hasP) {
                                let myDiv = document.createElement('div');
                                myDiv.style.cssText = 'margin:10px 0; padding:10px; background:#fdf8e3; border:1px solid #fbeed5; border-radius:5px; border-left:3px solid #f39c12; font-size:0.95rem;';
                                myDiv.innerHTML = `<b style="color:#e67e22;">✍️ Mis Notas (${v.reference}):</b><br>`;
                                Object.entries(v.perspectives).forEach(([k, val]) => {
                                    myDiv.innerHTML += `<b>${k}:</b> ${val}<br>`;
                                });
                                chapterBlock.appendChild(myDiv);
                            }

                            // Referencias Cruzadas inline
                            if (hasR) {
                                let crDiv = document.createElement('div');
                                crDiv.style.cssText = 'margin:10px 0; padding:10px; background:#f4f9f9; border-radius:5px; border-left:2px solid var(--secondary); font-size:0.9rem;';
                                crDiv.innerHTML = `<b style="color:var(--secondary);">🔗 Referencias Bíblicas (${v.reference}):</b><br>`;
                                v.cross_references.forEach(ref => {
                                    const crFound = findVerseByRef(ref);
                                    let p = document.createElement('div');
                                    p.style.cssText = 'margin-top:4px; cursor:pointer;';
                                    p.innerHTML = `<b>${ref}</b> — ${crFound ? window.formatVerseText(crFound.text) : '<i>(Texto no disponible)</i>'}`;
                                    if(crFound) p.onclick = () => window.viewSingleVerse(crFound.id);
                                    crDiv.appendChild(p);
                                });
                                chapterBlock.appendChild(crDiv);
                            }
                        });
                        readText.appendChild(chapterBlock);
                    }
                } else {
                    let matches = currentData.filter(x => x.type === 'verse' && x.text && x.text.toLowerCase().includes(line.toLowerCase()));
                    if(matches.length > 0) {
                        let divBlock = document.createElement('div');
                        divBlock.style.cssText = 'margin-bottom:20px; background:#fff; padding:15px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);';
                        divBlock.innerHTML = `<h3 style="color:var(--primary); border-bottom:2px solid var(--secondary); padding-bottom:5px;">🔍 Búsqueda rápida: ${line}</h3>`;
                        matches.slice(0, 5).forEach(v => { 
                            let p = document.createElement('p');
                            p.style.cssText = 'cursor:pointer; padding:8px; border-bottom:1px dashed #eee; font-size:1.1rem;';
                            p.innerHTML = `<b>${v.book} ${v.reference}:</b> "${window.formatVerseText(v.text)}"`;
                            p.onclick = () => window.viewSingleVerse(v.id);
                            divBlock.appendChild(p);
                        });
                        readText.appendChild(divBlock);
                    }
                }
            });

            // Session Notes
            let sessionNotes = currentData.filter(x => x.type === 'session_note' && x.id === session.id);
            if (sessionNotes.length > 0) {
                notesContainer.innerHTML = `<h3 style="border-bottom:2px solid var(--primary); padding-bottom:5px; color:var(--primary);">📝 Notas Generales de la Sesión</h3>`;
                sessionNotes.forEach(n => {
                    if (n.perspectives) {
                        Object.entries(n.perspectives).forEach(([k, v]) => {
                            notesContainer.innerHTML += `<div style="background:#f9f9f9; padding:15px; border-radius:8px; border-left:4px solid var(--primary); margin-top:10px;">
                                <h4 style="margin:0 0 5px 0;">${k}</h4>
                                <p style="margin:0; white-space:pre-wrap;">${v}</p>
                            </div>`;
                        });
                    }
                });
            }

            setEditor({ type: 'session_note', id: session.id }, "Añadir nota general a la sesión...");
        };

        window.markVerseAsRead = (ref, textStr = '') => {
            if(!ref) return;
            let readSet = new Set(JSON.parse(localStorage.getItem('biblia_read_verses') || '[]'));
            if(!readSet.has(ref)) {
                readSet.add(ref);
                localStorage.setItem('biblia_read_verses', JSON.stringify([...readSet]));
                
                let history = JSON.parse(localStorage.getItem('biblia_history') || '[]');
                history = history.filter(x => x.ref !== ref);
                history.unshift({ref: ref, date: new Date().toISOString(), snippet: textStr.substring(0, 50) + '...'});
                if(history.length > 200) history.pop();
                localStorage.setItem('biblia_history', JSON.stringify(history));
                
                // Si la pestaña actual es books, podemos disparar una actualización visual
                let pBar = document.querySelector('#sidebar-content > div:first-child');
                if (pBar && pBar.innerText.includes('Progreso')) {
                    let totalVerses = currentData.filter(x => x.type === 'verse' && x.text).length;
                    let percent = totalVerses > 0 ? (readSet.size / totalVerses * 100).toFixed(2) : 0;
                    pBar.querySelector('div > span:nth-child(2)').innerText = percent + '%';
                    pBar.querySelector('div:nth-child(2) > div').style.width = percent + '%';
                    pBar.querySelector('div:nth-child(3)').innerText = `${readSet.size} / ${totalVerses} versículos leídos`;
                }
            }
        };

        window.viewReadingHistory = () => {
            pushHistory('viewReadingHistory', []);
            if (!mainView) return;
            let history = JSON.parse(localStorage.getItem('biblia_history') || '[]');
            
            mainView.innerHTML = `
                <div class="reading-container">
                    <h2 style="color:var(--primary); margin-bottom:20px; border-bottom:2px solid var(--secondary); padding-bottom:10px;">🕒 Historial Reciente de Lectura</h2>
                    ${history.length === 0 ? '<p>No hay historial todavía. ¡Comienza a leer!</p>' : ''}
                    <div id="history-list" style="display:flex; flex-direction:column; gap:10px;"></div>
                </div>
            `;
            const list = document.getElementById('history-list');
            history.forEach(item => {
                let d = document.createElement('div');
                d.style.cssText = "padding:12px; background:#f9f9f9; border-radius:8px; border-left:4px solid var(--primary); cursor:pointer;";
                let dateStr = new Date(item.date).toLocaleString();
                d.innerHTML = `<div style="font-size:0.8rem; color:#888;">${dateStr}</div>
                               <div style="font-weight:bold; font-size:1.1rem; color:var(--primary);">${item.ref}</div>
                               <div style="font-style:italic; color:#555; font-size:0.9rem; margin-top:4px;">"${item.snippet}"</div>`;
                
                d.onclick = () => {
                    let matches = currentData.filter(x => x.type === 'verse' && x.text && (x.book + ' ' + x.reference) === item.ref);
                    if(matches.length > 0) window.viewSingleVerse(matches[0].id);
                };
                list.appendChild(d);
            });
            setEditor(null);
        };

        document.addEventListener('selectionchange', () => {
            let sel = window.getSelection();
            let text = sel.toString().trim();
            let btn = document.getElementById('search-selection-btn');
            
            if(text && text.length >= 3 && text.length <= 30 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(text)) {
                if(!btn) {
                    btn = document.createElement('button');
                    btn.id = 'search-selection-btn';
                    btn.innerHTML = `🔍 Tema: "${text}"`;
                    btn.style.cssText = 'position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:var(--secondary); color:white; border:none; padding:12px 24px; border-radius:30px; box-shadow:0 4px 15px rgba(0,0,0,0.4); z-index:9999; font-weight:bold; cursor:pointer; font-size:1rem; transition: transform 0.1s;';
                    btn.onmousedown = () => { btn.style.transform = 'translateX(-50%) scale(0.95)'; };
                    document.body.appendChild(btn);
                } else {
                    btn.innerHTML = `🔍 Tema: "${text}"`;
                }
                
                btn.onclick = () => {
                    sel.removeAllRanges();
                    btn.remove();
                    window.switchTab('persp');
                    setTimeout(() => {
                        let searchInput = document.getElementById('w-search');
                        if(searchInput) {
                            searchInput.value = text;
                            searchInput.dispatchEvent(new KeyboardEvent('keyup', {key: 'Enter'}));
                        }
                    }, 100);
                };
                
                clearTimeout(window.searchBtnTimeout);
                window.searchBtnTimeout = setTimeout(() => { if(btn) btn.remove(); }, 6000);
            } else {
                if(btn) btn.remove();
            }
        });