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
            // Triple click para forzar actualización
            let clickCount = 0;
            let clickTimer;
            const appTitle = document.getElementById('app-title');
            if(appTitle) {
                appTitle.addEventListener('click', () => {
                    clickCount++;
                    if (clickCount >= 3) {
                        if(confirm("¿Forzar actualización de la app (Borrar caché y recargar)?")) {
                            if('caches' in window) {
                                caches.keys().then(names => {
                                    for (let name of names) caches.delete(name);
                                });
                            }
                            if('serviceWorker' in navigator) {
                                navigator.serviceWorker.getRegistrations().then(registrations => {
                                    for(let registration of registrations) {
                                        registration.unregister();
                                    }
                                });
                            }
                            setTimeout(() => window.location.reload(true), 500);
                        }
                        clickCount = 0;
                    }
                    clearTimeout(clickTimer);
                    clickTimer = setTimeout(() => clickCount = 0, 1000);
                });
            }

            await initDB();
            await loadData();
            if (currentData.length === 0 && !localStorage.getItem('db_cleared')) {
                currentData = demoData;
                await autoLoad();
            }
            renderSidebarBooks();
            if (currentData.length > 0) viewSingleVerse(currentData[0].id);
        };

        /** PWA INSTALL */
        let deferredInstallPrompt = null;
        const installBtn = document.getElementById('install-btn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            if (installBtn) installBtn.style.display = 'inline-block';
        });

        window.addEventListener('appinstalled', () => {
            if (installBtn) installBtn.style.display = 'none';
            deferredInstallPrompt = null;
        });

        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (deferredInstallPrompt) {
                    deferredInstallPrompt.prompt();
                    const { outcome } = await deferredInstallPrompt.userChoice;
                    if (outcome === 'accepted') installBtn.style.display = 'none';
                    deferredInstallPrompt = null;
                } else {
                    // iOS Safari no soporta beforeinstallprompt
                    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
                    if (isIOS) {
                        alert("Para instalar en iPhone/iPad:\n1. Toca el botón 'Compartir' (□↑)\n2. Selecciona 'Agregar a pantalla de inicio'");
                    } else {
                        alert("Para instalar:\n• Chrome: Menú (⋮) → 'Instalar aplicación'\n• Edge: Menú (…) → 'Aplicaciones' → 'Instalar'");
                    }
                }
            });
        }
