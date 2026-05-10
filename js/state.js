/** VARIABLES DE ESTADO Y DOM - Declaradas al inicio para evitar ReferenceError */
        const dbName = "BibliaPerspectivasDB";
        let db;
        let currentData = [];
        let editorTarget = null;
        let historyStack = [];
        let activeTab = 'books';
        let readingObserver = null;

        /** ELEMENTOS DOM */
        const mainView = document.getElementById('main-view-container');
        const globalEditor = document.getElementById('global-editor');
        const editorContainer = document.getElementById('editor-container');
        const sidebarContent = document.getElementById('sidebar-content');
        const btnBack = document.getElementById('btn-back');