// Types pour la page d'inscription - SIMPLIFIÉS

// Interface pour les données utilisateur envoyées à l'API
export interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

// Interface pour la réponse d'inscription réussie du backend
export interface RegistrationSuccessResponse {
    id: number;
    email: string;
    roles: string[];
    firstName?: string;
    lastName?: string;
    jwtToken?: string;
}

// Interface pour les violations de validation du backend
export interface ValidationViolation {
    propertyPath: string;
    message: string;
    code?: string;
}

// Interface pour les erreurs API
export interface ApiErrorResponse {
    message?: string;
    violations?: ValidationViolation[];
    error?: string;
    detail?: string;
} 