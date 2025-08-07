// Service pour communiquer avec l'IA via OpenRouter
// Ce service permet de générer des questions et réponses à partir de texte
import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Interface pour les données de réponse de l'IA
interface AIQuestionResponse {
    question: string;
    answers: Array<{
        text: string;
        correct: boolean;
    }>;
}

// Interface pour la réponse complète de l'IA
interface AIGeneratedQuestions {
    questions: AIQuestionResponse[];
    message?: string;
    error?: string;
}

// Configuration pour OpenRouter (géré par le backend)
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

class AIService {
    /**
     * Vérifie si OpenRouter est disponible
     */
    static async checkOpenRouterAvailability(): Promise<boolean> {
        try {
            const response: AxiosResponse = await axios.get('https://openrouter.ai/api/v1/models', {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // Timeout de 10 secondes
            });
            
            return response.status === 200;
        } catch {
            return false;
        }
    }

    /**
     * Génère des questions à partir d'un texte en utilisant le backend Symfony
     */
    static async generateQuestionsFromText(
        text: string, 
        numberOfQuestions: number = 3
    ): Promise<AIGeneratedQuestions> {
        try {
            // 🔹 ÉTAPE 1: Vérification FRONTEND d'abord
            const isOpenRouterAvailable = await this.checkOpenRouterAvailability();
            if (!isOpenRouterAvailable) {
                return {
                    questions: [],
                    error: ' Frontend: OpenRouter est indisponible. Service temporairement hors ligne.'
                };
            }

            // 🔹 ÉTAPE 2: Si frontend OK, vérifier le token
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                return {
                    questions: [],
                    error: ' Frontend: Vous devez être connecté pour utiliser cette fonctionnalité.'
                };
            }

            // 🔹 ÉTAPE 3: Si tout OK côté frontend, appeler le backend
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8000';
            const requestUrl = `${apiBaseUrl}/api/ai/generate-questions`;
            
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: text,
                    numberOfQuestions: numberOfQuestions
                })
            });

            // 🔹 ÉTAPE 4: Traiter la réponse du backend
            if (!response.ok) {
                // Essayer de récupérer le message d'erreur du backend
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        return {
                            questions: [],
                            error: ` Backend: ${errorData.error}`
                        };
                    }
                } catch {
                    // Si pas de JSON, utiliser le texte brut
                    const errorText = await response.text();
                    return {
                        questions: [],
                        error: ` Backend: Erreur ${response.status} - ${errorText}`
                    };
                }
            }

            const data = await response.json();

            if (data.error) {
                return {
                    questions: [],
                    error: ` Backend: ${data.error}`
                };
            }

            return {
                questions: data.questions || [],
                message: data.message || `Génération réussie de ${data.questions?.length || 0} questions`
            };

        } catch (error) {
            // 🔹 ÉTAPE 5: Erreurs non prévues (réseau, etc.)
            let errorMessage = ' Frontend: Erreur lors de la génération des questions';
            
            if (error instanceof Error) {
                if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    errorMessage = ' Frontend: Impossible de contacter le serveur. Vérifiez votre connexion.';
                } else {
                    errorMessage = ` Frontend: ${error.message}`;
                }
            }

            return {
                questions: [],
                error: errorMessage
            };
        }
    }

    /**
     * Convertit les questions générées par l'IA au format de l'API pour envoyer a mon component AiGeneratedQuestions
     */
    static convertToApiFormat(
        aiQuestions: AIQuestionResponse[], 
        quizId: number, 
        startOrder: number
    ) {
        return aiQuestions.map((aiQuestion, index) => ({
            texte: aiQuestion.question,
            numeroOrdre: startOrder + index,
            questionnaire: `/api/questionnaires/${quizId}`,
            reponses: aiQuestion.answers.map((answer, answerIndex) => ({
                texte: answer.text,
                estCorrecte: answer.correct,
                numeroOrdre: answerIndex + 1
            }))
        }));
    }
}

export default AIService;
export type { AIQuestionResponse, AIGeneratedQuestions };