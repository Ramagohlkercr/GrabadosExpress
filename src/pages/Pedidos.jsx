import { useState, useEffect } from 'react';
import {
    ClipboardList,
    Search,
    Filter,
    Eye,
    Play,
    CheckCircle,
    Truck,
    MessageCircle,
    X,
    Calendar,
    Clock,
    DollarSign,
    AlertTriangle,
    Plus,
    Image,
    Ruler,
    Palette,
    Loader2,
    Edit,
    Trash2,
    Save,
    MapPin
} from 'lucide-react';
import OrderTimeline from '../components/OrderTimeline';
import Modal from '../components/ui/Modal';
import {
    getPedidosAsync,
    getClientesAsync,
    getProductosAsync,
    getConfiguracionAsync,
    saveClienteAsync,
    savePedidoAsync,
    updateEstadoPedidoAsync,
    deletePedidoAsync,
    ESTADOS_PEDIDO,
    ESTADOS_LABELS
} from '../lib/storageApi';
import {
    formatearFecha,
    formatearFechaRelativa,
    getNivelUrgencia,
    calcularFechaEntrega
} from '../lib/dateUtils';
import { enviarMensajePedido } from '../lib/whatsapp';
import toast from 'react-hot-toast';

export default function Pedidos() {
    const [pedidos, setPedidos] = useState([]);
    const [filteredPedidos, setFilteredPedidos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [config, setConfig] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [selectedPedido, setSelectedPedido] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingPedido, setEditingPedido] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New order form state
    const [orderForm, setOrderForm] = useState({
        clienteId: '',
        nuevoClienteNombre: '',
        nuevoClienteTelefono: '',
        crearNuevoCliente: false,
        items: [],
        notas: '',
        localidad: '',
        provincia: '',
    });

    // Current item being added
    const [currentItem, setCurrentItem] = useState({
        producto: '',
        material: 'mdf',
        cantidad: 1,
        medidaAncho: '',
        medidaAlto: '',
        color: '',
        logoFile: null,
        logoPreview: null,
        precioUnitario: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        let filtered = pedidos;

        if (searchTerm) {
            filtered = filtered.filter(p => {
                const cliente = clientes.find(c => c.id === p.clienteId);
                return (
                    p.numero?.toString().includes(searchTerm) ||
                    cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }

        if (filterEstado) {
            filtered = filtered.filter(p => p.estado === filterEstado);
        }

        // Sort by urgency and date
        filtered.sort((a, b) => {
            const urgA = getNivelUrgencia(a.fechaEntregaEstimada);
            const urgB = getNivelUrgencia(b.fechaEntregaEstimada);
            const urgOrder = { atrasado: 0, hoy: 1, urgente: 2, proximo: 3, normal: 4 };

            if (urgOrder[urgA] !== urgOrder[urgB]) {
                return urgOrder[urgA] - urgOrder[urgB];
            }

            return new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at);
        });

        setFilteredPedidos(filtered);
    }, [searchTerm, filterEstado, pedidos, clientes]);

    async function loadData() {
        try {
            setLoading(true);
            const [pedidosData, clientesData, productosData, configData] = await Promise.all([
                getPedidosAsync(),
                getClientesAsync(),
                getProductosAsync(),
                getConfiguracionAsync()
            ]);
            setPedidos(pedidosData);
            setClientes(clientesData);
            setProductos(productosData.filter(p => p.activo));
            setConfig(configData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }

    function getCliente(clienteId) {
        return clientes.find(c => c.id === clienteId);
    }

    async function handleChangeEstado(pedido, nuevoEstado) {
        let fechaEntrega = pedido.fechaEntregaEstimada;

        // If moving to production and no delivery date yet, calculate it
        if (nuevoEstado === ESTADOS_PEDIDO.EN_PRODUCCION && !fechaEntrega) {
            fechaEntrega = calcularFechaEntrega().fechaEstimada.toISOString();
        }

        try {
            await updateEstadoPedidoAsync(pedido.id, nuevoEstado, fechaEntrega);
            toast.success(`Estado actualizado: ${ESTADOS_LABELS[nuevoEstado].label}`);
            await loadData();

            // Offer to send WhatsApp
            const cliente = getCliente(pedido.clienteId);
            if (cliente?.telefono) {
                let tipoMensaje = null;
                if (nuevoEstado === ESTADOS_PEDIDO.EN_PRODUCCION) tipoMensaje = 'produccion';
                if (nuevoEstado === ESTADOS_PEDIDO.TERMINADO) tipoMensaje = 'terminado';

                if (tipoMensaje && confirm('¿Notificar al cliente por WhatsApp?')) {
                    enviarMensajePedido({ ...pedido, estado: nuevoEstado, fechaEntregaEstimada: fechaEntrega }, tipoMensaje);
                }
            }
        } catch (error) {
            console.error('Error updating estado:', error);
            toast.error('Error al actualizar estado');
        }
    }

    async function handleDeletePedido(pedido) {
        const cliente = getCliente(pedido.clienteId);
        const confirmMessage = `¿Estás seguro de eliminar el pedido #${pedido.numero}?\n\nCliente: ${cliente?.nombre || 'Sin cliente'}\nTotal: $${pedido.total?.toLocaleString() || 0}\n\nEsta acción no se puede deshacer.`;
        
        if (confirm(confirmMessage)) {
            try {
                await deletePedidoAsync(pedido.id);
                toast.success(`Pedido #${pedido.numero} eliminado`);
                await loadData();
            } catch (error) {
                console.error('Error deleting pedido:', error);
                toast.error('Error al eliminar pedido');
            }
        }
    }

    function openDetail(pedido) {
        setSelectedPedido(pedido);
        setDetailModalOpen(true);
    }

    function handleWhatsApp(pedido, tipo) {
        enviarMensajePedido(pedido, tipo);
    }

    function getNextEstado(estado) {
        const flow = {
            [ESTADOS_PEDIDO.COTIZACION]: ESTADOS_PEDIDO.CONFIRMADO,
            [ESTADOS_PEDIDO.CONFIRMADO]: ESTADOS_PEDIDO.EN_PRODUCCION,
            [ESTADOS_PEDIDO.EN_PRODUCCION]: ESTADOS_PEDIDO.TERMINADO,
            [ESTADOS_PEDIDO.TERMINADO]: ESTADOS_PEDIDO.ENTREGADO,
        };
        return flow[estado];
    }

    function getNextEstadoLabel(estado) {
        const labels = {
            [ESTADOS_PEDIDO.COTIZACION]: 'Confirmar',
            [ESTADOS_PEDIDO.CONFIRMADO]: 'Iniciar Producción',
            [ESTADOS_PEDIDO.EN_PRODUCCION]: 'Marcar Terminado',
            [ESTADOS_PEDIDO.TERMINADO]: 'Marcar Entregado',
        };
        return labels[estado];
    }

    function getNextEstadoIcon(estado) {
        const icons = {
            [ESTADOS_PEDIDO.COTIZACION]: CheckCircle,
            [ESTADOS_PEDIDO.CONFIRMADO]: Play,
            [ESTADOS_PEDIDO.EN_PRODUCCION]: CheckCircle,
            [ESTADOS_PEDIDO.TERMINADO]: Truck,
        };
        return icons[estado] || CheckCircle;
    }

    // New Order Functions
    function openNewOrderModal() {
        setEditingPedido(null);
        setOrderForm({
            clienteId: '',
            nuevoClienteNombre: '',
            nuevoClienteTelefono: '',
            crearNuevoCliente: false,
            items: [],
            notas: '',
            localidad: '',
            provincia: '',
        });
        setCurrentItem({
            producto: '',
            material: 'mdf',
            cantidad: 1,
            medidaAncho: '',
            medidaAlto: '',
            color: '',
            logoFile: null,
            logoPreview: null,
            precioUnitario: 0,
        });
        setNewOrderModalOpen(true);
    }

    // Edit Order Functions
    function openEditModal(pedido) {
        setEditingPedido(pedido);
        setDetailModalOpen(false);
        
        // Parse medidas for each item
        const parsedItems = pedido.items?.map((item, idx) => {
            let medidaAncho = '';
            let medidaAlto = '';
            if (item.medidas) {
                const match = item.medidas.match(/(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/);
                if (match) {
                    medidaAncho = match[1];
                    medidaAlto = match[2];
                }
            }
            return {
                ...item,
                id: idx,
                medidaAncho,
                medidaAlto,
                logoPreview: item.logo || null,
            };
        }) || [];

        setOrderForm({
            clienteId: pedido.clienteId || '',
            nuevoClienteNombre: '',
            nuevoClienteTelefono: '',
            crearNuevoCliente: false,
            items: parsedItems,
            notas: pedido.notas || '',
            fechaEntregaEstimada: pedido.fechaEntregaEstimada || '',
            localidad: pedido.localidad || '',
            provincia: pedido.provincia || '',
        });
        
        setCurrentItem({
            producto: '',
            material: 'mdf',
            cantidad: 1,
            medidaAncho: '',
            medidaAlto: '',
            color: '',
            logoFile: null,
            logoPreview: null,
            precioUnitario: 0,
        });
        
        setEditModalOpen(true);
    }

    async function handleSaveEdit() {
        if (orderForm.items.length === 0) {
            toast.error('Agregá al menos un producto');
            return;
        }

        if (!orderForm.clienteId) {
            toast.error('Seleccioná un cliente');
            return;
        }

        try {
            setSaving(true);

            const total = orderForm.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

            const pedidoActualizado = {
                ...editingPedido,
                clienteId: orderForm.clienteId,
                items: orderForm.items.map(item => ({
                    producto: item.producto,
                    material: item.material,
                    cantidad: item.cantidad,
                    medidas: item.medidaAncho && item.medidaAlto ? `${item.medidaAncho}x${item.medidaAlto}cm` : item.medidas,
                    color: item.color || null,
                    logo: item.logoPreview || item.logo || null,
                    precioUnitario: item.precioUnitario,
                    subtotal: item.subtotal || (item.cantidad * item.precioUnitario),
                })),
                subtotal: total,
                total,
                notas: orderForm.notas,
                fechaEntregaEstimada: orderForm.fechaEntregaEstimada || editingPedido.fechaEntregaEstimada,
                localidad: orderForm.localidad || null,
                provincia: orderForm.provincia || null,
            };

            await savePedidoAsync(pedidoActualizado);
            toast.success('¡Pedido actualizado!');

            setEditModalOpen(false);
            setEditingPedido(null);
            await loadData();
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Error al actualizar pedido');
        } finally {
            setSaving(false);
        }
    }

    function handleEditItem(itemId) {
        const item = orderForm.items.find(i => i.id === itemId);
        if (item) {
            setCurrentItem({
                ...item,
                logoPreview: item.logo || item.logoPreview,
            });
            // Remove from list to re-add when edited
            setOrderForm({
                ...orderForm,
                items: orderForm.items.filter(i => i.id !== itemId),
            });
        }
    }

    function handleEditLogoUpload(e, itemId = null) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Image = reader.result;
                if (itemId !== null) {
                    // Update specific item's logo using functional setState
                    setOrderForm(prev => ({
                        ...prev,
                        items: prev.items.map(item => 
                            item.id === itemId 
                                ? { ...item, logo: base64Image, logoPreview: base64Image }
                                : item
                        ),
                    }));
                } else {
                    // Update current item being added using functional setState
                    setCurrentItem(prev => ({
                        ...prev,
                        logoFile: file,
                        logoPreview: base64Image,
                        logo: base64Image,
                    }));
                }
                toast.success('🖼️ Logo actualizado');
            };
            reader.readAsDataURL(file);
        }
    }

    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Image = reader.result;
                setCurrentItem(prev => ({
                    ...prev,
                    logoFile: file,
                    logoPreview: base64Image,
                    logo: base64Image,
                }));
            };
            reader.readAsDataURL(file);
        }
    }

    function addItemToOrder() {
        if (!currentItem.producto) {
            toast.error('Seleccioná un producto');
            return;
        }
        if (!currentItem.cantidad || currentItem.cantidad < 1) {
            toast.error('Ingresá una cantidad válida');
            return;
        }

        const subtotal = currentItem.cantidad * currentItem.precioUnitario;

        setOrderForm({
            ...orderForm,
            items: [...orderForm.items, {
                ...currentItem,
                subtotal,
                id: Date.now(),
            }],
        });

        // Reset current item
        setCurrentItem({
            producto: '',
            material: 'mdf',
            cantidad: 1,
            medidaAncho: '',
            medidaAlto: '',
            color: '',
            logoFile: null,
            logoPreview: null,
            precioUnitario: 0,
        });

        toast.success('Producto agregado');
    }

    function removeItemFromOrder(itemId) {
        setOrderForm({
            ...orderForm,
            items: orderForm.items.filter(i => i.id !== itemId),
        });
    }

    function handleProductSelect(productoId) {
        const prod = productos.find(p => p.id === productoId);
        if (prod) {
            setCurrentItem({
                ...currentItem,
                producto: prod.nombre,
                productoId: prod.id,
                material: prod.material,
                precioUnitario: prod.precioBase,
            });
        }
    }

    async function handleCreateOrder() {
        // Validate
        if (orderForm.items.length === 0) {
            toast.error('Agregá al menos un producto');
            return;
        }

        let clienteId = orderForm.clienteId;

        try {
            setSaving(true);

            // Create new client if needed
            if (orderForm.crearNuevoCliente) {
                if (!orderForm.nuevoClienteNombre.trim()) {
                    toast.error('Ingresá el nombre del cliente');
                    setSaving(false);
                    return;
                }

                const nuevoCliente = await saveClienteAsync({
                    nombre: orderForm.nuevoClienteNombre,
                    telefono: orderForm.nuevoClienteTelefono,
                });
                clienteId = nuevoCliente.id;
            }

            if (!clienteId) {
                toast.error('Seleccioná o creá un cliente');
                setSaving(false);
                return;
            }

            // Calculate totals
            const total = orderForm.items.reduce((sum, item) => sum + item.subtotal, 0);

            // Calculate delivery date (7-10 business days from NOW)
            const fechaEntrega = calcularFechaEntrega(new Date());

            // Create order
            const pedido = {
                clienteId,
                items: orderForm.items.map(item => ({
                    producto: item.producto,
                    material: item.material,
                    cantidad: item.cantidad,
                    medidas: item.medidaAncho && item.medidaAlto ? `${item.medidaAncho}x${item.medidaAlto}cm` : null,
                    color: item.color || null,
                    logo: item.logoPreview || null,
                    precioUnitario: item.precioUnitario,
                    subtotal: item.subtotal,
                })),
                subtotal: total,
                total,
                notas: orderForm.notas,
                localidad: orderForm.localidad || null,
                provincia: orderForm.provincia || null,
                estado: ESTADOS_PEDIDO.CONFIRMADO,
                fechaEntrega: fechaEntrega.fechaEstimada.toISOString(),
            };

            const nuevoPedido = await savePedidoAsync(pedido);
            toast.success('¡Pedido creado! Entrega estimada: ' + formatearFecha(fechaEntrega.fechaEstimada));

            setNewOrderModalOpen(false);
            await loadData();

            // Offer WhatsApp
            const cliente = getCliente(clienteId) || { nombre: orderForm.nuevoClienteNombre, telefono: orderForm.nuevoClienteTelefono };
            if (cliente?.telefono && confirm('¿Enviar confirmación por WhatsApp?')) {
                enviarMensajePedido(nuevoPedido, 'confirmacion');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            toast.error('Error al crear pedido');
        } finally {
            setSaving(false);
        }
    }

    function getMaterialName(materialId) {
        const mat = config.materiales?.find(m => m.id === materialId);
        return mat?.nombre || materialId;
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

    const pedidosActivos = pedidos.filter(p =>
        p.estado !== ESTADOS_PEDIDO.ENTREGADO &&
        p.estado !== ESTADOS_PEDIDO.CANCELADO
    );

    const orderTotal = orderForm.items.reduce((sum, item) => sum + item.subtotal, 0);
    const fechaEntregaPreview = calcularFechaEntrega(new Date());

    if (loading) {
        return (
            <div className="pedidos-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div className="pedidos-page">
            <div className="page-header">
                <div className="page-title">
                    <div className="icon">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h1>Pedidos</h1>
                        <p className="text-muted">
                            {pedidosActivos.length} pedido{pedidosActivos.length !== 1 ? 's' : ''} activo{pedidosActivos.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openNewOrderModal}>
                    <Plus size={18} />
                    Nuevo Pedido
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar mb-lg">
                <div className="search-box">
                    <Search className="icon" size={18} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Buscar por # o cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="form-select"
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                >
                    <option value="">Todos los estados</option>
                    {Object.entries(ESTADOS_LABELS).map(([key, value]) => (
                        <option key={key} value={key}>{value.label}</option>
                    ))}
                </select>
            </div>

            {/* Stats Summary */}
            <div className="pedidos-stats mb-lg">
                {Object.entries(ESTADOS_LABELS)
                    .filter(([key]) => key !== ESTADOS_PEDIDO.CANCELADO)
                    .map(([key, value]) => {
                        const count = pedidos.filter(p => p.estado === key).length;
                        return (
                            <button
                                key={key}
                                className={`stat-btn ${filterEstado === key ? 'active' : ''}`}
                                onClick={() => setFilterEstado(filterEstado === key ? '' : key)}
                                title={value.label}
                            >
                                <span className={`stat-dot ${value.color}`} />
                                <span className="stat-label">{value.label}</span>
                                <span className="stat-label-short">{value.label.slice(0, 3)}</span>
                                <span className="stat-count">{count}</span>
                            </button>
                        );
                    })}
            </div>

            {/* Pedidos List */}
            {filteredPedidos.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <ClipboardList size={32} />
                        </div>
                        <h3 className="empty-state-title">No hay pedidos</h3>
                        <p className="empty-state-description">
                            Creá tu primer pedido con el botón de arriba
                        </p>
                        <button className="btn btn-primary" onClick={openNewOrderModal}>
                            <Plus size={18} />
                            Nuevo Pedido
                        </button>
                    </div>
                </div>
            ) : (
                <div className="pedidos-list">
                    {filteredPedidos.map(pedido => {
                        const cliente = getCliente(pedido.clienteId);
                        const estadoInfo = ESTADOS_LABELS[pedido.estado];
                        const urgencia = getNivelUrgencia(pedido.fechaEntregaEstimada);
                        const nextEstado = getNextEstado(pedido.estado);
                        const NextIcon = getNextEstadoIcon(pedido.estado);

                        return (
                            <div key={pedido.id} className={`pedido-card ${urgencia}`}>
                                <div className="pedido-header">
                                    <div className="pedido-number">
                                        <span className="number">#{pedido.numero}</span>
                                        <span className={`badge badge-${estadoInfo.color}`}>
                                            {estadoInfo.label}
                                        </span>
                                        {urgencia === 'atrasado' && (
                                            <span className="badge badge-danger">
                                                <AlertTriangle size={12} />
                                                Atrasado
                                            </span>
                                        )}
                                    </div>
                                    <div className="pedido-date">
                                        {formatearFecha(pedido.createdAt)}
                                    </div>
                                </div>

                                <div className="pedido-body">
                                    {/* Logo thumbnail */}
                                    {(() => {
                                        const logoSrc = pedido.items?.find(i => i.logo?.startsWith('data:image'))?.logo 
                                            || (pedido.logoImage?.startsWith('data:image') ? pedido.logoImage : null);
                                        return logoSrc ? (
                                            <div className="pedido-logo-thumb" title="Logo del pedido">
                                                <img src={logoSrc} alt="Logo" />
                                            </div>
                                        ) : null;
                                    })()}
                                    
                                    <div className="pedido-content">
                                        <div className="pedido-cliente">
                                            <strong>
                                                {cliente?.nombre || 'Sin cliente'}
                                                {(() => {
                                                    // Buscar nombre del logo en notas o items
                                                    const logoFromNotes = pedido.notas?.match(/Logo:\s*(.+?)(?:$|\n)/i)?.[1]?.trim();
                                                    const logoFromItems = pedido.items?.find(i => i.logo)?.logo;
                                                    const logoName = logoFromNotes || (logoFromItems && !logoFromItems.startsWith('data:') ? logoFromItems : null);
                                                    return logoName ? ` (${logoName})` : '';
                                                })()}
                                            </strong>
                                            {cliente?.telefono && (
                                                <button
                                                    className="btn btn-whatsapp btn-sm"
                                                    onClick={() => handleWhatsApp(pedido, 'recordatorio')}
                                                    title="Enviar WhatsApp"
                                                >
                                                    <MessageCircle size={14} />
                                                </button>
                                            )}
                                    </div>

                                    <div className="pedido-items">
                                        {pedido.items?.slice(0, 2).map((item, i) => (
                                            <span key={i} className="item-tag">
                                                {item.cantidad}x {item.producto}
                                                {item.medidas && ` (${item.medidas})`}
                                                {item.color && ` - ${item.color}`}
                                            </span>
                                        ))}
                                        {pedido.items?.length > 2 && (
                                            <span className="item-tag more">
                                                +{pedido.items.length - 2} más
                                            </span>
                                        )}
                                    </div>

                                    <div className="pedido-meta">
                                        <div className="meta-item">
                                            <DollarSign size={14} />
                                            <span className="font-bold">${pedido.total?.toLocaleString()}</span>
                                        </div>
                                        {pedido.fechaEntregaEstimada && (
                                            <div className={`meta-item ${urgencia === 'atrasado' ? 'text-danger' : urgencia === 'hoy' || urgencia === 'urgente' ? 'text-warning' : ''}`}>
                                                <Calendar size={14} />
                                                <span>{formatearFechaRelativa(pedido.fechaEntregaEstimada)}</span>
                                            </div>
                                        )}
                                        {(pedido.localidad || pedido.provincia) && (
                                            <div className="meta-item text-muted" title="Destino de envío">
                                                <MapPin size={14} />
                                                <span>{[pedido.localidad, pedido.provincia].filter(Boolean).join(', ')}</span>
                                            </div>
                                        )}
                                    </div>
                                    </div>{/* Close pedido-content */}
                                </div>

                                <div className="pedido-actions">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => openDetail(pedido)}
                                    >
                                        <Eye size={14} />
                                        Ver Detalle
                                    </button>

                                    {nextEstado && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleChangeEstado(pedido, nextEstado)}
                                        >
                                            <NextIcon size={14} />
                                            {getNextEstadoLabel(pedido.estado)}
                                        </button>
                                    )}
                                    
                                    <button
                                        className="btn btn-ghost btn-sm text-danger"
                                        onClick={() => handleDeletePedido(pedido)}
                                        title="Eliminar pedido"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={`Pedido #${selectedPedido?.numero}`}
                size="lg"
            >
                {selectedPedido && (
                    <div className="pedido-detail">
                        {/* Timeline */}
                        <div className="detail-section timeline-section">
                            <OrderTimeline estado={selectedPedido.estado} />
                        </div>

                        <div className="detail-section">
                            <h4>Cliente</h4>
                            <p>{getCliente(selectedPedido.clienteId)?.nombre || 'Sin cliente'}</p>
                            {getCliente(selectedPedido.clienteId)?.telefono && (
                                <p className="text-muted">{getCliente(selectedPedido.clienteId).telefono}</p>
                            )}
                        </div>

                        <div className="detail-section">
                            <h4>Estado</h4>
                            <span className={`badge badge-${ESTADOS_LABELS[selectedPedido.estado].color}`}>
                                {ESTADOS_LABELS[selectedPedido.estado].label}
                            </span>
                        </div>

                        <div className="detail-section">
                            <h4>Productos</h4>
                            <div className="detail-items">
                                {selectedPedido.items?.map((item, i) => {
                                    // Check if logo is a valid base64 image
                                    const logoSrc = item.logo || selectedPedido.logoImage;
                                    const isValidImage = logoSrc && (logoSrc.startsWith('data:image') || logoSrc.startsWith('http'));
                                    
                                    return (
                                        <div key={i} className="detail-item">
                                            <div className="detail-item-header">
                                                <span className={`badge ${getMaterialBadgeClass(item.material)}`}>
                                                    {getMaterialName(item.material)}
                                                </span>
                                                <strong>{item.cantidad}x {item.producto}</strong>
                                            </div>
                                            <div className="detail-item-meta">
                                                {item.medidas && <span>📐 {item.medidas}</span>}
                                                {item.color && <span>🎨 {item.color}</span>}
                                            </div>
                                            {isValidImage && (
                                                <div className="detail-item-logo">
                                                    <span className="logo-label">🖼️ Logo:</span>
                                                    <img src={logoSrc} alt="Logo" />
                                                </div>
                                            )}
                                            <div className="detail-item-price">
                                                ${item.precioUnitario?.toLocaleString()} x {item.cantidad} = <strong>${item.subtotal?.toLocaleString()}</strong>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="detail-totals">
                            <div className="total-row">
                                <span>Total</span>
                                <span className="total-value">${selectedPedido.total?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Fechas</h4>
                            <div className="dates-grid">
                                <div>
                                    <span className="text-muted">Creado:</span>
                                    <span>{formatearFecha(selectedPedido.createdAt)}</span>
                                </div>
                                {selectedPedido.fechaEntregaEstimada && (
                                    <div>
                                        <span className="text-muted">Entrega estimada:</span>
                                        <span>{formatearFecha(selectedPedido.fechaEntregaEstimada)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedPedido.notas && (
                            <div className="detail-section">
                                <h4>Notas</h4>
                                <p className="text-muted">{selectedPedido.notas}</p>
                            </div>
                        )}

                        {(selectedPedido.localidad || selectedPedido.provincia) && (
                            <div className="detail-section">
                                <h4>📍 Destino de Envío</h4>
                                <p className="text-muted">
                                    {[selectedPedido.localidad, selectedPedido.provincia].filter(Boolean).join(', ')}
                                </p>
                            </div>
                        )}

                        {/* Edit Button */}
                        <div className="detail-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => openEditModal(selectedPedido)}
                            >
                                <Edit size={16} />
                                Editar Pedido
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Order Modal */}
            <Modal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setEditingPedido(null);
                }}
                title={`Editar Pedido #${editingPedido?.numero}`}
                size="xl"
            >
                <div className="new-order-form">
                    {/* Cliente Section */}
                    <div className="form-section">
                        <h4>👤 Cliente</h4>
                        <select
                            className="form-select"
                            value={orderForm.clienteId}
                            onChange={(e) => setOrderForm({ ...orderForm, clienteId: e.target.value })}
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Items List */}
                    <div className="form-section">
                        <h4>📦 Productos del Pedido</h4>
                        
                        {orderForm.items.length > 0 && (
                            <div className="order-items-list">
                                {orderForm.items.map((item, idx) => (
                                    <div key={item.id || idx} className="order-item-card">
                                        <div className="order-item-info">
                                            <span className={`badge ${getMaterialBadgeClass(item.material)}`}>
                                                {getMaterialName(item.material)}
                                            </span>
                                            <strong>{item.cantidad}x {item.producto}</strong>
                                            <span className="text-muted">
                                                {item.medidas || `${item.medidaAncho}x${item.medidaAlto}cm`}
                                                {item.color && ` - ${item.color}`}
                                            </span>
                                            <span className="item-price">${item.subtotal?.toLocaleString()}</span>
                                        </div>
                                        
                                        {/* Logo preview/upload for this item */}
                                        <div className="order-item-logo">
                                            {(item.logo || item.logoPreview) && (item.logo?.startsWith('data:image') || item.logoPreview?.startsWith('data:image')) ? (
                                                <img src={item.logo || item.logoPreview} alt="Logo" className="item-logo-preview" />
                                            ) : (
                                                <span className="no-logo">Sin logo</span>
                                            )}
                                            <label className="btn btn-sm btn-secondary upload-logo-btn">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleEditLogoUpload(e, item.id)}
                                                    style={{ display: 'none' }}
                                                />
                                                <Image size={14} />
                                                {(item.logo || item.logoPreview) ? 'Cambiar' : 'Subir'}
                                            </label>
                                        </div>
                                        
                                        <div className="order-item-actions">
                                            <button
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => handleEditItem(item.id)}
                                                title="Editar"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-ghost text-danger"
                                                onClick={() => removeItemFromOrder(item.id)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add/Edit Item Form */}
                    <div className="form-section add-item-section">
                        <h4>{currentItem.producto ? '✏️ Editando Producto' : '➕ Agregar Producto'}</h4>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Producto</label>
                                <select
                                    className="form-select"
                                    value={currentItem.productoId || ''}
                                    onChange={(e) => handleProductSelect(e.target.value)}
                                >
                                    <option value="">Seleccionar producto...</option>
                                    {productos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cantidad</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    value={currentItem.cantidad}
                                    onChange={(e) => setCurrentItem({ ...currentItem, cantidad: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Ancho (cm)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={currentItem.medidaAncho}
                                    onChange={(e) => setCurrentItem({ ...currentItem, medidaAncho: e.target.value })}
                                    placeholder="ej: 5"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Alto (cm)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={currentItem.medidaAlto}
                                    onChange={(e) => setCurrentItem({ ...currentItem, medidaAlto: e.target.value })}
                                    placeholder="ej: 2"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Color</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={currentItem.color}
                                    onChange={(e) => setCurrentItem({ ...currentItem, color: e.target.value })}
                                    placeholder="ej: Beige"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Precio Unitario</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={currentItem.precioUnitario}
                                    onChange={(e) => setCurrentItem({ ...currentItem, precioUnitario: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subtotal</label>
                                <div className="subtotal-preview">
                                    ${(currentItem.cantidad * currentItem.precioUnitario).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Logo del Producto</label>
                            <div className="logo-upload-edit">
                                {currentItem.logoPreview && (
                                    <img src={currentItem.logoPreview} alt="Logo preview" className="logo-preview-small" />
                                )}
                                <label className="btn btn-secondary">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleEditLogoUpload(e)}
                                        style={{ display: 'none' }}
                                    />
                                    <Image size={16} />
                                    {currentItem.logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
                                </label>
                            </div>
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={addItemToOrder}
                            disabled={!currentItem.producto}
                        >
                            <Plus size={16} />
                            {currentItem.producto ? 'Guardar Cambios' : 'Agregar Producto'}
                        </button>
                    </div>

                    {/* Notas */}
                    <div className="form-section">
                        <h4>📝 Notas</h4>
                        <textarea
                            className="form-textarea"
                            value={orderForm.notas}
                            onChange={(e) => setOrderForm({ ...orderForm, notas: e.target.value })}
                            placeholder="Notas adicionales..."
                            rows={3}
                        />
                    </div>

                    {/* Envío - Localidad y Provincia */}
                    <div className="form-section">
                        <h4>📍 Destino de Envío</h4>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Localidad</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={orderForm.localidad}
                                    onChange={(e) => setOrderForm({ ...orderForm, localidad: e.target.value })}
                                    placeholder="Ej: Rosario"
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Provincia</label>
                                <select
                                    className="form-select"
                                    value={orderForm.provincia}
                                    onChange={(e) => setOrderForm({ ...orderForm, provincia: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Buenos Aires">Buenos Aires</option>
                                    <option value="CABA">CABA</option>
                                    <option value="Catamarca">Catamarca</option>
                                    <option value="Chaco">Chaco</option>
                                    <option value="Chubut">Chubut</option>
                                    <option value="Córdoba">Córdoba</option>
                                    <option value="Corrientes">Corrientes</option>
                                    <option value="Entre Ríos">Entre Ríos</option>
                                    <option value="Formosa">Formosa</option>
                                    <option value="Jujuy">Jujuy</option>
                                    <option value="La Pampa">La Pampa</option>
                                    <option value="La Rioja">La Rioja</option>
                                    <option value="Mendoza">Mendoza</option>
                                    <option value="Misiones">Misiones</option>
                                    <option value="Neuquén">Neuquén</option>
                                    <option value="Río Negro">Río Negro</option>
                                    <option value="Salta">Salta</option>
                                    <option value="San Juan">San Juan</option>
                                    <option value="San Luis">San Luis</option>
                                    <option value="Santa Cruz">Santa Cruz</option>
                                    <option value="Santa Fe">Santa Fe</option>
                                    <option value="Santiago del Estero">Santiago del Estero</option>
                                    <option value="Tierra del Fuego">Tierra del Fuego</option>
                                    <option value="Tucumán">Tucumán</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Totals and Save */}
                    <div className="order-summary">
                        <div className="summary-row">
                            <span>Total:</span>
                            <span className="summary-total">
                                ${orderForm.items.reduce((sum, item) => sum + (item.subtotal || 0), 0).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setEditModalOpen(false);
                                setEditingPedido(null);
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSaveEdit}
                            disabled={saving || orderForm.items.length === 0}
                        >
                            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </Modal>

            {/* New Order Modal */}
            <Modal
                isOpen={newOrderModalOpen}
                onClose={() => setNewOrderModalOpen(false)}
                title="Nuevo Pedido"
                size="xl"
            >
                <div className="new-order-form">
                    {/* Cliente Section */}
                    <div className="form-section">
                        <h4>👤 Cliente</h4>

                        <div className="client-toggle">
                            <button
                                type="button"
                                className={`toggle-btn ${!orderForm.crearNuevoCliente ? 'active' : ''}`}
                                onClick={() => setOrderForm({ ...orderForm, crearNuevoCliente: false })}
                            >
                                Cliente Existente
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn ${orderForm.crearNuevoCliente ? 'active' : ''}`}
                                onClick={() => setOrderForm({ ...orderForm, crearNuevoCliente: true })}
                            >
                                Nuevo Cliente
                            </button>
                        </div>

                        {orderForm.crearNuevoCliente ? (
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Nombre *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={orderForm.nuevoClienteNombre}
                                        onChange={(e) => setOrderForm({ ...orderForm, nuevoClienteNombre: e.target.value })}
                                        placeholder="Nombre del cliente"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Teléfono (WhatsApp)</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={orderForm.nuevoClienteTelefono}
                                        onChange={(e) => setOrderForm({ ...orderForm, nuevoClienteTelefono: e.target.value })}
                                        placeholder="1123456789"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="form-group">
                                <label className="form-label">Seleccionar Cliente *</label>
                                <select
                                    className="form-select"
                                    value={orderForm.clienteId}
                                    onChange={(e) => setOrderForm({ ...orderForm, clienteId: e.target.value })}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Add Product Section */}
                    <div className="form-section">
                        <h4>📦 Agregar Producto</h4>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Producto</label>
                                <select
                                    className="form-select"
                                    value={currentItem.productoId || ''}
                                    onChange={(e) => handleProductSelect(e.target.value)}
                                >
                                    <option value="">-- Seleccionar producto --</option>
                                    {productos.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} - ${p.precioBase.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Material</label>
                                <select
                                    className="form-select"
                                    value={currentItem.material}
                                    onChange={(e) => setCurrentItem({ ...currentItem, material: e.target.value })}
                                >
                                    {config.materiales?.map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Cantidad</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={currentItem.cantidad}
                                    onChange={(e) => setCurrentItem({ ...currentItem, cantidad: Number(e.target.value) })}
                                    min="1"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Ruler size={14} style={{ marginRight: 4 }} />
                                    Ancho (cm)
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={currentItem.medidaAncho}
                                    onChange={(e) => setCurrentItem({ ...currentItem, medidaAncho: e.target.value })}
                                    placeholder="Ej: 5"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Ruler size={14} style={{ marginRight: 4 }} />
                                    Alto (cm)
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={currentItem.medidaAlto}
                                    onChange={(e) => setCurrentItem({ ...currentItem, medidaAlto: e.target.value })}
                                    placeholder="Ej: 3"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    <Palette size={14} style={{ marginRight: 4 }} />
                                    Color
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={currentItem.color}
                                    onChange={(e) => setCurrentItem({ ...currentItem, color: e.target.value })}
                                    placeholder="Ej: Negro, Natural, Rojo"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Precio Unitario ($)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={currentItem.precioUnitario}
                                    onChange={(e) => setCurrentItem({ ...currentItem, precioUnitario: Number(e.target.value) })}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Image size={14} style={{ marginRight: 4 }} />
                                Logo del Cliente
                            </label>
                            <div className="logo-upload">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    id="logo-input"
                                />
                                <label htmlFor="logo-input" className="logo-upload-btn">
                                    {currentItem.logoPreview ? (
                                        <img src={currentItem.logoPreview} alt="Logo preview" />
                                    ) : (
                                        <>
                                            <Image size={24} />
                                            <span>Subir logo</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={addItemToOrder}
                        >
                            <Plus size={18} />
                            Agregar al Pedido
                        </button>
                    </div>

                    {/* Items Added */}
                    {orderForm.items.length > 0 && (
                        <div className="form-section">
                            <h4>🛒 Productos en el Pedido ({orderForm.items.length})</h4>
                            <div className="order-items-list">
                                {orderForm.items.map((item) => (
                                    <div key={item.id} className="order-item">
                                        <div className="order-item-info">
                                            <span className={`badge ${getMaterialBadgeClass(item.material)}`}>
                                                {getMaterialName(item.material)}
                                            </span>
                                            <strong>{item.cantidad}x {item.producto}</strong>
                                            {item.medidaAncho && item.medidaAlto && (
                                                <span className="text-muted"> ({item.medidaAncho}x{item.medidaAlto}cm)</span>
                                            )}
                                            {item.color && <span className="text-muted"> - {item.color}</span>}
                                        </div>
                                        <div className="order-item-price">
                                            ${item.subtotal.toLocaleString()}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => removeItemFromOrder(item.id)}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="form-section">
                        <div className="form-group">
                            <label className="form-label">Notas adicionales</label>
                            <textarea
                                className="form-textarea"
                                value={orderForm.notas}
                                onChange={(e) => setOrderForm({ ...orderForm, notas: e.target.value })}
                                placeholder="Observaciones, instrucciones especiales..."
                                rows="2"
                            />
                        </div>
                    </div>

                    {/* Envío - Localidad y Provincia */}
                    <div className="form-section">
                        <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>📍 Destino de Envío</h4>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Localidad</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={orderForm.localidad}
                                    onChange={(e) => setOrderForm({ ...orderForm, localidad: e.target.value })}
                                    placeholder="Ej: Rosario"
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Provincia</label>
                                <select
                                    className="form-select"
                                    value={orderForm.provincia}
                                    onChange={(e) => setOrderForm({ ...orderForm, provincia: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Buenos Aires">Buenos Aires</option>
                                    <option value="CABA">CABA</option>
                                    <option value="Catamarca">Catamarca</option>
                                    <option value="Chaco">Chaco</option>
                                    <option value="Chubut">Chubut</option>
                                    <option value="Córdoba">Córdoba</option>
                                    <option value="Corrientes">Corrientes</option>
                                    <option value="Entre Ríos">Entre Ríos</option>
                                    <option value="Formosa">Formosa</option>
                                    <option value="Jujuy">Jujuy</option>
                                    <option value="La Pampa">La Pampa</option>
                                    <option value="La Rioja">La Rioja</option>
                                    <option value="Mendoza">Mendoza</option>
                                    <option value="Misiones">Misiones</option>
                                    <option value="Neuquén">Neuquén</option>
                                    <option value="Río Negro">Río Negro</option>
                                    <option value="Salta">Salta</option>
                                    <option value="San Juan">San Juan</option>
                                    <option value="San Luis">San Luis</option>
                                    <option value="Santa Cruz">Santa Cruz</option>
                                    <option value="Santa Fe">Santa Fe</option>
                                    <option value="Santiago del Estero">Santiago del Estero</option>
                                    <option value="Tierra del Fuego">Tierra del Fuego</option>
                                    <option value="Tucumán">Tucumán</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="order-summary">
                        <div className="summary-row">
                            <span>Total del Pedido</span>
                            <span className="summary-total">${orderTotal.toLocaleString()}</span>
                        </div>
                        <div className="summary-row delivery">
                            <span>📅 Fecha de Entrega Estimada</span>
                            <span>{formatearFecha(fechaEntregaPreview.fechaEstimada)} ({fechaEntregaPreview.diasHabiles} días hábiles)</span>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setNewOrderModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-lg"
                            onClick={handleCreateOrder}
                            disabled={orderForm.items.length === 0}
                        >
                            <CheckCircle size={18} />
                            Crear Pedido
                        </button>
                    </div>
                </div>
            </Modal>

            <style>{`
        .filters-bar {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .filters-bar .search-box {
          flex: 1;
          min-width: 200px;
        }
        
        .filters-bar .form-select {
          width: auto;
          min-width: 180px;
        }
        
        .pedidos-stats {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .stat-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .stat-btn:hover, .stat-btn.active {
          border-color: var(--accent);
          background: var(--accent-glow);
        }
        
        .stat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .stat-dot.default { background: var(--text-muted); }
        .stat-dot.info { background: var(--info); }
        .stat-dot.warning { background: var(--warning); }
        .stat-dot.success { background: var(--success); }
        .stat-dot.danger { background: var(--danger); }
        
        .stat-count {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .stat-label-short {
          display: none;
        }
        
        .pedidos-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .pedido-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          transition: all var(--transition-fast);
          border-left: 4px solid var(--border-color);
        }
        
        .pedido-card:hover {
          border-color: var(--accent);
        }
        
        .pedido-card.atrasado {
          border-left-color: var(--danger);
          background: var(--danger-bg);
        }
        
        .pedido-card.hoy, .pedido-card.urgente {
          border-left-color: var(--warning);
        }
        
        .pedido-card.proximo {
          border-left-color: var(--accent);
        }
        
        .pedido-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .pedido-number {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .pedido-number .number {
          font-size: 1.125rem;
          font-weight: 700;
        }
        
        .pedido-date {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        
        .pedido-body {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .pedido-logo-thumb {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-tertiary);
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .pedido-logo-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 4px;
        }
        
        .pedido-content {
          flex: 1;
          min-width: 0;
        }
        
        .pedido-cliente {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .pedido-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }
        
        .item-tag {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
        }
        
        .item-tag.more {
          color: var(--accent);
        }
        
        .item-tag.logo-indicator {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1));
          color: var(--success);
          border: 1px solid rgba(34, 197, 94, 0.3);
          font-weight: 500;
        }
        
        .pedido-meta {
          display: flex;
          gap: 1rem;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .pedido-actions {
          display: flex;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        
        .pedido-detail {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .detail-section h4 {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        
        .detail-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .detail-item {
          background: var(--bg-tertiary);
          padding: 0.75rem;
          border-radius: var(--radius-md);
        }
        
        .detail-item-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .detail-item-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        
        .detail-item-logo {
          margin: 0.75rem 0;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        
        .detail-item-logo .logo-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--accent);
          margin-bottom: 0.5rem;
        }
        
        .detail-item-logo img {
          max-width: 200px;
          max-height: 120px;
          border-radius: var(--radius-sm);
          object-fit: contain;
          background: white;
          padding: 4px;
          border: 1px solid var(--border-color);
        }
        
        .detail-item-price {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .detail-totals {
          background: var(--bg-tertiary);
          padding: 1rem;
          border-radius: var(--radius-md);
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
        }
        
        .total-value {
          font-size: 1.25rem;
          color: var(--accent);
        }
        
        .dates-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        
        .dates-grid > div {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        
        /* New Order Form Styles */
        .new-order-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .form-section {
          background: var(--bg-tertiary);
          padding: 1rem;
          border-radius: var(--radius-md);
        }
        
        .form-section h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .client-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .toggle-btn {
          flex: 1;
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .toggle-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }
        
        .logo-upload {
          position: relative;
        }
        
        .logo-upload input {
          display: none;
        }
        
        .logo-upload-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 120px;
          height: 80px;
          background: var(--bg-secondary);
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
          overflow: hidden;
        }
        
        .logo-upload-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        
        .logo-upload-btn img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .order-items-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .order-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .order-item-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        
        .order-item-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .order-item-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .item-logo-preview {
          width: 50px;
          height: 50px;
          object-fit: contain;
          background: white;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          padding: 2px;
        }

        .no-logo {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .upload-logo-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
        }

        .order-item-actions {
          display: flex;
          gap: 0.25rem;
        }

        .item-price {
          font-weight: 600;
          color: var(--accent);
        }

        .add-item-section {
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 1rem;
        }

        .logo-upload-edit {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .logo-preview-small {
          width: 60px;
          height: 60px;
          object-fit: contain;
          background: white;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          padding: 4px;
        }

        .subtotal-preview {
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          font-weight: 600;
          color: var(--accent);
        }

        .detail-actions {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: center;
        }
        
        .order-item-price {
          font-weight: 600;
          color: var(--accent);
        }
        
        .order-summary {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1rem;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }
        
        .summary-row.delivery {
          border-top: 1px solid var(--border-color);
          margin-top: 0.5rem;
          padding-top: 1rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .summary-total {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .pedidos-page {
            padding: 0;
          }
          
          .pedidos-page .page-header {
            flex-wrap: wrap;
            gap: 0.75rem;
            padding: 0 0.5rem;
          }
          
          .pedidos-page .page-header .page-title {
            flex: 1;
          }
          
          .pedidos-page .page-header .page-title h1 {
            font-size: 1.25rem;
          }
          
          .pedidos-page .page-header .page-title .icon {
            width: 36px;
            height: 36px;
          }
          
          .pedidos-page .page-header .btn {
            width: 100%;
            justify-content: center;
            padding: 0.875rem;
            font-size: 1rem;
          }
          
          .filters-bar {
            flex-direction: column;
            gap: 0.5rem;
            padding: 0 0.5rem;
          }
          
          .filters-bar .search-box,
          .filters-bar .form-select {
            width: 100%;
          }
          
          .filters-bar .form-input {
            padding: 0.875rem 0.875rem 0.875rem 2.5rem;
            font-size: 1rem;
          }
          
          .filters-bar .form-select {
            padding: 0.875rem;
            font-size: 1rem;
          }
          
          /* Stats as horizontal scroll */
          .pedidos-stats {
            display: flex;
            overflow-x: auto;
            padding: 0.5rem;
            gap: 0.5rem;
            flex-wrap: nowrap;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            margin: 0 -0.5rem;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
          
          .pedidos-stats::-webkit-scrollbar {
            display: none;
          }
          
          .stat-btn {
            font-size: 0.8rem;
            padding: 0.5rem 0.75rem;
            white-space: nowrap;
            flex-shrink: 0;
          }
          
          .stat-label {
            display: none;
          }
          
          .stat-label-short {
            display: inline;
          }
          
          .stat-btn .stat-count {
            font-size: 0.9rem;
          }
          
          /* Pedidos list */
          .pedidos-list {
            gap: 0.75rem;
            padding: 0 0.5rem;
          }
          
          /* Card redesign for mobile */
          .pedido-card {
            padding: 1rem;
            border-radius: var(--radius-md);
            border-left-width: 5px;
          }
          
          .pedido-header {
            flex-direction: row;
            align-items: flex-start;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
          }
          
          .pedido-number {
            flex-wrap: wrap;
            gap: 0.35rem;
          }
          
          .pedido-number .number {
            font-size: 1.1rem;
            font-weight: 800;
          }
          
          .pedido-number .badge {
            font-size: 0.65rem;
            padding: 0.2rem 0.4rem;
          }
          
          .pedido-date {
            font-size: 0.75rem;
            white-space: nowrap;
          }
          
          .pedido-body {
            margin-bottom: 0.75rem;
          }
          
          .pedido-logo-thumb {
            width: 50px;
            height: 50px;
          }
          
          .pedido-cliente {
            font-size: 0.95rem;
            margin-bottom: 0.5rem;
          }
          
          .pedido-cliente .btn-whatsapp {
            padding: 0.4rem;
          }
          
          .pedido-items {
            gap: 0.35rem;
            margin-bottom: 0.5rem;
          }
          
          .item-tag {
            font-size: 0.7rem;
            padding: 0.2rem 0.4rem;
          }
          
          .pedido-meta {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          
          .meta-item {
            font-size: 0.85rem;
            gap: 0.35rem;
          }
          
          .meta-item svg {
            width: 16px;
            height: 16px;
          }
          
          /* Mobile-optimized actions */
          .pedido-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            padding-top: 0.75rem;
          }
          
          .pedido-actions .btn {
            justify-content: center;
            padding: 0.75rem 0.5rem;
            font-size: 0.8rem;
            gap: 0.35rem;
          }
          
          .pedido-actions .btn svg {
            width: 16px;
            height: 16px;
          }
          
          /* Detail Modal Mobile */
          .pedido-detail {
            gap: 1rem;
          }
          
          .timeline-section {
            margin: -0.5rem -1rem 0;
            padding: 0.75rem 1rem;
            background: var(--bg-tertiary);
          }
          
          .detail-section h4 {
            font-size: 0.7rem;
          }
          
          .detail-items {
            gap: 0.5rem;
          }
          
          .detail-item {
            padding: 0.625rem;
          }
          
          .detail-item-header {
            flex-wrap: wrap;
            gap: 0.35rem;
            margin-bottom: 0.35rem;
          }
          
          .detail-item-header .badge {
            font-size: 0.65rem;
          }
          
          .detail-item-header strong {
            font-size: 0.9rem;
          }
          
          .detail-item-meta {
            flex-direction: column;
            gap: 0.25rem;
            font-size: 0.8rem;
          }
          
          .detail-item-price {
            font-size: 0.8rem;
            margin-top: 0.35rem;
          }
          
          .detail-totals {
            padding: 0.75rem;
          }
          
          .total-row {
            font-size: 0.95rem;
          }
          
          .total-value {
            font-size: 1.1rem;
          }
          
          .dates-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .dates-grid > div {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding: 0.5rem;
            background: var(--bg-tertiary);
            border-radius: var(--radius-sm);
          }
          
          /* New Order Form Mobile */
          .new-order-form {
            gap: 1rem;
          }
          
          .form-section {
            padding: 0.875rem;
            margin: 0 -0.5rem;
            border-radius: 0;
          }
          
          .form-section h4 {
            font-size: 0.9rem;
            margin-bottom: 0.75rem;
          }
          
          .form-row {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          
          .form-row .form-group {
            flex: 1 !important;
          }
          
          .form-group .form-label {
            font-size: 0.8rem;
            margin-bottom: 0.35rem;
          }
          
          .form-group .form-input,
          .form-group .form-select,
          .form-group .form-textarea {
            padding: 0.875rem;
            font-size: 1rem;
          }
          
          .client-toggle {
            flex-direction: row;
            gap: 0.5rem;
          }
          
          .toggle-btn {
            padding: 0.75rem 0.5rem;
            font-size: 0.85rem;
          }
          
          .logo-upload-btn {
            width: 100%;
            height: 100px;
          }
          
          /* Order items in form */
          .order-items-list {
            gap: 0.5rem;
          }
          
          .order-item {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
            padding: 0.75rem;
          }
          
          .order-item-info {
            width: 100%;
            flex-wrap: wrap;
            gap: 0.35rem;
          }
          
          .order-item-info .badge {
            font-size: 0.65rem;
          }
          
          .order-item-info strong {
            font-size: 0.9rem;
          }
          
          .order-item-info .text-muted {
            font-size: 0.75rem;
          }
          
          .order-item-price {
            font-size: 1rem;
          }
          
          .order-item > .btn {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
          }
          
          .order-item {
            position: relative;
            padding-right: 2.5rem;
          }
          
          /* Summary */
          .order-summary {
            padding: 0.875rem;
            margin: 0 -0.5rem;
            border-radius: 0;
          }
          
          .summary-row {
            padding: 0.625rem 0;
          }
          
          .summary-row.delivery {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
            font-size: 0.85rem;
          }
          
          .summary-total {
            font-size: 1.35rem;
          }
          
          .form-actions {
            flex-direction: column-reverse;
            gap: 0.5rem;
            padding: 1rem 0.5rem;
            margin: 0 -0.5rem;
            background: var(--bg-secondary);
            border-top: 1px solid var(--border-color);
            position: sticky;
            bottom: 0;
          }
          
          .form-actions .btn {
            width: 100%;
            justify-content: center;
            padding: 1rem;
            font-size: 1rem;
          }
          
          .form-actions .btn-primary {
            order: -1;
          }
          
          /* Empty state */
          .empty-state {
            padding: 2rem 1rem;
          }
          
          .empty-state-title {
            font-size: 1rem;
          }
          
          .empty-state-description {
            font-size: 0.875rem;
          }
        }
        
        /* Extra small screens */
        @media (max-width: 400px) {
          .pedido-number {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .pedido-actions {
            grid-template-columns: 1fr;
          }
          
          .pedido-actions .btn {
            padding: 0.875rem;
          }
          
          .stat-btn {
            padding: 0.4rem 0.6rem;
          }
          
          .stat-btn .stat-dot {
            width: 10px;
            height: 10px;
          }
        }
      `}</style>
        </div>
    );
}
