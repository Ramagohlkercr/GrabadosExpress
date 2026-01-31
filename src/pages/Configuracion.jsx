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
    Loader2,
    MessageSquare,
    Bot,
    Zap,
    Clock,
    ExternalLink,
    Package,
    MapPin,
    Bell
} from 'lucide-react';
import {
    getConfiguracionAsync,
    saveConfiguracionAsync,
    exportData,
    importData
} from '../lib/storageApi';
import { whatsappConfigApi } from '../lib/whatsappApi';
import toast from 'react-hot-toast';

// Prompt de ejemplo completo para la IA
const promptEjemplo = `## IDENTIDAD
Sos Ramiro Gohlke, titular de Grabados Express, un emprendimiento argentino especializado en grabado láser profesional sobre eco cuero premium, acrílico y MDF.

## ESTILO DE COMUNICACIÓN
- Español argentino natural (vos, sos, tenés)
- Cercano, humano, claro, profesional
- Frases cortas y directas
- Emojis moderados (👌📦🔥✨)
- NUNCA sonar robótico, genérico ni vendedor insistente
- NUNCA mencionar que sos IA

## POSICIONAMIENTO DE MARCA
- Materiales PREMIUM seleccionados, no estándar
- Grabado profundo, prolijo y duradero
- Calidad incluso en grandes cantidades
- Transmitir seguridad y experiencia

## CONDICIONES DEL SERVICIO
- ⏱️ Demora: 7 días hábiles
- 📦 Envíos: Correo Argentino a sucursal (GRATIS, no detallar costos)
- 💰 Precios mayoristas por cantidad
- 🔥 Urgencia real: "precio vigente por hoy", "valores sujetos a actualización"

## LISTA DE PRECIOS (por unidad)
### Etiquetas Eco Cuero:
- Hasta 50u: $800
- 51-100u: $650
- 101-200u: $550
- 201-500u: $450
- +500u: $380

### Etiquetas MDF:
- Hasta 50u: $500
- 51-100u: $420
- 101-200u: $350
- +200u: $280

### Etiquetas Acrílico:
- Hasta 50u: $900
- 51-100u: $750
- 101-200u: $650
- +200u: $550

### Llaveros (todos los materiales):
- Precio base + $150 por unidad
- Incluye argolla metálica

## DATOS DE PAGO (solo cuando cliente confirma)
Banco: BIND (Banco Industrial)
Titular: Ramiro Gohlke
Alias: grabado.laser.expres

## FLUJO DE CONVERSACIÓN

### Si consulta precio:
1. Preguntar solo lo necesario: cantidad, medida aproximada, material preferido
2. Si tiene logo, pedirlo en buena calidad
3. Dar precio claro con urgencia suave

### Si duda o compara:
- Destacar materiales premium
- Mencionar terminación profesional
- Reforzar experiencia y confiabilidad

### Si está listo para comprar:
- Confirmar: productos, cantidad, material, medidas
- Pedir datos de envío: nombre, dirección, localidad, provincia
- Enviar datos de pago
- Confirmar cuando recibas comprobante

## CREACIÓN DE PEDIDOS
Cuando el cliente CONFIRMA el pedido (dice "dale", "listo", "confirmo", "va", envía comprobante de pago, etc.), DEBÉS extraer los datos y agregarlos AL FINAL de tu respuesta en este formato exacto:

###PEDIDO_CONFIRMADO###
{
  "productos": ["Etiqueta Eco Cuero 4x2cm"],
  "cantidad": 100,
  "material": "ecocuero",
  "medidas": "4x2cm",
  "tienelogo": true,
  "precioUnitario": 650,
  "total": 65000,
  "cliente": {
    "nombre": "Nombre del cliente",
    "telefono": "número si lo tenés",
    "direccion": "dirección de envío",
    "localidad": "ciudad",
    "provincia": "provincia"
  },
  "notas": "Observaciones adicionales"
}
###FIN_PEDIDO###

IMPORTANTE: Solo agregar el bloque de pedido cuando el cliente CONFIRMA. No agregarlo en consultas o cotizaciones.

## REGLAS CRÍTICAS
1. Continuar la conversación donde quedó, NO repetir saludos
2. No inventar datos - si falta info, pedirla amablemente
3. Responder como si atendieras personalmente por WhatsApp
4. Objetivo: generar confianza → cerrar venta → crear pedido`;

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

    // WhatsApp/IA Config
    const [waConfig, setWaConfig] = useState({
        metaAppId: '',
        whatsappToken: '',
        whatsappPhoneId: '',
        whatsappBusinessId: '',
        webhookVerifyToken: 'grabados_express_verify_2024',
        openaiApiKey: '',
        iaModelo: 'gpt-4o-mini',
        iaActiva: true,
        iaPromptSistema: '',
        horarioAtencion: { inicio: '09:00', fin: '18:00', dias: [1, 2, 3, 4, 5] },
        mensajeFueraHorario: '',
        // Correo Argentino
        correoApiKey: '',
        correoAgreement: '',
        correoTestMode: true,
        // Datos del remitente
        remitenteNombre: 'Grabados Express',
        remitenteDireccion: '',
        remitenteLocalidad: '',
        remitenteProvincia: '',
        remitenteCp: '',
        remitenteTelefono: '',
        remitenteEmail: '',
        // Notificaciones automáticas
        notifConfirmado: true,
        notifProduccion: true,
        notifListo: true,
        notifDespachado: true,
        notifEntregado: true,
    });
    const [waConfigLoaded, setWaConfigLoaded] = useState(false);
    const [savingWa, setSavingWa] = useState(false);

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
            const [savedConfig, waConfigData] = await Promise.all([
                getConfiguracionAsync(),
                whatsappConfigApi.get().catch(() => ({}))
            ]);
            setConfig(savedConfig);
            if (waConfigData && Object.keys(waConfigData).length > 0) {
                setWaConfig(prev => ({
                    ...prev,
                    metaAppId: waConfigData.meta_app_id || '',
                    whatsappToken: waConfigData.whatsapp_token || '',
                    whatsappPhoneId: waConfigData.whatsapp_phone_id || '',
                    whatsappBusinessId: waConfigData.whatsapp_business_id || '',
                    webhookVerifyToken: waConfigData.webhook_verify_token || 'grabados_express_verify_2024',
                    openaiApiKey: waConfigData.openai_api_key || '',
                    iaModelo: waConfigData.ia_modelo || 'gpt-4o-mini',
                    iaActiva: waConfigData.ia_activa !== false,
                    iaPromptSistema: waConfigData.ia_prompt_sistema || '',
                    horarioAtencion: waConfigData.horario_atencion || { inicio: '09:00', fin: '18:00', dias: [1, 2, 3, 4, 5] },
                    mensajeFueraHorario: waConfigData.mensaje_fuera_horario || '',
                    // Correo Argentino
                    correoApiKey: waConfigData.correo_api_key || '',
                    correoAgreement: waConfigData.correo_agreement || '',
                    correoTestMode: waConfigData.correo_test_mode !== false,
                    // Datos del remitente
                    remitenteNombre: waConfigData.remitente_nombre || 'Grabados Express',
                    remitenteDireccion: waConfigData.remitente_direccion || '',
                    remitenteLocalidad: waConfigData.remitente_localidad || '',
                    remitenteProvincia: waConfigData.remitente_provincia || '',
                    remitenteCp: waConfigData.remitente_cp || '',
                    remitenteTelefono: waConfigData.remitente_telefono || '',
                    remitenteEmail: waConfigData.remitente_email || '',
                    // Notificaciones automáticas
                    notifConfirmado: waConfigData.notif_confirmado !== false,
                    notifProduccion: waConfigData.notif_produccion !== false,
                    notifListo: waConfigData.notif_listo !== false,
                    notifDespachado: waConfigData.notif_despachado !== false,
                    notifEntregado: waConfigData.notif_entregado !== false,
                }));
                setWaConfigLoaded(true);
            }
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

    async function handleSaveWhatsApp() {
        try {
            setSavingWa(true);
            await whatsappConfigApi.save(waConfig);
            toast.success('Configuración WhatsApp/IA guardada');
        } catch (error) {
            console.error('Error saving WA config:', error);
            toast.error('Error al guardar configuración WhatsApp');
        } finally {
            setSavingWa(false);
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

            {/* WhatsApp Business + IA Section */}
            <div className="section-divider">
                <div className="divider-line"></div>
                <div className="divider-content">
                    <MessageSquare size={20} />
                    <span>Integración WhatsApp Business + IA</span>
                </div>
                <div className="divider-line"></div>
            </div>

            <div className="config-grid wa-section">
                {/* Meta/WhatsApp Business */}
                <div className="card card-premium">
                    <div className="card-header">
                        <h3 className="card-title">
                            <MessageSquare size={18} />
                            WhatsApp Business API
                        </h3>
                        <span className="badge badge-pro">PRO</span>
                    </div>
                    <div className="card-body">
                        <div className="api-status mb-md">
                            {waConfig.whatsappToken && waConfig.whatsappToken !== '***configured***' || waConfigLoaded && waConfig.whatsappToken === '***configured***' ? (
                                <span className="status-badge status-ok">
                                    <CheckCircle size={14} />
                                    API Configurada
                                </span>
                            ) : (
                                <span className="status-badge status-pending">
                                    <XCircle size={14} />
                                    Sin configurar
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Meta App ID</label>
                            <input
                                type="text"
                                className="form-input"
                                value={waConfig.metaAppId}
                                onChange={(e) => setWaConfig({ ...waConfig, metaAppId: e.target.value })}
                                placeholder="ID de tu Meta App"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">WhatsApp Access Token</label>
                            <input
                                type="password"
                                className="form-input"
                                value={waConfig.whatsappToken}
                                onChange={(e) => setWaConfig({ ...waConfig, whatsappToken: e.target.value })}
                                placeholder="Token de acceso permanente"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Phone Number ID</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={waConfig.whatsappPhoneId}
                                    onChange={(e) => setWaConfig({ ...waConfig, whatsappPhoneId: e.target.value })}
                                    placeholder="ID del número"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Business ID</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={waConfig.whatsappBusinessId}
                                    onChange={(e) => setWaConfig({ ...waConfig, whatsappBusinessId: e.target.value })}
                                    placeholder="ID de cuenta Business"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Webhook Verify Token</label>
                            <input
                                type="text"
                                className="form-input"
                                value={waConfig.webhookVerifyToken}
                                onChange={(e) => setWaConfig({ ...waConfig, webhookVerifyToken: e.target.value })}
                                placeholder="Token de verificación"
                            />
                            <p className="text-muted text-sm mt-sm">
                                URL del Webhook: <code>https://grabados-express.vercel.app/api/whatsapp</code>
                            </p>
                        </div>

                        <a 
                            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="help-link"
                        >
                            <ExternalLink size={14} />
                            Guía de configuración de Meta
                        </a>
                    </div>
                </div>

                {/* OpenAI / IA Config */}
                <div className="card card-premium">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Bot size={18} />
                            Asistente IA (OpenAI)
                        </h3>
                        <span className="badge badge-ai">IA</span>
                    </div>
                    <div className="card-body">
                        <div className="api-status mb-md">
                            {waConfig.openaiApiKey && waConfig.openaiApiKey !== '***configured***' || waConfigLoaded && waConfig.openaiApiKey === '***configured***' ? (
                                <span className="status-badge status-ok">
                                    <CheckCircle size={14} />
                                    API Configurada
                                </span>
                            ) : (
                                <span className="status-badge status-pending">
                                    <XCircle size={14} />
                                    Sin configurar
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">OpenAI API Key</label>
                            <input
                                type="password"
                                className="form-input"
                                value={waConfig.openaiApiKey}
                                onChange={(e) => setWaConfig({ ...waConfig, openaiApiKey: e.target.value })}
                                placeholder="sk-..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Modelo</label>
                            <select
                                className="form-input"
                                value={waConfig.iaModelo}
                                onChange={(e) => setWaConfig({ ...waConfig, iaModelo: e.target.value })}
                            >
                                <option value="gpt-4o-mini">GPT-4o Mini (Recomendado - Económico)</option>
                                <option value="gpt-4o">GPT-4o (Más inteligente)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Más rápido)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-check">
                                <input
                                    type="checkbox"
                                    checked={waConfig.iaActiva}
                                    onChange={(e) => setWaConfig({ ...waConfig, iaActiva: e.target.checked })}
                                />
                                <span>
                                    <Zap size={14} />
                                    IA activa (responde automáticamente)
                                </span>
                            </label>
                        </div>

                        <a 
                            href="https://platform.openai.com/api-keys" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="help-link"
                        >
                            <ExternalLink size={14} />
                            Obtener API Key de OpenAI
                        </a>
                    </div>
                </div>

                {/* Horario de Atención */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Clock size={18} />
                            Horario de Atención
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Hora inicio</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={waConfig.horarioAtencion?.inicio || '09:00'}
                                    onChange={(e) => setWaConfig({ 
                                        ...waConfig, 
                                        horarioAtencion: { ...waConfig.horarioAtencion, inicio: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hora fin</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={waConfig.horarioAtencion?.fin || '18:00'}
                                    onChange={(e) => setWaConfig({ 
                                        ...waConfig, 
                                        horarioAtencion: { ...waConfig.horarioAtencion, fin: e.target.value }
                                    })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Días de atención</label>
                            <div className="dias-grid">
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia, i) => (
                                    <label key={i} className={`dia-check ${waConfig.horarioAtencion?.dias?.includes(i) ? 'active' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={waConfig.horarioAtencion?.dias?.includes(i)}
                                            onChange={(e) => {
                                                const dias = waConfig.horarioAtencion?.dias || [];
                                                const newDias = e.target.checked 
                                                    ? [...dias, i]
                                                    : dias.filter(d => d !== i);
                                                setWaConfig({
                                                    ...waConfig,
                                                    horarioAtencion: { ...waConfig.horarioAtencion, dias: newDias }
                                                });
                                            }}
                                        />
                                        {dia}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mensaje fuera de horario</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={waConfig.mensajeFueraHorario}
                                onChange={(e) => setWaConfig({ ...waConfig, mensajeFueraHorario: e.target.value })}
                                placeholder="Hola! Gracias por contactarnos. En este momento estamos fuera de horario..."
                            />
                        </div>
                    </div>
                </div>

                {/* Prompt del Sistema */}
                <div className="card card-prompt">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Bot size={18} />
                            Personalidad de la IA
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">Prompt del Sistema (Instrucciones para la IA)</label>
                            <textarea
                                className="form-input prompt-textarea"
                                rows={15}
                                value={waConfig.iaPromptSistema}
                                onChange={(e) => setWaConfig({ ...waConfig, iaPromptSistema: e.target.value })}
                                placeholder="Define la personalidad, tono y comportamiento de la IA.

Ejemplo:
## IDENTIDAD
Sos Ramiro, dueño de Grabados Express...

## LISTA DE PRECIOS
- Etiquetas hasta 50u: $800/u
- Etiquetas 51-100u: $650/u
...

## CREACIÓN DE PEDIDOS
Cuando el cliente confirma, incluir:
###PEDIDO_CONFIRMADO###
{JSON con datos del pedido}
###FIN_PEDIDO###"
                            />
                            <p className="text-muted text-sm mt-sm">
                                💡 Tip: Incluí lista de precios, condiciones de envío, datos de pago y las instrucciones para crear pedidos automáticamente. 
                                <a 
                                    href="#" 
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        setWaConfig({ 
                                            ...waConfig, 
                                            iaPromptSistema: promptEjemplo 
                                        }); 
                                    }}
                                    className="help-link inline"
                                >
                                    Cargar ejemplo completo
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Envíos y Notificaciones Section */}
            <div className="section-divider">
                <div className="divider-line"></div>
                <div className="divider-content">
                    <Truck size={20} />
                    <span>Envíos y Notificaciones Automáticas</span>
                </div>
                <div className="divider-line"></div>
            </div>

            <div className="config-grid wa-section">
                {/* Correo Argentino API */}
                <div className="card card-premium">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Package size={18} />
                            Correo Argentino API
                        </h3>
                        <span className="badge badge-pro">ENVÍOS</span>
                    </div>
                    <div className="card-body">
                        <div className="api-status mb-md">
                            {waConfig.correoApiKey ? (
                                <span className="status-badge status-ok">
                                    <CheckCircle size={14} />
                                    API Configurada
                                </span>
                            ) : (
                                <span className="status-badge status-pending">
                                    <XCircle size={14} />
                                    Sin configurar
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">API Key</label>
                            <input
                                type="password"
                                className="form-input"
                                value={waConfig.correoApiKey}
                                onChange={(e) => setWaConfig({ ...waConfig, correoApiKey: e.target.value })}
                                placeholder="Tu API Key de Correo Argentino"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Agreement (Contrato)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={waConfig.correoAgreement}
                                onChange={(e) => setWaConfig({ ...waConfig, correoAgreement: e.target.value })}
                                placeholder="Número de acuerdo comercial"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-check">
                                <input
                                    type="checkbox"
                                    checked={waConfig.correoTestMode}
                                    onChange={(e) => setWaConfig({ ...waConfig, correoTestMode: e.target.checked })}
                                />
                                <span>Modo de prueba (usar servidor de test)</span>
                            </label>
                        </div>

                        <a 
                            href="https://www.correoargentino.com.ar/paq-ar" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="help-link"
                        >
                            <ExternalLink size={14} />
                            Solicitar acceso a PAQ.AR API
                        </a>
                    </div>
                </div>

                {/* Datos del Remitente */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <MapPin size={18} />
                            Datos del Remitente
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">Nombre / Razón Social</label>
                            <input
                                type="text"
                                className="form-input"
                                value={waConfig.remitenteNombre}
                                onChange={(e) => setWaConfig({ ...waConfig, remitenteNombre: e.target.value })}
                                placeholder="Grabados Express"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Dirección</label>
                            <input
                                type="text"
                                className="form-input"
                                value={waConfig.remitenteDireccion}
                                onChange={(e) => setWaConfig({ ...waConfig, remitenteDireccion: e.target.value })}
                                placeholder="Calle y número"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Localidad</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={waConfig.remitenteLocalidad}
                                    onChange={(e) => setWaConfig({ ...waConfig, remitenteLocalidad: e.target.value })}
                                    placeholder="Ciudad"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Provincia</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={waConfig.remitenteProvincia}
                                    onChange={(e) => setWaConfig({ ...waConfig, remitenteProvincia: e.target.value })}
                                    placeholder="Provincia"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Código Postal</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={waConfig.remitenteCp}
                                    onChange={(e) => setWaConfig({ ...waConfig, remitenteCp: e.target.value })}
                                    placeholder="2000"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={waConfig.remitenteTelefono}
                                    onChange={(e) => setWaConfig({ ...waConfig, remitenteTelefono: e.target.value })}
                                    placeholder="+54 9..."
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={waConfig.remitenteEmail}
                                onChange={(e) => setWaConfig({ ...waConfig, remitenteEmail: e.target.value })}
                                placeholder="contacto@grabadosexpress.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Notificaciones Automáticas */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Bell size={18} />
                            Notificaciones Automáticas
                        </h3>
                    </div>
                    <div className="card-body">
                        <p className="text-muted text-sm mb-md">
                            Seleccioná qué notificaciones se envían automáticamente por WhatsApp cuando cambia el estado del pedido.
                        </p>

                        <div className="notif-checks">
                            <label className="form-check">
                                <input
                                    type="checkbox"
                                    checked={waConfig.notifConfirmado}
                                    onChange={(e) => setWaConfig({ ...waConfig, notifConfirmado: e.target.checked })}
                                />
                                <span>✅ Pedido confirmado</span>
                            </label>

                            <label className="form-check">
                                <input
                                    type="checkbox"
                                    checked={waConfig.notifProduccion}
                                    onChange={(e) => setWaConfig({ ...waConfig, notifProduccion: e.target.checked })}
                                />
                                <span>🔧 En producción</span>
                            </label>

                            <label className="form-check">
                                <input
                                    type="checkbox"
                                    checked={waConfig.notifListo}
                                    onChange={(e) => setWaConfig({ ...waConfig, notifListo: e.target.checked })}
                                />
                                <span>🎉 Pedido listo</span>
                            </label>

                            <label className="form-check">
                                <input
                                    type="checkbox"
                                    checked={waConfig.notifDespachado}
                                    onChange={(e) => setWaConfig({ ...waConfig, notifDespachado: e.target.checked })}
                                />
                                <span>🚚 Despachado (con tracking)</span>
                            </label>

                            <label className="form-check">
                                <input
                                    type="checkbox"
                                    checked={waConfig.notifEntregado}
                                    onChange={(e) => setWaConfig({ ...waConfig, notifEntregado: e.target.checked })}
                                />
                                <span>📦 Entregado</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save WhatsApp Config Button */}
            <div className="wa-save-section">
                <button 
                    className="btn btn-primary btn-lg"
                    onClick={handleSaveWhatsApp}
                    disabled={savingWa}
                >
                    {savingWa ? (
                        <>
                            <Loader2 size={18} className="spinner" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Guardar Configuración WhatsApp/IA
                        </>
                    )}
                </button>
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

        /* WhatsApp Section Styles */
        .section-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 3rem 0 2rem;
        }
        
        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-light), transparent);
        }
        
        .divider-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--accent);
          font-weight: 600;
          font-size: 0.95rem;
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-full);
        }

        .wa-section {
          margin-top: 0;
        }
        
        .card-premium {
          border: 1px solid rgba(245, 158, 11, 0.3);
          background: linear-gradient(145deg, rgba(245, 158, 11, 0.03), var(--bg-secondary));
        }
        
        .card-premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent-gradient);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        }
        
        .badge-pro {
          background: var(--accent-gradient);
          color: #000;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
        }
        
        .badge-ai {
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
        }
        
        .help-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--accent);
          font-size: 0.8rem;
          text-decoration: none;
          margin-top: 0.5rem;
        }
        
        .help-link:hover {
          text-decoration: underline;
        }

        .help-link.inline {
          display: inline;
          margin-left: 0.5rem;
        }

        .card-prompt {
          grid-column: 1 / -1;
        }

        .prompt-textarea {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.85rem;
          line-height: 1.6;
          min-height: 400px;
          white-space: pre-wrap;
        }
        
        .dias-grid {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .dia-check {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all var(--transition-fast);
        }
        
        .dia-check input {
          display: none;
        }
        
        .dia-check:hover {
          border-color: var(--accent);
        }
        
        .dia-check.active {
          background: var(--accent-gradient);
          color: #000;
          border-color: transparent;
          font-weight: 600;
        }

        .notif-checks {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .notif-checks .form-check {
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .notif-checks .form-check:hover {
          background: var(--bg-hover);
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .form-row .form-group {
          flex: 1;
        }
        
        .wa-save-section {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-color);
        }
        
        .wa-save-section .btn-lg {
          padding: 1rem 2rem;
          font-size: 1rem;
        }
        
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        code {
          background: var(--bg-tertiary);
          padding: 0.2rem 0.4rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-family: monospace;
        }
        
        textarea.form-input {
          resize: vertical;
          min-height: 80px;
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
          
          .section-divider {
            margin: 2rem 0 1.5rem;
          }
          
          .divider-content {
            font-size: 0.85rem;
            padding: 0.4rem 0.75rem;
          }
          
          .dias-grid {
            justify-content: center;
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
          select,
          textarea {
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
          
          /* WhatsApp section mobile */
          .section-divider {
            margin: 1.5rem 0 1rem;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .divider-line {
            width: 60%;
            height: 1px;
          }
          
          .divider-content {
            font-size: 0.8rem;
          }
          
          .dia-check {
            width: 40px;
            height: 40px;
            font-size: 0.7rem;
          }
          
          .wa-save-section .btn-lg {
            width: 100%;
            padding: 0.875rem 1.5rem;
          }
        }
      `}</style>
        </div>
    );
}
