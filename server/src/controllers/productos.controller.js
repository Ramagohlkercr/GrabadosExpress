import { query } from '../config/database.js';

// Get all products
export const getAll = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM productos ORDER BY nombre ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
};

// Get product by ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT * FROM productos WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
};

// Create product
export const create = async (req, res) => {
    try {
        const { nombre, categoria, material, precioBase, tiempoEstimado, activo } = req.body;

        const result = await query(
            `INSERT INTO productos (nombre, categoria, material, precio_base, tiempo_estimado, activo)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [nombre, categoria, material, precioBase || 0, tiempoEstimado || 5, activo !== false]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
};

// Update product
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, categoria, material, precioBase, tiempoEstimado, activo } = req.body;

        const result = await query(
            `UPDATE productos SET
                nombre = $1, categoria = $2, material = $3,
                precio_base = $4, tiempo_estimado = $5, activo = $6
            WHERE id = $7
            RETURNING *`,
            [nombre, categoria, material, precioBase, tiempoEstimado, activo, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
};

// Delete product
export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'DELETE FROM productos WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado', id });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
};
