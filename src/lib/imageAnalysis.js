import Tesseract from 'tesseract.js';
import { LISTA_PRECIOS, formatPrecio, generarListaResumida } from './precios';

// Número de WhatsApp del negocio
const WHATSAPP_NEGOCIO = '3412278217';

// Memoria de conversación por cliente
const conversationMemory = new Map();

// Palabras clave para detectar intención
const INTENT_PATTERNS = {
    preguntaPrecio: /cuanto|cuánto|precio|sale|cuesta|costos?|valor|cotiza|presupuesto/i,
    preguntaEntrega: /cuando|cuándo|tiempo|demora|dias?|días?|entrega|tarda|plazo|fecha/i,
    preguntaCantidad: /minimo|mínimo|cantidad|mayorista|descuento|unidades/i,
    preguntaEnvio: /envio|envío|envian|envían|mandan|correo|shipping|zona/i,
    preguntaMaterial: /material|eco\s?cuero|acr[ií]lico|cuero|mdf|madera|tipo/i,
    preguntaMedidas: /medida|tamaño|dimension|ancho|alto|cm|centimetro/i,
    preguntaColor: /color|colores|beige|suela|negro|blanco/i,
    preguntaDiseño: /logo|diseño|imagen|archivo|formato|vector/i,
    preguntaPago: /pago|pagar|transferencia|mercado\s?pago|efectivo|seña|abonar/i,
    confirmacion: /quiero|confirmo|acepto|dale|listo|ok|perfecto|si\b|sí\b/i,
    saludo: /hola|buenas?|hey|hi\b/i,
    despedida: /chau|adios|adiós|gracias|bye/i,
    negociacion: /desc|rebaja|baja|menos|oferta|promo/i,
};

// Analizar texto extraído de la imagen
function analyzeExtractedText(text, memory) {
    const analysis = {
        clientMessages: [],
        detectedIntents: [],
        clientName: null,
        phoneNumber: null,
        requestedProduct: null,
        requestedQuantity: null,
        requestedMaterial: null,
        sentiment: 'neutral',
        urgency: 'normal',
        conversationStage: 'initial',
    };

    // Limpiar y separar líneas
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);

    // Detectar mensajes del cliente (generalmente los más largos o con signos de pregunta)
    for (const line of lines) {
        if (line.includes('?') || line.length > 20) {
            analysis.clientMessages.push(line);
        }
    }

    // Detectar intenciones
    const fullText = text.toLowerCase();
    for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
        if (pattern.test(fullText)) {
            analysis.detectedIntents.push(intent);
        }
    }

    // Detectar nombre del cliente
    const nameMatch = text.match(/(?:soy|me llamo|mi nombre es)\s+([A-Za-záéíóúñÁÉÍÓÚÑ]+)/i);
    if (nameMatch) {
        analysis.clientName = nameMatch[1];
    }

    // Detectar teléfono
    const phoneMatch = text.match(/(\d{10,13})/);
    if (phoneMatch) {
        analysis.phoneNumber = phoneMatch[1];
    }

    // Detectar producto
    if (/etiqueta/i.test(fullText)) {
        analysis.requestedProduct = 'etiquetas';
    } else if (/llavero/i.test(fullText)) {
        analysis.requestedProduct = 'llaveros';
    }

    // Detectar cantidad
    const qtyMatch = text.match(/(\d+)\s*(?:unidades?|etiquetas?|llaveros?|u\b)/i);
    if (qtyMatch) {
        analysis.requestedQuantity = parseInt(qtyMatch[1]);
    }

    // Detectar material
    if (/eco\s?cuero|ecocuero|sint[eé]tico/i.test(fullText)) {
        analysis.requestedMaterial = 'ecocuero';
    } else if (/acr[ií]lico/i.test(fullText)) {
        analysis.requestedMaterial = 'acrilico';
    } else if (/cuero\s?genuino|cuero\s?real/i.test(fullText)) {
        analysis.requestedMaterial = 'cuero';
    }

    // Detectar sentimiento
    if (/urgente|apurad|necesito ya|rapido|rápido/i.test(fullText)) {
        analysis.urgency = 'high';
        analysis.sentiment = 'urgent';
    } else if (/gracias|excelente|perfecto|genial/i.test(fullText)) {
        analysis.sentiment = 'positive';
    } else if (/caro|mucho|no puedo|imposible/i.test(fullText)) {
        analysis.sentiment = 'hesitant';
    }

    // Determinar etapa de conversación
    if (analysis.detectedIntents.includes('confirmacion')) {
        analysis.conversationStage = 'closing';
    } else if (analysis.detectedIntents.includes('preguntaPago')) {
        analysis.conversationStage = 'payment';
    } else if (analysis.requestedQuantity && analysis.requestedProduct) {
        analysis.conversationStage = 'negotiation';
    } else if (analysis.detectedIntents.includes('preguntaPrecio')) {
        analysis.conversationStage = 'inquiry';
    } else if (analysis.detectedIntents.includes('saludo')) {
        analysis.conversationStage = 'initial';
    }

    return analysis;
}

