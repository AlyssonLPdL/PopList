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

    win.loadURL(getBaseUrlForRoute(hash));
    if (isDev) win.webContents.openDevTools({ mode: 'detach' });
    return win;
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

ipcMain.handle('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
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
        return JSON.parse(fs.readFileSync(p, 'utf8'));
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
        frame: false, // REMOVE O FRAME PADRÃO DO ELECTRON
        transparent: true, // PERMITE FUNDO TRANSPARENTE
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
        const initial = { name: listName, items: [] };
        fs.writeFileSync(p, JSON.stringify(initial, null, 2), 'utf8');

        // broadcast to windows that lists changed
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('lists-updated'));

        return { ok: true };
    } catch (err) {
        console.error('create-list error', err);
        return { ok: false, reason: String(err) };
    }
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

/* IPC to open windows from renderer */
ipcMain.handle('open-create-item-window', async (event, listName) => {
    createChildWindowForRoute(`/create/${encodeURIComponent(listName)}`, {
        width: 420,
        height: 320,
        parent: mainWindow
    });
    return { ok: true };
});

ipcMain.handle('open-list-window', async (event, listName) => {
    const encoded = encodeURIComponent(listName);
    createChildWindowForRoute(`/list/${encoded}`, { width: 600, height: 500, parent: mainWindow, frame: false });
    return { ok: true };
});

ipcMain.handle('open-item-detail-window', async (event, listName, itemId) => {
    const encodedListName = encodeURIComponent(listName);
    const encodedItemId = encodeURIComponent(itemId);
    createChildWindowForRoute(`/item/${encodedListName}/${encodedItemId}`, {
        width: 600,
        height: 500,
        parent: mainWindow,
        frame: false
    });
    return { ok: true };
});

/* ping/getDataPath for debug if needed */
ipcMain.handle('pl_ping', async () => 'pong');
ipcMain.handle('pl_getDataPath', async () => userDataPath);
