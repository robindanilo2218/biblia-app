/** UTILIDADES */
        const getBookInfo = (name) => {
            if (!name) return { testament: "Otros", category: "Otros" };
            let b = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/^san /g, "").replace(/^s\. /g, "");
            const cats = {
                "Pentateuco": ["genesis", "exodo", "levitico", "numeros", "deuteronomio"],
                "Historia": ["josue", "jueces", "rut", "1 samuel", "2 samuel", "1 reyes", "2 reyes", "1 cronicas", "2 cronicas", "esdras", "nehemias", "ester", "hechos", "hechos de los apostoles"],
                "Poesía": ["job", "salmos", "salmo", "proverbios", "eclesiastes", "cantares", "cantar de los cantares"],
                "Profetas": ["isaias", "jeremias", "lamentaciones", "ezequiel", "daniel", "oseas", "joel", "amos", "abdias", "jonas", "miqueas", "nahum", "habacuc", "sofonias", "hageo", "zacarias", "malaquias"],
                "Evangelios": ["mateo", "marcos", "lucas", "juan"],
                "Cartas": ["romanos", "1 corintios", "2 corintios", "galatas", "efesios", "filipenses", "colosenses", "1 tesalonicenses", "2 tesalonicenses", "1 timoteo", "2 timoteo", "tito", "filemon", "hebreos", "santiago", "1 pedro", "2 pedro", "1 juan", "2 juan", "3 juan", "judas"],
                "Profecía": ["apocalipsis"]
            };
            let found = "Otros";
            for (let c in cats) { if (cats[c].includes(b)) { found = c; break; } }
            let test = BIBLE_BOOKS.indexOf(b) < 41 ? "Antiguo Testamento" : "Nuevo Testamento";
            return { testament: test, category: found };
        };

        const toast = (msg, isSuccess = false) => {
            const t = document.getElementById('progress-toast');
            if (!t) return;
            t.textContent = msg;
            t.style.backgroundColor = isSuccess ? "#27ae60" : "#2c3e50";
            t.style.display = 'block';
            setTimeout(() => { t.style.display = 'none'; }, 3000);
        };