// Generar respuestas inteligentes basadas en el análisis
function generateIntelligentResponses(analysis, memory) {
    const responses = [];
    const listaResumida = generarListaResumida();

    // Agregar contexto de memoria si existe
    const memoryContext = memory.previousInteractions || [];

    // Respuestas basadas en la etapa de conversación
    switch (analysis.conversationStage) {
        case 'initial':
            responses.push({
                title: '👋 Saludo + Oferta',
                content: `¡Hola! 👋 Gracias por escribirnos.\n\nSomos **Grabados Express**, especialistas en etiquetas y llaveros personalizados con grabado láser.\n\n¿Qué estás buscando? Te paso los precios 💰`,
                reasoning: 'El cliente parece estar iniciando la conversación. Un saludo amigable + pregunta abre la puerta a conocer sus necesidades.',
            });
            break;

        case 'inquiry':
            responses.push({
                title: '💰 Lista de Precios Completa',
                content: `¡Con gusto! Acá van nuestros precios:\n\n${listaResumida}\n\n⏱️ **Entrega:** 7-10 días hábiles\n📦 **Envío gratis** desde 200 etiquetas eco cuero\n\n¿Cuántas necesitás?`,
                reasoning: 'El cliente pregunta precios. Dar la lista completa + preguntar cantidad ayuda a avanzar hacia una venta.',
            });
            break;

        case 'negotiation':
            const qty = analysis.requestedQuantity || 100;
            const product = analysis.requestedProduct || 'etiquetas';
            const material = analysis.requestedMaterial || 'ecocuero';

            // Buscar precio más cercano
            let priceInfo = '';
            if (product === 'etiquetas' && material === 'ecocuero') {
                const prices = LISTA_PRECIOS.etiquetasEcoCuero.precios;
                const match = prices.find(p => p.cantidad >= qty) || prices[prices.length - 1];
                priceInfo = `${match.cantidad} etiquetas eco cuero = **${formatPrecio(match.precio)}**${match.envioGratis ? ' (envío gratis)' : ''}`;
            }

            responses.push({
                title: '💬 Respuesta con Precio Específico',
                content: `¡Perfecto! Para ${qty} ${product}:\n\n${priceInfo}\n\n📐 Medidas disponibles: 4x2cm, 5x2.5cm o redondas\n🎨 Colores: Beige o Suela\n\n¿Con cuál seguimos?`,
                reasoning: `El cliente mencionó ${qty} ${product}. Dar precio específico + opciones facilita la decisión.`,
            });
            break;

        case 'payment':
            responses.push({
                title: '💳 Instrucciones de Pago',
                content: `¡Genial! Para iniciar necesito:\n\n1️⃣ **Seña del 50%** por transferencia o Mercado Pago\n2️⃣ Tu logo en PNG o PDF\n3️⃣ Datos de envío completos\n\n📱 Escribime directo para coordinar: wa.me/${WHATSAPP_NEGOCIO}\n\nUna vez recibido, arrancamos la producción ✨`,
                reasoning: 'El cliente pregunta por pago. Es momento de cerrar la venta con instrucciones claras.',
            });
            break;

        case 'closing':
            responses.push({
                title: '✅ Confirmación de Pedido',
                content: `¡Excelente! 🎉 Confirmamos tu pedido.\n\nPara avanzar necesito:\n✅ Logo/diseño final\n✅ Cantidad y medidas confirmadas\n✅ Seña del 50%\n✅ Datos de envío\n\n📱 WhatsApp: wa.me/${WHATSAPP_NEGOCIO}\n\n¡Gracias por confiar en nosotros!`,
                reasoning: 'El cliente confirmó. Pedir todos los datos necesarios para cerrar.',
            });
            break;
    }

    // Agregar respuestas según intenciones detectadas
    if (analysis.detectedIntents.includes('preguntaEnvio')) {
        responses.push({
            title: '📦 Información de Envío',
            content: `📦 **ENVÍO**\n\nEnviamos por **Correo Argentino** a todo el país.\n\n• Eco Cuero 200+ unidades: **ENVÍO GRATIS** ✨\n• Acrílico y Cuero Genuino: Envío incluido\n• Otras cantidades: Se calcula según tu zona\n\nPasame tu localidad y provincia para calcular 🚚`,
            reasoning: 'El cliente pregunta por envío. Dar info clara + pedir ubicación.',
        });
    }

    if (analysis.detectedIntents.includes('preguntaEntrega')) {
        responses.push({
            title: '⏱️ Tiempos de Entrega',
            content: `⏱️ **TIEMPOS**\n\nProducción: **7-10 días hábiles** desde que confirmás\n\n¿Tenés alguna fecha límite? Contame y veo cómo ayudarte 📅`,
            reasoning: 'El cliente quiere saber tiempos. Ser transparente + ofrecer flexibilidad.',
        });
    }

    if (analysis.detectedIntents.includes('preguntaDiseño')) {
        responses.push({
            title: '🎨 Sobre el Diseño',
            content: `🎨 **DISEÑO**\n\n• Formato ideal: **PNG en alta calidad** o **PDF vectorial**\n• Si no tenés logo, te ayudamos a armarlo\n• El grabado es con láser, queda super prolijo\n\nMandame tu logo cuando quieras 📎`,
            reasoning: 'El cliente pregunta por diseño. Aclarar formatos y ofrecer ayuda.',
        });
    }

    if (analysis.detectedIntents.includes('negociacion') && analysis.sentiment === 'hesitant') {
        responses.push({
            title: '💡 Manejando Objeciones',
            content: `Entiendo 💬 Te cuento que a mayor cantidad, mejor precio por unidad.\n\nPor ejemplo:\n• 100 etiquetas: $194 c/u\n• 200 etiquetas: $129 c/u **(33% OFF + envío gratis)** 🔥\n• 500 etiquetas: $99 c/u\n\n¿Qué cantidad te sirve más?`,
            reasoning: 'El cliente parece dudar del precio. Mostrar el beneficio de comprar más.',
        });
    }

    // Si no hay respuestas específicas, dar opciones generales
    if (responses.length === 0) {
        responses.push({
            title: '💰 Lista de Precios',
            content: `Acá tenés nuestros precios:\n\n${listaResumida}\n\n¿En qué te puedo ayudar?`,
            reasoning: 'No se detectó una intención clara. Ofrecer la lista de precios es un buen punto de partida.',
        });
    }

    // Siempre agregar opción de pedir datos de envío
    if (!analysis.detectedIntents.includes('preguntaEnvio') && analysis.conversationStage !== 'initial') {
        responses.push({
            title: '📦 Solicitar Datos de Envío',
            content: `📦 Para el envío necesito:\n\n✅ Nombre completo\n✅ DNI\n✅ Calle y número\n✅ Localidad y Provincia\n✅ Código Postal\n✅ Teléfono\n\nPasame estos datos y te confirmo el costo 🚚`,
            reasoning: 'Útil si están avanzados en la conversación y necesitás los datos.',
        });
    }

    return responses;
}

