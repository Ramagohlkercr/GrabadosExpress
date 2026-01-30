// ============================================
// GRABADOS EXPRESS - SISTEMA DE NOTIFICACIONES
// Gestión centralizada de alertas y notificaciones
// ============================================

import { pedidosApi, insumosApi, gastosApi } from './api.js';

// Tipos de notificación
export const NOTIFICACION_TIPOS = {
  PEDIDO_ATRASADO: 'pedido_atrasado',
  PEDIDO_VENCE_HOY: 'pedido_vence_hoy',
  PEDIDO_VENCE_MANANA: 'pedido_vence_manana',
  PEDIDO_VENCE_PRONTO: 'pedido_vence_pronto',
  PEDIDO_NUEVO: 'pedido_nuevo',
  STOCK_BAJO: 'stock_bajo',
  STOCK_AGOTADO: 'stock_agotado',
  PAGO_PENDIENTE: 'pago_pendiente',
};

// Prioridades de notificación
export const PRIORIDAD = {
  CRITICA: 'critica',      // Rojo - Acción inmediata
  ALTA: 'alta',            // Naranja - Pronto
  MEDIA: 'media',          // Amarillo - Hoy
  BAJA: 'baja',            // Azul - Informativo
};

// Configuración de tipos
const TIPO_CONFIG = {
  [NOTIFICACION_TIPOS.PEDIDO_ATRASADO]: {
    icono: '🚨',
    color: 'danger',
    prioridad: PRIORIDAD.CRITICA,
    categoria: 'pedidos',
  },
  [NOTIFICACION_TIPOS.PEDIDO_VENCE_HOY]: {
    icono: '⏰',
    color: 'danger',
    prioridad: PRIORIDAD.CRITICA,
    categoria: 'pedidos',
  },
  [NOTIFICACION_TIPOS.PEDIDO_VENCE_MANANA]: {
    icono: '📅',
    color: 'warning',
    prioridad: PRIORIDAD.ALTA,
    categoria: 'pedidos',
  },
  [NOTIFICACION_TIPOS.PEDIDO_VENCE_PRONTO]: {
    icono: '📋',
    color: 'info',
    prioridad: PRIORIDAD.MEDIA,
    categoria: 'pedidos',
  },
  [NOTIFICACION_TIPOS.PEDIDO_NUEVO]: {
    icono: '🆕',
    color: 'success',
    prioridad: PRIORIDAD.BAJA,
    categoria: 'pedidos',
  },
  [NOTIFICACION_TIPOS.STOCK_AGOTADO]: {
    icono: '❌',
    color: 'danger',
    prioridad: PRIORIDAD.CRITICA,
    categoria: 'stock',
  },
  [NOTIFICACION_TIPOS.STOCK_BAJO]: {
    icono: '📦',
    color: 'warning',
    prioridad: PRIORIDAD.ALTA,
    categoria: 'stock',
  },
  [NOTIFICACION_TIPOS.PAGO_PENDIENTE]: {
    icono: '💰',
    color: 'warning',
    prioridad: PRIORIDAD.MEDIA,
    categoria: 'pagos',
  },
};

// Utilidades de fecha
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(date1, date2) {
  const d1 = startOfDay(date1);
  const d2 = startOfDay(date2);
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDaysValue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDaysValue < 7) return `Hace ${diffDaysValue} días`;
  return new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

