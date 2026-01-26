import { query } from '../config/database.js';

// Estados de pedido
export const ESTADOS_PEDIDO = {
    COTIZACION: 'cotizacion',
    CONFIRMADO: 'confirmado',
    EN_PRODUCCION: 'en_produccion',
    TERMINADO: 'terminado',
    LISTO: 'listo',
    ENTREGADO: 'entregado',
    CANCELADO: 'cancelado'
};

// Generate order number
const generateOrderNumber = async () => {
    const result = await query("SELECT nextval('pedido_numero_seq') as num");
    const num = result.rows[0].num;
    return `GE-${String(num).padStart(4, '0')}`;
};

// Get all orders
export const getAll = async (req, res) => {
    try {
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
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
};

// Get order by ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
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

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting order:', error);
        res.status(500).json({ error: 'Error al obtener pedido' });
    }
};

// Create order
export const create = async (req, res) => {
    try {
        const {
            clienteId, estado, items, subtotal, descuento, total,
            notas, fechaEntrega
        } = req.body;

        const numero = await generateOrderNumber();

        const result = await query(
            `INSERT INTO pedidos (
                numero, cliente_id, estado, items, subtotal, descuento, total,
                notas, fecha_entrega
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                numero,
                clienteId || null,
                estado || ESTADOS_PEDIDO.COTIZACION,
                JSON.stringify(items || []),
                subtotal || 0,
                descuento || 0,
                total || 0,
                notas || '',
                fechaEntrega || null
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Error al crear pedido' });
    }
};

// Update order
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            clienteId, estado, items, subtotal, descuento, total,
            notas, fechaEntrega
        } = req.body;

        const result = await query(
            `UPDATE pedidos SET
                cliente_id = $1, estado = $2, items = $3, subtotal = $4,
                descuento = $5, total = $6, notas = $7, fecha_entrega = $8
            WHERE id = $9
            RETURNING *`,
            [
                clienteId, estado, JSON.stringify(items), subtotal,
                descuento, total, notas, fechaEntrega, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Error al actualizar pedido' });
    }
};

// Update order status
export const updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, fechaEntrega } = req.body;

        let sql = 'UPDATE pedidos SET estado = $1';
        const params = [estado];

        if (fechaEntrega) {
            sql += ', fecha_entrega = $2';
            params.push(fechaEntrega);
        }

        if (estado === ESTADOS_PEDIDO.ENTREGADO) {
            sql += `, fecha_entregado = NOW()`;
        }

        sql += ` WHERE id = $${params.length + 1} RETURNING *`;
        params.push(id);

        const result = await query(sql, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
};

// Delete order
export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'DELETE FROM pedidos WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({ message: 'Pedido eliminado', id });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Error al eliminar pedido' });
    }
};

// Get orders for calendar
export const getCalendar = async (req, res) => {
    try {
        const { start, end } = req.query;

        let sql = `
            SELECT p.id, p.numero, p.estado, p.fecha_entrega, p.total,
                   c.nombre as cliente_nombre
            FROM pedidos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            WHERE p.estado NOT IN ('entregado', 'cancelado')
        `;
        const params = [];

        if (start) {
            params.push(start);
            sql += ` AND p.fecha_entrega >= $${params.length}`;
        }

        if (end) {
            params.push(end);
            sql += ` AND p.fecha_entrega <= $${params.length}`;
        }

        sql += ' ORDER BY p.fecha_entrega ASC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting calendar:', error);
        res.status(500).json({ error: 'Error al obtener calendario' });
    }
};
