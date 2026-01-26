// ============================================
// GRABADOS EXPRESS - API STORAGE WRAPPER
// Hybrid system: API first, localStorage fallback
// ============================================

import {
    clientesApi,
    productosApi,
    insumosApi,
    pedidosApi,
    cotizacionesApi,
    configuracionApi,
    estadisticasApi
} from './api.js';

// Flag to track API availability
let apiAvailable = null;
const API_CHECK_KEY = 'grabados_api_available';
const API_CHECK_TIMEOUT = 2000; // 2 seconds max for API check

// Check if API is available (with timeout)
export async function checkApiStatus() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CHECK_TIMEOUT);
        
        const response = await fetch('http://localhost:3001/api/health', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        apiAvailable = response.ok;
        sessionStorage.setItem(API_CHECK_KEY, apiAvailable ? 'true' : 'false');
        return apiAvailable;
    } catch {
        apiAvailable = false;
        sessionStorage.setItem(API_CHECK_KEY, 'false');
        return false;
    }
}

// Get API status from cache
export function isApiAvailable() {
    if (apiAvailable !== null) return apiAvailable;
    const cached = sessionStorage.getItem(API_CHECK_KEY);
    if (cached !== null) {
        apiAvailable = cached === 'true';
        return apiAvailable;
    }
    // Default to false to use localStorage (faster)
    return false;
}

// Quick check - returns cached value or checks once
let apiCheckPromise = null;
export async function ensureApiChecked() {
    if (apiAvailable !== null) return apiAvailable;
    if (apiCheckPromise) return apiCheckPromise;
    apiCheckPromise = checkApiStatus();
    const result = await apiCheckPromise;
    apiCheckPromise = null;
    return result;
}

// ============================================
// CONSTANTS (same as original)
// ============================================

export const ESTADOS_PEDIDO = {
    COTIZACION: 'cotizacion',
    CONFIRMADO: 'confirmado',
    EN_PRODUCCION: 'en_produccion',
    TERMINADO: 'terminado',
    LISTO: 'listo',
    ENTREGADO: 'entregado',
    CANCELADO: 'cancelado',
};

export const ESTADOS_LABELS = {
    [ESTADOS_PEDIDO.COTIZACION]: { label: 'Cotización', color: 'default' },
    [ESTADOS_PEDIDO.CONFIRMADO]: { label: 'Confirmado', color: 'info' },
    [ESTADOS_PEDIDO.EN_PRODUCCION]: { label: 'En Producción', color: 'warning' },
    [ESTADOS_PEDIDO.TERMINADO]: { label: 'Terminado', color: 'success' },
    [ESTADOS_PEDIDO.LISTO]: { label: 'Listo para enviar', color: 'info' },
    [ESTADOS_PEDIDO.ENTREGADO]: { label: 'Entregado', color: 'success' },
    [ESTADOS_PEDIDO.CANCELADO]: { label: 'Cancelado', color: 'danger' },
};

// ============================================
// HELPER: Field name conversion (camelCase <-> snake_case)
// ============================================

function toSnakeCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toSnakeCase);

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = toSnakeCase(value);
    }
    return result;
}

function toCamelCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toCamelCase);

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = toCamelCase(value);
    }
    return result;
}

// ============================================
// ASYNC API WRAPPERS
// ============================================

// --- CLIENTES ---
export async function getClientesAsync() {
    // Fast path: si ya sabemos que la API no está disponible
    if (!isApiAvailable()) {
        return getClientesLocal();
    }
    
    try {
        const data = await clientesApi.getAll();
        return data.map(toCamelCase);
    } catch (error) {
        console.error('API Error, falling back to localStorage:', error);
        apiAvailable = false;
        return getClientesLocal();
    }
}

