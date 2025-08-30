// main.js
import { searchAniListMultiple } from './src/utils/anilistApi.js';
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

// Para obter o equivalente ao __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar isDev como padrão
import isDev from 'electron-is-dev';

const devUrl = 'http://localhost:3000';
const buildIndex = path.join(__dirname, 'build', 'index.html');

const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'PopList');
const listsDir = path.join(userDataPath, 'lists');

let itemCounter = 0;

const ALL_TYPES = [
    { value: 'anime', api: 'anilist', label: 'Anime' },
    { value: 'manga', api: 'anilist', label: 'Manga' }
].map(t => t.value);

async function initializeItemCounter() {
    try {
        ensureDirs();
        const files = fs.readdirSync(listsDir).filter(f => f.endsWith('.json'));
        let maxId = 0;

        for (const file of files) {
            try {
                const safeName = file.replace(/\.json$/, '');
                const p = path.join(listsDir, file);
                const rawData = JSON.parse(fs.readFileSync(p, 'utf8'));

                if (rawData.items && Array.isArray(rawData.items)) {
                    for (const item of rawData.items) {
                        if (item.id && item.id > maxId) {
                            maxId = item.id;
                        }
                    }
                }
            } catch (err) {
                console.error(`Erro ao processar arquivo ${file}:`, err);
            }
        }

        itemCounter = maxId;
        console.log(`Item counter inicializado com: ${itemCounter}`);
    } catch (err) {
        console.error('Erro ao inicializar itemCounter:', err);
        itemCounter = 0;
    }
}

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

// Função auxiliar para ler uma lista
async function readList(listName) {
    try {
        const safe = sanitizeFileName(listName);
        const p = path.join(listsDir, `${safe}.json`);
        if (!fs.existsSync(p)) return null;

        const rawData = JSON.parse(fs.readFileSync(p, 'utf8'));
        return normalizeListStructure(rawData, listName);
    } catch (err) {
        console.error('Erro ao ler lista:', err);
        return null;
    }
}

