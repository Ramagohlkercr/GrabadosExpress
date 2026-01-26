import { query } from '../config/database.js';

// Get all quotations
export const getAll = async (req, res) => {
    try {
        const result = await query(
            `SELECT co.*, c.nombre as cliente_nombre
            FROM cotizaciones co
            LEFT JOIN clientes c ON co.cliente_id = c.id
            ORDER BY co.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting quotations:', error);
        res.status(500).json({ error: 'Error al obtener cotizaciones' });
    }
};

// Create quotation
export const create = async (req, res) => {
    try {
        const { clienteId, items, total, notas } = req.body;

        const result = await query(
            `INSERT INTO cotizaciones (cliente_id, items, total, notas)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [clienteId || null, JSON.stringify(items || []), total || 0, notas || '']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating quotation:', error);
        res.status(500).json({ error: 'Error al crear cotización' });
    }
};

// Delete quotation
export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'DELETE FROM cotizaciones WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cotización no encontrada' });
        }

        res.json({ message: 'Cotización eliminada', id });
    } catch (error) {
        console.error('Error deleting quotation:', error);
        res.status(500).json({ error: 'Error al eliminar cotización' });
    }
};
