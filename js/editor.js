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
                if (!item.perspectives) item.perspectives = {};
                item.perspectives[name.toLowerCase()] = text;
            } else {
                const t = editorTarget.type + '_note';
                item = currentData.find(x => x.type === t && x.book === editorTarget.book && x.chapter === editorTarget.chapter);
                if (!item) item = { id: `n_${Date.now()}`, type: t, version: editorTarget.version, book: editorTarget.book, chapter: editorTarget.chapter, category: editorTarget.category, perspectives: {} };
                item.perspectives[name.toLowerCase()] = text;
            }
            if (!db) return;
            let tx = db.transaction(['verses'], 'readwrite'); tx.objectStore('verses').put(item);
            tx.oncomplete = async () => { await loadData(); toast("Guardado", true); if (editorTarget.type === 'verse') viewSingleVerse(item.id); else switchTab(activeTab); };
        };