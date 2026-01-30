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
        const inicioAnio = new Date(now.getFullYear(), 0, 1).toISOString();
        const hace6Meses = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

        // Get counts
        const [
            clientesTotal,
            productosTotal,
            pedidosActivos,
            pedidosAtrasados,
            pedidosMes,
            ventasMes,
            ventasAnio,
            stockBajo,
            porEstado,
            ventasPorMes,
            productosMasVendidos,
            clientesTop,
            pedidosPorDia
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
            query(`SELECT COALESCE(SUM(total), 0) as total FROM pedidos 
                   WHERE estado = 'entregado' AND created_at >= $1`, [inicioAnio]),
            query(`SELECT COUNT(*) as count FROM insumos 
                   WHERE stock <= stock_minimo`),
            query(`SELECT estado, COUNT(*) as count FROM pedidos 
                   WHERE estado NOT IN ('entregado', 'cancelado') 
                   GROUP BY estado`),
            // Ventas por mes (últimos 6 meses)
            query(`SELECT 
                    DATE_TRUNC('month', created_at) as mes,
                    COUNT(*) as cantidad,
                    COALESCE(SUM(total), 0) as total
                   FROM pedidos 
                   WHERE estado = 'entregado' AND created_at >= $1
                   GROUP BY DATE_TRUNC('month', created_at)
                   ORDER BY mes`, [hace6Meses]),
            // Productos más vendidos (del JSON items)
            query(`SELECT 
                    item->>'producto' as producto,
                    SUM((item->>'cantidad')::int) as cantidad_total,
                    SUM((item->>'subtotal')::decimal) as ventas_total
                   FROM pedidos, jsonb_array_elements(items) as item
                   WHERE estado = 'entregado' AND created_at >= $1
                   GROUP BY item->>'producto'
                   ORDER BY cantidad_total DESC
                   LIMIT 5`, [inicioAnio]),
            // Clientes top (más compras)
            query(`SELECT 
                    c.id, c.nombre,
                    COUNT(p.id) as pedidos,
                    COALESCE(SUM(p.total), 0) as total_compras
                   FROM clientes c
                   LEFT JOIN pedidos p ON p.cliente_id = c.id AND p.estado = 'entregado'
                   GROUP BY c.id, c.nombre
                   HAVING COUNT(p.id) > 0
                   ORDER BY total_compras DESC
                   LIMIT 5`),
            // Pedidos por día (últimos 30 días)
            query(`SELECT 
                    DATE(created_at) as fecha,
                    COUNT(*) as cantidad
                   FROM pedidos
                   WHERE created_at >= NOW() - INTERVAL '30 days'
                   GROUP BY DATE(created_at)
                   ORDER BY fecha`)
        ]);

        // Build estado counts
        const pedidosPorEstado = {};
        for (const row of porEstado.rows) {
            pedidosPorEstado[row.estado] = parseInt(row.count);
        }

        // Format ventas por mes
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const ventasMensuales = ventasPorMes.rows.map(row => ({
            mes: meses[new Date(row.mes).getMonth()],
            cantidad: parseInt(row.cantidad),
            total: parseFloat(row.total)
        }));

        return res.json({
            clientesTotal: parseInt(clientesTotal.rows[0].count),
            productosTotal: parseInt(productosTotal.rows[0].count),
            pedidosActivos: parseInt(pedidosActivos.rows[0].count),
            pedidosAtrasados: parseInt(pedidosAtrasados.rows[0].count),
            pedidosMes: parseInt(pedidosMes.rows[0].count),
            ingresosMes: parseFloat(ventasMes.rows[0].total),
            ventasMes: parseFloat(ventasMes.rows[0].total),
            ventasAnio: parseFloat(ventasAnio.rows[0].total),
            insumosStockBajo: parseInt(stockBajo.rows[0].count),
            stockBajo: parseInt(stockBajo.rows[0].count),
            pedidosPorEstado,
            pedidosConfirmados: pedidosPorEstado.confirmado || 0,
            pedidosEnProduccion: pedidosPorEstado.en_produccion || 0,
            pedidosTerminados: pedidosPorEstado.terminado || 0,
            // Estadísticas avanzadas
            ventasMensuales,
            productosMasVendidos: productosMasVendidos.rows.map(row => ({
                producto: row.producto,
                cantidad: parseInt(row.cantidad_total),
                ventas: parseFloat(row.ventas_total)
            })),
            clientesTop: clientesTop.rows.map(row => ({
                id: row.id,
                nombre: row.nombre,
                pedidos: parseInt(row.pedidos),
                totalCompras: parseFloat(row.total_compras)
            })),
            pedidosPorDia: pedidosPorDia.rows.map(row => ({
                fecha: row.fecha,
                cantidad: parseInt(row.cantidad)
            }))
        });
    } catch (error) {
        console.error('Estadisticas API Error:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}
