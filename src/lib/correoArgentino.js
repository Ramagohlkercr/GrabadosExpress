/**
 * Correo Argentino PAQ.AR API Service
 * Documentación: API 2.0 - Abril 2023
 */

// URLs de la API
const API_URL_PROD = 'https://api.correoargentino.com.ar/paqar/v1';
const API_URL_TEST = 'https://apitest.correoargentino.com.ar/paqar/v1';

// Códigos de provincia ISO 3166-2
export const PROVINCIAS = {
    A: 'Salta',
    B: 'Buenos Aires',
    C: 'CABA',
    D: 'San Luis',
    E: 'Entre Ríos',
    F: 'La Rioja',
    G: 'Santiago del Estero',
    H: 'Chaco',
    J: 'San Juan',
    K: 'Catamarca',
    L: 'La Pampa',
    M: 'Mendoza',
    N: 'Misiones',
    P: 'Formosa',
    Q: 'Neuquén',
    R: 'Río Negro',
    S: 'Santa Fe',
    T: 'Tucumán',
    U: 'Chubut',
    V: 'Tierra del Fuego',
    W: 'Corrientes',
    X: 'Córdoba',
    Y: 'Jujuy',
    Z: 'Santa Cruz'
};

// Tipos de entrega
export const DELIVERY_TYPES = {
    homeDelivery: 'Entrega a domicilio',
    agency: 'Retiro en sucursal',
    locker: 'Retiro en locker'
};

// Tipos de servicio
export const SERVICE_TYPES = {
    CP: 'Clásico PAQ.AR',
    EP: 'Express PAQ.AR'
};

/**
 * Obtener credenciales guardadas
 */
function getCredentials() {
    const config = JSON.parse(localStorage.getItem('ge_configuracion') || '{}');
    return {
        apiKey: config.correoArgentinoApiKey || '',
        agreement: config.correoArgentinoAgreement || '',
        useTestMode: config.correoArgentinoTestMode !== false
    };
}

/**
 * Obtener URL base según modo
 */
function getBaseUrl() {
    const { useTestMode } = getCredentials();
    return useTestMode ? API_URL_TEST : API_URL_PROD;
}

/**
 * Headers para las peticiones
 */
function getHeaders() {
    const { apiKey, agreement } = getCredentials();
    return {
        'Authorization': `Apikey ${apiKey}`,
        'agreement': agreement,
        'Content-Type': 'application/json'
    };
}

/**
 * Verificar si hay credenciales configuradas
 */
export function hasCredentials() {
    const { apiKey, agreement } = getCredentials();
    return apiKey && agreement;
}

/**
 * Validar credenciales con la API
 * GET /v1/auth
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function validarCredenciales() {
    if (!hasCredentials()) {
        return { success: false, error: 'No hay credenciales configuradas' };
    }

    try {
        const response = await fetch(`${getBaseUrl()}/auth`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (response.status === 204) {
            return { success: true };
        }

        const data = await response.json();
        return { success: false, error: data.message || data.error };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Crear orden de envío
 * POST /v1/orders
 * @param {Object} orderData - Datos del envío
 * @returns {Promise<{success: boolean, trackingNumber?: string, error?: string}>}
 */
