// Vercel Serverless Function - Main API Handler
import express from 'express';
import cors from 'cors';

const app = express();

// CORS
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Root endpoint - also serves as health check
app.all('/', (req, res) => {
    // If ?health query param, return simple health check
    if (req.query.health !== undefined) {
        return res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            platform: 'vercel'
        });
    }
    
    res.json({
        name: 'GrabadosExpress API',
        version: '1.0.0',
        status: 'running on Vercel',
        endpoints: {
            health: '/api?health',
            clientes: '/api/clientes',
            productos: '/api/productos',
            insumos: '/api/insumos',
            pedidos: '/api/pedidos',
            configuracion: '/api/configuracion',
            estadisticas: '/api/estadisticas'
        }
    });
});

export default app;
