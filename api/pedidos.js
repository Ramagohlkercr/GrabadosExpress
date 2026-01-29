// Vercel Serverless Function - Pedidos
import { query } from './_lib/db.js';
import { handleCors, corsHeaders } from './_lib/cors.js';

// Generate order number
async function generateOrderNumber() {
    const result = await query("SELECT nextval('pedido_numero_seq') as num");
    const num = result.rows[0].num;
    return `GE-${String(num).padStart(4, '0')}`;
}

export default async function handler(req, res) {
    if (handleCors(req, res)) return;
    corsHeaders(res);

    const { method } = req;
    const id = req.query.id;
    const action = req.query.action; // for estado updates and calendario

    try {
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
                    return res.json(result.rows);
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
                    return res.json(result.rows[0]);
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
                    return res.json(result.rows);
                }

            case 'POST':
                const { clienteId: cId, estado, items, subtotal, descuento, total,
                        notas, fechaEntrega, localidad, provincia, costoEnvio, logoImage } = req.body;
                
                const numero = await generateOrderNumber();
                
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
                        fechaEntrega || null,
                        localidad || null,
                        provincia || null,
                        costoEnvio || 0,
                        logoImage || null
                    ]
                );
                return res.status(201).json(insertResult.rows[0]);

            case 'PUT':
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                const updateData = req.body;
                const updateResult = await query(
                    `UPDATE pedidos SET
                        cliente_id = $1, estado = $2, items = $3, subtotal = $4,
                        descuento = $5, total = $6, notas = $7, fecha_entrega = $8,
                        localidad = $9, provincia = $10, costo_envio = $11, logo_image = $12
                    WHERE id = $13 RETURNING *`,
                    [
                        updateData.clienteId, updateData.estado, JSON.stringify(updateData.items),
                        updateData.subtotal, updateData.descuento, updateData.total,
                        updateData.notas, updateData.fechaEntrega,
                        updateData.localidad, updateData.provincia, updateData.costoEnvio,
                        updateData.logoImage, id
                    ]
                );
                if (updateResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Pedido no encontrado' });
                }
                return res.json(updateResult.rows[0]);

            case 'PATCH':
                // Update estado
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                const { estado: nuevoEstado, fechaEntrega: fecha } = req.body;
                
                let patchSql = 'UPDATE pedidos SET estado = $1';
                const patchParams = [nuevoEstado];
                
                if (fecha) {
                    patchSql += ', fecha_entrega = $2';
                    patchParams.push(fecha);
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
                return res.json(patchResult.rows[0]);

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
