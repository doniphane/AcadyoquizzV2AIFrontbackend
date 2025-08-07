

// Import de Zod pour la validation
import { z } from 'zod';

// Interface pour les données utilisateur envoyées à l'API
export interface UserData {
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


export interface ApiErrorResponse {
    message?: string;
    violations?: ValidationViolation[];
    error?: string;
    detail?: string;
}


export const registerFormSchema = z.object({
    // Validation de l'email
    email: z
        .string()
        .min(1, 'L\'email est requis')
        .max(254, 'L\'email est trop long (maximum 254 caractères)')
        .email('Format d\'email invalide')
        .refine((email) => !email.includes('--') && !email.includes(';') && !email.includes('/*'), {
            message: 'L\'email contient des caractères non autorisés'
        }),
    
    // Validation du mot de passe avec règles plus strictes
    password: z
        .string()
        .min(1, 'Le mot de passe est requis')
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
        .max(100, 'Le mot de passe est trop long (maximum 100 caractères)')
        .refine((password) => !password.includes('--') && !password.includes(';') && !password.includes('/*'), {
            message: 'Le mot de passe contient des caractères non autorisés'
        })
        .refine((password) => /(?=.*[a-zA-Z])(?=.*\d)/.test(password), {
            message: 'Le mot de passe doit contenir au moins une lettre et un chiffre'
        })
});


export type RegisterFormData = z.infer<typeof registerFormSchema>; 