

// Type pour l'état de navigation (utilisé par React Router)
export interface LocationState {
    from?: Location;
    error?: string;
}

// Interface pour le résultat de validation
export interface ValidationResult {
  message: string | null;
}

// Interface pour les valeurs des champs de formulaire
export interface FormFieldValue {
  value: string | null;
}

// Import de Zod pour la validation
import { z } from 'zod';


export const loginFormSchema = z.object({
    // Validation de l'email
    email: z
        .string()
        .min(1, 'L\'email est requis')
        .max(254, 'L\'email est trop long (maximum 254 caractères)')
        .email('Format d\'email invalide')
        .refine((email) => !email.includes('--') && !email.includes(';') && !email.includes('/*'), {
            message: 'L\'email contient des caractères non autorisés'
        }),
    
    // Validation du mot de passe
    password: z
        .string()
        .min(1, 'Le mot de passe est requis')
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
        .max(100, 'Le mot de passe est trop long (maximum 100 caractères)')
        .refine((password) => !password.includes('--') && !password.includes(';') && !password.includes('/*'), {
            message: 'Le mot de passe contient des caractères non autorisés'
        })
});

// Type TypeScript inféré à partir du schéma Zod
// Ce type représente la structure des données du formulaire après validation
export type LoginFormData = z.infer<typeof loginFormSchema>; 