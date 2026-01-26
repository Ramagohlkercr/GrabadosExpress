// ============================================
// DATE UTILITIES
// Business days calculation for Argentina
// ============================================

import { addDays, isWeekend, format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getConfiguracion } from './storage';

// Get holidays from config
function getFeriados() {
    const config = getConfiguracion();
    return config.feriados || [];
}

// Check if a date is a holiday
export function esFeriado(fecha) {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    return getFeriados().includes(fechaStr);
}

// Check if a date is a business day
export function esDiaHabil(fecha) {
    return !isWeekend(fecha) && !esFeriado(fecha);
}

// Add business days to a date
export function agregarDiasHabiles(fechaInicio, diasHabiles) {
    let fecha = new Date(fechaInicio);
    let diasAgregados = 0;

    while (diasAgregados < diasHabiles) {
        fecha = addDays(fecha, 1);
        if (esDiaHabil(fecha)) {
            diasAgregados++;
        }
    }

    return fecha;
}

// Calculate delivery date (7-10 business days)
export function calcularFechaEntrega(fechaPedido = new Date()) {
    const config = getConfiguracion();
    const diasMin = config.diasHabilesEntrega || 7;
    const diasMax = config.diasHabilesMax || 10;

    const fechaMin = agregarDiasHabiles(fechaPedido, diasMin);
    const fechaMax = agregarDiasHabiles(fechaPedido, diasMax);

    return {
        fechaMinima: fechaMin,
        fechaMaxima: fechaMax,
        fechaEstimada: fechaMin, // Default to minimum
        diasHabiles: diasMin,
    };
}

// Format date for display
export function formatearFecha(fecha, formatStr = 'dd/MM/yyyy') {
    if (!fecha) return '-';
    const date = typeof fecha === 'string' ? parseISO(fecha) : fecha;
    return format(date, formatStr, { locale: es });
}

// Format date with day name
export function formatearFechaConDia(fecha) {
    if (!fecha) return '-';
    const date = typeof fecha === 'string' ? parseISO(fecha) : fecha;
    return format(date, "EEEE d 'de' MMMM", { locale: es });
}

// Format relative date (e.g., "en 3 días", "hace 2 días")
export function formatearFechaRelativa(fecha) {
    if (!fecha) return '-';
    const date = typeof fecha === 'string' ? parseISO(fecha) : fecha;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diff = differenceInDays(date, hoy);

    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    if (diff === -1) return 'Ayer';
    if (diff > 0) return `En ${diff} días`;
    return `Hace ${Math.abs(diff)} días`;
}

// Calculate days remaining until delivery
export function diasParaEntrega(fechaEntrega) {
    if (!fechaEntrega) return null;
    const fecha = typeof fechaEntrega === 'string' ? parseISO(fechaEntrega) : fechaEntrega;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);

    return differenceInDays(fecha, hoy);
}

// Get urgency level based on days remaining
export function getNivelUrgencia(fechaEntrega) {
    const dias = diasParaEntrega(fechaEntrega);

    if (dias === null) return 'normal';
    if (dias < 0) return 'atrasado';
    if (dias === 0) return 'hoy';
    if (dias <= 2) return 'urgente';
    if (dias <= 5) return 'proximo';
    return 'normal';
}

// Get this week's deliveries
export function getEntregasSemana(pedidos) {
    const hoy = new Date();
    const finSemana = addDays(hoy, 7);

    return pedidos.filter(p => {
        if (!p.fechaEntregaEstimada) return false;
        const fecha = parseISO(p.fechaEntregaEstimada);
        return fecha >= hoy && fecha <= finSemana;
    }).sort((a, b) => new Date(a.fechaEntregaEstimada) - new Date(b.fechaEntregaEstimada));
}

// Get today's deliveries
export function getEntregasHoy(pedidos) {
    const hoy = format(new Date(), 'yyyy-MM-dd');

    return pedidos.filter(p => {
        if (!p.fechaEntregaEstimada) return false;
        return format(parseISO(p.fechaEntregaEstimada), 'yyyy-MM-dd') === hoy;
    });
}

// Format time ago
export function tiempoTranscurrido(fecha) {
    if (!fecha) return '';
    const date = typeof fecha === 'string' ? parseISO(fecha) : fecha;
    const ahora = new Date();
    const diff = ahora - date;

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias} días`;
    return formatearFecha(date);
}
