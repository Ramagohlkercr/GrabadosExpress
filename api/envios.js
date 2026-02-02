// ============================================
// GRABADOS EXPRESS - Envíos y Notificaciones API
// Integración con Correo Argentino + WhatsApp
// ============================================

import { query } from './_lib/db.js';

// URLs de Correo Argentino
const CORREO_API_PROD = 'https://api.correoargentino.com.ar/paqar/v1';
const CORREO_API_TEST = 'https://apitest.correoargentino.com.ar/paqar/v1';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;

    try {
        switch (action) {
            // ============================================
            // CREAR ENVÍO EN CORREO ARGENTINO
            // ============================================
            case 'crear':
                if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
                return await crearEnvio(req, res);

            // ============================================
            // OBTENER ETIQUETA/RÓTULO PDF
            // ============================================
            case 'etiqueta':
                if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
                return await obtenerEtiqueta(req, res);

            // ============================================
            // CONSULTAR TRACKING
            // ============================================
            case 'tracking':
                if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
                return await consultarTracking(req, res);

            // ============================================
            // ENVIAR NOTIFICACIÓN WHATSAPP
            // ============================================
            case 'notificar':
                if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
                return await enviarNotificacion(req, res);

            // ============================================
            // OBTENER PLANTILLAS
            // ============================================
            case 'plantillas':
                return await gestionarPlantillas(req, res);

            // ============================================
            // OBTENER HISTORIAL DE NOTIFICACIONES
            // ============================================
            case 'historial':
                if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
                return await obtenerHistorial(req, res);

            // ============================================
            // ACTUALIZAR ESTADO DE ENVÍO
            // ============================================
            case 'actualizar-estado':
                if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
                return await actualizarEstadoEnvio(req, res);

            // ============================================
            // OBTENER SUCURSALES
            // ============================================
            case 'sucursales':
                if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
                return await obtenerSucursales(req, res);

            // ============================================
            // SYNC TRACKING MASIVO
            // ============================================
            case 'sync-tracking':
                if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
                return await syncAllTracking(req, res);

            // ============================================
            // TRACKING PÚBLICO (SIN CREDENCIALES)
            // ============================================
            case 'tracking-publico':
                if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
                return await consultarTrackingPublico(req, res);

            // ============================================
            // ASIGNAR TRACKING A PEDIDO
            // ============================================
            case 'asignar-tracking':
                if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
                return await asignarTracking(req, res);

            // ============================================
            // LISTAR PEDIDOS CON ENVÍO
            // ============================================
            case 'listar':
                if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
                return await listarEnvios(req, res);

            default:
                return res.status(400).json({ error: 'Acción no válida' });
        }
    } catch (error) {
        console.error('Error en envíos API:', error);
        return res.status(500).json({ error: error.message });
    }
}

