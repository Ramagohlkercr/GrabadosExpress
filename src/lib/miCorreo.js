/**
 * Correo Argentino MiCorreo API Service
 * API REST con JWT para cotizar e importar envíos
 * Documentación: API MiCorreo 2025-01-14
 */

// URLs de la API
const API_URL_PROD = 'https://api.correoargentino.com.ar/micorreo/v1';
const API_URL_TEST = 'https://apitest.correoargentino.com.ar/micorreo/v1';

// Códigos de provincia
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
    D: 'Entrega a domicilio',
    S: 'Retiro en sucursal'
};

/**
 * Obtener credenciales guardadas
 */
function getCredentials() {
    const config = JSON.parse(localStorage.getItem('ge_configuracion') || '{}');
    return {
        username: config.miCorreoUsername || '',
        password: config.miCorreoPassword || '',
        customerId: config.miCorreoCustomerId || '',
        useTestMode: config.miCorreoTestMode !== false
    };
}

/**
 * Obtener token JWT guardado
 */
function getStoredToken() {
    const tokenData = localStorage.getItem('miCorreoToken');
    if (tokenData) {
        const { token, expires } = JSON.parse(tokenData);
        if (new Date(expires) > new Date()) {
            return token;
        }
    }
    return null;
}

/**
 * Guardar token JWT
 */
function saveToken(token, expires) {
    localStorage.setItem('miCorreoToken', JSON.stringify({ token, expires }));
}

/**
 * Obtener URL base según modo
 */
function getBaseUrl() {
    const { useTestMode } = getCredentials();
    return useTestMode ? API_URL_TEST : API_URL_PROD;
}

/**
 * Verificar si hay credenciales configuradas
 */
export function hasMiCorreoCredentials() {
    const { username, password } = getCredentials();
    return username && password;
}

/**
 * Verificar si hay customerId
 */
export function hasCustomerId() {
    const { customerId } = getCredentials();
    return !!customerId;
}

/**
 * Obtener token JWT (autenticación)
 * POST /token con Basic Auth
 * @returns {Promise<{success: boolean, token?: string, expires?: string, error?: string}>}
 */
