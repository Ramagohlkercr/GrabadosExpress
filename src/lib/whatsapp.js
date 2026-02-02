// ============================================
// WHATSAPP INTEGRATION
// Send messages via WhatsApp Web
// ============================================

import { getConfiguracion, getClienteById } from './storage';
import { formatearFecha, formatearFechaConDia } from './dateUtils';

// Format phone number for WhatsApp
function formatPhone(phone) {
    if (!phone) return null;

    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, remove it
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // If doesn't start with country code, add Argentina's
    if (!cleaned.startsWith('54')) {
        cleaned = '54' + cleaned;
    }

    // If doesn't have 9 after country code (for mobile), add it
    if (cleaned.startsWith('54') && !cleaned.startsWith('549')) {
        cleaned = '549' + cleaned.substring(2);
    }

    return cleaned;
}

// Generate WhatsApp URL
function getWhatsAppUrl(phone, message) {
    const formattedPhone = formatPhone(phone);
    if (!formattedPhone) return null;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

// Open WhatsApp with message
export function enviarWhatsApp(telefono, mensaje) {
    const url = getWhatsAppUrl(telefono, mensaje);
    if (url) {
        window.open(url, '_blank');
        return true;
    }
    return false;
}

// ============================================
// MESSAGE TEMPLATES
// ============================================

// Confirmation of new order
export function mensajeConfirmacionPedido(pedido, cliente) {
    const config = getConfiguracion();
    const nombreNegocio = config.nombreNegocio || 'Grabados Express';

    return `¡Hola ${cliente.nombre}! 👋

Tu pedido #${pedido.numero} ha sido *confirmado* ✅

📦 *Detalle del pedido:*
${pedido.items.map(item => `• ${item.cantidad}x ${item.producto} - $${item.subtotal.toLocaleString()}`).join('\n')}

💰 *Total:* $${pedido.total.toLocaleString()}

📅 *Fecha estimada de entrega:* ${formatearFechaConDia(pedido.fechaEntregaEstimada)}

Te avisaremos cuando esté listo para retirar.

¡Gracias por confiar en ${nombreNegocio}! 🎯`;
}

// Order in production
export function mensajePedidoEnProduccion(pedido, cliente) {
    return `¡Hola ${cliente.nombre}! 👋

Te informamos que tu pedido #${pedido.numero} ya está *en producción* 🔥

📅 Fecha estimada de entrega: ${formatearFechaConDia(pedido.fechaEntregaEstimada)}

Te avisaremos cuando esté listo. ¡Gracias por tu paciencia! ✨`;
}

// Order ready for pickup
export function mensajePedidoTerminado(pedido, cliente) {
    const config = getConfiguracion();

    let mensaje = `¡Hola ${cliente.nombre}! 👋

🎉 ¡Tu pedido #${pedido.numero} está *LISTO*!

Podés pasar a retirarlo cuando quieras.`;

    if (config.direccion) {
        mensaje += `\n\n📍 *Dirección:* ${config.direccion}`;
    }

    if (config.telefono) {
        mensaje += `\n📞 *Tel:* ${config.telefono}`;
    }

    mensaje += `\n\n💰 *Total a abonar:* $${pedido.total.toLocaleString()}`;
    mensaje += `\n\n¡Te esperamos! 😊`;

    return mensaje;
}

// Quote/Budget
export function mensajeCotizacion(cotizacion, cliente) {
    const config = getConfiguracion();
    const nombreNegocio = config.nombreNegocio || 'Grabados Express';

    return `¡Hola ${cliente.nombre}! 👋

Te envío la *cotización* solicitada:

📦 *Detalle:*
${cotizacion.items.map(item => `• ${item.cantidad}x ${item.producto} - $${item.subtotal.toLocaleString()}`).join('\n')}

💰 *Total:* $${cotizacion.total.toLocaleString()}

📅 *Tiempo de entrega estimado:* 7-10 días hábiles

Esta cotización tiene validez de 7 días.

¿Querés confirmar el pedido? 
Respondé este mensaje para coordinar. 

¡Saludos de ${nombreNegocio}! 🎯`;
}

// Reminder for pending order
export function mensajeRecordatorio(pedido, cliente) {
    return `¡Hola ${cliente.nombre}! 👋

Te recordamos que tenés un pedido *pendiente de retiro*:

📦 Pedido #${pedido.numero}
💰 Total: $${pedido.total.toLocaleString()}

¿Cuándo te queda cómodo pasar a buscarlo? 📍`;
}

// Shipping notification with tracking
export function mensajeEnvioTracking(pedido, cliente, tracking, sucursal = null) {
    const config = getConfiguracion();
    const nombreNegocio = config.nombreNegocio || 'Grabados Express';
    const trackingUrl = `https://www.correoargentino.com.ar/formularios/ondnc?id=${tracking}`;

    let mensaje = `¡Hola ${cliente.nombre}! 👋

🚚 ¡Tu pedido #${pedido.numero} ya fue *DESPACHADO*!

📦 *Código de seguimiento:* ${tracking}`;

    if (sucursal) {
        mensaje += `\n📍 *Destino:* Sucursal ${sucursal}`;
    }

    mensaje += `

🔍 *Seguí tu envío acá:*
${trackingUrl}

Te llegará en aproximadamente 3-5 días hábiles.

¡Gracias por tu compra en ${nombreNegocio}! ✨`;

    return mensaje;
}

// Custom message
export function enviarMensajePersonalizado(cliente, mensaje) {
    if (!cliente.telefono) return false;
    return enviarWhatsApp(cliente.telefono, mensaje);
}

// Send message to client by pedido
export function enviarMensajePedido(pedido, tipo, extra = {}) {
    const cliente = getClienteById(pedido.clienteId);
    if (!cliente || !cliente.telefono) return false;

    let mensaje;
    switch (tipo) {
        case 'confirmacion':
            mensaje = mensajeConfirmacionPedido(pedido, cliente);
            break;
        case 'produccion':
            mensaje = mensajePedidoEnProduccion(pedido, cliente);
            break;
        case 'terminado':
            mensaje = mensajePedidoTerminado(pedido, cliente);
            break;
        case 'recordatorio':
            mensaje = mensajeRecordatorio(pedido, cliente);
            break;
        case 'envio':
        case 'tracking':
            if (!extra.tracking) return false;
            mensaje = mensajeEnvioTracking(pedido, cliente, extra.tracking, extra.sucursal);
            break;
        default:
            return false;
    }

    return enviarWhatsApp(cliente.telefono, mensaje);
}
