// ============================================
// GRABADOS EXPRESS - LOCAL STORAGE SYSTEM
// Persistent data management without server
// ============================================

const STORAGE_KEY = 'grabados_express_data';

// Default data structure
const defaultData = {
    clientes: [],
    productos: [
        // Productos predefinidos
        { id: 'prod_1', nombre: 'Etiqueta MDF', categoria: 'etiqueta', material: 'mdf', precioBase: 500, tiempoEstimado: 5, activo: true },
        { id: 'prod_2', nombre: 'Etiqueta Acrílico', categoria: 'etiqueta', material: 'acrilico', precioBase: 800, tiempoEstimado: 7, activo: true },
        { id: 'prod_3', nombre: 'Etiqueta Eco Cuero', categoria: 'etiqueta', material: 'ecocuero', precioBase: 600, tiempoEstimado: 5, activo: true },
        { id: 'prod_4', nombre: 'Etiqueta Cuero Genuino', categoria: 'etiqueta', material: 'cuero', precioBase: 1200, tiempoEstimado: 8, activo: true },
        { id: 'prod_5', nombre: 'Llavero MDF', categoria: 'llavero', material: 'mdf', precioBase: 400, tiempoEstimado: 4, activo: true },
        { id: 'prod_6', nombre: 'Llavero Acrílico', categoria: 'llavero', material: 'acrilico', precioBase: 700, tiempoEstimado: 6, activo: true },
        { id: 'prod_7', nombre: 'Llavero Eco Cuero', categoria: 'llavero', material: 'ecocuero', precioBase: 500, tiempoEstimado: 4, activo: true },
        { id: 'prod_8', nombre: 'Llavero Cuero Genuino', categoria: 'llavero', material: 'cuero', precioBase: 1000, tiempoEstimado: 7, activo: true },
    ],
    insumos: [
        { id: 'ins_1', nombre: 'Plancha MDF 3mm', unidad: 'unidad', stock: 10, stockMinimo: 3, costoUnitario: 5000, proveedor: '' },
        { id: 'ins_2', nombre: 'Plancha Acrílico 120x90cm', unidad: 'unidad', stock: 5, stockMinimo: 2, costoUnitario: 100000, proveedor: '' },
        { id: 'ins_3', nombre: 'Eco Cuero (metro)', unidad: 'metro', stock: 8, stockMinimo: 2, costoUnitario: 7200, proveedor: '' },
        { id: 'ins_4', nombre: 'Cuero Genuino (metro)', unidad: 'metro', stock: 3, stockMinimo: 1, costoUnitario: 15000, proveedor: '' },
        { id: 'ins_5', nombre: 'Argollas llavero', unidad: 'unidad', stock: 100, stockMinimo: 20, costoUnitario: 50, proveedor: '' },
    ],
    pedidos: [],
    cotizaciones: [],
    envios: [],
    configuracion: {
        nombreNegocio: 'Grabados Express',
        telefono: '',
        whatsapp: '',
        email: '',
        direccion: '',
        diasHabilesEntrega: 7,
        diasHabilesMax: 10,
        margenDefault: 30,
        // Feriados Argentina 2024-2025
        feriados: [
            '2024-01-01', '2024-02-12', '2024-02-13', '2024-03-24', '2024-03-28', '2024-03-29',
            '2024-04-02', '2024-05-01', '2024-05-25', '2024-06-17', '2024-06-20', '2024-07-09',
            '2024-08-17', '2024-10-12', '2024-11-18', '2024-12-08', '2024-12-25',
            '2025-01-01', '2025-02-12', '2025-02-13', '2025-03-24', '2025-04-02', '2025-04-17',
            '2025-04-18', '2025-05-01', '2025-05-25', '2025-06-16', '2025-06-20', '2025-07-09',
            '2025-08-17', '2025-10-12', '2025-11-24', '2025-12-08', '2025-12-25',
            '2026-01-01', '2026-02-16', '2026-02-17', '2026-03-24', '2026-04-02', '2026-04-03',
            '2026-05-01', '2026-05-25', '2026-06-15', '2026-06-20', '2026-07-09',
        ],
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

// Generate unique ID
export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get all data from storage
export function getData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            // Merge with defaults to ensure all keys exist
            return {
                ...defaultData,
                ...data,
                configuracion: {
                    ...defaultData.configuracion,
                    ...data.configuracion,
                },
            };
        }
        return defaultData;
    } catch (error) {
        console.error('Error reading data:', error);
        return defaultData;
    }
}

