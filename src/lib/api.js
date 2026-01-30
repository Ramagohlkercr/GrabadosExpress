// ============================================
// GRABADOS EXPRESS - API CLIENT
// HTTP client with offline support
// ============================================

import { 
    isOnline, 
    offlineData, 
    addToSyncQueue, 
    setLastSync 
} from './offlineStorage';

// In Vercel, API is on same domain at /api
// In development, use localhost:3001/api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Generic fetch wrapper with error handling and offline support
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
            throw new Error(error.error || `Error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        
        // If offline and it's a GET request, don't throw yet - let caller handle offline fallback
        if (!isOnline() && (!options.method || options.method === 'GET')) {
            throw { ...error, isOffline: true };
        }
        
        throw error;
    }
}

// Helper to try online first, then fallback to offline
async function withOfflineFallback(apiCall, offlineFallback, cacheCallback = null) {
    try {
        const result = await apiCall();
        // Cache successful result for offline use
        if (cacheCallback) {
            cacheCallback(result).catch(console.error);
        }
        return result;
    } catch (error) {
        if (!isOnline() || error.isOffline) {
            console.log('Offline mode: using cached data');
            return await offlineFallback();
        }
        throw error;
    }
}

// Helper to queue changes when offline
async function withOfflineQueue(type, operation, id, data, onlineAction, offlineLocalAction) {
    if (isOnline()) {
        try {
            const result = await onlineAction();
            // Update local cache on success
            if (offlineLocalAction) {
                await offlineLocalAction(result);
            }
            return result;
        } catch (error) {
            throw error;
        }
    } else {
        // Queue for later sync
        await addToSyncQueue({ type, operation, id, data });
        // Apply locally for immediate feedback
        if (offlineLocalAction) {
            await offlineLocalAction(data);
        }
        return { ...data, id: id || `offline_${Date.now()}`, _offline: true };
    }
}

// ============================================
// CLIENTES API - with offline support
// ============================================

export const clientesApi = {
    getAll: () => withOfflineFallback(
        () => apiRequest('/clientes'),
        () => offlineData.getClientes(),
        (data) => offlineData.saveClientes(data)
    ),
    getById: (id) => apiRequest(`/clientes?id=${id}`),
    create: (data) => withOfflineQueue(
        'clientes', 'create', null, data,
        () => apiRequest('/clientes', { method: 'POST', body: data }),
        (result) => offlineData.putCliente(result)
    ),
    update: (id, data) => withOfflineQueue(
        'clientes', 'update', id, data,
        () => apiRequest(`/clientes?id=${id}`, { method: 'PUT', body: data }),
        (result) => offlineData.putCliente({ ...result, id })
    ),
    delete: (id) => withOfflineQueue(
        'clientes', 'delete', id, null,
        () => apiRequest(`/clientes?id=${id}`, { method: 'DELETE' }),
        () => offlineData.deleteCliente(id)
    ),
};

// ============================================
// PRODUCTOS API - with offline support
// ============================================

export const productosApi = {
    getAll: () => withOfflineFallback(
        () => apiRequest('/productos'),
        () => offlineData.getProductos(),
        (data) => offlineData.saveProductos(data)
    ),
    getById: (id) => apiRequest(`/productos?id=${id}`),
    create: (data) => apiRequest('/productos', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/productos?id=${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/productos?id=${id}`, { method: 'DELETE' }),
};

// ============================================
// INSUMOS API - with offline support
// ============================================

export const insumosApi = {
    getAll: () => withOfflineFallback(
        () => apiRequest('/insumos'),
        () => offlineData.getInsumos(),
        (data) => offlineData.saveInsumos(data)
    ),
    getById: (id) => apiRequest(`/insumos?id=${id}`),
    create: (data) => withOfflineQueue(
        'insumos', 'create', null, data,
        () => apiRequest('/insumos', { method: 'POST', body: data }),
        (result) => offlineData.putInsumo(result)
    ),
    update: (id, data) => withOfflineQueue(
        'insumos', 'update', id, data,
        () => apiRequest(`/insumos?id=${id}`, { method: 'PUT', body: data }),
        (result) => offlineData.putInsumo({ ...result, id })
    ),
    updateStock: (id, cantidad, tipo) => apiRequest(`/insumos?id=${id}&action=stock`, {
        method: 'PATCH',
        body: { cantidad, tipo }
    }),
    delete: (id) => apiRequest(`/insumos?id=${id}`, { method: 'DELETE' }),
    getLowStock: () => apiRequest('/insumos?action=low-stock'),
};

// ============================================
// PEDIDOS API - with offline support
// ============================================

export const pedidosApi = {
    getAll: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return withOfflineFallback(
            () => apiRequest(`/pedidos${params ? `?${params}` : ''}`),
            () => offlineData.getPedidos(),
            (data) => offlineData.savePedidos(data)
        );
    },
    getById: (id) => apiRequest(`/pedidos?id=${id}`),
    create: (data) => withOfflineQueue(
        'pedidos', 'create', null, data,
        () => apiRequest('/pedidos', { method: 'POST', body: data }),
        (result) => offlineData.putPedido(result)
    ),
    update: (id, data) => withOfflineQueue(
        'pedidos', 'update', id, data,
        () => apiRequest(`/pedidos?id=${id}`, { method: 'PUT', body: data }),
        (result) => offlineData.putPedido({ ...result, id })
    ),
    updateEstado: (id, estado, fechaEntrega = null) => apiRequest(`/pedidos?id=${id}&action=estado`, {
        method: 'PATCH',
        body: { estado, fechaEntrega }
    }),
    delete: (id) => withOfflineQueue(
        'pedidos', 'delete', id, null,
        () => apiRequest(`/pedidos?id=${id}`, { method: 'DELETE' }),
        () => offlineData.deletePedido(id)
    ),
    getCalendar: (start, end) => {
        const params = new URLSearchParams({ start, end }).toString();
        return apiRequest(`/pedidos?action=calendario&${params}`);
    },
};

// ============================================
// COTIZACIONES API
// ============================================

export const cotizacionesApi = {
    getAll: () => apiRequest('/cotizaciones'),
    create: (data) => apiRequest('/cotizaciones', { method: 'POST', body: data }),
    delete: (id) => apiRequest(`/cotizaciones?id=${id}`, { method: 'DELETE' }),
};

// ============================================
// CONFIGURACION API - with offline support
// ============================================

export const configuracionApi = {
    getAll: () => withOfflineFallback(
        () => apiRequest('/configuracion'),
        () => offlineData.getConfiguracion(),
        (data) => offlineData.saveConfiguracion(data)
    ),
    update: (data) => apiRequest('/configuracion', { method: 'PUT', body: data }),
};

// ============================================
// ESTADISTICAS API
// ============================================

export const estadisticasApi = {
    get: () => apiRequest('/estadisticas'),
};

// ============================================
// GASTOS API
// ============================================

export const gastosApi = {
    getAll: () => apiRequest('/gastos'),
    getByMonth: (mes, anio) => apiRequest(`/gastos?mes=${mes}&anio=${anio}`),
    getById: (id) => apiRequest(`/gastos?id=${id}`),
    create: (data) => apiRequest('/gastos', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/gastos?id=${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/gastos?id=${id}`, { method: 'DELETE' }),
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthApi = {
    check: () => apiRequest('/health'),
};

// Export all as default
export default {
    clientes: clientesApi,
    productos: productosApi,
    insumos: insumosApi,
    pedidos: pedidosApi,
    cotizaciones: cotizacionesApi,
    configuracion: configuracionApi,
    estadisticas: estadisticasApi,
    gastos: gastosApi,
    health: healthApi,
};
