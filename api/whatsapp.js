// ============================================
// GRABADOS EXPRESS - WhatsApp Webhook
// Receives messages from Meta/WhatsApp Business API
// ============================================

import { query } from './_lib/db.js';

// Verify webhook (GET request from Meta)
async function verifyWebhook(req) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Get verify token from config
    const configResult = await query('SELECT webhook_verify_token FROM whatsapp_config WHERE id = 1');
    const verifyToken = configResult.rows[0]?.webhook_verify_token || 'grabados_express_verify_2024';

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified successfully');
        return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
}

// Process incoming webhook (POST request)
async function handleWebhook(req) {
    const body = await req.json();
    
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Validate it's from WhatsApp
    if (body.object !== 'whatsapp_business_account') {
        return new Response('Not a WhatsApp event', { status: 400 });
    }

    // Process each entry
    for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
            if (change.field === 'messages') {
                const value = change.value;
                
                // Process messages
                if (value.messages) {
                    for (const message of value.messages) {
                        await processIncomingMessage(message, value.contacts?.[0], value.metadata);
                    }
                }

                // Process status updates
                if (value.statuses) {
                    for (const status of value.statuses) {
                        await updateMessageStatus(status);
                    }
                }
            }
        }
    }

    return new Response('OK', { status: 200 });
}

