// Composant de page de gestion des questions d'un quiz
// Ce composant permet de visualiser et ajouter des questions à un quiz

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';

// Import des composants UI
import { Button } from '@/components/ui/button';

// Import des icônes
import { ArrowLeft, Loader2 } from 'lucide-react';

// Import du service d'authentification
import AuthService from '../services/AuthService';

// Import des composants personnalisés
import { QuestionsList, AddQuestionForm, AIGeneratedQuestions } from '../components';

// Import des types
import type { 
    QuizWithQuestions,
    ApiQuestion,
    ApiQuestionData,
    ApiError
} from '../types/managequestion';

// URL de base de l'API Symfony
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

function ManageQuestionsPage() {
    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // Hook pour récupérer les paramètres de l'URL
    const { quizId } = useParams();

    // États pour les données
    const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Fonction pour récupérer les données du quiz
    const fetchQuiz = useCallback(async (): Promise<void> => {
        if (!quizId) return;

        try {
            setIsLoading(true);
            setError(null);

            // Récupérer le token d'authentification
            const token: string | null = AuthService.getToken();
            if (!token) {
                setError('Vous devez être connecté pour accéder à cette page');
                return;
            }

            // Appeler l'API pour récupérer le questionnaire avec ses questions
            const response: AxiosResponse<QuizWithQuestions> = await axios.get<QuizWithQuestions>(
                `${API_BASE_URL}/api/questionnaires/${quizId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setQuiz(response.data);

        } catch (error) {
            const axiosError = error as AxiosError;
            
            if (axiosError.response?.status === 404) {
                setError('Quiz non trouvé');
            } else if (axiosError.response?.status === 403) {
                setError('Vous n\'êtes pas autorisé à accéder à ce quiz');
            } else {
                setError('Erreur lors du chargement du quiz');
            }
        } finally {
            setIsLoading(false);
        }
    }, [quizId]);

    // Récupérer les données au chargement de la page
    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    // Fonction pour soumettre une nouvelle question
    const handleSubmitQuestion = async (questionData: ApiQuestion): Promise<void> => {
        if (!quiz) return;

        setIsSubmitting(true);

        try {
            // Récupérer le token d'authentification
            const token: string | null = AuthService.getToken();
            if (!token) {
                throw new Error('Vous devez être connecté pour ajouter une question');
            }

            // Appel API pour ajouter une question
            await axios.post(
                `${API_BASE_URL}/api/questions`,
                questionData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Recharger les données du quiz
            await fetchQuiz();

        } catch (error) {
            const axiosError = error as AxiosError<ApiError>;

            let errorMessage: string = 'Erreur lors de l\'ajout de la question';

            if (axiosError.response) {
                const status: number = axiosError.response.status;
                if (status === 401) {
                    errorMessage = 'Vous devez être connecté pour ajouter une question';
                } else if (status === 403) {
                    errorMessage = 'Vous n\'êtes pas autorisé à modifier ce quiz';
                } else if (status === 400) {
                    errorMessage = 'Données invalides';
                } else if (status === 422) {
                    // Erreur de validation du backend
                    if (axiosError.response.data?.violations) {
                        const messages = axiosError.response.data.violations
                            .map(v => v.message)
                            .join(', ');
                        errorMessage = messages;
                    } else if (axiosError.response.data?.detail) {
                        errorMessage = axiosError.response.data.detail;
                    }
                }
            } else if (axiosError.request) {
                errorMessage = 'Problème de connexion au serveur';
            }

            throw new Error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour soumettre plusieurs questions (pour l'IA)
    const handleSubmitMultipleQuestions = async (questionsData: ApiQuestion[]): Promise<void> => {
        if (!quiz) return;

        setIsSubmitting(true);

        try {
            // Récupérer le token d'authentification
            const token: string | null = AuthService.getToken();
            if (!token) {
                throw new Error('Vous devez être connecté pour ajouter des questions');
            }

            // Ajouter chaque question une par une
            for (const questionData of questionsData) {
                await axios.post(
                    `${API_BASE_URL}/api/questions`,
                    questionData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            }

            // Recharger les données du quiz
            await fetchQuiz();

        } catch (error) {
            const axiosError = error as AxiosError<ApiError>;

            let errorMessage: string = 'Erreur lors de l\'ajout des questions';

            if (axiosError.response) {
                const status: number = axiosError.response.status;
                if (status === 401) {
                    errorMessage = 'Vous devez être connecté pour ajouter des questions';
                } else if (status === 403) {
                    errorMessage = 'Vous n\'êtes pas autorisé à modifier ce quiz';
                } else if (status === 400) {
                    errorMessage = 'Données invalides';
                } else if (status === 422) {
                    // Erreur de validation du backend
                    if (axiosError.response.data?.violations) {
                        const messages = axiosError.response.data.violations
                            .map(v => v.message)
                            .join(', ');
                        errorMessage = messages;
                    } else if (axiosError.response.data?.detail) {
                        errorMessage = axiosError.response.data.detail;
                    }
                }
            } else if (axiosError.request) {
                errorMessage = 'Problème de connexion au serveur';
            }

            throw new Error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour retourner au dashboard
    const handleBackToDashboard = (): void => {
        navigate('/admin');
    };

    // Affichage de chargement
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Chargement du quiz...</span>
                </div>
            </div>
        );
    }

    // Affichage d'erreur
    if (error || !quiz) {
        return (
            <div className="min-h-screen bg-gray-900 text-black p-6">
                <div className="text-center py-8">
                    <p className="text-red-400 mb-4">{error || 'Quiz non trouvé'}</p>
                    <Button onClick={handleBackToDashboard} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                        Retour au dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
                {/* Bouton retour et titre */}
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleBackToDashboard}
                        variant="outline"
                        className="border-gray-600 text-black hover:bg-gray-800 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour au dashboard
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                            Gérer les Questions
                        </h1>
                        <p className="text-gray-300 text-lg">
                            Quiz "{quiz.title}" - Code: {quiz.uniqueCode}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Section principale - Liste des questions */}
                <div className="lg:col-span-2">
                    <QuestionsList 
                        questions={quiz.questions as unknown as ApiQuestionData[]}
                        quizTitle={quiz.title}
                    />
                </div>

                {/* Section latérale - Ajouter une question et IA */}
                <div className="space-y-6">
                    <AddQuestionForm
                        quizId={quiz.id}
                        currentQuestionsCount={quiz.questions.length}
                        onSubmit={handleSubmitQuestion}
                        isSubmitting={isSubmitting}
                    />
                    
                    <AIGeneratedQuestions
                        quizId={quiz.id}
                        currentQuestionsCount={quiz.questions.length}
                        onAddQuestions={handleSubmitMultipleQuestions}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>
        </div>
    );
}

export default ManageQuestionsPage;