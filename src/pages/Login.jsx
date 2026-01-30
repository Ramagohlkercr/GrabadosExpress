// Login Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading: authLoading } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'var(--bg-primary)'
            }}>
                <Loader2 size={32} className="spin" />
            </div>
        );
    }

    // Don't render login form if authenticated
    if (isAuthenticated) {
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await login(formData.email, formData.password);
            toast.success('¡Bienvenido!');
            navigate('/', { replace: true });
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
                    <div className="login-brand">
                        <div className="login-logo-icon">
                            <Zap size={28} />
                        </div>
                        <div className="login-logo-text">
                            Grabados<span>Express</span>
                        </div>
                    </div>
                    <p className="login-subtitle">
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
                    <div className="login-users-hint">
                        <span className="hint-label">Usuarios autorizados</span>
                        <div className="hint-emails">
                            <code>ramiro@grabadosexpress.com</code>
                            <code>rocio@grabadosexpress.com</code>
                        </div>
                    </div>
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
                    max-width: 380px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 2.5rem 2rem;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .login-brand {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                .login-logo-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark, #e67e00));
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .login-logo-text {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .login-logo-text span {
                    color: var(--primary);
                }

                .login-subtitle {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    margin: 0;
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

                .login-btn {
                    width: 100%;
                    justify-content: center;
                    margin-top: 0.5rem;
                }

                .login-footer {
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--border-color);
                }

                .login-users-hint {
                    text-align: center;
                }

                .hint-label {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.75rem;
                }

                .hint-emails {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .hint-emails code {
                    display: block;
                    background: var(--bg-secondary);
                    padding: 0.5rem 0.75rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    font-family: inherit;
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
