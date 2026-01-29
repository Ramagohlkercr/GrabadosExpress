// Login Page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // Redirect if already authenticated
    if (isAuthenticated) {
        navigate('/');
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await login(formData.email, formData.password);
            toast.success('¡Bienvenido!');
            navigate('/');
        } catch (error) {
            toast.error(error.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">
                        <h2 style={{ fontSize: '2rem', color: 'var(--primary)' }}>✨ GrabadosExpress</h2>
                    </div>
                    <h1>Iniciar Sesión</h1>
                    <p className="text-muted">
                        Ingresá a tu cuenta para continuar
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">
                            <Mail size={16} />
                            Email
                        </label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Lock size={16} />
                            Contraseña
                        </label>
                        <div className="password-input">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 size={20} className="spin" />
                        ) : (
                            <LogIn size={20} />
                        )}
                        Iniciar Sesión
                    </button>
                </form>

                <div className="login-footer">
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                        <strong>Usuarios autorizados:</strong><br />
                        📧 ramiro@grabadosexpress.com<br />
                        📧 rocio@grabadosexpress.com
                    </p>
                </div>
            </div>

            <style>{`
                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-primary);
                    padding: 1rem;
                }

                .login-container {
                    width: 100%;
                    max-width: 400px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 2rem;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .login-logo {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 1rem;
                }

                .login-logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .login-header h1 {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .login-form .form-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .password-input {
                    position: relative;
                }

                .password-input .form-input {
                    padding-right: 2.5rem;
                }

                .password-toggle {
                    position: absolute;
                    right: 0.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 0.25rem;
                }

                .password-toggle:hover {
                    color: var(--text-primary);
                }

                .form-hint {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    margin-top: 0.25rem;
                }

                .login-btn {
                    width: 100%;
                    justify-content: center;
                    margin-top: 0.5rem;
                }

                .login-footer {
                    text-align: center;
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--border-color);
                }

                .link-btn {
                    background: none;
                    border: none;
                    color: var(--accent);
                    cursor: pointer;
                    font-weight: 500;
                }

                .link-btn:hover {
                    text-decoration: underline;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
