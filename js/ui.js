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
                    ${v.cross_references && v.cross_references.length > 0 ? `<div class="verse-cross-ref">🔗 <b>Referencias:</b> ${v.cross_references.join(' • ')}</div>` : ''}
                </div>
                <div id="v-sections">
                    ${v.base_perspectives ? `<h3 class="study-section-title">📚 Estudio Bíblico</h3><div class="perspective-selector" id="b-btns"></div><div id="b-cont" class="perspective-content" style="display:none; border-color:var(--secondary);"></div>` : ''}
                    <h3 class="study-section-title">✍️ Mis Notas Personales</h3><div class="perspective-selector" id="p-btns"></div><div id="p-cont" class="perspective-content" style="display:none;"></div>
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
        };

        window.viewReading = (title, items, target, fromHistory = false) => {
            if (!fromHistory) pushHistory('viewReading', [title, items, target]);
            if (!mainView) return;
            mainView.innerHTML = '';

            const verses = items.filter(x => x.type === 'verse').sort((a, b) => {
                let idxA = BIBLE_BOOKS.indexOf((a.book || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
                let idxB = BIBLE_BOOKS.indexOf((b.book || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
                return (idxA - idxB) || (parseInt(a.chapter) - parseInt(b.chapter)) || (parseInt((a.reference||'').split(':')[1]) - parseInt((b.reference||'').split(':')[1]));
            });

            mainView.innerHTML = `<div class="sticky-tracker"><span id="tracker-ref" class="tracker-info">${title}</span><div class="tracker-nav">${target.type === 'chapter' ? '<button id="tr-prev">⬅️</button><button id="tr-next">➡️</button>' : ''}</div></div><div class="reading-container"><h2>${title}</h2><div id="notes-top"></div><div id="read-text"></div></div>`;

            const notesTop = document.getElementById('notes-top');
            const notes = currentData.filter(x => {
                if (x.type !== target.type + '_note') return false;
                if (target.type === 'chapter') return x.book === target.book && x.chapter === target.chapter;
                if (target.type === 'book') return x.book === target.book;
                if (target.type === 'category') return x.category === target.category;
                if (target.type === 'testament') return x.testament === target.testament;
                return false;
            });
            notes.forEach(n => {
                if (n.base_perspectives) Object.entries(n.base_perspectives).forEach(([k, v]) => notesTop.innerHTML += `<div class="level-note-card"><h4>📚 Estudio: ${k}</h4><p>${v}</p></div>`);
                if (n.perspectives) Object.entries(n.perspectives).forEach(([k, v]) => notesTop.innerHTML += `<div class="level-note-card personal"><h4>✍️ Mi Nota: ${k}</h4><p>${v}</p></div>`);
            });

            const readText = document.getElementById('read-text');
            if (readingObserver) readingObserver.disconnect();
            readingObserver = new IntersectionObserver(es => {
                es.forEach(e => {
                    if (e.isIntersecting) {
                        const t = document.getElementById('tracker-ref');
                        if (t) t.textContent = e.target.dataset.ref;
                        e.target.classList.add('active-reading');
                    } else e.target.classList.remove('active-reading');
                });
            }, { rootMargin: '-20% 0px -70% 0px' });

            verses.forEach(v => {
                let hasB = v.base_perspectives && Object.keys(v.base_perspectives).length > 0;
                let hasP = v.perspectives && Object.keys(v.perspectives).length > 0;
                let dot = (hasB ? `<span class="has-persp-dot base"></span>` : '') + (hasP ? `<span class="has-persp-dot"></span>` : '');

                let tt = '';
                if (hasB) tt += `<b>ESTUDIO:</b><br>${Object.values(v.base_perspectives).join('<br>')}<br><br>`;
                if (hasP) tt += `<b>MI NOTA:</b><br>${Object.values(v.perspectives).join('<br>')}`;

                let span = document.createElement('span');
                span.className = (hasB || hasP) ? 'verse-text-span tooltip' : 'verse-text-span';
                span.dataset.ref = `${v.book || ''} ${v.reference || ''}`;
                let vNum = (v.reference && v.reference.includes(':')) ? v.reference.split(':')[1] : (v.reference || '');
                span.innerHTML = `<span class="verse-num">${vNum}</span>${v.text || ''} ${dot} ${tt ? `<span class="tooltiptext">${tt}</span>` : ''}`;
                span.onclick = () => viewSingleVerse(v.id);
                readText.appendChild(span);
                readingObserver.observe(span);
            });

            if (target.type === 'chapter') {
                const p = document.getElementById('tr-prev');
                const n = document.getElementById('tr-next');
                if (p) p.onclick = () => nav(target, -1);
                if (n) n.onclick = () => nav(target, 1);
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