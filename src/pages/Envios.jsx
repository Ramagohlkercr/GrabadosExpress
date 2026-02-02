import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Truck,
    Plus,
    Search,
    Package,
    MapPin,
    Download,
    Eye,
    XCircle,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Clock,
    ExternalLink,
    DollarSign,
    MessageCircle,
    Send,
    Bell,
    Loader2,
    Edit3,
    Copy,
    Link
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import {
    getEnvios,
    saveEnvio,
    getClientes,
    getPedidos,
    getConfiguracion,
    ESTADOS_PEDIDO
} from '../lib/storage';
import {
    hasCredentials,
    crearEnvio,
    cancelarEnvio,
    obtenerRotulo,
    consultarTracking,
    obtenerSucursales,
    descargarPDF,
    PROVINCIAS,
    DELIVERY_TYPES,
    SERVICE_TYPES,
    getTrackingUrl
} from '../lib/correoArgentino';
import {
    hasMiCorreoCredentials,
    hasCustomerId,
    cotizarEnvio as cotizarMiCorreo
} from '../lib/miCorreo';
import {
    getSucursales as getSucursalesDB,
    getLocalidadesByProvincia
} from '../lib/sucursalesCorreo';
import { notificacionesApi, TIPOS_NOTIFICACION } from '../lib/enviosApi';
import toast from 'react-hot-toast';

const ESTADOS_ENVIO = {
    PENDIENTE: 'pendiente',
    CREADO: 'creado',
    EN_TRANSITO: 'en_transito',
    ENTREGADO: 'entregado',
    CANCELADO: 'cancelado'
};

const ESTADOS_LABELS = {
    pendiente: { label: 'Pendiente', color: 'default' },
    creado: { label: 'Creado', color: 'info' },
    en_transito: { label: 'En tránsito', color: 'warning' },
    entregado: { label: 'Entregado', color: 'success' },
    cancelado: { label: 'Cancelado', color: 'danger' }
};

// Sucursales demo para cuando no hay credenciales
const SUCURSALES_DEMO = {
    B: [
        { code: 'B0101', name: 'Quilmes Centro', locality: 'Quilmes', address: 'Rivadavia 456' },
        { code: 'B0102', name: 'Bernal', locality: 'Bernal', address: 'Av. San Martín 123' },
        { code: 'B0103', name: 'Avellaneda', locality: 'Avellaneda', address: 'Mitre 890' },
        { code: 'B0104', name: 'Lanús Este', locality: 'Lanús', address: 'H. Yrigoyen 1234' },
        { code: 'B0105', name: 'Lomas de Zamora', locality: 'Lomas de Zamora', address: 'Laprida 567' },
        { code: 'B0106', name: 'Banfield', locality: 'Banfield', address: 'Alsina 321' },
        { code: 'B0107', name: 'La Plata Centro', locality: 'La Plata', address: 'Calle 7 N° 890' },
        { code: 'B0108', name: 'La Plata City Bell', locality: 'City Bell', address: 'Cantilo 456' },
    ],
    C: [
        { code: 'C0001', name: 'Retiro', locality: 'Retiro', address: 'Av. Ramos Mejía 1302' },
        { code: 'C0002', name: 'Correo Central', locality: 'Microcentro', address: 'Sarmiento 151' },
        { code: 'C0003', name: 'Once', locality: 'Balvanera', address: 'Bartolomé Mitre 2560' },
        { code: 'C0004', name: 'Palermo', locality: 'Palermo', address: 'Av. Santa Fe 5012' },
        { code: 'C0005', name: 'Belgrano', locality: 'Belgrano', address: 'Av. Cabildo 2040' },
        { code: 'C0006', name: 'Caballito', locality: 'Caballito', address: 'Av. Rivadavia 5200' },
        { code: 'C0007', name: 'Villa Urquiza', locality: 'Villa Urquiza', address: 'Triunvirato 4890' },
    ],
    S: [
        { code: 'S0001', name: 'Rosario Centro', locality: 'Rosario', address: 'Córdoba 721' },
        { code: 'S0002', name: 'Santa Fe', locality: 'Santa Fe', address: '25 de Mayo 2456' },
    ],
    X: [
        { code: 'X0001', name: 'Córdoba Centro', locality: 'Córdoba', address: 'Gral. Paz 70' },
        { code: 'X0002', name: 'Nueva Córdoba', locality: 'Nueva Córdoba', address: 'Ob. Trejo 890' },
    ],
    M: [
        { code: 'M0001', name: 'Mendoza Centro', locality: 'Mendoza', address: 'San Martín 1201' },
    ],
    T: [
        { code: 'T0001', name: 'Tucumán Centro', locality: 'San Miguel de Tucumán', address: '24 de Septiembre 567' },
    ],
};

const emptyEnvio = {
    pedidoId: '',
    clienteId: '',
    destinatario: {
        nombre: '',
        telefono: '',
        email: '',
        calle: '',
        altura: '',
        localidad: '',
        provincia: 'B',
        codigoPostal: '',
        piso: '',
        depto: ''
    },
    paquete: {
        peso: 500,
        alto: 10,
        ancho: 10,
        largo: 15
    },
    valorDeclarado: 1000,
    tipoEntrega: 'homeDelivery',
    tipoServicio: 'CP',
    sucursalId: '',
    observaciones: ''
};

