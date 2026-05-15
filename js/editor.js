/** EDITOR */
        document.getElementById('btn-toggle-editor').onclick = () => {
            if (editorContainer) editorContainer.style.display = editorContainer.style.display === 'none' ? 'flex' : 'none';
        };
        document.getElementById('btn-save-note').onclick = () => {
            if (!editorTarget) return;
            const name = document.getElementById('new-persp-name').value.trim();
            const text = document.getElementById('new-persp-text').value.trim();
            if (!name || !text) return alert("Completa los campos");
            let item;
            if (editorTarget.type === 'verse') {
                item = currentData.find(x => x.id === editorTarget.id);
                if (!item) return alert('Versículo no encontrado');
                if (!item.perspectives) item.perspectives = {};
                item.perspectives[name.toLowerCase()] = text;
            } else {
                const t = editorTarget.type + '_note';
                item = currentData.find(x => {
                    if (x.type !== t) return false;
                    if (t === 'chapter_note') return x.book === editorTarget.book && String(x.chapter) === String(editorTarget.chapter);
                    if (t === 'book_note')    return x.book === editorTarget.book;
                    if (t === 'category_note') return x.category === editorTarget.category;
                    if (t === 'testament_note') return x.testament === editorTarget.testament;
                    return false;
                });
                if (!item) {
                    item = {
                        id: `n_${Date.now()}`,
                        type: t,
                        version:   editorTarget.version   || null,
                        book:      editorTarget.book      || null,
                        chapter:   editorTarget.chapter   != null ? String(editorTarget.chapter) : null,
                        category:  editorTarget.category  || null,
                        testament: editorTarget.testament || null,
                        perspectives: {}
                    };
                    currentData.push(item);
                }
                if (!item.perspectives) item.perspectives = {};
                item.perspectives[name.toLowerCase()] = text;
            }
            if (!db) return;
            let tx = db.transaction(['verses'], 'readwrite');
            tx.objectStore('verses').put(item);
            tx.oncomplete = async () => {
                await loadData();
                toast('Guardado', true);
                if (editorTarget.type === 'verse') viewSingleVerse(item.id);
                // para notas de capítulo/libro: no necesitamos navegar, simplemente refrescamos
            };
        };