import { useState, useEffect } from 'react';
import {
    Settings,
    Save,
    Download,
    Upload,
    Plus,
    Trash2,
    Building,
    Phone,
    Calendar,
    Palette,
    Truck,
    Key,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react';
import {
    getConfiguracionAsync,
    saveConfiguracionAsync,
    exportData,
    importData
} from '../lib/storageApi';
import toast from 'react-hot-toast';

export default function Configuracion() {
    const [config, setConfig] = useState({
        nombreNegocio: '',
        telefono: '',
        whatsapp: '',
        email: '',
        direccion: '',
        diasHabilesEntrega: 7,
        diasHabilesMax: 10,
        margenDefault: 30,
        materiales: [],
        categorias: [],
        correoArgentinoApiKey: '',
        correoArgentinoAgreement: '',
        correoArgentinoTestMode: true,
    });

    const [nuevoMaterial, setNuevoMaterial] = useState({ nombre: '', color: '#f59e0b' });
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const savedConfig = await getConfiguracionAsync();
            setConfig(savedConfig);
        } catch (error) {
            console.error('Error loading config:', error);
            toast.error('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            setSaving(true);
            await saveConfiguracionAsync(config);
            toast.success('Configuración guardada');
        } catch (error) {
            console.error('Error saving config:', error);
            toast.error('Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    }

    function handleExport() {
        exportData();
        toast.success('Backup descargado');
    }

    function handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const success = importData(event.target.result);
                if (success) {
                    toast.success('Datos importados correctamente');
                    setConfig(getConfiguracion());
                } else {
                    toast.error('Error al importar datos');
                }
            } catch (error) {
                toast.error('Archivo inválido');
            }
        };
        reader.readAsText(file);
    }

    function addMaterial() {
        if (!nuevoMaterial.nombre.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        const id = nuevoMaterial.nombre.toLowerCase().replace(/\s+/g, '_');
        setConfig({
            ...config,
            materiales: [...config.materiales, { id, ...nuevoMaterial }]
        });
        setNuevoMaterial({ nombre: '', color: '#f59e0b' });
        toast.success('Material agregado');
    }

    function removeMaterial(id) {
        setConfig({
            ...config,
            materiales: config.materiales.filter(m => m.id !== id)
        });
    }

    function addCategoria() {
        if (!nuevaCategoria.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        const id = nuevaCategoria.toLowerCase().replace(/\s+/g, '_');
        setConfig({
            ...config,
            categorias: [...config.categorias, { id, nombre: nuevaCategoria }]
        });
        setNuevaCategoria('');
        toast.success('Categoría agregada');
    }

    function removeCategoria(id) {
        setConfig({
            ...config,
            categorias: config.categorias.filter(c => c.id !== id)
        });
    }

    if (loading) {
        return (
            <div className="configuracion-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div className="configuracion-page">
            <div className="page-header">
                <div className="page-title">
                    <div className="icon">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h1>Configuración</h1>
                        <p className="text-muted">Personalizá tu sistema</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={handleSave}>
                    <Save size={18} />
                    Guardar Cambios
                </button>
            </div>

            <div className="config-grid">
                {/* Datos del Negocio */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Building size={18} />
                            Datos del Negocio
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">Nombre del Negocio</label>
                            <input
                                type="text"
                                className="form-input"
                                value={config.nombreNegocio}
                                onChange={(e) => setConfig({ ...config, nombreNegocio: e.target.value })}
                                placeholder="Grabados Express"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={config.telefono}
                                    onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                                    placeholder="1123456789"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">WhatsApp</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={config.whatsapp}
                                    onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                                    placeholder="1123456789"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={config.email}
                                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                                placeholder="contacto@grabadosexpress.com"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Dirección</label>
                            <input
                                type="text"
                                className="form-input"
                                value={config.direccion}
                                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                                placeholder="Calle 123, Ciudad"
                            />
                        </div>
                    </div>
                </div>

                {/* Tiempos de Entrega */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Calendar size={18} />
                            Tiempos de Entrega
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Días hábiles (mínimo)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={config.diasHabilesEntrega}
                                    onChange={(e) => setConfig({ ...config, diasHabilesEntrega: Number(e.target.value) })}
                                    min="1"
                                    max="30"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Días hábiles (máximo)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={config.diasHabilesMax}
                                    onChange={(e) => setConfig({ ...config, diasHabilesMax: Number(e.target.value) })}
                                    min="1"
                                    max="30"
                                />
                            </div>
                        </div>

                        <p className="text-muted text-sm">
                            La fecha de entrega se calcula automáticamente al pasar un pedido a producción.
                            Se excluyen fines de semana y feriados.
                        </p>
                    </div>
                </div>

                {/* Materiales */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Palette size={18} />
                            Materiales
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="items-list">
                            {config.materiales?.map(material => (
                                <div key={material.id} className="item-row">
                                    <div
                                        className="item-color"
                                        style={{ background: material.color }}
                                    />
                                    <span className="item-name">{material.nombre}</span>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => removeMaterial(material.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="add-item-row">
                            <input
                                type="text"
                                className="form-input"
                                value={nuevoMaterial.nombre}
                                onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, nombre: e.target.value })}
                                placeholder="Nuevo material..."
                            />
                            <input
                                type="color"
                                className="color-input"
                                value={nuevoMaterial.color}
                                onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, color: e.target.value })}
                            />
                            <button className="btn btn-primary btn-sm" onClick={addMaterial}>
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Categorías */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Settings size={18} />
                            Categorías de Productos
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="items-list">
                            {config.categorias?.map(categoria => (
                                <div key={categoria.id} className="item-row">
                                    <span className="item-name">{categoria.nombre}</span>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => removeCategoria(categoria.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="add-item-row">
                            <input
                                type="text"
                                className="form-input"
                                value={nuevaCategoria}
                                onChange={(e) => setNuevaCategoria(e.target.value)}
                                placeholder="Nueva categoría..."
                            />
                            <button className="btn btn-primary btn-sm" onClick={addCategoria}>
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Correo Argentino */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Truck size={18} />
                            Correo Argentino (PAQ.AR)
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="api-status mb-md">
                            {config.correoArgentinoApiKey && config.correoArgentinoAgreement ? (
                                <span className="status-badge status-ok">
                                    <CheckCircle size={14} />
                                    Credenciales configuradas
                                </span>
                            ) : (
                                <span className="status-badge status-pending">
                                    <XCircle size={14} />
                                    Sin configurar
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Agreement (Código de Acuerdo)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={config.correoArgentinoAgreement || ''}
                                onChange={(e) => setConfig({ ...config, correoArgentinoAgreement: e.target.value })}
                                placeholder="Ej: 18017"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">API Key</label>
                            <input
                                type="password"
                                className="form-input"
                                value={config.correoArgentinoApiKey || ''}
                                onChange={(e) => setConfig({ ...config, correoArgentinoApiKey: e.target.value })}
                                placeholder="Tu clave de API"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-check">
                                <input
                                    type="checkbox"
                                    checked={config.correoArgentinoTestMode !== false}
                                    onChange={(e) => setConfig({ ...config, correoArgentinoTestMode: e.target.checked })}
                                />
                                <span>Modo de prueba (usar servidor de test)</span>
                            </label>
                        </div>

                        <p className="text-muted text-sm">
                            Obtené tus credenciales en <a href="https://micorreo.correoargentino.com.ar" target="_blank" rel="noopener noreferrer">MiCorreo</a> → Integraciones
                        </p>
                    </div>
                </div>

                {/* MiCorreo API - Cotizador */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Truck size={18} />
                            MiCorreo (Cotizador)
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="api-status mb-md">
                            {config.miCorreoUsername && config.miCorreoPassword ? (
                                <span className="status-badge status-ok">
                                    <CheckCircle size={14} />
                                    Credenciales configuradas
                                </span>
                            ) : (
                                <span className="status-badge status-pending">
                                    <XCircle size={14} />
                                    Sin configurar
                                </span>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Usuario</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={config.miCorreoUsername || ''}
                                    onChange={(e) => setConfig({ ...config, miCorreoUsername: e.target.value })}
                                    placeholder="Usuario de API"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contraseña</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={config.miCorreoPassword || ''}
                                    onChange={(e) => setConfig({ ...config, miCorreoPassword: e.target.value })}
                                    placeholder="Contraseña de API"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Customer ID</label>
                            <input
                                type="text"
                                className="form-input"
                                value={config.miCorreoCustomerId || ''}
                                onChange={(e) => setConfig({ ...config, miCorreoCustomerId: e.target.value })}
                                placeholder="Ej: 0090000025"
                            />
                            <p className="text-muted text-sm mt-sm">
                                Se obtiene al registrarse o validar usuario en MiCorreo
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-check">
                                <input
                                    type="checkbox"
                                    checked={config.miCorreoTestMode !== false}
                                    onChange={(e) => setConfig({ ...config, miCorreoTestMode: e.target.checked })}
                                />
                                <span>Modo de prueba (usar servidor de test)</span>
                            </label>
                        </div>

                        <p className="text-muted text-sm">
                            Esta API permite cotizar envíos antes de crearlos. Solicitá credenciales a Correo Argentino.
                        </p>
                    </div>
                </div>

                {/* Backup */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Download size={18} />
                            Backup de Datos
                        </h3>
                    </div>
                    <div className="card-body">
                        <p className="text-muted mb-md">
                            Descargá una copia de todos tus datos o restaurá desde un backup anterior.
                        </p>

                        <div className="backup-actions">
                            <button className="btn btn-secondary" onClick={handleExport}>
                                <Download size={18} />
                                Descargar Backup
                            </button>

                            <label className="btn btn-secondary">
                                <Upload size={18} />
                                Restaurar Backup
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .config-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .text-sm {
          font-size: 0.875rem;
        }
        
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .item-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .item-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        
        .item-name {
          flex: 1;
          font-size: 0.875rem;
        }
        
        .add-item-row {
          display: flex;
          gap: 0.5rem;
        }
        
        .add-item-row .form-input {
          flex: 1;
        }
        
        .color-input {
          width: 40px;
          height: 38px;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          padding: 0;
        }
        
        .backup-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        
        .backup-actions .btn {
          flex: 1;
          min-width: 150px;
          justify-content: center;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .status-ok {
          background: var(--success-bg);
          color: var(--success);
        }
        
        .status-pending {
          background: var(--warning-bg);
          color: var(--warning);
        }
        
        .form-check {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        
        .form-check input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--accent);
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .configuracion-page .page-header {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          
          .configuracion-page .page-header .btn {
            width: 100%;
            justify-content: center;
          }
          
          .config-grid {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          
          .add-item-row {
            flex-wrap: wrap;
          }
          
          .add-item-row .form-input {
            min-width: 0;
          }
          
          .backup-actions {
            flex-direction: column;
          }
          
          .backup-actions .btn {
            width: 100%;
          }
        }
        
        /* iPhone Pro Max Optimized */
        @media (max-width: 430px) {
          .configuracion-page .page-header {
            margin-bottom: 1rem;
          }
          
          .configuracion-page .page-header h1 {
            font-size: 1.2rem;
          }
          
          .configuracion-page .page-header h1 svg {
            width: 22px;
            height: 22px;
          }
          
          /* Config cards compact */
          .config-card {
            padding: 0.875rem;
          }
          
          .config-title {
            font-size: 0.95rem;
            margin-bottom: 0.75rem;
          }
          
          .config-title svg {
            width: 18px;
            height: 18px;
          }
          
          /* Form inputs */
          .form-group label {
            font-size: 0.8rem;
            margin-bottom: 0.375rem;
          }
          
          .form-input,
          input,
          select {
            font-size: 16px;
            padding: 0.7rem 0.875rem;
          }
          
          .form-row {
            gap: 0.625rem !important;
          }
          
          /* Add item row */
          .add-item-row {
            gap: 0.5rem;
          }
          
          .add-item-row .form-input {
            font-size: 16px;
          }
          
          .add-item-row .btn {
            padding: 0.65rem 0.875rem;
            font-size: 0.8rem;
          }
          
          /* Lists */
          .config-list {
            gap: 0.375rem;
          }
          
          .config-item {
            padding: 0.625rem;
            font-size: 0.85rem;
          }
          
          .config-item .btn-icon {
            width: 32px;
            height: 32px;
          }
          
          /* Checkbox */
          .form-check {
            gap: 0.625rem;
            font-size: 0.85rem;
          }
          
          .form-check input[type="checkbox"] {
            width: 20px;
            height: 20px;
          }
          
          /* Backup actions */
          .backup-actions {
            gap: 0.5rem;
          }
          
          .backup-actions .btn {
            padding: 0.875rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
        </div>
    );
}
