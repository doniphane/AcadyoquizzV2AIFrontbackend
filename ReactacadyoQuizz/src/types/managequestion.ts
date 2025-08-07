
// Import de Zod pour la validation
import { z } from 'zod';

// Type pour une réponse
export interface Answer {
    id?: number;
    text: string;
    correct: boolean;
}

// Type pour une question
export interface Question {
    id?: number;
    text: string;
    answers: Answer[];
}

// Type pour un quiz avec questions
export interface QuizWithQuestions {
    id: number;
    title: string;
    description?: string;
    uniqueCode: string;
    isActive: boolean;
    isStarted: boolean;
    passingScore: number;
    questions: Question[];
}

// Type pour une nouvelle question en cours de création
export interface NewQuestion {
    text: string;
    answers: Array<{
        text: string;
        correct: boolean;
    }>;
}

// Type pour les données d'une question à envoyer à l'API
export interface ApiQuestion {
    id?: number;
    texte: string;
    numeroOrdre: number;
    questionnaire: string;
    reponses: ApiAnswer[];
}

// Type pour une réponse API
export interface ApiAnswer {
    id?: number;
    texte: string;
    estCorrecte: boolean;
    numeroOrdre: number;
}

// Type pour les vraies données reçues de l'API
export interface ApiQuestionData {
    id: number;
    texte: string;
    numeroOrdre: number;
    reponses: ApiAnswerData[];
}

// Type pour les données de réponse de l'API
export interface ApiAnswerData {
    id: number;
    texte: string;
    numeroOrdre: number;
    correct: boolean;
}

// Type pour les erreurs de l'API
export interface ApiError {
    message?: string;
    violations?: Array<{
        propertyPath: string;
        message: string;
    }>;
    detail?: string;
}


export const addQuestionFormSchema = z.object({
    // Validation du texte de la question
    text: z
        .string()
        .min(1, 'Le texte de la question est obligatoire')
        .min(10, 'La question doit avoir au moins 10 caractères')
        .max(500, 'La question ne peut pas dépasser 500 caractères')
        .refine((text) => !text.includes('--') && !text.includes(';') && !text.includes('/*'), {
            message: 'La question contient des caractères non autorisés'
        }),
    
    // Validation des réponses
    answers: z
        .array(z.object({
            text: z
                .string()
                .min(1, 'Le texte de la réponse est obligatoire')
                .max(200, 'La réponse ne peut pas dépasser 200 caractères')
                .refine((text) => !text.includes('--') && !text.includes(';') && !text.includes('/*'), {
                    message: 'La réponse contient des caractères non autorisés'
                }),
            correct: z.boolean()
        }))
        .min(2, 'Il faut au moins 2 réponses')
        .max(6, 'Il ne peut pas y avoir plus de 6 réponses')
        .refine((answers) => answers.some(answer => answer.correct), {
            message: 'Il faut au moins une réponse correcte'
        })
});

// Type TypeScript inféré à partir du schéma Zod
// Ce type représente la structure des données du formulaire après validation
export type AddQuestionFormData = z.infer<typeof addQuestionFormSchema>; 