// Process an incoming message
async function processIncomingMessage(message, contact, metadata) {
    const waId = message.from;
    const messageId = message.id;
    const timestamp = new Date(parseInt(message.timestamp) * 1000);
    const contactName = contact?.profile?.name || 'Usuario';
    
    // Extract message content based on type
    let tipo = message.type;
    let contenido = '';
    let mediaUrl = null;

    switch (message.type) {
        case 'text':
            contenido = message.text?.body || '';
            break;
        case 'image':
            mediaUrl = message.image?.id;
            contenido = message.image?.caption || '[Imagen]';
            tipo = 'image';
            break;
        case 'audio':
            mediaUrl = message.audio?.id;
            contenido = '[Audio]';
            tipo = 'audio';
            break;
        case 'document':
            mediaUrl = message.document?.id;
            contenido = message.document?.filename || '[Documento]';
            tipo = 'document';
            break;
        case 'button':
            contenido = message.button?.text || '';
            tipo = 'text';
            break;
        case 'interactive':
            contenido = message.interactive?.button_reply?.title || 
                       message.interactive?.list_reply?.title || '';
            tipo = 'text';
            break;
        default:
            contenido = `[${message.type}]`;
    }

    try {
        // Find or create conversation
        let convResult = await query(
            'SELECT * FROM whatsapp_conversaciones WHERE wa_id = $1',
            [waId]
        );

        let conversacionId;
        let isNewConversation = false;

        if (convResult.rows.length === 0) {
            // Create new conversation
            const newConv = await query(
                `INSERT INTO whatsapp_conversaciones (wa_id, telefono, nombre, estado, mensajes_sin_leer)
                 VALUES ($1, $2, $3, 'activa', 1)
                 RETURNING id`,
                [waId, waId, contactName]
            );
            conversacionId = newConv.rows[0].id;
            isNewConversation = true;

            // Try to link to existing client
            const clientResult = await query(
                'SELECT id FROM clientes WHERE telefono LIKE $1 OR telefono LIKE $2 LIMIT 1',
                [`%${waId.slice(-10)}%`, `%${waId.slice(-8)}%`]
            );
            if (clientResult.rows.length > 0) {
                await query(
                    'UPDATE whatsapp_conversaciones SET cliente_id = $1 WHERE id = $2',
                    [clientResult.rows[0].id, conversacionId]
                );
            }
        } else {
            conversacionId = convResult.rows[0].id;
            // Update conversation
            await query(
                `UPDATE whatsapp_conversaciones 
                 SET ultimo_mensaje = CURRENT_TIMESTAMP, 
                     mensajes_sin_leer = mensajes_sin_leer + 1,
                     nombre = COALESCE(nombre, $1),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [contactName, conversacionId]
            );
        }

        // Save the message
        await query(
            `INSERT INTO whatsapp_mensajes 
             (conversacion_id, wa_message_id, direccion, tipo, contenido, media_url, metadata)
             VALUES ($1, $2, 'entrante', $3, $4, $5, $6)`,
            [conversacionId, messageId, tipo, contenido, mediaUrl, JSON.stringify(message)]
        );

        // Process with AI if enabled
        await processWithAI(conversacionId, waId, contenido, contactName);

    } catch (error) {
        console.error('Error processing message:', error);
    }
}

// Process message with AI and respond
async function processWithAI(conversacionId, waId, mensaje, contactName) {
    try {
        // Get config
        const configResult = await query('SELECT * FROM whatsapp_config WHERE id = 1');
        const config = configResult.rows[0];

        if (!config?.ia_activa || !config?.openai_api_key) {
            console.log('IA disabled or no API key configured');
            return;
        }

        // Check business hours
        if (!isWithinBusinessHours(config.horario_atencion)) {
            await sendWhatsAppMessage(waId, config.mensaje_fuera_horario, config);
            return;
        }

        // Get conversation history for context
        const historyResult = await query(
            `SELECT direccion, contenido, created_at 
             FROM whatsapp_mensajes 
             WHERE conversacion_id = $1 
             ORDER BY created_at DESC LIMIT 10`,
            [conversacionId]
        );
        const history = historyResult.rows.reverse();

        // Get products for context
        const productsResult = await query(
            'SELECT nombre, categoria, material, precio_base FROM productos WHERE activo = true LIMIT 20'
        );
        const productos = productsResult.rows;

        // Build conversation for AI
        const systemPrompt = config.ia_prompt_sistema + `

PRODUCTOS DISPONIBLES:
${productos.map(p => `- ${p.nombre} (${p.categoria}, ${p.material}): $${p.precio_base}`).join('\n')}

INFORMACIÓN IMPORTANTE:
- Tiempo de entrega estándar: 7 días hábiles
- Aceptamos pedidos personalizados con logo del cliente
- Métodos de pago: Efectivo, Transferencia, MercadoPago
- Envíos a todo el país via Correo Argentino

Si el cliente quiere CONFIRMAR un pedido, responde con el JSON al final del mensaje:
###PEDIDO_CONFIRMADO###
{"productos": [...], "cantidad": X, "material": "...", "tienelogo": true/false, "notas": "..."}
###FIN_PEDIDO###`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map(h => ({
                role: h.direccion === 'entrante' ? 'user' : 'assistant',
                content: h.contenido
            })),
            { role: 'user', content: mensaje }
        ];

        // Call OpenAI
        const startTime = Date.now();
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.openai_api_key}`
            },
            body: JSON.stringify({
                model: config.ia_modelo || 'gpt-4o-mini',
                messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('OpenAI error:', error);
            return;
        }

        const aiData = await response.json();
        const aiResponse = aiData.choices[0]?.message?.content || '';
        const responseTime = Date.now() - startTime;

        // Check if AI detected a confirmed order
        let intencion = 'consulta';
        let accion = null;
        let entidades = {};

        if (aiResponse.includes('###PEDIDO_CONFIRMADO###')) {
            intencion = 'confirmar_pedido';
            const match = aiResponse.match(/###PEDIDO_CONFIRMADO###\s*([\s\S]*?)\s*###FIN_PEDIDO###/);
            if (match) {
                try {
                    entidades = JSON.parse(match[1]);
                    accion = 'crear_pedido';
                    
                    // Create the order in the system
                    await createOrderFromWhatsApp(conversacionId, entidades, contactName, waId);
                } catch (e) {
                    console.error('Error parsing order JSON:', e);
                }
            }
        }

        // Clean response for WhatsApp (remove JSON markers)
        let cleanResponse = aiResponse
            .replace(/###PEDIDO_CONFIRMADO###[\s\S]*?###FIN_PEDIDO###/g, '')
            .trim();

        // Log AI interaction
        await query(
            `INSERT INTO ia_interacciones 
             (conversacion_id, mensaje_entrada, mensaje_salida, intencion_detectada, 
              entidades_extraidas, accion_tomada, tokens_usados, modelo_usado, tiempo_respuesta_ms)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                conversacionId,
                mensaje,
                cleanResponse,
                intencion,
                JSON.stringify(entidades),
                accion,
                aiData.usage?.total_tokens,
                config.ia_modelo,
                responseTime
            ]
        );

        // Send response via WhatsApp
        if (cleanResponse) {
            await sendWhatsAppMessage(waId, cleanResponse, config);

            // Save outgoing message
            await query(
                `INSERT INTO whatsapp_mensajes 
                 (conversacion_id, direccion, tipo, contenido, es_automatico)
                 VALUES ($1, 'saliente', 'text', $2, true)`,
                [conversacionId, cleanResponse]
            );
        }

    } catch (error) {
        console.error('Error in AI processing:', error);
    }
}

// Send message via WhatsApp Business API
async function sendWhatsAppMessage(to, message, config) {
    if (!config.whatsapp_token || !config.whatsapp_phone_id) {
        console.log('WhatsApp not configured');
        return;
    }

    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${config.whatsapp_phone_id}/messages`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.whatsapp_token}`
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: { body: message }
                })
            }
        );

        const result = await response.json();
        
        if (!response.ok) {
            console.error('WhatsApp API error:', result);
        } else {
            console.log('Message sent:', result.messages?.[0]?.id);
        }
        
        return result;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
    }
}

