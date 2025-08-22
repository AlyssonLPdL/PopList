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
            updateList: (listName, updatedData) => ipcRenderer.invoke('update-list', listName, updatedData),
            openItemDetailWindow: (listName, itemId) => ipcRenderer.invoke('open-item-detail-window', listName, itemId),
            openCreateListWindow: () => ipcRenderer.invoke('open-create-list-window'),
            openSettingsWindow: (listName) => ipcRenderer.invoke('open-settings-window', listName),
            getAllListsData: () => ipcRenderer.invoke('get-all-lists-data'),
            renameList: (oldName, newName) => ipcRenderer.invoke('rename-list', oldName, newName),
            deleteList: (listName) => ipcRenderer.invoke('delete-list', listName),

            // window control
            openCreateItemWindow: (listName) => ipcRenderer.invoke('open-create-item-window', listName),
            openListWindow: (name) => ipcRenderer.invoke('open-list-window', name),
            minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
            maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
            closeWindow: () => ipcRenderer.invoke('close-window'),
            navigateTo: (route) => ipcRenderer.invoke('navigate-to', route),

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