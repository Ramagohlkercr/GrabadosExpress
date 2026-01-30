import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowRight,
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  Play,
  Loader2,
  PieChart as PieChartIcon,
  BarChart2,
  Award,
  Star,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt
} from 'lucide-react';
import {
  getEstadisticasAsync,
  getPedidosAsync,
  getClientesAsync,
  ESTADOS_PEDIDO,
  ESTADOS_LABELS,
  checkApiStatus
} from '../lib/storageApi';
import { gastosApi } from '../lib/api';
import {
  formatearFecha,
  formatearFechaRelativa,
  getNivelUrgencia,
  getEntregasSemana
} from '../lib/dateUtils';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, Area, AreaChart
} from 'recharts';


export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [entregasSemana, setEntregasSemana] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finanzas, setFinanzas] = useState({
    ingresosHoy: 0,
    ingresosSemana: 0,
    ingresosMes: 0,
    egresosHoy: 0,
    egresosSemana: 0,
    egresosMes: 0,
    gananciaHoy: 0,
    gananciaSemana: 0,
    gananciaMes: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Check API status and load data
        await checkApiStatus();

        const [estadisticas, pedidos, clientesData, gastosData] = await Promise.all([
          getEstadisticasAsync(),
          getPedidosAsync(),
          getClientesAsync(),
          gastosApi.getAll().catch(() => [])
        ]);

        setStats(estadisticas);
        setClientes(clientesData);

        // Calculate finances
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Filter delivered pedidos for income calculation
        const pedidosEntregados = pedidos.filter(p => 
          p.estado === ESTADOS_PEDIDO.ENTREGADO || 
          p.estado === ESTADOS_PEDIDO.TERMINADO ||
          p.estado === ESTADOS_PEDIDO.EN_PRODUCCION ||
          p.estado === ESTADOS_PEDIDO.CONFIRMADO
        );

        // Calculate ingresos by period (using createdAt or fecha_pago)
        let ingresosHoy = 0, ingresosSemana = 0, ingresosMes = 0;
        pedidosEntregados.forEach(p => {
          const fecha = new Date(p.createdAt || p.created_at);
          const total = parseFloat(p.total) || 0;
          
          if (fecha >= startOfMonth) {
            ingresosMes += total;
            if (fecha >= startOfWeek) {
              ingresosSemana += total;
              if (fecha >= startOfDay) {
                ingresosHoy += total;
              }
            }
          }
        });

        // Calculate egresos by period
        let egresosHoy = 0, egresosSemana = 0, egresosMes = 0;
        (gastosData || []).forEach(g => {
          const fecha = new Date(g.fecha);
          const monto = parseFloat(g.monto) || 0;
          
          if (fecha >= startOfMonth) {
            egresosMes += monto;
            if (fecha >= startOfWeek) {
              egresosSemana += monto;
              if (fecha >= startOfDay) {
                egresosHoy += monto;
              }
            }
          }
        });

        setFinanzas({
          ingresosHoy,
          ingresosSemana,
          ingresosMes,
          egresosHoy,
          egresosSemana,
          egresosMes,
          gananciaHoy: ingresosHoy - egresosHoy,
          gananciaSemana: ingresosSemana - egresosSemana,
          gananciaMes: ingresosMes - egresosMes
        });

        const pedidosActivos = pedidos
          .filter(p => p.estado !== ESTADOS_PEDIDO.ENTREGADO && p.estado !== ESTADOS_PEDIDO.CANCELADO)
          .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
          .slice(0, 5);

        setPedidosRecientes(pedidosActivos);
        setEntregasSemana(getEntregasSemana(pedidos));
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getCliente = (clienteId) => clientes.find(c => c.id === clienteId);

  if (loading) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!stats) return null;


  const statCards = [
    {
      label: 'Pedidos Activos',
      value: stats.pedidosActivos,
      icon: Package,
      iconClass: 'accent',
      onClick: () => navigate('/pedidos'),
    },
    {
      label: 'En Producción',
      value: stats.pedidosEnProduccion,
      icon: Play,
      iconClass: 'warning',
      onClick: () => navigate('/pedidos?estado=en_produccion'),
    },
    {
      label: 'Ingresos del Mes',
      value: `$${stats.ingresosMes?.toLocaleString() || 0}`,
      icon: DollarSign,
      iconClass: 'success',
    },
    {
      label: 'Clientes',
      value: stats.clientesTotal,
      icon: Users,
      iconClass: 'info',
      onClick: () => navigate('/clientes'),
    },
  ];

  // Pie chart data for pedidos por estado
  const CHART_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];
  const pedidosPorEstado = [
    { name: 'Confirmados', value: stats.pedidosConfirmados || 0, color: '#3b82f6' },
    { name: 'En Producción', value: stats.pedidosEnProduccion || 0, color: '#f59e0b' },
    { name: 'Terminados', value: stats.pedidosTerminados || 0, color: '#10b981' },
    { name: 'Atrasados', value: stats.pedidosAtrasados || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Bar chart data for últimos 7 días
  const ventasSemana = entregasSemana.map((dia, i) => ({
    name: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][new Date(Date.now() - (6 - i) * 86400000).getDay()],
    entregas: dia.pedidos?.length || 0,
  }));

  return (
    <div className="dashboard">
      <div className="page-header">
        <div className="page-title">
          <div className="icon">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1>Dashboard</h1>
            <p className="text-muted">{formatearFecha(new Date(), "EEEE d 'de' MMMM, yyyy")}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/cotizador')}>
          <Zap size={18} />
          Nueva Cotización
        </button>
      </div>

      {/* Alertas */}
      {(stats.pedidosAtrasados > 0 || stats.insumosStockBajo > 0) && (
        <div className="alerts-section mb-lg">
          {stats.pedidosAtrasados > 0 && (
            <div className="alert alert-danger" onClick={() => navigate('/pedidos?filter=atrasados')}>
              <AlertTriangle size={20} />
              <span>
                <strong>{stats.pedidosAtrasados} pedido{stats.pedidosAtrasados > 1 ? 's' : ''} atrasado{stats.pedidosAtrasados > 1 ? 's' : ''}</strong>
                {' '}— Requieren atención inmediata
              </span>
              <ArrowRight size={18} />
            </div>
          )}
          {stats.insumosStockBajo > 0 && (
            <div className="alert alert-warning" onClick={() => navigate('/insumos')}>
              <AlertTriangle size={20} />
              <span>
                <strong>{stats.insumosStockBajo} insumo{stats.insumosStockBajo > 1 ? 's' : ''}</strong> con stock bajo
              </span>
              <ArrowRight size={18} />
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-4 mb-lg">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="stat-card"
            onClick={stat.onClick}
            style={{ cursor: stat.onClick ? 'pointer' : 'default' }}
          >
            <div className={`stat-icon ${stat.iconClass}`}>
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Finanzas - Ingresos vs Egresos */}
      <div className="finanzas-section mb-lg">
        <div className="finanzas-header">
          <h3><Wallet size={20} /> Balance Financiero</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/gastos')}>
            Ver gastos <ArrowRight size={14} />
          </button>
        </div>
        <div className="finanzas-grid">
          {/* Diario */}
          <div className="finanza-card">
            <div className="finanza-periodo">Hoy</div>
            <div className="finanza-rows">
              <div className="finanza-row ingreso">
                <span className="finanza-label"><ArrowUpRight size={14} /> Ingresos</span>
                <span className="finanza-value">${finanzas.ingresosHoy.toLocaleString()}</span>
              </div>
              <div className="finanza-row egreso">
                <span className="finanza-label"><ArrowDownRight size={14} /> Egresos</span>
                <span className="finanza-value">-${finanzas.egresosHoy.toLocaleString()}</span>
              </div>
              <div className={`finanza-row ganancia ${finanzas.gananciaHoy >= 0 ? 'positive' : 'negative'}`}>
                <span className="finanza-label">
                  {finanzas.gananciaHoy >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  Ganancia
                </span>
                <span className="finanza-value">
                  {finanzas.gananciaHoy >= 0 ? '' : '-'}${Math.abs(finanzas.gananciaHoy).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Semanal */}
          <div className="finanza-card">
            <div className="finanza-periodo">Esta Semana</div>
            <div className="finanza-rows">
              <div className="finanza-row ingreso">
                <span className="finanza-label"><ArrowUpRight size={14} /> Ingresos</span>
                <span className="finanza-value">${finanzas.ingresosSemana.toLocaleString()}</span>
              </div>
              <div className="finanza-row egreso">
                <span className="finanza-label"><ArrowDownRight size={14} /> Egresos</span>
                <span className="finanza-value">-${finanzas.egresosSemana.toLocaleString()}</span>
              </div>
              <div className={`finanza-row ganancia ${finanzas.gananciaSemana >= 0 ? 'positive' : 'negative'}`}>
                <span className="finanza-label">
                  {finanzas.gananciaSemana >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  Ganancia
                </span>
                <span className="finanza-value">
                  {finanzas.gananciaSemana >= 0 ? '' : '-'}${Math.abs(finanzas.gananciaSemana).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Mensual */}
          <div className="finanza-card highlight">
            <div className="finanza-periodo">Este Mes</div>
            <div className="finanza-rows">
              <div className="finanza-row ingreso">
                <span className="finanza-label"><ArrowUpRight size={14} /> Ingresos</span>
                <span className="finanza-value">${finanzas.ingresosMes.toLocaleString()}</span>
              </div>
              <div className="finanza-row egreso">
                <span className="finanza-label"><ArrowDownRight size={14} /> Egresos</span>
                <span className="finanza-value">-${finanzas.egresosMes.toLocaleString()}</span>
              </div>
              <div className={`finanza-row ganancia ${finanzas.gananciaMes >= 0 ? 'positive' : 'negative'}`}>
                <span className="finanza-label">
                  {finanzas.gananciaMes >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  Ganancia
                </span>
                <span className="finanza-value large">
                  {finanzas.gananciaMes >= 0 ? '' : '-'}${Math.abs(finanzas.gananciaMes).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {(pedidosPorEstado.length > 0 || stats.pedidosActivos > 0) && (
        <div className="grid grid-2 mb-lg">
          {/* Pie Chart - Pedidos por Estado */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <PieChartIcon size={18} />
                Pedidos por Estado
              </h3>
            </div>
            <div className="card-body chart-container">
              {pedidosPorEstado.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pedidosPorEstado}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {pedidosPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <p className="text-muted">No hay datos de pedidos</p>
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart - Entregas de la Semana */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <TrendingUp size={18} />
                Entregas Esta Semana
              </h3>
            </div>
            <div className="card-body chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ventasSemana}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="entregas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas Avanzadas */}
      <div className="section-header mb-md">
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={20} />
          Estadísticas Avanzadas
        </h2>
      </div>

      <div className="grid grid-2 mb-lg">
        {/* Ventas Mensuales */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} />
              Ventas Últimos 6 Meses
            </h3>
            <span className="badge badge-success">
              ${(stats.ventasAnio || 0).toLocaleString()} total año
            </span>
          </div>
          <div className="card-body chart-container">
            {stats.ventasMensuales?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.ventasMensuales}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mes" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorVentas)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <p className="text-muted">No hay datos de ventas aún</p>
              </div>
            )}
          </div>
        </div>

        {/* Productos Más Vendidos */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Award size={18} />
              Productos Más Vendidos
            </h3>
          </div>
          <div className="card-body">
            {stats.productosMasVendidos?.length > 0 ? (
              <div className="ranking-list">
                {stats.productosMasVendidos.map((item, index) => (
                  <div key={index} className="ranking-item">
                    <div className="ranking-position">
                      {index === 0 ? <Star size={16} fill="#f59e0b" color="#f59e0b" /> : `#${index + 1}`}
                    </div>
                    <div className="ranking-info">
                      <div className="ranking-name">{item.producto}</div>
                      <div className="ranking-meta">{item.cantidad} vendidos</div>
                    </div>
                    <div className="ranking-value">${item.ventas?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p className="text-muted">No hay ventas registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clientes Top */}
      <div className="grid grid-3 mb-lg">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Users size={18} />
              Mejores Clientes
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clientes')}>
              Ver todos
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            {stats.clientesTop?.length > 0 ? (
              <div className="clientes-top-grid">
                {stats.clientesTop.map((cliente, index) => (
                  <div key={cliente.id} className="cliente-top-card">
                    <div className="cliente-top-rank">#{index + 1}</div>
                    <div className="cliente-top-avatar">
                      {cliente.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div className="cliente-top-info">
                      <div className="cliente-top-nombre">{cliente.nombre}</div>
                      <div className="cliente-top-stats">
                        {cliente.pedidos} pedidos • ${cliente.totalCompras?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p className="text-muted">No hay clientes con compras</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen Rápido */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <DollarSign size={18} />
              Resumen Anual
            </h3>
          </div>
          <div className="card-body">
            <div className="resumen-stats">
              <div className="resumen-stat">
                <div className="resumen-stat-label">Ventas del Año</div>
                <div className="resumen-stat-value success">${(stats.ventasAnio || 0).toLocaleString()}</div>
              </div>
              <div className="resumen-stat">
                <div className="resumen-stat-label">Ventas del Mes</div>
                <div className="resumen-stat-value">${(stats.ingresosMes || 0).toLocaleString()}</div>
              </div>
              <div className="resumen-stat">
                <div className="resumen-stat-label">Pedidos del Mes</div>
                <div className="resumen-stat-value">{stats.pedidosMes || 0}</div>
              </div>
              <div className="resumen-stat">
                <div className="resumen-stat-label">Ticket Promedio</div>
                <div className="resumen-stat-value">
                  ${stats.pedidosMes > 0 ? Math.round((stats.ingresosMes || 0) / stats.pedidosMes).toLocaleString() : 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Pedidos Recientes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Package size={18} />
              Pedidos Activos
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pedidos')}>
              Ver todos
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            {pedidosRecientes.length === 0 ? (
              <div className="empty-state">
                <p className="text-muted">No hay pedidos activos</p>
                <button className="btn btn-primary btn-sm mt-md" onClick={() => navigate('/cotizador')}>
                  Crear primer pedido
                </button>
              </div>
            ) : (
              <div className="pedidos-list">
                {pedidosRecientes.map(pedido => {
                  const cliente = getCliente(pedido.clienteId);
                  const estadoInfo = ESTADOS_LABELS[pedido.estado];
                  const urgencia = getNivelUrgencia(pedido.fechaEntregaEstimada);

                  return (
                    <div
                      key={pedido.id}
                      className={`pedido-item ${urgencia}`}
                      onClick={() => navigate('/pedidos')}
                    >
                      <div className="pedido-info">
                        <div className="pedido-numero">#{pedido.numero}</div>
                        <div className="pedido-cliente">{cliente?.nombre || 'Sin cliente'}</div>
                      </div>
                      <div className="pedido-meta">
                        <span className={`badge badge-${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                        {pedido.fechaEntregaEstimada && (
                          <span className="pedido-fecha">
                            {formatearFechaRelativa(pedido.fechaEntregaEstimada)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Entregas de la Semana */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} />
              Entregas Esta Semana
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendario')}>
              Ver calendario
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            {entregasSemana.length === 0 ? (
              <div className="empty-state">
                <p className="text-muted">No hay entregas programadas</p>
              </div>
            ) : (
              <div className="entregas-list">
                {entregasSemana.slice(0, 5).map(pedido => {
                  const cliente = getCliente(pedido.clienteId);
                  const urgencia = getNivelUrgencia(pedido.fechaEntregaEstimada);

                  return (
                    <div key={pedido.id} className={`entrega-item ${urgencia}`}>
                      <div className="entrega-fecha">
                        <span className="entrega-dia">
                          {formatearFecha(pedido.fechaEntregaEstimada, 'dd')}
                        </span>
                        <span className="entrega-mes">
                          {formatearFecha(pedido.fechaEntregaEstimada, 'MMM')}
                        </span>
                      </div>
                      <div className="entrega-info">
                        <div className="entrega-numero">Pedido #{pedido.numero}</div>
                        <div className="entrega-cliente">{cliente?.nombre}</div>
                      </div>
                      <div className="entrega-total">
                        ${pedido.total?.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard {
          padding: 1rem 0;
        }
        
        .alerts-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .alert:hover {
          transform: translateX(4px);
        }
        
        .alert-danger {
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid var(--danger);
        }
        
        .alert-warning {
          background: var(--warning-bg);
          color: var(--warning);
          border: 1px solid var(--warning);
        }
        
        .alert span {
          flex: 1;
        }
        
        /* Finanzas Section */
        .finanzas-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
        }
        
        .finanzas-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        
        .finanzas-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        
        .finanzas-header h3 svg {
          color: var(--accent);
        }
        
        .finanzas-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        
        .finanza-card {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1rem;
          transition: all 0.3s ease;
        }
        
        .finanza-card:hover {
          border-color: var(--border-light);
        }
        
        .finanza-card.highlight {
          background: linear-gradient(145deg, rgba(245, 158, 11, 0.1) 0%, var(--bg-tertiary) 100%);
          border-color: rgba(245, 158, 11, 0.3);
        }
        
        .finanza-periodo {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 0.875rem;
          text-align: center;
        }
        
        .finanza-rows {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        
        .finanza-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.625rem;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
        }
        
        .finanza-row.ingreso {
          border-left: 3px solid var(--success);
        }
        
        .finanza-row.egreso {
          border-left: 3px solid var(--danger);
        }
        
        .finanza-row.ganancia {
          border-left: 3px solid var(--accent);
          background: linear-gradient(90deg, var(--accent-glow), transparent);
        }
        
        .finanza-row.ganancia.negative {
          border-left-color: var(--danger);
          background: linear-gradient(90deg, var(--danger-bg), transparent);
        }
        
        .finanza-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        
        .finanza-row.ingreso .finanza-label svg {
          color: var(--success);
        }
        
        .finanza-row.egreso .finanza-label svg {
          color: var(--danger);
        }
        
        .finanza-row.ganancia .finanza-label svg {
          color: var(--accent);
        }
        
        .finanza-row.ganancia.negative .finanza-label svg {
          color: var(--danger);
        }
        
        .finanza-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .finanza-row.ingreso .finanza-value {
          color: var(--success);
        }
        
        .finanza-row.egreso .finanza-value {
          color: var(--danger);
        }
        
        .finanza-row.ganancia .finanza-value {
          color: var(--accent);
        }
        
        .finanza-row.ganancia.negative .finanza-value {
          color: var(--danger);
        }
        
        .finanza-value.large {
          font-size: 1.1rem;
          font-weight: 700;
        }
        
        .pedidos-list, .entregas-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .pedido-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          border-left: 3px solid transparent;
        }
        
        .pedido-item:hover {
          background: var(--bg-hover);
        }
        
        .pedido-item.atrasado {
          border-left-color: var(--danger);
          background: var(--danger-bg);
        }
        
        .pedido-item.hoy, .pedido-item.urgente {
          border-left-color: var(--warning);
        }
        
        .pedido-numero {
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .pedido-cliente {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .pedido-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }
        
        .pedido-fecha {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        
        .entrega-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          border-left: 3px solid var(--accent);
        }
        
        .entrega-item.hoy {
          border-left-color: var(--warning);
          background: var(--warning-bg);
        }
        
        .entrega-item.atrasado {
          border-left-color: var(--danger);
          background: var(--danger-bg);
        }
        
        .entrega-fecha {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 40px;
        }
        
        .entrega-dia {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1;
        }
        
        .entrega-mes {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        
        .entrega-info {
          flex: 1;
        }
        
        .entrega-numero {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .entrega-cliente {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .entrega-total {
          font-weight: 600;
          color: var(--accent);
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .dashboard { padding: 0.5rem 0; }
          
          .dashboard .page-header {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          
          .dashboard .page-header .btn {
            width: 100%;
            justify-content: center;
          }
          
          .dashboard .page-title p {
            font-size: 0.7rem;
          }
          
          .grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem;
          }
          
          .grid-2 {
            grid-template-columns: 1fr !important;
            gap: 0.75rem;
          }
          
          /* Finanzas mobile */
          .finanzas-section {
            padding: 1rem;
          }
          
          .finanzas-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .finanza-card {
            padding: 0.875rem;
          }
          
          .finanza-periodo {
            margin-bottom: 0.625rem;
          }
          
          .finanza-rows {
            gap: 0.5rem;
          }
          
          .finanza-row {
            padding: 0.4rem 0.5rem;
          }
          
          .finanza-label {
            font-size: 0.75rem;
          }
          
          .finanza-value {
            font-size: 0.85rem;
          }
          
          .finanza-value.large {
            font-size: 1rem;
          }
          
          .stat-card {
            padding: 0.75rem;
          }
          
          .stat-icon {
            width: 36px;
            height: 36px;
          }
          
          .stat-icon svg {
            width: 18px;
            height: 18px;
          }
          
          .stat-label {
            font-size: 0.65rem;
          }
          
          .stat-value {
            font-size: 1.1rem;
          }
          
          .alert {
            padding: 0.75rem;
            font-size: 0.8rem;
          }
          
          .alert span {
            font-size: 0.75rem;
          }
          
          .card-header {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .card-title {
            font-size: 0.9rem;
          }
          
          .pedido-item, .entrega-item {
            padding: 0.6rem;
          }
          
          .pedido-numero, .entrega-numero {
            font-size: 0.8rem;
          }
          
          .pedido-cliente, .entrega-cliente {
            font-size: 0.7rem;
          }
          
          .entrega-dia {
            font-size: 1rem;
          }
          
          .entrega-total {
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 430px) {
          .finanzas-header {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
          }
          
          .finanzas-header .btn {
            align-self: flex-end;
          }
          
          .finanza-card {
            padding: 0.75rem;
          }
          
          .finanza-row {
            padding: 0.35rem 0.4rem;
          }
          
          .finanza-label {
            font-size: 0.7rem;
            gap: 0.25rem;
          }
          
          .finanza-label svg {
            width: 12px;
            height: 12px;
          }
          
          .finanza-value {
            font-size: 0.8rem;
          }
          
          .finanza-value.large {
            font-size: 0.95rem;
          }
        }
        
        @media (max-width: 400px) {
          .stat-card {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
          }
          
          .stat-content {
            text-align: center;
          }
        }
        
        /* iPhone Pro Max specific */
        @media (max-width: 430px) {
          .dashboard { padding: 0; }
          
          .grid-4 {
            grid-template-columns: 1fr !important;
            gap: 0.625rem;
          }
          
          .stat-card {
            flex-direction: row;
            text-align: left;
            gap: 1rem;
            padding: 1rem;
          }
          
          .stat-content {
            text-align: left;
          }
          
          .stat-icon {
            width: 44px;
            height: 44px;
          }
          
          .stat-icon svg {
            width: 20px;
            height: 20px;
          }
          
          .stat-label {
            font-size: 0.75rem;
          }
          
          .stat-value {
            font-size: 1.35rem;
          }
          
          .alert {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .alert span {
            flex: 1;
            min-width: 100%;
          }
          
          .chart-container {
            height: 200px !important;
          }
          
          .card-title {
            font-size: 0.9rem;
          }
          
          .pedido-item, .entrega-item {
            padding: 0.75rem;
          }
          
          .pedido-badge, .entrega-badge {
            font-size: 0.6rem;
            padding: 0.2rem 0.5rem;
          }
          
          .ranking-item, .cliente-top-card {
            padding: 0.625rem;
          }
          
          .ranking-name, .cliente-top-nombre {
            font-size: 0.85rem;
          }
        }

        /* Estadísticas Avanzadas */
        .section-header {
          margin-top: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .ranking-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .ranking-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }

        .ranking-position {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .ranking-info {
          flex: 1;
        }

        .ranking-name {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .ranking-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .ranking-value {
          font-weight: 600;
          color: var(--success);
        }

        .clientes-top-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cliente-top-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }

        .cliente-top-rank {
          font-weight: 700;
          font-size: 0.75rem;
          color: var(--text-muted);
          width: 24px;
        }

        .cliente-top-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1rem;
        }

        .cliente-top-info {
          flex: 1;
        }

        .cliente-top-nombre {
          font-weight: 500;
        }

        .cliente-top-stats {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .resumen-stats {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .resumen-stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .resumen-stat:last-child {
          border-bottom: none;
        }

        .resumen-stat-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .resumen-stat-value {
          font-weight: 700;
          font-size: 1.1rem;
        }

        .resumen-stat-value.success {
          color: var(--success);
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .grid-3 {
            grid-template-columns: 1fr !important;
          }
          .grid-3 .card[style*="span 2"] {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
