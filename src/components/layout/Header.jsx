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
          padding: 0.75rem 1.5rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        
        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
        }
        
        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 18px;
          height: 18px;
          background: var(--danger);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 320px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          margin-top: 0.5rem;
          overflow: hidden;
        }
        
        .notification-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .notification-header h4 {
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .notification-list {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .notification-empty {
          padding: 2rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        
        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        
        .notification-item:hover {
          background: var(--bg-hover);
        }
        
        .notification-item:last-child {
          border-bottom: none;
        }
        
        .notification-item.danger {
          background: var(--danger-bg);
        }
        
        .notification-item.warning {
          background: var(--warning-bg);
        }
        
        .notification-icon {
          font-size: 1.25rem;
        }
        
        .notification-content {
          flex: 1;
        }
        
        .notification-title {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
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
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-primary);
        }
        
        .user-btn:hover {
          background: var(--bg-hover);
          border-color: var(--accent);
        }
        
        .user-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent), var(--accent-hover));
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        @media (max-width: 768px) {
          .user-name {
            display: none;
          }
        }
        
        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 260px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          margin-top: 0.5rem;
          overflow: hidden;
          z-index: 100;
        }
        
        .user-dropdown-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--bg-tertiary);
        }
        
        .user-avatar-lg {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--accent), var(--accent-hover));
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .user-info {
          flex: 1;
          min-width: 0;
        }
        
        .user-info-name {
          font-weight: 600;
          font-size: 0.875rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .user-info-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .user-dropdown-divider {
          height: 1px;
          background: var(--border-color);
        }
        
        .user-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem 1rem;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        
        .user-dropdown-item:hover {
          background: var(--bg-hover);
        }
        
        .user-dropdown-item svg {
          color: var(--text-muted);
        }
      `}</style>
    </header>
  );
}
