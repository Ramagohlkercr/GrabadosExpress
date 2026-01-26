// Authentication Context for React
import { createContext, useContext, useState, useEffect } from 'react';

// Default Admin User
const DEFAULT_USER = {
    id: '1',
    nombre: 'Admin',
    email: 'admin@grabadosexpress.com',
    role: 'admin'
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(DEFAULT_USER);
    // We keep token state but it's not strictly enforced for navigation anymore
    // If backend requires it, we might need to handle that, but for now we assume open access or existing token
    const [token, setToken] = useState(localStorage.getItem('grabados_auth_token'));
    const [loading, setLoading] = useState(false);

    // Provide simplified auth methods that don't actually lock the user out

    async function login(email, password) {
        // Mock login
        console.log('Login bypassed');
        return { user: DEFAULT_USER, token: 'mock-token' };
    }

    async function register(nombre, email, password) {
        // Mock register
        console.log('Register bypassed');
        return { user: DEFAULT_USER, token: 'mock-token' };
    }

    function logout() {
        console.log('Logout disabled');
        // Do nothing or maybe show a message that login is disabled
    }

    // Headers for API calls - try to send token if we have one, otherwise empty
    // If backend middleware is strict, you might need to disable it there too
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
        isAuthenticated: true, // Always authenticated
        login,
        register,
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
