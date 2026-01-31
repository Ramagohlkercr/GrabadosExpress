// ============================================
// GRABADOS EXPRESS - WhatsApp/Conversaciones API Client
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

    const response = await fetch(url, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
        throw new Error(error.error || `Error ${response.status}`);
    }

    return response.json();
}

// Conversaciones
export const conversacionesApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/conversaciones${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/conversaciones?id=${id}`),
    update: (id, data) => apiRequest(`/conversaciones?id=${id}`, { 
        method: 'PUT', 
        body: data 
    }),
    delete: (id) => apiRequest(`/conversaciones?id=${id}`, { method: 'DELETE' }),
    sendMessage: (conversacionId, mensaje) => apiRequest('/conversaciones?action=send', {
        method: 'POST',
        body: { conversacionId, mensaje }
    }),
    getStats: () => apiRequest('/conversaciones?action=stats'),
};

// WhatsApp Config
export const whatsappConfigApi = {
    get: () => apiRequest('/conversaciones?action=config'),
    save: (config) => apiRequest('/conversaciones?action=config', {
        method: 'POST',
        body: config
    }),
};

export default {
    conversaciones: conversacionesApi,
    config: whatsappConfigApi,
};
