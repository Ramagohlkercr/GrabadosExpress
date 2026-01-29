// Vercel Serverless Function - Cotizaciones
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
                const result = await query(
                    `SELECT cot.*, c.nombre as cliente_nombre
                    FROM cotizaciones cot
                    LEFT JOIN clientes c ON cot.cliente_id = c.id
                    ORDER BY cot.created_at DESC`
                );
                return res.json(result.rows);

            case 'POST':
                const { clienteId, items, total, notas } = req.body;
                const insertResult = await query(
                    `INSERT INTO cotizaciones (cliente_id, items, total, notas)
                    VALUES ($1, $2, $3, $4) RETURNING *`,
                    [clienteId || null, JSON.stringify(items || []), total || 0, notas || '']
                );
                return res.status(201).json(insertResult.rows[0]);

            case 'DELETE':
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                await query('DELETE FROM cotizaciones WHERE id = $1', [id]);
                return res.json({ message: 'Cotización eliminada' });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
                return res.status(405).json({ error: `Method ${method} Not Allowed` });
        }
    } catch (error) {
        console.error('Cotizaciones API Error:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}