// Función principal: analizar imagen con OCR
export async function analyzeImage(imageData, clientId = 'default') {
    const startTime = Date.now();

    // Obtener o crear memoria para este cliente
    if (!conversationMemory.has(clientId)) {
        conversationMemory.set(clientId, {
            previousInteractions: [],
            lastProducts: [],
            clientInfo: {},
        });
    }
    const memory = conversationMemory.get(clientId);

    try {
        // Ejecutar OCR con Tesseract
        const result = await Tesseract.recognize(imageData, 'spa', {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    // Progress callback
                }
            },
        });

        const extractedText = result.data.text;
        const confidence = result.data.confidence;

        // Analizar el texto extraído
        const analysis = analyzeExtractedText(extractedText, memory);

        // Generar respuestas inteligentes
        const responses = generateIntelligentResponses(analysis, memory);

        // Guardar en memoria
        memory.previousInteractions.push({
            timestamp: new Date().toISOString(),
            extractedText: extractedText.substring(0, 500),
            intents: analysis.detectedIntents,
            stage: analysis.conversationStage,
        });

        // Actualizar info del cliente si se detectó
        if (analysis.clientName) memory.clientInfo.name = analysis.clientName;
        if (analysis.phoneNumber) memory.clientInfo.phone = analysis.phoneNumber;
        if (analysis.requestedProduct) memory.lastProducts.push(analysis.requestedProduct);

        const processingTime = Date.now() - startTime;

        return {
            success: true,
            extractedText,
            confidence,
            analysis,
            responses,
            reasoning: `📊 **Análisis de la conversación:**\n\n` +
                `• **Intenciones detectadas:** ${analysis.detectedIntents.join(', ') || 'ninguna específica'}\n` +
                `• **Etapa:** ${getStageLabel(analysis.conversationStage)}\n` +
                `• **Sentimiento:** ${getSentimentLabel(analysis.sentiment)}\n` +
                `• **Producto solicitado:** ${analysis.requestedProduct || 'no especificado'}\n` +
                `• **Cantidad:** ${analysis.requestedQuantity || 'no especificada'}\n` +
                `• **Confianza OCR:** ${confidence.toFixed(1)}%\n` +
                `• **Tiempo de procesamiento:** ${processingTime}ms`,
            memory: {
                totalInteractions: memory.previousInteractions.length,
                clientInfo: memory.clientInfo,
            },
            processingTime,
        };
    } catch (error) {
        console.error('Error en OCR:', error);
        return {
            success: false,
            error: error.message,
            responses: [{
                title: '⚠️ Error al procesar imagen',
                content: 'No pude leer la imagen correctamente. Probá con una captura más nítida o escribí el texto del cliente manualmente.',
                reasoning: 'Hubo un error técnico en el procesamiento.',
            }],
        };
    }
}