// Genera notificaciones de pedidos
function generarNotificacionesPedidos(pedidos) {
  const notificaciones = [];
  const ahora = new Date();
  const hoy = startOfDay(ahora);
  const manana = addDays(hoy, 1);
  const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

  // Estados activos (no entregados ni cancelados)
  const estadosActivos = ['confirmado', 'en_produccion', 'terminado', 'listo'];

  pedidos.forEach(pedido => {
    // Solo pedidos activos
    if (!estadosActivos.includes(pedido.estado)) return;

    const fechaEntrega = pedido.fechaEntrega || pedido.fecha_entrega || pedido.fechaEntregaEstimada || pedido.fecha_entrega_estimada;
    if (!fechaEntrega) return;

    const fechaEntregaDate = startOfDay(new Date(fechaEntrega));
    const diasRestantes = diffDays(hoy, fechaEntregaDate);
    const numero = pedido.numero || `#${pedido.id?.toString().slice(-4) || '0000'}`;

    // Pedido atrasado
    if (diasRestantes < 0) {
      notificaciones.push({
        id: `atrasado_${pedido.id}`,
        tipo: NOTIFICACION_TIPOS.PEDIDO_ATRASADO,
        titulo: `Pedido ${numero} atrasado`,
        mensaje: `Venció hace ${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) > 1 ? 's' : ''}`,
        fecha: fechaEntrega,
        pedidoId: pedido.id,
        link: `/pedidos?id=${pedido.id}`,
        ...TIPO_CONFIG[NOTIFICACION_TIPOS.PEDIDO_ATRASADO],
      });
    }
    // Vence hoy
    else if (diasRestantes === 0) {
      notificaciones.push({
        id: `hoy_${pedido.id}`,
        tipo: NOTIFICACION_TIPOS.PEDIDO_VENCE_HOY,
        titulo: `Pedido ${numero} vence HOY`,
        mensaje: 'Debe entregarse hoy',
        fecha: fechaEntrega,
        pedidoId: pedido.id,
        link: `/pedidos?id=${pedido.id}`,
        ...TIPO_CONFIG[NOTIFICACION_TIPOS.PEDIDO_VENCE_HOY],
      });
    }
    // Vence mañana
    else if (diasRestantes === 1) {
      notificaciones.push({
        id: `manana_${pedido.id}`,
        tipo: NOTIFICACION_TIPOS.PEDIDO_VENCE_MANANA,
        titulo: `Pedido ${numero} vence mañana`,
        mensaje: 'Entrega programada para mañana',
        fecha: fechaEntrega,
        pedidoId: pedido.id,
        link: `/pedidos?id=${pedido.id}`,
        ...TIPO_CONFIG[NOTIFICACION_TIPOS.PEDIDO_VENCE_MANANA],
      });
    }
    // Vence en 2-3 días
    else if (diasRestantes <= 3) {
      notificaciones.push({
        id: `pronto_${pedido.id}`,
        tipo: NOTIFICACION_TIPOS.PEDIDO_VENCE_PRONTO,
        titulo: `Pedido ${numero} próximo`,
        mensaje: `Vence en ${diasRestantes} días`,
        fecha: fechaEntrega,
        pedidoId: pedido.id,
        link: `/pedidos?id=${pedido.id}`,
        ...TIPO_CONFIG[NOTIFICACION_TIPOS.PEDIDO_VENCE_PRONTO],
      });
    }
  });

  // Pedidos nuevos (últimas 24h) - solo confirmados recientemente
  const pedidosNuevos = pedidos.filter(p => {
    const createdAt = p.createdAt || p.created_at;
    if (!createdAt) return false;
    return new Date(createdAt) >= hace24h && p.estado === 'confirmado';
  });

  pedidosNuevos.forEach(pedido => {
    const numero = pedido.numero || `#${pedido.id?.toString().slice(-4) || '0000'}`;
    const createdAt = pedido.createdAt || pedido.created_at;
    
    notificaciones.push({
      id: `nuevo_${pedido.id}`,
      tipo: NOTIFICACION_TIPOS.PEDIDO_NUEVO,
      titulo: `Nuevo pedido ${numero}`,
      mensaje: formatTimeAgo(createdAt),
      fecha: createdAt,
      pedidoId: pedido.id,
      link: `/pedidos?id=${pedido.id}`,
      ...TIPO_CONFIG[NOTIFICACION_TIPOS.PEDIDO_NUEVO],
    });
  });

  return notificaciones;
}

// Genera notificaciones de stock
function generarNotificacionesStock(insumos) {
  const notificaciones = [];

  insumos.forEach(insumo => {
    const stock = insumo.stock || 0;
    const stockMinimo = insumo.stockMinimo || insumo.stock_minimo || 0;
    const nombre = insumo.nombre || 'Insumo';

    // Stock agotado
    if (stock === 0) {
      notificaciones.push({
        id: `agotado_${insumo.id}`,
        tipo: NOTIFICACION_TIPOS.STOCK_AGOTADO,
        titulo: `${nombre} agotado`,
        mensaje: 'Sin stock disponible',
        insumoId: insumo.id,
        link: '/insumos',
        ...TIPO_CONFIG[NOTIFICACION_TIPOS.STOCK_AGOTADO],
      });
    }
    // Stock bajo
    else if (stock <= stockMinimo && stockMinimo > 0) {
      notificaciones.push({
        id: `bajo_${insumo.id}`,
        tipo: NOTIFICACION_TIPOS.STOCK_BAJO,
        titulo: `Stock bajo: ${nombre}`,
        mensaje: `Quedan ${stock} ${insumo.unidad || 'unidades'}`,
        insumoId: insumo.id,
        link: '/insumos',
        ...TIPO_CONFIG[NOTIFICACION_TIPOS.STOCK_BAJO],
      });
    }
  });

  return notificaciones;
}

