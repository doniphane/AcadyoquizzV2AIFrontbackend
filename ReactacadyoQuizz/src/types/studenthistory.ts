// Interface pour les informations utilisateur
export interface StudentUser {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
}

// Interface pour une tentative - correspond aux vrais champs de l'API Symfony
export interface TransformedAttempt {
    id: number;
    prenomParticipant: string; // Correspond au champ 'prenomParticipant' de l'API Symfony
    nomParticipant: string; // Correspond au champ 'nomParticipant' de l'API Symfony
    dateDebut: string; // Correspond au champ 'dateDebut' de l'API Symfony
    dateFin?: string; // Correspond au champ 'dateFin' de l'API Symfony
    score?: number; // Correspond au champ 'score' de l'API Symfony
    nombreTotalQuestions?: number; // Correspond au champ 'nombreTotalQuestions' de l'API Symfony
    questionnaire: string; // Correspond au champ 'questionnaire' de l'API Symfony
    utilisateur?: string; // Correspond au champ 'utilisateur' de l'API Symfony
    // Champs calculés pour l'affichage
    quizTitle?: string;
    quizCode?: string;
    date?: string;
    time?: string;
    percentage?: number;
    isPassed?: boolean;
}

// Interface pour les détails d'une réponse
export interface AttemptDetail {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

// Interface pour une réponse utilisateur - correspond aux vrais champs de l'API Symfony
export interface UserAnswer {
    question: string; // Correspond au champ 'question' de l'API Symfony
    reponse: string; // Correspond au champ 'reponse' de l'API Symfony
    tentativeQuestionnaire: string; // Correspond au champ 'tentativeQuestionnaire' de l'API Symfony
}

// Interface pour une question - correspond aux vrais champs de l'API Symfony
export interface Question {
    id: number;
    texte: string; // Correspond au champ 'texte' de l'API Symfony
    numeroOrdre: number; // Correspond au champ 'numeroOrdre' de l'API Symfony
    questionnaire: string; // Correspond au champ 'questionnaire' de l'API Symfony
}

// Interface pour une réponse - correspond aux vrais champs de l'API Symfony
export interface Answer {
    id: number;
    texte: string; // Correspond au champ 'texte' de l'API Symfony
    numeroOrdre: number; // Correspond au champ 'numeroOrdre' de l'API Symfony
    correct: boolean; // Correspond au champ 'correct' de l'API Symfony
    question: string; // Correspond au champ 'question' de l'API Symfony
}

// Interface pour un questionnaire - correspond aux vrais champs de l'API Symfony
export interface Questionnaire {
    id: number;
    title: string; // Correspond au champ 'title' de l'API Symfony
    accessCode: string; // Correspond au champ 'accessCode' de l'API Symfony
    scorePassage?: number; // Correspond au champ 'scorePassage' de l'API Symfony
} 