export default function Envios() {
    const navigate = useNavigate();
    const [envios, setEnvios] = useState([]);
    const [filteredEnvios, setFilteredEnvios] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientes, setClientes] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [config, setConfig] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedEnvio, setSelectedEnvio] = useState(null);
    const [formData, setFormData] = useState(emptyEnvio);
    const [loading, setLoading] = useState(false);
    const [sucursales, setSucursales] = useState([]);
    const [localidades, setLocalidades] = useState([]);
    const [selectedLocalidad, setSelectedLocalidad] = useState('');
    const [selectedProvincia, setSelectedProvincia] = useState('B');
    const [trackingEvents, setTrackingEvents] = useState([]);
    const [cotizacion, setCotizacion] = useState(null);
    const [cotizando, setCotizando] = useState(false);
    
    // WhatsApp Notifications
    const [notifModalOpen, setNotifModalOpen] = useState(false);
    const [notifEnvio, setNotifEnvio] = useState(null);
    const [notifTipo, setNotifTipo] = useState('');
    const [notifMensaje, setNotifMensaje] = useState('');
    const [enviandoNotif, setEnviandoNotif] = useState(false);
    
    // Tracking Manual (nuevo)
    const [trackingModalOpen, setTrackingModalOpen] = useState(false);
    const [trackingPedido, setTrackingPedido] = useState(null);
    const [trackingInput, setTrackingInput] = useState('');
    const [sucursalInput, setSucursalInput] = useState('');
    const [asignandoTracking, setAsignandoTracking] = useState(false);
    
    // Pedidos desde BD
    const [pedidosDB, setPedidosDB] = useState({ conTracking: [], sinTracking: [] });
    const [loadingPedidos, setLoadingPedidos] = useState(true);
    const [activeTab, setActiveTab] = useState('pendientes'); // 'pendientes' | 'despachados'

    useEffect(() => {
        loadData();
        loadPedidosDB();
    }, []);

    useEffect(() => {
        const filtered = envios.filter(e =>
            e.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.destinatario?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredEnvios(filtered);
    }, [searchTerm, envios]);

    function loadData() {
        setEnvios(getEnvios());
        setClientes(getClientes());
        setPedidos(getPedidos().filter(p => p.estado === ESTADOS_PEDIDO.TERMINADO || p.estado === ESTADOS_PEDIDO.LISTO));
        setConfig(getConfiguracion());
    }

    // Cargar pedidos desde la base de datos
    async function loadPedidosDB() {
        setLoadingPedidos(true);
        try {
            const response = await fetch('/api/envios?action=listar');
            const data = await response.json();
            if (data.success) {
                setPedidosDB({
                    conTracking: data.conTracking || [],
                    sinTracking: data.sinTracking || []
                });
            }
        } catch (error) {
            console.error('Error cargando pedidos:', error);
        } finally {
            setLoadingPedidos(false);
        }
    }

    function openNewModal() {
        // Permitir crear envíos siempre (modo demo si no hay credenciales)
        setFormData(emptyEnvio);
        setCotizacion(null);
        setModalOpen(true);
    }

    // ============================================
    // TRACKING MANUAL
    // ============================================
    function openTrackingModal(pedido) {
        setTrackingPedido(pedido);
        setTrackingInput(pedido.envio_tracking || '');
        setSucursalInput(pedido.envio_sucursal_nombre || '');
        setTrackingModalOpen(true);
    }

    async function handleAsignarTracking() {
        if (!trackingPedido || !trackingInput.trim()) {
            toast.error('Ingresá un número de tracking');
            return;
        }

        setAsignandoTracking(true);
        try {
            const response = await fetch('/api/envios?action=asignar-tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pedidoId: trackingPedido.id,
                    tracking: trackingInput.trim(),
                    sucursalNombre: sucursalInput.trim() || null
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success(`✅ Tracking asignado: ${result.tracking}`);
                if (result.notificacionEnviada) {
                    toast.success('📱 Notificación enviada al cliente');
                }
                setTrackingModalOpen(false);
                loadPedidosDB();
            } else {
                toast.error(result.error || 'Error asignando tracking');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error asignando tracking');
        } finally {
            setAsignandoTracking(false);
        }
    }

    async function handleConsultarTracking(tracking) {
        if (!tracking) return;
        
        toast.loading('Consultando tracking...', { id: 'tracking' });
        try {
            const response = await fetch(`/api/envios?action=tracking-publico&tracking=${encodeURIComponent(tracking)}`);
            const data = await response.json();
            toast.dismiss('tracking');

            if (data.success || data.urlTracking) {
                // Abrir en nueva pestaña
                window.open(data.urlTracking || `https://www.correoargentino.com.ar/formularios/ondnc?id=${tracking}`, '_blank');
            }
        } catch (error) {
            toast.dismiss('tracking');
            // Abrir directamente la URL de Correo Argentino
            window.open(`https://www.correoargentino.com.ar/formularios/ondnc?id=${tracking}`, '_blank');
        }
    }

    function copyTracking(tracking) {
        navigator.clipboard.writeText(tracking);
        toast.success('Tracking copiado');
    }

    // ============================================
    // WHATSAPP NOTIFICATIONS
    // ============================================
    function openNotifModal(envio) {
        setNotifEnvio(envio);
        setNotifTipo('');
        setNotifMensaje('');
        setNotifModalOpen(true);
    }

    async function handleEnviarNotificacion() {
        if (!notifEnvio) return;
        if (!notifTipo && !notifMensaje) {
            toast.error('Seleccioná un tipo de notificación o escribí un mensaje');
            return;
        }

        setEnviandoNotif(true);
        try {
            const result = await notificacionesApi.enviar(
                notifEnvio.pedidoId,
                notifTipo,
                notifMensaje || null
            );

            if (result.success) {
                toast.success('📱 Notificación enviada por WhatsApp');
                setNotifModalOpen(false);
            } else {
                toast.error(result.error || 'Error al enviar notificación');
            }
        } catch (error) {
            console.error('Error enviando notificación:', error);
            toast.error('Error al enviar notificación');
        } finally {
            setEnviandoNotif(false);
        }
    }

    async function handleNotificarDespacho(envio) {
        const cliente = clientes.find(c => c.id === envio.clienteId);
        if (!cliente?.telefono) {
            toast.error('El cliente no tiene teléfono configurado');
            return;
        }

        if (confirm(`¿Enviar notificación de despacho a ${cliente.nombre}?\n\nTracking: ${envio.trackingNumber}`)) {
            try {
                const result = await notificacionesApi.enviar(
                    envio.pedidoId,
                    'pedido_despachado',
                    null
                );
                if (result.success) {
                    toast.success('📱 Notificación de despacho enviada');
                } else {
                    toast.error(result.error || 'Error al enviar');
                }
            } catch (error) {
                toast.error('Error al enviar notificación');
            }
        }
    }

    // Cotizar envío usando MiCorreo API
    async function handleCotizar() {
        if (!hasMiCorreoCredentials() || !hasCustomerId()) {
            toast.error('Configurá las credenciales de MiCorreo para cotizar');
            return;
        }

        if (!formData.destinatario.codigoPostal) {
            toast.error('Ingresá el código postal del destinatario');
            return;
        }

        setCotizando(true);
        setCotizacion(null);

        const result = await cotizarMiCorreo({
            cpOrigen: config.codigoPostal || '1000',
            cpDestino: formData.destinatario.codigoPostal,
            tipoEntrega: formData.tipoEntrega === 'homeDelivery' ? 'D' : 'S',
            peso: formData.paquete.peso,
            alto: formData.paquete.alto,
            ancho: formData.paquete.ancho,
            largo: formData.paquete.largo
        });

        setCotizando(false);

        if (result.success && result.rates?.length > 0) {
            setCotizacion(result.rates);
            toast.success('Cotización obtenida');
        } else {
            toast.error(result.error || 'No se pudo cotizar');
        }
    }

    function handlePedidoSelect(pedidoId) {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (pedido) {
            const cliente = clientes.find(c => c.id === pedido.clienteId);
            if (cliente) {
                setFormData({
                    ...formData,
                    pedidoId,
                    clienteId: cliente.id,
                    valorDeclarado: pedido.total || 1000,
                    destinatario: {
                        nombre: cliente.nombre || '',
                        telefono: cliente.telefono || '',
                        email: cliente.email || '',
                        calle: cliente.direccion?.calle || '',
                        altura: cliente.direccion?.altura || '',
                        localidad: cliente.direccion?.localidad || '',
                        provincia: cliente.direccion?.provincia || 'B',
                        codigoPostal: cliente.direccion?.codigoPostal || '',
                        piso: cliente.direccion?.piso || '',
                        depto: cliente.direccion?.depto || ''
                    }
                });
            }
        }
    }

    // Cargar sucursales por provincia (base de datos local o API)
    async function cargarSucursalesProvincia(provinciaCode) {
        setLoading(true);
        setSelectedProvincia(provinciaCode);
        setSelectedLocalidad('');
        setFormData(prev => ({ ...prev, sucursalId: '' }));

        // Primero cargar de base de datos local (siempre disponible)
        const sucursalesLocales = getSucursalesDB(provinciaCode);
        const localidadesLocales = getLocalidadesByProvincia(provinciaCode);

        setSucursales(sucursalesLocales);
        setLocalidades(localidadesLocales);

        // Si hay credenciales, intentar obtener sucursales actualizadas de la API
        if (hasCredentials()) {
            try {
                const result = await obtenerSucursales(provinciaCode);
                if (result.success && result.sucursales?.length > 0) {
                    setSucursales(result.sucursales);
                    const locs = [...new Set(result.sucursales.map(s =>
                        s.location?.city || s.locality || 'Otra'
                    ))].sort();
                    setLocalidades(locs);
                }
            } catch (error) {
                console.log('Usando base de datos local de sucursales');
            }
        }

        setLoading(false);
    }

    // Filtrar sucursales por localidad seleccionada
    function getSucursalesFiltradas() {
        if (!selectedLocalidad) return sucursales;
        return sucursales.filter(s =>
            (s.locality || s.location?.city) === selectedLocalidad
        );
    }

    function handleProvinciaChange(provinciaCode) {
        setFormData({
            ...formData,
            destinatario: { ...formData.destinatario, provincia: provinciaCode },
            sucursalId: ''
        });

        if (formData.tipoEntrega === 'agency') {
            cargarSucursalesProvincia(provinciaCode);
        }
    }

    function handleTipoEntregaChange(tipo) {
        setFormData({ ...formData, tipoEntrega: tipo, sucursalId: '' });
        setSelectedLocalidad('');
        setSucursales([]);
        setLocalidades([]);

        if (tipo === 'agency') {
            cargarSucursalesProvincia(selectedProvincia || 'B');
        }
    }

    function handleLocalidadChange(localidad) {
        setSelectedLocalidad(localidad);
        setFormData(prev => ({ ...prev, sucursalId: '' }));
    }

    async function handleCrearEnvio() {
        // Validaciones
        if (!formData.destinatario.nombre) {
            toast.error('El nombre del destinatario es obligatorio');
            return;
        }

        // Para domicilio: requiere dirección completa
        if (formData.tipoEntrega === 'homeDelivery') {
            if (!formData.destinatario.calle || !formData.destinatario.altura) {
                toast.error('La dirección es obligatoria para entrega a domicilio');
                return;
            }
            if (!formData.destinatario.codigoPostal) {
                toast.error('El código postal es obligatorio');
                return;
            }
        }

        // Para sucursal: requiere selección de sucursal
        if (formData.tipoEntrega === 'agency') {
            if (!formData.sucursalId) {
                toast.error('Seleccioná una sucursal de retiro');
                return;
            }
        }

        setLoading(true);

        // Si hay credenciales, usar la API real
        if (hasCredentials()) {
            toast.loading('Creando envío en Correo Argentino...', { id: 'crear-envio' });

            const orderData = {
                ...formData,
                remitente: {
                    nombre: config.nombreNegocio || 'Grabados Express',
                    telefono: config.telefono || '',
                    celular: config.whatsapp || '',
                    email: config.email || '',
                    calle: config.direccion?.split(',')[0] || '',
                    altura: '',
                    localidad: '',
                    provincia: 'B',
                    codigoPostal: config.codigoPostal || ''
                }
            };

            const result = await crearEnvio(orderData);
            toast.dismiss('crear-envio');
            setLoading(false);

            if (result.success) {
                const nuevoEnvio = {
                    ...formData,
                    trackingNumber: result.trackingNumber,
                    estado: ESTADOS_ENVIO.CREADO,
                    fechaCreacion: new Date().toISOString()
                };
                saveEnvio(nuevoEnvio);
                toast.success(`Envío creado: ${result.trackingNumber}`);
                setModalOpen(false);
                loadData();
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } else {
            // Modo demo: crear envío localmente sin API
            const trackingDemo = `DEMO${Date.now().toString(36).toUpperCase()}`;

            const nuevoEnvio = {
                ...formData,
                trackingNumber: trackingDemo,
                estado: ESTADOS_ENVIO.PENDIENTE,
                fechaCreacion: new Date().toISOString(),
                modoDemo: true
            };

            saveEnvio(nuevoEnvio);
            setLoading(false);

            toast.success(`Envío guardado (demo): ${trackingDemo}`);
            setModalOpen(false);
            loadData();
        }
    }

    async function handleDescargarRotulo(envio) {
        if (!envio.trackingNumber) {
            toast.error('Este envío no tiene tracking number');
            return;
        }

        // Si es un envío demo, generar rótulo HTML
        if (envio.modoDemo || !hasCredentials()) {
            generarRotuloDemo(envio);
            return;
        }

        setLoading(true);
        toast.loading('Descargando rótulo...', { id: 'rotulo' });

        const result = await obtenerRotulo(envio.trackingNumber);

        toast.dismiss('rotulo');
        setLoading(false);

        if (result.success) {
            descargarPDF(result.pdfBase64, result.fileName);
            toast.success('Rótulo descargado');
        } else {
            toast.error(`Error: ${result.error}`);
        }
    }

    // Generar rótulo demo imprimible
    function generarRotuloDemo(envio) {
        const sucursalInfo = envio.tipoEntrega === 'agency'
            ? sucursales.find(s => s.agency_id === envio.sucursalId)
            : null;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Rótulo de Envío - ${envio.trackingNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .rotulo { 
                        border: 3px solid #000; 
                        padding: 20px; 
                        max-width: 400px; 
                        margin: 0 auto;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #000; 
                        padding-bottom: 15px; 
                        margin-bottom: 15px;
                    }
                    .logo { font-size: 24px; font-weight: bold; }
                    .tracking { 
                        font-size: 28px; 
                        font-weight: bold; 
                        font-family: monospace;
                        letter-spacing: 2px;
                        margin-top: 10px;
                    }
                    .barcode {
                        text-align: center;
                        margin: 15px 0;
                        font-family: 'Libre Barcode 39', monospace;
                        font-size: 48px;
                    }
                    .section { margin-bottom: 15px; }
                    .section-title { 
                        font-weight: bold; 
                        font-size: 12px; 
                        color: #666;
                        margin-bottom: 5px;
                    }
                    .section-content { font-size: 14px; }
                    .destinatario { 
                        background: #f5f5f5; 
                        padding: 15px; 
                        border: 1px solid #ddd;
                    }
                    .destinatario .nombre { font-size: 18px; font-weight: bold; }
                    .tipo-envio {
                        text-align: center;
                        padding: 10px;
                        margin-top: 15px;
                        font-weight: bold;
                        font-size: 16px;
                    }
                    .domicilio { background: #e3f2fd; }
                    .sucursal { background: #fff3e0; }
                    .footer { 
                        text-align: center; 
                        font-size: 10px; 
                        color: #999; 
                        margin-top: 15px;
                        border-top: 1px solid #ddd;
                        padding-top: 10px;
                    }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="text-align: center; margin-bottom: 20px;">
                    <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">
                        🖨️ Imprimir Rótulo
                    </button>
                </div>
                <div class="rotulo">
                    <div class="header">
                        <div class="logo">📦 CORREO ARGENTINO</div>
                        <div class="tracking">${envio.trackingNumber}</div>
                    </div>
                    
                    <div class="barcode">*${envio.trackingNumber}*</div>
                    
                    <div class="section destinatario">
                        <div class="section-title">DESTINATARIO</div>
                        <div class="nombre">${envio.destinatario?.nombre || 'N/A'}</div>
                        <div class="section-content">
                            ${envio.tipoEntrega === 'homeDelivery'
                ? `${envio.destinatario?.calle || ''} ${envio.destinatario?.altura || ''}
                                   ${envio.destinatario?.piso ? `Piso ${envio.destinatario.piso}` : ''} 
                                   ${envio.destinatario?.depto ? `Depto ${envio.destinatario.depto}` : ''}<br>
                                   ${envio.destinatario?.localidad || ''}, ${PROVINCIAS[envio.destinatario?.provincia] || ''}<br>
                                   CP: ${envio.destinatario?.codigoPostal || ''}`
                : `RETIRO EN SUCURSAL<br>
                                   ${sucursalInfo?.agency_name || envio.sucursalId}<br>
                                   ${sucursalInfo?.location?.street_name || ''}`
            }
                        </div>
                        <div class="section-content" style="margin-top: 10px;">
                            Tel: ${envio.destinatario?.telefono || 'N/A'}<br>
                            Email: ${envio.destinatario?.email || 'N/A'}
                        </div>
                    </div>
                    
                    <div class="tipo-envio ${envio.tipoEntrega === 'homeDelivery' ? 'domicilio' : 'sucursal'}">
                        ${envio.tipoEntrega === 'homeDelivery' ? '🏠 ENTREGA A DOMICILIO' : '🏢 RETIRO EN SUCURSAL'}
                    </div>
                    
                    <div class="section" style="margin-top: 15px;">
                        <div class="section-title">PAQUETE</div>
                        <div class="section-content">
                            Peso: ${envio.paquete?.peso || 0}g | 
                            Dimensiones: ${envio.paquete?.alto || 0}x${envio.paquete?.ancho || 0}x${envio.paquete?.largo || 0} cm
                        </div>
                    </div>
                    
                    ${envio.observaciones ? `
                    <div class="section">
                        <div class="section-title">OBSERVACIONES</div>
                        <div class="section-content">${envio.observaciones}</div>
                    </div>
                    ` : ''}
                    
                    <div class="footer">
                        Generado: ${new Date().toLocaleDateString('es-AR')}<br>
                        MODO DEMO - Para envíos reales configure credenciales API
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        toast.success('Rótulo generado - Podés imprimirlo');
    }

    async function handleCancelarEnvio(envio) {
        if (!confirm('¿Cancelar este envío?')) return;

        setLoading(true);
        const result = await cancelarEnvio(envio.trackingNumber);
        setLoading(false);

        if (result.success) {
            // Actualizar estado local
            const updated = { ...envio, estado: ESTADOS_ENVIO.CANCELADO };
            saveEnvio(updated);
            toast.success('Envío cancelado');
            loadData();
        } else {
            toast.error(`Error: ${result.error}`);
        }
    }

    async function handleVerTracking(envio) {
        setSelectedEnvio(envio);
        setTrackingEvents([]);
        setDetailModalOpen(true);

        if (envio.trackingNumber) {
            const result = await consultarTracking(envio.trackingNumber);
            if (result.success) {
                setTrackingEvents(result.events);
            }
        }
    }

    function getCliente(clienteId) {
        return clientes.find(c => c.id === clienteId);
    }

    const credentialsConfigured = hasCredentials();

    return (
        <div className="envios-page">
            <div className="page-header">
                <div className="page-title">
                    <div className="icon">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h1>Envíos</h1>
                        <p className="text-muted">
                            {pedidosDB.sinTracking.length} pendientes · {pedidosDB.conTracking.length} despachados
                        </p>
                    </div>
                </div>
                <button 
                    className="btn btn-secondary" 
                    onClick={loadPedidosDB}
                    disabled={loadingPedidos}
                >
                    <RefreshCw size={18} className={loadingPedidos ? 'spin' : ''} />
                    Actualizar
                </button>
            </div>

            {/* Tabs para cambiar entre pendientes y despachados */}
            <div className="envios-tabs mb-lg">
                <button 
                    className={`tab-btn ${activeTab === 'pendientes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pendientes')}
                >
                    <Package size={18} />
                    Pendientes de Despacho
                    {pedidosDB.sinTracking.length > 0 && (
                        <span className="badge badge-warning">{pedidosDB.sinTracking.length}</span>
                    )}
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'despachados' ? 'active' : ''}`}
                    onClick={() => setActiveTab('despachados')}
                >
                    <Truck size={18} />
                    Despachados
                    {pedidosDB.conTracking.length > 0 && (
                        <span className="badge badge-success">{pedidosDB.conTracking.length}</span>
                    )}
                </button>
            </div>

            {/* Lista de Pedidos Pendientes (sin tracking) */}
            {activeTab === 'pendientes' && (
                <div className="envios-section">
                    {loadingPedidos ? (
                        <div className="card loading-card">
                            <Loader2 size={32} className="spin" />
                            <p>Cargando pedidos...</p>
                        </div>
                    ) : pedidosDB.sinTracking.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <CheckCircle size={48} className="text-success" />
                                <h3>¡Todo despachado!</h3>
                                <p className="text-muted">No hay pedidos pendientes de envío</p>
                            </div>
                        </div>
                    ) : (
                        <div className="pedidos-envio-list">
                            {pedidosDB.sinTracking.map(pedido => (
                                <div key={pedido.id} className="pedido-envio-card">
                                    <div className="pedido-info">
                                        <div className="pedido-numero">
                                            <Package size={18} />
                                            <strong>#{pedido.numero}</strong>
                                            <span className={`badge badge-${pedido.estado === 'terminado' ? 'success' : 'info'}`}>
                                                {pedido.estado}
                                            </span>
                                        </div>
                                        <div className="pedido-cliente">
                                            <span className="cliente-nombre">{pedido.cliente_nombre || 'Sin cliente'}</span>
                                            {pedido.cliente_telefono && (
                                                <span className="cliente-tel">{pedido.cliente_telefono}</span>
                                            )}
                                        </div>
                                        {pedido.cliente_localidad && (
                                            <div className="pedido-ubicacion">
                                                <MapPin size={14} />
                                                <span>{pedido.cliente_localidad}, {pedido.cliente_provincia}</span>
                                            </div>
                                        )}
                                        <div className="pedido-total">
                                            <DollarSign size={14} />
                                            <span>${pedido.total?.toLocaleString() || 0}</span>
                                        </div>
                                    </div>
                                    <div className="pedido-actions">
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => openTrackingModal(pedido)}
                                        >
                                            <Edit3 size={16} />
                                            Agregar Tracking
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Lista de Pedidos Despachados (con tracking) */}
            {activeTab === 'despachados' && (
                <div className="envios-section">
                    {loadingPedidos ? (
                        <div className="card loading-card">
                            <Loader2 size={32} className="spin" />
                            <p>Cargando...</p>
                        </div>
                    ) : pedidosDB.conTracking.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <Truck size={48} />
                                <h3>Sin envíos despachados</h3>
                                <p className="text-muted">Asigná tracking a los pedidos pendientes</p>
                            </div>
                        </div>
                    ) : (
                        <div className="pedidos-envio-list">
                            {pedidosDB.conTracking.map(pedido => (
                                <div key={pedido.id} className="pedido-envio-card despachado">
                                    <div className="pedido-info">
                                        <div className="pedido-numero">
                                            <Truck size={18} />
                                            <strong>#{pedido.numero}</strong>
                                            <span className={`badge badge-${
                                                pedido.envio_estado === 'entregado' ? 'success' : 
                                                pedido.envio_estado === 'despachado' ? 'warning' : 'info'
                                            }`}>
                                                {pedido.envio_estado || 'despachado'}
                                            </span>
                                        </div>
                                        <div className="tracking-info">
                                            <span className="tracking-number">{pedido.envio_tracking}</span>
                                            <button 
                                                className="btn-icon" 
                                                onClick={() => copyTracking(pedido.envio_tracking)}
                                                title="Copiar tracking"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <button 
                                                className="btn-icon"
                                                onClick={() => handleConsultarTracking(pedido.envio_tracking)}
                                                title="Ver en Correo Argentino"
                                            >
                                                <ExternalLink size={14} />
                                            </button>
                                        </div>
                                        <div className="pedido-cliente">
                                            <span className="cliente-nombre">{pedido.cliente_nombre}</span>
                                        </div>
                                        {pedido.envio_sucursal_nombre && (
                                            <div className="pedido-ubicacion">
                                                <MapPin size={14} />
                                                <span>{pedido.envio_sucursal_nombre}</span>
                                            </div>
                                        )}
                                        {pedido.envio_fecha_despacho && (
                                            <div className="pedido-fecha">
                                                <Clock size={14} />
                                                <span>Despachado: {new Date(pedido.envio_fecha_despacho).toLocaleDateString('es-AR')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pedido-actions">
                                        <button 
                                            className="btn btn-sm btn-success"
                                            onClick={() => {
                                                setNotifEnvio({ pedidoId: pedido.id, clienteNombre: pedido.cliente_nombre });
                                                setNotifTipo('pedido_despachado');
                                                setNotifModalOpen(true);
                                            }}
                                            title="Notificar cliente"
                                        >
                                            <MessageCircle size={16} />
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => openTrackingModal(pedido)}
                                            title="Editar tracking"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Asignar Tracking */}
            <Modal
                isOpen={trackingModalOpen}
                onClose={() => setTrackingModalOpen(false)}
                title={`Asignar Tracking - Pedido #${trackingPedido?.numero || ''}`}
            >
                <div className="tracking-modal-content">
                    <div className="cliente-info-box">
                        <strong>{trackingPedido?.cliente_nombre}</strong>
                        {trackingPedido?.cliente_telefono && (
                            <span>{trackingPedido.cliente_telefono}</span>
                        )}
                        {trackingPedido?.cliente_localidad && (
                            <span>
                                <MapPin size={14} />
                                {trackingPedido.cliente_localidad}, {trackingPedido.cliente_provincia}
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Número de Tracking *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ej: CP123456789AR"
                            value={trackingInput}
                            onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                            autoFocus
                        />
                        <small className="text-muted">
                            Ingresá el código que te dio PAQ.AR al crear el envío
                        </small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sucursal de destino (opcional)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ej: Correo Argentino Quilmes"
                            value={sucursalInput}
                            onChange={(e) => setSucursalInput(e.target.value)}
                        />
                    </div>

                    <div className="info-box">
                        <Bell size={18} />
                        <span>
                            Si tenés notificaciones automáticas activadas, se enviará un WhatsApp al cliente con el tracking.
                        </span>
                    </div>

                    <div className="modal-actions">
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => setTrackingModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button 
                            className="btn btn-primary"
                            onClick={handleAsignarTracking}
                            disabled={asignandoTracking || !trackingInput.trim()}
                        >
                            {asignandoTracking ? (
                                <>
                                    <Loader2 size={18} className="spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Guardar Tracking
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Sección anterior de envíos demo (colapsada) */}
            {envios.length > 0 && (
                <details className="envios-demo-section mt-xl">
                    <summary className="text-muted">
                        <Package size={16} />
                        Envíos locales ({envios.length})
                    </summary>
                    <div className="envios-list mt-md">
                        {envios.map(envio => {
                            const estadoInfo = ESTADOS_LABELS[envio.estado] || ESTADOS_LABELS.pendiente;
                            return (
                                <div key={envio.id} className="envio-card">
                                    <div className="envio-header">
                                        <span className="tracking-number">{envio.trackingNumber || 'Sin tracking'}</span>
                                        <span className={`badge badge-${estadoInfo.color}`}>{estadoInfo.label}</span>
                                    </div>
                                    <div className="envio-body">
                                        <strong>{envio.destinatario?.nombre}</strong>
                                        <p className="text-muted">{envio.destinatario?.localidad}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </details>
            )}

            {/* Modal Nuevo Envío */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nuevo Envío"
                size="lg"
            >
                <div className="new-envio-form">
                    {/* Seleccionar Pedido */}
                    <div className="form-section">
                        <h4>📦 Pedido (opcional)</h4>
                        <div className="form-group">
                            <label className="form-label">Asociar a pedido</label>
                            <select
                                className="form-select"
                                value={formData.pedidoId}
                                onChange={(e) => handlePedidoSelect(e.target.value)}
                            >
                                <option value="">-- Sin pedido asociado --</option>
                                {pedidos.map(p => (
                                    <option key={p.id} value={p.id}>
                                        #{p.numero} - {getCliente(p.clienteId)?.nombre} (${p.total?.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Destinatario */}
                    <div className="form-section">
                        <h4>📍 Destinatario</h4>
                        <div className="form-group">
                            <label className="form-label">Nombre completo *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.destinatario.nombre}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    destinatario: { ...formData.destinatario, nombre: e.target.value }
                                })}
                                placeholder="Juan Pérez"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.destinatario.telefono}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        destinatario: { ...formData.destinatario, telefono: e.target.value }
                                    })}
                                    placeholder="1123456789"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.destinatario.email}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        destinatario: { ...formData.destinatario, email: e.target.value }
                                    })}
                                    placeholder="email@ejemplo.com"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Calle *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.destinatario.calle}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        destinatario: { ...formData.destinatario, calle: e.target.value }
                                    })}
                                    placeholder="Av. Corrientes"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Altura *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.destinatario.altura}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        destinatario: { ...formData.destinatario, altura: e.target.value }
                                    })}
                                    placeholder="1234"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Piso</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.destinatario.piso}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        destinatario: { ...formData.destinatario, piso: e.target.value }
                                    })}
                                    placeholder="2"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Depto</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.destinatario.depto}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        destinatario: { ...formData.destinatario, depto: e.target.value }
                                    })}
                                    placeholder="A"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Código Postal *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.destinatario.codigoPostal}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        destinatario: { ...formData.destinatario, codigoPostal: e.target.value }
                                    })}
                                    placeholder="C1043"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Localidad *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.destinatario.localidad}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        destinatario: { ...formData.destinatario, localidad: e.target.value }
                                    })}
                                    placeholder="CABA"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Provincia *</label>
                                <select
                                    className="form-select"
                                    value={formData.destinatario.provincia}
                                    onChange={(e) => handleProvinciaChange(e.target.value)}
                                >
                                    {Object.entries(PROVINCIAS).map(([code, name]) => (
                                        <option key={code} value={code}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Paquete */}
                    <div className="form-section">
                        <h4>📐 Paquete</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Peso (gramos)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.paquete.peso}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        paquete: { ...formData.paquete, peso: Number(e.target.value) }
                                    })}
                                    min="1"
                                    max="25000"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Alto (cm)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.paquete.alto}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        paquete: { ...formData.paquete, alto: Number(e.target.value) }
                                    })}
                                    min="1"
                                    max="150"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ancho (cm)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.paquete.ancho}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        paquete: { ...formData.paquete, ancho: Number(e.target.value) }
                                    })}
                                    min="1"
                                    max="150"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Largo (cm)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.paquete.largo}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        paquete: { ...formData.paquete, largo: Number(e.target.value) }
                                    })}
                                    min="1"
                                    max="150"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Valor declarado ($)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.valorDeclarado}
                                onChange={(e) => setFormData({ ...formData, valorDeclarado: Number(e.target.value) })}
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Tipo de Envío */}
                    <div className="form-section">
                        <h4>🚚 Tipo de Envío</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Tipo de Entrega</label>
                                <select
                                    className="form-select"
                                    value={formData.tipoEntrega}
                                    onChange={(e) => handleTipoEntregaChange(e.target.value)}
                                >
                                    {Object.entries(DELIVERY_TYPES).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Servicio</label>
                                <select
                                    className="form-select"
                                    value={formData.tipoServicio}
                                    onChange={(e) => setFormData({ ...formData, tipoServicio: e.target.value })}
                                >
                                    {Object.entries(SERVICE_TYPES).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Selección de Sucursal - Cascada Provincia → Localidad → Sucursal */}
                        {formData.tipoEntrega === 'agency' && (
                            <div className="sucursal-selector">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Provincia *</label>
                                        <select
                                            className="form-select"
                                            value={selectedProvincia}
                                            onChange={(e) => cargarSucursalesProvincia(e.target.value)}
                                        >
                                            {Object.entries(PROVINCIAS).map(([code, name]) => (
                                                <option key={code} value={code}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Localidad</label>
                                        <select
                                            className="form-select"
                                            value={selectedLocalidad}
                                            onChange={(e) => handleLocalidadChange(e.target.value)}
                                            disabled={loading || localidades.length === 0}
                                        >
                                            <option value="">-- Todas las localidades --</option>
                                            {localidades.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Sucursal de retiro *</label>
                                    {loading ? (
                                        <div className="loading-sucursales">
                                            <RefreshCw size={16} className="spin" />
                                            Cargando sucursales...
                                        </div>
                                    ) : getSucursalesFiltradas().length > 0 ? (
                                        <div className="sucursales-grid">
                                            {getSucursalesFiltradas().map(s => (
                                                <div
                                                    key={s.agency_id}
                                                    className={`sucursal-card ${formData.sucursalId === s.agency_id ? 'selected' : ''}`}
                                                    onClick={() => setFormData({ ...formData, sucursalId: s.agency_id })}
                                                >
                                                    <div className="sucursal-name">{s.agency_name}</div>
                                                    <div className="sucursal-address">
                                                        {s.location?.street_name} {s.location?.street_number}
                                                    </div>
                                                    <div className="sucursal-locality">{s.locality || s.location?.city}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted">No hay sucursales disponibles para esta provincia</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Observaciones */}
                    <div className="form-group">
                        <label className="form-label">Observaciones</label>
                        <textarea
                            className="form-textarea"
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            placeholder="Instrucciones especiales de entrega..."
                            rows="2"
                        />
                    </div>

                    {/* Cotización */}
                    <div className="form-section cotizacion-section">
                        <div className="cotizacion-header">
                            <h4>💰 Cotización</h4>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={handleCotizar}
                                disabled={cotizando || !formData.destinatario.codigoPostal}
                            >
                                {cotizando ? <RefreshCw size={14} className="spin" /> : <DollarSign size={14} />}
                                {cotizando ? 'Cotizando...' : 'Cotizar'}
                            </button>
                        </div>

                        {cotizacion && cotizacion.length > 0 ? (
                            <div className="cotizacion-results">
                                {cotizacion.map((rate, i) => (
                                    <div key={i} className="rate-card">
                                        <div className="rate-info">
                                            <strong>{rate.productName}</strong>
                                            <span className="text-muted">
                                                {rate.deliveredType === 'D' ? 'A domicilio' : 'En sucursal'}
                                            </span>
                                        </div>
                                        <div className="rate-price">
                                            <span className="price">${rate.price.toLocaleString()}</span>
                                            <span className="delivery-time">
                                                {rate.deliveryTimeMin}-{rate.deliveryTimeMax} días
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted text-sm">
                                Ingresá los datos del paquete y destino para cotizar el envío
                            </p>
                        )}
                    </div>

                    {/* Acciones */}
                    <div className="form-actions">
                        <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleCrearEnvio}
                            disabled={loading}
                        >
                            {loading ? <RefreshCw size={18} className="spin" /> : <Truck size={18} />}
                            Crear Envío
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Detalle/Tracking */}
            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={`Tracking: ${selectedEnvio?.trackingNumber || 'Sin tracking'}`}
            >
                {selectedEnvio && (
                    <div className="tracking-detail">
                        <div className="tracking-header">
                            <div>
                                <p className="text-muted">Destinatario</p>
                                <strong>{selectedEnvio.destinatario?.nombre}</strong>
                                <p className="text-muted">
                                    {selectedEnvio.destinatario?.calle} {selectedEnvio.destinatario?.altura}
                                </p>
                            </div>
                            <span className={`badge badge-${ESTADOS_LABELS[selectedEnvio.estado]?.color}`}>
                                {ESTADOS_LABELS[selectedEnvio.estado]?.label}
                            </span>
                        </div>

                        <div className="tracking-timeline">
                            <h4>Historial de movimientos</h4>
                            {trackingEvents.length === 0 ? (
                                <p className="text-muted text-center">No hay movimientos registrados</p>
                            ) : (
                                <div className="timeline">
                                    {trackingEvents.map((event, i) => (
                                        <div key={i} className="timeline-item">
                                            <div className="timeline-dot">
                                                {i === 0 ? <CheckCircle size={16} /> : <Clock size={16} />}
                                            </div>
                                            <div className="timeline-content">
                                                <strong>{event.status}</strong>
                                                <p className="text-muted">{event.facility}</p>
                                                <span className="text-muted">{event.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Enviar Notificación WhatsApp */}
            <Modal
                isOpen={notifModalOpen}
                onClose={() => setNotifModalOpen(false)}
                title="📱 Enviar Notificación por WhatsApp"
            >
                {notifEnvio && (
                    <div className="notif-modal-content">
                        <div className="notif-info-box">
                            <span><strong>Destinatario:</strong> {notifEnvio.destinatario?.nombre}</span>
                            <span><strong>Teléfono:</strong> {notifEnvio.destinatario?.telefono || clientes.find(c => c.id === notifEnvio.clienteId)?.telefono || 'No disponible'}</span>
                            {notifEnvio.trackingNumber && (
                                <span><strong>Tracking:</strong> {notifEnvio.trackingNumber}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tipo de notificación</label>
                            <div className="notif-types-grid">
                                {Object.entries(TIPOS_NOTIFICACION).map(([key, val]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`notif-type-btn ${notifTipo === key ? 'active' : ''}`}
                                        onClick={() => setNotifTipo(key)}
                                    >
                                        <span className="notif-icon">{val.icon}</span>
                                        <span className="notif-label">{val.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">O mensaje personalizado</label>
                            <textarea
                                className="form-input"
                                rows={4}
                                value={notifMensaje}
                                onChange={(e) => setNotifMensaje(e.target.value)}
                                placeholder="Escribir mensaje personalizado para el cliente..."
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setNotifModalOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleEnviarNotificacion}
                                disabled={(!notifTipo && !notifMensaje) || enviandoNotif}
                            >
                                {enviandoNotif ? (
                                    <>
                                        <Loader2 size={16} className="spinner" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Enviar WhatsApp
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <style>{`
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
        }
        
        .alert-warning {
          background: var(--warning-bg);
          color: var(--warning);
          border: 1px solid var(--warning);
        }
        
        .alert-info {
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .envios-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .envio-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          transition: all var(--transition-fast);
        }
        
        .envio-card:hover {
          border-color: var(--accent);
        }
        
        .envio-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .envio-tracking {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .tracking-number {
          font-weight: 600;
          font-family: monospace;
        }
        
        .envio-body {
          margin-bottom: 1rem;
        }
        
        .envio-destinatario {
          display: flex;
          gap: 0.75rem;
        }
        
        .envio-destinatario p {
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        
        .envio-actions {
          display: flex;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        
        .new-envio-form {
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
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        
        .tracking-detail {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .tracking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .tracking-timeline h4 {
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
        
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .timeline-item {
          display: flex;
          gap: 0.75rem;
        }
        
        .timeline-dot {
          width: 32px;
          height: 32px;
          background: var(--bg-tertiary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          flex-shrink: 0;
        }
        
        .timeline-content {
          flex: 1;
        }
        
        .timeline-content span {
          font-size: 0.75rem;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        /* Cotizacion styles */
        .cotizacion-section {
          background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
          border: 1px dashed var(--border-color);
        }
        
        .cotizacion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .cotizacion-header h4 {
          margin: 0;
        }
        
        .cotizacion-results {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .rate-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--bg-card);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        
        .rate-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .rate-price {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }
        
        .rate-price .price {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--success);
        }
        
        .rate-price .delivery-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        /* Sucursal Selector */
        .sucursal-selector {
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          padding: 1rem;
          margin-top: 0.5rem;
        }
        
        .loading-sucursales {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          padding: 1rem;
        }
        
        .sucursales-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
          max-height: 250px;
          overflow-y: auto;
        }
        
        .sucursal-card {
          background: var(--bg-card);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .sucursal-card:hover {
          border-color: var(--accent);
        }
        
        .sucursal-card.selected {
          border-color: var(--accent);
          background: rgba(245, 158, 11, 0.1);
        }
        
        .sucursal-name {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }
        
        .sucursal-address {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .sucursal-locality {
          font-size: 0.75rem;
          color: var(--accent);
          margin-top: 0.25rem;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Mobile */
        @media (max-width: 768px) {
          .envios-page .page-header {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          
          .envios-page .page-header .btn {
            width: 100%;
            justify-content: center;
          }
          
          .form-row {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          
          .envio-actions {
            flex-wrap: wrap;
          }
          
          .envio-actions .btn {
            flex: 1;
            justify-content: center;
          }
        }

        /* WhatsApp Notification Modal */
        .notif-modal-content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .notif-info-box {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
        }

        .notif-types-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .notif-type-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          padding: 0.75rem 0.5rem;
          background: var(--bg-tertiary);
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .notif-type-btn:hover {
          border-color: var(--accent);
        }

        .notif-type-btn.active {
          border-color: var(--accent);
          background: rgba(245, 158, 11, 0.1);
        }

        .notif-icon {
          font-size: 1.25rem;
        }

        .notif-label {
          font-size: 0.7rem;
          text-align: center;
          font-weight: 500;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .btn-success {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
        }

        .btn-success:hover {
          background: linear-gradient(135deg, #16a34a, #15803d);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 430px) {
          .notif-types-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Tabs de Envíos */
        .envios-tabs {
          display: flex;
          gap: 0.5rem;
          background: var(--bg-secondary);
          padding: 0.5rem;
          border-radius: var(--radius-lg);
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tab-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .tab-btn.active {
          background: var(--accent);
          color: var(--bg-primary);
        }

        .tab-btn .badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
        }

        /* Lista de Pedidos para Envío */
        .pedidos-envio-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .pedido-envio-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }

        .pedido-envio-card:hover {
          border-color: var(--accent);
        }

        .pedido-envio-card.despachado {
          border-left: 3px solid var(--accent);
        }

        .pedido-info {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .pedido-numero {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
        }

        .pedido-numero svg {
          color: var(--accent);
        }

        .pedido-cliente {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
        }

        .cliente-nombre {
          font-weight: 500;
        }

        .cliente-tel {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .pedido-ubicacion,
        .pedido-total,
        .pedido-fecha {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .tracking-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .tracking-number {
          font-family: monospace;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--accent);
          background: rgba(245, 158, 11, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-icon:hover {
          background: var(--accent);
          color: var(--bg-primary);
          border-color: var(--accent);
        }

        .pedido-actions {
          display: flex;
          gap: 0.5rem;
        }

        /* Tracking Modal */
        .tracking-modal-content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .cliente-info-box {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }

        .cliente-info-box span {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .info-box {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .info-box svg {
          flex-shrink: 0;
          color: #3b82f6;
        }

        .loading-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        /* Envios Demo Section */
        .envios-demo-section {
          margin-top: 2rem;
        }

        .envios-demo-section summary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.9rem;
        }

        .envios-demo-section summary:hover {
          background: var(--bg-tertiary);
        }

        @media (max-width: 768px) {
          .envios-tabs {
            flex-direction: column;
          }

          .pedido-envio-card {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .pedido-actions {
            justify-content: stretch;
          }

          .pedido-actions .btn {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
        </div>
    );
}
