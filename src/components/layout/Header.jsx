import { Menu, Bell, Search, User, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getEstadisticasAsync } from '../../lib/storageApi';
import { formatearFechaRelativa } from '../../lib/dateUtils';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [stats, setStats] = useState({
    pedidosProximosVencer: 0,
    pedidosAtrasados: 0,
    listaPedidosProximos: [],
    listaPedidosAtrasados: []
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await getEstadisticasAsync();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  const totalAlertas = (stats.pedidosProximosVencer || 0) + (stats.pedidosAtrasados || 0);

  // Get user initials
  const userInitials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  function handleLogout() {
    logout();
    setShowUserMenu(false);
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="btn btn-ghost btn-icon mobile-only" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
      </div>

      <div className="header-right">
        {/* Notifications */}
        <div className="notification-wrapper">
          <button
            className="btn btn-ghost btn-icon notification-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
          >
            <Bell size={20} />
            {totalAlertas > 0 && (
              <span className="notification-badge">{totalAlertas}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notificaciones</h4>
              </div>
              <div className="notification-list">
                {totalAlertas === 0 ? (
                  <div className="notification-empty">
                    No hay notificaciones pendientes
                  </div>
                ) : (
                  <>
                    {stats.listaPedidosAtrasados?.map(pedido => (
                      <div key={pedido.id} className="notification-item danger">
                        <div className="notification-icon">⚠️</div>
                        <div className="notification-content">
                          <div className="notification-title">
                            Pedido #{pedido.numero} atrasado
                          </div>
                          <div className="notification-time">
                            Vencía {formatearFechaRelativa(pedido.fechaEntregaEstimada)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {stats.listaPedidosProximos?.map(pedido => (
                      <div key={pedido.id} className="notification-item warning">
                        <div className="notification-icon">📅</div>
                        <div className="notification-content">
                          <div className="notification-title">
                            Pedido #{pedido.numero} próximo a vencer
                          </div>
                          <div className="notification-time">
                            {formatearFechaRelativa(pedido.fechaEntregaEstimada)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="user-wrapper">
          <button
            className="user-btn"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
          >
            <div className="user-avatar">{userInitials}</div>
            <span className="user-name">{user?.nombre || 'Usuario'}</span>
            <ChevronDown size={16} />
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-avatar-lg">{userInitials}</div>
                <div className="user-info">
                  <div className="user-info-name">{user?.nombre || 'Admin'}</div>
                  <div className="user-info-email">{user?.email || 'admin@grabadosexpress.com'}</div>
                  <div className="user-info-role badge badge-primary mt-1" style={{ fontSize: '0.7rem', display: 'inline-block' }}>ADMIN</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: linear-gradient(180deg, rgba(12, 12, 18, 0.95) 0%, rgba(12, 12, 18, 0.8) 100%);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        
        .app-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent-glow), transparent);
        }
        
        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .mobile-only {
          display: none;
        }
        
        @media (max-width: 768px) {
          .mobile-only {
            display: flex;
          }
        }
        
        .notification-wrapper {
          position: relative;
        }
        
        .notification-btn {
          position: relative;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
        }
        
        .notification-btn:hover {
          border-color: var(--accent);
          box-shadow: 0 0 20px var(--accent-glow);
        }
        
        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          background: linear-gradient(135deg, var(--danger), #dc2626);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
          animation: pulse-notification 2s infinite;
        }
        
        @keyframes pulse-notification {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .notification-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 360px;
          background: linear-gradient(145deg, var(--bg-secondary), var(--bg-primary));
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl), 0 0 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: dropdown-appear 0.2s ease;
        }
        
        @keyframes dropdown-appear {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .notification-header {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-tertiary);
        }
        
        .notification-header h4 {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        
        .notification-list {
          max-height: 320px;
          overflow-y: auto;
        }
        
        .notification-empty {
          padding: 2.5rem 1.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        
        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .notification-item:hover {
          background: var(--bg-hover);
        }
        
        .notification-item:last-child {
          border-bottom: none;
        }
        
        .notification-item.danger {
          background: linear-gradient(90deg, var(--danger-bg), transparent);
          border-left: 3px solid var(--danger);
        }
        
        .notification-item.warning {
          background: linear-gradient(90deg, var(--warning-bg), transparent);
          border-left: 3px solid var(--warning);
        }
        
        .notification-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .notification-content {
          flex: 1;
        }
        
        .notification-title {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }
        
        .notification-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        /* User Menu Styles */
        .user-wrapper {
          position: relative;
        }
        
        .user-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem 0.5rem 0.5rem;
          background: linear-gradient(145deg, var(--bg-tertiary), var(--bg-secondary));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
          color: var(--text-primary);
        }
        
        .user-btn:hover {
          background: var(--bg-hover);
          border-color: var(--accent);
          box-shadow: 0 0 20px var(--accent-glow);
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          background: var(--accent-gradient);
          color: #000;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          box-shadow: 0 2px 8px var(--accent-glow);
        }
        
        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        @media (max-width: 768px) {
          .user-name {
            display: none;
          }
          
          .user-btn {
            padding: 0.5rem;
          }
        }
        
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: linear-gradient(145deg, var(--bg-secondary), var(--bg-primary));
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl), 0 0 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          z-index: 100;
          animation: dropdown-appear 0.2s ease;
        }
        
        .user-dropdown-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-hover));
          border-bottom: 1px solid var(--border-color);
        }
        
        .user-avatar-lg {
          width: 52px;
          height: 52px;
          background: var(--accent-gradient);
          color: #000;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          font-weight: 700;
          box-shadow: 0 4px 15px var(--accent-glow);
        }
        
        .user-info {
          flex: 1;
          min-width: 0;
        }
        
        .user-info-name {
          font-weight: 700;
          font-size: 0.95rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 0.125rem;
        }
        
        .user-info-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .user-info-role {
          margin-top: 0.5rem;
        }
        
        .user-dropdown-divider {
          height: 1px;
          background: var(--border-color);
        }
        
        .user-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          width: 100%;
          padding: 1rem 1.25rem;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .user-dropdown-item:hover {
          background: var(--bg-hover);
          color: var(--accent);
        }
        
        .user-dropdown-item svg {
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }
        
        .user-dropdown-item:hover svg {
          color: var(--accent);
        }
        
        .badge-primary {
          background: var(--accent-glow);
          color: var(--accent);
          border: 1px solid var(--border-glow);
        }
      `}</style>
    </header>
  );
}
