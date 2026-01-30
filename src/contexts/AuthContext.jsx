// Authentication Context for React
import { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('grabados_auth_token'));
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('grabados_auth_token');
        const savedUser = localStorage.getItem('grabados_auth_user');
        
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    async function login(email, password) {
        const url = `${API_BASE_URL}/auth?action=login`;
        console.log('Login attempt to:', url);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'same-origin'
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            // Save to state and localStorage
            setUser(data.user);
            setToken(data.token);
            localStorage.setItem('grabados_auth_token', data.token);
            localStorage.setItem('grabados_auth_user', JSON.stringify(data.user));

            return data;
        } catch (error) {
            console.error('Login error:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            // Provide more specific error messages
            if (error.name === 'TypeError' && error.message.includes('Load failed')) {
                throw new Error('Error de conexión. Verificá tu internet.');
            }
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('No se pudo conectar al servidor. Intentá de nuevo.');
            }
            throw error;
        }
    }

    function logout() {
        setUser(null);
        setToken(null);
        localStorage.removeItem('grabados_auth_token');
        localStorage.removeItem('grabados_auth_user');
    }

    function getAuthHeaders() {
        if (token) {
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
        }
        return {
            'Content-Type': 'application/json'
        };
    }

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        getAuthHeaders
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
