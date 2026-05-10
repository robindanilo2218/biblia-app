/** AUTO-LOAD LOCAL */
        async function autoLoad() {
            let bData = null; let sData = null;
            let missingFiles = [];
            
            try { 
                let rb = await fetch('biblia.json'); 
                if (rb.ok) bData = await rb.json(); 
                else missingFiles.push('biblia.json');
            } catch (e) { missingFiles.push('biblia.json'); }
            
            try { 
                let rs = await fetch('estudiobiblico.json'); 
                if (rs.ok) sData = await rs.json(); 
                else missingFiles.push('estudiobiblico.json');
            } catch (e) { missingFiles.push('estudiobiblico.json'); }

            if (missingFiles.length > 0) {
                alert("Faltan los siguientes archivos para la carga automática:\n- " + missingFiles.join("\n- ") + "\n\nPor favor, si lo deseas, cárgalos manualmente desde el menú lateral.");
            }

            if (bData) {
                toast("Procesando datos automáticos...", true);
                let parsed = parseBible(bData);
                if (sData) {
                    let bMap = new Map(); 
                    let bookNameMap = new Map();
                    parsed.forEach(v => {
                        let nb = normalizeBookName(v.book);
                        bMap.set(nb + "_" + v.reference, v);
                        bookNameMap.set(nb, v.book);
                    });
                    
                    sData.forEach(s => {
                        let nb = normalizeBookName(s.book);
                        if (bookNameMap.has(nb)) s.book = bookNameMap.get(nb);

                        const stype = s.type || 'verse';
                        if (stype !== 'verse') {
                            s.id = s.id || ("n_" + Math.random());
                            s.base_perspectives = s.perspectives;
                            parsed.push(s);
                        } else {
                            let ex = bMap.get(nb + "_" + s.reference);
                            if (ex) {
                                ex.base_perspectives = { ...ex.base_perspectives, ...s.perspectives };
                                if (s.tags) ex.tags = [...new Set([...(ex.tags || []), ...s.tags])];
                                if (s.cross_references) ex.cross_references = [...new Set([...(ex.cross_references || []), ...s.cross_references])];
                            } else { 
                                s.id = s.id || ("s_" + Math.random()); 
                                s.type = 'verse'; 
                                s.base_perspectives = s.perspectives; 
                                parsed.push(s); 
                            }
                        }
                    });
                }
                saveChunks(parsed, 0, () => { loadData().then(() => { renderSidebarBooks(); if (currentData.length > 0) viewSingleVerse(currentData[0].id); }); });
            }
        }

        /** INICIO */
        window.onload = async () => {
            await initDB();
            await loadData();
            if (currentData.length === 0 && !localStorage.getItem('db_cleared')) {
                currentData = demoData;
                await autoLoad();
            }
            renderSidebarBooks();
            if (currentData.length > 0) viewSingleVerse(currentData[0].id);
        };