// ============================================
// CREAR ENVÍO
// ============================================
async function crearEnvio(req, res) {
    const { pedidoId, tipoEntrega, sucursalId, sucursalNombre } = req.body;

    // Obtener config
    const configResult = await query('SELECT * FROM whatsapp_config WHERE id = 1');
    const config = configResult.rows[0];

    if (!config?.correo_api_key || !config?.correo_agreement) {
        return res.status(400).json({ error: 'Correo Argentino no está configurado' });
    }

    // Obtener pedido y cliente
    const pedidoResult = await query(`
        SELECT p.*, c.nombre, c.telefono, c.direccion, c.localidad, c.provincia, c.email
        FROM pedidos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.id = $1
    `, [pedidoId]);

    if (pedidoResult.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const pedido = pedidoResult.rows[0];
    const baseUrl = config.correo_test_mode ? CORREO_API_TEST : CORREO_API_PROD;

    // Crear payload para Correo Argentino
    const payload = {
        sellerId: config.correo_agreement,
        trackingNumber: '',
        order: {
            senderData: {
                id: '',
                businessName: config.remitente_nombre || 'Grabados Express',
                areaCodePhone: '',
                phoneNumber: config.remitente_telefono || '',
                areaCodeCellphone: '',
                cellphoneNumber: config.remitente_telefono || '',
                email: config.remitente_email || '',
                observation: '',
                address: {
                    streetName: config.remitente_direccion || '',
                    streetNumber: '',
                    cityName: config.remitente_localidad || '',
                    floor: '',
                    department: '',
                    state: config.remitente_provincia || '',
                    zipCode: config.remitente_cp || ''
                }
            },
            shippingData: {
                name: pedido.nombre || '',
                areaCodePhone: '',
                phoneNumber: pedido.telefono || '',
                areaCodeCellphone: '',
                cellphoneNumber: pedido.telefono || '',
                email: pedido.email || '',
                observation: `Pedido #${pedido.numero}`,
                address: {
                    streetName: pedido.direccion || '',
                    streetNumber: '',
                    cityName: pedido.localidad || '',
                    floor: '',
                    department: '',
                    state: pedido.provincia || '',
                    zipCode: ''
                }
            },
            parcels: [{
                dimensions: {
                    height: '5',
                    width: '20',
                    depth: '15'
                },
                productWeight: '200',
                productCategory: 'General',
                declaredValue: String(pedido.total || 1000)
            }],
            deliveryType: tipoEntrega || 'agency',
            agencyId: sucursalId || '',
            saleDate: new Date().toISOString(),
            serviceType: 'CP',
            shipmentClientId: pedido.numero
        }
    };

    try {
        const response = await fetch(`${baseUrl}/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Apikey ${config.correo_api_key}`,
                'agreement': config.correo_agreement,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error Correo Argentino:', data);
            return res.status(400).json({ error: data.message || 'Error al crear envío' });
        }

        const trackingNumber = data.trackingNumber;

        // Actualizar pedido con tracking
        await query(`
            UPDATE pedidos SET 
                envio_tracking = $1,
                envio_estado = 'creado',
                envio_tipo = $2,
                envio_sucursal_id = $3,
                envio_sucursal_nombre = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
        `, [trackingNumber, tipoEntrega, sucursalId, sucursalNombre, pedidoId]);

        // Obtener etiqueta
        const labelResponse = await fetch(`${baseUrl}/labels?labelFormat=10x15`, {
            method: 'POST',
            headers: {
                'Authorization': `Apikey ${config.correo_api_key}`,
                'agreement': config.correo_agreement,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
                sellerId: config.correo_agreement,
                trackingNumber
            }])
        });

        if (labelResponse.ok) {
            const labelData = await labelResponse.json();
            if (labelData[0]?.fileBase64) {
                await query(
                    'UPDATE pedidos SET envio_etiqueta_pdf = $1 WHERE id = $2',
                    [labelData[0].fileBase64, pedidoId]
                );
            }
        }

        return res.status(200).json({
            success: true,
            trackingNumber,
            data
        });

    } catch (error) {
        console.error('Error creando envío:', error);
        return res.status(500).json({ error: error.message });
    }
}

// ============================================
// OBTENER ETIQUETA PDF
// ============================================
async function obtenerEtiqueta(req, res) {
    const { pedidoId, tracking } = req.query;

    // Si tenemos el PDF guardado, devolverlo
    if (pedidoId) {
        const result = await query(
            'SELECT envio_etiqueta_pdf, envio_tracking FROM pedidos WHERE id = $1',
            [pedidoId]
        );
        if (result.rows[0]?.envio_etiqueta_pdf) {
            return res.status(200).json({
                success: true,
                pdfBase64: result.rows[0].envio_etiqueta_pdf,
                tracking: result.rows[0].envio_tracking
            });
        }
    }

    // Si no, obtenerla de Correo Argentino
    const configResult = await query('SELECT * FROM whatsapp_config WHERE id = 1');
    const config = configResult.rows[0];

    if (!config?.correo_api_key) {
        return res.status(400).json({ error: 'Correo Argentino no configurado' });
    }

    const trackingNumber = tracking || (await query(
        'SELECT envio_tracking FROM pedidos WHERE id = $1',
        [pedidoId]
    )).rows[0]?.envio_tracking;

    if (!trackingNumber) {
        return res.status(404).json({ error: 'No hay tracking para este pedido' });
    }

    const baseUrl = config.correo_test_mode ? CORREO_API_TEST : CORREO_API_PROD;

    const response = await fetch(`${baseUrl}/labels?labelFormat=10x15`, {
        method: 'POST',
        headers: {
            'Authorization': `Apikey ${config.correo_api_key}`,
            'agreement': config.correo_agreement,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
            sellerId: config.correo_agreement,
            trackingNumber
        }])
    });

    const data = await response.json();

    if (response.ok && data[0]?.fileBase64) {
        // Guardar para futuro
        if (pedidoId) {
            await query(
                'UPDATE pedidos SET envio_etiqueta_pdf = $1 WHERE id = $2',
                [data[0].fileBase64, pedidoId]
            );
        }

        return res.status(200).json({
            success: true,
            pdfBase64: data[0].fileBase64,
            tracking: trackingNumber
        });
    }

    return res.status(400).json({ error: 'No se pudo obtener la etiqueta' });
}