export async function crearEnvio(orderData) {
    if (!hasCredentials()) {
        return { success: false, error: 'No hay credenciales configuradas' };
    }

    const { agreement } = getCredentials();

    const payload = {
        sellerId: agreement,
        trackingNumber: '', // Correo Argentino lo genera
        order: {
            senderData: {
                id: orderData.remitente?.id || '',
                businessName: orderData.remitente?.nombre || '',
                areaCodePhone: '',
                phoneNumber: orderData.remitente?.telefono || '',
                areaCodeCellphone: '',
                cellphoneNumber: orderData.remitente?.celular || '',
                email: orderData.remitente?.email || '',
                observation: '',
                address: {
                    streetName: orderData.remitente?.calle || '',
                    streetNumber: orderData.remitente?.altura || '',
                    cityName: orderData.remitente?.localidad || '',
                    floor: orderData.remitente?.piso || '',
                    department: orderData.remitente?.depto || '',
                    state: orderData.remitente?.provincia || '',
                    zipCode: orderData.remitente?.codigoPostal || ''
                }
            },
            shippingData: {
                name: orderData.destinatario?.nombre || '',
                areaCodePhone: '',
                phoneNumber: orderData.destinatario?.telefono || '',
                areaCodeCellphone: '',
                cellphoneNumber: orderData.destinatario?.celular || '',
                email: orderData.destinatario?.email || '',
                observation: orderData.observaciones || '',
                address: {
                    streetName: orderData.destinatario?.calle || '',
                    streetNumber: orderData.destinatario?.altura || '',
                    cityName: orderData.destinatario?.localidad || '',
                    floor: orderData.destinatario?.piso || '',
                    department: orderData.destinatario?.depto || '',
                    state: orderData.destinatario?.provincia || '',
                    zipCode: orderData.destinatario?.codigoPostal || ''
                }
            },
            parcels: [{
                dimensions: {
                    height: String(orderData.paquete?.alto || 10),
                    width: String(orderData.paquete?.ancho || 10),
                    depth: String(orderData.paquete?.largo || 10)
                },
                productWeight: String(orderData.paquete?.peso || 500),
                productCategory: orderData.paquete?.categoria || 'General',
                declaredValue: String(orderData.valorDeclarado || 1000)
            }],
            deliveryType: orderData.tipoEntrega || 'homeDelivery',
            agencyId: orderData.sucursalId || '',
            saleDate: new Date().toISOString(),
            serviceType: orderData.tipoServicio || 'CP',
            shipmentClientId: orderData.pedidoId || ''
        }
    };

    try {
        const response = await fetch(`${getBaseUrl()}/orders`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            return {
                success: true,
                trackingNumber: data.trackingNumber,
                data
            };
        }

        return { success: false, error: data.message || data.error };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Cancelar envío
 * PATCH /v1/orders/{trackingNumber}/cancel
 * @param {string} trackingNumber
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function cancelarEnvio(trackingNumber) {
    if (!hasCredentials()) {
        return { success: false, error: 'No hay credenciales configuradas' };
    }

    try {
        const response = await fetch(`${getBaseUrl()}/orders/${trackingNumber}/cancel`, {
            method: 'PATCH',
            headers: getHeaders()
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, message: data.mensaje };
        }

        return { success: false, error: data.message || data.error };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtener rótulo (etiqueta) en PDF
 * POST /v1/labels
 * @param {string} trackingNumber
 * @param {string} formato - '10x15' o 'label'
 * @returns {Promise<{success: boolean, pdfBase64?: string, fileName?: string, error?: string}>}
 */
export async function obtenerRotulo(trackingNumber, formato = '10x15') {
    if (!hasCredentials()) {
        return { success: false, error: 'No hay credenciales configuradas' };
    }

    const { agreement } = getCredentials();

    try {
        const response = await fetch(`${getBaseUrl()}/labels?labelFormat=${formato}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify([{
                sellerId: agreement,
                trackingNumber
            }])
        });

        const data = await response.json();

        if (response.ok && data.length > 0) {
            const label = data[0];
            if (label.result === 'OK' || label.status === 'OK') {
                return {
                    success: true,
                    pdfBase64: label.fileBase64,
                    fileName: label.fileName || label.filename
                };
            }
            return { success: false, error: label.result };
        }

        return { success: false, error: data.message || 'Error al obtener rótulo' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Consultar historial/tracking de envío
 * GET /v1/tracking
 * @param {string} trackingNumber
 * @returns {Promise<{success: boolean, events?: Array, error?: string}>}
 */
export async function consultarTracking(trackingNumber) {
    if (!hasCredentials()) {
        return { success: false, error: 'No hay credenciales configuradas' };
    }

    try {
        const url = new URL(`${getBaseUrl()}/tracking`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...getHeaders(),
                'Content-Type': 'application/json'
            },
            // El body va como query params o en el body según la API
        });

        // Workaround: algunos endpoints de tracking usan GET con body
        // que no es estándar, puede requerir ajustes
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
            const tracking = data.find(t => t.trackingNumber === trackingNumber);
            if (tracking) {
                return {
                    success: true,
                    events: tracking.event || [],
                    quantity: tracking.quantity
                };
            }
        }

        return { success: false, error: data.message || 'No se encontró el envío' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtener sucursales habilitadas
 * GET /v1/agencies
 * @param {string} provinciaId - Código de provincia (opcional)
 * @returns {Promise<{success: boolean, sucursales?: Array, error?: string}>}
 */
export async function obtenerSucursales(provinciaId = '') {
    if (!hasCredentials()) {
        return { success: false, error: 'No hay credenciales configuradas' };
    }

    try {
        let url = `${getBaseUrl()}/agencies`;
        if (provinciaId) {
            url += `?stateId=${provinciaId}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });

        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
            return { success: true, sucursales: data };
        }

        return { success: false, error: data.message || data.error };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Descargar PDF desde base64
 */
export function descargarPDF(base64, fileName) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName || 'rotulo.pdf';
    link.click();
    URL.revokeObjectURL(link.href);
}
