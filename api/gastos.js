// ============================================
// GASTOS API - Vercel Serverless Function
// ============================================

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
};

export default async function handler(req, res) {
    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { id, mes, anio } = req.query;

        switch (req.method) {
            case 'GET':
                if (id) {
                    // Get single gasto
                    const [gasto] = await sql`
                        SELECT * FROM gastos WHERE id = ${id}
                    `;
                    if (!gasto) {
                        return res.status(404).json({ error: 'Gasto no encontrado' });
                    }
                    return res.status(200).json(gasto);
                } else if (mes && anio) {
                    // Get gastos by month
                    const gastos = await sql`
                        SELECT * FROM gastos 
                        WHERE EXTRACT(MONTH FROM fecha) = ${mes}
                        AND EXTRACT(YEAR FROM fecha) = ${anio}
                        ORDER BY fecha DESC
                    `;
                    return res.status(200).json(gastos);
                } else {
                    // Get all gastos (last 3 months by default)
                    const gastos = await sql`
                        SELECT * FROM gastos 
                        WHERE fecha >= CURRENT_DATE - INTERVAL '3 months'
                        ORDER BY fecha DESC
                    `;
                    return res.status(200).json(gastos);
                }

            case 'POST':
                const newGasto = req.body;
                const [created] = await sql`
                    INSERT INTO gastos (fecha, categoria, descripcion, monto, proveedor, comprobante, notas)
                    VALUES (
                        ${newGasto.fecha || new Date().toISOString().split('T')[0]},
                        ${newGasto.categoria},
                        ${newGasto.descripcion || null},
                        ${newGasto.monto},
                        ${newGasto.proveedor || null},
                        ${newGasto.comprobante || null},
                        ${newGasto.notas || null}
                    )
                    RETURNING *
                `;
                return res.status(201).json(created);

            case 'PUT':
                if (!id) {
                    return res.status(400).json({ error: 'ID requerido' });
                }
                const updateData = req.body;
                const [updated] = await sql`
                    UPDATE gastos SET
                        fecha = COALESCE(${updateData.fecha}, fecha),
                        categoria = COALESCE(${updateData.categoria}, categoria),
                        descripcion = COALESCE(${updateData.descripcion}, descripcion),
                        monto = COALESCE(${updateData.monto}, monto),
                        proveedor = COALESCE(${updateData.proveedor}, proveedor),
                        comprobante = COALESCE(${updateData.comprobante}, comprobante),
                        notas = COALESCE(${updateData.notas}, notas),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ${id}
                    RETURNING *
                `;
                if (!updated) {
                    return res.status(404).json({ error: 'Gasto no encontrado' });
                }
                return res.status(200).json(updated);

            case 'DELETE':
                if (!id) {
                    return res.status(400).json({ error: 'ID requerido' });
                }
                const [deleted] = await sql`
                    DELETE FROM gastos WHERE id = ${id} RETURNING id
                `;
                if (!deleted) {
                    return res.status(404).json({ error: 'Gasto no encontrado' });
                }
                return res.status(200).json({ success: true, id: deleted.id });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
                return res.status(405).json({ error: `Method ${req.method} not allowed` });
        }
    } catch (error) {
        console.error('Gastos API Error:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}
