// Vercel Serverless Function - Clientes
import { query } from './_lib/db.js';
import { handleCors, corsHeaders } from './_lib/cors.js';

export default async function handler(req, res) {
    if (handleCors(req, res)) return;
    corsHeaders(res);

    const { method } = req;
    
    // Extract ID from query if present (for /api/clientes?id=xxx)
    const id = req.query.id;

    try {
        switch (method) {
            case 'GET':
                if (id) {
                    // Get single client
                    const result = await query('SELECT * FROM clientes WHERE id = $1', [id]);
                    if (result.rows.length === 0) {
                        return res.status(404).json({ error: 'Cliente no encontrado' });
                    }
                    return res.json(result.rows[0]);
                } else {
                    // Get all clients
                    const result = await query('SELECT * FROM clientes ORDER BY created_at DESC');
                    return res.json(result.rows);
                }

            case 'POST':
                const { nombre, telefono, email, direccion, ciudad, provincia, notas,
                        nombreMarca, logoImage, logoNombre, formaEtiqueta,
                        medidaAncho, medidaAlto, colorPreferido } = req.body;
                
                const insertResult = await query(
                    `INSERT INTO clientes (nombre, telefono, email, direccion, ciudad, provincia, notas,
                        nombre_marca, logo_image, logo_nombre, forma_etiqueta,
                        medida_ancho, medida_alto, color_preferido)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING *`,
                    [nombre, telefono || null, email || null, direccion || null,
                     ciudad || null, provincia || null, notas || null,
                     nombreMarca || null, logoImage || null, logoNombre || null,
                     formaEtiqueta || null, medidaAncho || null, medidaAlto || null,
                     colorPreferido || null]
                );
                return res.status(201).json(insertResult.rows[0]);

            case 'PUT':
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                
                const updateData = req.body;
                const updateResult = await query(
                    `UPDATE clientes SET
                        nombre = $1, telefono = $2, email = $3, direccion = $4,
                        ciudad = $5, provincia = $6, notas = $7,
                        nombre_marca = $8, logo_image = $9, logo_nombre = $10,
                        forma_etiqueta = $11, medida_ancho = $12, medida_alto = $13,
                        color_preferido = $14, updated_at = NOW()
                    WHERE id = $15 RETURNING *`,
                    [updateData.nombre, updateData.telefono, updateData.email,
                     updateData.direccion, updateData.ciudad, updateData.provincia,
                     updateData.notas, updateData.nombreMarca, updateData.logoImage,
                     updateData.logoNombre, updateData.formaEtiqueta, updateData.medidaAncho,
                     updateData.medidaAlto, updateData.colorPreferido, id]
                );
                if (updateResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Cliente no encontrado' });
                }
                return res.json(updateResult.rows[0]);

            case 'DELETE':
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                await query('DELETE FROM clientes WHERE id = $1', [id]);
                return res.json({ message: 'Cliente eliminado' });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ error: `Method ${method} Not Allowed` });
        }
    } catch (error) {
        console.error('Clientes API Error:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}