// Helpers para etiquetas
function getStageLabel(stage) {
    const labels = {
        initial: '🟢 Inicio de conversación',
        inquiry: '🔵 Consulta de precios',
        negotiation: '🟡 Negociación',
        payment: '🟠 Discutiendo pago',
        closing: '🟣 Cerrando venta',
    };
    return labels[stage] || stage;
}

function getSentimentLabel(sentiment) {
    const labels = {
        neutral: '😐 Neutral',
        positive: '😊 Positivo',
        hesitant: '🤔 Dudoso',
        urgent: '⚡ Urgente',
    };
    return labels[sentiment] || sentiment;
}

// Limpiar memoria de un cliente
export function clearClientMemory(clientId) {
    conversationMemory.delete(clientId);
}

// Obtener resumen de memoria
export function getMemorySummary(clientId) {
    const memory = conversationMemory.get(clientId);
    if (!memory) return null;

    return {
        interactions: memory.previousInteractions.length,
        clientInfo: memory.clientInfo,
        lastProducts: [...new Set(memory.lastProducts)],
    };
}
// ============================================
// ANÁLISIS DE LOGOS - OCR para extraer texto de marca
// ============================================

/**
 * Analiza una imagen de logo y extrae el texto (nombre de marca)
 * @param {string} imageData - Base64 de la imagen
 * @returns {Promise<{success: boolean, text: string, confidence: number}>}
 */
export async function analyzeLogoText(imageData) {
    try {
        // Ejecutar OCR con Tesseract en español e inglés
        const result = await Tesseract.recognize(imageData, 'spa+eng', {
            logger: () => {}, // Silent
        });

        const rawText = result.data.text;
        const confidence = result.data.confidence;

        // Limpiar el texto extraído
        let cleanedText = rawText
            .replace(/[\n\r]+/g, ' ')  // Reemplazar saltos de línea
            .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ&@.-]/g, '') // Quitar caracteres especiales excepto algunos comunes en marcas
            .replace(/\s+/g, ' ')  // Múltiples espacios a uno
            .trim();

        // Si el texto es muy largo, tomar las primeras palabras significativas
        const words = cleanedText.split(' ').filter(w => w.length > 1);
        
        // Priorizar palabras que parecen nombres de marca (capitalizadas, etc.)
        const brandWords = words.filter(w => 
            /^[A-ZÁÉÍÓÚÑ]/.test(w) ||  // Empieza con mayúscula
            /^[a-záéíóúñ]{3,}$/i.test(w) // Palabra de 3+ letras
        );

        // Tomar máximo las primeras 3 palabras relevantes
        const brandName = brandWords.length > 0 
            ? brandWords.slice(0, 3).join(' ')
            : words.slice(0, 3).join(' ');

        // Si la confianza es muy baja o no hay texto, devolver vacío
        if (confidence < 20 || !brandName || brandName.length < 2) {
            return {
                success: false,
                text: '',
                confidence: 0,
                reason: 'No se pudo detectar texto en el logo',
            };
        }

        return {
            success: true,
            text: capitalizeWords(brandName),
            confidence,
            rawText: rawText.substring(0, 200),
        };
    } catch (error) {
        console.error('Error analizando logo:', error);
        return {
            success: false,
            text: '',
            confidence: 0,
            reason: error.message,
        };
    }
}

// Capitalizar cada palabra
function capitalizeWords(str) {
    return str.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}