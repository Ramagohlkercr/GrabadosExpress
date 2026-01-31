// ============================================
// GRABADOS EXPRESS - WhatsApp Conversations API
// CRUD for conversations and messages
// ============================================

import { query } from './_lib/db.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id, action } = req.query;

    try {
        switch (req.method) {
            case 'GET':
                if (action === 'config') {
                    return await getConfig(req, res);
                }
                if (action === 'stats') {
                    return await getStats(req, res);
                }
                if (id) {
                    return await getConversation(req, res, id);
                }
                return await getConversations(req, res);

            case 'POST':
                if (action === 'send') {
                    return await sendMessage(req, res);
                }
                if (action === 'config') {
                    return await saveConfig(req, res);
                }
                return res.status(400).json({ error: 'Invalid action' });

            case 'PUT':
                if (id) {
                    return await updateConversation(req, res, id);
                }
                return res.status(400).json({ error: 'ID required' });

            case 'DELETE':
                if (id) {
                    return await deleteConversation(req, res, id);
                }
                return res.status(400).json({ error: 'ID required' });

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Conversations API error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

// Get all conversations
async function getConversations(req, res) {
    const { estado, limit = 50, offset = 0 } = req.query;

    let sql = `
        SELECT 
            c.*,
            cl.nombre as cliente_nombre,
            cl.telefono as cliente_telefono,
            (SELECT contenido FROM whatsapp_mensajes 
             WHERE conversacion_id = c.id 
             ORDER BY created_at DESC LIMIT 1) as ultimo_mensaje_texto
        FROM whatsapp_conversaciones c
        LEFT JOIN clientes cl ON c.cliente_id = cl.id
    `;
    const params = [];
    let paramIndex = 1;

    if (estado) {
        sql += ` WHERE c.estado = $${paramIndex++}`;
        params.push(estado);
    }

    sql += ` ORDER BY c.ultimo_mensaje DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    // Get total count
    const countResult = await query(
        'SELECT COUNT(*) FROM whatsapp_conversaciones' + (estado ? ' WHERE estado = $1' : ''),
        estado ? [estado] : []
    );

    return res.status(200).json({
        conversaciones: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
    });
}

// Get single conversation with messages
async function getConversation(req, res, id) {
    const convResult = await query(
        `SELECT 
            c.*,
            cl.nombre as cliente_nombre,
            cl.telefono as cliente_telefono,
            cl.email as cliente_email
         FROM whatsapp_conversaciones c
         LEFT JOIN clientes cl ON c.cliente_id = cl.id
         WHERE c.id = $1`,
        [id]
    );

    if (convResult.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const messagesResult = await query(
        `SELECT * FROM whatsapp_mensajes 
         WHERE conversacion_id = $1 
         ORDER BY created_at ASC`,
        [id]
    );

    // Mark as read
    await query(
        'UPDATE whatsapp_conversaciones SET mensajes_sin_leer = 0 WHERE id = $1',
        [id]
    );

    return res.status(200).json({
        ...convResult.rows[0],
        mensajes: messagesResult.rows
    });
}

// Send a manual message
async function sendMessage(req, res) {
    const { conversacionId, mensaje, waId } = req.body;

    if (!mensaje || (!conversacionId && !waId)) {
        return res.status(400).json({ error: 'Message and conversation required' });
    }

    // Get config
    const configResult = await query('SELECT * FROM whatsapp_config WHERE id = 1');
    const config = configResult.rows[0];

    if (!config?.whatsapp_token || !config?.whatsapp_phone_id) {
        return res.status(400).json({ error: 'WhatsApp not configured' });
    }

    // Get conversation
    let targetWaId = waId;
    let convId = conversacionId;

    if (conversacionId && !waId) {
        const convResult = await query(
            'SELECT wa_id FROM whatsapp_conversaciones WHERE id = $1',
            [conversacionId]
        );
        if (convResult.rows.length === 0) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        targetWaId = convResult.rows[0].wa_id;
    }

    // Send via WhatsApp API
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
                    to: targetWaId,
                    type: 'text',
                    text: { body: mensaje }
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            return res.status(400).json({ error: 'WhatsApp API error', details: result });
        }

        // Save message to DB
        const msgResult = await query(
            `INSERT INTO whatsapp_mensajes 
             (conversacion_id, wa_message_id, direccion, tipo, contenido, es_automatico)
             VALUES ($1, $2, 'saliente', 'text', $3, false)
             RETURNING *`,
            [convId, result.messages?.[0]?.id, mensaje]
        );

        // Update conversation timestamp
        await query(
            'UPDATE whatsapp_conversaciones SET ultimo_mensaje = CURRENT_TIMESTAMP WHERE id = $1',
            [convId]
        );

        return res.status(200).json({
            success: true,
            mensaje: msgResult.rows[0],
            whatsapp_response: result
        });

    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ error: 'Failed to send message' });
    }
}

// Update conversation (mark as read, change status, link client)
async function updateConversation(req, res, id) {
    const { estado, clienteId, mensajesSinLeer } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (estado) {
        updates.push(`estado = $${paramIndex++}`);
        params.push(estado);
    }
    if (clienteId !== undefined) {
        updates.push(`cliente_id = $${paramIndex++}`);
        params.push(clienteId);
    }
    if (mensajesSinLeer !== undefined) {
        updates.push(`mensajes_sin_leer = $${paramIndex++}`);
        params.push(mensajesSinLeer);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await query(
        `UPDATE whatsapp_conversaciones SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
    }

    return res.status(200).json(result.rows[0]);
}

// Delete conversation
async function deleteConversation(req, res, id) {
    const result = await query(
        'DELETE FROM whatsapp_conversaciones WHERE id = $1 RETURNING id',
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
    }

    return res.status(200).json({ deleted: true, id });
}

// Get WhatsApp/AI configuration
async function getConfig(req, res) {
    const result = await query('SELECT * FROM whatsapp_config WHERE id = 1');
    
    if (result.rows.length === 0) {
        return res.status(200).json({});
    }

    // Mask sensitive data
    const config = result.rows[0];
    return res.status(200).json({
        ...config,
        whatsapp_token: config.whatsapp_token ? '***configured***' : null,
        openai_api_key: config.openai_api_key ? '***configured***' : null,
        meta_app_secret: config.meta_app_secret ? '***configured***' : null,
    });
}

// Save WhatsApp/AI configuration
async function saveConfig(req, res) {
    const {
        metaAppId,
        metaAppSecret,
        whatsappToken,
        whatsappPhoneId,
        whatsappBusinessId,
        webhookVerifyToken,
        openaiApiKey,
        iaModelo,
        iaActiva,
        iaPromptSistema,
        horarioAtencion,
        mensajeFueraHorario
    } = req.body;

    // Build update query dynamically (only update provided fields)
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (metaAppId !== undefined) {
        updates.push(`meta_app_id = $${paramIndex++}`);
        params.push(metaAppId);
    }
    if (metaAppSecret && metaAppSecret !== '***configured***') {
        updates.push(`meta_app_secret = $${paramIndex++}`);
        params.push(metaAppSecret);
    }
    if (whatsappToken && whatsappToken !== '***configured***') {
        updates.push(`whatsapp_token = $${paramIndex++}`);
        params.push(whatsappToken);
    }
    if (whatsappPhoneId !== undefined) {
        updates.push(`whatsapp_phone_id = $${paramIndex++}`);
        params.push(whatsappPhoneId);
    }
    if (whatsappBusinessId !== undefined) {
        updates.push(`whatsapp_business_id = $${paramIndex++}`);
        params.push(whatsappBusinessId);
    }
    if (webhookVerifyToken !== undefined) {
        updates.push(`webhook_verify_token = $${paramIndex++}`);
        params.push(webhookVerifyToken);
    }
    if (openaiApiKey && openaiApiKey !== '***configured***') {
        updates.push(`openai_api_key = $${paramIndex++}`);
        params.push(openaiApiKey);
    }
    if (iaModelo !== undefined) {
        updates.push(`ia_modelo = $${paramIndex++}`);
        params.push(iaModelo);
    }
    if (iaActiva !== undefined) {
        updates.push(`ia_activa = $${paramIndex++}`);
        params.push(iaActiva);
    }
    if (iaPromptSistema !== undefined) {
        updates.push(`ia_prompt_sistema = $${paramIndex++}`);
        params.push(iaPromptSistema);
    }
    if (horarioAtencion !== undefined) {
        updates.push(`horario_atencion = $${paramIndex++}`);
        params.push(JSON.stringify(horarioAtencion));
    }
    if (mensajeFueraHorario !== undefined) {
        updates.push(`mensaje_fuera_horario = $${paramIndex++}`);
        params.push(mensajeFueraHorario);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Upsert
    const result = await query(`
        INSERT INTO whatsapp_config (id, ${updates.map(u => u.split(' = ')[0]).join(', ')}, updated_at)
        VALUES (1, ${params.map((_, i) => `$${i + 1}`).join(', ')}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET ${updates.join(', ')}
        RETURNING *
    `, params);

    // Mask sensitive data in response
    const config = result.rows[0];
    return res.status(200).json({
        ...config,
        whatsapp_token: config.whatsapp_token ? '***configured***' : null,
        openai_api_key: config.openai_api_key ? '***configured***' : null,
        meta_app_secret: config.meta_app_secret ? '***configured***' : null,
    });
}

// Get stats
async function getStats(req, res) {
    const stats = await query(`
        SELECT 
            (SELECT COUNT(*) FROM whatsapp_conversaciones WHERE estado = 'activa') as conversaciones_activas,
            (SELECT SUM(mensajes_sin_leer) FROM whatsapp_conversaciones) as mensajes_sin_leer,
            (SELECT COUNT(*) FROM whatsapp_mensajes WHERE created_at > NOW() - INTERVAL '24 hours') as mensajes_24h,
            (SELECT COUNT(*) FROM ia_interacciones WHERE created_at > NOW() - INTERVAL '24 hours') as ia_respuestas_24h,
            (SELECT COUNT(*) FROM ia_interacciones WHERE accion_tomada = 'crear_pedido' AND created_at > NOW() - INTERVAL '7 days') as pedidos_ia_semana
    `);

    return res.status(200).json(stats.rows[0]);
}
