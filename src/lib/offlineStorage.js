// ============================================
// GRABADOS EXPRESS - Offline Storage with IndexedDB
// ============================================

const DB_NAME = 'grabados-express-offline';
const DB_VERSION = 1;

let db = null;

// Initialize IndexedDB
export async function initOfflineDB() {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Stores for cached data
            if (!database.objectStoreNames.contains('pedidos')) {
                database.createObjectStore('pedidos', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('clientes')) {
                database.createObjectStore('clientes', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('productos')) {
                database.createObjectStore('productos', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('insumos')) {
                database.createObjectStore('insumos', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('configuracion')) {
                database.createObjectStore('configuracion', { keyPath: 'key' });
            }

            // Store for pending sync operations
            if (!database.objectStoreNames.contains('syncQueue')) {
                const syncStore = database.createObjectStore('syncQueue', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                syncStore.createIndex('timestamp', 'timestamp');
            }

            // Store for last sync timestamps
            if (!database.objectStoreNames.contains('metadata')) {
                database.createObjectStore('metadata', { keyPath: 'key' });
            }
        };
    });
}

// Generic CRUD for IndexedDB
async function getFromStore(storeName) {
    await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function saveToStore(storeName, data) {
    await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Clear and repopulate
        store.clear();
        data.forEach(item => store.put(item));
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

async function putInStore(storeName, item) {
    await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function deleteFromStore(storeName, id) {
    await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// ============================================
// SYNC QUEUE - Queue changes when offline
// ============================================

export async function addToSyncQueue(operation) {
    await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('syncQueue', 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const request = store.add({
            ...operation,
            timestamp: Date.now(),
            synced: false
        });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

export async function getSyncQueue() {
    await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('syncQueue', 'readonly');
        const store = transaction.objectStore('syncQueue');
        const index = store.index('timestamp');
        const request = index.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

export async function clearSyncQueue() {
    await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('syncQueue', 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function removeSyncItem(id) {
    await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('syncQueue', 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// ============================================
// CACHED DATA - Read/Write from IndexedDB
// ============================================

export const offlineData = {
    // Pedidos
    getPedidos: () => getFromStore('pedidos'),
    savePedidos: (data) => saveToStore('pedidos', data),
    putPedido: (pedido) => putInStore('pedidos', pedido),
    deletePedido: (id) => deleteFromStore('pedidos', id),

    // Clientes
    getClientes: () => getFromStore('clientes'),
    saveClientes: (data) => saveToStore('clientes', data),
    putCliente: (cliente) => putInStore('clientes', cliente),
    deleteCliente: (id) => deleteFromStore('clientes', id),

    // Productos
    getProductos: () => getFromStore('productos'),
    saveProductos: (data) => saveToStore('productos', data),

    // Insumos
    getInsumos: () => getFromStore('insumos'),
    saveInsumos: (data) => saveToStore('insumos', data),
    putInsumo: (insumo) => putInStore('insumos', insumo),

    // Configuracion
    getConfiguracion: async () => {
        const data = await getFromStore('configuracion');
        if (data.length > 0) {
            return data.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
        }
        return null;
    },
    saveConfiguracion: async (config) => {
        await initOfflineDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('configuracion', 'readwrite');
            const store = transaction.objectStore('configuracion');
            store.clear();
            Object.entries(config).forEach(([key, value]) => {
                store.put({ key, value });
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
};

// ============================================
// METADATA - Track sync status
// ============================================

export async function getLastSync(type) {
    await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('metadata', 'readonly');
        const store = transaction.objectStore('metadata');
        const request = store.get(`lastSync_${type}`);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result?.value || null);
    });
}

export async function setLastSync(type) {
    await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('metadata', 'readwrite');
        const store = transaction.objectStore('metadata');
        const request = store.put({ key: `lastSync_${type}`, value: Date.now() });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// ============================================
// ONLINE STATUS
// ============================================

let onlineListeners = [];

export function isOnline() {
    return navigator.onLine;
}

export function onOnlineChange(callback) {
    onlineListeners.push(callback);
    
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        onlineListeners = onlineListeners.filter(l => l !== callback);
    };
}

// ============================================
// SYNC MANAGER - Synchronize when back online
// ============================================

export async function syncPendingChanges(apiHandlers) {
    if (!isOnline()) return { synced: 0, failed: 0 };

    const queue = await getSyncQueue();
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
        try {
            const handler = apiHandlers[item.type];
            if (handler) {
                switch (item.operation) {
                    case 'create':
                        await handler.create(item.data);
                        break;
                    case 'update':
                        await handler.update(item.id, item.data);
                        break;
                    case 'delete':
                        await handler.delete(item.id);
                        break;
                }
                await removeSyncItem(item.id);
                synced++;
            }
        } catch (error) {
            console.error('Sync failed for item:', item, error);
            failed++;
        }
    }

    return { synced, failed };
}

// Initialize on load
initOfflineDB().catch(console.error);
