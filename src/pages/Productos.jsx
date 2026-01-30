import { useState, useEffect } from 'react';
import {
    Package,
    Plus,
    Search,
    Edit2,
    Trash2,
    Filter,
    Loader2
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import {
    getProductosAsync,
    saveProductoAsync,
    deleteProductoAsync,
    getConfiguracionAsync
} from '../lib/storageApi';
import toast from 'react-hot-toast';

const emptyProducto = {
    nombre: '',
    categoria: 'etiqueta',
    material: 'mdf',
    precioBase: '',
    tiempoEstimado: '',
    descripcion: '',
    activo: true,
};

export default function Productos() {
    const [productos, setProductos] = useState([]);
    const [filteredProductos, setFilteredProductos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMaterial, setFilterMaterial] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProducto, setEditingProducto] = useState(null);
    const [formData, setFormData] = useState(emptyProducto);
    const [config, setConfig] = useState({ materiales: [], categorias: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        let filtered = productos;

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterMaterial) {
            filtered = filtered.filter(p => p.material === filterMaterial);
        }

        if (filterCategoria) {
            filtered = filtered.filter(p => p.categoria === filterCategoria);
        }

        setFilteredProductos(filtered);
    }, [searchTerm, filterMaterial, filterCategoria, productos]);

    async function loadData() {
        try {
            setLoading(true);
            const [productosData, configData] = await Promise.all([
                getProductosAsync(),
                getConfiguracionAsync()
            ]);
            setProductos(productosData);
            setFilteredProductos(productosData);
            setConfig(configData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar datos');
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

        if (!formData.precioBase || formData.precioBase <= 0) {
            toast.error('El precio debe ser mayor a 0');
            return;
        }

        try {
            setSaving(true);
            await saveProductoAsync(editingProducto ? { ...formData, id: editingProducto.id } : formData);
            toast.success(editingProducto ? 'Producto actualizado' : 'Producto creado');

            setModalOpen(false);
            setEditingProducto(null);
            setFormData(emptyProducto);
            await loadData();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Error al guardar producto');
        } finally {
            setSaving(false);
        }
    }

    function handleEdit(producto) {
        setEditingProducto(producto);
        setFormData(producto);
        setModalOpen(true);
    }

    async function handleDelete(producto) {
        if (confirm(`¿Eliminar "${producto.nombre}"?`)) {
            try {
                await deleteProductoAsync(producto.id);
                toast.success('Producto eliminado');
                await loadData();
            } catch (error) {
                console.error('Error deleting product:', error);
                toast.error('Error al eliminar producto');
            }
        }
    }

    async function handleToggleActivo(producto) {
        try {
            await saveProductoAsync({ ...producto, activo: !producto.activo });
            toast.success(producto.activo ? 'Producto desactivado' : 'Producto activado');
            await loadData();
        } catch (error) {
            console.error('Error toggling product:', error);
            toast.error('Error al actualizar producto');
        }
    }

    function openNewModal() {
        setEditingProducto(null);
        setFormData(emptyProducto);
        setModalOpen(true);
    }

    if (loading) {
        return (
            <div className="productos-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
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
        const mat = config.materiales.find(m => m.id === materialId);
        return mat?.nombre || materialId;
    }

    function getCategoriaName(catId) {
        const cat = config.categorias.find(c => c.id === catId);
        return cat?.nombre || catId;
    }

    return (
        <div className="productos-page">
            <div className="page-header">
                <div className="page-title">
                    <div className="icon">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1>Productos</h1>
                        <p className="text-muted">{productos.length} producto{productos.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openNewModal}>
                    <Plus size={18} />
                    Nuevo Producto
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar mb-lg">
                <div className="search-box">
                    <Search className="icon" size={18} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Buscar producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="form-select"
                    value={filterMaterial}
                    onChange={(e) => setFilterMaterial(e.target.value)}
                >
                    <option value="">Todos los materiales</option>
                    {config.materiales.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                </select>

                <select
                    className="form-select"
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value)}
                >
                    <option value="">Todas las categorías</option>
                    {config.categorias.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Products Table */}
            {filteredProductos.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Package size={32} />
                        </div>
                        <h3 className="empty-state-title">No hay productos</h3>
                        <p className="empty-state-description">
                            Agregá productos para poder cotizar
                        </p>
                        <button className="btn btn-primary" onClick={openNewModal}>
                            <Plus size={18} />
                            Agregar Producto
                        </button>
                    </div>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Material</th>
                                <th>Categoría</th>
                                <th>Precio Base</th>
                                <th>Tiempo Est.</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProductos.map(producto => (
                                <tr key={producto.id} style={{ opacity: producto.activo ? 1 : 0.5 }}>
                                    <td>
                                        <div className="producto-nombre">{producto.nombre}</div>
                                        {producto.descripcion && (
                                            <div className="producto-desc text-muted">{producto.descripcion}</div>
                                        )}
                                    </td>
                                    <td data-label="Material">
                                        <span className={`badge ${getMaterialBadgeClass(producto.material)}`}>
                                            {getMaterialName(producto.material)}
                                        </span>
                                    </td>
                                    <td data-label="Categoría">{getCategoriaName(producto.categoria)}</td>
                                    <td data-label="Precio" className="font-bold">${producto.precioBase?.toLocaleString()}</td>
                                    <td data-label="Tiempo">{producto.tiempoEstimado} min</td>
                                    <td data-label="Estado">
                                        <span
                                            className={`badge ${producto.activo ? 'badge-success' : 'badge-default'}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleToggleActivo(producto)}
                                        >
                                            {producto.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleEdit(producto)}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleDelete(producto)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingProducto(null);
                    setFormData(emptyProducto);
                }}
                title={editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingProducto ? 'Guardar Cambios' : 'Crear Producto'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nombre del Producto *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej: Etiqueta MDF 5x3"
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Material *</label>
                            <select
                                className="form-select"
                                value={formData.material}
                                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                            >
                                {config.materiales.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Categoría *</label>
                            <select
                                className="form-select"
                                value={formData.categoria}
                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                            >
                                {config.categorias.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Precio Base ($) *</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.precioBase}
                                onChange={(e) => setFormData({ ...formData, precioBase: Number(e.target.value) })}
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tiempo Estimado (min)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.tiempoEstimado}
                                onChange={(e) => setFormData({ ...formData, tiempoEstimado: Number(e.target.value) })}
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <textarea
                            className="form-textarea"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            placeholder="Descripción del producto..."
                            rows="2"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-check">
                            <input
                                type="checkbox"
                                checked={formData.activo}
                                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                            />
                            <span>Producto activo</span>
                        </label>
                    </div>
                </form>
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
        
        .producto-nombre {
          font-weight: 500;
        }
        
        .producto-desc {
          font-size: 0.75rem;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        @media (max-width: 768px) {
          .productos-page .page-header {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          
          .productos-page .page-header .btn {
            width: 100%;
            justify-content: center;
          }
          
          .filters-bar {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .filters-bar .search-box {
            width: 100%;
          }
          
          .filters-bar .form-select {
            width: 100%;
          }
          
          /* Card-based layout for mobile */
          .table-container {
            overflow: visible;
          }
          
          .productos-page .table {
            display: block;
          }
          
          .productos-page .table thead {
            display: none;
          }
          
          .productos-page .table tbody {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .productos-page .table tr {
            display: flex;
            flex-direction: column;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 0.75rem;
            gap: 0.5rem;
          }
          
          .productos-page .table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.25rem 0;
            border: none;
          }
          
          .productos-page .table td::before {
            content: attr(data-label);
            font-weight: 600;
            font-size: 0.7rem;
            color: var(--text-muted);
            text-transform: uppercase;
          }
          
          .productos-page .table td:first-child {
            flex-direction: column;
            align-items: flex-start;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 0.25rem;
          }
          
          .productos-page .table td:first-child::before {
            display: none;
          }
          
          .productos-page .table td:last-child {
            justify-content: flex-end;
            padding-top: 0.5rem;
            border-top: 1px solid var(--border-color);
            margin-top: 0.25rem;
          }
          
          .productos-page .table td:last-child::before {
            display: none;
          }
          
          .producto-nombre {
            font-size: 1rem;
          }
          
          .producto-desc {
            max-width: 100%;
          }
          
          .table-actions {
            gap: 0.5rem;
          }
          
          .table-actions .btn {
            min-width: 40px;
            min-height: 40px;
          }
        }
        
        /* iPhone Pro Max Optimized */
        @media (max-width: 430px) {
          .productos-page .page-header {
            margin-bottom: 1rem;
          }
          
          .productos-page .page-header h1 {
            font-size: 1.2rem;
          }
          
          .productos-page .page-header h1 svg {
            width: 22px;
            height: 22px;
          }
          
          /* Search compact */
          .productos-page .filters-bar {
            gap: 0.5rem;
          }
          
          .productos-page .search-box input {
            font-size: 16px;
            padding: 0.65rem 0.75rem 0.65rem 2.5rem;
          }
          
          .productos-page .form-select {
            font-size: 16px;
            padding: 0.65rem 0.75rem;
          }
          
          /* Product cards compact */
          .productos-page .table tr {
            padding: 0.75rem;
          }
          
          .producto-nombre {
            font-size: 0.95rem;
          }
          
          .producto-desc {
            font-size: 0.75rem;
          }
          
          .productos-page .table td {
            font-size: 0.85rem;
          }
          
          .productos-page .table td::before {
            font-size: 0.65rem;
          }
          
          .table-actions .btn {
            min-width: 36px;
            min-height: 36px;
          }
          
          .table-actions .btn svg {
            width: 16px;
            height: 16px;
          }
          
          /* Modal form */
          .modal-form input,
          .modal-form select,
          .modal-form textarea {
            font-size: 16px;
            padding: 0.75rem;
          }
          
          .modal-actions {
            flex-direction: column;
          }
          
          .modal-actions .btn {
            width: 100%;
            padding: 0.875rem;
          }
        }
      `}</style>
        </div>
    );
}
