import { useState, useEffect } from 'react';
import {
    Box,
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Package,
    Loader2
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import {
    getInsumosAsync,
    saveInsumoAsync,
    deleteInsumoAsync,
    updateStockAsync
} from '../lib/storageApi';
import toast from 'react-hot-toast';

const emptyInsumo = {
    nombre: '',
    unidad: 'unidad',
    stock: 0,
    stockMinimo: 5,
    costoUnitario: 0,
    proveedor: '',
    notas: '',
};

export default function Insumos() {
    const [insumos, setInsumos] = useState([]);
    const [filteredInsumos, setFilteredInsumos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [editingInsumo, setEditingInsumo] = useState(null);
    const [formData, setFormData] = useState(emptyInsumo);
    const [stockUpdate, setStockUpdate] = useState({ cantidad: 0, tipo: 'entrada' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadInsumos();
    }, []);

    useEffect(() => {
        const filtered = insumos.filter(i =>
            i.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredInsumos(filtered);
    }, [searchTerm, insumos]);

    async function loadInsumos() {
        try {
            setLoading(true);
            const data = await getInsumosAsync();
            setInsumos(data);
            setFilteredInsumos(data);
        } catch (error) {
            console.error('Error loading insumos:', error);
            toast.error('Error al cargar insumos');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.nombre.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        try {
            setSaving(true);
            await saveInsumoAsync(editingInsumo ? { ...formData, id: editingInsumo.id } : formData);
            toast.success(editingInsumo ? 'Insumo actualizado' : 'Insumo creado');

            setModalOpen(false);
            setEditingInsumo(null);
            setFormData(emptyInsumo);
            await loadInsumos();
        } catch (error) {
            console.error('Error saving insumo:', error);
            toast.error('Error al guardar insumo');
        } finally {
            setSaving(false);
        }
    }

    function handleEdit(insumo) {
        setEditingInsumo(insumo);
        setFormData(insumo);
        setModalOpen(true);
    }

    async function handleDelete(insumo) {
        if (confirm(`¿Eliminar "${insumo.nombre}"?`)) {
            try {
                await deleteInsumoAsync(insumo.id);
                toast.success('Insumo eliminado');
                await loadInsumos();
            } catch (error) {
                console.error('Error deleting insumo:', error);
                toast.error('Error al eliminar insumo');
            }
        }
    }

    function openStockModal(insumo) {
        setEditingInsumo(insumo);
        setStockUpdate({ cantidad: 0, tipo: 'entrada' });
        setStockModalOpen(true);
    }

    async function handleStockUpdate(e) {
        e.preventDefault();

        if (stockUpdate.cantidad <= 0) {
            toast.error('La cantidad debe ser mayor a 0');
            return;
        }

        try {
            setSaving(true);
            await updateStockAsync(editingInsumo.id, stockUpdate.cantidad, stockUpdate.tipo);
            toast.success(`Stock ${stockUpdate.tipo === 'entrada' ? 'agregado' : 'descontado'}`);

            setStockModalOpen(false);
            setEditingInsumo(null);
            await loadInsumos();
        } catch (error) {
            console.error('Error updating stock:', error);
            toast.error('Error al actualizar stock');
        } finally {
            setSaving(false);
        }
    }

    function openNewModal() {
        setEditingInsumo(null);
        setFormData(emptyInsumo);
        setModalOpen(true);
    }

    const insumosStockBajo = insumos.filter(i => i.stock <= i.stockMinimo);

    if (loading) {
        return (
            <div className="insumos-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div className="insumos-page">
            <div className="page-header">
                <div className="page-title">
                    <div className="icon">
                        <Box size={24} />
                    </div>
                    <div>
                        <h1>Insumos</h1>
                        <p className="text-muted">{insumos.length} insumo{insumos.length !== 1 ? 's' : ''} registrado{insumos.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openNewModal}>
                    <Plus size={18} />
                    Nuevo Insumo
                </button>
            </div>

            {/* Alert for low stock */}
            {insumosStockBajo.length > 0 && (
                <div className="alert alert-warning mb-lg">
                    <AlertTriangle size={20} />
                    <span>
                        <strong>{insumosStockBajo.length} insumo{insumosStockBajo.length > 1 ? 's' : ''}</strong> con stock bajo: {' '}
                        {insumosStockBajo.map(i => i.nombre).join(', ')}
                    </span>
                </div>
            )}

            {/* Search */}
            <div className="search-bar mb-lg">
                <div className="search-box">
                    <Search className="icon" size={18} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Buscar insumo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Insumos Grid */}
            {filteredInsumos.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Box size={32} />
                        </div>
                        <h3 className="empty-state-title">No hay insumos</h3>
                        <p className="empty-state-description">
                            Agregá insumos para controlar tu stock
                        </p>
                        <button className="btn btn-primary" onClick={openNewModal}>
                            <Plus size={18} />
                            Agregar Insumo
                        </button>
                    </div>
                </div>
            ) : (
                <div className="insumos-grid">
                    {filteredInsumos.map(insumo => {
                        const isLowStock = insumo.stock <= insumo.stockMinimo;

                        return (
                            <div key={insumo.id} className={`insumo-card ${isLowStock ? 'low-stock' : ''}`}>
                                <div className="insumo-header">
                                    <div className="insumo-icon">
                                        <Package size={20} />
                                    </div>
                                    <div className="insumo-info">
                                        <h3 className="insumo-nombre">{insumo.nombre}</h3>
                                        {insumo.proveedor && (
                                            <span className="insumo-proveedor text-muted">
                                                {insumo.proveedor}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="insumo-stock">
                                    <div className="stock-value">
                                        <span className={`stock-number ${isLowStock ? 'text-danger' : ''}`}>
                                            {insumo.stock}
                                        </span>
                                        <span className="stock-unit">{insumo.unidad}{insumo.stock !== 1 ? 's' : ''}</span>
                                    </div>
                                    {isLowStock && (
                                        <span className="badge badge-danger">
                                            <AlertTriangle size={12} />
                                            Stock bajo
                                        </span>
                                    )}
                                </div>

                                <div className="insumo-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Costo unitario</span>
                                        <span className="meta-value">${insumo.costoUnitario?.toLocaleString()}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Stock mínimo</span>
                                        <span className="meta-value">{insumo.stockMinimo}</span>
                                    </div>
                                </div>

                                <div className="insumo-actions">
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => openStockModal(insumo)}
                                        title="Actualizar stock"
                                    >
                                        <TrendingUp size={14} />
                                        Stock
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleEdit(insumo)}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleDelete(insumo)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingInsumo(null);
                    setFormData(emptyInsumo);
                }}
                title={editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingInsumo ? 'Guardar Cambios' : 'Crear Insumo'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nombre del Insumo *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej: Plancha MDF 3mm"
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Unidad</label>
                            <select
                                className="form-select"
                                value={formData.unidad}
                                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                            >
                                <option value="unidad">Unidad</option>
                                <option value="metro">Metro</option>
                                <option value="kg">Kilogramo</option>
                                <option value="litro">Litro</option>
                                <option value="plancha">Plancha</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Stock Actual</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Stock Mínimo</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.stockMinimo}
                                onChange={(e) => setFormData({ ...formData, stockMinimo: Number(e.target.value) })}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Costo Unitario ($)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.costoUnitario}
                                onChange={(e) => setFormData({ ...formData, costoUnitario: Number(e.target.value) })}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Proveedor</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.proveedor}
                            onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                            placeholder="Nombre del proveedor"
                        />
                    </div>
                </form>
            </Modal>

            {/* Stock Update Modal */}
            <Modal
                isOpen={stockModalOpen}
                onClose={() => {
                    setStockModalOpen(false);
                    setEditingInsumo(null);
                }}
                title={`Actualizar Stock - ${editingInsumo?.nombre}`}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setStockModalOpen(false)}>
                            Cancelar
                        </button>
                        <button
                            className={`btn ${stockUpdate.tipo === 'entrada' ? 'btn-success' : 'btn-danger'}`}
                            onClick={handleStockUpdate}
                        >
                            {stockUpdate.tipo === 'entrada' ? 'Agregar Stock' : 'Descontar Stock'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleStockUpdate}>
                    <div className="stock-current mb-md">
                        <span className="text-muted">Stock actual: </span>
                        <strong>{editingInsumo?.stock} {editingInsumo?.unidad}s</strong>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tipo de movimiento</label>
                        <div className="stock-type-buttons">
                            <button
                                type="button"
                                className={`stock-type-btn ${stockUpdate.tipo === 'entrada' ? 'active success' : ''}`}
                                onClick={() => setStockUpdate({ ...stockUpdate, tipo: 'entrada' })}
                            >
                                <TrendingUp size={18} />
                                Entrada
                            </button>
                            <button
                                type="button"
                                className={`stock-type-btn ${stockUpdate.tipo === 'salida' ? 'active danger' : ''}`}
                                onClick={() => setStockUpdate({ ...stockUpdate, tipo: 'salida' })}
                            >
                                <TrendingDown size={18} />
                                Salida
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Cantidad</label>
                        <input
                            type="number"
                            className="form-input"
                            value={stockUpdate.cantidad}
                            onChange={(e) => setStockUpdate({ ...stockUpdate, cantidad: Number(e.target.value) })}
                            min="1"
                            autoFocus
                        />
                    </div>

                    <div className="stock-preview">
                        <span className="text-muted">Nuevo stock: </span>
                        <strong className={stockUpdate.tipo === 'salida' && (editingInsumo?.stock - stockUpdate.cantidad) < 0 ? 'text-danger' : ''}>
                            {stockUpdate.tipo === 'entrada'
                                ? (editingInsumo?.stock || 0) + stockUpdate.cantidad
                                : (editingInsumo?.stock || 0) - stockUpdate.cantidad
                            } {editingInsumo?.unidad}s
                        </strong>
                    </div>
                </form>
            </Modal>

            <style>{`
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: var(--radius-lg);
        }
        
        .alert-warning {
          background: var(--warning-bg);
          color: var(--warning);
          border: 1px solid var(--warning);
        }
        
        .insumos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        
        .insumo-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          transition: all var(--transition-fast);
        }
        
        .insumo-card:hover {
          border-color: var(--accent);
        }
        
        .insumo-card.low-stock {
          border-color: var(--danger);
          background: var(--danger-bg);
        }
        
        .insumo-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .insumo-icon {
          width: 40px;
          height: 40px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }
        
        .insumo-nombre {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.125rem;
        }
        
        .insumo-proveedor {
          font-size: 0.75rem;
        }
        
        .insumo-stock {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
        }
        
        .stock-value {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }
        
        .stock-number {
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .stock-unit {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        
        .insumo-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .meta-item {
          flex: 1;
        }
        
        .meta-label {
          display: block;
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 0.125rem;
        }
        
        .meta-value {
          font-weight: 600;
        }
        
        .insumo-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .insumo-actions .btn-success {
          flex: 1;
        }
        
        .stock-type-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .stock-type-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .stock-type-btn:hover {
          border-color: var(--border-light);
        }
        
        .stock-type-btn.active.success {
          border-color: var(--success);
          background: var(--success-bg);
          color: var(--success);
        }
        
        .stock-type-btn.active.danger {
          border-color: var(--danger);
          background: var(--danger-bg);
          color: var(--danger);
        }
        
        .stock-preview {
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          text-align: center;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .insumos-page .page-header {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          
          .insumos-page .page-header .btn {
            width: 100%;
            justify-content: center;
          }
          
          .alert {
            font-size: 0.8rem;
            padding: 0.75rem;
          }
          
          .insumos-grid {
            grid-template-columns: 1fr;
          }
          
          .insumo-card {
            padding: 1rem;
          }
          
          .insumo-nombre {
            font-size: 0.95rem;
          }
          
          .stock-number {
            font-size: 1.25rem;
          }
          
          .insumo-meta {
            gap: 0.5rem;
          }
          
          .meta-label {
            font-size: 0.65rem;
          }
          
          .insumo-actions {
            flex-wrap: wrap;
          }
          
          .insumo-actions .btn {
            flex: 1;
            min-width: 80px;
            justify-content: center;
          }
          
          .form-row {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>
        </div>
    );
}
