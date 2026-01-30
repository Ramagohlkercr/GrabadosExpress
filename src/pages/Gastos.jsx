import { useState, useEffect } from 'react';
import { 
    Receipt, Plus, Search, Edit2, Trash2, X, Save, 
    DollarSign, Calendar, Tag, FileText, Building2,
    TrendingDown, Wallet, CreditCard, PieChart,
    ArrowUpRight, ArrowDownRight, MoreVertical
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Modal from '../components/ui/Modal';
import { gastosApi } from '../lib/api';

// Categorías predefinidas con iconos y colores
const CATEGORIAS = [
    { nombre: 'Materiales', color: '#3b82f6', icon: '🪵' },
    { nombre: 'Insumos', color: '#10b981', icon: '📦' },
    { nombre: 'Servicios', color: '#8b5cf6', icon: '⚡' },
    { nombre: 'Alquiler', color: '#f59e0b', icon: '🏠' },
    { nombre: 'Impuestos', color: '#ef4444', icon: '📋' },
    { nombre: 'Sueldos', color: '#06b6d4', icon: '👥' },
    { nombre: 'Marketing', color: '#ec4899', icon: '📢' },
    { nombre: 'Envíos', color: '#f97316', icon: '🚚' },
    { nombre: 'Mantenimiento', color: '#6366f1', icon: '🔧' },
    { nombre: 'Software', color: '#14b8a6', icon: '💻' },
    { nombre: 'Otros', color: '#71717a', icon: '📎' }
];

const getCategoriaInfo = (nombre) => {
    return CATEGORIAS.find(c => c.nombre === nombre) || { color: '#71717a', icon: '📎' };
};

export default function Gastos() {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingGasto, setEditingGasto] = useState(null);
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        categoria: '',
        descripcion: '',
        monto: '',
        proveedor: '',
        comprobante: '',
        notas: ''
    });

    useEffect(() => {
        loadGastos();
    }, []);

    const loadGastos = async () => {
        try {
            setLoading(true);
            const data = await gastosApi.getAll();
            setGastos(data);
        } catch (error) {
            console.error('Error loading gastos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingGasto) {
                await gastosApi.update(editingGasto.id, formData);
            } else {
                await gastosApi.create(formData);
            }
            await loadGastos();
            closeModal();
        } catch (error) {
            console.error('Error saving gasto:', error);
            alert('Error al guardar el gasto');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
        try {
            await gastosApi.delete(id);
            await loadGastos();
        } catch (error) {
            console.error('Error deleting gasto:', error);
            alert('Error al eliminar el gasto');
        }
    };

    const openModal = (gasto = null) => {
        if (gasto) {
            setEditingGasto(gasto);
            setFormData({
                fecha: gasto.fecha?.split('T')[0] || '',
                categoria: gasto.categoria || '',
                descripcion: gasto.descripcion || '',
                monto: gasto.monto || '',
                proveedor: gasto.proveedor || '',
                comprobante: gasto.comprobante || '',
                notas: gasto.notas || ''
            });
        } else {
            setEditingGasto(null);
            setFormData({
                fecha: new Date().toISOString().split('T')[0],
                categoria: '',
                descripcion: '',
                monto: '',
                proveedor: '',
                comprobante: '',
                notas: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingGasto(null);
    };

    // Filter gastos
    const filteredGastos = gastos.filter(gasto => {
        const matchesSearch = 
            gasto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            gasto.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            gasto.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategoria = !filterCategoria || gasto.categoria === filterCategoria;
        return matchesSearch && matchesCategoria;
    });

    // Calculate totals
    const totalGastos = filteredGastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
    const gastosMes = gastos.filter(g => {
        const fecha = new Date(g.fecha);
        const now = new Date();
        return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
    }).reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);

    // Group by category for summary
    const gastosPorCategoria = filteredGastos.reduce((acc, g) => {
        acc[g.categoria] = (acc[g.categoria] || 0) + parseFloat(g.monto || 0);
        return acc;
    }, {});

    // Data for pie chart
    const pieData = Object.entries(gastosPorCategoria).map(([name, value]) => ({
        name,
        value,
        color: getCategoriaInfo(name).color
    })).sort((a, b) => b.value - a.value);

    // Calculate month comparison
    const now = new Date();
    const lastMonth = gastos.filter(g => {
        const fecha = new Date(g.fecha);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return fecha.getMonth() === lastMonthDate.getMonth() && fecha.getFullYear() === lastMonthDate.getFullYear();
    }).reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
    
    const monthChange = lastMonth > 0 ? ((gastosMes - lastMonth) / lastMonth * 100).toFixed(1) : 0;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(value);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-AR');
    };

    return (
        <div className="gastos-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1><Receipt size={28} /> Gastos</h1>
                    <p>Control de gastos y egresos del negocio</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} /> Nuevo Gasto
                </button>
            </div>

            {/* Stats Cards */}
            <div className="gastos-stats">
                <div className="gasto-stat-card main">
                    <div className="gasto-stat-icon">
                        <Wallet size={28} />
                    </div>
                    <div className="gasto-stat-content">
                        <span className="gasto-stat-label">Gastos Este Mes</span>
                        <span className="gasto-stat-value">{formatCurrency(gastosMes)}</span>
                        <div className={`gasto-stat-change ${parseFloat(monthChange) > 0 ? 'negative' : 'positive'}`}>
                            {parseFloat(monthChange) > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(monthChange)}% vs mes anterior
                        </div>
                    </div>
                </div>
                
                <div className="gasto-stat-card">
                    <div className="gasto-stat-icon secondary">
                        <CreditCard size={24} />
                    </div>
                    <div className="gasto-stat-content">
                        <span className="gasto-stat-label">Total Filtrado</span>
                        <span className="gasto-stat-value">{formatCurrency(totalGastos)}</span>
                    </div>
                </div>
                
                <div className="gasto-stat-card">
                    <div className="gasto-stat-icon tertiary">
                        <FileText size={24} />
                    </div>
                    <div className="gasto-stat-content">
                        <span className="gasto-stat-label">Registros</span>
                        <span className="gasto-stat-value">{filteredGastos.length}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="gastos-content">
                {/* Left: Table */}
                <div className="gastos-main">
                    {/* Filters */}
                    <div className="gastos-filters">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por descripción, proveedor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select 
                            value={filterCategoria}
                            onChange={(e) => setFilterCategoria(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Todas las categorías</option>
                            {CATEGORIAS.map(cat => (
                                <option key={cat.nombre} value={cat.nombre}>{cat.icon} {cat.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Table */}
                    <div className="gastos-table-wrapper">
                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Cargando gastos...</p>
                            </div>
                        ) : filteredGastos.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <Receipt size={48} />
                                </div>
                                <h3>No hay gastos registrados</h3>
                                <p>Comienza agregando tu primer gasto</p>
                                <button className="btn btn-primary" onClick={() => openModal()}>
                                    <Plus size={18} /> Registrar Gasto
                                </button>
                            </div>
                        ) : (
                            <div className="gastos-list">
                                {filteredGastos.map(gasto => {
                                    const catInfo = getCategoriaInfo(gasto.categoria);
                                    return (
                                        <div key={gasto.id} className="gasto-item">
                                            <div className="gasto-item-icon" style={{ background: `${catInfo.color}20`, color: catInfo.color }}>
                                                <span>{catInfo.icon}</span>
                                            </div>
                                            <div className="gasto-item-info">
                                                <div className="gasto-item-main">
                                                    <span className="gasto-item-desc">{gasto.descripcion || gasto.categoria}</span>
                                                    <span className="gasto-item-monto">-{formatCurrency(gasto.monto)}</span>
                                                </div>
                                                <div className="gasto-item-meta">
                                                    <span className="gasto-item-date">
                                                        <Calendar size={12} /> {formatDate(gasto.fecha)}
                                                    </span>
                                                    {gasto.proveedor && (
                                                        <span className="gasto-item-proveedor">
                                                            <Building2 size={12} /> {gasto.proveedor}
                                                        </span>
                                                    )}
                                                    <span className="gasto-item-cat" style={{ background: `${catInfo.color}15`, color: catInfo.color }}>
                                                        {gasto.categoria}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="gasto-item-actions">
                                                <button className="btn-icon-sm" onClick={() => openModal(gasto)} title="Editar">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="btn-icon-sm danger" onClick={() => handleDelete(gasto.id)} title="Eliminar">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Summary */}
                <div className="gastos-sidebar">
                    {/* Pie Chart */}
                    {pieData.length > 0 && (
                        <div className="summary-card">
                            <div className="summary-header">
                                <PieChart size={18} />
                                <h3>Distribución</h3>
                            </div>
                            <div className="pie-chart-container">
                                <ResponsiveContainer width="100%" height={180}>
                                    <RechartsPie>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                            <div className="category-legend">
                                {pieData.slice(0, 5).map((cat, i) => (
                                    <div 
                                        key={cat.name} 
                                        className={`legend-item ${filterCategoria === cat.name ? 'active' : ''}`}
                                        onClick={() => setFilterCategoria(filterCategoria === cat.name ? '' : cat.name)}
                                    >
                                        <span className="legend-color" style={{ background: cat.color }}></span>
                                        <span className="legend-name">{cat.name}</span>
                                        <span className="legend-value">{formatCurrency(cat.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Categories */}
                    <div className="summary-card">
                        <div className="summary-header">
                            <Tag size={18} />
                            <h3>Categorías</h3>
                        </div>
                        <div className="quick-categories">
                            {CATEGORIAS.map(cat => {
                                const amount = gastosPorCategoria[cat.nombre] || 0;
                                const isActive = filterCategoria === cat.nombre;
                                return (
                                    <button
                                        key={cat.nombre}
                                        className={`quick-cat-btn ${isActive ? 'active' : ''} ${amount === 0 ? 'empty' : ''}`}
                                        onClick={() => setFilterCategoria(isActive ? '' : cat.nombre)}
                                        style={{ '--cat-color': cat.color }}
                                    >
                                        <span className="cat-emoji">{cat.icon}</span>
                                        <span className="cat-label">{cat.nombre}</span>
                                        {amount > 0 && <span className="cat-amount">{formatCurrency(amount)}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            <Modal isOpen={showModal} onClose={closeModal}>
                <div className="modal-header">
                    <h2>{editingGasto ? '✏️ Editar Gasto' : '➕ Nuevo Gasto'}</h2>
                    <button className="btn-icon" onClick={closeModal}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label><Calendar size={16} /> Fecha</label>
                            <input
                                type="date"
                                value={formData.fecha}
                                onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label><DollarSign size={16} /> Monto</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.monto}
                                onChange={(e) => setFormData({...formData, monto: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label><Tag size={16} /> Categoría</label>
                        <select
                            value={formData.categoria}
                            onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                            required
                        >
                            <option value="">Seleccionar categoría</option>
                            {CATEGORIAS.map(cat => (
                                <option key={cat.nombre} value={cat.nombre}>{cat.icon} {cat.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label><FileText size={16} /> Descripción</label>
                        <input
                            type="text"
                            placeholder="Descripción del gasto"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><Building2 size={16} /> Proveedor</label>
                            <input
                                type="text"
                                placeholder="Nombre del proveedor"
                                value={formData.proveedor}
                                onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label><Receipt size={16} /> Comprobante</label>
                            <input
                                type="text"
                                placeholder="Nº de factura/ticket"
                                value={formData.comprobante}
                                onChange={(e) => setFormData({...formData, comprobante: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>📝 Notas</label>
                        <textarea
                            placeholder="Notas adicionales..."
                            value={formData.notas}
                            onChange={(e) => setFormData({...formData, notas: e.target.value})}
                            rows={3}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> {editingGasto ? 'Guardar Cambios' : 'Registrar Gasto'}
                        </button>
                    </div>
                </form>
            </Modal>

            <style>{`
                .gastos-page {
                    padding: 0;
                    min-height: 100vh;
                }

                /* Stats Cards */
                .gastos-stats {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr;
                    gap: 1.25rem;
                    margin-bottom: 1.5rem;
                }

                .gasto-stat-card {
                    background: linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .gasto-stat-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .gasto-stat-card:hover::before {
                    opacity: 1;
                }

                .gasto-stat-card.main {
                    background: linear-gradient(145deg, rgba(239, 68, 68, 0.1) 0%, var(--bg-secondary) 100%);
                    border-color: rgba(239, 68, 68, 0.3);
                }

                .gasto-stat-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
                }

                .gasto-stat-icon.secondary {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
                }

                .gasto-stat-icon.tertiary {
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
                }

                .gasto-stat-content {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .gasto-stat-label {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                    font-weight: 500;
                }

                .gasto-stat-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    letter-spacing: -0.5px;
                }

                .gasto-stat-change {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.8rem;
                    font-weight: 500;
                    margin-top: 0.25rem;
                }

                .gasto-stat-change.positive {
                    color: #22c55e;
                }

                .gasto-stat-change.negative {
                    color: #ef4444;
                }

                /* Main Content Grid */
                .gastos-content {
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 1.5rem;
                }

                .gastos-main {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    overflow: hidden;
                }

                /* Filters */
                .gastos-filters {
                    display: flex;
                    gap: 1rem;
                    padding: 1.25rem;
                    border-bottom: 1px solid var(--border-color);
                    background: var(--bg-tertiary);
                }

                .gastos-filters .search-box {
                    flex: 1;
                }

                .gastos-filters .filter-select {
                    min-width: 200px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                    border-radius: 10px;
                    padding: 0.75rem 1rem;
                }

                /* Table Wrapper */
                .gastos-table-wrapper {
                    min-height: 400px;
                }

                /* Loading State */
                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem 2rem;
                    gap: 1rem;
                    color: var(--text-muted);
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border-color);
                    border-top-color: var(--accent-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Empty State */
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem 2rem;
                    text-align: center;
                }

                .empty-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ef4444;
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                }

                .empty-state p {
                    color: var(--text-muted);
                    margin-bottom: 1.5rem;
                }

                /* Gasto List */
                .gastos-list {
                    display: flex;
                    flex-direction: column;
                }

                .gasto-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border-color);
                    transition: all 0.2s ease;
                }

                .gasto-item:hover {
                    background: rgba(245, 158, 11, 0.03);
                }

                .gasto-item:last-child {
                    border-bottom: none;
                }

                .gasto-item-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }

                .gasto-item-info {
                    flex: 1;
                    min-width: 0;
                }

                .gasto-item-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.35rem;
                }

                .gasto-item-desc {
                    font-weight: 600;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .gasto-item-monto {
                    font-weight: 700;
                    color: #ef4444;
                    font-size: 1.05rem;
                    flex-shrink: 0;
                    margin-left: 1rem;
                }

                .gasto-item-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .gasto-item-date,
                .gasto-item-proveedor {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }

                .gasto-item-cat {
                    font-size: 0.7rem;
                    padding: 0.2rem 0.6rem;
                    border-radius: 10px;
                    font-weight: 500;
                }

                .gasto-item-actions {
                    display: flex;
                    gap: 0.5rem;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .gasto-item:hover .gasto-item-actions {
                    opacity: 1;
                }

                .btn-icon-sm {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: none;
                    background: var(--bg-tertiary);
                    color: var(--text-muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .btn-icon-sm:hover {
                    background: var(--accent-color);
                    color: black;
                }

                .btn-icon-sm.danger:hover {
                    background: #ef4444;
                    color: white;
                }

                /* Sidebar */
                .gastos-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .summary-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 1.25rem;
                }

                .summary-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                    color: var(--text-primary);
                }

                .summary-header h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0;
                }

                /* Pie Chart */
                .pie-chart-container {
                    margin-bottom: 1rem;
                }

                .category-legend {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem 0.75rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .legend-item:hover {
                    background: var(--bg-tertiary);
                }

                .legend-item.active {
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid var(--accent-color);
                    margin: -1px;
                }

                .legend-color {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .legend-name {
                    flex: 1;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }

                .legend-value {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                /* Quick Categories */
                .quick-categories {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }

                .quick-cat-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.65rem 0.85rem;
                    background: var(--bg-tertiary);
                    border: 1px solid transparent;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                }

                .quick-cat-btn:hover {
                    border-color: var(--cat-color);
                    background: color-mix(in srgb, var(--cat-color) 10%, var(--bg-tertiary));
                }

                .quick-cat-btn.active {
                    border-color: var(--cat-color);
                    background: color-mix(in srgb, var(--cat-color) 15%, var(--bg-tertiary));
                    box-shadow: 0 0 15px color-mix(in srgb, var(--cat-color) 20%, transparent);
                }

                .quick-cat-btn.empty {
                    opacity: 0.5;
                }

                .cat-emoji {
                    font-size: 1.1rem;
                }

                .cat-label {
                    flex: 1;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .cat-amount {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--cat-color);
                }

                /* Modal Styles */
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .modal-header h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }

                .modal-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 0.5rem;
                    padding-top: 1.25rem;
                    border-top: 1px solid var(--border-color);
                }

                /* Responsive */
                @media (max-width: 1200px) {
                    .gastos-content {
                        grid-template-columns: 1fr;
                    }
                    
                    .gastos-sidebar {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .gastos-stats {
                        grid-template-columns: 1fr;
                    }
                    
                    .gastos-sidebar {
                        grid-template-columns: 1fr;
                    }
                    
                    .gastos-filters {
                        flex-direction: column;
                    }
                    
                    .gastos-filters .filter-select {
                        min-width: auto;
                    }
                    
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .gasto-item-actions {
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
