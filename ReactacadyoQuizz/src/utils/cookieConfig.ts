// Configuration centralisée des cookies sécurisés
export const COOKIE_OPTIONS = {
    secure: true,        // Cookie uniquement en HTTPS
    sameSite: 'strict' as const,  // Protection CSRF
    expires: 7,          // Expire dans 7 jours
    path: '/'            // Accessible sur tout le site
};

// Options pour supprimer les cookies
export const COOKIE_REMOVE_OPTIONS = {
    path: '/'
};

// Noms des cookies utilisés dans l'application
export const COOKIE_NAMES = {
    JWT_TOKEN: 'jwt_token',
    AUTH_USER: 'auth-user'
} as const; 