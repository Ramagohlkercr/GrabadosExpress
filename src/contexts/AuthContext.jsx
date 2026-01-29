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
        try {
            const response = await fetch(`${API_BASE_URL}/auth?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

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
