// Import de Zod pour la validation
import { z } from 'zod';

// Type pour le formulaire de quiz
export interface QuizForm {
    title: string;
    description: string;
}

// Type pour les données envoyées à l'API
export interface QuizCreateData {
    titre: string;
    description: string;
    estActif: boolean;
    estDemarre: boolean;
    scorePassage: number;
}

// Type pour la réponse de création de quiz
export interface QuizCreateResponse {
    id: number;
    titre: string;
    description: string;
    uniqueCode: string;
    estActif: boolean;
    estDemarre: boolean;
    scorePassage: number;
    createdAt?: string;
}

// Type pour les erreurs de l'API
export interface QuizCreateError {
    message?: string;
    violations?: Array<{
        propertyPath: string;
        message: string;
    }>;
    detail?: string;
}

// Schéma de validation Zod pour le formulaire de création de quiz
// Ce schéma définit les règles de validation pour le titre et la description
export const createQuizFormSchema = z.object({
    // Validation du titre
    title: z
        .string()
        .min(1, 'Le titre est obligatoire')
        .min(3, 'Le titre doit avoir au moins 3 caractères')
        .max(100, 'Le titre ne peut pas dépasser 100 caractères')
        .refine((title) => !title.includes('--') && !title.includes(';') && !title.includes('/*'), {
            message: 'Le titre contient des caractères non autorisés'
        }),
    
    // Validation de la description
    description: z
        .string()
        .min(1, 'La description est obligatoire')
        .max(500, 'La description ne peut pas dépasser 500 caractères')
});

// Type TypeScript inféré à partir du schéma Zod
// Ce type représente la structure des données du formulaire après validation
export type CreateQuizFormData = z.infer<typeof createQuizFormSchema>;