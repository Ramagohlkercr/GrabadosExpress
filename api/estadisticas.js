// Vercel Serverless Function - Estadísticas
import { query } from './_lib/db.js';
import { handleCors, corsHeaders } from './_lib/cors.js';

export default async function handler(req, res) {
    if (handleCors(req, res)) return;
    corsHeaders(res);

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        const now = new Date();
        const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Get counts
        const [
            clientesTotal,
            productosTotal,
            pedidosActivos,
            pedidosAtrasados,
            pedidosMes,
            ventasMes,
            stockBajo,
            porEstado
        ] = await Promise.all([
            query('SELECT COUNT(*) as count FROM clientes'),
            query('SELECT COUNT(*) as count FROM productos WHERE activo = true'),
            query(`SELECT COUNT(*) as count FROM pedidos 
                   WHERE estado NOT IN ('entregado', 'cancelado')`),
            query(`SELECT COUNT(*) as count FROM pedidos 
                   WHERE estado NOT IN ('entregado', 'cancelado') 
                   AND fecha_entrega < NOW()`),
            query(`SELECT COUNT(*) as count FROM pedidos 
                   WHERE created_at >= $1`, [inicioMes]),
            query(`SELECT COALESCE(SUM(total), 0) as total FROM pedidos 
                   WHERE estado = 'entregado' AND created_at >= $1`, [inicioMes]),
            query(`SELECT COUNT(*) as count FROM insumos 
                   WHERE stock <= stock_minimo`),
            query(`SELECT estado, COUNT(*) as count FROM pedidos 
                   WHERE estado NOT IN ('entregado', 'cancelado') 
                   GROUP BY estado`)
        ]);

        // Build estado counts
        const pedidosPorEstado = {};
        for (const row of porEstado.rows) {
            pedidosPorEstado[row.estado] = parseInt(row.count);
        }

        return res.json({
            clientesTotal: parseInt(clientesTotal.rows[0].count),
            productosTotal: parseInt(productosTotal.rows[0].count),
            pedidosActivos: parseInt(pedidosActivos.rows[0].count),
            pedidosAtrasados: parseInt(pedidosAtrasados.rows[0].count),
            pedidosMes: parseInt(pedidosMes.rows[0].count),
            ventasMes: parseFloat(ventasMes.rows[0].total),
            stockBajo: parseInt(stockBajo.rows[0].count),
            pedidosPorEstado,
            pedidosConfirmados: pedidosPorEstado.confirmado || 0,
            pedidosEnProduccion: pedidosPorEstado.en_produccion || 0,
            pedidosTerminados: pedidosPorEstado.terminado || 0,
        });
    } catch (error) {
        console.error('Estadisticas API Error:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}
