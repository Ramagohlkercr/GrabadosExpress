// ============================================
// GRABADOS EXPRESS - Service Worker v3
// Enhanced offline support
// ============================================

const CACHE_NAME = 'grabados-express-v3';
const API_CACHE_NAME = 'grabados-express-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// API endpoints that should be cached
const CACHEABLE_API_ENDPOINTS = [
    '/api/clientes',
    '/api/productos',
    '/api/insumos',
    '/api/configuracion',
    '/api/estadisticas'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v3...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Install failed:', err))
    );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker v3...');
    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then(keys => 
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME && key !== API_CACHE_NAME)
                        .map(key => {
                            console.log('[SW] Removing old cache:', key);
                            return caches.delete(key);
                        })
                )
            ),
            // Take control of all clients
            self.clients.claim()
        ])
    );
});

// Fetch - intelligent caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip external requests
    if (url.origin !== self.location.origin) {
        return;
    }

    // API requests - Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request, url));
        return;
    }

    // Static assets - Cache first, network fallback
    if (isStaticAsset(url.pathname)) {
        event.respondWith(handleStaticRequest(request));
        return;
    }

    // Navigation requests - Network first, fallback to index.html
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    // Default - Network first with cache fallback
    event.respondWith(handleDefaultRequest(request));
});

// Handle API requests - Network first with cache
async function handleApiRequest(request, url) {
    const cacheKey = getCacheKeyForApi(url);
    
    try {
        const response = await fetch(request);
        
        if (response.ok && isCacheableApiEndpoint(url.pathname)) {
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(cacheKey, response.clone());
            console.log('[SW] Cached API response:', url.pathname);
        }
        
        return response;
    } catch (error) {
        console.log('[SW] API request failed, checking cache:', url.pathname);
        
        const cache = await caches.open(API_CACHE_NAME);
        const cachedResponse = await cache.match(cacheKey);
        
        if (cachedResponse) {
            console.log('[SW] Returning cached API data:', url.pathname);
            const headers = new Headers(cachedResponse.headers);
            headers.set('X-From-Cache', 'true');
            return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers
            });
        }
        
        return new Response(
            JSON.stringify({ 
                error: 'Sin conexión', 
                offline: true,
                message: 'No hay datos en caché disponibles'
            }), 
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle static assets - Cache first
async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Static asset not available:', request.url);
        return new Response('Asset not available offline', { status: 503 });
    }
}

// Handle navigation - Network first, fallback to cached index.html
async function handleNavigationRequest(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/', response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Navigation offline, returning cached index.html');
        const cachedResponse = await caches.match('/');
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Offline - no cached page available', { status: 503 });
    }
}

// Default handler
async function handleDefaultRequest(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Helper - Check if URL is a static asset
function isStaticAsset(pathname) {
    return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Helper - Check if API endpoint should be cached
function isCacheableApiEndpoint(pathname) {
    return CACHEABLE_API_ENDPOINTS.some(endpoint => 
        pathname === endpoint || pathname.startsWith(endpoint + '?')
    );
}

// Helper - Generate cache key for API
function getCacheKeyForApi(url) {
    if (url.pathname.match(/^\/api\/(clientes|productos|insumos|pedidos)$/) && !url.search) {
        return url.pathname;
    }
    return url.pathname + url.search;
}

// Handle background sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-pending-changes') {
        console.log('[SW] Background sync triggered');
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SYNC_REQUESTED' });
                });
            })
        );
    }
});

// Handle messages from client
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting' || event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CLEAR_API_CACHE') {
        caches.delete(API_CACHE_NAME).then(() => {
            console.log('[SW] API cache cleared');
        });
    }
});

console.log('[SW] Service Worker v3 loaded');
