// preload.js (idempotente wrapper)
(() => {
    if (globalThis.__poplist_preload_loaded) return;
    globalThis.__poplist_preload_loaded = true;

    try {
        const { contextBridge, ipcRenderer } = require('electron');

        contextBridge.exposeInMainWorld('api', {
            // debug
            ping: () => ipcRenderer.invoke('pl_ping'),
            getDataPath: () => ipcRenderer.invoke('pl_getDataPath'),

            // lists FS
            getLists: () => ipcRenderer.invoke('get-lists'),
            onListsUpdated: (cb) => {
                ipcRenderer.on('lists-updated', cb);
                return () => ipcRenderer.removeListener('lists-updated', cb);
            },
            getList: (name) => ipcRenderer.invoke('get-list', name),
            createList: (name) => ipcRenderer.invoke('create-list', name),
            addItem: (listName, item) => ipcRenderer.invoke('add-item', listName, item),
            openItemDetailWindow: (listName, itemId) => ipcRenderer.invoke('open-item-detail-window', listName, itemId),
            openCreateListWindow: () => ipcRenderer.invoke('open-create-list-window'),

            // window control
            openCreateItemWindow: (listName) => ipcRenderer.invoke('open-create-item-window', listName),
            openListWindow: (name) => ipcRenderer.invoke('open-list-window', name),
            minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
            maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
            closeWindow: () => ipcRenderer.invoke('close-window'),
            // Adicione esta linha no contextoBridge.exposeInMainWorld:
            navigateTo: (route) => ipcRenderer.invoke('navigate-to', route),
            openListWindow: (name) => ipcRenderer.invoke('open-list-window', name),

            // subscription for updates (renderer receives 'lists-updated')
            onListsUpdated: (cb) => {
                ipcRenderer.on('lists-updated', cb);
                // retorna função para remover listener
                return () => ipcRenderer.removeListener('lists-updated', cb);
            },
        });
    } catch (err) {
        console.error('[preload] error', err);
    }
})();
