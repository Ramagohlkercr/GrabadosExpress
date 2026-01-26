import { Router } from 'express';
import * as clientesController from '../controllers/clientes.controller.js';
import * as productosController from '../controllers/productos.controller.js';
import * as insumosController from '../controllers/insumos.controller.js';
import * as pedidosController from '../controllers/pedidos.controller.js';
import * as cotizacionesController from '../controllers/cotizaciones.controller.js';
import * as configuracionController from '../controllers/configuracion.controller.js';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// ============================================
// CLIENTES
// ============================================
router.get('/clientes', clientesController.getAll);
router.get('/clientes/:id', clientesController.getById);
router.post('/clientes', clientesController.create);
router.put('/clientes/:id', clientesController.update);
router.delete('/clientes/:id', clientesController.remove);

// ============================================
// PRODUCTOS
// ============================================
router.get('/productos', productosController.getAll);
router.get('/productos/:id', productosController.getById);
router.post('/productos', productosController.create);
router.put('/productos/:id', productosController.update);
router.delete('/productos/:id', productosController.remove);

// ============================================
// INSUMOS
// ============================================
router.get('/insumos', insumosController.getAll);
router.get('/insumos/low-stock', insumosController.getLowStock);
router.get('/insumos/:id', insumosController.getById);
router.post('/insumos', insumosController.create);
router.put('/insumos/:id', insumosController.update);
router.patch('/insumos/:id/stock', insumosController.updateStock);
router.delete('/insumos/:id', insumosController.remove);

// ============================================
// PEDIDOS
// ============================================
router.get('/pedidos', pedidosController.getAll);
router.get('/pedidos/calendario', pedidosController.getCalendar);
router.get('/pedidos/:id', pedidosController.getById);
router.post('/pedidos', pedidosController.create);
router.put('/pedidos/:id', pedidosController.update);
router.patch('/pedidos/:id/estado', pedidosController.updateEstado);
router.delete('/pedidos/:id', pedidosController.remove);

// ============================================
// COTIZACIONES
// ============================================
router.get('/cotizaciones', cotizacionesController.getAll);
router.post('/cotizaciones', cotizacionesController.create);
router.delete('/cotizaciones/:id', cotizacionesController.remove);

// ============================================
// CONFIGURACIÓN
// ============================================
router.get('/configuracion', configuracionController.getAll);
router.put('/configuracion', configuracionController.update);

// ============================================
// ESTADÍSTICAS
// ============================================
router.get('/estadisticas', configuracionController.getEstadisticas);

// ============================================
// AUTHENTICATION
// ============================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.me);
router.post('/auth/change-password', authMiddleware, authController.changePassword);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
