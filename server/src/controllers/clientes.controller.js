import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Get all clients
export const getAll = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM clientes ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting clients:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
};

// Get client by ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT * FROM clientes WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting client:', error);
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
};

// Create client
export const create = async (req, res) => {
    try {
        const {
            nombre, telefono, email, direccion, ciudad, provincia, notas,
            nombreMarca, logoImage, logoNombre, formaEtiqueta,
            medidaAncho, medidaAlto, colorPreferido
        } = req.body;

        const result = await query(
            `INSERT INTO clientes (
                nombre, telefono, email, direccion, ciudad, provincia, notas,
                nombre_marca, logo_image, logo_nombre, forma_etiqueta,
                medida_ancho, medida_alto, color_preferido
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`,
            [
                nombre, telefono, email, direccion, ciudad, provincia, notas,
                nombreMarca, logoImage, logoNombre, formaEtiqueta,
                medidaAncho || null, medidaAlto || null, colorPreferido
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
};

// Update client
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre, telefono, email, direccion, ciudad, provincia, notas,
            nombreMarca, logoImage, logoNombre, formaEtiqueta,
            medidaAncho, medidaAlto, colorPreferido
        } = req.body;

        const result = await query(
            `UPDATE clientes SET
                nombre = $1, telefono = $2, email = $3, direccion = $4,
                ciudad = $5, provincia = $6, notas = $7, nombre_marca = $8,
                logo_image = $9, logo_nombre = $10, forma_etiqueta = $11,
                medida_ancho = $12, medida_alto = $13, color_preferido = $14
            WHERE id = $15
            RETURNING *`,
            [
                nombre, telefono, email, direccion, ciudad, provincia, notas,
                nombreMarca, logoImage, logoNombre, formaEtiqueta,
                medidaAncho || null, medidaAlto || null, colorPreferido, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
};

// Delete client
export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'DELETE FROM clientes WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ message: 'Cliente eliminado', id });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
};
