

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import type { AxiosResponse } from 'axios';



// Import des composants personnalisés
import { MainResultsCard, AnswerDetailsCard, ActionsCard } from '../components';

// Import des types
import type { 
    QuizResultsLocationState, 
    CustomLocation,
    QuizAnswer,
    QuizQuestion,
    UserAnswerDetail,
    CalculatedResults
} from '../types/quizresultpage';






// URL de base de l'API Symfony
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

function QuizResultsPage() {
    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // Hook pour récupérer les données passées en navigation
    const location = useLocation() as CustomLocation;
    const { quizInfo, userAnswers, results: backendResults }: Partial<QuizResultsLocationState> = location.state || {};

    // État pour stocker les résultats calculés
    const [results, setResults] = useState<CalculatedResults | null>(null);

    // État pour indiquer si on calcule les résultats
    const [isCalculating, setIsCalculating] = useState<boolean>(true);

    // Calculer les résultats au montage du composant
    useEffect(() => {
        const calculateResults = async (): Promise<void> => {
            if (!quizInfo || !userAnswers) {
                navigate('/student');
                return;
            }

            try {
                // Récupérer les questions depuis l'API
                const response: AxiosResponse<{ questions: QuizQuestion[] }> = await axios.get(`${API_BASE_URL}/api/public/questionnaires/${quizInfo.id}`);
                const questions: QuizQuestion[] = response.data.questions || [];

                // Si on a les résultats du backend, on les utilise
                if (backendResults) {
                    const userAnswersDetails: UserAnswerDetail[] = [];

                    // Si le backend a fourni les détails des réponses, on les utilise
                    if (backendResults.responseDetails) {
                        backendResults.responseDetails.forEach((detail) => {
                            userAnswersDetails.push({
                                questionId: detail.questionId,
                                questionText: detail.questionText,
                                userAnswer: {
                                    id: detail.userAnswer.id,
                                    texte: detail.userAnswer.text, // Utiliser le champ 'texte' de l'API Symfony
                                    numeroOrdre: 0, // Valeur par défaut
                                    correct: detail.userAnswer.isCorrect // Utiliser le champ 'correct' de l'API Symfony
                                },
                                correctAnswer: {
                                    id: detail.correctAnswer.id,
                                    texte: detail.correctAnswer.text, // Utiliser le champ 'texte' de l'API Symfony
                                    numeroOrdre: 0, // Valeur par défaut
                                    correct: detail.correctAnswer.isCorrect 
                                },
                                isCorrect: detail.isCorrect
                            });
                        });
                    } else {
                        // Calcul côté frontend
                        questions.forEach((question: QuizQuestion) => {
                            const userAnswerId: number = userAnswers[question.id];
                            const userAnswer: QuizAnswer | undefined = question.reponses.find((a: QuizAnswer) => a.id === userAnswerId);
                            const correctAnswer: QuizAnswer | undefined = question.reponses.find((a: QuizAnswer) => a.correct);

                            if (userAnswer && correctAnswer) {
                                const isCorrect: boolean = userAnswer.correct || false;

                                userAnswersDetails.push({
                                    questionId: question.id,
                                    questionText: question.texte,
                                    userAnswer,
                                    correctAnswer,
                                    isCorrect
                                });
                            }
                        });
                    }

                    setResults({
                        score: backendResults.score,
                        totalQuestions: backendResults.totalQuestions,
                        percentage: backendResults.percentage,
                        userAnswers: userAnswersDetails
                    });
                } else {
                    // Calcul côté frontend si pas de résultats backend
                    let correctAnswers: number = 0;
                    const userAnswersDetails: UserAnswerDetail[] = [];

                    questions.forEach((question: QuizQuestion) => {
                        const userAnswerId: number = userAnswers[question.id];
                        const userAnswer: QuizAnswer | undefined = question.reponses.find((a: QuizAnswer) => a.id === userAnswerId);
                        const correctAnswer: QuizAnswer | undefined = question.reponses.find((a: QuizAnswer) => a.correct);

                        if (userAnswer && correctAnswer) {
                            const isCorrect: boolean = userAnswer.correct || false;
                            if (isCorrect) {
                                correctAnswers++;
                            }

                            userAnswersDetails.push({
                                questionId: question.id,
                                questionText: question.texte, 
                                userAnswer,
                                correctAnswer,
                                isCorrect
                            });
                        }
                    });

                    const totalQuestions: number = questions.length;
                    const percentage: number = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

                    setResults({
                        score: correctAnswers,
                        totalQuestions,
                        percentage,
                        userAnswers: userAnswersDetails
                    });
                }

            } catch (error) {
                console.error('Erreur lors du calcul des résultats:', error);
                navigate('/student');
            } finally {
                setIsCalculating(false);
            }
        };

        calculateResults();
    }, [quizInfo, userAnswers, backendResults, navigate]);

    // Fonction pour retourner à l'accueil
    const handleBackToHome = (): void => {
        navigate('/student');
    };

    // Affichage de chargement
    if (isCalculating) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-xl mb-4">Calcul des résultats...</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                </div>
            </div>
        );
    }

    // Redirection si pas de résultats
    if (!results) {
        navigate('/student');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-yellow-400 mb-2">Résultat du Quiz</h1>
                    <p className="text-gray-300">Votre performance détaillée</p>
                </div>

                {/* Main Results Card */}
                <MainResultsCard results={results} />

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Answer Details */}
                    <AnswerDetailsCard results={results} />

                    {/* Actions */}
                    <ActionsCard onBackToHome={handleBackToHome} />
                </div>
            </div>
        </div>
    );
}

export default QuizResultsPage;