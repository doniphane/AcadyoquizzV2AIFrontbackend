

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// Import des composants UI
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Import du service d'authentification
import AuthService from '../services/AuthService';

// Import des composants personnalisés
import { QuestionsList, AddQuestionForm, AIGeneratedQuestions } from '../components';

// Import des types
import type { ApiQuestionData, ApiAnswerData } from '../types/managequestion';

// =============================================================================
// INTERFACES ET TYPES
// =============================================================================

// Interface pour une question
interface Question {
    id: number;
    question: string;
    reponses: string[];
    bonneReponse: number;
}

// Interface pour un quiz avec ses questions
interface QuizWithQuestions {
    id: number;
    title: string;
    uniqueCode: string;
    questions: Question[];
}

// Interface pour les données d'une question à envoyer à l'API
interface ApiQuestion {
    texte: string;
    numeroOrdre: number;
    questionnaire: string;
    reponses: {
        texte: string;
        estCorrecte: boolean;
        numeroOrdre: number;
    }[];
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

// Fonction pour vérifier si l'utilisateur est authentifié
async function checkAuthentication(): Promise<boolean> {
    try {
        const isAuth = await AuthService.isAuthenticated();
        return isAuth;
    } catch {
        return false;
    }
}

// Fonction pour gérer les erreurs d'API
function handleApiError(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data?: unknown } };
        const status = axiosError.response.status;
        
        // Pour les erreurs 422, afficher les détails de validation
        if (status === 422 && axiosError.response.data) {
            const errorData = axiosError.response.data as { error?: string; violations?: Array<{ propertyPath: string; message: string }> };
            if (errorData.error) {
                return `Erreur de validation: ${errorData.error}`;
            }
            if (errorData.violations && Array.isArray(errorData.violations)) {
                const violations = errorData.violations.map((v) => `${v.propertyPath}: ${v.message}`).join(', ');
                return `Erreurs de validation: ${violations}`;
            }
            return 'Données invalides. Vérifiez vos informations.';
        }
        
        switch (status) {
            case 401:
                return 'Session expirée. Veuillez vous reconnecter.';
            case 403:
                return 'Vous n\'êtes pas autorisé à effectuer cette action';
            case 404:
                return 'Ressource non trouvée';
            case 422:
                return 'Données invalides. Vérifiez vos informations.';
            default:
                return 'Erreur lors de l\'opération';
        }
    }
    
    return 'Erreur réseau. Vérifiez votre connexion.';
}

// =============================================================================
// COMPOSANTS D'INTERFACE
// =============================================================================

// Composant pour le fil d'Ariane
function Breadcrumb({ onBack, quizTitle }: { onBack: () => void; quizTitle: string }) {
    return (
        <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
            <button
                onClick={onBack}
                className="hover:text-yellow-400 transition-colors duration-200"
            >
                Dashboard
            </button>
            <span className="text-gray-600">/</span>
            <span className="text-yellow-400 font-medium">Gérer les questions</span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">{quizTitle}</span>
        </nav>
    );
}

// Composant pour l'en-tête de la page
function ManageQuestionsHeader({ quiz }: { quiz: QuizWithQuestions }) {
    return (
        <div className="mb-8">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                Gérer les Questions
            </h1>
            <p className="text-gray-300 text-lg">
                Quiz "{quiz.title}" - Code: {quiz.uniqueCode}
            </p>
        </div>
    );
}

// Composant pour l'écran de chargement
function LoadingScreen() {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Chargement du quiz...</span>
            </div>
        </div>
    );
}

