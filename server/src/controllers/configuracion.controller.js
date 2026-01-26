import { query } from '../config/database.js';

// Get all configuration
export const getAll = async (req, res) => {
    try {
        const result = await query('SELECT * FROM configuracion');

        // Convert to object format
        const config = {};
        result.rows.forEach(row => {
            config[row.key] = row.value;
        });

        res.json(config);
    } catch (error) {
        console.error('Error getting configuration:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
};

// Update configuration
export const update = async (req, res) => {
    try {
        const configs = req.body;

        for (const [key, value] of Object.entries(configs)) {
            await query(
                `INSERT INTO configuracion (key, value)
                VALUES ($1, $2)
                ON CONFLICT (key) DO UPDATE SET value = $2`,
                [key, JSON.stringify(value)]
            );
        }

        // Return updated config
        const result = await query('SELECT * FROM configuracion');
        const config = {};
        result.rows.forEach(row => {
            config[row.key] = row.value;
        });

        res.json(config);
    } catch (error) {
        console.error('Error updating configuration:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
};

// Get dashboard statistics
export const getEstadisticas = async (req, res) => {
    try {
        // Total clients
        const clientesResult = await query('SELECT COUNT(*) as total FROM clientes');

        // Total products
        const productosResult = await query('SELECT COUNT(*) as total FROM productos WHERE activo = true');

        // Orders by status
        const pedidosResult = await query(`
            SELECT estado, COUNT(*) as total
            FROM pedidos
            GROUP BY estado
        `);

        // Active orders (not delivered or cancelled)
        const activosResult = await query(`
            SELECT COUNT(*) as total FROM pedidos
            WHERE estado NOT IN ('entregado', 'cancelado')
        `);

        // Delayed orders
        const atrasadosResult = await query(`
            SELECT COUNT(*) as total FROM pedidos
            WHERE estado NOT IN ('entregado', 'cancelado')
            AND fecha_entrega < NOW()
        `);

        // Revenue this month
        const ventasResult = await query(`
            SELECT COALESCE(SUM(total), 0) as total
            FROM pedidos
            WHERE estado = 'entregado'
            AND fecha_entregado >= DATE_TRUNC('month', NOW())
        `);

        // Orders this month
        const pedidosMesResult = await query(`
            SELECT COUNT(*) as total FROM pedidos
            WHERE created_at >= DATE_TRUNC('month', NOW())
        `);

        // Low stock alerts
        const stockBajoResult = await query(`
            SELECT COUNT(*) as total FROM insumos
            WHERE stock <= stock_minimo
        `);

        // Orders per status
        const estadosCount = {};
        pedidosResult.rows.forEach(row => {
            estadosCount[row.estado] = parseInt(row.total);
        });

        res.json({
            totalClientes: parseInt(clientesResult.rows[0].total),
            totalProductos: parseInt(productosResult.rows[0].total),
            pedidosActivos: parseInt(activosResult.rows[0].total),
            pedidosAtrasados: parseInt(atrasadosResult.rows[0].total),
            pedidosConfirmados: estadosCount['confirmado'] || 0,
            pedidosEnProduccion: estadosCount['en_produccion'] || 0,
            pedidosTerminados: estadosCount['terminado'] || 0,
            pedidosMes: parseInt(pedidosMesResult.rows[0].total),
            ventasMes: parseFloat(ventasResult.rows[0].total),
            stockBajo: parseInt(stockBajoResult.rows[0].total),
            pedidosPorEstado: estadosCount
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};