export async function saveClienteAsync(cliente) {
    // Fast path
    if (!isApiAvailable()) {
        const { saveCliente } = await import('./storage.js');
        return saveCliente(cliente);
    }
    
    try {
        const payload = {
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            email: cliente.email,
            direccion: cliente.direccion,
            ciudad: cliente.ciudad,
            provincia: cliente.provincia,
            notas: cliente.notas,
            nombreMarca: cliente.nombreMarca,
            logoImage: cliente.logoImage,
            logoNombre: cliente.logoNombre,
            formaEtiqueta: cliente.formaEtiqueta,
            medidaAncho: cliente.medidaAncho,
            medidaAlto: cliente.medidaAlto,
            colorPreferido: cliente.colorPreferido,
        };

        if (cliente.id) {
            return toCamelCase(await clientesApi.update(cliente.id, payload));
        } else {
            return toCamelCase(await clientesApi.create(payload));
        }
    } catch (error) {
        console.error('API Error, using localStorage fallback:', error);
        apiAvailable = false;
        const { saveCliente } = await import('./storage.js');
        return saveCliente(cliente);
    }
}

export async function deleteClienteAsync(id) {
    if (!isApiAvailable()) {
        const { deleteCliente } = await import('./storage.js');
        return deleteCliente(id);
    }
    try {
        return await clientesApi.delete(id);
    } catch (error) {
        apiAvailable = false;
        const { deleteCliente } = await import('./storage.js');
        return deleteCliente(id);
    }
}

// --- PRODUCTOS ---
export async function getProductosAsync() {
    if (!isApiAvailable()) {
        return getProductosLocal();
    }
    try {
        const data = await productosApi.getAll();
        return data.map(toCamelCase);
    } catch (error) {
        console.error('API Error:', error);
        apiAvailable = false;
        return getProductosLocal();
    }
}

export async function saveProductoAsync(producto) {
    if (!isApiAvailable()) {
        const { saveProducto } = await import('./storage.js');
        return saveProducto(producto);
    }
    
    try {
        const payload = {
            nombre: producto.nombre,
            categoria: producto.categoria,
            material: producto.material,
            precioBase: producto.precioBase,
            tiempoEstimado: producto.tiempoEstimado,
            activo: producto.activo,
        };

        if (producto.id) {
            return toCamelCase(await productosApi.update(producto.id, payload));
        } else {
            return toCamelCase(await productosApi.create(payload));
        }
    } catch (error) {
        apiAvailable = false;
        const { saveProducto } = await import('./storage.js');
        return saveProducto(producto);
    }
}

export async function deleteProductoAsync(id) {
    if (!isApiAvailable()) {
        const { deleteProducto } = await import('./storage.js');
        return deleteProducto(id);
    }
    try {
        return await productosApi.delete(id);
    } catch (error) {
        apiAvailable = false;
        const { deleteProducto } = await import('./storage.js');
        return deleteProducto(id);
    }
}

// --- INSUMOS ---
export async function getInsumosAsync() {
    if (!isApiAvailable()) {
        return getInsumosLocal();
    }
    try {
        const data = await insumosApi.getAll();
        return data.map(toCamelCase);
    } catch (error) {
        console.error('API Error:', error);
        apiAvailable = false;
        return getInsumosLocal();
    }
}

export async function saveInsumoAsync(insumo) {
    if (!isApiAvailable()) {
        const { saveInsumo } = await import('./storage.js');
        return saveInsumo(insumo);
    }
    
    try {
        const payload = {
            nombre: insumo.nombre,
            unidad: insumo.unidad,
            stock: insumo.stock,
            stockMinimo: insumo.stockMinimo,
            costoUnitario: insumo.costoUnitario,
            proveedor: insumo.proveedor,
        };

        if (insumo.id) {
            return toCamelCase(await insumosApi.update(insumo.id, payload));
        } else {
            return toCamelCase(await insumosApi.create(payload));
        }
    } catch (error) {
        apiAvailable = false;
        const { saveInsumo } = await import('./storage.js');
        return saveInsumo(insumo);
    }
}

export async function deleteInsumoAsync(id) {
    if (!isApiAvailable()) {
        const { deleteInsumo } = await import('./storage.js');
        return deleteInsumo(id);
    }
    try {
        return await insumosApi.delete(id);
    } catch (error) {
        apiAvailable = false;
        const { deleteInsumo } = await import('./storage.js');
        return deleteInsumo(id);
    }
}