// ============================================
// CONSULTAR TRACKING
// ============================================
async function consultarTracking(req, res) {
    const { pedidoId, tracking } = req.query;

    const configResult = await query('SELECT * FROM whatsapp_config WHERE id = 1');
    const config = configResult.rows[0];

    let trackingNumber = tracking;

    if (pedidoId && !trackingNumber) {
        const result = await query('SELECT envio_tracking FROM pedidos WHERE id = $1', [pedidoId]);
        trackingNumber = result.rows[0]?.envio_tracking;
    }

    if (!trackingNumber) {
        return res.status(404).json({ error: 'No hay tracking' });
    }

    // Consultar en Correo Argentino
    const baseUrl = config?.correo_test_mode ? CORREO_API_TEST : CORREO_API_PROD;

    try {
        // La API de tracking puede variar, intentar GET
        const response = await fetch(`${baseUrl}/tracking/${trackingNumber}`, {
            method: 'GET',
            headers: {
                'Authorization': `Apikey ${config.correo_api_key}`,
                'agreement': config.correo_agreement,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Guardar eventos en el pedido
            if (pedidoId && data.events) {
                const ultimoEvento = data.events[0]?.description || '';
                await query(`
                    UPDATE pedidos SET 
                        envio_eventos = $1,
                        envio_ultimo_evento = $2,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `, [JSON.stringify(data.events), ultimoEvento, pedidoId]);
            }

            return res.status(200).json({
                success: true,
                tracking: trackingNumber,
                events: data.events || data,
                ultimoEvento: data.events?.[0]?.description
            });
        }

        // Fallback: devolver datos guardados
        if (pedidoId) {
            const saved = await query(
                'SELECT envio_eventos, envio_ultimo_evento FROM pedidos WHERE id = $1',
                [pedidoId]
            );
            return res.status(200).json({
                success: true,
                tracking: trackingNumber,
                events: saved.rows[0]?.envio_eventos || [],
                ultimoEvento: saved.rows[0]?.envio_ultimo_evento,
                fromCache: true
            });
        }

        return res.status(400).json({ error: 'No se pudo consultar tracking' });

    } catch (error) {
        console.error('Error consultando tracking:', error);
        return res.status(500).json({ error: error.message });
    }
}

// ============================================
// ENVIAR NOTIFICACIÓN WHATSAPP
// ============================================
async function enviarNotificacion(req, res) {
    const { pedidoId, tipo, mensajePersonalizado } = req.body;

    // Obtener config
    const configResult = await query('SELECT * FROM whatsapp_config WHERE id = 1');
    const config = configResult.rows[0];

    if (!config?.whatsapp_token || !config?.whatsapp_phone_id) {
        return res.status(400).json({ error: 'WhatsApp no está configurado' });
    }

    // Obtener pedido con cliente
    const pedidoResult = await query(`
        SELECT p.*, c.nombre, c.telefono, c.localidad, c.provincia
        FROM pedidos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.id = $1
    `, [pedidoId]);

    if (pedidoResult.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const pedido = pedidoResult.rows[0];
    
    if (!pedido.telefono) {
        return res.status(400).json({ error: 'El cliente no tiene teléfono' });
    }

    // Obtener plantilla
    let mensaje = mensajePersonalizado;
    
    if (!mensaje && tipo) {
        const plantillaResult = await query(
            'SELECT * FROM plantillas_notificacion WHERE codigo = $1',
            [tipo]
        );
        
        if (plantillaResult.rows.length > 0) {
            mensaje = plantillaResult.rows[0].mensaje;
            
            // Reemplazar variables
            const items = pedido.items ? JSON.parse(pedido.items) : [];
            const itemsTexto = items.map(i => `${i.cantidad}x ${i.producto}`).join(', ');
            
            mensaje = mensaje
                .replace(/{nombre}/g, pedido.nombre || 'Cliente')
                .replace(/{numero}/g, pedido.numero || '')
                .replace(/{items}/g, itemsTexto || 'Productos')
                .replace(/{total}/g, pedido.total?.toLocaleString() || '0')
                .replace(/{tracking}/g, pedido.envio_tracking || '')
                .replace(/{sucursal}/g, pedido.envio_sucursal_nombre || 'sucursal de destino')
                .replace(/{ultimo_evento}/g, pedido.envio_ultimo_evento || '')
                .replace(/{dias_entrega}/g, '7');
        }
    }

    if (!mensaje) {
        return res.status(400).json({ error: 'No hay mensaje para enviar' });
    }

    // Formatear teléfono (agregar código de país si no tiene)
    let telefono = pedido.telefono.replace(/\D/g, '');
    if (!telefono.startsWith('54')) {
        telefono = '54' + telefono;
    }

    // Enviar vía WhatsApp Business API
    try {
        const waResponse = await fetch(
            `https://graph.facebook.com/v18.0/${config.whatsapp_phone_id}/messages`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.whatsapp_token}`
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: telefono,
                    type: 'text',
                    text: { body: mensaje }
                })
            }
        );

        const waResult = await waResponse.json();

        // Guardar en historial
        await query(`
            INSERT INTO notificaciones_enviadas 
            (pedido_id, cliente_id, tipo, canal, telefono, mensaje, estado, wa_message_id, metadata)
            VALUES ($1, $2, $3, 'whatsapp', $4, $5, $6, $7, $8)
        `, [
            pedidoId,
            pedido.cliente_id,
            tipo || 'manual',
            telefono,
            mensaje,
            waResponse.ok ? 'enviado' : 'error',
            waResult.messages?.[0]?.id || null,
            JSON.stringify(waResult)
        ]);

        if (!waResponse.ok) {
            console.error('Error WhatsApp:', waResult);
            return res.status(400).json({ 
                error: 'Error al enviar WhatsApp', 
                details: waResult.error?.message 
            });
        }

        return res.status(200).json({
            success: true,
            messageId: waResult.messages?.[0]?.id,
            telefono,
            mensaje
        });

    } catch (error) {
        console.error('Error enviando notificación:', error);
        return res.status(500).json({ error: error.message });
    }
}

// ============================================
// GESTIONAR PLANTILLAS
// ============================================
async function gestionarPlantillas(req, res) {
    if (req.method === 'GET') {
        const result = await query('SELECT * FROM plantillas_notificacion ORDER BY codigo');
        return res.status(200).json(result.rows);
    }

    if (req.method === 'PUT') {
        const { id, mensaje, activa } = req.body;
        await query(
            'UPDATE plantillas_notificacion SET mensaje = $1, activa = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [mensaje, activa, id]
        );
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

// ============================================
// OBTENER HISTORIAL
// ============================================
async function obtenerHistorial(req, res) {
    const { pedidoId, clienteId, limit = 50 } = req.query;

    let sql = `
        SELECT n.*, p.numero as pedido_numero
        FROM notificaciones_enviadas n
        LEFT JOIN pedidos p ON n.pedido_id = p.id
        WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (pedidoId) {
        sql += ` AND n.pedido_id = $${paramCount++}`;
        params.push(pedidoId);
    }
    if (clienteId) {
        sql += ` AND n.cliente_id = $${paramCount++}`;
        params.push(clienteId);
    }

    sql += ` ORDER BY n.created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);
    return res.status(200).json(result.rows);
}

// ============================================
// ACTUALIZAR ESTADO DE ENVÍO
// ============================================
async function actualizarEstadoEnvio(req, res) {
    const { pedidoId, estado, fechaDespacho } = req.body;

    const updates = ['envio_estado = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [estado, pedidoId];
    let paramCount = 2;

    if (fechaDespacho) {
        updates.push(`envio_fecha_despacho = $${++paramCount}`);
        params.splice(paramCount - 1, 0, fechaDespacho);
    }

    await query(
        `UPDATE pedidos SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        params
    );

    return res.status(200).json({ success: true });
}

// ============================================
// OBTENER SUCURSALES
// ============================================
async function obtenerSucursales(req, res) {
    const { provincia } = req.query;

    const configResult = await query('SELECT * FROM whatsapp_config WHERE id = 1');
    const config = configResult.rows[0];

    if (!config?.correo_api_key) {
        return res.status(400).json({ error: 'Correo Argentino no configurado' });
    }

    const baseUrl = config.correo_test_mode ? CORREO_API_TEST : CORREO_API_PROD;

    try {
        let url = `${baseUrl}/agencies`;
        if (provincia) {
            url += `?stateId=${provincia}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Apikey ${config.correo_api_key}`,
                'agreement': config.correo_agreement,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({
                success: true,
                sucursales: data
            });
        }

        return res.status(400).json({ error: data.message || 'Error al obtener sucursales' });

    } catch (error) {
        console.error('Error obteniendo sucursales:', error);
        return res.status(500).json({ error: error.message });
    }
}

// ============================================
// SYNC TRACKING MASIVO
// ============================================
async function syncAllTracking(req, res) {
    // Obtener todos los pedidos con tracking activo
    const pedidosResult = await query(`
        SELECT id, envio_tracking 
        FROM pedidos 
        WHERE envio_tracking IS NOT NULL 
        AND envio_estado NOT IN ('entregado', 'cancelado')
    `);

    const configResult = await query('SELECT * FROM whatsapp_config WHERE id = 1');
    const config = configResult.rows[0];

    if (!config?.correo_api_key) {
        return res.status(400).json({ error: 'Correo Argentino no configurado' });
    }

    const resultados = [];
    const baseUrl = config.correo_test_mode ? CORREO_API_TEST : CORREO_API_PROD;

    for (const pedido of pedidosResult.rows) {
        try {
            const response = await fetch(`${baseUrl}/tracking/${pedido.envio_tracking}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Apikey ${config.correo_api_key}`,
                    'agreement': config.correo_agreement,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const ultimoEvento = data.events?.[0]?.description || '';
                
                // Detectar estado
                let nuevoEstado = 'en_transito';
                const eventoLower = ultimoEvento.toLowerCase();
                
                if (eventoLower.includes('entregado') || eventoLower.includes('delivered')) {
                    nuevoEstado = 'entregado';
                } else if (eventoLower.includes('sucursal') || eventoLower.includes('disponible')) {
                    nuevoEstado = 'disponible_retiro';
                } else if (eventoLower.includes('en camino') || eventoLower.includes('distribución')) {
                    nuevoEstado = 'en_distribucion';
                }

                await query(`
                    UPDATE pedidos SET 
                        envio_eventos = $1,
                        envio_ultimo_evento = $2,
                        envio_estado = $3,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $4
                `, [JSON.stringify(data.events || []), ultimoEvento, nuevoEstado, pedido.id]);

                resultados.push({
                    tracking: pedido.envio_tracking,
                    estado: nuevoEstado,
                    evento: ultimoEvento
                });

                // Enviar notificación automática si cambió estado relevante
                if (nuevoEstado === 'disponible_retiro' && config.notif_despachado) {
                    // Notificar disponible para retiro
                    await enviarNotificacionAutomatica(pedido.id, 'pedido_disponible_retiro', config);
                } else if (nuevoEstado === 'entregado' && config.notif_entregado) {
                    // Notificar entregado
                    await enviarNotificacionAutomatica(pedido.id, 'pedido_entregado', config);
                }
            }
        } catch (error) {
            resultados.push({
                tracking: pedido.envio_tracking,
                error: error.message
            });
        }
    }

    return res.status(200).json({
        success: true,
        actualizados: resultados.length,
        resultados
    });
}

// Helper: Enviar notificación automática
async function enviarNotificacionAutomatica(pedidoId, tipo, config) {
    try {
        // Verificar si ya se envió esta notificación
        const existente = await query(
            'SELECT id FROM notificaciones_enviadas WHERE pedido_id = $1 AND tipo = $2',
            [pedidoId, tipo]
        );

        if (existente.rows.length > 0) {
            return; // Ya se envió
        }

        // Obtener datos del pedido
        const pedidoResult = await query(`
            SELECT p.*, c.nombre, c.telefono
            FROM pedidos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            WHERE p.id = $1
        `, [pedidoId]);

        if (pedidoResult.rows.length === 0 || !pedidoResult.rows[0].telefono) {
            return;
        }

        const pedido = pedidoResult.rows[0];

        // Obtener plantilla
        const plantillaResult = await query(
            'SELECT mensaje FROM plantillas_notificacion WHERE codigo = $1',
            [tipo]
        );

        if (plantillaResult.rows.length === 0) return;

        let mensaje = plantillaResult.rows[0].mensaje
            .replace(/{nombre}/g, pedido.nombre || 'Cliente')
            .replace(/{numero}/g, pedido.numero || '')
            .replace(/{tracking}/g, pedido.envio_tracking || '')
            .replace(/{sucursal}/g, pedido.envio_sucursal_nombre || '');

        // Formatear teléfono
        let telefono = pedido.telefono.replace(/\D/g, '');
        if (!telefono.startsWith('54')) {
            telefono = '54' + telefono;
        }

        // Enviar
        const waResponse = await fetch(
            `https://graph.facebook.com/v18.0/${config.whatsapp_phone_id}/messages`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.whatsapp_token}`
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: telefono,
                    type: 'text',
                    text: { body: mensaje }
                })
            }
        );

        const waResult = await waResponse.json();

        // Guardar
        await query(`
            INSERT INTO notificaciones_enviadas 
            (pedido_id, cliente_id, tipo, canal, telefono, mensaje, estado, wa_message_id)
            VALUES ($1, $2, $3, 'whatsapp', $4, $5, $6, $7)
        `, [
            pedidoId,
            pedido.cliente_id,
            tipo,
            telefono,
            mensaje,
            waResponse.ok ? 'enviado' : 'error',
            waResult.messages?.[0]?.id || null
        ]);

    } catch (error) {
        console.error('Error en notificación automática:', error);
    }
}

// ============================================
// CONSULTAR TRACKING PÚBLICO (SIN API KEY)
// ============================================
async function consultarTrackingPublico(req, res) {
    const { tracking } = req.query;

    if (!tracking) {
        return res.status(400).json({ error: 'Número de tracking requerido' });
    }

    try {
        // Intentar con la API pública de Correo Argentino
        // Esta URL es accesible sin autenticación para consultar estados
        const url = `https://www.correoargentino.com.ar/sites/all/modules/custom/correo_argentino_general/include/tracking_service.php?id=${encodeURIComponent(tracking)}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://www.correoargentino.com.ar/formularios/ondnc'
            }
        });

        if (!response.ok) {
            // Fallback: devolver estado genérico
            return res.status(200).json({
                tracking,
                estado: 'pendiente',
                ultimoEvento: 'Sin información disponible',
                eventos: [],
                mensaje: 'Consultá el tracking en correoargentino.com.ar',
                urlTracking: `https://www.correoargentino.com.ar/formularios/ondnc?id=${tracking}`
            });
        }

        const text = await response.text();
        
        // Intentar parsear como JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            // Si no es JSON, puede ser HTML o error
            return res.status(200).json({
                tracking,
                estado: 'en_consulta',
                ultimoEvento: 'Consultando...',
                eventos: [],
                urlTracking: `https://www.correoargentino.com.ar/formularios/ondnc?id=${tracking}`
            });
        }

        // Parsear respuesta de Correo Argentino
        let estado = 'en_transito';
        let ultimoEvento = '';
        let eventos = [];

        if (data && Array.isArray(data.eventos)) {
            eventos = data.eventos.map(e => ({
                fecha: e.fecha,
                hora: e.hora,
                descripcion: e.descripcion,
                ubicacion: e.planta || e.ubicacion || ''
            }));

            if (eventos.length > 0) {
                ultimoEvento = eventos[0].descripcion;
                
                // Determinar estado
                const ultimo = ultimoEvento.toLowerCase();
                if (ultimo.includes('entregado') || ultimo.includes('entrega exitosa')) {
                    estado = 'entregado';
                } else if (ultimo.includes('disponible') || ultimo.includes('sucursal')) {
                    estado = 'disponible_retiro';
                } else if (ultimo.includes('reparto') || ultimo.includes('camino')) {
                    estado = 'en_reparto';
                } else if (ultimo.includes('transito') || ultimo.includes('centro')) {
                    estado = 'en_transito';
                }
            }
        } else if (data && data.mensaje) {
            ultimoEvento = data.mensaje;
        }

        return res.status(200).json({
            success: true,
            tracking,
            estado,
            ultimoEvento,
            eventos,
            urlTracking: `https://www.correoargentino.com.ar/formularios/ondnc?id=${tracking}`
        });

    } catch (error) {
        console.error('Error consultando tracking público:', error);
        return res.status(200).json({
            tracking,
            estado: 'pendiente',
            ultimoEvento: 'Error consultando tracking',
            eventos: [],
            urlTracking: `https://www.correoargentino.com.ar/formularios/ondnc?id=${tracking}`
        });
    }
}

