// ============================================
// GRABADOS EXPRESS - API CLIENT
// HTTP client for backend communication
// ============================================

// In Vercel, API is on same domain at /api
// In development, use localhost:3001/api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Generic fetch wrapper with error handling
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
        throw error;
    }
}

// ============================================
// CLIENTES API
// ============================================

export const clientesApi = {
    getAll: () => apiRequest('/clientes'),
    getById: (id) => apiRequest(`/clientes/${id}`),
    create: (data) => apiRequest('/clientes', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/clientes/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/clientes/${id}`, { method: 'DELETE' }),
};

// ============================================
// PRODUCTOS API
// ============================================

export const productosApi = {
    getAll: () => apiRequest('/productos'),
    getById: (id) => apiRequest(`/productos/${id}`),
    create: (data) => apiRequest('/productos', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/productos/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/productos/${id}`, { method: 'DELETE' }),
};

// ============================================
// INSUMOS API
// ============================================

export const insumosApi = {
    getAll: () => apiRequest('/insumos'),
    getById: (id) => apiRequest(`/insumos/${id}`),
    create: (data) => apiRequest('/insumos', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/insumos/${id}`, { method: 'PUT', body: data }),
    updateStock: (id, cantidad, tipo) => apiRequest(`/insumos/${id}/stock`, {
        method: 'PATCH',
        body: { cantidad, tipo }
    }),
    delete: (id) => apiRequest(`/insumos/${id}`, { method: 'DELETE' }),
    getLowStock: () => apiRequest('/insumos/low-stock'),
};

// ============================================
// PEDIDOS API
// ============================================

export const pedidosApi = {
    getAll: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return apiRequest(`/pedidos${params ? `?${params}` : ''}`);
    },
    getById: (id) => apiRequest(`/pedidos/${id}`),
    create: (data) => apiRequest('/pedidos', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/pedidos/${id}`, { method: 'PUT', body: data }),
    updateEstado: (id, estado, fechaEntrega = null) => apiRequest(`/pedidos/${id}/estado`, {
        method: 'PATCH',
        body: { estado, fechaEntrega }
    }),
    delete: (id) => apiRequest(`/pedidos/${id}`, { method: 'DELETE' }),
    getCalendar: (start, end) => {
        const params = new URLSearchParams({ start, end }).toString();
        return apiRequest(`/pedidos/calendario?${params}`);
    },
};

// ============================================
// COTIZACIONES API
// ============================================

export const cotizacionesApi = {
    getAll: () => apiRequest('/cotizaciones'),
    create: (data) => apiRequest('/cotizaciones', { method: 'POST', body: data }),
    delete: (id) => apiRequest(`/cotizaciones/${id}`, { method: 'DELETE' }),
};

// ============================================
// CONFIGURACION API
// ============================================

export const configuracionApi = {
    getAll: () => apiRequest('/configuracion'),
    update: (data) => apiRequest('/configuracion', { method: 'PUT', body: data }),
};

// ============================================
// ESTADISTICAS API
// ============================================

export const estadisticasApi = {
    get: () => apiRequest('/estadisticas'),
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
    health: healthApi,
};
