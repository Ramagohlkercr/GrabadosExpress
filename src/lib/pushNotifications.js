// ============================================
// PUSH NOTIFICATIONS - Browser API
// ============================================

// Solicitar permiso para notificaciones push
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

// Verificar si las notificaciones están habilitadas
export const areNotificationsEnabled = () => {
    return 'Notification' in window && Notification.permission === 'granted';
};

// Enviar notificación push del sistema
export const sendPushNotification = (title, options = {}) => {
    if (!areNotificationsEnabled()) return null;

    try {
        const notification = new Notification(title, {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [100, 50, 100],
            requireInteraction: options.persistent || false,
            silent: options.silent || false,
            tag: options.tag,
            ...options
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
            options.onClick?.();
        };

        // Auto-cerrar después de un tiempo
        if (options.autoClose !== false) {
            setTimeout(() => {
                notification.close();
            }, options.duration || 10000);
        }

        return notification;
    } catch (error) {
        console.error('Error al enviar notificación:', error);
        return null;
    }
};

// Formatear fecha
const formatDate = (fecha) => {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString('es-AR', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
    });
};

// ============================================
// NOTIFICACIONES ESPECÍFICAS
// ============================================

export const notifyPedidoUrgente = (pedido, diasRestantes) => {
    const title = diasRestantes <= 0 
        ? '🚨 ¡Pedido Atrasado!' 
        : `⏰ Pedido vence ${diasRestantes === 1 ? 'mañana' : `en ${diasRestantes} días`}`;
    
    return sendPushNotification(title, {
        body: `${pedido.clienteNombre || pedido.cliente} - #${pedido.numero || pedido.id}`,
        tag: `pedido-urgente-${pedido.id}`,
        persistent: diasRestantes <= 0,
        requireInteraction: diasRestantes <= 0
    });
};

export const notifyNuevoPedido = (pedido) => {
    return sendPushNotification('✅ Nuevo Pedido Agendado', {
        body: `${pedido.clienteNombre || pedido.cliente} - Entrega: ${formatDate(pedido.fechaEntregaEstimada || pedido.fechaEntrega)}`,
        tag: `nuevo-pedido-${pedido.id}`
    });
};

export const notifyPedidoListo = (pedido) => {
    return sendPushNotification('🎉 Pedido Terminado', {
        body: `#${pedido.numero} - ${pedido.clienteNombre || pedido.cliente} listo para entregar`,
        tag: `pedido-listo-${pedido.id}`
    });
};

export const notifyMensajeWhatsApp = (cliente, mensaje) => {
    return sendPushNotification(`💬 ${cliente}`, {
        body: mensaje?.substring(0, 100) || 'Nuevo mensaje',
        tag: `whatsapp-${Date.now()}`,
        requireInteraction: true
    });
};

export const notifyResumenDiario = (pedidosHoy, pedidosAtrasados) => {
    if (pedidosHoy === 0 && pedidosAtrasados === 0) return null;
    
    let body = '';
    if (pedidosHoy > 0) body += `${pedidosHoy} entrega(s) para hoy. `;
    if (pedidosAtrasados > 0) body += `${pedidosAtrasados} pedido(s) atrasado(s).`;
    
    return sendPushNotification('📋 Resumen del día', {
        body: body.trim(),
        tag: 'resumen-diario',
        persistent: pedidosAtrasados > 0
    });
};

export const notifyStockBajo = (insumo) => {
    return sendPushNotification('📦 Stock Bajo', {
        body: `${insumo.nombre}: quedan ${insumo.cantidad} unidades`,
        tag: `stock-${insumo.id}`
    });
};

// ============================================
// UTILIDADES
// ============================================

// Programar notificación para una fecha/hora específica
export const scheduleNotification = (date, title, options = {}) => {
    const now = new Date();
    const targetDate = new Date(date);
    const delay = targetDate - now;
    
    if (delay <= 0) {
        // Si la fecha ya pasó, enviar inmediatamente
        return sendPushNotification(title, options);
    }
    
    const timeoutId = setTimeout(() => {
        sendPushNotification(title, options);
    }, delay);
    
    return {
        cancel: () => clearTimeout(timeoutId),
        scheduledFor: targetDate
    };
};

// Cerrar todas las notificaciones con un tag específico
export const closeNotifications = (tag) => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.getNotifications({ tag }).then(notifications => {
                notifications.forEach(notification => notification.close());
            });
        });
    }
};
