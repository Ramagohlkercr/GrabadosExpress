// Vercel Serverless Function - Pedidos
import { query } from './_lib/db.js';
import { handleCors, corsHeaders } from './_lib/cors.js';

// Generate order number
async function generateOrderNumber() {
    const result = await query("SELECT nextval('pedido_numero_seq') as num");
    const num = result.rows[0].num;
    return `GE-${String(num).padStart(4, '0')}`;
}

// Map database row to frontend format
function mapPedido(row) {
    return {
        id: row.id,
        numero: row.numero,
        clienteId: row.cliente_id,
        clienteNombre: row.cliente_nombre,
        clienteTelefono: row.cliente_telefono,
        clienteEmail: row.cliente_email,
        clienteDireccion: row.cliente_direccion,
        estado: row.estado,
        items: row.items,
        subtotal: parseFloat(row.subtotal || 0),
        descuento: parseFloat(row.descuento || 0),
        total: parseFloat(row.total || 0),
        notas: row.notas,
        fechaPedido: row.fecha_pedido,
        fechaEntregaEstimada: row.fecha_entrega,
        fechaEntregado: row.fecha_entregado,
        localidad: row.localidad,
        provincia: row.provincia,
        costoEnvio: parseFloat(row.costo_envio || 0),
        logoImage: row.logo_image,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

export default async function handler(req, res) {
    if (handleCors(req, res)) return;
    corsHeaders(res);

    const { method } = req;
    const id = req.query.id;
    const action = req.query.action; // for estado updates, calendario, and envios

    try {
        // ============================================
        // ACCIONES DE ENVÍOS (integradas)
        // ============================================
        if (action === 'envios-listar') {
            return await listarPedidosEnvio(req, res);
        }
        if (action === 'asignar-tracking') {
            return await asignarTracking(req, res);
        }

        switch (method) {
            case 'GET':
                if (action === 'calendario') {
                    const { start, end } = req.query;
                    const result = await query(
                        `SELECT p.*, c.nombre as cliente_nombre
                        FROM pedidos p
                        LEFT JOIN clientes c ON p.cliente_id = c.id
                        WHERE p.fecha_entrega BETWEEN $1 AND $2
                        ORDER BY p.fecha_entrega`,
                        [start, end]
                    );
                    return res.json(result.rows.map(mapPedido));
                }
                if (id) {
                    const result = await query(
                        `SELECT p.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono,
                                c.email as cliente_email, c.direccion as cliente_direccion
                        FROM pedidos p
                        LEFT JOIN clientes c ON p.cliente_id = c.id
                        WHERE p.id = $1`,
                        [id]
                    );
                    if (result.rows.length === 0) {
                        return res.status(404).json({ error: 'Pedido no encontrado' });
                    }
                    return res.json(mapPedido(result.rows[0]));
                } else {
                    const { estado, clienteId } = req.query;
                    let sql = `
                        SELECT p.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono
                        FROM pedidos p
                        LEFT JOIN clientes c ON p.cliente_id = c.id
                    `;
                    const params = [];
                    const conditions = [];

                    if (estado) {
                        conditions.push(`p.estado = $${params.length + 1}`);
                        params.push(estado);
                    }
                    if (clienteId) {
                        conditions.push(`p.cliente_id = $${params.length + 1}`);
                        params.push(clienteId);
                    }
                    if (conditions.length > 0) {
                        sql += ' WHERE ' + conditions.join(' AND ');
                    }
                    sql += ' ORDER BY p.created_at DESC';

                    const result = await query(sql, params);
                    return res.json(result.rows.map(mapPedido));
                }

            case 'POST':
                const { clienteId: cId, estado, items, subtotal, descuento, total,
                        notas, fechaEntrega, fechaEntregaEstimada, localidad, provincia, costoEnvio, logoImage } = req.body;
                
                const numero = await generateOrderNumber();
                const fechaEntregaFinal = fechaEntrega || fechaEntregaEstimada || null;
                
                const insertResult = await query(
                    `INSERT INTO pedidos (
                        numero, cliente_id, estado, items, subtotal, descuento, total,
                        notas, fecha_entrega, localidad, provincia, costo_envio, logo_image
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    RETURNING *`,
                    [
                        numero,
                        cId || null,
                        estado || 'cotizacion',
                        JSON.stringify(items || []),
                        subtotal || 0,
                        descuento || 0,
                        total || 0,
                        notas || '',
                        fechaEntregaFinal,
                        localidad || null,
                        provincia || null,
                        costoEnvio || 0,
                        logoImage || null
                    ]
                );
                return res.status(201).json(mapPedido(insertResult.rows[0]));

            case 'PUT':
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                const updateData = req.body;
                const updateFechaEntrega = updateData.fechaEntrega || updateData.fechaEntregaEstimada;
                const updateResult = await query(
                    `UPDATE pedidos SET
                        cliente_id = $1, estado = $2, items = $3, subtotal = $4,
                        descuento = $5, total = $6, notas = $7, fecha_entrega = $8,
                        localidad = $9, provincia = $10, costo_envio = $11, logo_image = $12,
                        updated_at = NOW()
                    WHERE id = $13 RETURNING *`,
                    [
                        updateData.clienteId, updateData.estado, JSON.stringify(updateData.items),
                        updateData.subtotal, updateData.descuento, updateData.total,
                        updateData.notas, updateFechaEntrega,
                        updateData.localidad, updateData.provincia, updateData.costoEnvio,
                        updateData.logoImage, id
                    ]
                );
                if (updateResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Pedido no encontrado' });
                }
                return res.json(mapPedido(updateResult.rows[0]));

            case 'PATCH':
                // Update estado
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                const { estado: nuevoEstado, fechaEntrega: fecha, fechaEntregaEstimada: fechaEst } = req.body;
                const patchFecha = fecha || fechaEst;
                
                let patchSql = 'UPDATE pedidos SET estado = $1';
                const patchParams = [nuevoEstado];
                
                if (patchFecha) {
                    patchSql += ', fecha_entrega = $2';
                    patchParams.push(patchFecha);
                }
                
                if (nuevoEstado === 'entregado') {
                    patchSql += `, fecha_entregado = NOW()`;
                }
                
                patchParams.push(id);
                patchSql += ` WHERE id = $${patchParams.length} RETURNING *`;
                
                const patchResult = await query(patchSql, patchParams);
                if (patchResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Pedido no encontrado' });
                }
                return res.json(mapPedido(patchResult.rows[0]));

            case 'DELETE':
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                await query('DELETE FROM pedidos WHERE id = $1', [id]);
                return res.json({ message: 'Pedido eliminado' });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
                return res.status(405).json({ error: `Method ${method} Not Allowed` });
        }
    } catch (error) {
        console.error('Pedidos API Error:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}

// ============================================
// FUNCIONES DE ENVÍOS
// ============================================

async function listarPedidosEnvio(req, res) {
    const { filter } = req.query; // 'pendientes' o 'despachados'
    
    let sql = `
        SELECT p.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono,
               c.email as cliente_email, c.direccion as cliente_direccion
        FROM pedidos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.estado IN ('confirmado', 'en_proceso', 'listo', 'enviado', 'entregado')
    `;
    
    if (filter === 'pendientes') {
        sql += ` AND (p.envio_tracking IS NULL OR p.envio_tracking = '')`;
    } else if (filter === 'despachados') {
        sql += ` AND p.envio_tracking IS NOT NULL AND p.envio_tracking != ''`;
    }
    
    sql += ` ORDER BY p.created_at DESC`;
    
    const result = await query(sql);
    
    // Map con datos de envío
    const pedidos = result.rows.map(row => ({
        ...mapPedido(row),
        envio: {
            estado: row.envio_estado || 'pendiente',
            tracking: row.envio_tracking || null,
            tipo: row.envio_tipo || null,
            sucursalId: row.envio_sucursal_id || null,
            sucursalNombre: row.envio_sucursal_nombre || null,
            costo: parseFloat(row.envio_costo || 0),
            fechaDespacho: row.envio_fecha_despacho || null,
            fechaEntregaEstimada: row.envio_fecha_entrega_estimada || null,
            ultimoEvento: row.envio_ultimo_evento || null
        }
    }));
    
    return res.json(pedidos);
}

async function asignarTracking(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { pedidoId, tracking, sucursalNombre } = req.body;
    
    if (!pedidoId || !tracking) {
        return res.status(400).json({ error: 'pedidoId y tracking son requeridos' });
    }
    
    // Actualizar pedido con tracking
    const result = await query(`
        UPDATE pedidos SET
            envio_tracking = $1,
            envio_sucursal_nombre = $2,
            envio_estado = 'despachado',
            envio_fecha_despacho = NOW(),
            estado = 'enviado',
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
    `, [tracking, sucursalNombre || null, pedidoId]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    const pedido = result.rows[0];
    
    // Obtener datos del cliente
    const clienteResult = await query(
        'SELECT * FROM clientes WHERE id = $1',
        [pedido.cliente_id]
    );
    
    return res.json({
        success: true,
        pedido: mapPedido(pedido),
        cliente: clienteResult.rows[0] || null,
        tracking,
        message: 'Tracking asignado correctamente'
    });
}