export async function updateStockAsync(id, cantidad, tipo = 'entrada') {
    if (!isApiAvailable()) {
        const { updateStock } = await import('./storage.js');
        return updateStock(id, cantidad, tipo);
    }
    try {
        return toCamelCase(await insumosApi.updateStock(id, cantidad, tipo));
    } catch (error) {
        apiAvailable = false;
        const { updateStock } = await import('./storage.js');
        return updateStock(id, cantidad, tipo);
    }
}

// --- PEDIDOS (OPTIMIZADO) ---
export async function getPedidosAsync(filters = {}) {
    // Si ya sabemos que la API no está disponible, usar localStorage directo
    if (!isApiAvailable()) {
        return getPedidosLocal();
    }
    
    try {
        const data = await pedidosApi.getAll(filters);
        return data.map(toCamelCase);
    } catch (error) {
        console.error('API Error:', error);
        apiAvailable = false; // Mark as unavailable for future calls
        return getPedidosLocal();
    }
}

export async function getPedidoByIdAsync(id) {
    if (!isApiAvailable()) {
        const { getPedidoById } = await import('./storage.js');
        return getPedidoById(id);
    }
    
    try {
        const data = await pedidosApi.getById(id);
        return toCamelCase(data);
    } catch (error) {
        console.error('API Error:', error);
        apiAvailable = false;
        const { getPedidoById } = await import('./storage.js');
        return getPedidoById(id);
    }
}

export async function savePedidoAsync(pedido) {
    // Fast path: use localStorage directly if API not available
    if (!isApiAvailable()) {
        const { savePedido } = await import('./storage.js');
        return savePedido(pedido);
    }

    const payload = {
        clienteId: pedido.clienteId,
        estado: pedido.estado,
        items: pedido.items,
        subtotal: pedido.subtotal,
        descuento: pedido.descuento || 0,
        total: pedido.total,
        notas: pedido.notas,
        fechaEntrega: pedido.fechaEntrega || pedido.fechaEntregaEstimada,
    };

    try {
        if (pedido.id) {
            return toCamelCase(await pedidosApi.update(pedido.id, payload));
        } else {
            return toCamelCase(await pedidosApi.create(payload));
        }
    } catch (error) {
        console.error('API Error, using localStorage fallback:', error);
        apiAvailable = false;
        const { savePedido } = await import('./storage.js');
        return savePedido(pedido);
    }
}

export async function updateEstadoPedidoAsync(id, nuevoEstado, fechaEntrega = null) {
    // Fast path
    if (!isApiAvailable()) {
        const { updateEstadoPedido } = await import('./storage.js');
        return updateEstadoPedido(id, nuevoEstado, fechaEntrega);
    }
    
    try {
        return toCamelCase(await pedidosApi.updateEstado(id, nuevoEstado, fechaEntrega));
    } catch (error) {
        console.error('API Error, using localStorage fallback:', error);
        apiAvailable = false;
        const { updateEstadoPedido } = await import('./storage.js');
        return updateEstadoPedido(id, nuevoEstado, fechaEntrega);
    }
}

export async function deletePedidoAsync(id) {
    // Fast path
    if (!isApiAvailable()) {
        const { deletePedido } = await import('./storage.js');
        return deletePedido(id);
    }
    
    try {
        return await pedidosApi.delete(id);
    } catch (error) {
        console.error('API Error, using localStorage fallback:', error);
        apiAvailable = false;
        const { deletePedido } = await import('./storage.js');
        return deletePedido(id);
    }
}

// --- COTIZACIONES ---
export async function getCotizacionesAsync() {
    if (!isApiAvailable()) {
        return getCotizacionesLocal();
    }
    try {
        const data = await cotizacionesApi.getAll();
        return data.map(toCamelCase);
    } catch (error) {
        console.error('API Error:', error);
        apiAvailable = false;
        return getCotizacionesLocal();
    }
}

export async function saveCotizacionAsync(cotizacion) {
    if (!isApiAvailable()) {
        const { saveCotizacion } = await import('./storage.js');
        return saveCotizacion(cotizacion);
    }
    
    try {
        const payload = {
            clienteId: cotizacion.clienteId,
            items: cotizacion.items,
            total: cotizacion.total,
            notas: cotizacion.notas,
        };
        return toCamelCase(await cotizacionesApi.create(payload));
    } catch (error) {
        apiAvailable = false;
        const { saveCotizacion } = await import('./storage.js');
        return saveCotizacion(cotizacion);
    }
}

