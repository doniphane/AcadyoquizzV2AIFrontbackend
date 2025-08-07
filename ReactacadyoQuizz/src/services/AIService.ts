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
            // We check if the response status is 200 (OK)
            if (response.status === 200) {
                // If the status is 200, OpenRouter is available
                return true;
            } else {
                // If the status is not 200, OpenRouter is not available
                return false;
            }
        } catch {
            // If there is an error (for example, network error), we return false
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
            // Récupérer le token d'authentification
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                return {
                    questions: [],
                    error: 'Vous devez être connecté pour utiliser cette fonctionnalité.'
                };
            }

            // Appeler le backend Symfony qui fait le proxy vers OpenRouter
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

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return {
                questions: data.questions || [],
                message: data.message || `Génération réussie de ${data.questions?.length || 0} questions`
            };
        } catch (error) {
            let errorMessage = 'Erreur lors de la génération des questions';
            if (error instanceof Error) {
                if (error.message.includes('401')) {
                    errorMessage = 'Vous devez être connecté pour utiliser cette fonctionnalité.';
                } else if (error.message.includes('500')) {
                    errorMessage = 'Erreur serveur. Vérifiez la configuration OpenRouter.';
                } else {
                    errorMessage = error.message;
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