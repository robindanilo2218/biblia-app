/** AUTO-LOAD LOCAL */
        async function autoLoad() {
            let bData = null; let sData = null;
            try { let rb = await fetch('biblia.json'); if (rb.ok) bData = await rb.json(); } catch (e) { }
            try { let rs = await fetch('estudio_completo.json'); if (rs.ok) sData = await rs.json(); } catch (e) { }

            if (bData) {
                let parsed = parseBible(bData);
                if (sData) {
                    let bMap = new Map(); parsed.forEach(v => bMap.set(v.book + "_" + v.reference, v));
                    sData.forEach(s => {
                        let ex = bMap.get(s.book + "_" + s.reference);
                        if (ex) {
                            ex.base_perspectives = s.perspectives;
                            if (s.tags) ex.tags = [...new Set([...(ex.tags || []), ...s.tags])];
                            if (s.cross_references) ex.cross_references = [...new Set([...(ex.cross_references || []), ...s.cross_references])];
                        }
                        else { s.id = "s_" + Math.random(); s.type = 'verse'; s.base_perspectives = s.perspectives; parsed.push(s); }
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