// ============================================
// ASIGNAR TRACKING MANUAL A PEDIDO
// ============================================
async function asignarTracking(req, res) {
    const { pedidoId, tracking, sucursalNombre } = req.body;

    if (!pedidoId || !tracking) {
        return res.status(400).json({ error: 'pedidoId y tracking son requeridos' });
    }

    try {
        // Verificar que el pedido existe
        const pedidoResult = await query('SELECT id, numero FROM pedidos WHERE id = $1', [pedidoId]);
        
        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // Actualizar pedido con tracking
        await query(`
            UPDATE pedidos SET 
                envio_tracking = $1,
                envio_estado = 'despachado',
                envio_sucursal_nombre = $2,
                envio_fecha_despacho = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [tracking.trim().toUpperCase(), sucursalNombre || null, pedidoId]);

        // Obtener config para ver si hay que notificar
        const configResult = await query('SELECT * FROM whatsapp_config WHERE id = 1');
        const config = configResult.rows[0];

        let notificacionEnviada = false;

        // Si tiene notificación automática activa, enviar
        if (config?.notif_despachado && config?.whatsapp_token) {
            await enviarNotificacionAutomatica(config, pedidoId, 'pedido_despachado');
            notificacionEnviada = true;
        }

        return res.status(200).json({
            success: true,
            tracking: tracking.trim().toUpperCase(),
            pedidoNumero: pedidoResult.rows[0].numero,
            notificacionEnviada
        });

    } catch (error) {
        console.error('Error asignando tracking:', error);
        return res.status(500).json({ error: error.message });
    }
}

// ============================================
// LISTAR PEDIDOS CON ENVÍO
// ============================================
async function listarEnvios(req, res) {
    const { estado } = req.query;

    try {
        let sql = `
            SELECT 
                p.id,
                p.numero,
                p.estado,
                p.total,
                p.envio_tracking,
                p.envio_estado,
                p.envio_sucursal_nombre,
                p.envio_fecha_despacho,
                p.envio_ultimo_evento,
                p.created_at,
                c.id as cliente_id,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                c.direccion as cliente_direccion,
                c.localidad as cliente_localidad,
                c.provincia as cliente_provincia
            FROM pedidos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            WHERE p.estado IN ('terminado', 'listo', 'entregado')
        `;
        
        const params = [];

        if (estado) {
            params.push(estado);
            sql += ` AND p.envio_estado = $${params.length}`;
        }

        sql += ' ORDER BY p.envio_fecha_despacho DESC NULLS LAST, p.created_at DESC';

        const result = await query(sql, params);

        // Separar en con tracking y sin tracking
        const conTracking = result.rows.filter(p => p.envio_tracking);
        const sinTracking = result.rows.filter(p => !p.envio_tracking);

        return res.status(200).json({
            success: true,
            conTracking,
            sinTracking,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Error listando envíos:', error);
        return res.status(500).json({ error: error.message });
    }
}
