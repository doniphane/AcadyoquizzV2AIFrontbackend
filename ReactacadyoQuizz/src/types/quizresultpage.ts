import type { Location } from 'react-router-dom';

// Interface pour les informations du quiz - correspond aux vrais champs de l'API Symfony
export interface QuizInfo {
    id: number;
    title: string; // Correspond au champ 'title' de l'API Symfony
    description?: string;
    accessCode: string; // Correspond au champ 'accessCode' de l'API Symfony
    uniqueCode: string; // Correspond au champ 'uniqueCode' de l'API Symfony
    isActive: boolean; // Correspond au champ 'isActive' de l'API Symfony
    isStarted: boolean; // Correspond au champ 'isStarted' de l'API Symfony
    scorePassage?: number; // Correspond au champ 'scorePassage' de l'API Symfony
}

// Type pour les réponses utilisateur (supporte choix unique ET multiples)
export type UserAnswers = Record<number, number | number[]>;

// Interface pour l'état de navigation
export interface QuizResultsLocationState {
    quizInfo: QuizInfo;
    userAnswers: UserAnswers;
    results?: {
        score: number;
        totalQuestions: number;
        percentage: number;
        responseDetails?: Array<{
            questionId: number;
            questionText: string;
            userAnswers: Array<{ id: number; text: string; isCorrect: boolean }>; // Changé en tableau
            correctAnswers: Array<{ id: number; text: string; isCorrect: boolean }>; // Changé en tableau
            isCorrect: boolean;
        }>;
    };
}

// Interface personnalisée pour useLocation
export interface CustomLocation extends Omit<Location, 'state'> {
    state: QuizResultsLocationState | null;
}

// Interface pour une réponse - correspond aux vrais champs de l'API Symfony
export interface QuizAnswer {
    id: number;
    texte: string; // Correspond au champ 'texte' de l'API Symfony
    numeroOrdre: number; // Correspond au champ 'numeroOrdre' de l'API Symfony
    correct: boolean; // Correspond au champ 'correct' de l'API Symfony
}

// Interface pour une question - correspond aux champs de l'API Symfony
export interface QuizQuestion {
    id: number;
    texte: string; // Correspond au champ 'texte' de l'API Symfony
    numeroOrdre: number; // Correspond au champ 'numeroOrdre' de l'API Symfony
    reponses: QuizAnswer[]; // Correspond au champ 'reponses' de l'API Symfony
}

// Interface pour les détails d'une réponse utilisateur (mise à jour)
export interface UserAnswerDetail {
    questionId: number;
    questionText: string;
    userAnswers: QuizAnswer[]; // Changé en tableau pour supporter multiples réponses
    correctAnswers: QuizAnswer[]; // Changé en tableau pour supporter multiples bonnes réponses
    isCorrect: boolean;
    isMultipleChoice: boolean; // Nouveau champ pour identifier le type de question
}

// Interface pour les résultats calculés
export interface CalculatedResults {
    score: number;
    totalQuestions: number;
    percentage: number;
    userAnswers: UserAnswerDetail[];
} 