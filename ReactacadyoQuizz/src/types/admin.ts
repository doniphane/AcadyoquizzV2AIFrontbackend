

// Type pour un quiz - correspond aux vrais champs de l'API Symfony
export interface Quiz {
  id: number;
  title: string; // Correspond au champ 'title' de l'API Symfony
  description?: string;
  accessCode: string; // Correspond au champ 'accessCode' de l'API Symfony
  uniqueCode: string; // Correspond au champ 'uniqueCode' de l'API Symfony
  isActive: boolean; // Correspond au champ 'isActive' de l'API Symfony
  isStarted: boolean; // Correspond au champ 'isStarted' de l'API Symfony
  scorePassage?: number;
  createdAt?: string;
}

// Type pour les métriques du dashboard admin
export interface AdminMetrics {
  quizzesCreated: number;
  totalAttempts: number;
  registeredUsers: number;
}

// Type pour la réponse API des quiz
export interface QuizApiResponse {
  member?: Quiz[];
  "hydra:member"?: Quiz[];
}

// Type pour la réponse API des utilisateurs
export interface UserApiResponse {
  member?: unknown[];
  "hydra:member"?: unknown[];
}

// Type pour la réponse API des tentatives
export interface AttemptApiResponse {
  member?: unknown[];
  "hydra:member"?: unknown[];
}

// Type pour les paramètres de navigation vers les résultats
export interface QuizResultsParams {
  quizId: number;
  quizTitle: string;
  quizCode: string;
}

// Type pour les actions de quiz
export type QuizAction = 'toggle' | 'delete' | 'edit' | 'view';

// Type pour l'état de chargement d'un quiz spécifique
export type LoadingQuizId = number | null; 