// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const isDev = require('electron-is-dev');
const devUrl = 'http://localhost:3000';
const buildIndex = path.join(__dirname, 'build', 'index.html');

const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'PopList');
const listsDir = path.join(userDataPath, 'lists');

let itemCounter = 0;

const ALL_TYPES = [
    { value: 'anime', api: 'anilist', label: 'Anime' },
    { value: 'manga', api: 'anilist', label: 'Manga' }
].map(t => t.value);

function sanitizeFileName(name) {
    return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

function ensureDirs() {
    try {
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
            console.log('Diretório criado:', userDataPath);
        }
        if (!fs.existsSync(listsDir)) {
            fs.mkdirSync(listsDir, { recursive: true });
            console.log('Diretório de listas criado:', listsDir);
        }
    } catch (err) {
        console.error('Erro ao criar diretórios:', err);
    }
}

function getBaseUrlForRoute(hash) {
    if (isDev) {
        return `${devUrl}#${hash}`;
    } else {
        // file://.../index.html#/<route>
        return `file://${buildIndex}#${hash}`;
    }
}

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 380,
        height: 500,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (isDev) {
        // Aponta pro React Dev Server
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        // Aponta pro build (produção)
        mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
    }
}

// Modifique a função createChildWindowForRoute:
function createChildWindowForRoute(hash, opts = {}) {
    const { width = 600, height = 500, parent, frame = true, resizable = true, transparent } = opts;
    const win = new BrowserWindow({
        width,
        height,
        parent: parent || null,
        modal: false,
        frame,
        resizable,
        transparent,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.on('closed', () => {
        // Quando a janela filha fecha, restaura o tamanho da principal se necessário
        // Apenas se a janela principal não estiver mostrando uma lista
        // if (parent && parent === mainWindow && !mainWindow.getURL().includes('/list/')) {
        //     mainWindow.setSize(380, 500, true);
        // }
    });

    win.loadURL(getBaseUrlForRoute(hash));
    if (isDev) win.webContents.openDevTools({ mode: 'detach' });
    return win;
}

function normalizeListStructure(listData, listName) {
    const defaultTypes = ['anime', 'manga']; // Tipos padrão

    return {
        name: listData?.name || listName,
        items: Array.isArray(listData?.items) ? listData.items : [],
        enabledTypes: Array.isArray(listData?.enabledTypes)
            ? listData.enabledTypes
            : defaultTypes,
        customTags: Array.isArray(listData?.customTags)
            ? listData.customTags
            : [],
        // Preservar outros campos que possam existir
        ...Object.fromEntries(
            Object.entries(listData || {}).filter(([key]) =>
                !['name', 'items', 'enabledTypes', 'customTags'].includes(key)
            )
        )
    };
}

/* App lifecycle */
app.whenReady().then(() => {
    ensureDirs();
    createMainWindow();
});

ipcMain.handle('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.minimize();
    }
});

ipcMain.handle('maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

// Substitua o handler close-window por este:
ipcMain.handle('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
        win.close();
    }
});
/* IPC handlers for FS operations */
ipcMain.handle('get-lists', async () => {
    try {
        ensureDirs();
        const files = fs.readdirSync(listsDir).filter(f => f.endsWith('.json'));
        // return array of names without extension
        return files.map(f => f.replace(/\.json$/, ''));
    } catch (err) {
        console.error('get-lists error', err);
        return [];
    }
});
ipcMain.handle('get-list', async (event, listName) => {
    try {
        const safe = sanitizeFileName(listName);
        const p = path.join(listsDir, `${safe}.json`);
        if (!fs.existsSync(p)) return null;

        const rawData = JSON.parse(fs.readFileSync(p, 'utf8'));
        return normalizeListStructure(rawData, listName);
    } catch (err) {
        console.error('get-list error', err);
        return null;
    }
});
ipcMain.handle('open-create-list-window', async (event) => {
    const win = createChildWindowForRoute(`/create-list`, {
        width: 400,
        height: 200,
        parent: mainWindow,
        resizable: false,
        minimizable: false,
        maximizable: false,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    return { ok: true };
});

ipcMain.handle('create-list', async (event, listName) => {
    try {
        ensureDirs();
        const safe = sanitizeFileName(listName);
        const p = path.join(listsDir, `${safe}.json`);
        if (fs.existsSync(p)) return { ok: false, reason: 'exists' };

        // Criar lista com estrutura normalizada
        const initialData = normalizeListStructure({}, listName);
        initialData.name = listName; // Garantir o nome correto

        fs.writeFileSync(p, JSON.stringify(initialData, null, 2), 'utf8');

        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('lists-updated'));
        return { ok: true };
    } catch (err) {
        console.error('create-list error', err);
        return { ok: false, reason: String(err) };
    }
});

ipcMain.handle('open-create-item-window', async (event, listName) => {
    const encoded = encodeURIComponent(listName);
    createChildWindowForRoute(`/create/${encoded}`, {
        width: 650,  // Aumentei a largura também para caber as duas colunas
        height: 600, // Aumentei a altura
        parent: mainWindow,
        frame: false,
        resizable: false,
    });
    return { ok: true };
});

ipcMain.handle('open-settings-window', async (event, listName) => {
    const encoded = encodeURIComponent(listName);
    createChildWindowForRoute(`/settings/${encoded}`, {
        width: 500,
        height: 600,
        parent: mainWindow,
        frame: false,
        resizable: false,
    });
    return { ok: true };
});

ipcMain.handle('add-item', async (event, listName, item) => {
    try {
        console.log('Tentando adicionar item à lista:', listName);
        const safe = sanitizeFileName(listName);
        const p = path.join(listsDir, `${safe}.json`);
        if (!fs.existsSync(p)) {
            console.log('Arquivo não encontrado:', p);
            return { ok: false, reason: 'notfound' };
        }
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        // simple id
        item.id = ++itemCounter;
        data.items.push(item);
        fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');

        // notify windows (so list views can refresh)
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('lists-updated'));
        return { ok: true, item };
    } catch (err) {
        console.error('add-item error', err);
        return { ok: false, reason: String(err) };
    }
});
ipcMain.handle('update-list', async (event, listName, updatedData) => {
    try {
        const safe = sanitizeFileName(listName);
        const p = path.join(listsDir, `${safe}.json`);

        if (!fs.existsSync(p)) {
            return { ok: false, reason: 'notfound' };
        }

        // Ler e normalizar dados existentes
        const existingData = JSON.parse(fs.readFileSync(p, 'utf8'));
        const normalizedExisting = normalizeListStructure(existingData, listName);

        // Mesclar dados normalizados com atualizações
        const mergedData = {
            ...normalizedExisting,
            ...updatedData
        };

        fs.writeFileSync(p, JSON.stringify(mergedData, null, 2), 'utf8');

        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('lists-updated'));
        return { ok: true };
    } catch (err) {
        console.error('update-list error', err);
        return { ok: false, reason: String(err) };
    }
});
ipcMain.handle('get-all-lists-data', async () => {
    try {
        ensureDirs();
        const files = fs.readdirSync(listsDir).filter(f => f.endsWith('.json'));

        const listsData = [];
        for (const file of files) {
            try {
                const safeName = file.replace(/\.json$/, '');
                const p = path.join(listsDir, file);
                const rawData = JSON.parse(fs.readFileSync(p, 'utf8'));
                const normalizedData = normalizeListStructure(rawData, safeName);
                listsData.push(normalizedData);
            } catch (err) {
                console.error(`Erro ao ler arquivo ${file}:`, err);
            }
        }

        return listsData;
    } catch (err) {
        console.error('get-all-lists-data error', err);
        return [];
    }
});

