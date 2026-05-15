/** RENDER SIDEBAR */
        function renderSidebarBooks() {
            if (!sidebarContent) return;
            sidebarContent.innerHTML = '';
            const tree = {};
            currentData.forEach(v => {
                if (v.type !== 'verse') return;
                const ver = v.version || "Biblia";
                const info = getBookInfo(v.book);
                if (!tree[ver]) tree[ver] = {};
                if (!tree[ver][info.testament]) tree[ver][info.testament] = {};
                if (!tree[ver][info.testament][info.category]) tree[ver][info.testament][info.category] = {};
                if (!tree[ver][info.testament][info.category][v.book]) tree[ver][info.testament][info.category][v.book] = {};
                if (!tree[ver][info.testament][info.category][v.book][v.chapter]) tree[ver][info.testament][info.category][v.book][v.chapter] = [];
                tree[ver][info.testament][info.category][v.book][v.chapter].push(v);
            });

            const sortBooks = (a, b) => {
                let idxA = BIBLE_BOOKS.indexOf(normalizeBookName(a));
                let idxB = BIBLE_BOOKS.indexOf(normalizeBookName(b));
                if(idxA === -1) idxA = 999;
                if(idxB === -1) idxB = 999;
                return idxA - idxB;
            };

            for (let ver in tree) {
                let dVer = document.createElement('details'); dVer.open = true; dVer.innerHTML = `<summary>📖 ${ver}</summary>`;
                
                // 1. Crear el Índice Canónico
                let dIndex = document.createElement('details'); dIndex.innerHTML = `<summary>📑 Índice</summary>`;
                let allBooksForVer = {};
                for (let test in tree[ver]) {
                    for (let cat in tree[ver][test]) {
                        for (let book in tree[ver][test][cat]) {
                            allBooksForVer[book] = tree[ver][test][cat][book];
                        }
                    }
                }
                let sortedAllBooks = Object.keys(allBooksForVer).sort(sortBooks);
                sortedAllBooks.forEach(book => {
                    let dBook = document.createElement('details'); dBook.innerHTML = `<summary>📘 ${book}</summary>`;
                    dBook.querySelector('summary').onclick = (e) => {
                        e.preventDefault(); dBook.open = !dBook.open;
                        if (dBook.open) {
                            let all = []; Object.values(allBooksForVer[book]).forEach(c => all.push(...c));
                            viewReading(book, all, { type: 'book', version: ver, book: book });
                        }
                    };
                    dBook.ontoggle = () => {
                        if (dBook.open && dBook.children.length === 1) {
                            Object.keys(allBooksForVer[book]).sort((a, b) => parseInt(a) - parseInt(b)).forEach(c => {
                                let dCap = document.createElement('div'); dCap.className = 'tree-item'; dCap.textContent = `Capítulo ${c}`;
                                dCap.onclick = (ev) => { ev.stopPropagation(); viewReading(`${book} ${c}`, allBooksForVer[book][c], { type: 'chapter', version: ver, book: book, chapter: c }); };
                                dBook.appendChild(dCap);
                            });
                        }
                    };
                    dIndex.appendChild(dBook);
                });
                dVer.appendChild(dIndex);

                // 2. Orden de Testamentos y Categorías
                let testaments = Object.keys(tree[ver]).sort((a,b) => a.includes("Antiguo") ? -1 : 1);
                testaments.forEach(test => {
                    let dTest = document.createElement('details'); dTest.open = true; dTest.innerHTML = `<summary>📜 ${test}</summary>`;
                    dTest.querySelector('summary').onclick = (e) => {
                        e.preventDefault(); dTest.open = !dTest.open;
                        if (dTest.open) {
                            let all = []; Object.values(tree[ver][test]).forEach(c => Object.values(c).forEach(b => Object.values(b).forEach(ch => all.push(...ch))));
                            viewReading(test, all, { type: 'testament', version: ver, testament: test });
                        }
                    };
                    for (let cat in tree[ver][test]) {
                        let dCat = document.createElement('details'); dCat.innerHTML = `<summary>📂 ${cat}</summary>`;
                        dCat.querySelector('summary').onclick = (e) => {
                            e.preventDefault(); dCat.open = !dCat.open;
                            if (dCat.open) {
                                let all = []; Object.values(tree[ver][test][cat]).forEach(b => Object.values(b).forEach(c => all.push(...c)));
                                viewReading(cat, all, { type: 'category', version: ver, testament: test, category: cat });
                            }
                        };
                        
                        let sortedBooksInCat = Object.keys(tree[ver][test][cat]).sort(sortBooks);
                        sortedBooksInCat.forEach(book => {
                            let dBook = document.createElement('details'); dBook.innerHTML = `<summary>📘 ${book}</summary>`;
                            dBook.querySelector('summary').onclick = (e) => {
                                e.preventDefault(); dBook.open = !dBook.open;
                                if (dBook.open) {
                                    let all = []; Object.values(tree[ver][test][cat][book]).forEach(c => all.push(...c));
                                    viewReading(book, all, { type: 'book', version: ver, testament: test, category: cat, book: book });
                                }
                            };
                            dBook.ontoggle = () => {
                                if (dBook.open && dBook.children.length === 1) {
                                    Object.keys(tree[ver][test][cat][book]).sort((a, b) => parseInt(a) - parseInt(b)).forEach(c => {
                                        let dCap = document.createElement('div'); dCap.className = 'tree-item'; dCap.textContent = `Capítulo ${c}`;
                                        dCap.onclick = (ev) => { ev.stopPropagation(); viewReading(`${book} ${c}`, tree[ver][test][cat][book][c], { type: 'chapter', version: ver, testament: test, category: cat, book: book, chapter: c }); };
                                        dBook.appendChild(dCap);
                                    });
                                }
                            };
                            dCat.appendChild(dBook);
                        });
                        dTest.appendChild(dCat);
                    }
                    dVer.appendChild(dTest);
                });
                sidebarContent.appendChild(dVer);
            }
        }

        /** TABS */
        function switchTab(t) {
            activeTab = t;
            document.querySelectorAll('.sidebar-tabs button').forEach(b => b.classList.remove('active'));
            const tb = document.getElementById('tab-' + t);
            if (tb) tb.classList.add('active');
            if (t === 'books') {
                document.getElementById('tab-books').classList.add('active');
                renderSidebarBooks();
                
                let readArr = JSON.parse(localStorage.getItem('biblia_read_verses') || '[]');
                let totalVerses = currentData.filter(x => x.type === 'verse' && x.text).length;
                let percent = totalVerses > 0 ? (readArr.length / totalVerses * 100).toFixed(2) : 0;
                
                let progressDiv = document.createElement('div');
                progressDiv.innerHTML = `
                    <div style="padding:10px; background:#f4f9f9; border-bottom:1px solid #ddd; margin-bottom:10px; border-radius:5px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:bold; color:var(--primary); margin-bottom:5px;">
                            <span>Progreso de Lectura</span>
                            <span>${percent}%</span>
                        </div>
                        <div style="width:100%; background:#e0e0e0; height:8px; border-radius:4px; overflow:hidden;">
                            <div style="width:${percent}%; background:var(--secondary); height:100%;"></div>
                        </div>
                        <div style="font-size:0.75rem; color:#666; margin-top:5px; text-align:right;">${readArr.length} / ${totalVerses} versículos leídos</div>
                        <button id="btn-show-history" style="width:100%; margin-top:8px; padding:6px; background:var(--primary); color:white; border:none; border-radius:4px; font-size:0.8rem; cursor:pointer;">Ver Historial de Lectura</button>
                    </div>
                `;
                if(sidebarContent.firstChild) {
                    sidebarContent.insertBefore(progressDiv, sidebarContent.firstChild);
                } else {
                    sidebarContent.appendChild(progressDiv);
                }
                
                let historyBtn = document.getElementById('btn-show-history');
                if(historyBtn && window.viewReadingHistory) {
                    historyBtn.onclick = window.viewReadingHistory;
                }
            }
            else if (t === 'persp') {
                if (sidebarContent) {
                    sidebarContent.innerHTML = `
                        <div style="padding:10px;">
                            <input type="text" id="w-search" placeholder="🔍 Buscar y pinear tema..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
                            <button id="btn-pin-topic" style="width:100%; margin-top:5px; padding:8px; background:var(--secondary); color:white; border:none; border-radius:8px; cursor:pointer;">📌 Guardar Tema</button>
                            <h4 style="margin-top:15px; border-bottom:1px solid #ccc; padding-bottom:5px;">📌 Mis Temas Guardados</h4>
                            <div id="pinned-topics-list" style="margin-top:10px; display:flex; flex-direction:column; gap:5px;"></div>
                        </div>
                        <div id="search-res"></div>
                    `;
                    const search = document.getElementById('w-search');
                    const btnPin = document.getElementById('btn-pin-topic');
                    const list = document.getElementById('pinned-topics-list');
                    
                    const renderTopics = () => {
                        let topics = JSON.parse(localStorage.getItem('pinned_topics') || '[]');
                        list.innerHTML = '';
                        topics.forEach(top => {
                            let d = document.createElement('div');
                            d.style = "display:flex; justify-content:space-between; background:#f4f4f4; padding:8px; border-radius:5px; cursor:pointer;";
                            d.innerHTML = `<span style="flex:1; font-weight:bold;">🔎 ${top}</span><button style="border:none; background:none; cursor:pointer; color:red; font-size:1.1rem;">✖</button>`;
                            d.querySelector('span').onclick = () => {
                                search.value = top;
                                performSearch(top);
                            };
                            d.querySelector('button').onclick = (e) => {
                                e.stopPropagation();
                                topics = topics.filter(x => x !== top);
                                localStorage.setItem('pinned_topics', JSON.stringify(topics));
                                renderTopics();
                            };
                            list.appendChild(d);
                        });
                    };
                    renderTopics();

                    const performSearch = (val) => {
                        if(!val) return;
                        toast("Buscando...", true);
                        setTimeout(() => {
                            let matches = currentData.filter(x => x.type === 'verse' && x.text && x.text.toLowerCase().includes(val.toLowerCase()));
                            const PAGE_SIZE = 50;
                            let page = 0;
                            
                            const renderPage = (pageItems, isFirst) => {
                                if (isFirst) {
                                    viewReading(`Tema: ${val} (${matches.length} encontrados)`, pageItems, { type: 'filter' });
                                } else {
                                    // Agregar al readText existente
                                    const readText = document.getElementById('read-text');
                                    if (readText) {
                                        let loadBtn = document.getElementById('load-more-btn');
                                        pageItems.forEach(v => {
                                            const sp = document.createElement('span');
                                            sp.className = 'verse-text-span';
                                            sp.dataset.ref = `${v.book} ${v.reference}`;
                                            const vn = (v.reference||'').split(':')[1] || '';
                                            sp.innerHTML = `<span class="verse-num">${vn}</span>${window.formatVerseText ? window.formatVerseText(v.text) : (v.text || '')}`;
                                            if (typeof attachVerseTapBehavior === 'function') {
                                                attachVerseTapBehavior(sp, v.id);
                                            } else {
                                                sp.onclick = () => window.viewSingleVerse(v.id);
                                            }
                                            if (loadBtn && loadBtn.parentNode === readText) {
                                                readText.insertBefore(sp, loadBtn);
                                            } else {
                                                readText.appendChild(sp);
                                            }
                                        });
                                    }
                                }
                            };

                            // Primera página
                            renderPage(matches.slice(0, PAGE_SIZE), true);
                            page = 1;

                            // Botón cargar más si hay más resultados
                            if (matches.length > PAGE_SIZE) {
                                const readText = document.getElementById('read-text');
                                if (readText) {
                                    const loadMoreBtn = document.createElement('button');
                                    loadMoreBtn.id = 'load-more-btn';
                                    loadMoreBtn.style.cssText = 'display:block;width:100%;margin:12px 0;padding:10px;background:var(--secondary);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;';
                                    loadMoreBtn.textContent = `Cargar más resultados (${matches.length - PAGE_SIZE} restantes)`;
                                    loadMoreBtn.onclick = () => {
                                        renderPage(matches.slice(page * PAGE_SIZE, (page+1) * PAGE_SIZE), false);
                                        page++;
                                        const rem = matches.length - page * PAGE_SIZE;
                                        if (rem <= 0) loadMoreBtn.remove();
                                        else loadMoreBtn.textContent = `Cargar más (${rem} restantes)`;
                                    };
                                    readText.appendChild(loadMoreBtn);
                                }
                            }
                        }, 50);
                    };

                    search.onkeyup = (e) => {
                        if (e.key === 'Enter') performSearch(search.value.trim());
                    };
                    
                    btnPin.onclick = () => {
                        let val = search.value.trim();
                        if(!val) return;
                        let topics = JSON.parse(localStorage.getItem('pinned_topics') || '[]');
                        if(!topics.includes(val)) {
                            topics.push(val);
                            localStorage.setItem('pinned_topics', JSON.stringify(topics));
                            renderTopics();
                            performSearch(val);
                        }
                    };
                }
            }
            else if (t === 'sessions') {
                if (sidebarContent) {
                    sidebarContent.innerHTML = `
                        <div style="padding:10px;">
                            <button id="btn-new-session" style="width:100%; padding:10px; background:var(--primary); color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">➕ Crear Nueva Sesión</button>
                            <div id="draft-session-info" style="margin-top:10px;"></div>
                            <h4 style="margin-top:15px; border-bottom:1px solid #ccc; padding-bottom:5px;">📅 Mis Sesiones Programadas</h4>
                            <div id="sessions-list" style="margin-top:10px; display:flex; flex-direction:column; gap:5px;"></div>
                        </div>
                    `;
                    const renderSessions = () => {
                        let draftRefs = JSON.parse(localStorage.getItem('biblia_draft_refs') || '[]');
                        let draftDiv = document.getElementById('draft-session-info');
                        if (draftDiv) {
                            if (draftRefs.length > 0) {
                                const listHtml = draftRefs.map((r, i) =>
                                    `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:0.82rem;border-bottom:1px solid rgba(133,100,4,0.15);">`+
                                    `<span>📌 ${r}</span>`+
                                    `<button data-idx="${i}" class="btn-rm-draft-ses" style="border:none;background:none;cursor:pointer;color:#c0392b;font-size:0.9rem;padding:0 4px;">✖</button></div>`
                                ).join('');
                                draftDiv.innerHTML =
                                    `<div style="background:#fff3cd;padding:10px;border-radius:7px;border-left:4px solid #ffc107;font-size:0.9rem;">`+
                                    `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">`+
                                    `<b style="color:#856404;">📝 En construcción (${draftRefs.length})</b>`+
                                    `<div style="display:flex;gap:5px;">`+
                                    `<button id="btn-edit-draft-ses" style="padding:4px 9px;background:var(--primary);color:white;border:none;border-radius:5px;cursor:pointer;font-size:0.78rem;">✏️ Editar</button>`+
                                    `<button id="btn-clear-draft-ses" style="padding:4px 9px;background:#e74c3c;color:white;border:none;border-radius:5px;cursor:pointer;font-size:0.78rem;">🗑 Limpiar</button>`+
                                    `</div></div><div id="draft-ses-ref-list">${listHtml}</div></div>`;
                                draftDiv.querySelector('#btn-edit-draft-ses').onclick = () => window.openSessionEditor();
                                draftDiv.querySelector('#btn-clear-draft-ses').onclick = () => {
                                    if (confirm('¿Limpiar el borrador?')) {
                                        localStorage.removeItem('biblia_draft_refs');
                                        renderSessions();
                                    }
                                };
                                draftDiv.querySelectorAll('.btn-rm-draft-ses').forEach(btn => {
                                    btn.onclick = (e) => {
                                        e.stopPropagation();
                                        draftRefs.splice(parseInt(btn.dataset.idx), 1);
                                        localStorage.setItem('biblia_draft_refs', JSON.stringify(draftRefs));
                                        renderSessions();
                                    };
                                });
                            } else {
                                draftDiv.innerHTML = '';
                            }
                        }

                        let sessions = JSON.parse(localStorage.getItem('biblia_sessions') || '[]');
                        const list = document.getElementById('sessions-list');
                        list.innerHTML = '';
                        sessions.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach((s, idx) => {
                            let d = document.createElement('div');
                            d.style = "display:flex;justify-content:space-between;background:#e8f4f8;padding:10px;border-radius:5px;cursor:pointer;border-left:4px solid var(--primary);";
                            d.innerHTML = `<div style="flex:1;"><b>${s.date}</b><br><span style="font-size:0.9rem;">${s.title}</span></div>`+
                                `<button class="btn-edit-ses" style="border:none;background:none;cursor:pointer;color:var(--secondary);font-size:1.1rem;margin-right:5px;" title="Editar">✏️</button>`+
                                `<button class="btn-del-ses" style="border:none;background:none;cursor:pointer;color:red;font-size:1.1rem;" title="Eliminar">✖</button>`;
                            d.querySelector('div').onclick = () => window.viewSession(s);
                            d.querySelector('.btn-edit-ses').onclick = (e) => { e.stopPropagation(); window.openSessionEditor(s); };
                            d.querySelector('.btn-del-ses').onclick = (e) => {
                                e.stopPropagation();
                                if(confirm('¿Eliminar sesión?')) {
                                    sessions.splice(idx, 1);
                                    localStorage.setItem('biblia_sessions', JSON.stringify(sessions));
                                    renderSessions();
                                }
                            };
                            list.appendChild(d);
                        });
                    };
                    renderSessions();

                    window.openSessionEditor = (existingSession = null) => {
                        if(mainView) {
                            let draftRefs = JSON.parse(localStorage.getItem('biblia_draft_refs') || '[]');
                            let defaultRefs = draftRefs.join('\n');
                            
                            let isEdit = !!existingSession;
                            let sId = isEdit ? existingSession.id : 'ses_'+Date.now();
                            let sDate = isEdit ? existingSession.date : '';
                            let sTitle = isEdit ? existingSession.title : '';
                            let sRefs = isEdit ? existingSession.refs : defaultRefs;
                            let sShow = isEdit ? existingSession.showStudy : true;

                            mainView.innerHTML = `
                                <div class="verse-card" style="padding:15px; max-width:650px; margin:0 auto; box-shadow:0 4px 15px rgba(0,0,0,0.1); border-top:4px solid var(--primary);">
                                    <h2 style="font-size:1.3rem; margin-bottom:15px;">${isEdit ? '✏️ Editar Sesión' : '📅 Nueva Sesión / Agenda'}</h2>
                                    
                                    <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                                        <div style="flex:1; min-width:140px;">
                                            <label style="font-weight:bold; font-size:0.85rem; color:#555; display:block; margin-bottom:3px;">Fecha: <span id="ses-day-name" style="color:var(--secondary); font-weight:normal;"></span></label>
                                            <input type="date" id="ses-date" value="${sDate}" style="width:100%; padding:8px; border-radius:5px; border:1px solid #ccc; font-size:0.9rem;">
                                        </div>
                                        <div style="flex:2; min-width:200px;">
                                            <label style="font-weight:bold; font-size:0.85rem; color:#555; display:block; margin-bottom:3px;">Título / Ocasión:</label>
                                            <input type="text" id="ses-title" value="${sTitle}" placeholder="Ej: Servicio de Domingo" style="width:100%; padding:8px; border-radius:5px; border:1px solid #ccc; font-size:0.9rem;">
                                        </div>
                                    </div>

                                    <label style="font-weight:bold; font-size:0.85rem; color:#555; display:block; margin-bottom:3px;">Versículos a incluir:</label>
                                    <p style="font-size:0.75rem; color:#888; margin-bottom:5px; line-height:1.2;">Ejemplo: <b>Salmos 109:3-9</b> o <b>Juan 3:16</b> (uno por línea)</p>
                                    <textarea id="ses-refs" rows="6" style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #ccc; font-family:monospace; font-size:0.85rem; resize:vertical;">${sRefs}</textarea>
                                    
                                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                                        <label style="display:flex; align-items:center; gap:8px; font-weight:bold; font-size:0.85rem; cursor:pointer;">
                                            <input type="checkbox" id="ses-show-study" ${sShow ? 'checked' : ''} style="transform:scale(1.2);"> Mostrar Notas de Estudio
                                        </label>
                                        <button id="btn-save-session" style="padding:10px 20px; background:var(--primary); color:white; border:none; border-radius:6px; cursor:pointer; font-size:1rem; font-weight:bold;">💾 Guardar Sesión</button>
                                    </div>
                                </div>
                            `;

                            const updateDayName = () => {
                                let d = document.getElementById('ses-date').value;
                                if(d) {
                                    let dateObj = new Date(d + 'T12:00:00');
                                    let days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                                    document.getElementById('ses-day-name').textContent = `(${days[dateObj.getDay()]})`;
                                } else {
                                    document.getElementById('ses-day-name').textContent = '';
                                }
                            };
                            document.getElementById('ses-date').addEventListener('change', updateDayName);
                            updateDayName();

                            document.getElementById('btn-save-session').onclick = () => {
                                let d = document.getElementById('ses-date').value;
                                let t = document.getElementById('ses-title').value;
                                let r = document.getElementById('ses-refs').value;
                                let sh = document.getElementById('ses-show-study').checked;
                                if(!d || !t) return alert("La fecha y el título son obligatorios.");
                                
                                let sessions = JSON.parse(localStorage.getItem('biblia_sessions') || '[]');
                                let newSession = { id: sId, date: d, title: t, refs: r, showStudy: sh };
                                
                                if (isEdit) {
                                    let idx = sessions.findIndex(x => x.id === sId);
                                    if (idx > -1) sessions[idx] = newSession;
                                } else {
                                    sessions.push(newSession);
                                }
                                
                                localStorage.setItem('biblia_sessions', JSON.stringify(sessions));
                                if (!isEdit) localStorage.removeItem('biblia_draft_refs');
                                renderSessions();
                                toast("Sesión guardada exitosamente", false);
                                window.viewSession(newSession);
                            };
                        }
                    };

                    document.getElementById('btn-new-session').onclick = () => window.openSessionEditor();

                }
            }
            else if (t === 'clipboards') {
                if (sidebarContent) {
                    sidebarContent.innerHTML = `
                        <div style="padding:10px;">
                            <button id="btn-new-clipboard" style="width:100%; padding:10px; background:var(--primary); color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">➕ Crear Portapapeles</button>
                            <div id="draft-clipboard-info" style="margin-top:10px;"></div>
                            <h4 style="margin-top:15px; border-bottom:1px solid #ccc; padding-bottom:5px;">📎 Mis Portapapeles</h4>
                            <div id="clipboards-list" style="margin-top:10px; display:flex; flex-direction:column; gap:5px;"></div>
                        </div>
                    `;
                    const renderClipboards = () => {
                        let draftRefs = JSON.parse(localStorage.getItem('biblia_draft_clipboard_refs') || '[]');
                        let textsMap = JSON.parse(localStorage.getItem('biblia_draft_clipboard_texts') || '{}');
                        let draftDiv = document.getElementById('draft-clipboard-info');
                        if (draftDiv) {
                            if (draftRefs.length > 0) {
                                const listHtml = draftRefs.map((r, i) => {
                                    const preview = textsMap[r]
                                        ? `<span style="color:#555;font-size:0.78rem;display:block;margin-top:1px;">${textsMap[r].length > 80 ? textsMap[r].slice(0,80)+'...' : textsMap[r]}</span>`
                                        : '';
                                    return `<div style="padding:4px 0;border-bottom:1px solid rgba(133,100,4,0.15);">`+
                                        `<div style="display:flex;justify-content:space-between;align-items:flex-start;">`+
                                        `<span style="font-weight:bold;font-size:0.83rem;">📌 ${r}</span>`+
                                        `<button data-idx="${i}" class="btn-rm-draft-clip" style="border:none;background:none;cursor:pointer;color:#c0392b;font-size:0.9rem;padding:0 4px;flex-shrink:0;">✖</button></div>${preview}</div>`;
                                }).join('');
                                draftDiv.innerHTML =
                                    `<div style="background:#fff3cd;padding:10px;border-radius:7px;border-left:4px solid #ffc107;font-size:0.9rem;">`+
                                    `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">`+
                                    `<b style="color:#856404;">📎 En construcción (${draftRefs.length})</b>`+
                                    `<div style="display:flex;gap:5px;">`+
                                    `<button id="btn-copy-draft-clip" style="padding:4px 9px;background:var(--secondary);color:white;border:none;border-radius:5px;cursor:pointer;font-size:0.78rem;">📋 Copiar todo</button>`+
                                    `<button id="btn-edit-draft-clip" style="padding:4px 9px;background:var(--primary);color:white;border:none;border-radius:5px;cursor:pointer;font-size:0.78rem;">✏️ Guardar</button>`+
                                    `<button id="btn-clear-draft-clip" style="padding:4px 9px;background:#e74c3c;color:white;border:none;border-radius:5px;cursor:pointer;font-size:0.78rem;">🗑 Limpiar</button>`+
                                    `</div></div><div id="draft-clip-ref-list">${listHtml}</div></div>`;
                                draftDiv.querySelector('#btn-copy-draft-clip').onclick = () => {
                                    // Copiar con texto completo si disponible
                                    const lines = draftRefs.map(r => textsMap[r] || r);
                                    const text = lines.join('\n\n');
                                    window.copyTextToClipboard(text).then(() => { if(window.toast) window.toast('📋 Copiado con texto al portapapeles', false); }).catch(() => {});
                                };
                                draftDiv.querySelector('#btn-edit-draft-clip').onclick = () => window.openClipboardEditor();
                                draftDiv.querySelector('#btn-clear-draft-clip').onclick = () => {
                                    if (confirm('¿Limpiar el borrador de portapapeles?')) {
                                        localStorage.removeItem('biblia_draft_clipboard_refs');
                                        localStorage.removeItem('biblia_draft_clipboard_texts');
                                        renderClipboards();
                                    }
                                };
                                draftDiv.querySelectorAll('.btn-rm-draft-clip').forEach(btn => {
                                    btn.onclick = (e) => {
                                        e.stopPropagation();
                                        const idx = parseInt(btn.dataset.idx);
                                        const removedRef = draftRefs[idx];
                                        draftRefs.splice(idx, 1);
                                        delete textsMap[removedRef];
                                        localStorage.setItem('biblia_draft_clipboard_refs', JSON.stringify(draftRefs));
                                        localStorage.setItem('biblia_draft_clipboard_texts', JSON.stringify(textsMap));
                                        renderClipboards();
                                    };
                                });

                            } else {
                                draftDiv.innerHTML = `<div style="background:#f0f7ff;padding:10px;border-radius:5px;border-left:4px solid var(--secondary);font-size:0.9rem;cursor:pointer;" onclick="window.openClipboardEditor()">`+
                                    `<b style="color:var(--primary);">📎 Sin borrador activo</b><br>`+
                                    `<span style="color:#333;">Añade versículos con 📎 mientras lees para crear un portapapeles.</span></div>`;
                            }
                        }

                        let clipboards = JSON.parse(localStorage.getItem('biblia_clipboards') || '[]');
                        const list = document.getElementById('clipboards-list');
                        list.innerHTML = '';
                        clipboards.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach((c, idx) => {
                            let d = document.createElement('div');
                            d.style = "display:flex; justify-content:space-between; background:#e8f4f8; padding:10px; border-radius:5px; cursor:pointer; border-left:4px solid var(--primary);";
                            d.innerHTML = `<div style="flex:1;"><b>${c.date}</b><br><span style="font-size:0.9rem;">${c.title}</span></div><button class="btn-view-clip" style="border:none; background:none; cursor:pointer; color:var(--secondary); font-size:1.1rem; margin-right:5px;" title="Ver portapapeles">👁️</button><button class="btn-edit-clip" style="border:none; background:none; cursor:pointer; color:var(--primary); font-size:1.1rem; margin-right:5px;" title="Editar portapapeles">✏️</button><button class="btn-del-clip" style="border:none; background:none; cursor:pointer; color:red; font-size:1.1rem;" title="Eliminar portapapeles">✖</button>`;
                            d.querySelector('.btn-view-clip').onclick = (e) => { e.stopPropagation(); window.viewClipboard(c); };
                            d.querySelector('.btn-edit-clip').onclick = (e) => { e.stopPropagation(); window.openClipboardEditor(c); };
                            d.querySelector('.btn-del-clip').onclick = (e) => { e.stopPropagation(); if(confirm('¿Eliminar portapapeles?')) { clipboards.splice(idx,1); localStorage.setItem('biblia_clipboards', JSON.stringify(clipboards)); renderClipboards(); } };
                            d.onclick = () => window.viewClipboard(c);
                            list.appendChild(d);
                        });
                    };
                    renderClipboards();

                    window.openClipboardEditor = (existingClipboard = null, initialRefs = '') => {
                        if(mainView) {
                            let draftRefs = JSON.parse(localStorage.getItem('biblia_draft_clipboard_refs') || '[]');
                            let isEdit = !!existingClipboard;
                            let cId = isEdit ? existingClipboard.id : 'clip_' + Date.now();
                            let cDate = isEdit ? existingClipboard.date : new Date().toISOString().slice(0, 10);
                            let cTitle = isEdit ? existingClipboard.title : '';
                            let refs = [];
                            if (isEdit) {
                                refs = existingClipboard.refs ? existingClipboard.refs.split(/[,;\n]/).map(x => x.trim()).filter(x => x) : [];
                            } else {
                                refs = [...draftRefs];
                                if (initialRefs) refs.push(initialRefs);
                            }
                            let uniqueRefs = [];
                            refs.forEach(r => {
                                if (r && !uniqueRefs.includes(r)) uniqueRefs.push(r);
                            });
                            let cRefs = uniqueRefs.join('\n');

                            mainView.innerHTML = `
                                <div class="verse-card" style="padding:15px; max-width:650px; margin:0 auto; box-shadow:0 4px 15px rgba(0,0,0,0.1); border-top:4px solid var(--primary);">
                                    <h2 style="font-size:1.3rem; margin-bottom:15px;">${isEdit ? '✏️ Editar Portapapeles' : '📎 Nuevo Portapapeles'}</h2>
                                    <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                                        <div style="flex:1; min-width:140px;">
                                            <label style="font-weight:bold; font-size:0.85rem; color:#555; display:block; margin-bottom:3px;">Fecha:</label>
                                            <input type="date" id="clip-date" value="${cDate}" style="width:100%; padding:8px; border-radius:5px; border:1px solid #ccc; font-size:0.9rem;">
                                        </div>
                                        <div style="flex:2; min-width:200px;">
                                            <label style="font-weight:bold; font-size:0.85rem; color:#555; display:block; margin-bottom:3px;">Título:</label>
                                            <input type="text" id="clip-title" value="${cTitle}" placeholder="Ej: Versículos para el devocional" style="width:100%; padding:8px; border-radius:5px; border:1px solid #ccc; font-size:0.9rem;">
                                        </div>
                                    </div>
                                    <label style="font-weight:bold; font-size:0.85rem; color:#555; display:block; margin-bottom:3px;">Referencias en orden:</label>
                                    <p style="font-size:0.75rem; color:#888; margin-bottom:5px; line-height:1.2;">Cada línea guarda un libro, capítulo o versículo. Ej.: <b>Juan 3:16</b> o <b>Salmos 23</b>.</p>
                                    <textarea id="clip-refs" rows="6" style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #ccc; font-family:monospace; font-size:0.85rem; resize:vertical;">${cRefs}</textarea>
                                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                                        <button id="btn-save-clipboard" style="padding:10px 20px; background:var(--primary); color:white; border:none; border-radius:6px; cursor:pointer; font-size:1rem; font-weight:bold;">💾 Guardar Portapapeles</button>
                                    </div>
                                </div>
                            `;

                            document.getElementById('btn-save-clipboard').onclick = () => {
                                let d = document.getElementById('clip-date').value;
                                let t = document.getElementById('clip-title').value.trim();
                                let r = document.getElementById('clip-refs').value.trim();
                                if(!d || !t) return alert('La fecha y el título son obligatorios.');
                                let clipboards = JSON.parse(localStorage.getItem('biblia_clipboards') || '[]');
                                let newClipboard = { id: cId, date: d, title: t, refs: r };
                                if (isEdit) {
                                    let idx = clipboards.findIndex(x => x.id === cId);
                                    if (idx > -1) clipboards[idx] = newClipboard;
                                } else {
                                    clipboards.push(newClipboard);
                                }
                                localStorage.setItem('biblia_clipboards', JSON.stringify(clipboards));
                                if (!isEdit) localStorage.removeItem('biblia_draft_clipboard_refs');
                                renderClipboards();
                                if(window.toast) window.toast('Portapapeles guardado', false);
                                window.viewClipboard(newClipboard);
                            };
                        }
                    };

                    document.getElementById('btn-new-clipboard').onclick = () => window.openClipboardEditor();
                }
            }
            else if (t === 'info') {
                if (sidebarContent) {
                    sidebarContent.innerHTML = `<div style="padding:12px;color:#666;font-size:0.9rem;">📊 Infografía bíblica interactiva.<br><br><small>Muestra la arquitectura, distribución y métodos de estudio de la Biblia.</small></div>`;
                }
                if (mainView) {
                    mainView.innerHTML = `<div style="width:100%;height:80vh;"><iframe src="infografia.html" style="width:100%;height:100%;border:none;border-radius:8px;" title="Infografía Bíblica" loading="lazy"></iframe></div>`;
                }
            }
        }
        document.getElementById('tab-books').onclick = () => switchTab('books');
        document.getElementById('tab-persp').onclick = () => switchTab('persp');
        const tabSessions = document.getElementById('tab-sessions');
        if(tabSessions) tabSessions.onclick = () => switchTab('sessions');
        const tabClipboards = document.getElementById('tab-clipboards');
        if(tabClipboards) tabClipboards.onclick = () => switchTab('clipboards');
        const tabFilters = document.getElementById('tab-filters');
        if(tabFilters) tabFilters.onclick = () => switchTab('info');

        // Tab Infografía - reutiliza tab-filters (ya existe en HTML, solo cambia comportamiento)
        document.addEventListener('DOMContentLoaded', () => {
            const tf = document.getElementById('tab-filters');
            if (tf) {
                tf.style.display = 'inline-flex';
                tf.textContent = '📊 Info';
                tf.title = 'Infografía Bíblica';
            }
        });