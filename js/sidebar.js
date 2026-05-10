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

            for (let ver in tree) {
                let dVer = document.createElement('details'); dVer.open = true; dVer.innerHTML = `<summary>📖 ${ver}</summary>`;
                for (let test in tree[ver]) {
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
                        for (let book in tree[ver][test][cat]) {
                            let dBook = document.createElement('details'); dBook.innerHTML = `<summary>📘 ${book}</summary>`;
                            dBook.querySelector('summary').onclick = (e) => {
                                e.preventDefault(); dBook.open = !dBook.open;
                                if (dBook.open) {
                                    let all = []; Object.values(tree[ver][test][cat][book]).forEach(c => all.push(...c));
                                    viewReading(book, all, { type: 'book', version: ver, testament: test, category: cat, book: book });
                                }
                            };
                            // Lazy render chapters
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
                        }
                        dTest.appendChild(dCat);
                    }
                    dVer.appendChild(dTest);
                }
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
                    sidebarContent.innerHTML = '<div style="padding:10px;"><input type="text" id="w-search" placeholder="🔍 Buscar palabra..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;"></div><div id="search-res"></div>';
                    const search = sidebarContent.querySelector('#w-search');
                    if (search) {
                        search.onkeyup = (e) => {
                            if (e.key === 'Enter') {
                                let val = search.value.trim().toLowerCase();
                                let matches = currentData.filter(x => x.type === 'verse' && x.text && x.text.toLowerCase().includes(val));
                                viewReading(`Búsqueda: ${val}`, matches, { type: 'filter' });
                            }
                        };
                    }
                }
            }
        }
        document.getElementById('tab-books').onclick = () => switchTab('books');
        document.getElementById('tab-persp').onclick = () => switchTab('persp');
        document.getElementById('tab-filters').onclick = () => switchTab('filters');