export async function obtenerToken() {
    const { username, password } = getCredentials();

    if (!username || !password) {
        return { success: false, error: 'No hay credenciales configuradas' };
    }

    // Verificar si hay token válido
    const storedToken = getStoredToken();
    if (storedToken) {
        return { success: true, token: storedToken };
    }

    try {
        const credentials = btoa(`${username}:${password}`);
        const response = await fetch(`${getBaseUrl()}/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            saveToken(data.token, data.expires);
            return { success: true, token: data.token, expires: data.expires };
        }

        const error = await response.json();
        return { success: false, error: error.message || 'Error de autenticación' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Headers con Bearer token
 */
async function getAuthHeaders() {
    const tokenResult = await obtenerToken();
    if (!tokenResult.success) {
        throw new Error(tokenResult.error);
    }
    return {
        'Authorization': `Bearer ${tokenResult.token}`,
        'Content-Type': 'application/json'
    };
}

/**
 * Validar usuario y obtener customerId
 * POST /users/validate
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, customerId?: string, error?: string}>}
 */
export async function validarUsuario(email, password) {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getBaseUrl()}/users/validate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, customerId: data.customerId };
        }

        return { success: false, error: data.message || 'Usuario no válido' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtener sucursales por provincia
 * GET /agencies
 * @param {string} provinciaCode - Código de provincia (ej: 'B')
 * @returns {Promise<{success: boolean, sucursales?: Array, error?: string}>}
 */
export async function obtenerSucursales(provinciaCode) {
    const { customerId } = getCredentials();

    if (!customerId) {
        return { success: false, error: 'No hay customerId configurado' };
    }

    try {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams({
            customerId,
            provinceCode: provinciaCode
        });

        const response = await fetch(`${getBaseUrl()}/agencies?${params}`, {
            method: 'GET',
            headers
        });

        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
            return { success: true, sucursales: data };
        }

        return { success: false, error: data.message || 'Error al obtener sucursales' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Cotizar envío
 * POST /rates
 * @param {Object} params - Parámetros de cotización
 * @returns {Promise<{success: boolean, rates?: Array, error?: string}>}
 */
export async function cotizarEnvio(params) {
    const { customerId } = getCredentials();

    if (!customerId) {
        return { success: false, error: 'No hay customerId configurado' };
    }

    try {
        const headers = await getAuthHeaders();

        const payload = {
            customerId,
            postalCodeOrigin: params.cpOrigen,
            postalCodeDestination: params.cpDestino,
            deliveredType: params.tipoEntrega, // 'D' o 'S' (opcional)
            dimensions: {
                weight: params.peso, // gramos
                height: params.alto, // cm
                width: params.ancho, // cm
                length: params.largo // cm
            }
        };

        const response = await fetch(`${getBaseUrl()}/rates`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            return {
                success: true,
                rates: data.rates,
                validTo: data.validTo
            };
        }

        return { success: false, error: data.message || 'Error al cotizar' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Importar envío a MiCorreo
 * POST /shipping/import
 * @param {Object} envio - Datos del envío
 * @returns {Promise<{success: boolean, createdAt?: string, error?: string}>}
 */
export async function importarEnvio(envio) {
    const { customerId } = getCredentials();

    if (!customerId) {
        return { success: false, error: 'No hay customerId configurado' };
    }

    try {
        const headers = await getAuthHeaders();

        const payload = {
            customerId,
            extOrderId: envio.extOrderId || `${Date.now()}`,
            orderNumber: envio.orderNumber || '',
            sender: envio.remitente ? {
                name: envio.remitente.nombre || null,
                phone: envio.remitente.telefono || null,
                cellPhone: envio.remitente.celular || null,
                email: envio.remitente.email || null,
                originAddress: envio.remitente.direccion ? {
                    streetName: envio.remitente.direccion.calle || null,
                    streetNumber: envio.remitente.direccion.altura || null,
                    floor: envio.remitente.direccion.piso || null,
                    apartment: envio.remitente.direccion.depto || null,
                    city: envio.remitente.direccion.ciudad || null,
                    provinceCode: envio.remitente.direccion.provincia || null,
                    postalCode: envio.remitente.direccion.codigoPostal || null
                } : {}
            } : {},
            recipient: {
                name: envio.destinatario.nombre,
                phone: envio.destinatario.telefono || '',
                cellPhone: envio.destinatario.celular || '',
                email: envio.destinatario.email
            },
            shipping: {
                deliveryType: envio.tipoEntrega || 'D',
                productType: 'CP',
                agency: envio.tipoEntrega === 'S' ? envio.sucursalId : null,
                address: envio.tipoEntrega !== 'S' ? {
                    streetName: envio.destinatario.calle,
                    streetNumber: envio.destinatario.altura,
                    floor: envio.destinatario.piso || '',
                    apartment: envio.destinatario.depto || '',
                    city: envio.destinatario.localidad,
                    provinceCode: envio.destinatario.provincia,
                    postalCode: envio.destinatario.codigoPostal
                } : {},
                weight: envio.paquete.peso,
                declaredValue: envio.valorDeclarado,
                height: envio.paquete.alto,
                length: envio.paquete.largo,
                width: envio.paquete.ancho
            }
        };

        const response = await fetch(`${getBaseUrl()}/shipping/import`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, createdAt: data.createdAt };
        }

        return { success: false, error: data.message || 'Error al importar envío' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtener tracking de un envío
 * GET /shipping/tracking
 * @param {string} shippingId - ID del envío
 * @returns {Promise<{success: boolean, tracking?: Object, error?: string}>}
 */
export async function obtenerTracking(shippingId) {
    try {
        const headers = await getAuthHeaders();

        const response = await fetch(`${getBaseUrl()}/shipping/tracking`, {
            method: 'GET',
            headers,
            body: JSON.stringify({ shippingId })
        });

        const data = await response.json();

        if (response.ok && !data.error) {
            return {
                success: true,
                tracking: Array.isArray(data) ? data[0] : data
            };
        }

        return { success: false, error: data.error || data.message || 'Envío no encontrado' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Registrar nuevo usuario en MiCorreo
 * POST /register
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<{success: boolean, customerId?: string, error?: string}>}
 */
export async function registrarUsuario(userData) {
    try {
        const headers = await getAuthHeaders();

        const payload = {
            firstName: userData.nombre,
            lastName: userData.apellido,
            email: userData.email,
            password: userData.password,
            documentType: userData.tipoCuit ? 'CUIT' : 'DNI',
            documentId: userData.documento,
            phone: userData.telefono || '',
            cellPhone: userData.celular || '',
            address: userData.direccion ? {
                streetName: userData.direccion.calle,
                streetNumber: userData.direccion.altura,
                floor: userData.direccion.piso || '',
                apartment: userData.direccion.depto || '',
                locality: userData.direccion.localidad,
                city: userData.direccion.ciudad,
                provinceCode: userData.direccion.provincia,
                postalCode: userData.direccion.codigoPostal
            } : undefined
        };

        const response = await fetch(`${getBaseUrl()}/register`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            return {
                success: true,
                customerId: data.customerId,
                createdAt: data.createdAt
            };
        }

        return { success: false, error: data.message || 'Error al registrar' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Re-export provincias for backwards compatibility
export { PROVINCIAS as PROVINCE_CODES };
