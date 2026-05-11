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
            
            if (t === 'books') renderSidebarBooks();
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
                                        pageItems.forEach(v => {
                                            const sp = document.createElement('span');
                                            sp.className = 'verse-text-span';
                                            sp.dataset.ref = `${v.book} ${v.reference}`;
                                            const vn = (v.reference||'').split(':')[1] || '';
                                            sp.innerHTML = `<span class="verse-num">${vn}</span>${v.text || ''}`;
                                            sp.onclick = () => window.viewSingleVerse(v.id);
                                            readText.appendChild(sp);
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
                            <h4 style="margin-top:15px; border-bottom:1px solid #ccc; padding-bottom:5px;">📅 Mis Sesiones Programadas</h4>
                            <div id="sessions-list" style="margin-top:10px; display:flex; flex-direction:column; gap:5px;"></div>
                        </div>
                    `;
                    const renderSessions = () => {
                        let sessions = JSON.parse(localStorage.getItem('biblia_sessions') || '[]');
                        const list = document.getElementById('sessions-list');
                        list.innerHTML = '';
                        sessions.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach((s, idx) => {
                            let d = document.createElement('div');
                            d.style = "display:flex; justify-content:space-between; background:#e8f4f8; padding:10px; border-radius:5px; cursor:pointer; border-left:4px solid var(--primary);";
                            d.innerHTML = `<div style="flex:1;"><b>${s.date}</b><br><span style="font-size:0.9rem;">${s.title}</span></div><button style="border:none; background:none; cursor:pointer; color:red; font-size:1.1rem;">✖</button>`;
                            d.querySelector('div').onclick = () => window.viewSession(s);
                            d.querySelector('button').onclick = (e) => {
                                e.stopPropagation();
                                if(confirm("¿Eliminar sesión?")) {
                                    sessions.splice(idx, 1);
                                    localStorage.setItem('biblia_sessions', JSON.stringify(sessions));
                                    renderSessions();
                                }
                            };
                            list.appendChild(d);
                        });
                    };
                    renderSessions();

                    document.getElementById('btn-new-session').onclick = () => {
                        if(mainView) {
                            mainView.innerHTML = `
                                <div class="verse-card" style="padding:20px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
                                    <h2>📅 Nueva Sesión / Agenda</h2>
                                    <label style="font-weight:bold;">Fecha:</label>
                                    <input type="date" id="ses-date" style="width:100%; padding:10px; margin-bottom:15px; border-radius:5px; border:1px solid #ccc;">
                                    <label style="font-weight:bold;">Título de la Sesión:</label>
                                    <input type="text" id="ses-title" placeholder="Ej: Servicio de Domingo" style="width:100%; padding:10px; margin-bottom:15px; border-radius:5px; border:1px solid #ccc;">
                                    <label style="font-weight:bold;">Versículos a incluir (uno por línea):</label>
                                    <p style="font-size:0.85rem; color:#666; margin-bottom:5px;">Ejemplo: <b>Salmos 109:3-9</b> o <b>Juan 3:16</b></p>
                                    <textarea id="ses-refs" rows="5" style="width:100%; padding:10px; margin-bottom:15px; border-radius:5px; border:1px solid #ccc; font-family:monospace;"></textarea>
                                    <label style="display:flex; align-items:center; gap:10px; margin-bottom:20px; font-weight:bold; cursor:pointer;">
                                        <input type="checkbox" id="ses-show-study" checked style="transform:scale(1.5);"> Mostrar Notas de Estudio durante la sesión
                                    </label>
                                    <button id="btn-save-session" style="width:100%; padding:12px; background:var(--primary); color:white; border:none; border-radius:8px; cursor:pointer; font-size:1.1rem; font-weight:bold;">💾 Guardar Sesión</button>
                                </div>
                            `;
                            document.getElementById('btn-save-session').onclick = () => {
                                let d = document.getElementById('ses-date').value;
                                let t = document.getElementById('ses-title').value;
                                let r = document.getElementById('ses-refs').value;
                                let sh = document.getElementById('ses-show-study').checked;
                                if(!d || !t) return alert("La fecha y el título son obligatorios.");
                                
                                let sessions = JSON.parse(localStorage.getItem('biblia_sessions') || '[]');
                                let newSession = { id: 'ses_'+Date.now(), date: d, title: t, refs: r, showStudy: sh };
                                sessions.push(newSession);
                                localStorage.setItem('biblia_sessions', JSON.stringify(sessions));
                                renderSessions();
                                toast("Sesión guardada exitosamente", false);
                                window.viewSession(newSession);
                            };
                        }
                    };
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