// Função auxiliar para salvar uma lista
async function saveList(listName, listData) {
    try {
        const safe = sanitizeFileName(listName);
        const p = path.join(listsDir, `${safe}.json`);
        fs.writeFileSync(p, JSON.stringify(listData, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Erro ao salvar lista:', err);
        return false;
    }
}

/* App lifecycle */
app.whenReady().then(async () => {
    ensureDirs();
    await initializeItemCounter(); // Inicializa o contador com base nos itens existentes
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

// Handler edit-item corrigido
ipcMain.handle('edit-item', async (event, listName, itemId, updatedItem) => {
    try {
        const list = await readList(listName);
        if (!list) return { ok: false, reason: 'Lista não encontrada' };

        const itemIndex = list.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return { ok: false, reason: 'Item não encontrado' };

        // Preserva a imagem e sequência se não foram fornecidas
        if (!updatedItem.thumb) {
            updatedItem.thumb = list.items[itemIndex].thumb;
        }

        // Preserva a sequência se não foi fornecida
        if (!updatedItem.next) {
            updatedItem.next = list.items[itemIndex].next;
        }

        if (!updatedItem.prev) {
            updatedItem.prev = list.items[itemIndex].prev;
        }

        list.items[itemIndex] = updatedItem;
        await saveList(listName, list);

        // Notificar todas as janelas sobre a atualização
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('lists-updated'));

        return { ok: true };
    } catch (error) {
        console.error('Erro ao editar item:', error);
        return { ok: false, reason: error.message };
    }
});
// main.js - Substitua o handler search-images por este:
ipcMain.handle('search-images', async (event, query, mediaType, apiType) => {
    try {
        // Implementar a lógica de busca baseada na API
        if (apiType === 'anime' || apiType === 'manga') {
            // Buscar múltiplos resultados na AniList
            const results = await searchAniListMultiple(query, mediaType.toUpperCase());
            return results.map(item => ({
                url: item.coverImage?.large || item.coverImage?.medium,
                title: item.title.romaji || item.title.english || query
            }));
        }
        // Adicione outros casos para outras APIs aqui

        return [];
    } catch (error) {
        console.error('Erro na busca de imagens:', error);
        return [];
    }
});
// Handler delete-item corrigido
ipcMain.handle('delete-item', async (event, listName, itemId) => {
    try {
        const list = await readList(listName);
        if (!list) return { ok: false, reason: 'Lista não encontrada' };

        // Encontrar o item para remover referências de sequência
        const itemToDelete = list.items.find(item => item.id === itemId);
        if (!itemToDelete) return { ok: false, reason: 'Item não encontrado' };

        // Remover referências de sequência de outros itens
        if (itemToDelete.next) {
            const nextItemIndex = list.items.findIndex(item => item.id === itemToDelete.next.id);
            if (nextItemIndex !== -1) {
                list.items[nextItemIndex].prev = null;
            }
        }

        if (itemToDelete.prev) {
            const prevItemIndex = list.items.findIndex(item => item.id === itemToDelete.prev.id);
            if (prevItemIndex !== -1) {
                list.items[prevItemIndex].next = null;
            }
        }

        // Remover o item
        list.items = list.items.filter(item => item.id !== itemId);
        await saveList(listName, list);

        // Notificar todas as janelas sobre a atualização
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('lists-updated'));

        return { ok: true };
    } catch (error) {
        console.error('Erro ao excluir item:', error);
        return { ok: false, reason: error.message };
    }
});

// Handler update-item-sequence corrigido
ipcMain.handle('update-item-sequence', async (event, listName, itemId, targetItemId, position) => {
    try {
        const list = await readList(listName);
        if (!list) {
            console.log('Lista não encontrada');
            return { ok: false, reason: 'Lista não encontrada' };
        }
        const itemIndex = list.items.findIndex(item => item.id === itemId);
        const targetItemIndex = list.items.findIndex(item => item.id === targetItemId);

        if (itemIndex === -1 || targetItemIndex === -1) {
            console.log('Item não encontrado');
            return { ok: false, reason: 'Item não encontrado' };
        }

        const item = list.items[itemIndex];
        const targetItem = list.items[targetItemIndex];

        if (position === 'before') {
            // Definir targetItem como anterior do item atual
            item.prev = { id: targetItem.id, name: targetItem.name, thumb: targetItem.thumb };

            // Se targetItem tinha um próximo, atualizar a referência
            if (targetItem.next) {
                const nextItemIndex = list.items.findIndex(i => i.id === targetItem.next.id);
                if (nextItemIndex !== -1) {
                    list.items[nextItemIndex].prev = { id: item.id, name: item.name, thumb: item.thumb };
                }
            }

            // Atualizar o próximo do targetItem para apontar para o item atual
            targetItem.next = { id: item.id, name: item.name, thumb: item.thumb };
        } else if (position === 'after') {
            // Definir targetItem como próximo do item atual
            item.next = { id: targetItem.id, name: targetItem.name, thumb: targetItem.thumb };

            // Se targetItem tinha um anterior, atualizar a referência
            if (targetItem.prev) {
                const prevItemIndex = list.items.findIndex(i => i.id === targetItem.prev.id);
                if (prevItemIndex !== -1) {
                    list.items[prevItemIndex].next = { id: item.id, name: item.name, thumb: item.thumb };
                }
            }

            // Atualizar o anterior do targetItem para apontar para o item atual
            targetItem.prev = { id: item.id, name: item.name, thumb: item.thumb };
        }

        await saveList(listName, list);
        console.log('Sequência atualizada com sucesso');

        // Notificar todas as janelas sobre a atualização
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('lists-updated'));

        return { ok: true };
    } catch (error) {
        console.error('Erro ao atualizar sequência:', error);
        return { ok: false, reason: error.message };
    }
});

// Handler remove-item-sequence corrigido
ipcMain.handle('remove-item-sequence', async (event, listName, itemId, sequenceType) => {
    try {
        const list = await readList(listName);
        if (!list) return { ok: false, reason: 'Lista não encontrada' };

        const itemIndex = list.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return { ok: false, reason: 'Item não encontrado' };

        const item = list.items[itemIndex];

        if (sequenceType === 'prev' && item.prev) {
            // Encontrar o item anterior e remover a referência
            const prevItemIndex = list.items.findIndex(i => i.id === item.prev.id);
            if (prevItemIndex !== -1) {
                list.items[prevItemIndex].next = null;
            }
            item.prev = null;
        } else if (sequenceType === 'next' && item.next) {
            // Encontrar o próximo item e remover a referência
            const nextItemIndex = list.items.findIndex(i => i.id === item.next.id);
            if (nextItemIndex !== -1) {
                list.items[nextItemIndex].prev = null;
            }
            item.next = null;
        }

        await saveList(listName, list);

        // Notificar todas as janelas sobre a atualização
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('lists-updated'));

        return { ok: true };
    } catch (error) {
        console.error('Erro ao remover sequência:', error);
        return { ok: false, reason: error.message };
    }
});

// Abrir janela de edição de item
ipcMain.handle('open-edit-item-window', async (event, listName, itemId) => {
    const encodedListName = encodeURIComponent(listName);
    const encodedItemId = encodeURIComponent(itemId);

    createChildWindowForRoute(`/edit/${encodedListName}/${encodedItemId}`, {
        width: 700,
        height: 700,
        parent: BrowserWindow.getFocusedWindow(),
        modal: true,
        resizable: false,
        frame: false
    });

    return { ok: true };
});

// Handler para navegar entre itens (fechar atual e abrir novo)
ipcMain.handle('open-item-detail-window-and-close-current', async (event, listName, itemId) => {
    try {
        // Obter a janela atual
        const currentWindow = BrowserWindow.fromWebContents(event.sender);

        // Criar a nova janela de detalhes do item
        const detailWindow = new BrowserWindow({
            width: 600,
            height: 500,
            parent: mainWindow,
            modal: false,
            frame: false,
            show: false, // Inicialmente oculta
            alwaysOnTop: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        });

        // Carregar a URL do detalhe do item
        await detailWindow.loadURL(getBaseUrlForRoute(`/item/${encodeURIComponent(listName)}/${encodeURIComponent(itemId)}`));

        // Quando a nova janela estiver pronta para ser mostrada, fechar a janela atual
        detailWindow.once('ready-to-show', () => {
            detailWindow.show();
            if (currentWindow) {
                currentWindow.close();
            }
        });
    } catch (error) {
        console.error('Erro ao navegar para o item:', error);
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