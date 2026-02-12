import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { 
    CheckCircle, 
    AlertCircle, 
    AlertTriangle, 
    Info, 
    X,
    Package,
    Calendar,
    Truck,
    DollarSign,
    Bell,
    Clock,
    MessageCircle
} from 'lucide-react';

// Contexto para las notificaciones
const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe usarse dentro de ToastProvider');
    }
    return context;
};

// Iconos según tipo de notificación
const getIcon = (type, category) => {
    if (category === 'pedido') return <Package size={20} />;
    if (category === 'envio') return <Truck size={20} />;
    if (category === 'pago') return <DollarSign size={20} />;
    if (category === 'calendario') return <Calendar size={20} />;
    if (category === 'recordatorio') return <Clock size={20} />;
    if (category === 'whatsapp') return <MessageCircle size={20} />;
    
    switch (type) {
        case 'success': return <CheckCircle size={20} />;
        case 'error': return <AlertCircle size={20} />;
        case 'warning': return <AlertTriangle size={20} />;
        case 'info': return <Info size={20} />;
        default: return <Bell size={20} />;
    }
};

// Componente Toast individual
const Toast = ({ toast, onRemove }) => {
    useEffect(() => {
        if (toast.duration !== 0) {
            const timer = setTimeout(() => {
                onRemove(toast.id);
            }, toast.duration || 5000);
            return () => clearTimeout(timer);
        }
    }, [toast, onRemove]);

    return (
        <div 
            className={`toast toast-${toast.type} ${toast.removing ? 'toast-removing' : ''}`}
            onClick={() => toast.onClick?.()}
            style={{ cursor: toast.onClick ? 'pointer' : 'default' }}
        >
            <div className="toast-icon">
                {getIcon(toast.type, toast.category)}
            </div>
            <div className="toast-content">
                {toast.title && <div className="toast-title">{toast.title}</div>}
                <div className="toast-message">{toast.message}</div>
                {toast.subtitle && <div className="toast-subtitle">{toast.subtitle}</div>}
            </div>
            <button 
                className="toast-close" 
                onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

// Formatear fecha
const formatDate = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const date = new Date(fecha);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('es-AR', options);
};

// Provider de Toasts
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((options) => {
        const id = Date.now() + Math.random();
        const toast = {
            id,
            type: 'info',
            duration: 5000,
            ...options
        };
        
        setToasts(prev => [...prev, toast]);
        
        // Vibrar en móvil para notificaciones importantes
        if (toast.vibrate && navigator.vibrate) {
            navigator.vibrate(toast.type === 'error' ? [100, 50, 100] : [50]);
        }
        
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(t => 
            t.id === id ? { ...t, removing: true } : t
        ));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
    }, []);

    // Funciones de conveniencia
    const success = useCallback((message, options = {}) => 
        addToast({ type: 'success', message, vibrate: true, ...options }), [addToast]);
    
    const error = useCallback((message, options = {}) => 
        addToast({ type: 'error', message, vibrate: true, duration: 7000, ...options }), [addToast]);
    
    const warning = useCallback((message, options = {}) => 
        addToast({ type: 'warning', message, vibrate: true, ...options }), [addToast]);
    
    const info = useCallback((message, options = {}) => 
        addToast({ type: 'info', message, ...options }), [addToast]);

    // Notificaciones específicas del sistema
    const pedidoCreado = useCallback((pedido) => addToast({
        type: 'success',
        category: 'pedido',
        title: '✅ Pedido Agendado',
        message: `${pedido.cliente || pedido.clienteNombre} - ${pedido.items?.length || 1} producto(s)`,
        subtitle: pedido.fechaEntrega || pedido.fechaEntregaEstimada 
            ? `📅 Entrega: ${formatDate(pedido.fechaEntrega || pedido.fechaEntregaEstimada)}`
            : null,
        duration: 6000,
        vibrate: true
    }), [addToast]);

    const pedidoActualizado = useCallback((pedido, nuevoEstado) => {
        const estados = {
            'cotizacion': { emoji: '📋', texto: 'Cotización' },
            'confirmado': { emoji: '✅', texto: 'Confirmado' },
            'en_produccion': { emoji: '⚙️', texto: 'En Producción' },
            'terminado': { emoji: '🎉', texto: 'Terminado' },
            'enviado': { emoji: '🚚', texto: 'Enviado' },
            'entregado': { emoji: '📦', texto: 'Entregado' },
            'cancelado': { emoji: '❌', texto: 'Cancelado' }
        };
        const estado = estados[nuevoEstado] || { emoji: '📋', texto: nuevoEstado };
        
        return addToast({
            type: nuevoEstado === 'cancelado' ? 'warning' : 'success',
            category: 'pedido',
            title: `${estado.emoji} Pedido ${estado.texto}`,
            message: `#${pedido.numero || pedido.id} - ${pedido.clienteNombre || pedido.cliente || 'Cliente'}`,
            duration: 5000,
            vibrate: true
        });
    }, [addToast]);

    const pedidoUrgente = useCallback((pedido, diasRestantes) => addToast({
        type: diasRestantes <= 0 ? 'error' : 'warning',
        category: 'recordatorio',
        title: diasRestantes <= 0 ? '🚨 ¡PEDIDO ATRASADO!' : `⏰ Pedido Urgente`,
        message: `#${pedido.numero || pedido.id} - ${pedido.clienteNombre || pedido.cliente}`,
        subtitle: diasRestantes <= 0 
            ? `Debía entregarse hace ${Math.abs(diasRestantes)} día(s)` 
            : `Faltan ${diasRestantes} día(s) para entregar`,
        duration: diasRestantes <= 0 ? 10000 : 7000,
        vibrate: true
    }), [addToast]);

    const pedidoParaHoy = useCallback((cantidad) => addToast({
        type: 'info',
        category: 'calendario',
        title: '📅 Entregas para Hoy',
        message: `Tenés ${cantidad} pedido(s) para entregar hoy`,
        duration: 8000,
        vibrate: true
    }), [addToast]);

    const envioCreado = useCallback((tracking, cliente) => addToast({
        type: 'success',
        category: 'envio',
        title: '🚚 Envío Registrado',
        message: `Tracking: ${tracking}`,
        subtitle: cliente ? `Cliente: ${cliente}` : 'El cliente será notificado',
        duration: 5000,
        vibrate: true
    }), [addToast]);

    const pagoRecibido = useCallback((monto, cliente) => addToast({
        type: 'success',
        category: 'pago',
        title: '💰 Pago Recibido',
        message: `$${monto.toLocaleString('es-AR')} de ${cliente}`,
        duration: 5000,
        vibrate: true
    }), [addToast]);

    const stockBajo = useCallback((insumo) => addToast({
        type: 'warning',
        category: 'recordatorio',
        title: '📦 Stock Bajo',
        message: `${insumo.nombre}: ${insumo.cantidad} unidades`,
        subtitle: insumo.minimo ? `Mínimo recomendado: ${insumo.minimo}` : null,
        duration: 7000,
        vibrate: true
    }), [addToast]);

    const mensajeWhatsApp = useCallback((cliente, preview) => addToast({
        type: 'info',
        category: 'whatsapp',
        title: '💬 Nuevo Mensaje WhatsApp',
        message: cliente,
        subtitle: preview?.substring(0, 50) + (preview?.length > 50 ? '...' : ''),
        duration: 6000,
        vibrate: true
    }), [addToast]);

    const clienteCreado = useCallback((nombre) => addToast({
        type: 'success',
        category: 'pedido',
        title: '👤 Cliente Agregado',
        message: nombre,
        duration: 4000,
        vibrate: false
    }), [addToast]);

    const value = {
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
        // Notificaciones específicas
        pedidoCreado,
        pedidoActualizado,
        pedidoUrgente,
        pedidoParaHoy,
        envioCreado,
        pagoRecibido,
        stockBajo,
        mensajeWhatsApp,
        clienteCreado
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
