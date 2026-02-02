// ============================================
// GRABADOS EXPRESS - Envíos y Notificaciones API Client
// ============================================

const API_BASE = '/api/envios';

/**
 * API para gestión de envíos con Correo Argentino
 */
export const enviosApi = {
    /**
     * Crear envío en Correo Argentino
     */
    async crear(pedidoId, tipoEntrega = 'agency', sucursalId = '', sucursalNombre = '') {
        const response = await fetch(`${API_BASE}?action=crear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pedidoId, tipoEntrega, sucursalId, sucursalNombre })
        });
        return response.json();
    },

    /**
     * Obtener etiqueta PDF
     */
    async obtenerEtiqueta(pedidoId) {
        const response = await fetch(`${API_BASE}?action=etiqueta&pedidoId=${pedidoId}`);
        return response.json();
    },

    /**
     * Consultar tracking
     */
    async consultarTracking(pedidoId, tracking = null) {
        let url = `${API_BASE}?action=tracking`;
        if (pedidoId) url += `&pedidoId=${pedidoId}`;
        if (tracking) url += `&tracking=${tracking}`;
        const response = await fetch(url);
        return response.json();
    },

    /**
     * Actualizar estado de envío
     */
    async actualizarEstado(pedidoId, estado, fechaDespacho = null) {
        const response = await fetch(`${API_BASE}?action=actualizar-estado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pedidoId, estado, fechaDespacho })
        });
        return response.json();
    },

    /**
     * Obtener sucursales
     */
    async obtenerSucursales(provincia = '') {
        const response = await fetch(`${API_BASE}?action=sucursales${provincia ? `&provincia=${provincia}` : ''}`);
        return response.json();
    },

    /**
     * Sincronizar tracking de todos los envíos activos
     */
    async syncTracking() {
        const response = await fetch(`${API_BASE}?action=sync-tracking`, {
            method: 'POST'
        });
        return response.json();
    },

    /**
     * Descargar PDF desde base64
     */
    descargarEtiqueta(base64, tracking) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `etiqueta-${tracking || 'envio'}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    /**
     * Consultar tracking público (sin API key)
     */
    async trackingPublico(tracking) {
        const response = await fetch(`${API_BASE}?action=tracking-publico&tracking=${encodeURIComponent(tracking)}`);
        return response.json();
    },

    /**
     * Asignar tracking manual a un pedido
     */
    async asignarTracking(pedidoId, tracking, sucursalNombre = null) {
        const response = await fetch(`${API_BASE}?action=asignar-tracking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pedidoId, tracking, sucursalNombre })
        });
        return response.json();
    },

    /**
     * Listar pedidos con envío
     */
    async listar(estado = null) {
        let url = `${API_BASE}?action=listar`;
        if (estado) url += `&estado=${estado}`;
        const response = await fetch(url);
        return response.json();
    },

    /**
     * Obtener URL de tracking público
     */
    getTrackingUrl(tracking) {
        return `https://www.correoargentino.com.ar/formularios/ondnc?id=${tracking}`;
    }
};

/**
 * API para notificaciones WhatsApp
 */
export const notificacionesApi = {
    /**
     * Enviar notificación a cliente
     */
    async enviar(pedidoId, tipo, mensajePersonalizado = null) {
        const response = await fetch(`${API_BASE}?action=notificar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pedidoId, tipo, mensajePersonalizado })
        });
        return response.json();
    },

    /**
     * Obtener plantillas de notificación
     */
    async obtenerPlantillas() {
        const response = await fetch(`${API_BASE}?action=plantillas`);
        return response.json();
    },

    /**
     * Actualizar plantilla
     */
    async actualizarPlantilla(id, mensaje, activa = true) {
        const response = await fetch(`${API_BASE}?action=plantillas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, mensaje, activa })
        });
        return response.json();
    },

    /**
     * Obtener historial de notificaciones
     */
    async obtenerHistorial(pedidoId = null, clienteId = null, limit = 50) {
        let url = `${API_BASE}?action=historial&limit=${limit}`;
        if (pedidoId) url += `&pedidoId=${pedidoId}`;
        if (clienteId) url += `&clienteId=${clienteId}`;
        const response = await fetch(url);
        return response.json();
    }
};

/**
 * Tipos de notificación disponibles
 */
export const TIPOS_NOTIFICACION = {
    pedido_confirmado: { label: 'Pedido Confirmado', icon: '✅', color: '#22c55e' },
    pedido_produccion: { label: 'En Producción', icon: '🔧', color: '#3b82f6' },
    pedido_listo: { label: 'Pedido Listo', icon: '🎉', color: '#8b5cf6' },
    pedido_despachado: { label: 'Despachado', icon: '🚚', color: '#f59e0b' },
    pedido_en_camino: { label: 'En Camino', icon: '🛵', color: '#06b6d4' },
    pedido_disponible_retiro: { label: 'Disponible Retiro', icon: '📍', color: '#10b981' },
    pedido_entregado: { label: 'Entregado', icon: '✅', color: '#22c55e' }
};

/**
 * Estados de envío
 */
export const ESTADOS_ENVIO = {
    pendiente: { label: 'Pendiente', color: '#6b7280' },
    creado: { label: 'Creado', color: '#3b82f6' },
    despachado: { label: 'Despachado', color: '#f59e0b' },
    en_transito: { label: 'En Tránsito', color: '#8b5cf6' },
    en_distribucion: { label: 'En Distribución', color: '#06b6d4' },
    disponible_retiro: { label: 'Disponible Retiro', color: '#10b981' },
    entregado: { label: 'Entregado', color: '#22c55e' },
    cancelado: { label: 'Cancelado', color: '#ef4444' }
};
