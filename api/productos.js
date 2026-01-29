// Vercel Serverless Function - Productos
import { query } from './_lib/db.js';
import { handleCors, corsHeaders } from './_lib/cors.js';

export default async function handler(req, res) {
    if (handleCors(req, res)) return;
    corsHeaders(res);

    const { method } = req;
    const id = req.query.id;

    try {
        switch (method) {
            case 'GET':
                if (id) {
                    const result = await query('SELECT * FROM productos WHERE id = $1', [id]);
                    if (result.rows.length === 0) {
                        return res.status(404).json({ error: 'Producto no encontrado' });
                    }
                    return res.json(result.rows[0]);
                } else {
                    const result = await query('SELECT * FROM productos ORDER BY nombre');
                    return res.json(result.rows);
                }

            case 'POST':
                const { nombre, categoria, material, precioBase, tiempoEstimado, activo } = req.body;
                const insertResult = await query(
                    `INSERT INTO productos (nombre, categoria, material, precio_base, tiempo_estimado, activo)
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [nombre, categoria, material, precioBase || 0, tiempoEstimado || 5, activo !== false]
                );
                return res.status(201).json(insertResult.rows[0]);

            case 'PUT':
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                const updateData = req.body;
                const updateResult = await query(
                    `UPDATE productos SET
                        nombre = $1, categoria = $2, material = $3,
                        precio_base = $4, tiempo_estimado = $5, activo = $6
                    WHERE id = $7 RETURNING *`,
                    [updateData.nombre, updateData.categoria, updateData.material,
                     updateData.precioBase, updateData.tiempoEstimado, updateData.activo, id]
                );
                if (updateResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Producto no encontrado' });
                }
                return res.json(updateResult.rows[0]);

            case 'DELETE':
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                await query('DELETE FROM productos WHERE id = $1', [id]);
                return res.json({ message: 'Producto eliminado' });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ error: `Method ${method} Not Allowed` });
        }
    } catch (error) {
        console.error('Productos API Error:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}
