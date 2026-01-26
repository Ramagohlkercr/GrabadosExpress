// Lista de precios Enero 2026 - Grabados Express
export const LISTA_PRECIOS = {
    etiquetasEcoCuero: {
        nombre: 'Etiquetas en Eco Cuero',
        descripcion: 'Colores: Beige o Suela. Medidas: 4x2cm, 5x2.5cm, redonda 4cm o 5cm',
        precios: [
            { cantidad: 50, precio: 14490, precioUnitario: 289, envioGratis: false },
            { cantidad: 100, precio: 19490, precioUnitario: 194, envioGratis: false },
            { cantidad: 200, precio: 25990, precioUnitario: 129, envioGratis: true },
            { cantidad: 300, precio: 33990, precioUnitario: 113, envioGratis: true },
            { cantidad: 400, precio: 39990, precioUnitario: 99, envioGratis: true },
            { cantidad: 500, precio: 49990, precioUnitario: 99, envioGratis: true },
            { cantidad: 600, precio: 57990, precioUnitario: 96, envioGratis: true },
            { cantidad: 700, precio: 64990, precioUnitario: 92, envioGratis: true },
            { cantidad: 800, precio: 71990, precioUnitario: 89, envioGratis: true },
            { cantidad: 900, precio: 77990, precioUnitario: 86, envioGratis: true },
            { cantidad: 1000, precio: 83990, precioUnitario: 83, envioGratis: true },
        ]
    },
    etiquetasAcrilico: {
        nombre: 'Etiquetas en Acrílico',
        descripcion: 'Envío incluido en el precio',
        precios: [
            { cantidad: 50, precio: 29990, envioGratis: true },
            { cantidad: 100, precio: 39990, envioGratis: true },
            { cantidad: 150, precio: 44990, envioGratis: true },
            { cantidad: 200, precio: 59990, envioGratis: true },
        ]
    },
    etiquetasCueroGenuino: {
        nombre: 'Etiquetas en Cuero Genuino',
        descripcion: 'Envío incluido en el precio',
        precios: [
            { cantidad: 50, precio: 29990, envioGratis: true },
            { cantidad: 100, precio: 34990, envioGratis: true },
            { cantidad: 150, precio: 49990, envioGratis: true },
            { cantidad: 200, precio: 59990, envioGratis: true },
        ]
    },
    llaverosEcoCuero: {
        nombre: 'Llaveros en Eco Cuero',
        descripcion: '',
        precios: [
            { cantidad: 30, precio: 39990, envioGratis: false },
            { cantidad: 50, precio: 59990, envioGratis: false },
            { cantidad: 100, precio: 89990, envioGratis: false },
            { cantidad: 200, precio: 159990, envioGratis: false },
        ]
    },
    llaverosCueroGenuino: {
        nombre: 'Llaveros en Cuero Genuino Premium',
        descripcion: '',
        precios: [
            { cantidad: 30, precio: 64990, envioGratis: false },
            { cantidad: 50, precio: 99990, envioGratis: false },
            { cantidad: 100, precio: 149990, envioGratis: false },
            { cantidad: 200, precio: 269990, envioGratis: false },
        ]
    },
    llaverosAcrilico: {
        nombre: 'Llaveros en Acrílico',
        descripcion: '',
        precios: [
            { cantidad: 30, precio: 54990, envioGratis: false },
            { cantidad: 50, precio: 84990, envioGratis: false },
            { cantidad: 100, precio: 139990, envioGratis: false },
            { cantidad: 200, precio: 249990, envioGratis: false },
        ]
    },
    llaverosMosquetonEcoCuero: {
        nombre: 'Llaveros con Mosquetón - Eco Cuero',
        descripcion: '',
        precios: [
            { cantidad: 30, precio: 49990, envioGratis: false },
            { cantidad: 50, precio: 74990, envioGratis: false },
            { cantidad: 100, precio: 99990, envioGratis: false },
            { cantidad: 200, precio: 179990, envioGratis: false },
        ]
    },
    llaverosMosquetonCueroGenuino: {
        nombre: 'Llaveros con Mosquetón - Cuero Genuino',
        descripcion: '',
        precios: [
            { cantidad: 30, precio: 74990, envioGratis: false },
            { cantidad: 50, precio: 119990, envioGratis: false },
            { cantidad: 100, precio: 169990, envioGratis: false },
            { cantidad: 200, precio: 289990, envioGratis: false },
        ]
    },
    llaverosMosquetonAcrilico: {
        nombre: 'Llaveros con Mosquetón - Acrílico',
        descripcion: '',
        precios: [
            { cantidad: 30, precio: 64990, envioGratis: false },
            { cantidad: 50, precio: 99990, envioGratis: false },
            { cantidad: 100, precio: 149990, envioGratis: false },
            { cantidad: 200, precio: 269990, envioGratis: false },
        ]
    },
};

// Formatear precio en pesos argentinos
export function formatPrecio(precio) {
    return `$${precio.toLocaleString('es-AR')}`;
}