// Save all data to storage
export function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// ============================================
// CLIENTES
// ============================================

export function getClientes() {
    return getData().clientes;
}

export function getClienteById(id) {
    return getClientes().find(c => c.id === id);
}

export function saveCliente(cliente) {
    const data = getData();
    const index = data.clientes.findIndex(c => c.id === cliente.id);

    if (index >= 0) {
        data.clientes[index] = { ...data.clientes[index], ...cliente, updatedAt: new Date().toISOString() };
    } else {
        data.clientes.push({
            ...cliente,
            id: generateId('cli'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    saveData(data);
    return data.clientes;
}

export function deleteCliente(id) {
    const data = getData();
    data.clientes = data.clientes.filter(c => c.id !== id);
    saveData(data);
    return data.clientes;
}

// ============================================
// PRODUCTOS
// ============================================

export function getProductos() {
    return getData().productos;
}

export function getProductoById(id) {
    return getProductos().find(p => p.id === id);
}

export function saveProducto(producto) {
    const data = getData();
    const index = data.productos.findIndex(p => p.id === producto.id);

    if (index >= 0) {
        data.productos[index] = { ...data.productos[index], ...producto };
    } else {
        data.productos.push({
            ...producto,
            id: generateId('prod'),
            activo: true,
        });
    }

    saveData(data);
    return data.productos;
}

export function deleteProducto(id) {
    const data = getData();
    data.productos = data.productos.filter(p => p.id !== id);
    saveData(data);
    return data.productos;
}

// ============================================
// INSUMOS
// ============================================

export function getInsumos() {
    return getData().insumos;
}

export function getInsumoById(id) {
    return getInsumos().find(i => i.id === id);
}

export function saveInsumo(insumo) {
    const data = getData();
    const index = data.insumos.findIndex(i => i.id === insumo.id);

    if (index >= 0) {
        data.insumos[index] = { ...data.insumos[index], ...insumo };
    } else {
        data.insumos.push({
            ...insumo,
            id: generateId('ins'),
        });
    }

    saveData(data);
    return data.insumos;
}

export function deleteInsumo(id) {
    const data = getData();
    data.insumos = data.insumos.filter(i => i.id !== id);
    saveData(data);
    return data.insumos;
}

export function updateStock(id, cantidad, tipo = 'entrada') {
    const data = getData();
    const index = data.insumos.findIndex(i => i.id === id);

    if (index >= 0) {
        if (tipo === 'entrada') {
            data.insumos[index].stock += cantidad;
        } else {
            data.insumos[index].stock -= cantidad;
        }
        saveData(data);
    }

    return data.insumos;
}

// ============================================
// PEDIDOS
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

export function getPedidos() {
    return getData().pedidos;
}

export function getPedidoById(id) {
    return getPedidos().find(p => p.id === id);
}

export function savePedido(pedido) {
    const data = getData();
    const index = data.pedidos.findIndex(p => p.id === pedido.id);

    if (index >= 0) {
        data.pedidos[index] = { ...data.pedidos[index], ...pedido, updatedAt: new Date().toISOString() };
    } else {
        data.pedidos.push({
            ...pedido,
            id: generateId('ped'),
            numero: data.pedidos.length + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    saveData(data);
    return data.pedidos;
}

export function deletePedido(id) {
    const data = getData();
    data.pedidos = data.pedidos.filter(p => p.id !== id);
    saveData(data);
    return data.pedidos;
}

export function updateEstadoPedido(id, nuevoEstado, fechaEntrega = null) {
    const data = getData();
    const index = data.pedidos.findIndex(p => p.id === id);

    if (index >= 0) {
        data.pedidos[index].estado = nuevoEstado;
        data.pedidos[index].updatedAt = new Date().toISOString();

        if (fechaEntrega) {
            data.pedidos[index].fechaEntregaEstimada = fechaEntrega;
        }

        // Track status changes
        if (!data.pedidos[index].historial) {
            data.pedidos[index].historial = [];
        }
        data.pedidos[index].historial.push({
            estado: nuevoEstado,
            fecha: new Date().toISOString(),
        });

        saveData(data);
    }

    return data.pedidos;
}

// ============================================
// COTIZACIONES
// ============================================

export function getCotizaciones() {
    return getData().cotizaciones;
}

export function saveCotizacion(cotizacion) {
    const data = getData();
    const index = data.cotizaciones.findIndex(c => c.id === cotizacion.id);

    if (index >= 0) {
        data.cotizaciones[index] = { ...data.cotizaciones[index], ...cotizacion };
    } else {
        data.cotizaciones.push({
            ...cotizacion,
            id: generateId('cot'),
            numero: data.cotizaciones.length + 1,
            createdAt: new Date().toISOString(),
        });
    }

    saveData(data);
    return data.cotizaciones;
}

// ============================================
// ENVÍOS (Correo Argentino)
// ============================================

export function getEnvios() {
    const data = getData();
    return data.envios || [];
}

export function getEnvioById(id) {
    return getEnvios().find(e => e.id === id);
}

export function saveEnvio(envio) {
    const data = getData();
    if (!data.envios) data.envios = [];

    const index = data.envios.findIndex(e => e.id === envio.id || (e.trackingNumber && e.trackingNumber === envio.trackingNumber));

    if (index >= 0) {
        data.envios[index] = { ...data.envios[index], ...envio, updatedAt: new Date().toISOString() };
    } else {
        data.envios.push({
            ...envio,
            id: generateId('env'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    saveData(data);
    return data.envios;
}

export function deleteEnvio(id) {
    const data = getData();
    data.envios = (data.envios || []).filter(e => e.id !== id);
    saveData(data);
    return data.envios;
}

// ============================================
// CONFIGURACIÓN
// ============================================

export function getConfiguracion() {
    return getData().configuracion;
}

export function saveConfiguracion(config) {
    const data = getData();
    data.configuracion = { ...data.configuracion, ...config };
    saveData(data);
    return data.configuracion;
}

// ============================================
// ESTADÍSTICAS
// ============================================

export function getEstadisticas() {
    const pedidos = getPedidos();
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const pedidosActivos = pedidos.filter(p =>
        p.estado !== ESTADOS_PEDIDO.ENTREGADO &&
        p.estado !== ESTADOS_PEDIDO.CANCELADO
    );

    const pedidosEnProduccion = pedidos.filter(p => p.estado === ESTADOS_PEDIDO.EN_PRODUCCION);

    const pedidosMes = pedidos.filter(p => new Date(p.createdAt) >= inicioMes);
    const ingresosMes = pedidosMes
        .filter(p => p.estado !== ESTADOS_PEDIDO.CANCELADO)
        .reduce((sum, p) => sum + (p.total || 0), 0);

    // Pedidos próximos a vencer (próximos 3 días)
    const tresDias = new Date(hoy);
    tresDias.setDate(tresDias.getDate() + 3);

    const pedidosProximosVencer = pedidosActivos.filter(p => {
        if (!p.fechaEntregaEstimada) return false;
        const fechaEntrega = new Date(p.fechaEntregaEstimada);
        return fechaEntrega <= tresDias && fechaEntrega >= hoy;
    });

    // Pedidos atrasados
    const pedidosAtrasados = pedidosActivos.filter(p => {
        if (!p.fechaEntregaEstimada) return false;
        return new Date(p.fechaEntregaEstimada) < hoy;
    });

    return {
        pedidosActivos: pedidosActivos.length,
        pedidosEnProduccion: pedidosEnProduccion.length,
        pedidosMes: pedidosMes.length,
        ingresosMes,
        clientesTotal: getClientes().length,
        productosTotal: getProductos().filter(p => p.activo).length,
        insumosStockBajo: getInsumos().filter(i => i.stock <= i.stockMinimo).length,
        pedidosProximosVencer: pedidosProximosVencer.length,
        pedidosAtrasados: pedidosAtrasados.length,
        listaPedidosProximos: pedidosProximosVencer,
        listaPedidosAtrasados: pedidosAtrasados,
    };
}

// ============================================
// EXPORT / BACKUP
// ============================================

export function exportData() {
    const data = getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grabados_express_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        saveData(data);
        return true;
    } catch (error) {
        console.error('Error importing data:', error);
        return false;
    }
}

// Initialize data if first time
if (!localStorage.getItem(STORAGE_KEY)) {
    saveData(defaultData);
}