// Composant pour l'écran d'erreur
function ErrorScreen({ error, onBack, onRetry }: { error: string; onBack: () => void; onRetry?: () => void }) {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <div className="space-x-4">
                    <Button 
                        onClick={onBack} 
                        className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                    >
                        Retour au dashboard
                    </Button>
                    {onRetry && (
                        <Button 
                            onClick={onRetry} 
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            Réessayer
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

function ManageQuestionsPage() {
    const navigate = useNavigate();
    const { quizId } = useParams();

    // États pour les données
    const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Fonction pour récupérer les données du quiz
    const fetchQuiz = async (): Promise<void> => {
        if (!quizId) {
            setError('ID du quiz manquant');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Vérifier l'authentification avant l'appel API
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) {
                setError('Vous devez être connecté pour accéder à cette page');
                setIsLoading(false);
                return;
            }

            // Appel API simple - l'intercepteur axios ajoute automatiquement le token
            const response = await axios.get<QuizWithQuestions>(
                `${import.meta.env.VITE_API_BASE_URL}/api/questionnaires/${quizId}`
            );

            setQuiz(response.data);

        } catch (error) {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
            
            // Si erreur 401, rediriger vers la page de connexion
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response: { status: number } };
                if (axiosError.response.status === 401) {
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Récupérer les données au chargement de la page
    useEffect(() => {
        fetchQuiz();
    }, [quizId]);

    // Fonction pour soumettre une nouvelle question
    const handleSubmitQuestion = async (questionData: ApiQuestion): Promise<void> => {
        if (!quiz) {
            throw new Error('Quiz non disponible');
        }

        setIsSubmitting(true);

        try {
            // Vérifier l'authentification avant l'appel API
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) {
                throw new Error('Vous devez être connecté pour ajouter une question');
            }

            // Appel API simple - l'intercepteur axios ajoute automatiquement le token
            await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/questions`,
                questionData
            );

            // Recharger les données du quiz
            await fetchQuiz();

        } catch (error) {
            const errorMessage = handleApiError(error);
            throw new Error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour soumettre plusieurs questions (pour l'IA)
    const handleSubmitMultipleQuestions = async (questionsData: ApiQuestion[]): Promise<void> => {
        if (!quiz) {
            throw new Error('Quiz non disponible');
        }

        setIsSubmitting(true);

        try {
            // Vérifier l'authentification avant l'appel API
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) {
                throw new Error('Vous devez être connecté pour ajouter des questions');
            }

            // Ajouter chaque question une par une
            for (const questionData of questionsData) {
                await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/api/questions`,
                    questionData
                );
            }

            // Recharger les données du quiz
            await fetchQuiz();

        } catch (error) {
            const errorMessage = handleApiError(error);
            throw new Error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour mettre à jour une question existante
    const handleQuestionUpdate = async (questionId: number, updatedQuestion: ApiQuestionData): Promise<void> => {
        if (!quiz) {
            throw new Error('Quiz non disponible');
        }

        setIsSubmitting(true);

        try {
            // Vérifier l'authentification avant l'appel API
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) {
                throw new Error('Vous devez être connecté pour modifier une question');
            }

            // Préparer les données pour l'API
            const questionData = {
                texte: updatedQuestion.texte,
                numeroOrdre: updatedQuestion.numeroOrdre,
                questionnaire: `/api/questionnaires/${quiz.id}`,
                reponses: updatedQuestion.reponses.map((reponse: ApiAnswerData, index: number) => ({
                    texte: reponse.texte,
                    estCorrecte: reponse.correct,
                    numeroOrdre: index + 1
                }))
            };

            // Appel API pour mettre à jour la question
                            await axios.put(
                    `${import.meta.env.VITE_API_BASE_URL}/api/questions/${questionId}`,
                    questionData
                );

            // Recharger les données du quiz
            await fetchQuiz();

        } catch (error) {
            console.error('Erreur lors de la mise à jour de la question:', error);
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response: { status: number; data?: unknown } };
                console.error('Détails de l\'erreur:', {
                    status: axiosError.response.status,
                    data: axiosError.response.data
                });

            }
            const errorMessage = handleApiError(error);
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
        return <LoadingScreen />;
    }

    // Affichage d'erreur
    if (error || !quiz) {
        return (
            <ErrorScreen 
                error={error || 'Quiz non trouvé'} 
                onBack={handleBackToDashboard}
                onRetry={error ? fetchQuiz : undefined}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Fil d'Ariane */}
            <Breadcrumb onBack={handleBackToDashboard} quizTitle={quiz.title} />

            {/* En-tête de la page */}
            <ManageQuestionsHeader quiz={quiz} />

            {/* Contenu principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Section principale - Liste des questions */}
                <div className="lg:col-span-2">
                    <QuestionsList 
                        // @ts-expect-error - Type mismatch between API response and component props
                        questions={quiz.questions}
                        quizTitle={quiz.title}
                        onQuestionUpdate={handleQuestionUpdate}
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