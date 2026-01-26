import { useState, useEffect, useRef } from 'react';
import {
    MessageCircle,
    Send,
    Image,
    X,
    Copy,
    Check,
    Sparkles,
    DollarSign,
    Clock,
    Tag,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Package,
    Plus,
    Truck,
    AlertCircle,
    Zap,
    FileText,
    CreditCard,
    MapPin,
    User,
    Calendar,
    CheckCircle,
    Phone
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getClientes, ESTADOS_PEDIDO } from '../lib/storage';
import { 
    getClientesAsync, 
    saveClienteAsync, 
    savePedidoAsync, 
    getPedidosAsync 
} from '../lib/storageApi';
import {
    LISTA_PRECIOS,
    generarListaPreciosWhatsApp,
    generarListaResumida,
    formatPrecio,
    buscarPrecio
} from '../lib/precios';
import { calcularFechaEntrega, formatearFecha, formatearFechaConDia } from '../lib/dateUtils';
import { analyzeImage, analyzeLogoText } from '../lib/imageAnalysis';
import toast from 'react-hot-toast';

// Datos del negocio
const WHATSAPP_NEGOCIO = '3412278217';

// Material mappings
const MATERIAL_NAMES = {
    ecocuero: 'Eco Cuero',
    acrilico: 'Acrílico',
    cuero: 'Cuero Genuino',
    mdf: 'MDF',
};

const MATERIAL_ALIASES = {
    'eco cuero': 'ecocuero',
    'ecocuero': 'ecocuero',
    'eco-cuero': 'ecocuero',
    'sintetico': 'ecocuero',
    'sintético': 'ecocuero',
    'acrilico': 'acrilico',
    'acrílico': 'acrilico',
    'cuero genuino': 'cuero',
    'cuero real': 'cuero',
    'cuero premium': 'cuero',
    'cuero': 'cuero',
    'mdf': 'mdf',
    'madera': 'mdf',
};

// Quick response templates
const QUICK_RESPONSES = [
    {
        id: 'precios',
        icon: '💰',
        label: 'Precios',
        shortcut: 'P',
    },
    {
        id: 'envio',
        icon: '📦',
        label: 'Datos envío',
        shortcut: 'E',
    },
    {
        id: 'pago',
        icon: '💳',
        label: 'Pago/Seña',
        shortcut: 'S',
    },
    {
        id: 'tiempos',
        icon: '⏱️',
        label: 'Tiempos',
        shortcut: 'T',
    },
    {
        id: 'etiquetas',
        icon: '🏷️',
        label: 'Etiquetas',
        shortcut: '1',
    },
    {
        id: 'llaveros',
        icon: '🔑',
        label: 'Llaveros',
        shortcut: '2',
    },
];

// Response templates
const TEMPLATES = {
    precios: `¡Claro! Acá van los precios 💰

🏷️ *ETIQUETAS ECO CUERO*
• 50u: $14.490
• 100u: $19.490
• 200u: $25.990 ✨ Envío gratis
• 500u: $49.990 ✨ Envío gratis

💎 *ETIQUETAS ACRÍLICO* (envío incluido)
• 50u: $29.990
• 100u: $39.990
• 200u: $59.990

🔑 *LLAVEROS ECO CUERO*
• 30u: $39.990
• 50u: $59.990
• 100u: $89.990

⏱️ Entrega: 7-10 días hábiles
💳 Seña 50% para iniciar

¿Cuántas necesitás?`,

    envio: `📦 *DATOS PARA ENVÍO*

Necesito los siguientes datos:

✅ Nombre completo
✅ DNI
✅ Calle y número
✅ Localidad
✅ Provincia
✅ Código Postal
✅ Teléfono

Pasame estos datos y te confirmo el costo de envío 🚚`,

    pago: `💳 *FORMAS DE PAGO*

• Transferencia bancaria
• Mercado Pago
• Efectivo (si retirás)

📌 Pedimos *seña del 50%* para iniciar la producción.

Una vez confirmada la seña, arrancamos con tu pedido ✨

📱 WhatsApp: wa.me/${WHATSAPP_NEGOCIO}`,

    tiempos: `⏱️ *TIEMPOS DE ENTREGA*

📅 Producción: *7-10 días hábiles* desde que confirmás

El tiempo empieza a correr cuando:
✅ Recibimos la seña (50%)
✅ Tenemos el logo/diseño final
✅ Confirmamos todos los detalles

¿Tenés alguna fecha límite? Contame y vemos cómo ayudarte 📆`,

    etiquetas: `🏷️ *ETIQUETAS PERSONALIZADAS*

Tenemos 3 materiales:

🧥 *Eco Cuero* - desde $14.490 (50u)
   Colores: Beige o Suela
   
💎 *Acrílico* - desde $29.990 (50u)
   Incluye envío gratis
   
👜 *Cuero Genuino* - desde $29.990 (50u)
   Incluye envío gratis

📐 *Medidas disponibles:*
• 4x2 cm
• 5x2.5 cm
• Redonda 4cm o 5cm

¿Cuál te interesa?`,

    llaveros: `🔑 *LLAVEROS PERSONALIZADOS*

Tenemos 3 materiales:

🧥 *Eco Cuero* - desde $39.990 (30u)
💎 *Acrílico* - desde $54.990 (30u)
👜 *Cuero Genuino* - desde $64.990 (30u)

🔗 También con *mosquetón*:
• Eco Cuero: desde $49.990 (30u)
• Acrílico: desde $64.990 (30u)
• Cuero: desde $74.990 (30u)

¿Con qué material te gustaría?`,

    confirmarPedido: `✅ *PEDIDO CONFIRMADO*

📋 *Resumen:*
{DETALLE}

💰 *Total:* {TOTAL}
📅 *Entrega estimada:* {FECHA}

Para iniciar necesito:
1️⃣ Seña del 50%: {SENA}
2️⃣ Logo en PNG o PDF
3️⃣ Datos de envío completos

¡Gracias por confiar en Grabados Express! ✨`,

    agradecimiento: `¡Gracias a vos! 🙌

Cualquier consulta, escribinos.

📱 WhatsApp: wa.me/${WHATSAPP_NEGOCIO}

¡Éxitos! ✨`,

    saludo: `¡Hola! 👋 

Gracias por escribirnos. Somos *Grabados Express*, especialistas en grabado láser personalizado.

🏷️ Etiquetas
🔑 Llaveros
📦 Envío a todo el país

¿En qué te puedo ayudar?`,
};

// ============================================
// ORDER PARSING - Detección inteligente de pedidos
// ============================================