// Handler para renomear uma lista (se necessário)
ipcMain.handle('rename-list', async (event, oldName, newName) => {
    try {
        const safeOldName = sanitizeFileName(oldName);
        const safeNewName = sanitizeFileName(newName);

        const oldPath = path.join(listsDir, `${safeOldName}.json`);
        const newPath = path.join(listsDir, `${safeNewName}.json`);

        if (!fs.existsSync(oldPath)) {
            return { ok: false, reason: 'notfound' };
        }

        if (fs.existsSync(newPath)) {
            return { ok: false, reason: 'exists' };
        }

        // Ler dados existentes
        const data = JSON.parse(fs.readFileSync(oldPath, 'utf8'));

        // Atualizar nome na estrutura de dados
        data.name = newName;

        // Escrever no novo arquivo
        fs.writeFileSync(newPath, JSON.stringify(data, null, 2), 'utf8');

        // Remover arquivo antigo
        fs.unlinkSync(oldPath);

        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('lists-updated'));
        return { ok: true };
    } catch (err) {
        console.error('rename-list error', err);
        return { ok: false, reason: String(err) };
    }
});

// Handler para deletar uma lista (se necessário)
ipcMain.handle('delete-list', async (event, listName) => {
    try {
        const safe = sanitizeFileName(listName);
        const p = path.join(listsDir, `${safe}.json`);

        if (!fs.existsSync(p)) {
            return { ok: false, reason: 'notfound' };
        }

        fs.unlinkSync(p);

        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('lists-updated'));
        return { ok: true };
    } catch (err) {
        console.error('delete-list error', err);
        return { ok: false, reason: String(err) };
    }
});
/* IPC to open windows from renderer */
ipcMain.handle('open-list-window', async (event, listName) => {
    const encoded = encodeURIComponent(listName);

    // Redimensiona a janela principal
    mainWindow.setSize(610, 500, true);

    // Carrega a URL
    mainWindow.loadURL(getBaseUrlForRoute(`/list/${encoded}`));

    return { ok: true };
});

ipcMain.handle('navigate-to', async (event, route) => {
    // Para voltar à tela principal, redimensiona para o tamanho original
    if (route === '/') {
        mainWindow.setSize(380, 500, true);
    }

    mainWindow.loadURL(getBaseUrlForRoute(route));
    return { ok: true };
});

ipcMain.handle('open-item-detail-window', async (event, listName, itemId) => {
    const encodedListName = encodeURIComponent(listName);
    const encodedItemId = encodeURIComponent(itemId);

    // Cria uma janela filha independente
    const win = new BrowserWindow({
        width: 600,
        height: 500,
        parent: mainWindow,
        modal: false,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.loadURL(getBaseUrlForRoute(`/item/${encodedListName}/${encodedItemId}`));
    if (isDev) win.webContents.openDevTools({ mode: 'detach' });

    return { ok: true };
});

/* ping/getDataPath for debug if needed */
ipcMain.handle('pl_ping', async () => 'pong');
ipcMain.handle('pl_getDataPath', async () => userDataPath);
