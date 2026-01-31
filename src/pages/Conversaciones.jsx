import { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    Send,
    Search,
    User,
    Clock,
    Bot,
    Phone,
    MoreVertical,
    Trash2,
    UserPlus,
    X,
    CheckCheck,
    Check,
    AlertCircle,
    Loader2,
    MessageCircle,
    Zap,
    Settings
} from 'lucide-react';
import { conversacionesApi } from '../lib/whatsappApi';
import { getClientesAsync } from '../lib/storageApi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Conversaciones() {
    const [conversaciones, setConversaciones] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [stats, setStats] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [showLinkClient, setShowLinkClient] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function loadData() {
        try {
            const [convData, statsData, clientesData] = await Promise.all([
                conversacionesApi.getAll(),
                conversacionesApi.getStats(),
                getClientesAsync()
            ]);
            setConversaciones(convData.conversaciones || []);
            setStats(statsData);
            setClientes(clientesData || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function selectConversation(conv) {
        setSelectedConv(conv);
        setLoadingMessages(true);
        try {
            const fullConv = await conversacionesApi.getById(conv.id);
            setMessages(fullConv.mensajes || []);
            // Update local state to reflect read messages
            setConversaciones(prev => 
                prev.map(c => c.id === conv.id ? { ...c, mensajes_sin_leer: 0 } : c)
            );
        } catch (error) {
            toast.error('Error al cargar mensajes');
        } finally {
            setLoadingMessages(false);
        }
    }

    async function handleSendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConv) return;

        setSending(true);
        try {
            const result = await conversacionesApi.sendMessage(selectedConv.id, newMessage);
            setMessages(prev => [...prev, result.mensaje]);
            setNewMessage('');
            toast.success('Mensaje enviado');
        } catch (error) {
            toast.error('Error al enviar mensaje');
        } finally {
            setSending(false);
        }
    }

    async function handleLinkClient(clienteId) {
        if (!selectedConv) return;
        try {
            await conversacionesApi.update(selectedConv.id, { clienteId });
            toast.success('Cliente vinculado');
            setShowLinkClient(false);
            loadData();
        } catch (error) {
            toast.error('Error al vincular cliente');
        }
    }

    async function handleDeleteConversation(id) {
        if (!confirm('¿Eliminar esta conversación?')) return;
        try {
            await conversacionesApi.delete(id);
            toast.success('Conversación eliminada');
            if (selectedConv?.id === id) {
                setSelectedConv(null);
                setMessages([]);
            }
            loadData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    }

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    function formatTime(date) {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return d.toLocaleDateString('es-AR', { weekday: 'short' });
        }
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    }

    const filteredConversaciones = conversaciones.filter(c => 
        c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefono?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="conversaciones-page loading-state">
                <Loader2 className="spinner" size={32} />
                <p>Cargando conversaciones...</p>
            </div>
        );
    }

    return (
        <div className="conversaciones-page">
            {/* Stats Header */}
            <div className="conv-header">
                <div className="conv-title">
                    <MessageSquare size={24} />
                    <div>
                        <h1>Conversaciones WhatsApp</h1>
                        <p className="text-muted">Chat en vivo con IA integrada</p>
                    </div>
                </div>
                <div className="conv-stats">
                    {stats && (
                        <>
                            <div className="stat-pill">
                                <MessageCircle size={14} />
                                {stats.conversaciones_activas || 0} activas
                            </div>
                            <div className="stat-pill warning">
                                <AlertCircle size={14} />
                                {stats.mensajes_sin_leer || 0} sin leer
                            </div>
                            <div className="stat-pill success">
                                <Zap size={14} />
                                {stats.ia_respuestas_24h || 0} IA hoy
                            </div>
                        </>
                    )}
                    <Link to="/configuracion" className="btn btn-ghost btn-sm">
                        <Settings size={16} />
                    </Link>
                </div>
            </div>

            <div className="conv-container">
                {/* Conversations List */}
                <div className="conv-list">
                    <div className="conv-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar conversación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="conv-items">
                        {filteredConversaciones.length === 0 ? (
                            <div className="conv-empty">
                                <MessageSquare size={48} />
                                <p>No hay conversaciones</p>
                                <span>Los mensajes de WhatsApp aparecerán aquí</span>
                            </div>
                        ) : (
                            filteredConversaciones.map(conv => (
                                <div
                                    key={conv.id}
                                    className={`conv-item ${selectedConv?.id === conv.id ? 'active' : ''} ${conv.mensajes_sin_leer > 0 ? 'unread' : ''}`}
                                    onClick={() => selectConversation(conv)}
                                >
                                    <div className="conv-avatar">
                                        {conv.cliente_nombre ? (
                                            <span>{conv.cliente_nombre.charAt(0).toUpperCase()}</span>
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div className="conv-info">
                                        <div className="conv-name">
                                            {conv.nombre || conv.telefono}
                                            {conv.cliente_id && <span className="linked-badge">Cliente</span>}
                                        </div>
                                        <div className="conv-preview">
                                            {conv.ultimo_mensaje_texto?.substring(0, 40) || 'Sin mensajes'}
                                            {conv.ultimo_mensaje_texto?.length > 40 ? '...' : ''}
                                        </div>
                                    </div>
                                    <div className="conv-meta">
                                        <span className="conv-time">{formatTime(conv.ultimo_mensaje)}</span>
                                        {conv.mensajes_sin_leer > 0 && (
                                            <span className="unread-badge">{conv.mensajes_sin_leer}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="conv-chat">
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="chat-header">
                                <div className="chat-contact">
                                    <div className="contact-avatar">
                                        {selectedConv.cliente_nombre?.charAt(0) || <User size={20} />}
                                    </div>
                                    <div className="contact-info">
                                        <div className="contact-name">{selectedConv.nombre || selectedConv.telefono}</div>
                                        <div className="contact-phone">
                                            <Phone size={12} />
                                            {selectedConv.telefono}
                                        </div>
                                    </div>
                                </div>
                                <div className="chat-actions">
                                    {!selectedConv.cliente_id && (
                                        <button 
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setShowLinkClient(true)}
                                            title="Vincular cliente"
                                        >
                                            <UserPlus size={18} />
                                        </button>
                                    )}
                                    <button 
                                        className="btn btn-ghost btn-sm danger"
                                        onClick={() => handleDeleteConversation(selectedConv.id)}
                                        title="Eliminar conversación"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="chat-messages">
                                {loadingMessages ? (
                                    <div className="loading-messages">
                                        <Loader2 className="spinner" size={24} />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="no-messages">
                                        <MessageSquare size={48} />
                                        <p>No hay mensajes aún</p>
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <div 
                                            key={msg.id} 
                                            className={`message ${msg.direccion === 'saliente' ? 'outgoing' : 'incoming'}`}
                                        >
                                            <div className="message-bubble">
                                                {msg.es_automatico && (
                                                    <div className="ai-indicator">
                                                        <Bot size={12} />
                                                        IA
                                                    </div>
                                                )}
                                                <div className="message-content">{msg.contenido}</div>
                                                <div className="message-meta">
                                                    <span className="message-time">
                                                        {new Date(msg.created_at).toLocaleTimeString('es-AR', { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </span>
                                                    {msg.direccion === 'saliente' && (
                                                        <span className="message-status">
                                                            {msg.estado === 'leido' ? <CheckCheck size={14} /> :
                                                             msg.estado === 'entregado' ? <CheckCheck size={14} /> :
                                                             <Check size={14} />}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form className="chat-input" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    placeholder="Escribe un mensaje..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={sending}
                                />
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={!newMessage.trim() || sending}
                                >
                                    {sending ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <MessageSquare size={64} />
                            <h3>Selecciona una conversación</h3>
                            <p>Elige una conversación de la lista para ver los mensajes</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Link Client Modal */}
            {showLinkClient && (
                <div className="modal-overlay" onClick={() => setShowLinkClient(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Vincular Cliente</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowLinkClient(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="text-muted mb-3">Selecciona un cliente existente para vincular:</p>
                            <div className="client-list">
                                {clientes.map(cliente => (
                                    <div 
                                        key={cliente.id} 
                                        className="client-option"
                                        onClick={() => handleLinkClient(cliente.id)}
                                    >
                                        <User size={16} />
                                        <span>{cliente.nombre}</span>
                                        <span className="text-muted">{cliente.telefono}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .conversaciones-page {
                    height: calc(100vh - 80px);
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-primary);
                }

                .conversaciones-page.loading-state {
                    justify-content: center;
                    align-items: center;
                    gap: 1rem;
                    color: var(--text-muted);
                }

                .conv-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid var(--border-color);
                    background: var(--bg-secondary);
                }

                .conv-title {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .conv-title h1 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                }

                .conv-title p {
                    margin: 0;
                    font-size: 0.85rem;
                }

                .conv-stats {
                    display: flex;
                    gap: 0.75rem;
                    align-items: center;
                }

                .stat-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.4rem 0.75rem;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-full);
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .stat-pill.warning {
                    background: rgba(245, 158, 11, 0.1);
                    border-color: rgba(245, 158, 11, 0.3);
                    color: var(--warning);
                }

                .stat-pill.success {
                    background: rgba(34, 197, 94, 0.1);
                    border-color: rgba(34, 197, 94, 0.3);
                    color: var(--success);
                }

                .conv-container {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }

                /* Conversations List */
                .conv-list {
                    width: 360px;
                    border-right: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-secondary);
                }

                .conv-search {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .conv-search input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                }

                .conv-search input:focus {
                    outline: none;
                }

                .conv-items {
                    flex: 1;
                    overflow-y: auto;
                }

                .conv-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem 1.5rem;
                    text-align: center;
                    color: var(--text-muted);
                }

                .conv-empty svg {
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .conv-item {
                    display: flex;
                    align-items: center;
                    gap: 0.875rem;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    border-bottom: 1px solid var(--border-color);
                }

                .conv-item:hover {
                    background: var(--bg-hover);
                }

                .conv-item.active {
                    background: var(--bg-tertiary);
                    border-left: 3px solid var(--accent);
                }

                .conv-item.unread {
                    background: rgba(245, 158, 11, 0.05);
                }

                .conv-avatar {
                    width: 48px;
                    height: 48px;
                    background: var(--accent-gradient);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #000;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .conv-info {
                    flex: 1;
                    min-width: 0;
                }

                .conv-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .linked-badge {
                    font-size: 0.65rem;
                    padding: 0.15rem 0.4rem;
                    background: var(--success);
                    color: white;
                    border-radius: var(--radius-sm);
                    font-weight: 500;
                }

                .conv-preview {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .conv-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.25rem;
                }

                .conv-time {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                }

                .unread-badge {
                    min-width: 20px;
                    height: 20px;
                    padding: 0 6px;
                    background: var(--accent);
                    color: #000;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Chat Area */
                .conv-chat {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-primary);
                }

                .no-chat-selected {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    gap: 1rem;
                }

                .no-chat-selected svg {
                    opacity: 0.3;
                }

                .chat-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border-color);
                }

                .chat-contact {
                    display: flex;
                    align-items: center;
                    gap: 0.875rem;
                }

                .contact-avatar {
                    width: 44px;
                    height: 44px;
                    background: var(--accent-gradient);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #000;
                    font-weight: 700;
                }

                .contact-name {
                    font-weight: 600;
                }

                .contact-phone {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }

                .chat-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .chat-actions .danger:hover {
                    color: var(--danger);
                }

                /* Messages */
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .loading-messages,
                .no-messages {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    gap: 0.75rem;
                }

                .message {
                    display: flex;
                    max-width: 70%;
                }

                .message.incoming {
                    align-self: flex-start;
                }

                .message.outgoing {
                    align-self: flex-end;
                }

                .message-bubble {
                    padding: 0.75rem 1rem;
                    border-radius: var(--radius-lg);
                    position: relative;
                }

                .message.incoming .message-bubble {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-bottom-left-radius: 4px;
                }

                .message.outgoing .message-bubble {
                    background: linear-gradient(135deg, var(--accent), #d97706);
                    color: #000;
                    border-bottom-right-radius: 4px;
                }

                .ai-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.65rem;
                    font-weight: 600;
                    padding: 0.15rem 0.4rem;
                    background: rgba(139, 92, 246, 0.2);
                    color: #a78bfa;
                    border-radius: var(--radius-sm);
                    margin-bottom: 0.35rem;
                }

                .message.outgoing .ai-indicator {
                    background: rgba(0, 0, 0, 0.15);
                    color: rgba(0, 0, 0, 0.7);
                }

                .message-content {
                    font-size: 0.9rem;
                    line-height: 1.4;
                    white-space: pre-wrap;
                }

                .message-meta {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 0.35rem;
                    margin-top: 0.35rem;
                }

                .message-time {
                    font-size: 0.65rem;
                    opacity: 0.7;
                }

                .message-status {
                    display: flex;
                }

                .message-status svg {
                    opacity: 0.7;
                }

                /* Chat Input */
                .chat-input {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    background: var(--bg-secondary);
                    border-top: 1px solid var(--border-color);
                }

                .chat-input input {
                    flex: 1;
                    padding: 0.875rem 1rem;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    color: var(--text-primary);
                    font-size: 0.9rem;
                }

                .chat-input input:focus {
                    outline: none;
                    border-color: var(--accent);
                }

                /* Client List Modal */
                .client-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .client-option {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem;
                    cursor: pointer;
                    border-radius: var(--radius-md);
                    transition: all var(--transition-fast);
                }

                .client-option:hover {
                    background: var(--bg-hover);
                }

                /* Spinner */
                .spinner {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .conv-container {
                        flex-direction: column;
                    }

                    .conv-list {
                        width: 100%;
                        height: 45%;
                        border-right: none;
                        border-bottom: 1px solid var(--border-color);
                    }

                    .conv-chat {
                        height: 55%;
                    }

                    .conv-header {
                        padding: 1rem;
                        flex-wrap: wrap;
                        gap: 0.75rem;
                    }

                    .conv-stats {
                        flex-wrap: wrap;
                    }

                    .message {
                        max-width: 85%;
                    }
                }

                @media (max-width: 430px) {
                    .conv-header {
                        padding: 0.875rem;
                    }

                    .conv-title h1 {
                        font-size: 1.1rem;
                    }

                    .stat-pill {
                        padding: 0.3rem 0.5rem;
                        font-size: 0.7rem;
                    }

                    .conv-item {
                        padding: 0.75rem;
                    }

                    .conv-avatar {
                        width: 42px;
                        height: 42px;
                    }

                    .chat-input {
                        padding: 0.75rem;
                    }

                    .chat-messages {
                        padding: 1rem;
                    }
                }
            `}</style>
        </div>
    );
}
