// Vercel Serverless Function - Insumos
import { query } from './_lib/db.js';
import { handleCors, corsHeaders } from './_lib/cors.js';

export default async function handler(req, res) {
    if (handleCors(req, res)) return;
    corsHeaders(res);

    const { method } = req;
    const id = req.query.id;
    const action = req.query.action; // for /api/insumos?action=low-stock

    try {
        switch (method) {
            case 'GET':
                if (action === 'low-stock') {
                    const result = await query(
                        'SELECT * FROM insumos WHERE stock <= stock_minimo ORDER BY stock'
                    );
                    return res.json(result.rows);
                }
                if (id) {
                    const result = await query('SELECT * FROM insumos WHERE id = $1', [id]);
                    if (result.rows.length === 0) {
                        return res.status(404).json({ error: 'Insumo no encontrado' });
                    }
                    return res.json(result.rows[0]);
                } else {
                    const result = await query('SELECT * FROM insumos ORDER BY nombre');
                    return res.json(result.rows);
                }

            case 'POST':
                const { nombre, unidad, stock, stockMinimo, costoUnitario, proveedor } = req.body;
                const insertResult = await query(
                    `INSERT INTO insumos (nombre, unidad, stock, stock_minimo, costo_unitario, proveedor)
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [nombre, unidad || 'unidad', stock || 0, stockMinimo || 0, costoUnitario || 0, proveedor || '']
                );
                return res.status(201).json(insertResult.rows[0]);

            case 'PUT':
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                const updateData = req.body;
                const updateResult = await query(
                    `UPDATE insumos SET
                        nombre = $1, unidad = $2, stock = $3,
                        stock_minimo = $4, costo_unitario = $5, proveedor = $6
                    WHERE id = $7 RETURNING *`,
                    [updateData.nombre, updateData.unidad, updateData.stock,
                     updateData.stockMinimo, updateData.costoUnitario, updateData.proveedor, id]
                );
                if (updateResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Insumo no encontrado' });
                }
                return res.json(updateResult.rows[0]);

            case 'PATCH':
                // Update stock
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                const { cantidad, tipo } = req.body;
                const current = await query('SELECT stock FROM insumos WHERE id = $1', [id]);
                if (current.rows.length === 0) {
                    return res.status(404).json({ error: 'Insumo no encontrado' });
                }
                const newStock = tipo === 'entrada' 
                    ? current.rows[0].stock + cantidad 
                    : current.rows[0].stock - cantidad;
                const patchResult = await query(
                    'UPDATE insumos SET stock = $1 WHERE id = $2 RETURNING *',
                    [Math.max(0, newStock), id]
                );
                return res.json(patchResult.rows[0]);

            case 'DELETE':
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                await query('DELETE FROM insumos WHERE id = $1', [id]);
                return res.json({ message: 'Insumo eliminado' });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
                return res.status(405).json({ error: `Method ${method} Not Allowed` });
        }
    } catch (error) {
        console.error('Insumos API Error:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}