// --- CONFIGURACIÓN ---
export async function getConfiguracionAsync() {
    if (!isApiAvailable()) {
        return getConfiguracionLocal();
    }
    try {
        const data = await configuracionApi.getAll();
        return toCamelCase(data);
    } catch (error) {
        console.error('API Error:', error);
        apiAvailable = false;
        return getConfiguracionLocal();
    }
}

export async function saveConfiguracionAsync(config) {
    if (!isApiAvailable()) {
        const { saveConfiguracion } = await import('./storage.js');
        return saveConfiguracion(config);
    }
    try {
        return toCamelCase(await configuracionApi.update(config));
    } catch (error) {
        apiAvailable = false;
        const { saveConfiguracion } = await import('./storage.js');
        return saveConfiguracion(config);
    }
}

// --- ESTADÍSTICAS ---
export async function getEstadisticasAsync() {
    try {
        const apiStats = await estadisticasApi.get();

        // Map API field names to Dashboard expected field names
        return {
            pedidosActivos: apiStats.pedidosActivos || 0,
            pedidosEnProduccion: apiStats.pedidosEnProduccion || apiStats.pedidosPorEstado?.en_produccion || 0,
            pedidosConfirmados: apiStats.pedidosConfirmados || apiStats.pedidosPorEstado?.confirmado || 0,
            pedidosTerminados: apiStats.pedidosTerminados || apiStats.pedidosPorEstado?.terminado || 0,
            pedidosMes: apiStats.pedidosMes || 0,
            ingresosMes: apiStats.ventasMes || 0, // API returns ventasMes, Dashboard expects ingresosMes
            clientesTotal: apiStats.totalClientes || 0, // API returns totalClientes, Dashboard expects clientesTotal
            productosTotal: apiStats.totalProductos || 0,
            insumosStockBajo: apiStats.stockBajo || 0, // API returns stockBajo, Dashboard expects insumosStockBajo
            pedidosAtrasados: apiStats.pedidosAtrasados || 0,
            pedidosProximosVencer: 0,
            listaPedidosProximos: [],
            listaPedidosAtrasados: [],
        };
    } catch (error) {
        console.error('API Error:', error);
        return getEstadisticasLocal();
    }
}

// ============================================
// LOCAL STORAGE FALLBACK (from original storage.js)
// ============================================

const STORAGE_KEY = 'grabados_express_data';

const defaultData = {
    clientes: [],
    productos: [
        { id: 'prod_1', nombre: 'Etiqueta MDF', categoria: 'etiqueta', material: 'mdf', precioBase: 500, tiempoEstimado: 5, activo: true },
        { id: 'prod_2', nombre: 'Etiqueta Acrílico', categoria: 'etiqueta', material: 'acrilico', precioBase: 800, tiempoEstimado: 7, activo: true },
        { id: 'prod_3', nombre: 'Etiqueta Eco Cuero', categoria: 'etiqueta', material: 'ecocuero', precioBase: 600, tiempoEstimado: 5, activo: true },
        { id: 'prod_5', nombre: 'Llavero MDF', categoria: 'llavero', material: 'mdf', precioBase: 400, tiempoEstimado: 4, activo: true },
        { id: 'prod_6', nombre: 'Llavero Acrílico', categoria: 'llavero', material: 'acrilico', precioBase: 700, tiempoEstimado: 6, activo: true },
        { id: 'prod_7', nombre: 'Llavero Eco Cuero', categoria: 'llavero', material: 'ecocuero', precioBase: 500, tiempoEstimado: 4, activo: true },
    ],
    insumos: [
        { id: 'ins_1', nombre: 'Plancha MDF 3mm', unidad: 'unidad', stock: 10, stockMinimo: 3, costoUnitario: 5000, proveedor: '' },
        { id: 'ins_2', nombre: 'Plancha Acrílico', unidad: 'unidad', stock: 5, stockMinimo: 2, costoUnitario: 8000, proveedor: '' },
        { id: 'ins_3', nombre: 'Eco Cuero (metro)', unidad: 'metro', stock: 8, stockMinimo: 2, costoUnitario: 6000, proveedor: '' },
    ],
    pedidos: [],
    cotizaciones: [],
    configuracion: {
        nombreNegocio: 'Grabados Express',
        diasHabilesEntrega: 7,
        materiales: [
            { id: 'mdf', nombre: 'MDF', color: '#8B4513' },
            { id: 'acrilico', nombre: 'Acrílico', color: '#00CED1' },
            { id: 'ecocuero', nombre: 'Eco Cuero', color: '#D2691E' },
            { id: 'cuero', nombre: 'Cuero Genuino', color: '#8B0000' },
        ],
        categorias: [
            { id: 'etiqueta', nombre: 'Etiqueta' },
            { id: 'llavero', nombre: 'Llavero' },
            { id: 'personalizado', nombre: 'Personalizado' },
        ],
    },
};

