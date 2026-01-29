// Vercel Serverless Function - Configuración
import { query } from './_lib/db.js';
import { handleCors, corsHeaders } from './_lib/cors.js';

export default async function handler(req, res) {
    if (handleCors(req, res)) return;
    corsHeaders(res);

    const { method } = req;

    try {
        switch (method) {
            case 'GET':
                const result = await query('SELECT key, value FROM configuracion');
                const config = {};
                for (const row of result.rows) {
                    config[row.key] = row.value;
                }
                
                // Flatten the config for frontend
                return res.json({
                    nombreNegocio: config.negocio?.nombreNegocio || 'Grabados Express',
                    telefono: config.negocio?.telefono || '',
                    whatsapp: config.negocio?.whatsapp || '',
                    email: config.negocio?.email || '',
                    direccion: config.negocio?.direccion || '',
                    diasHabilesEntrega: config.entregas?.diasHabilesEntrega || 7,
                    diasHabilesMax: config.entregas?.diasHabilesMax || 10,
                    margenDefault: config.precios?.margenDefault || 30,
                    materiales: config.materiales || [],
                    categorias: config.categorias || [],
                });

            case 'PUT':
                const data = req.body;
                
                // Update each config section
                await query(
                    `INSERT INTO configuracion (key, value) VALUES ('negocio', $1)
                    ON CONFLICT (key) DO UPDATE SET value = $1`,
                    [JSON.stringify({
                        nombreNegocio: data.nombreNegocio,
                        telefono: data.telefono,
                        whatsapp: data.whatsapp,
                        email: data.email,
                        direccion: data.direccion
                    })]
                );
                
                await query(
                    `INSERT INTO configuracion (key, value) VALUES ('entregas', $1)
                    ON CONFLICT (key) DO UPDATE SET value = $1`,
                    [JSON.stringify({
                        diasHabilesEntrega: data.diasHabilesEntrega,
                        diasHabilesMax: data.diasHabilesMax
                    })]
                );
                
                await query(
                    `INSERT INTO configuracion (key, value) VALUES ('precios', $1)
                    ON CONFLICT (key) DO UPDATE SET value = $1`,
                    [JSON.stringify({ margenDefault: data.margenDefault })]
                );
                
                if (data.materiales) {
                    await query(
                        `INSERT INTO configuracion (key, value) VALUES ('materiales', $1)
                        ON CONFLICT (key) DO UPDATE SET value = $1`,
                        [JSON.stringify(data.materiales)]
                    );
                }
                
                if (data.categorias) {
                    await query(
                        `INSERT INTO configuracion (key, value) VALUES ('categorias', $1)
                        ON CONFLICT (key) DO UPDATE SET value = $1`,
                        [JSON.stringify(data.categorias)]
                    );
                }
                
                return res.json({ message: 'Configuración actualizada' });

            default:
                res.setHeader('Allow', ['GET', 'PUT']);
                return res.status(405).json({ error: `Method ${method} Not Allowed` });
        }
    } catch (error) {
        console.error('Configuracion API Error:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}