function parseOrderCommand(text) {
    const lowerText = text.toLowerCase().trim();
    const originalText = text.trim();
    
    // Lista de provincias argentinas para referencia
    const provinciasArg = [
        'Buenos Aires', 'CABA', 'Capital Federal', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán',
        'Salta', 'Entre Ríos', 'Misiones', 'Chaco', 'Corrientes', 'Santiago del Estero',
        'San Juan', 'Jujuy', 'Río Negro', 'Neuquén', 'Formosa', 'Chubut',
        'San Luis', 'Catamarca', 'La Rioja', 'La Pampa', 'Santa Cruz', 'Tierra del Fuego'
    ];
    
    // =====================================================
    // DETECCIÓN FLEXIBLE - Sin importar el orden
    // =====================================================
    
    // Detectar si parece un pedido (más flexible, no requiere palabra clave al inicio)
    const orderIndicators = [
        /\d+\s*(?:etiquetas?|llaveros?|unid)/i,  // Tiene cantidad + producto
        /(?:cliente|para)\s*[:\s]+/i,              // Menciona cliente
        /(?:eco\s*cuero|ecocuero|cuero|acr[ií]lico)/i, // Menciona material
        /\d+\s*[xX×]\s*\d+/,                        // Tiene medidas
        /(?:pedido|confirmar|nuevo|crear)/i,       // Palabras clave de pedido
        /(?:beige|suela|negro|blanco|natural)/i,   // Menciona color
    ];
    
    const looksLikeOrder = orderIndicators.filter(p => p.test(lowerText)).length >= 2;
    if (!looksLikeOrder) return null;
    
    const order = {
        clienteNombre: null,
        clienteTelefono: null,
        producto: 'Etiquetas',
        cantidad: null,
        material: 'ecocuero',
        medidas: null,
        color: null,
        logo: null,
        total: null,
        notas: null,
        localidad: null,
        provincia: null,
    };
    
    // =====================================================
    // EXTRAER CLIENTE (muy flexible)
    // =====================================================
    // Palabras que NO son nombres de cliente
    const palabrasExcluidas = [
        'pedido', 'nuevo', 'crear', 'confirmar', 'confirmado',
        'etiqueta', 'etiquetas', 'llavero', 'llaveros', 'logo', 'marca',
        'eco', 'cuero', 'ecocuero', 'acrilico', 'acrílico', 'mdf', 'madera',
        'beige', 'negro', 'blanco', 'suela', 'natural', 'marron', 'marrón',
        'transparente', 'rojo', 'azul', 'rosa', 'verde', 'dorado', 'plateado',
        'envio', 'envío', 'enviar', 'despacho', 'destino', 'entrega',
        'total', 'precio', 'pesos', 'unidades', 'unid', 'cantidad',
        'medida', 'medidas', 'tamaño', 'redonda', 'circular',
        'rosario', 'cordoba', 'córdoba', 'mendoza', 'tucuman', 'tucumán',
        'buenos', 'aires', 'santa', 'caba', 'capital', 'federal',
    ];
    
    const esNombreValido = (nombre) => {
        if (!nombre || nombre.length < 2) return false;
        const lower = nombre.toLowerCase().trim();
        // Rechazar si es una palabra excluida o muy corta
        if (palabrasExcluidas.some(p => lower === p || lower.startsWith(p + ' ') || lower.endsWith(' ' + p))) {
            return false;
        }
        // Rechazar si contiene solo números o palabras clave
        if (/^\d+$/.test(nombre)) return false;
        // Debe tener al menos una letra
        if (!/[a-záéíóúñ]/i.test(nombre)) return false;
        return true;
    };
    
    const clientePatterns = [
        // "cliente: Juan" o "cliente Juan" o "para Juan"
        /(?:cliente|para)[:\s]+["']?([A-ZÁÉÍÓÚÑa-záéíóúñ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]{1,29})["']?(?=[,.\s]|$)/i,
        // "a nombre de Juan Pérez"
        /(?:a nombre de)[:\s]+["']?([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{2,30})["']?/i,
        // Nombre entre comillas "Juan Pérez"
        /["']([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)["']/,
    ];
    
    for (const pattern of clientePatterns) {
        const match = originalText.match(pattern);
        if (match && match[1] && esNombreValido(match[1].trim())) {
            order.clienteNombre = match[1].trim().replace(/^["']|["']$/g, '');
            break;
        }
    }
    
    // =====================================================
    // EXTRAER TELÉFONO
    // =====================================================
    const telPatterns = [
        /(?:tel|telefono|teléfono|cel|celular|whatsapp|wsp|wa)[:\s]*[+]?(\d[\d\s\-]{7,15})/i,
        /\b((?:11|15|(?:2|3)\d{2,3})[\s\-]?\d{3,4}[\s\-]?\d{4})\b/,  // Formato argentino
    ];
    
    for (const pattern of telPatterns) {
        const match = originalText.match(pattern);
        if (match) {
            order.clienteTelefono = match[1].replace(/[\s\-]/g, '');
            break;
        }
    }
    
    // =====================================================
    // EXTRAER CANTIDAD (muy flexible)
    // =====================================================
    const cantidadPatterns = [
        /(\d{1,4})\s*(?:unidades|unid|u\b|etiquetas?|llaveros?|piezas?|pzas?)/i,
        /(?:cantidad|cant|x)[:\s]*(\d{1,4})/i,
        /(\d{2,4})\s+(?:de\s+)?(?:eco|cuero|acr)/i,  // "100 de ecocuero"
        /(?:^|\s)(\d{2,4})(?:\s|,|$)/,  // Número suelto de 2-4 dígitos
    ];
    
    for (const pattern of cantidadPatterns) {
        const match = lowerText.match(pattern);
        if (match) {
            const num = parseInt(match[1]);
            // Validar que sea una cantidad razonable (no una medida o precio)
            if (num >= 10 && num <= 5000) {
                order.cantidad = num;
                break;
            }
        }
    }
    
    // =====================================================
    // EXTRAER PRODUCTO
    // =====================================================
    if (/llavero/i.test(lowerText)) {
        order.producto = 'Llaveros';
        if (/mosqueton|mosquetón/i.test(lowerText)) {
            order.producto = 'Llaveros con Mosquetón';
        }
    } else {
        order.producto = 'Etiquetas';
    }
    
    // =====================================================
    // EXTRAER MATERIAL (muy flexible)
    // =====================================================
    const materiales = {
        'eco cuero': 'ecocuero', 'ecocuero': 'ecocuero', 'eco-cuero': 'ecocuero',
        'cuero genuino': 'cuero', 'cuero real': 'cuero', 'cuero legitimo': 'cuero',
        'cuero': 'cuero',
        'acrilico': 'acrilico', 'acrílico': 'acrilico', 'acri': 'acrilico',
        'mdf': 'mdf', 'madera': 'mdf',
    };
    
    for (const [alias, material] of Object.entries(materiales)) {
        if (lowerText.includes(alias)) {
            order.material = material;
            break;
        }
    }
    
    // =====================================================
    // EXTRAER MEDIDAS (muy flexible)
    // =====================================================
    const medidasPatterns = [
        /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*(?:cm|centimetros)?/i,
        /(?:medida|tamaño|tam)[:\s]*(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
        /(?:de|en)\s+(\d+)\s*[xX×]\s*(\d+)/i,
        /(redonda|circular|circulo)\s*(?:de\s*)?(\d+)\s*(?:cm)?/i,
        /(\d+)\s*(?:cm\s*)?(?:redonda|circular|de diametro|diámetro)/i,
    ];
    
    for (const pattern of medidasPatterns) {
        const match = originalText.match(pattern);
        if (match) {
            if (/redonda|circular|circulo|diametro|diámetro/i.test(match[0])) {
                const diam = match[2] || match[1];
                order.medidas = `${diam}cm redonda`;
            } else if (match[2]) {
                order.medidas = `${match[1]}x${match[2]}cm`;
            }
            break;
        }
    }
    
    // =====================================================
    // EXTRAER COLOR (muy flexible)
    // =====================================================
    const colores = {
        'beige': 'Beige', 'beis': 'Beige', 'crema': 'Beige',
        'suela': 'Suela', 'marron claro': 'Suela',
        'negro': 'Negro', 'negra': 'Negro',
        'blanco': 'Blanco', 'blanca': 'Blanco',
        'natural': 'Natural',
        'marron': 'Marrón', 'marrón': 'Marrón', 'cafe': 'Marrón',
        'transparente': 'Transparente', 'cristal': 'Transparente',
        'rojo': 'Rojo', 'roja': 'Rojo',
        'azul': 'Azul',
        'rosa': 'Rosa', 'rosado': 'Rosa',
        'verde': 'Verde',
        'dorado': 'Dorado', 'oro': 'Dorado',
        'plateado': 'Plateado', 'plata': 'Plateado',
    };
    
    for (const [alias, color] of Object.entries(colores)) {
        if (lowerText.includes(alias)) {
            order.color = color;
            break;
        }
    }
    
    // =====================================================
    // EXTRAER LOGO/MARCA (muy flexible)
    // =====================================================
    const logoPatterns = [
        /(?:logo|diseño|marca|imagen)\s*(?:de|del|:)?\s*["']?([^"',\n]{2,25})["']?(?=[,.\s]|$)/i,
        /con\s+(?:el\s+)?(?:logo|diseño)\s+(?:de\s+)?["']?([^"',\n]{2,25})["']?/i,
        /["']([^"']{2,20})["']\s*(?:logo|marca|diseño)/i,  // "Moor" logo
    ];
    
    for (const pattern of logoPatterns) {
        const match = originalText.match(pattern);
        if (match && match[1]) {
            const logoName = match[1].trim();
            // Evitar capturar datos que no son logos
            const excluir = ['etiqueta', 'llavero', 'pedido', 'eco', 'cuero', 'beige', 'negro'];
            if (!excluir.some(e => logoName.toLowerCase().includes(e))) {
                order.logo = logoName;
                break;
            }
        }
    }
    
    // =====================================================
    // EXTRAER PRECIO (muy flexible)
    // =====================================================
    const precioPatterns = [
        /(?:total|precio|valor|costo)[:\s]*\$?\s*([\d.,]+)/i,
        /\$\s*([\d]{3,}(?:[.,]\d{2})?)/,  // $15000 o $15.000
        /([\d]{4,}(?:[.,]\d{2})?)\s*(?:pesos|\$|ars)/i,
    ];
    
    for (const pattern of precioPatterns) {
        const match = originalText.match(pattern);
        if (match) {
            let precio = match[1].replace(/\./g, '').replace(',', '.');
            order.total = parseFloat(precio);
            break;
        }
    }
    
    // Si no hay precio, calcular automáticamente
    if (!order.total && order.cantidad) {
        const precioCalculado = calcularPrecioAutomatico(order);
        if (precioCalculado) {
            order.total = precioCalculado;
            order.precioCalculado = true;
        }
    }
    
    // =====================================================
    // EXTRAER LOCALIDAD Y PROVINCIA (muy flexible)
    // =====================================================
    
    // Lista de localidades comunes argentinas para validar
    const localidadesComunes = [
        'rosario', 'cordoba', 'córdoba', 'mendoza', 'tucuman', 'tucumán', 'salta',
        'mar del plata', 'san miguel', 'quilmes', 'moron', 'morón', 'lanus', 'lanús',
        'la plata', 'bahia blanca', 'bahía blanca', 'san isidro', 'tigre', 'pilar',
        'neuquen', 'neuquén', 'posadas', 'resistencia', 'corrientes', 'parana', 'paraná',
        'san juan', 'san luis', 'rio cuarto', 'río cuarto', 'villa maria', 'villa maría',
        'capital', 'capital federal', 'caba', 'centro', 'microcentro', 'palermo', 'belgrano',
        'caballito', 'flores', 'once', 'congreso', 'recoleta', 'san telmo', 'la boca',
        'ushuaia', 'rio gallegos', 'río gallegos', 'rawson', 'viedma', 'santa rosa',
        'formosa', 'san fernando', 'san salvador', 'catamarca', 'la rioja',
    ];
    
    const ubicacionPatterns = [
        // "envío a Rosario, Santa Fe" (con palabra clave explícita)
        /(?:env[ií][oa]r?|despacho?|destino|entrega)\s+(?:a\s+)?["']?([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,25})["']?(?:,\s*|\s*[-–]\s*)["']?([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,20})["']?(?:\s|$|,)/i,
        // "localidad: Rosario" (explícito)
        /(?:localidad|ciudad|ubicacion|ubicación)[:\s]+["']?([^,\n]{3,25})["']?/i,
        // "provincia: Santa Fe" (explícito)
        /(?:provincia|prov)[:\s]+["']?([^,\n]{3,20})["']?/i,
    ];
    
    for (const pattern of ubicacionPatterns) {
        const match = originalText.match(pattern);
        if (match) {
            if (/provincia|prov/.test(pattern.source)) {
                order.provincia = match[1].trim();
            } else if (match[2]) {
                const posibleLocalidad = match[1].trim();
                const posibleProv = match[2].trim();
                
                // Verificar que no estamos capturando el nombre del cliente
                if (order.clienteNombre && posibleLocalidad.toLowerCase() === order.clienteNombre.toLowerCase()) {
                    // Solo capturar provincia si es válida
                    const provEncontrada = provinciasArg.find(p => 
                        posibleProv.toLowerCase().includes(p.toLowerCase()) ||
                        p.toLowerCase().includes(posibleProv.toLowerCase())
                    );
                    if (provEncontrada) {
                        order.provincia = provEncontrada;
                    }
                } else {
                    order.localidad = posibleLocalidad;
                    const provEncontrada = provinciasArg.find(p => 
                        posibleProv.toLowerCase().includes(p.toLowerCase()) ||
                        p.toLowerCase().includes(posibleProv.toLowerCase())
                    );
                    order.provincia = provEncontrada || posibleProv;
                }
            } else {
                const posibleLocalidad = match[1].trim();
                if (!order.clienteNombre || posibleLocalidad.toLowerCase() !== order.clienteNombre.toLowerCase()) {
                    order.localidad = posibleLocalidad;
                }
            }
            break;
        }
    }
    
    // NUEVO: Buscar patrón "Localidad, Provincia" donde Provincia es conocida
    if (!order.localidad && !order.provincia) {
        // Buscar todas las provincias mencionadas en el texto
        for (const provincia of provinciasArg) {
            const provRegex = new RegExp(`([A-ZÁÉÍÓÚÑa-záéíóúñ\\s]{3,25})\\s*[,\\-–]\\s*(${provincia.replace(/\s+/g, '\\s*')})(?:\\s|$|,|\\.)`, 'i');
            const match = originalText.match(provRegex);
            if (match) {
                const posibleLocalidad = match[1].trim();
                // Verificar que no sea el nombre del cliente
                if (order.clienteNombre && posibleLocalidad.toLowerCase() === order.clienteNombre.toLowerCase()) {
                    order.provincia = provincia;
                } else {
                    // Verificar que la localidad parece válida (no es una palabra clave)
                    const palabrasNoLocalidad = ['cliente', 'para', 'pedido', 'etiquetas', 'llaveros', 'eco', 'cuero', 'beige', 'negro'];
                    if (!palabrasNoLocalidad.some(p => posibleLocalidad.toLowerCase() === p)) {
                        order.localidad = posibleLocalidad;
                        order.provincia = provincia;
                    } else {
                        order.provincia = provincia;
                    }
                }
                break;
            }
        }
    }
    
    // Fallback: buscar solo provincia mencionada (sin localidad)
    if (!order.provincia) {
        for (const provincia of provinciasArg) {
            const regex = new RegExp(`\\b${provincia.replace(/\s+/g, '\\s*')}\\b`, 'i');
            if (regex.test(originalText)) {
                // Verificar que no sea parte del nombre del cliente
                if (!order.clienteNombre || !order.clienteNombre.toLowerCase().includes(provincia.toLowerCase())) {
                    order.provincia = provincia;
                    break;
                }
            }
        }
    }
    
    // =====================================================
    // EXTRAER NOTAS
    // =====================================================
    const notasPatterns = [
        /(?:nota|observacion|obs|aclaracion|comentario)[:\s]+(.+?)(?:$)/i,
        /(?:importante|atencion|atención)[:\s]+(.+?)(?:$)/i,
    ];
    
    for (const pattern of notasPatterns) {
        const match = originalText.match(pattern);
        if (match) {
            order.notas = match[1].trim();
            break;
        }
    }
    
    return order;
}

function calcularPrecioAutomatico(order) {
    const { producto, material, cantidad } = order;
    
    if (!cantidad) return null;
    
    let tipoProducto = null;
    
    if (producto === 'Etiquetas') {
        if (material === 'ecocuero') tipoProducto = 'etiquetasEcoCuero';
        else if (material === 'acrilico') tipoProducto = 'etiquetasAcrilico';
        else if (material === 'cuero') tipoProducto = 'etiquetasCueroGenuino';
    } else if (producto === 'Llaveros') {
        if (material === 'ecocuero') tipoProducto = 'llaverosEcoCuero';
        else if (material === 'acrilico') tipoProducto = 'llaverosAcrilico';
        else if (material === 'cuero') tipoProducto = 'llaverosCueroGenuino';
    } else if (producto === 'Llaveros con Mosquetón') {
        if (material === 'ecocuero') tipoProducto = 'llaverosMosquetonEcoCuero';
        else if (material === 'acrilico') tipoProducto = 'llaverosMosquetonAcrilico';
        else if (material === 'cuero') tipoProducto = 'llaverosMosquetonCueroGenuino';
    }
    
    if (!tipoProducto || !LISTA_PRECIOS[tipoProducto]) return null;
    
    const precios = LISTA_PRECIOS[tipoProducto].precios;
    
    // Buscar precio exacto o más cercano
    let precio = precios.find(p => p.cantidad === cantidad);
    if (!precio) {
        precio = precios.find(p => p.cantidad >= cantidad);
    }
    if (!precio) {
        precio = precios[precios.length - 1];
    }
    
    // Calcular proporcionalmente si la cantidad es diferente
    if (precio && precio.cantidad !== cantidad) {
        const precioUnitario = precio.precio / precio.cantidad;
        return Math.round(precioUnitario * cantidad);
    }
    
    return precio?.precio || null;
}

function validateOrder(order) {
    const errors = [];
    const warnings = [];
    
    // Lista de palabras que no son nombres válidos de cliente
    const palabrasInvalidas = [
        'eco', 'cuero', 'ecocuero', 'acrilico', 'mdf', 'beige', 'negro', 'blanco',
        'suela', 'natural', 'etiqueta', 'llavero', 'logo', 'pedido', 'nuevo'
    ];
    
    if (!order.clienteNombre) {
        errors.push('Falta el nombre del cliente. Usá "cliente: Nombre" o "para Nombre"');
    } else if (order.clienteNombre.length < 3) {
        errors.push('El nombre del cliente es muy corto');
    } else if (palabrasInvalidas.some(p => order.clienteNombre.toLowerCase() === p)) {
        errors.push(`"${order.clienteNombre}" no parece un nombre de cliente. Usá "cliente: Nombre"`);
        order.clienteNombre = null; // Limpiar para evitar guardar dato incorrecto
    }
    
    if (!order.cantidad) {
        errors.push('Falta la cantidad');
    }
    
    if (!order.medidas) {
        warnings.push('No se especificaron medidas (se usará 4x2cm por defecto)');
        order.medidas = '4x2cm';
    }
    
    if (!order.color) {
        warnings.push('No se especificó color (se usará Beige por defecto)');
        order.color = 'Beige';
    }
    
    return { errors, warnings, isValid: errors.length === 0 };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Asistente() {
    const [clientes, setClientes] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [pendingLogoImage, setPendingLogoImage] = useState(null); // Logo for next order
    const [pendingLogoName, setPendingLogoName] = useState(null); // Detected logo text
    const [isAnalyzingLogo, setIsAnalyzingLogo] = useState(false); // OCR in progress
    const [isProcessing, setIsProcessing] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [showPrices, setShowPrices] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [recentOrders, setRecentOrders] = useState([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        async function loadInitialData() {
            try {
                const clientesData = await getClientesAsync();
                setClientes(clientesData);
                const pedidos = await getPedidosAsync();
                setRecentOrders(pedidos.slice(-5).reverse());
            } catch (error) {
                console.error('Error loading initial data:', error);
                // Fallback to sync version
                setClientes(getClientes());
            }
        }
        
        loadInitialData();

        // Mensaje de bienvenida
        setMessages([{
            type: 'assistant',
            content: `¡Hola! 👋 Soy tu asistente de **Grabados Express**.

**🚀 Crear pedido con logo:**

1️⃣ Pegá la imagen del logo con **Ctrl+V**
2️⃣ Escribí el pedido:
\`Pedido confirmado, cliente "Juan Pérez", 100 etiquetas 5x2 beige\`

**📸 El logo se adjunta automáticamente al pedido**

¿En qué te ayudo?`,
            timestamp: new Date(),
        }]);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle Ctrl+V for images
    useEffect(() => {
        async function handlePaste(e) {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            const imageData = reader.result;
                            setUploadedImage(imageData);
                            setPendingLogoImage(imageData);
                            setPendingLogoName(null); // Reset previous name
                            
                            // Analizar logo con OCR para extraer texto
                            setIsAnalyzingLogo(true);
                            toast.loading('🔍 Analizando logo...', { id: 'logo-analysis' });
                            
                            try {
                                const logoAnalysis = await analyzeLogoText(imageData);
                                
                                if (logoAnalysis.success && logoAnalysis.text) {
                                    setPendingLogoName(logoAnalysis.text);
                                    toast.success(
                                        `🖼️ Logo detectado: "${logoAnalysis.text}" (${logoAnalysis.confidence.toFixed(0)}% confianza)`,
                                        { id: 'logo-analysis' }
                                    );
                                } else {
                                    toast.success('🖼️ Logo listo - No se detectó texto', { id: 'logo-analysis' });
                                }
                            } catch (err) {
                                console.error('Error analizando logo:', err);
                                toast.success('🖼️ Logo listo - Escribí el pedido', { id: 'logo-analysis' });
                            } finally {
                                setIsAnalyzingLogo(false);
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                    break;
                }
            }
        }

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e) {
            // Alt + shortcut for quick responses
            if (e.altKey) {
                const quick = QUICK_RESPONSES.find(q => q.shortcut.toLowerCase() === e.key.toLowerCase());
                if (quick) {
                    e.preventDefault();
                    handleQuickResponse(quick.id);
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    function toggleCategory(key) {
        setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
    }

    // ============================================
    // CREAR PEDIDO AUTOMÁTICAMENTE
    // ============================================
    
    async function createOrderAutomatically(orderData) {
        // Costo de envío promedio
        const COSTO_ENVIO = 5200;
        
        // Localidades sin costo de envío (locales)
        const localidadesSinEnvio = ['rosario', 'funes', 'roldan', 'roldán', 'perez', 'pérez', 'fisherton', 'granadero baigorria'];
        
        // Buscar o crear cliente
        let clienteId;
        let clienteExistente = null;
        
        if (orderData.clienteNombre) {
            clienteExistente = clientes.find(c =>
                c.nombre.toLowerCase().includes(orderData.clienteNombre.toLowerCase()) ||
                orderData.clienteNombre.toLowerCase().includes(c.nombre.toLowerCase())
            );
        }
        
        if (clienteExistente) {
            clienteId = clienteExistente.id;
        } else {
            // Crear nuevo cliente usando async
            try {
                const nuevoCliente = await saveClienteAsync({
                    nombre: orderData.clienteNombre,
                    telefono: orderData.clienteTelefono || '',
                });
                const updatedClientes = await getClientesAsync();
                setClientes(updatedClientes);
                clienteId = nuevoCliente?.id || updatedClientes[updatedClientes.length - 1]?.id;
            } catch (error) {
                console.error('Error creating client:', error);
                // Fallback - use a temporary ID
                clienteId = `temp_${Date.now()}`;
            }
        }
        
        const fechaEntrega = calcularFechaEntrega(new Date());
        const materialName = MATERIAL_NAMES[orderData.material] || 'Eco Cuero';
        const productoNombre = `${orderData.producto} ${materialName}`;
        
        const precioUnitario = orderData.total && orderData.cantidad 
            ? Math.round(orderData.total / orderData.cantidad) 
            : 0;
        
        // Calcular si hay envío (solo si tiene destino fuera de Rosario)
        const localidadLower = (orderData.localidad || '').toLowerCase().trim();
        const esLocalSinEnvio = localidadesSinEnvio.some(loc => localidadLower.includes(loc) || loc.includes(localidadLower));
        const tieneDestinoFuera = (orderData.localidad || orderData.provincia) && !esLocalSinEnvio;
        const costoEnvio = tieneDestinoFuera ? COSTO_ENVIO : 0;
        const subtotalProductos = orderData.total || 0;
        const totalConEnvio = subtotalProductos + costoEnvio;
        
        const pedido = {
            clienteId,
            items: [{
                producto: productoNombre,
                material: orderData.material || 'ecocuero',
                cantidad: orderData.cantidad || 1,
                medidas: orderData.medidas || '4x2cm',
                color: orderData.color || 'Beige',
                logo: orderData.logoImage || null, // Base64 image of the logo
                precioUnitario,
                subtotal: subtotalProductos,
            }],
            subtotal: subtotalProductos,
            costoEnvio: costoEnvio,
            total: totalConEnvio,
            logoImage: orderData.logoImage || null, // Store at order level too for backup
            notas: orderData.notas || (orderData.logo ? `Logo: ${orderData.logo}` : ''),
            localidad: orderData.localidad || null,
            provincia: orderData.provincia || null,
            estado: ESTADOS_PEDIDO.CONFIRMADO,
            fechaEntregaEstimada: fechaEntrega.fechaEstimada.toISOString(),
        };
        
        try {
            const nuevoPedido = await savePedidoAsync(pedido);
            
            // Actualizar pedidos recientes
            const pedidos = await getPedidosAsync();
            setRecentOrders(pedidos.slice(-5).reverse());
            
            return {
                pedido: nuevoPedido,
                numeroPedido: nuevoPedido?.numero || pedidos.length,
                clienteNombre: orderData.clienteNombre,
                clienteExistente: !!clienteExistente,
                productoNombre,
                fechaEntrega: fechaEntrega.fechaEstimada,
                tieneEnvio: tieneDestinoFuera,
                esLocal: esLocalSinEnvio,
                costoEnvio,
                subtotalProductos,
                totalConEnvio,
            };
        } catch (error) {
            console.error('Error saving order:', error);
            throw error;
        }
    }

    // ============================================
    // HANDLE SEND
    // ============================================
    
    async function handleSend() {
        if (!inputText.trim() && !uploadedImage) return;

        const imageToProcess = uploadedImage;
        const textToProcess = inputText.trim();
        const logoImageForOrder = pendingLogoImage;

        // Add user message
        const userMessage = {
            type: 'user',
            content: textToProcess || '📸 Analizando imagen...',
            image: imageToProcess,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsProcessing(true);
        setInputText('');
        setUploadedImage(null);

        // Check if text is an order command WITH an image (logo mode)
        const isOrderWithImage = textToProcess && logoImageForOrder && parseOrderCommand(textToProcess);
        const logoNameForOrder = pendingLogoName; // Store before clearing
        
        if (isOrderWithImage) {
            // Process as order with logo image and detected name
            await processTextCommand(textToProcess, logoImageForOrder, logoNameForOrder);
            setPendingLogoImage(null);
            setPendingLogoName(null);
        } else if (imageToProcess && !textToProcess) {
            // Only image, no text - OCR analysis mode
            try {
                toast.loading('🔍 Analizando imagen...', { id: 'ocr' });
                const result = await analyzeImage(imageToProcess);
                toast.dismiss('ocr');

                if (result.success) {
                    toast.success(`✅ Analizado (${result.confidence.toFixed(0)}% confianza)`);

                    const assistantMessage = {
                        type: 'assistant',
                        content: result.reasoning,
                        responses: result.responses,
                        extractedText: result.extractedText,
                        showExtractedText: true,
                        timestamp: new Date(),
                    };

                    setMessages(prev => [...prev, assistantMessage]);
                } else {
                    addAssistantMessage('❌ No pude leer la imagen. Probá con una captura más nítida.');
                }
            } catch (error) {
                toast.dismiss('ocr');
                toast.error('Error al procesar imagen');
                console.error('OCR Error:', error);
            }
        } else if (textToProcess) {
            // Text command (with or without pending logo)
            await processTextCommand(textToProcess, logoImageForOrder, logoNameForOrder);
            if (logoImageForOrder) {
                setPendingLogoImage(null);
                setPendingLogoName(null);
            }
        }

        setIsProcessing(false);
        inputRef.current?.focus();
    }

    async function processTextCommand(text, logoImage = null, detectedLogoName = null) {
        // Check if it's an order command
        const orderData = parseOrderCommand(text);
        
        if (orderData && orderData.clienteNombre) {
            // Attach logo image if provided
            if (logoImage) {
                orderData.logoImage = logoImage;
            }
            
            // Si detectamos nombre por OCR, usarlo como nombre del logo
            if (detectedLogoName && !orderData.logo) {
                orderData.logo = detectedLogoName;
            }
            
            // Si hay imagen pero no hay nombre, indicarlo
            if (logoImage && !orderData.logo) {
                orderData.logo = 'Imagen adjuntada';
            }
            
            const validation = validateOrder(orderData);
            
            if (validation.isValid) {
                try {
                    // Crear pedido automáticamente
                    const result = await createOrderAutomatically(orderData);
                    
                    const warnings = validation.warnings.length > 0 
                        ? `\n\n⚠️ *Notas:*\n${validation.warnings.map(w => `• ${w}`).join('\n')}`
                        : '';
                    
                    // Nombre del logo entre paréntesis - usar nombre detectado o el del texto
                    const logoNombre = orderData.logo || (logoImage ? 'Imagen adjuntada' : null);
                    const clienteConLogo = logoNombre 
                        ? `${orderData.clienteNombre} (${logoNombre})`
                        : orderData.clienteNombre;
                    
                    // Construir línea de precio con desglose si hay envío
                    let lineaPrecio;
                    if (result.tieneEnvio) {
                        lineaPrecio = `💰 Subtotal: ${formatPrecio(result.subtotalProductos)}${orderData.precioCalculado ? ' (calculado)' : ''}\n🚚 Envío: ${formatPrecio(result.costoEnvio)}\n💵 **Total: ${formatPrecio(result.totalConEnvio)}**`;
                    } else {
                        lineaPrecio = `💰 Total: ${orderData.total ? formatPrecio(orderData.total) : 'Por definir'}${orderData.precioCalculado ? ' (calculado)' : ''}`;
                    }
                    
                    const detalles = [
                        `👤 Cliente: **${clienteConLogo}**${result.clienteExistente ? ' - existente' : ' - nuevo'}`,
                        `📦 ${orderData.cantidad}x ${result.productoNombre}`,
                        orderData.medidas ? `📐 Medidas: ${orderData.medidas}` : null,
                        orderData.color ? `🎨 Color: ${orderData.color}` : null,
                        logoImage ? `🖼️ Logo: **${orderData.logo || 'Imagen adjuntada'}** ✅` : (orderData.logo ? `🖼️ Logo: ${orderData.logo}` : null),
                        (orderData.localidad || orderData.provincia) ? `📍 Envío a: ${[orderData.localidad, orderData.provincia].filter(Boolean).join(', ')}` : null,
                        lineaPrecio,
                        `📅 Entrega: ${formatearFechaConDia(result.fechaEntrega)}`,
                    ].filter(Boolean).join('\n');
                    
                    // Total para el mensaje al cliente (con envío si corresponde)
                    const totalParaMensaje = result.tieneEnvio ? result.totalConEnvio : orderData.total;
                    
                    const confirmMessage = {
                        type: 'assistant',
                        content: `✅ **¡PEDIDO #${result.numeroPedido} CREADO!**\n\n${detalles}${warnings}`,
                        isOrderCreated: true,
                        orderData: orderData,
                        logoImage: logoImage, // Include for display
                        pedidoNumero: result.numeroPedido,
                        responses: [{
                            title: '📋 Mensaje de confirmación para el cliente',
                            content: TEMPLATES.confirmarPedido
                                .replace('{DETALLE}', `${orderData.cantidad}x ${result.productoNombre}\n   📐 ${orderData.medidas || '4x2cm'} - ${orderData.color || 'Beige'}${orderData.logo ? `\n   🖼️ Logo: ${orderData.logo}` : ''}${result.tieneEnvio ? `\n   🚚 Envío a ${[orderData.localidad, orderData.provincia].filter(Boolean).join(', ')}: ${formatPrecio(result.costoEnvio)}` : ''}`)
                                .replace('{TOTAL}', totalParaMensaje ? formatPrecio(totalParaMensaje) : '[Por definir]')
                                .replace('{FECHA}', formatearFechaConDia(result.fechaEntrega))
                                .replace('{SENA}', totalParaMensaje ? formatPrecio(Math.round(totalParaMensaje / 2)) : '[50%]'),
                        }],
                        timestamp: new Date(),
                    };
                    
                    setMessages(prev => [...prev, confirmMessage]);
                    toast.success(`🎉 Pedido #${result.numeroPedido} creado para ${clienteConLogo}`);
                } catch (error) {
                    console.error('Error creating order:', error);
                    toast.error('Error al crear el pedido');
                    addAssistantMessage('❌ **Error al guardar el pedido.** Por favor intentá de nuevo.');
                }
                
            } else {
                // Mostrar errores
                addAssistantMessage(
                    `⚠️ **No pude crear el pedido:**\n\n${validation.errors.map(e => `❌ ${e}`).join('\n')}\n\n**Ejemplo de comando:**\n\`Pedido confirmado, cliente "Juan Pérez", 100 etiquetas 5x2 beige, logo Moor\``
                );
            }
        } else {
            // Normal response
            generateSmartResponse(text);
        }
    }

    function generateSmartResponse(text) {
        const lowerText = text.toLowerCase();
        
        // Detect intent
        if (/hola|buenas|buen\s*d[ií]a|buenos/.test(lowerText)) {
            addAssistantResponse('saludo');
        } else if (/precio|cuanto|cuánto|sale|cuesta|lista/.test(lowerText)) {
            addAssistantResponse('precios');
        } else if (/etiqueta/.test(lowerText)) {
            addAssistantResponse('etiquetas');
        } else if (/llavero/.test(lowerText)) {
            addAssistantResponse('llaveros');
        } else if (/env[ií]o|direcci[oó]n|datos|correo/.test(lowerText)) {
            addAssistantResponse('envio');
        } else if (/pago|pagar|se[ñn]a|transferencia|mercado/.test(lowerText)) {
            addAssistantResponse('pago');
        } else if (/tiempo|cu[aá]ndo|demora|d[ií]as|entrega|fecha/.test(lowerText)) {
            addAssistantResponse('tiempos');
        } else if (/gracias|genial|perfecto|excelente/.test(lowerText)) {
            addAssistantResponse('agradecimiento');
        } else {
            // Default: show options
            addAssistantMessage(
                `No estoy seguro qué necesitás. 🤔\n\n**Opciones rápidas:**`,
                [
                    { title: '💰 Ver precios', content: TEMPLATES.precios },
                    { title: '📦 Pedir datos de envío', content: TEMPLATES.envio },
                    { title: '💳 Info de pago', content: TEMPLATES.pago },
                ]
            );
        }
    }

    function addAssistantMessage(content, responses = null) {
        const message = {
            type: 'assistant',
            content,
            responses,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, message]);
    }

    function addAssistantResponse(templateKey) {
        const content = TEMPLATES[templateKey];
        if (content) {
            addAssistantMessage(`Acá tenés la respuesta para copiar:`, [
                { title: getTemplateTitle(templateKey), content }
            ]);
        }
    }

    function getTemplateTitle(key) {
        const titles = {
            precios: '💰 Lista de precios',
            envio: '📦 Datos de envío',
            pago: '💳 Formas de pago',
            tiempos: '⏱️ Tiempos de entrega',
            etiquetas: '🏷️ Info Etiquetas',
            llaveros: '🔑 Info Llaveros',
            confirmarPedido: '✅ Confirmación',
            agradecimiento: '🙏 Agradecimiento',
            saludo: '👋 Saludo',
        };
        return titles[key] || '💬 Respuesta';
    }

    function handleQuickResponse(templateKey) {
        addAssistantResponse(templateKey);
        toast.success(`${getTemplateTitle(templateKey)} generada`);
    }

    function copyToClipboard(text, index) {
        const plainText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '');
        navigator.clipboard.writeText(plainText);
        setCopiedIndex(index);
        toast.success('📋 ¡Copiado!');
        setTimeout(() => setCopiedIndex(null), 2000);
    }

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const imageData = reader.result;
                setUploadedImage(imageData);
                setPendingLogoImage(imageData);
                setPendingLogoName(null);
                
                // Analizar logo con OCR
                setIsAnalyzingLogo(true);
                toast.loading('🔍 Analizando logo...', { id: 'logo-analysis' });
                
                try {
                    const logoAnalysis = await analyzeLogoText(imageData);
                    
                    if (logoAnalysis.success && logoAnalysis.text) {
                        setPendingLogoName(logoAnalysis.text);
                        toast.success(
                            `🖼️ Logo detectado: "${logoAnalysis.text}"`,
                            { id: 'logo-analysis' }
                        );
                    } else {
                        toast.success('🖼️ Logo listo - Escribí el pedido', { id: 'logo-analysis' });
                    }
                } catch (err) {
                    console.error('Error analizando logo:', err);
                    toast.success('🖼️ Logo listo - Escribí el pedido', { id: 'logo-analysis' });
                } finally {
                    setIsAnalyzingLogo(false);
                }
            };
            reader.readAsDataURL(file);
        }
    }

    return (
        <div className="asistente-page">
            {/* Header */}
            <div className="page-header">
                <div className="page-title">
                    <div className="icon"><Sparkles size={24} /></div>
                    <div>
                        <h1>Asistente IA</h1>
                        <p className="text-muted">Respuestas y pedidos automáticos</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button 
                        className={`btn ${showPrices ? 'btn-primary' : 'btn-secondary'}`} 
                        onClick={() => setShowPrices(!showPrices)}
                    >
                        <DollarSign size={18} />
                        <span className="btn-label">Precios</span>
                    </button>
                </div>
            </div>

            <div className="asistente-layout">
                {/* Price Sidebar */}
                {showPrices && (
                    <div className="price-sidebar">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title"><Tag size={18} /> Precios</h3>
                            </div>
                            <div className="price-list">
                                {Object.entries(LISTA_PRECIOS).map(([key, cat]) => (
                                    <div key={key} className="price-category">
                                        <button 
                                            className="price-category-header" 
                                            onClick={() => toggleCategory(key)}
                                        >
                                            <span>{cat.nombre}</span>
                                            {expandedCategories[key] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                        {expandedCategories[key] && (
                                            <div className="price-items">
                                                {cat.precios.map((p, i) => (
                                                    <div key={i} className="price-row">
                                                        <span>{p.cantidad}u</span>
                                                        <span className="price-value">
                                                            {formatPrecio(p.precio)}
                                                            {p.envioGratis && ' ✨'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Recent Orders */}
                        {recentOrders.length > 0 && (
                            <div className="card mt-md">
                                <div className="card-header">
                                    <h3 className="card-title"><Package size={18} /> Últimos pedidos</h3>
                                </div>
                                <div className="recent-orders">
                                    {recentOrders.map((pedido, i) => {
                                        const cliente = clientes.find(c => c.id === pedido.clienteId);
                                        return (
                                            <div key={i} className="recent-order-item">
                                                <span className="order-number">#{pedido.numero}</span>
                                                <span className="order-client">{cliente?.nombre || 'Sin nombre'}</span>
                                                <span className="order-total">${pedido.total?.toLocaleString()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Chat Container */}
                <div className="chat-container">
                    {/* Messages */}
                    <div className="chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.type}`}>
                                {msg.type === 'user' ? (
                                    <div className="message-content user-message">
                                        {msg.image && (
                                            <div className="message-image">
                                                <img src={msg.image} alt="Captura" />
                                            </div>
                                        )}
                                        {msg.content && <p>{msg.content}</p>}
                                    </div>
                                ) : (
                                    <div className={`message-content assistant-message ${msg.isOrderCreated ? 'order-created' : ''}`}>
                                        <div className="assistant-header">
                                            {msg.isOrderCreated ? (
                                                <><CheckCircle size={16} /> Pedido Creado</>
                                            ) : (
                                                <><Sparkles size={16} /> Asistente</>
                                            )}
                                        </div>
                                        <div className="assistant-text">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>

                                        {/* Logo image for created orders */}
                                        {msg.isOrderCreated && msg.logoImage && (
                                            <div className="order-logo-preview">
                                                <div className="logo-label">🖼️ Logo adjuntado:</div>
                                                <img src={msg.logoImage} alt="Logo del pedido" />
                                            </div>
                                        )}

                                        {msg.showExtractedText && msg.extractedText && (
                                            <details className="extracted-text-section">
                                                <summary>📄 Ver texto extraído</summary>
                                                <pre>{msg.extractedText}</pre>
                                            </details>
                                        )}

                                        {msg.responses && (
                                            <div className="response-options">
                                                {msg.responses.map((resp, respIdx) => (
                                                    <div key={respIdx} className="response-option">
                                                        <div className="response-header">
                                                            <span className="response-title">{resp.title}</span>
                                                            <button
                                                                className={`btn btn-sm ${copiedIndex === `${idx}-${respIdx}` ? 'btn-success' : 'btn-primary'}`}
                                                                onClick={() => copyToClipboard(resp.content, `${idx}-${respIdx}`)}
                                                            >
                                                                {copiedIndex === `${idx}-${respIdx}` ? (
                                                                    <><Check size={14} /> Listo</>
                                                                ) : (
                                                                    <><Copy size={14} /> Copiar</>
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="response-content">
                                                            <ReactMarkdown>{resp.content}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isProcessing && (
                            <div className="message assistant">
                                <div className="message-content assistant-message">
                                    <div className="thinking-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Responses */}
                    <div className="quick-responses">
                        {QUICK_RESPONSES.map(qr => (
                            <button
                                key={qr.id}
                                className="quick-btn"
                                onClick={() => handleQuickResponse(qr.id)}
                                title={`Alt+${qr.shortcut}`}
                            >
                                <span className="quick-icon">{qr.icon}</span>
                                <span className="quick-label">{qr.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Image Preview */}
                    {uploadedImage && (
                        <div className="image-preview">
                            <div className="image-preview-badge">
                                {isAnalyzingLogo ? (
                                    <span>🔍 Analizando...</span>
                                ) : pendingLogoName ? (
                                    <span>🖼️ Logo: <strong>{pendingLogoName}</strong></span>
                                ) : (
                                    <span>🖼️ Logo listo</span>
                                )}
                            </div>
                            <img src={uploadedImage} alt="Preview" />
                            <button className="remove-image" onClick={() => {
                                setUploadedImage(null);
                                setPendingLogoImage(null);
                                setPendingLogoName(null);
                            }}>
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="chat-input-area">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                        <button 
                            className="btn btn-ghost btn-icon" 
                            onClick={() => fileInputRef.current?.click()}
                            title="Subir imagen"
                        >
                            <Image size={20} />
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            className="chat-input"
                            placeholder='Ej: Pedido confirmado, cliente "Juan", 100 etiquetas 5x2 beige...'
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            className="btn btn-primary btn-icon"
                            onClick={handleSend}
                            disabled={!inputText.trim() && !uploadedImage}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        .asistente-page {
          height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
        }
        
        .asistente-page .page-header {
          flex-shrink: 0;
          margin-bottom: 1rem;
        }
        
        .header-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .asistente-layout {
          flex: 1;
          display: flex;
          gap: 1rem;
          min-height: 0;
        }
        
        /* Price Sidebar */
        .price-sidebar {
          width: 280px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
        }
        
        .price-sidebar .card {
          flex-shrink: 0;
        }
        
        .price-list {
          padding: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .price-category {
          margin-bottom: 0.25rem;
        }
        
        .price-category-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .price-category-header:hover {
          background: var(--accent-glow);
          color: var(--accent);
        }
        
        .price-items {
          padding: 0.5rem;
          background: var(--bg-secondary);
          border-radius: 0 0 var(--radius-sm) var(--radius-sm);
          margin-top: -2px;
        }
        
        .price-row {
          display: flex;
          justify-content: space-between;
          padding: 0.25rem 0;
          font-size: 0.7rem;
        }
        
        .price-value {
          font-weight: 600;
          color: var(--accent);
        }
        
        /* Recent Orders */
        .recent-orders {
          padding: 0.5rem;
        }
        
        .recent-order-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
        }
        
        .order-number {
          font-weight: 700;
          color: var(--accent);
        }
        
        .order-client {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .order-total {
          font-weight: 600;
        }
        
        /* Chat Container */
        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
          min-width: 0;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .message {
          display: flex;
        }
        
        .message.user {
          justify-content: flex-end;
        }
        
        .message-content {
          max-width: 85%;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-lg);
        }
        
        .user-message {
          background: var(--accent);
          border-bottom-right-radius: 4px;
          color: white;
        }
        
        .user-message p {
          color: white;
          margin: 0;
        }
        
        .user-message .message-image img {
          max-width: 200px;
          border-radius: var(--radius-md);
          margin-bottom: 0.5rem;
        }
        
        .assistant-message {
          background: var(--bg-tertiary);
          border-bottom-left-radius: 4px;
        }
        
        .assistant-message.order-created {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        .assistant-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--accent);
          margin-bottom: 0.5rem;
        }
        
        .order-created .assistant-header {
          color: var(--success);
        }
        
        .assistant-text {
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .assistant-text p {
          margin: 0 0 0.5rem 0;
        }
        
        .assistant-text p:last-child {
          margin-bottom: 0;
        }
        
        .assistant-text strong {
          color: var(--text-primary);
        }
        
        .assistant-text code {
          background: var(--bg-secondary);
          padding: 0.2rem 0.4rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          color: var(--accent);
        }
        
        /* Order Logo Preview */
        .order-logo-preview {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        .order-logo-preview .logo-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--success);
          margin-bottom: 0.5rem;
        }
        
        .order-logo-preview img {
          max-width: 150px;
          max-height: 100px;
          border-radius: var(--radius-sm);
          object-fit: contain;
          background: white;
          padding: 4px;
        }
        
        /* Extracted Text */
        .extracted-text-section {
          margin-top: 0.75rem;
          font-size: 0.75rem;
        }
        
        .extracted-text-section summary {
          cursor: pointer;
          color: var(--text-muted);
          padding: 0.25rem 0;
        }
        
        .extracted-text-section summary:hover {
          color: var(--accent);
        }
        
        .extracted-text-section pre {
          background: var(--bg-secondary);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          color: var(--text-muted);
          max-height: 100px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-word;
          margin-top: 0.5rem;
        }
        
        /* Response Options */
        .response-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        
        .response-option {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        
        .response-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-color);
        }
        
        .response-title {
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .response-content {
          padding: 0.75rem;
          font-size: 0.8rem;
          line-height: 1.5;
          white-space: pre-wrap;
          color: var(--text-secondary);
        }
        
        .response-content p {
          margin: 0 0 0.5rem 0;
        }
        
        .response-content p:last-child {
          margin-bottom: 0;
        }
        
        .response-content strong {
          color: var(--text-primary);
        }
        
        /* Thinking Indicator */
        .thinking-indicator {
          display: flex;
          gap: 4px;
          padding: 0.5rem;
        }
        
        .thinking-indicator span {
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .thinking-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .thinking-indicator span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        
        /* Quick Responses */
        .quick-responses {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        .quick-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .quick-btn:hover {
          background: var(--accent-glow);
          border-color: var(--accent);
          color: var(--accent);
        }
        
        .quick-icon {
          font-size: 1rem;
        }
        
        /* Image Preview */
        .image-preview {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
          border-top: 1px solid rgba(34, 197, 94, 0.3);
          position: relative;
        }
        
        .image-preview-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: var(--success);
          color: white;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 600;
        }
        
        .image-preview img {
          max-height: 60px;
          border-radius: var(--radius-md);
          border: 2px solid rgba(34, 197, 94, 0.5);
        }
        
        .remove-image {
          position: absolute;
          top: 0.25rem;
          right: 0.5rem;
          width: 24px;
          height: 24px;
          background: var(--danger);
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        
        /* Input Area */
        .chat-input-area {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
        }
        
        .chat-input {
          flex: 1;
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        
        .chat-input:focus {
          outline: none;
          border-color: var(--accent);
        }
        
        .chat-input::placeholder {
          color: var(--text-muted);
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .asistente-page {
            height: calc(100vh - 80px);
            padding: 0.5rem;
          }
          
          .asistente-page .page-header {
            margin-bottom: 0.5rem;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .asistente-page .page-header .page-title h1 {
            font-size: 1.1rem;
          }
          
          .btn-label {
            display: none;
          }
          
          .asistente-layout {
            flex-direction: column;
          }
          
          .price-sidebar {
            display: none;
          }
          
          .chat-container {
            flex: 1;
          }
          
          .chat-messages {
            padding: 0.75rem;
          }
          
          .message-content {
            max-width: 90%;
            padding: 0.625rem 0.875rem;
          }
          
          .user-message .message-image img {
            max-width: 150px;
          }
          
          .assistant-text {
            font-size: 0.85rem;
          }
          
          .response-options {
            gap: 0.4rem;
          }
          
          .response-header {
            padding: 0.5rem;
          }
          
          .response-content {
            padding: 0.625rem;
            font-size: 0.8rem;
          }
          
          .quick-responses {
            padding: 0.5rem;
            gap: 0.4rem;
          }
          
          .quick-btn {
            padding: 0.5rem 0.625rem;
            font-size: 0.75rem;
          }
          
          .quick-label {
            display: none;
          }
          
          .quick-icon {
            font-size: 1.1rem;
          }
          
          .chat-input-area {
            padding: 0.5rem;
          }
          
          .chat-input {
            padding: 0.875rem 1rem;
            font-size: 16px; /* Prevent iOS zoom */
          }
          
          .btn-icon {
            min-width: 44px;
            min-height: 44px;
          }
        }
        
        @media (max-width: 400px) {
          .message-content {
            max-width: 95%;
          }
          
          .quick-btn {
            padding: 0.4rem 0.5rem;
          }
        }
      `}</style>
        </div>
    );
}