// Generar lista de precios formateada para WhatsApp
export function generarListaPreciosWhatsApp() {
    let texto = '📋 *LISTA DE PRECIOS - GRABADOS EXPRESS*\n';
    texto += '_Enero 2026_\n\n';

    // Etiquetas Eco Cuero
    texto += '🏷️ *ETIQUETAS EN ECO CUERO*\n';
    texto += '_Colores: Beige o Suela_\n';
    texto += '_Medidas: 4x2cm, 5x2.5cm, redonda 4cm o 5cm_\n\n';
    LISTA_PRECIOS.etiquetasEcoCuero.precios.forEach(p => {
        texto += `• ${p.cantidad} unidades: ${formatPrecio(p.precio)}`;
        if (p.precioUnitario) texto += ` (${formatPrecio(p.precioUnitario)} c/u)`;
        if (p.envioGratis) texto += ' ✨ Envío gratis';
        texto += '\n';
    });

    texto += '\n💎 *ETIQUETAS EN ACRÍLICO*\n';
    texto += '_Envío incluido_\n\n';
    LISTA_PRECIOS.etiquetasAcrilico.precios.forEach(p => {
        texto += `• ${p.cantidad} unidades: ${formatPrecio(p.precio)}\n`;
    });

    texto += '\n👜 *ETIQUETAS EN CUERO GENUINO*\n';
    texto += '_Envío incluido_\n\n';
    LISTA_PRECIOS.etiquetasCueroGenuino.precios.forEach(p => {
        texto += `• ${p.cantidad} unidades: ${formatPrecio(p.precio)}\n`;
    });

    texto += '\n🔑 *LLAVEROS EN ECO CUERO*\n\n';
    LISTA_PRECIOS.llaverosEcoCuero.precios.forEach(p => {
        texto += `• ${p.cantidad} unidades: ${formatPrecio(p.precio)}\n`;
    });

    texto += '\n🔑 *LLAVEROS EN CUERO GENUINO PREMIUM*\n\n';
    LISTA_PRECIOS.llaverosCueroGenuino.precios.forEach(p => {
        texto += `• ${p.cantidad} unidades: ${formatPrecio(p.precio)}\n`;
    });

    texto += '\n🔑 *LLAVEROS EN ACRÍLICO*\n\n';
    LISTA_PRECIOS.llaverosAcrilico.precios.forEach(p => {
        texto += `• ${p.cantidad} unidades: ${formatPrecio(p.precio)}\n`;
    });

    texto += '\n🔗 *LLAVEROS CON MOSQUETÓN*\n\n';
    texto += '_Eco Cuero:_\n';
    LISTA_PRECIOS.llaverosMosquetonEcoCuero.precios.forEach(p => {
        texto += `• ${p.cantidad} unidades: ${formatPrecio(p.precio)}\n`;
    });
    texto += '\n_Cuero Genuino:_\n';
    LISTA_PRECIOS.llaverosMosquetonCueroGenuino.precios.forEach(p => {
        texto += `• ${p.cantidad} unidades: ${formatPrecio(p.precio)}\n`;
    });
    texto += '\n_Acrílico:_\n';
    LISTA_PRECIOS.llaverosMosquetonAcrilico.precios.forEach(p => {
        texto += `• ${p.cantidad} unidades: ${formatPrecio(p.precio)}\n`;
    });

    texto += '\n⏱️ _Entrega: 7-10 días hábiles_\n';
    texto += '💳 _Seña 50% para iniciar_';

    return texto;
}

// Generar lista resumida para el chat
export function generarListaResumida() {
    let texto = '';

    texto += '🏷️ *Etiquetas Eco Cuero:* desde $14.490 (50u) a $83.990 (1000u)\n';
    texto += '💎 *Etiquetas Acrílico:* desde $29.990 (50u) a $59.990 (200u)\n';
    texto += '👜 *Etiquetas Cuero Genuino:* desde $29.990 (50u) a $59.990 (200u)\n\n';
    texto += '🔑 *Llaveros Eco Cuero:* desde $39.990 (30u) a $159.990 (200u)\n';
    texto += '🔑 *Llaveros Cuero Genuino:* desde $64.990 (30u) a $269.990 (200u)\n';
    texto += '🔑 *Llaveros Acrílico:* desde $54.990 (30u) a $249.990 (200u)\n\n';
    texto += '🔗 *Llaveros con Mosquetón:*\n';
    texto += '  • Eco Cuero: desde $49.990 (30u)\n';
    texto += '  • Cuero Genuino: desde $74.990 (30u)\n';
    texto += '  • Acrílico: desde $64.990 (30u)\n';

    return texto;
}

// Buscar precio por producto y cantidad
export function buscarPrecio(tipoProducto, cantidad) {
    const producto = LISTA_PRECIOS[tipoProducto];
    if (!producto) return null;

    // Buscar el precio exacto o el más cercano
    const precioExacto = producto.precios.find(p => p.cantidad === cantidad);
    if (precioExacto) return precioExacto;

    // Si no hay exacto, buscar el siguiente mayor
    const precioMayor = producto.precios.find(p => p.cantidad >= cantidad);
    return precioMayor || producto.precios[producto.precios.length - 1];
}
