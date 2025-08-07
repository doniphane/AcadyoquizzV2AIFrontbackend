

// Type pour un étudiant
export interface Student {
    id: number;
    name: string;
    email: string;
    date: string;
    score: number;
    totalQuestions: number;
    percentage: number;
}

// Type pour les détails d'une réponse
export interface AnswerDetail {
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

// Type pour les métriques
export interface Metrics {
    totalStudents: number;
    averageScore: number;
    bestScore: number;
    lowestScore: number;
    successRate: number;
}

// Type pour une tentative de quiz - correspond aux vrais champs de l'API Symfony
export interface QuizAttempt {
    id: number;
    questionnaire: string; // Correspond au champ 'questionnaire' de l'API Symfony
    prenomParticipant: string; // Correspond au champ 'prenomParticipant' de l'API Symfony
    nomParticipant: string; // Correspond au champ 'nomParticipant' de l'API Symfony
    dateDebut: string; // Correspond au champ 'dateDebut' de l'API Symfony
    score?: number; // Correspond au champ 'score' de l'API Symfony
    nombreTotalQuestions?: number; // Correspond au champ 'nombreTotalQuestions' de l'API Symfony
}

// Type pour une question de quiz - correspond aux vrais champs de l'API Symfony
export interface QuizQuestion {
    id: number;
    texte: string; // Correspond au champ 'texte' de l'API Symfony
    numeroOrdre: number; // Correspond au champ 'numeroOrdre' de l'API Symfony
    questionnaire: string; // Correspond au champ 'questionnaire' de l'API Symfony
}

// Type pour une réponse de quiz - correspond aux vrais champs de l'API Symfony
export interface QuizAnswer {
    id: number;
    texte: string; // Correspond au champ 'texte' de l'API Symfony
    numeroOrdre: number; // Correspond au champ 'numeroOrdre' de l'API Symfony
    correct: boolean; // Correspond au champ 'correct' de l'API Symfony
    question: string; // Correspond au champ 'question' de l'API Symfony
}

// Type pour une réponse utilisateur - correspond aux vrais champs de l'API Symfony
export interface UserAnswer {
    question: string; // Correspond au champ 'question' de l'API Symfony
    reponse: string; // Correspond au champ 'reponse' de l'API Symfony
    tentativeQuestionnaire: string; // Correspond au champ 'tentativeQuestionnaire' de l'API Symfony
}

// Type pour les données de navigation
export interface QuizResultsNavigationState {
    quizId: string;
    quizTitle: string;
    quizCode: string;
}

// Type pour les erreurs de l'API des résultats de quiz
export interface QuizResultsApiError {
    message?: string;
    detail?: string;
    violations?: Array<{
        propertyPath: string;
        message: string;
    }>;
} 