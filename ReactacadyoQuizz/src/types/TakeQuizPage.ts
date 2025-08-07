
// Interface pour les données du participant
export interface ParticipantData {
    firstName: string;
    lastName: string;
    quizCode: string;
}

// Interface pour les informations du quiz
export interface QuizInfo {
    id: number;
    titre: string; // Correspond au champ 'titre' de l'API Symfony
    description?: string;
    estActif: boolean; // Correspond au champ 'estActif' de l'API Symfony
    estDemarre: boolean; // Correspond au champ 'estDemarre' de l'API Symfony
    codeAcces: string; // Correspond au champ 'codeAcces' de l'API Symfony
    scorePassage?: number; // Correspond au champ 'scorePassage' de l'API Symfony
}

// Interface pour une réponse
export interface Answer {
    id: number;
    text: string;
    orderNumber: number;
    isCorrect: boolean;
}

// Interface pour une question
export interface Question {
    id: number;
    text: string;
    orderNumber: number;
    answers: Answer[];
}

// Interface pour les données complètes du quiz
export interface QuizData {
    id: number;
    titre: string; // Correspond au champ 'titre' de l'API Symfony
    description?: string;
    questions: Array<{
        id: number;
        texte: string; // Correspond au champ 'texte' de l'API Symfony
        numeroOrdre: number; // Correspond au champ 'numeroOrdre' de l'API Symfony
        reponses: Array<{
            id: number;
            texte: string; // Correspond au champ 'texte' de l'API Symfony
            numeroOrdre: number; // Correspond au champ 'numeroOrdre' de l'API Symfony
            estCorrecte: boolean; // Correspond au champ 'estCorrecte' de l'API Symfony
        }>;
    }>;
    estActif: boolean; // Correspond au champ 'estActif' de l'API Symfony
    estDemarre: boolean; // Correspond au champ 'estDemarre' de l'API Symfony
    codeAcces: string; // Correspond au champ 'codeAcces' de l'API Symfony
    scorePassage?: number; // Correspond au champ 'scorePassage' de l'API Symfony
}

// Type pour les réponses utilisateur (questionId -> answerId ou answerIds[])
// Supporte les questions à choix unique (number) et choix multiples (number[])
export type UserAnswers = Record<number, number | number[]>;

// Interface pour l'état de navigation passé depuis la page précédente
export interface LocationState {
    participantData: ParticipantData;
    quizInfo: QuizInfo;
}

// Interface personnalisée pour useLocation avec notre type de state
export interface CustomLocation extends Omit<Location, 'state'> {
    state: LocationState | null;
}

// Interface pour les résultats du quiz
export interface QuizResults {
    score: number;
    totalQuestions: number;
    percentage: number;
    responseDetails?: unknown[];
}

// Types pour les données API brutes
export interface ApiQuestionData {
    id: number;
    texte: string; // Correspond au champ 'texte' de l'API Symfony
    numeroOrdre: number; // Correspond au champ 'numeroOrdre' de l'API Symfony
    reponses: ApiAnswerData[];
}

export interface ApiAnswerData {
    id: number;
    texte: string; // Correspond au champ 'texte' de l'API Symfony
    numeroOrdre: number; // Correspond au champ 'numeroOrdre' de l'API Symfony
    estCorrecte: boolean; // Correspond au champ 'estCorrecte' de l'API Symfony
}

// Type pour les données de soumission
export interface QuizSubmissionData {
    participantFirstName: string;
    participantLastName: string;
    answers: Array<{
        questionId: number;
        answerId: number | number[]; // Supporte les choix uniques et multiples
    }>;
} 