function getLocalData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...defaultData, ...JSON.parse(stored) };
        }
        return defaultData;
    } catch {
        return defaultData;
    }
}

export function getClientesLocal() {
    return getLocalData().clientes;
}

export function getProductosLocal() {
    return getLocalData().productos;
}

export function getInsumosLocal() {
    return getLocalData().insumos;
}

export function getPedidosLocal() {
    return getLocalData().pedidos;
}

export function getCotizacionesLocal() {
    return getLocalData().cotizaciones;
}

export function getConfiguracionLocal() {
    return getLocalData().configuracion;
}

export function getEstadisticasLocal() {
    const pedidos = getPedidosLocal();
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const pedidosActivos = pedidos.filter(p =>
        p.estado !== ESTADOS_PEDIDO.ENTREGADO &&
        p.estado !== ESTADOS_PEDIDO.CANCELADO
    );

    const pedidosAtrasados = pedidosActivos.filter(p => {
        if (!p.fechaEntregaEstimada) return false;
        return new Date(p.fechaEntregaEstimada) < hoy;
    });

    const pedidosConfirmados = pedidos.filter(p => p.estado === ESTADOS_PEDIDO.CONFIRMADO).length;
    const pedidosEnProduccion = pedidos.filter(p => p.estado === ESTADOS_PEDIDO.EN_PRODUCCION).length;
    const pedidosTerminados = pedidos.filter(p => p.estado === ESTADOS_PEDIDO.TERMINADO).length;
    const pedidosMes = pedidos.filter(p => new Date(p.createdAt) >= inicioMes).length;
    const ingresosMes = pedidos
        .filter(p => p.estado === ESTADOS_PEDIDO.ENTREGADO && new Date(p.createdAt) >= inicioMes)
        .reduce((sum, p) => sum + (p.total || 0), 0);

    return {
        clientesTotal: getClientesLocal().length,
        productosTotal: getProductosLocal().filter(p => p.activo).length,
        pedidosActivos: pedidosActivos.length,
        pedidosAtrasados: pedidosAtrasados.length,
        pedidosConfirmados,
        pedidosEnProduccion,
        pedidosTerminados,
        pedidosMes,
        ingresosMes,
        insumosStockBajo: getInsumosLocal().filter(i => i.stock <= i.stockMinimo).length,
        pedidosProximosVencer: 0,
        listaPedidosProximos: [],
        listaPedidosAtrasados: [],
    };
}

// ============================================
// RE-EXPORTS for backward compatibility
// These will use the original storage.js functions
// ============================================

export {
    generateId,
    getData,
    saveData,
    getClientes,
    getClienteById,
    saveCliente,
    deleteCliente,
    getProductos,
    getProductoById,
    saveProducto,
    deleteProducto,
    getInsumos,
    getInsumoById,
    saveInsumo,
    deleteInsumo,
    updateStock,
    getPedidos,
    getPedidoById,
    savePedido,
    deletePedido,
    updateEstadoPedido,
    getCotizaciones,
    saveCotizacion,
    getEnvios,
    getEnvioById,
    saveEnvio,
    deleteEnvio,
    getConfiguracion,
    saveConfiguracion,
    getEstadisticas,
    exportData,
    importData,
} from './storage.js';
