// Type pour les rôles utilisateur
export type UserRole = 'ROLE_ADMIN' | 'ROLE_USER' | 'ROLE_SUPER_ADMIN' | string;

// Interface pour les données utilisateur
export interface User {
    id: number;
    email: string;
    roles: UserRole[];
    prenom?: string;
    nom?: string;
    name?: string; // Pour compatibilité
} 