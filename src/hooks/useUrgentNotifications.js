import { useEffect, useRef } from 'react';
import { useToast } from '../components/ui/Toast';

export const useUrgentNotifications = (pedidos) => {
    const toast = useToast();
    const notifiedIds = useRef(new Set());
    const hasShownSummary = useRef(false);

    useEffect(() => {
        if (!pedidos || pedidos.length === 0) return;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let pedidosHoy = 0;
        let pedidosAtrasados = [];
        let pedidosUrgentes = [];

        pedidos.forEach(pedido => {
            // Solo pedidos activos (no entregados ni cancelados)
            if (['entregado', 'cancelado'].includes(pedido.estado)) return;
            
            const fechaEntrega = pedido.fechaEntregaEstimada || pedido.fechaEntrega;
            if (!fechaEntrega) return;

            const fecha = new Date(fechaEntrega);
            fecha.setHours(0, 0, 0, 0);
            
            const diffTime = fecha - hoy;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                pedidosHoy++;
            } else if (diffDays < 0) {
                pedidosAtrasados.push({ pedido, dias: diffDays });
            } else if (diffDays === 1) {
                pedidosUrgentes.push({ pedido, dias: diffDays });
            }
        });

        // Mostrar resumen de pedidos para hoy (solo una vez)
        if (pedidosHoy > 0 && !hasShownSummary.current) {
            setTimeout(() => {
                toast.pedidoParaHoy(pedidosHoy);
                hasShownSummary.current = true;
            }, 500);
        }

        // Notificar pedidos atrasados (máximo 3 para no saturar)
        pedidosAtrasados.slice(0, 3).forEach(({ pedido, dias }, index) => {
            if (notifiedIds.current.has(pedido.id)) return;
            
            setTimeout(() => {
                toast.pedidoUrgente(pedido, dias);
                notifiedIds.current.add(pedido.id);
            }, 1500 + (index * 800));
        });

        // Si hay más de 3 atrasados, mostrar un resumen
        if (pedidosAtrasados.length > 3) {
            setTimeout(() => {
                toast.warning(`¡Hay ${pedidosAtrasados.length} pedidos atrasados en total!`, {
                    title: '⚠️ Atención',
                    duration: 8000
                });
            }, 1500 + (3 * 800) + 500);
        }

        // Notificar pedidos que vencen mañana (máximo 2)
        pedidosUrgentes.slice(0, 2).forEach(({ pedido, dias }, index) => {
            if (notifiedIds.current.has(pedido.id)) return;
            
            setTimeout(() => {
                toast.pedidoUrgente(pedido, dias);
                notifiedIds.current.add(pedido.id);
            }, 3000 + (index * 600));
        });

    }, [pedidos, toast]);

    // Resetear al cambiar de día
    useEffect(() => {
        const checkNewDay = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const msToMidnight = midnight - now;
            
            const timer = setTimeout(() => {
                notifiedIds.current.clear();
                hasShownSummary.current = false;
            }, msToMidnight);

            return () => clearTimeout(timer);
        };
        
        return checkNewDay();
    }, []);

    return {
        clearNotifications: () => {
            notifiedIds.current.clear();
            hasShownSummary.current = false;
        }
    };
};

export default useUrgentNotifications;
