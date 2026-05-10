/** BASE DE DATOS */
        const initDB = () => new Promise((res, rej) => {
            const req = indexedDB.open(dbName, 2);
            req.onupgradeneeded = (e) => {
                if (!e.target.result.objectStoreNames.contains('verses')) e.target.result.createObjectStore('verses', { keyPath: 'id' });
            };
            req.onsuccess = (e) => { db = e.target.result; res(db); };
            req.onerror = (e) => rej(e.target.errorCode);
        });

        const loadData = () => new Promise((res) => {
            if (!db) return res([]);
            let req = db.transaction(['verses'], 'readonly').objectStore('verses').getAll();
            req.onsuccess = () => { currentData = req.result; res(currentData); };
        });