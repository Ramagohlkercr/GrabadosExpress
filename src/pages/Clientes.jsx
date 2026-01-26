import { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    Phone,
    Mail,
    MessageCircle,
    ShoppingBag,
    Image,
    Tag,
    Ruler,
    Square,
    Loader2,
    Calendar
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import {
    getClientesAsync,
    saveClienteAsync,
    deleteClienteAsync,
    getPedidosAsync,
    ESTADOS_LABELS
} from '../lib/storageApi';
import { enviarWhatsApp } from '../lib/whatsapp';
import toast from 'react-hot-toast';

const FORMAS_ETIQUETA = [
    { id: 'rectangular', nombre: 'Rectangular', icon: '▬' },
    { id: 'cuadrada', nombre: 'Cuadrada', icon: '■' },
    { id: 'circular', nombre: 'Circular/Ovalada', icon: '●' },
    { id: 'troquelada', nombre: 'Troquelada/Especial', icon: '✦' },
];

const emptyCliente = {
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    localidad: '',
    provincia: '',
    notas: '',
    // Nuevo: datos de marca/logo
    nombreMarca: '',
    logoImage: null,
    logoNombre: '',
    // Preferencias de etiquetas
    formaEtiqueta: '',
    medidaAncho: '',
    medidaAlto: '',
    colorPreferido: '',
};

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [filteredClientes, setFilteredClientes] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);
    const [viewingCliente, setViewingCliente] = useState(null);
    const [formData, setFormData] = useState(emptyCliente);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const filtered = clientes.filter(c =>
            c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.telefono?.includes(searchTerm) ||
            c.nombreMarca?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredClientes(filtered);
    }, [searchTerm, clientes]);

    async function loadData() {
        try {
            setLoading(true);
            const [clientesData, pedidosData] = await Promise.all([
                getClientesAsync(),
                getPedidosAsync()
            ]);
            setClientes(clientesData);
            setFilteredClientes(clientesData);
            setPedidos(pedidosData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }

    function getPedidosCount(clienteId) {
        return pedidos.filter(p => p.clienteId === clienteId).length;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.nombre.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        try {
            setSaving(true);
            await saveClienteAsync(editingCliente ? { ...formData, id: editingCliente.id } : formData);
            toast.success(editingCliente ? 'Cliente actualizado' : 'Cliente creado');

            setModalOpen(false);
            setEditingCliente(null);
            setFormData(emptyCliente);
            await loadData();
        } catch (error) {
            console.error('Error saving client:', error);
            toast.error('Error al guardar cliente');
        } finally {
            setSaving(false);
        }
    }

    function handleEdit(cliente) {
        setEditingCliente(cliente);
        setFormData({
            ...emptyCliente,
            ...cliente,
        });
        setModalOpen(true);
    }

    function handleView(cliente) {
        setViewingCliente(cliente);
        setViewModalOpen(true);
    }

    async function handleDelete(cliente) {
        const pedidosCount = getPedidosCount(cliente.id);
        const message = pedidosCount > 0
            ? `Este cliente tiene ${pedidosCount} pedido(s). ¿Eliminarlo de todas formas?`
            : `¿Eliminar a "${cliente.nombre}"?`;

        if (confirm(message)) {
            try {
                await deleteClienteAsync(cliente.id);
                toast.success('Cliente eliminado');
                await loadData();
            } catch (error) {
                console.error('Error deleting client:', error);
                toast.error('Error al eliminar cliente');
            }
        }
    }

    function handleWhatsApp(cliente) {
        if (cliente.telefono) {
            enviarWhatsApp(cliente.telefono, '¡Hola! Te escribo desde Grabados Express.');
        } else {
            toast.error('Este cliente no tiene teléfono');
        }
    }

    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({
                    ...formData,
                    logoImage: reader.result,
                });
            };
            reader.readAsDataURL(file);
        }
    }

    function openNewModal() {
        setEditingCliente(null);
        setFormData(emptyCliente);
        setModalOpen(true);
    }

    if (loading) {
        return (
            <div className="clientes-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div className="clientes-page">
            <div className="page-header">
                <div className="page-title">
                    <div className="icon">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1>Clientes</h1>
                        <p className="text-muted">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openNewModal}>
                    <Plus size={18} />
                    Nuevo Cliente
                </button>
            </div>

            {/* Search */}
            <div className="search-bar mb-lg">
                <div className="search-box">
                    <Search className="icon" size={18} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Buscar por nombre, teléfono o marca..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Clientes Grid */}
            {filteredClientes.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Users size={32} />
                        </div>
                        <h3 className="empty-state-title">No hay clientes</h3>
                        <p className="empty-state-description">
                            Agregá tu primer cliente para empezar
                        </p>
                        <button className="btn btn-primary" onClick={openNewModal}>
                            <Plus size={18} />
                            Agregar Cliente
                        </button>
                    </div>
                </div>
            ) : (
                <div className="clientes-grid">
                    {filteredClientes.map(cliente => (
                        <div key={cliente.id} className="cliente-card" onClick={() => handleView(cliente)}>
                            <div className="cliente-header">
                                {cliente.logoImage ? (
                                    <div className="cliente-logo">
                                        <img src={cliente.logoImage} alt={cliente.nombreMarca || cliente.nombre} />
                                    </div>
                                ) : (
                                    <div className="cliente-avatar">
                                        {cliente.nombre.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="cliente-info">
                                    <h3 className="cliente-nombre">{cliente.nombre}</h3>
                                    {cliente.nombreMarca && (
                                        <span className="cliente-marca">
                                            <Tag size={12} />
                                            {cliente.nombreMarca}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {cliente.telefono && (
                                <div className="cliente-contact">
                                    <Phone size={14} />
                                    <span>{cliente.telefono}</span>
                                </div>
                            )}

                            {(cliente.formaEtiqueta || cliente.medidaAncho) && (
                                <div className="cliente-prefs">
                                    {cliente.formaEtiqueta && (
                                        <span className="pref-tag">
                                            <Square size={12} />
                                            {FORMAS_ETIQUETA.find(f => f.id === cliente.formaEtiqueta)?.nombre || cliente.formaEtiqueta}
                                        </span>
                                    )}
                                    {cliente.medidaAncho && cliente.medidaAlto && (
                                        <span className="pref-tag">
                                            <Ruler size={12} />
                                            {cliente.medidaAncho}x{cliente.medidaAlto}cm
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="cliente-footer">
                                <span className="pedidos-count">
                                    <ShoppingBag size={14} />
                                    {getPedidosCount(cliente.id)} pedidos
                                </span>

                                <div className="cliente-actions" onClick={(e) => e.stopPropagation()}>
                                    {cliente.telefono && (
                                        <button
                                            className="btn btn-whatsapp btn-sm"
                                            onClick={() => handleWhatsApp(cliente)}
                                        >
                                            <MessageCircle size={14} />
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleEdit(cliente)}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleDelete(cliente)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* View Modal */}
            <Modal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                title="Detalle del Cliente"
                size="lg"
            >
                {viewingCliente && (
                    <div className="cliente-detail">
                        <div className="detail-header">
                            {viewingCliente.logoImage ? (
                                <div className="detail-logo">
                                    <img src={viewingCliente.logoImage} alt={viewingCliente.nombreMarca || viewingCliente.nombre} />
                                </div>
                            ) : (
                                <div className="detail-avatar">
                                    {viewingCliente.nombre.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="detail-info">
                                <h2>{viewingCliente.nombre}</h2>
                                {viewingCliente.nombreMarca && (
                                    <p className="detail-marca">Marca: <strong>{viewingCliente.nombreMarca}</strong></p>
                                )}
                                {viewingCliente.logoNombre && (
                                    <p className="detail-logo-name">Logo: {viewingCliente.logoNombre}</p>
                                )}
                            </div>
                        </div>

                        <div className="detail-grid">
                            {viewingCliente.telefono && (
                                <div className="detail-item">
                                    <Phone size={16} />
                                    <div>
                                        <span className="label">Teléfono</span>
                                        <span className="value">{viewingCliente.telefono}</span>
                                    </div>
                                </div>
                            )}

                            {viewingCliente.email && (
                                <div className="detail-item">
                                    <Mail size={16} />
                                    <div>
                                        <span className="label">Email</span>
                                        <span className="value">{viewingCliente.email}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(viewingCliente.formaEtiqueta || viewingCliente.medidaAncho || viewingCliente.colorPreferido) && (
                            <div className="detail-section">
                                <h4>Preferencias de Etiquetas</h4>
                                <div className="prefs-grid">
                                    {viewingCliente.formaEtiqueta && (
                                        <div className="pref-item">
                                            <span className="pref-icon">
                                                {FORMAS_ETIQUETA.find(f => f.id === viewingCliente.formaEtiqueta)?.icon}
                                            </span>
                                            <span>{FORMAS_ETIQUETA.find(f => f.id === viewingCliente.formaEtiqueta)?.nombre}</span>
                                        </div>
                                    )}
                                    {viewingCliente.medidaAncho && viewingCliente.medidaAlto && (
                                        <div className="pref-item">
                                            <Ruler size={16} />
                                            <span>{viewingCliente.medidaAncho} x {viewingCliente.medidaAlto} cm</span>
                                        </div>
                                    )}
                                    {viewingCliente.colorPreferido && (
                                        <div className="pref-item">
                                            <div className="color-dot" style={{ background: viewingCliente.colorPreferido }} />
                                            <span>{viewingCliente.colorPreferido}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {viewingCliente.notas && (
                            <div className="detail-section">
                                <h4>Notas</h4>
                                <p className="text-muted">{viewingCliente.notas}</p>
                            </div>
                        )}

                        <div className="detail-section">
                            <h4>Historial de Pedidos ({pedidos.filter(p => p.clienteId === viewingCliente.id).length})</h4>
                            <div className="historial-list">
                                {pedidos.filter(p => p.clienteId === viewingCliente.id).length === 0 ? (
                                    <p className="text-muted text-center py-4">Este cliente no tiene pedidos registrados</p>
                                ) : (
                                    pedidos
                                        .filter(p => p.clienteId === viewingCliente.id)
                                        .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
                                        .map(pedido => {
                                            const estadoInfo = ESTADOS_LABELS?.[pedido.estado] || { label: pedido.estado, color: 'default' };
                                            return (
                                                <div key={pedido.id} className="historial-item">
                                                    <div className="historial-header">
                                                        <span className="historial-id">#{pedido.numero}</span>
                                                        <span className={`status-badge status-${estadoInfo.color}`}>
                                                            {estadoInfo.label}
                                                        </span>
                                                    </div>
                                                    <div className="historial-content">
                                                        <div className="historial-fecha">
                                                            <Calendar size={14} />
                                                            {new Date(pedido.createdAt || pedido.created_at).toLocaleDateString()}
                                                        </div>
                                                        <div className="historial-total">
                                                            ${pedido.total?.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="historial-items">
                                                        {pedido.items?.length} artículo{pedido.items?.length !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>

                        <div className="detail-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setViewModalOpen(false);
                                    handleEdit(viewingCliente);
                                }}
                            >
                                <Edit2 size={18} />
                                Editar Cliente
                            </button>
                            {viewingCliente.telefono && (
                                <button
                                    className="btn btn-whatsapp"
                                    onClick={() => handleWhatsApp(viewingCliente)}
                                >
                                    <MessageCircle size={18} />
                                    Enviar WhatsApp
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingCliente(null);
                    setFormData(emptyCliente);
                }}
                title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                size="lg"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingCliente ? 'Guardar Cambios' : 'Crear Cliente'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="cliente-form">
                    {/* Datos Básicos */}
                    <div className="form-section">
                        <h4>👤 Datos del Cliente</h4>

                        <div className="form-group">
                            <label className="form-label">Nombre del Cliente *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Nombre completo o empresa"
                                autoFocus
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Teléfono (WhatsApp)</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    placeholder="1123456789"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="cliente@email.com"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Dirección</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.direccion}
                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                placeholder="Calle y número"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Localidad</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.localidad}
                                    onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                                    placeholder="Ej: San Miguel"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Provincia</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.provincia}
                                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                                    placeholder="Ej: Buenos Aires"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Marca y Logo */}
                    <div className="form-section">
                        <h4>🏷️ Marca / Logo</h4>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Nombre de la Marca</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.nombreMarca}
                                    onChange={(e) => setFormData({ ...formData, nombreMarca: e.target.value })}
                                    placeholder="Ej: Café Don Pedro, Tienda Luna"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nombre del Logo</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.logoNombre}
                                    onChange={(e) => setFormData({ ...formData, logoNombre: e.target.value })}
                                    placeholder="Ej: Logo circular v2"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Image size={14} style={{ marginRight: 4 }} />
                                Imagen del Logo
                            </label>
                            <div className="logo-upload-area">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    id="logo-upload"
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="logo-upload" className="logo-upload-box">
                                    {formData.logoImage ? (
                                        <div className="logo-preview">
                                            <img src={formData.logoImage} alt="Logo" />
                                            <button
                                                type="button"
                                                className="remove-logo"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setFormData({ ...formData, logoImage: null });
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="upload-placeholder">
                                            <Image size={32} />
                                            <span>Clic para subir logo</span>
                                            <span className="text-muted">PNG, JPG (max 2MB)</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Preferencias de Etiquetas */}
                    <div className="form-section">
                        <h4>📐 Preferencias de Etiquetas</h4>

                        <div className="form-group">
                            <label className="form-label">Forma de Etiqueta Preferida</label>
                            <div className="forma-options">
                                {FORMAS_ETIQUETA.map(forma => (
                                    <button
                                        key={forma.id}
                                        type="button"
                                        className={`forma-btn ${formData.formaEtiqueta === forma.id ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, formaEtiqueta: forma.id })}
                                    >
                                        <span className="forma-icon">{forma.icon}</span>
                                        <span>{forma.nombre}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    <Ruler size={14} style={{ marginRight: 4 }} />
                                    Ancho preferido (cm)
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.medidaAncho}
                                    onChange={(e) => setFormData({ ...formData, medidaAncho: e.target.value })}
                                    placeholder="Ej: 5"
                                    min="0"
                                    step="0.5"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Ruler size={14} style={{ marginRight: 4 }} />
                                    Alto preferido (cm)
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.medidaAlto}
                                    onChange={(e) => setFormData({ ...formData, medidaAlto: e.target.value })}
                                    placeholder="Ej: 3"
                                    min="0"
                                    step="0.5"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Color preferido</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.colorPreferido}
                                    onChange={(e) => setFormData({ ...formData, colorPreferido: e.target.value })}
                                    placeholder="Ej: Negro, Natural"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="form-section">
                        <div className="form-group">
                            <label className="form-label">Notas Adicionales</label>
                            <textarea
                                className="form-textarea"
                                value={formData.notas}
                                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                placeholder="Observaciones, instrucciones especiales..."
                                rows="2"
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            <style>{`
        .clientes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        
        .cliente-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          transition: all var(--transition-fast);
          cursor: pointer;
        }
        
        .cliente-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        
        .cliente-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        
        .cliente-avatar {
          width: 48px;
          height: 48px;
          background: var(--accent-glow);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--accent);
        }
        
        .cliente-logo {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-tertiary);
        }
        
        .cliente-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .cliente-info {
          flex: 1;
          min-width: 0;
        }
        
        .cliente-nombre {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.125rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .cliente-marca {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--accent);
        }
        
        .cliente-contact {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
        }
        
        .cliente-prefs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .pref-tag {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
        }
        
        .cliente-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-color);
        }
        
        .pedidos-count {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .cliente-actions {
          display: flex;
          gap: 0.25rem;
        }
        
        /* View Modal */
        .cliente-detail {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .detail-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .detail-avatar {
          width: 80px;
          height: 80px;
          background: var(--accent-glow);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 600;
          color: var(--accent);
        }
        
        .detail-logo {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-tertiary);
        }
        
        .detail-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .detail-info h2 {
          margin-bottom: 0.25rem;
        }
        
        .detail-marca, .detail-logo-name {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        
        .detail-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .detail-item .label {
          display: block;
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        
        .detail-item .value {
          display: block;
          font-weight: 500;
        }
        
        .detail-section h4 {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
        }
        
        .prefs-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        
        .pref-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .pref-icon {
          font-size: 1.25rem;
        }
        
        .color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid var(--border-color);
        }
        
        .detail-actions {
          display: flex;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        
        /* Form Styles */
        .cliente-form {
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
        
        .logo-upload-area {
          display: flex;
        }
        
        .logo-upload-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 150px;
          height: 120px;
          background: var(--bg-secondary);
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .logo-upload-box:hover {
          border-color: var(--accent);
        }
        
        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        
        .logo-preview {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .logo-preview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .remove-logo {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          background: var(--danger);
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .forma-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          width: 100%;
        }
        
        .forma-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.75rem;
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .forma-btn:hover {
          border-color: var(--accent);
        }
        
        .forma-btn.active {
          border-color: var(--accent);
          background: var(--accent-glow);
          color: var(--accent);
        }
        
        .forma-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }
        
        /* Historial Pedidos */
        .historial-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 250px;
          overflow-y: auto;
          margin-top: 0.5rem;
        }
        
        .historial-item {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          font-size: 0.875rem;
        }
        
        .historial-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .historial-id {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .historial-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--text-secondary);
        }
        
        .historial-fecha {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
        }
        
        .historial-total {
          font-weight: 600;
          color: var(--accent);
        }
        
        .historial-items {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        
        .status-badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
          border-radius: var(--radius-sm);
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .status-default { background: var(--bg-hover); color: var(--text-secondary); }
        .status-info { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
        .status-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .status-success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .status-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        
        /* Form row responsive */
        .clientes-page .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
        }
        
        /* Mobile responsive 768px */
        @media (max-width: 768px) {
          .clientes-page .page-header {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          
          .clientes-page .page-header .btn {
            width: 100%;
            justify-content: center;
          }
          
          .clientes-grid {
            grid-template-columns: 1fr;
          }
          
          .cliente-card {
            padding: 1rem;
          }
          
          .cliente-header {
            gap: 0.75rem;
          }
          
          .cliente-avatar {
            width: 40px;
            height: 40px;
            font-size: 0.9rem;
          }
          
          .cliente-nombre {
            font-size: 0.95rem;
          }
          
          .cliente-meta {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .meta-item {
            font-size: 0.75rem;
          }
          
          .cliente-actions .btn {
            font-size: 0.75rem;
            padding: 0.4rem 0.6rem;
          }
          
          .detail-grid {
            grid-template-columns: 1fr;
          }
          
          .detail-actions {
            flex-wrap: wrap;
          }
          
          .detail-actions .btn {
            flex: 1;
            min-width: 120px;
            justify-content: center;
          }
        }
        
        /* Modal responsive 600px */
        @media (max-width: 600px) {
          .forma-options {
            grid-template-columns: 1fr 1fr;
            gap: 0.4rem;
          }
          
          .forma-btn {
            padding: 0.5rem;
            font-size: 0.7rem;
            flex-direction: column;
            text-align: center;
            gap: 0.25rem;
          }
          
          .forma-icon {
            font-size: 1.2rem;
          }
          
          .clientes-page .form-row {
            grid-template-columns: 1fr;
          }
          
          .form-section h4 {
            font-size: 0.85rem;
          }
        }
      `}</style>
        </div>
    );
}