// Genera notificaciones de pagos pendientes (pedidos entregados sin pago completo)
function generarNotificacionesPagos(pedidos) {
  const notificaciones = [];
  
  // Buscar pedidos terminados/entregados con saldo pendiente
  pedidos.forEach(pedido => {
    if (!['terminado', 'listo', 'entregado'].includes(pedido.estado)) return;
    
    const total = pedido.total || 0;
    const pagado = pedido.pagado || pedido.montoPagado || 0;
    const saldo = total - pagado;
    
    if (saldo > 0 && total > 0) {
      const numero = pedido.numero || `#${pedido.id?.toString().slice(-4) || '0000'}`;
      notificaciones.push({
        id: `pago_${pedido.id}`,
        tipo: NOTIFICACION_TIPOS.PAGO_PENDIENTE,
        titulo: `Pago pendiente: ${numero}`,
        mensaje: `Saldo: $${saldo.toLocaleString('es-AR')}`,
        pedidoId: pedido.id,
        saldo,
        link: `/pedidos?id=${pedido.id}`,
        ...TIPO_CONFIG[NOTIFICACION_TIPOS.PAGO_PENDIENTE],
      });
    }
  });

  return notificaciones;
}

// Ordena notificaciones por prioridad y fecha
function ordenarNotificaciones(notificaciones) {
  const prioridadOrden = {
    [PRIORIDAD.CRITICA]: 0,
    [PRIORIDAD.ALTA]: 1,
    [PRIORIDAD.MEDIA]: 2,
    [PRIORIDAD.BAJA]: 3,
  };

  return notificaciones.sort((a, b) => {
    // Primero por prioridad
    const prioridadDiff = prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad];
    if (prioridadDiff !== 0) return prioridadDiff;
    
    // Luego por fecha (más reciente primero)
    if (a.fecha && b.fecha) {
      return new Date(b.fecha) - new Date(a.fecha);
    }
    return 0;
  });
}

// Función principal para obtener todas las notificaciones
export async function obtenerNotificaciones() {
  try {
    // Cargar datos en paralelo
    const [pedidos, insumos] = await Promise.all([
      pedidosApi.getAll().catch(() => []),
      insumosApi.getAll().catch(() => []),
    ]);

    // Generar notificaciones
    const notificacionesPedidos = generarNotificacionesPedidos(pedidos);
    const notificacionesStock = generarNotificacionesStock(insumos);
    const notificacionesPagos = generarNotificacionesPagos(pedidos);

    // Combinar y ordenar
    const todas = [
      ...notificacionesPedidos,
      ...notificacionesStock,
      ...notificacionesPagos,
    ];

    const ordenadas = ordenarNotificaciones(todas);

    // Agrupar por categoría
    const porCategoria = {
      pedidos: ordenadas.filter(n => n.categoria === 'pedidos'),
      stock: ordenadas.filter(n => n.categoria === 'stock'),
      pagos: ordenadas.filter(n => n.categoria === 'pagos'),
    };

    // Estadísticas
    const stats = {
      total: ordenadas.length,
      criticas: ordenadas.filter(n => n.prioridad === PRIORIDAD.CRITICA).length,
      altas: ordenadas.filter(n => n.prioridad === PRIORIDAD.ALTA).length,
      pedidosAtrasados: ordenadas.filter(n => n.tipo === NOTIFICACION_TIPOS.PEDIDO_ATRASADO).length,
      pedidosHoy: ordenadas.filter(n => n.tipo === NOTIFICACION_TIPOS.PEDIDO_VENCE_HOY).length,
      stockBajo: notificacionesStock.length,
    };

    return {
      notificaciones: ordenadas,
      porCategoria,
      stats,
      hayCriticas: stats.criticas > 0,
    };
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return {
      notificaciones: [],
      porCategoria: { pedidos: [], stock: [], pagos: [] },
      stats: { total: 0, criticas: 0, altas: 0 },
      hayCriticas: false,
    };
  }
}

// Obtener resumen rápido para el badge
export async function obtenerResumenNotificaciones() {
  try {
    const { stats, hayCriticas } = await obtenerNotificaciones();
    return {
      total: stats.total,
      criticas: stats.criticas,
      hayCriticas,
    };
  } catch {
    return { total: 0, criticas: 0, hayCriticas: false };
  }
}

export default {
  obtenerNotificaciones,
  obtenerResumenNotificaciones,
  NOTIFICACION_TIPOS,
  PRIORIDAD,
};
