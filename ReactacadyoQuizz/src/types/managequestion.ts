


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


export interface AddQuestionFormData {
    text: string;
    answers: Array<{
        text: string;
        correct: boolean;
    }>;
} 