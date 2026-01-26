import { query } from '../config/database.js';

// Get all supplies
export const getAll = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM insumos ORDER BY nombre ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting supplies:', error);
        res.status(500).json({ error: 'Error al obtener insumos' });
    }
};

// Get supply by ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT * FROM insumos WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Insumo no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting supply:', error);
        res.status(500).json({ error: 'Error al obtener insumo' });
    }
};

// Create supply
export const create = async (req, res) => {
    try {
        const { nombre, unidad, stock, stockMinimo, costoUnitario, proveedor } = req.body;

        const result = await query(
            `INSERT INTO insumos (nombre, unidad, stock, stock_minimo, costo_unitario, proveedor)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [nombre, unidad || 'unidad', stock || 0, stockMinimo || 0, costoUnitario || 0, proveedor || '']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating supply:', error);
        res.status(500).json({ error: 'Error al crear insumo' });
    }
};

// Update supply
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, unidad, stock, stockMinimo, costoUnitario, proveedor } = req.body;

        const result = await query(
            `UPDATE insumos SET
                nombre = $1, unidad = $2, stock = $3,
                stock_minimo = $4, costo_unitario = $5, proveedor = $6
            WHERE id = $7
            RETURNING *`,
            [nombre, unidad, stock, stockMinimo, costoUnitario, proveedor, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Insumo no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating supply:', error);
        res.status(500).json({ error: 'Error al actualizar insumo' });
    }
};

// Update stock
export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad, tipo } = req.body; // tipo: 'entrada' | 'salida'

        const operation = tipo === 'salida' ? '-' : '+';

        const result = await query(
            `UPDATE insumos SET stock = stock ${operation} $1 WHERE id = $2 RETURNING *`,
            [cantidad, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Insumo no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Error al actualizar stock' });
    }
};

// Delete supply
export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'DELETE FROM insumos WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Insumo no encontrado' });
        }

        res.json({ message: 'Insumo eliminado', id });
    } catch (error) {
        console.error('Error deleting supply:', error);
        res.status(500).json({ error: 'Error al eliminar insumo' });
    }
};

// Get low stock alerts
export const getLowStock = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM insumos WHERE stock <= stock_minimo ORDER BY nombre ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting low stock:', error);
        res.status(500).json({ error: 'Error al obtener alertas de stock' });
    }
};
