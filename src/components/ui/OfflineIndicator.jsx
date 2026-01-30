import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { isOnline, onOnlineChange, getSyncQueue, syncPendingChanges } from '../../lib/offlineStorage';
import './OfflineIndicator.css';

export default function OfflineIndicator({ apiHandlers }) {
    const [online, setOnline] = useState(isOnline());
    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const cleanup = onOnlineChange(setOnline);
        return cleanup;
    }, []);

    useEffect(() => {
        const checkPending = async () => {
            try {
                const queue = await getSyncQueue();
                setPendingCount(queue.length);
            } catch (e) {
                console.error('Error checking sync queue:', e);
            }
        };
        
        checkPending();
        const interval = setInterval(checkPending, 5000);
        return () => clearInterval(interval);
    }, []);

    // Auto-sync when coming back online
    useEffect(() => {
        if (online && pendingCount > 0 && apiHandlers) {
            handleSync();
        }
    }, [online]);

    const handleSync = async () => {
        if (!apiHandlers || syncing) return;
        
        setSyncing(true);
        setSyncResult(null);
        
        try {
            const result = await syncPendingChanges(apiHandlers);
            setSyncResult(result);
            
            // Refresh pending count
            const queue = await getSyncQueue();
            setPendingCount(queue.length);
            
            // Clear result after 3 seconds
            setTimeout(() => setSyncResult(null), 3000);
        } catch (error) {
            console.error('Sync error:', error);
            setSyncResult({ error: true });
        } finally {
            setSyncing(false);
        }
    };

    // Don't show if online and no pending items
    if (online && pendingCount === 0 && !syncResult) {
        return null;
    }

    return (
        <div 
            className={`offline-indicator ${online ? 'online' : 'offline'} ${pendingCount > 0 ? 'has-pending' : ''}`}
            onClick={() => setShowDetails(!showDetails)}
        >
            <div className="indicator-main">
                {online ? (
                    <Wifi size={16} className="icon-online" />
                ) : (
                    <WifiOff size={16} className="icon-offline" />
                )}
                
                <span className="status-text">
                    {online ? 'Conectado' : 'Sin conexión'}
                </span>

                {pendingCount > 0 && (
                    <span className="pending-badge">
                        {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                    </span>
                )}

                {syncing && (
                    <RefreshCw size={14} className="spinning" />
                )}

                {syncResult && !syncResult.error && (
                    <span className="sync-success">
                        <Check size={14} /> {syncResult.synced} sincronizado{syncResult.synced > 1 ? 's' : ''}
                    </span>
                )}

                {syncResult?.error && (
                    <span className="sync-error">
                        <AlertCircle size={14} /> Error al sincronizar
                    </span>
                )}
            </div>

            {showDetails && pendingCount > 0 && online && (
                <div className="indicator-details">
                    <button 
                        className="sync-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSync();
                        }}
                        disabled={syncing}
                    >
                        <RefreshCw size={14} className={syncing ? 'spinning' : ''} />
                        {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
                    </button>
                </div>
            )}

            {!online && (
                <div className="offline-message">
                    Los cambios se guardarán localmente y se sincronizarán cuando vuelvas a conectarte.
                </div>
            )}
        </div>
    );
}
