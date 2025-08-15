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

// Type pour les données du formulaire de création de quiz (sans Zod)
export interface CreateQuizFormData {
    title: string;
    description: string;
}