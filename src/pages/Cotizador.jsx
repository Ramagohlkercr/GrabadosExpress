import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calculator,
    Plus,
    Minus,
    Trash2,
    Users,
    FileText,
    ShoppingCart,
    MessageCircle,
    Zap,
    Loader2
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import {
    getProductosAsync,
    getClientesAsync,
    saveClienteAsync,
    savePedidoAsync,
    saveCotizacionAsync,
    getConfiguracionAsync,
    ESTADOS_PEDIDO
} from '../lib/storageApi';
import { calcularFechaEntrega, formatearFecha, formatearFechaConDia } from '../lib/dateUtils';
import { mensajeCotizacion, enviarWhatsApp } from '../lib/whatsapp';
import toast from 'react-hot-toast';

export default function Cotizador() {
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(true);

    const [clienteId, setClienteId] = useState('');
    const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '' });
    const [showNuevoCliente, setShowNuevoCliente] = useState(false);

    const [items, setItems] = useState([]);
    const [notas, setNotas] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [productosData, clientesData, configData] = await Promise.all([
                getProductosAsync(),
                getClientesAsync(),
                getConfiguracionAsync()
            ]);
            setProductos(productosData.filter(p => p.activo));
            setClientes(clientesData);
            setConfig(configData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal;
    const fechaEntrega = calcularFechaEntrega();

    function addItem(producto) {
        const existingIndex = items.findIndex(i => i.productoId === producto.id);

        if (existingIndex >= 0) {
            const newItems = [...items];
            newItems[existingIndex].cantidad += 1;
            newItems[existingIndex].subtotal = newItems[existingIndex].cantidad * newItems[existingIndex].precioUnitario;
            setItems(newItems);
        } else {
            setItems([...items, {
                productoId: producto.id,
                producto: producto.nombre,
                material: producto.material,
                cantidad: 1,
                precioUnitario: producto.precioBase,
                subtotal: producto.precioBase,
            }]);
        }
    }

    function updateItemQuantity(index, delta) {
        const newItems = [...items];
        newItems[index].cantidad = Math.max(1, newItems[index].cantidad + delta);
        newItems[index].subtotal = newItems[index].cantidad * newItems[index].precioUnitario;
        setItems(newItems);
    }

    function updateItemPrice(index, precio) {
        const newItems = [...items];
        newItems[index].precioUnitario = precio;
        newItems[index].subtotal = newItems[index].cantidad * precio;
        setItems(newItems);
    }

    function removeItem(index) {
        setItems(items.filter((_, i) => i !== index));
    }

    async function handleCrearCliente() {
        if (!nuevoCliente.nombre.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        try {
            const cliente = await saveClienteAsync(nuevoCliente);
            await loadData();
            setClienteId(cliente.id);
            setShowNuevoCliente(false);
            setNuevoCliente({ nombre: '', telefono: '' });
            toast.success('Cliente creado');
        } catch (error) {
            console.error('Error creating client:', error);
            toast.error('Error al crear cliente');
        }
    }

    async function handleGuardarCotizacion() {
        if (items.length === 0) {
            toast.error('Agregá al menos un producto');
            return;
        }

        try {
            const cotizacion = {
                clienteId: clienteId || null,
                items,
                subtotal,
                total,
                notas,
                estado: 'pendiente',
            };

            await saveCotizacionAsync(cotizacion);
            toast.success('Cotización guardada');

            // If has client and phone, offer to send WhatsApp
            if (clienteId) {
                const cliente = clientes.find(c => c.id === clienteId);
                if (cliente?.telefono) {
                    if (confirm('¿Enviar cotización por WhatsApp?')) {
                        const mensaje = mensajeCotizacion({ ...cotizacion, items }, cliente);
                        enviarWhatsApp(cliente.telefono, mensaje);
                    }
                }
            }

            resetForm();
        } catch (error) {
            console.error('Error saving quotation:', error);
            toast.error('Error al guardar cotización');
        }
    }

    async function handleCrearPedido() {
        if (items.length === 0) {
            toast.error('Agregá al menos un producto');
            return;
        }

        if (!clienteId) {
            toast.error('Seleccioná un cliente');
            return;
        }

        try {
            const pedido = {
                clienteId,
                items,
                subtotal,
                total,
                notas,
                estado: ESTADOS_PEDIDO.CONFIRMADO,
                fechaEntrega: fechaEntrega.fechaEstimada.toISOString(),
            };

            const nuevoPedido = await savePedidoAsync(pedido);
            toast.success('¡Pedido creado!');

            // Offer to send WhatsApp confirmation
            const cliente = clientes.find(c => c.id === clienteId);
            if (cliente?.telefono) {
                if (confirm('¿Enviar confirmación por WhatsApp?')) {
                    enviarWhatsApp(cliente.telefono, `¡Hola ${cliente.nombre}! Tu pedido #${nuevoPedido.numero} fue confirmado. Entrega estimada: ${formatearFecha(fechaEntrega.fechaEstimada)}`);
                }
            }

            resetForm();
            navigate('/pedidos');
        } catch (error) {
            console.error('Error creating order:', error);
            toast.error('Error al crear pedido');
        }
    }

    function resetForm() {
        setItems([]);
        setClienteId('');
        setNotas('');
    }

    function getMaterialBadgeClass(material) {
        const classes = {
            mdf: 'badge-mdf',
            acrilico: 'badge-acrilico',
            ecocuero: 'badge-ecocuero',
            cuero: 'badge-cuero',
        };
        return classes[material] || 'badge-default';
    }

    function getMaterialName(materialId) {
        const mat = config.materiales?.find(m => m.id === materialId);
        return mat?.nombre || materialId;
    }

    if (loading) {
        return (
            <div className="cotizador-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    // Group products by category
    const productosPorCategoria = productos.reduce((acc, p) => {
        const cat = p.categoria || 'otros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {});

    return (
        <div className="cotizador-page">
            <div className="page-header">
                <div className="page-title">
                    <div className="icon">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h1>Cotizador</h1>
                        <p className="text-muted">Creá cotizaciones y pedidos rápidamente</p>
                    </div>
                </div>
            </div>

            <div className="cotizador-layout">
                {/* Left: Product Selection */}
                <div className="productos-panel">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <Zap size={18} />
                                Productos
                            </h3>
                        </div>
                        <div className="card-body">
                            {Object.entries(productosPorCategoria).map(([categoria, prods]) => (
                                <div key={categoria} className="categoria-section">
                                    <h4 className="categoria-title">
                                        {config.categorias?.find(c => c.id === categoria)?.nombre || categoria}
                                    </h4>
                                    <div className="productos-grid">
                                        {prods.map(producto => (
                                            <button
                                                key={producto.id}
                                                className="producto-btn"
                                                onClick={() => addItem(producto)}
                                            >
                                                <span className={`badge ${getMaterialBadgeClass(producto.material)}`}>
                                                    {getMaterialName(producto.material)}
                                                </span>
                                                <span className="producto-nombre">{producto.nombre}</span>
                                                <span className="producto-precio">${producto.precioBase.toLocaleString()}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Quote Details */}
                <div className="cotizacion-panel">
                    {/* Cliente */}
                    <div className="card mb-md">
                        <div className="card-header">
                            <h3 className="card-title">
                                <Users size={18} />
                                Cliente
                            </h3>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowNuevoCliente(true)}
                            >
                                <Plus size={14} />
                                Nuevo
                            </button>
                        </div>
                        <div className="card-body">
                            <select
                                className="form-select"
                                value={clienteId}
                                onChange={(e) => setClienteId(e.target.value)}
                            >
                                <option value="">Sin cliente (cotización rápida)</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="card mb-md">
                        <div className="card-header">
                            <h3 className="card-title">
                                <ShoppingCart size={18} />
                                Detalle ({items.length})
                            </h3>
                        </div>
                        <div className="card-body">
                            {items.length === 0 ? (
                                <div className="empty-items">
                                    <p className="text-muted">Seleccioná productos de la izquierda</p>
                                </div>
                            ) : (
                                <div className="items-list">
                                    {items.map((item, index) => (
                                        <div key={index} className="item-row">
                                            <div className="item-info">
                                                <span className={`badge ${getMaterialBadgeClass(item.material)}`}>
                                                    {getMaterialName(item.material)}
                                                </span>
                                                <span className="item-nombre">{item.producto}</span>
                                            </div>

                                            <div className="item-controls">
                                                <div className="quantity-control">
                                                    <button onClick={() => updateItemQuantity(index, -1)}>
                                                        <Minus size={14} />
                                                    </button>
                                                    <span>{item.cantidad}</span>
                                                    <button onClick={() => updateItemQuantity(index, 1)}>
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                <div className="price-input">
                                                    <span>$</span>
                                                    <input
                                                        type="number"
                                                        value={item.precioUnitario}
                                                        onChange={(e) => updateItemPrice(index, Number(e.target.value))}
                                                        min="0"
                                                    />
                                                </div>

                                                <div className="item-subtotal">
                                                    ${item.subtotal.toLocaleString()}
                                                </div>

                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="card mb-md">
                        <div className="card-body">
                            <textarea
                                className="form-textarea"
                                placeholder="Notas adicionales..."
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                rows="2"
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="card summary-card">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString()}</span>
                        </div>
                        <div className="summary-row total">
                            <span>TOTAL</span>
                            <span className="total-value">${total.toLocaleString()}</span>
                        </div>
                        <div className="summary-row fecha">
                            <span>Entrega estimada</span>
                            <span>{formatearFechaConDia(fechaEntrega.fechaEstimada)}</span>
                        </div>

                        <div className="summary-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={handleGuardarCotizacion}
                                disabled={items.length === 0}
                            >
                                <FileText size={18} />
                                Guardar Cotización
                            </button>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleCrearPedido}
                                disabled={items.length === 0}
                            >
                                <ShoppingCart size={18} />
                                Crear Pedido
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Client Modal */}
            <Modal
                isOpen={showNuevoCliente}
                onClose={() => setShowNuevoCliente(false)}
                title="Nuevo Cliente Rápido"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowNuevoCliente(false)}>
                            Cancelar
                        </button>
                        <button className="btn btn-primary" onClick={handleCrearCliente}>
                            Crear Cliente
                        </button>
                    </>
                }
            >
                <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                        type="text"
                        className="form-input"
                        value={nuevoCliente.nombre}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                        placeholder="Nombre del cliente"
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Teléfono (WhatsApp)</label>
                    <input
                        type="tel"
                        className="form-input"
                        value={nuevoCliente.telefono}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                        placeholder="1123456789"
                    />
                </div>
            </Modal>

            <style>{`
        .cotizador-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 1.5rem;
          align-items: start;
        }
        
        @media (max-width: 1024px) {
          .cotizador-layout {
            grid-template-columns: 1fr;
          }
        }
        
        .categoria-section {
          margin-bottom: 1.5rem;
        }
        
        .categoria-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .productos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 0.5rem;
        }
        
        .producto-btn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        
        .producto-btn:hover {
          border-color: var(--accent);
          background: var(--bg-hover);
        }
        
        .producto-nombre {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .producto-precio {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent);
        }
        
        .empty-items {
          text-align: center;
          padding: 2rem;
        }
        
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .item-row {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .item-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .item-nombre {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .item-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .quantity-control {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          padding: 0.25rem;
        }
        
        .quantity-control button {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
        }
        
        .quantity-control button:hover {
          background: var(--accent);
          color: white;
        }
        
        .quantity-control span {
          min-width: 24px;
          text-align: center;
          font-weight: 600;
        }
        
        .price-input {
          display: flex;
          align-items: center;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          padding: 0.25rem 0.5rem;
        }
        
        .price-input span {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        
        .price-input input {
          width: 60px;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .price-input input:focus {
          outline: none;
        }
        
        .item-subtotal {
          font-weight: 600;
          color: var(--accent);
          min-width: 70px;
          text-align: right;
        }
        
        .summary-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          color: var(--text-secondary);
        }
        
        .summary-row.total {
          border-top: 1px solid var(--border-color);
          margin-top: 0.5rem;
          padding-top: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .total-value {
          font-size: 1.5rem;
          color: var(--accent);
        }
        
        .summary-row.fecha {
          font-size: 0.875rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
          margin-top: 0.5rem;
        }
        
        .summary-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        .summary-actions .btn {
          width: 100%;
          justify-content: center;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .cotizador-page .page-header {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          
          .productos-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }
          
          .producto-btn {
            padding: 0.6rem;
          }
          
          .producto-nombre {
            font-size: 0.8rem;
          }
          
          .producto-precio {
            font-size: 0.8rem;
          }
          
          .item-controls {
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          
          .quantity-control button {
            min-width: 32px;
            min-height: 32px;
          }
          
          .summary-card {
            padding: 1rem;
          }
          
          .total-value {
            font-size: 1.25rem;
          }
        }
        
        /* iPhone Pro Max Optimized */
        @media (max-width: 430px) {
          .cotizador-page {
            padding: 0;
          }
          
          .cotizador-page .page-header h1 {
            font-size: 1.2rem;
          }
          
          .cotizador-page .page-header h1 svg {
            width: 22px;
            height: 22px;
          }
          
          /* Products grid compact */
          .productos-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
          }
          
          .producto-btn {
            padding: 0.5rem;
            border-radius: 10px;
          }
          
          .producto-icon {
            font-size: 1.25rem;
            margin-bottom: 0.25rem;
          }
          
          .producto-nombre {
            font-size: 0.7rem;
            line-height: 1.2;
          }
          
          .producto-precio {
            font-size: 0.7rem;
          }
          
          /* Items list compact */
          .items-list .item-card {
            padding: 0.75rem;
          }
          
          .item-info {
            gap: 0.25rem;
          }
          
          .item-name {
            font-size: 0.85rem;
          }
          
          .item-details {
            font-size: 0.7rem;
          }
          
          .item-price {
            font-size: 0.9rem;
          }
          
          .item-controls {
            gap: 0.5rem;
          }
          
          .quantity-control {
            gap: 0.25rem;
          }
          
          .quantity-control button {
            min-width: 28px;
            min-height: 28px;
          }
          
          .quantity-control span {
            min-width: 24px;
            font-size: 0.85rem;
          }
          
          /* Material/Size selects */
          .material-select,
          .size-inputs {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .material-select select,
          .size-inputs input {
            font-size: 16px;
            padding: 0.5rem;
          }
          
          .size-inputs input {
            width: 60px;
          }
          
          /* Summary card compact */
          .summary-card {
            padding: 0.875rem;
          }
          
          .summary-row {
            font-size: 0.85rem;
            padding: 0.5rem 0;
          }
          
          .total-row {
            font-size: 1rem;
          }
          
          .total-value {
            font-size: 1.35rem;
          }
          
          /* Summary actions */
          .summary-actions {
            gap: 0.5rem;
          }
          
          .summary-actions .btn {
            padding: 0.875rem;
            font-size: 0.9rem;
          }
          
          /* Empty state */
          .empty-cotizacion {
            padding: 2rem 1rem;
          }
          
          .empty-cotizacion svg {
            width: 48px;
            height: 48px;
          }
          
          .empty-cotizacion p {
            font-size: 0.9rem;
          }
        }
      `}</style>
        </div>
    );
}
