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
            getList: (name) => ipcRenderer.invoke('get-list', name),
            createList: (name) => ipcRenderer.invoke('create-list', name),
            addItem: (listName, item) => ipcRenderer.invoke('add-item', listName, item),
            editItem: (listName, itemId, updatedItem) => ipcRenderer.invoke('edit-item', listName, itemId, updatedItem),
            deleteItem: (listName, itemId) => ipcRenderer.invoke('delete-item', listName, itemId),
            updateList: (listName, updatedData) => ipcRenderer.invoke('update-list', listName, updatedData),
            openItemDetailWindow: (listName, itemId) => ipcRenderer.invoke('open-item-detail-window', listName, itemId),
            openCreateListWindow: () => ipcRenderer.invoke('open-create-list-window'),
            openSettingsWindow: (listName) => ipcRenderer.invoke('open-settings-window', listName),
            getAllListsData: () => ipcRenderer.invoke('get-all-lists-data'),
            renameList: (oldName, newName) => ipcRenderer.invoke('rename-list', oldName, newName),
            deleteList: (listName) => ipcRenderer.invoke('delete-list', listName),
            searchImages: (query, mediaType, apiType) =>
                ipcRenderer.invoke('search-images', query, mediaType, apiType),

            // Sequência de itens
            updateItemSequence: (listName, itemId, targetItemId, position) =>
                ipcRenderer.invoke('update-item-sequence', listName, itemId, targetItemId, position),
            removeItemSequence: (listName, itemId, sequenceType) =>
                ipcRenderer.invoke('remove-item-sequence', listName, itemId, sequenceType),

            // window control
            openCreateItemWindow: (listName) => ipcRenderer.invoke('open-create-item-window', listName),
            openEditItemWindow: (listName, itemId) => ipcRenderer.invoke('open-edit-item-window', listName, itemId),
            openListWindow: (name) => ipcRenderer.invoke('open-list-window', name),
            minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
            maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
            closeWindow: () => ipcRenderer.invoke('close-window'),
            navigateTo: (route) => ipcRenderer.invoke('navigate-to', route),
            openItemDetailWindowAndCloseCurrent: (listName, itemId) => ipcRenderer.invoke('open-item-detail-window-and-close-current', listName, itemId),

            // subscription for updates (renderer receives 'lists-updated')
            onListsUpdated: (callback) => {
                ipcRenderer.on('lists-updated', callback);
                return () => ipcRenderer.removeListener('lists-updated', callback);
            },
            // Adicionar função offListsUpdated para compatibilidade
            offListsUpdated: (callback) => {
                ipcRenderer.removeListener('lists-updated', callback);
            },
        });
    } catch (err) {
        console.error('[preload] error', err);
    }
})();