// Create order from WhatsApp confirmation
async function createOrderFromWhatsApp(conversacionId, entidades, contactName, waId) {
    try {
        // Get or create client
        let clienteId = null;
        
        // Check if conversation has linked client
        const convResult = await query(
            'SELECT cliente_id FROM whatsapp_conversaciones WHERE id = $1',
            [conversacionId]
        );
        
        if (convResult.rows[0]?.cliente_id) {
            clienteId = convResult.rows[0].cliente_id;
        } else {
            // Create new client
            const newClient = await query(
                `INSERT INTO clientes (nombre, telefono, notas)
                 VALUES ($1, $2, 'Cliente creado desde WhatsApp')
                 RETURNING id`,
                [contactName, waId]
            );
            clienteId = newClient.rows[0].id;
            
            // Link to conversation
            await query(
                'UPDATE whatsapp_conversaciones SET cliente_id = $1 WHERE id = $2',
                [clienteId, conversacionId]
            );
        }

        // Generate order number
        const year = new Date().getFullYear();
        const countResult = await query(
            "SELECT COUNT(*) FROM pedidos WHERE numero LIKE $1",
            [`${year}-%`]
        );
        const orderNumber = `${year}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;

        // Build items from AI extracted data
        const items = [];
        if (entidades.productos) {
            for (const prod of (Array.isArray(entidades.productos) ? entidades.productos : [entidades.productos])) {
                items.push({
                    producto: prod,
                    cantidad: entidades.cantidad || 1,
                    material: entidades.material || 'mdf',
                    precioUnitario: 0, // To be filled by admin
                    subtotal: 0
                });
            }
        }

        // Calculate delivery date (7 business days)
        const fechaEntrega = new Date();
        fechaEntrega.setDate(fechaEntrega.getDate() + 10); // ~7 business days

        // Create order
        const orderResult = await query(
            `INSERT INTO pedidos 
             (numero, cliente_id, estado, items, total, notas, fecha_entrega, created_at)
             VALUES ($1, $2, 'confirmado', $3, 0, $4, $5, CURRENT_TIMESTAMP)
             RETURNING id, numero`,
            [
                orderNumber,
                clienteId,
                JSON.stringify(items),
                `Pedido via WhatsApp. ${entidades.tienelogo ? 'Con logo del cliente.' : ''} ${entidades.notas || ''}`,
                fechaEntrega.toISOString()
            ]
        );

        console.log('Order created from WhatsApp:', orderResult.rows[0]);
        return orderResult.rows[0];

    } catch (error) {
        console.error('Error creating order from WhatsApp:', error);
    }
}

// Check if current time is within business hours
function isWithinBusinessHours(horario) {
    if (!horario) return true;
    
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;

    const dias = horario.dias || [1, 2, 3, 4, 5]; // Mon-Fri default
    if (!dias.includes(day)) return false;

    const [inicioH, inicioM] = (horario.inicio || '09:00').split(':').map(Number);
    const [finH, finM] = (horario.fin || '18:00').split(':').map(Number);
    
    const inicioMin = inicioH * 60 + inicioM;
    const finMin = finH * 60 + finM;

    return currentTime >= inicioMin && currentTime <= finMin;
}

// Update message status
async function updateMessageStatus(status) {
    const { id: messageId, status: newStatus, timestamp } = status;
    
    const statusMap = {
        'sent': 'enviado',
        'delivered': 'entregado',
        'read': 'leido',
        'failed': 'fallido'
    };

    await query(
        `UPDATE whatsapp_mensajes 
         SET estado = $1 
         WHERE wa_message_id = $2`,
        [statusMap[newStatus] || newStatus, messageId]
    );
}

// Main handler
export default async function handler(req, res) {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Webhook verification
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            const configResult = await query('SELECT webhook_verify_token FROM whatsapp_config WHERE id = 1');
            const verifyToken = configResult.rows[0]?.webhook_verify_token || 'grabados_express_verify_2024';

            if (mode === 'subscribe' && token === verifyToken) {
                console.log('Webhook verified');
                return res.status(200).send(challenge);
            }
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (req.method === 'POST') {
            const body = req.body;
            
            if (body.object !== 'whatsapp_business_account') {
                return res.status(400).json({ error: 'Not a WhatsApp event' });
            }

            // Process asynchronously but respond immediately
            setImmediate(async () => {
                for (const entry of body.entry || []) {
                    for (const change of entry.changes || []) {
                        if (change.field === 'messages') {
                            const value = change.value;
                            
                            if (value.messages) {
                                for (const message of value.messages) {
                                    await processIncomingMessage(message, value.contacts?.[0], value.metadata);
                                }
                            }

                            if (value.statuses) {
                                for (const status of value.statuses) {
                                    await updateMessageStatus(status);
                                }
                            }
                        }
                    }
                }
            });

            return res.status(200).json({ status: 'OK' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
