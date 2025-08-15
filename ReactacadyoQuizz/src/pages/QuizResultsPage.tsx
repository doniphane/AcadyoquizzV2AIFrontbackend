

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
    const { quizInfo, userAnswers }: Partial<QuizResultsLocationState> = location.state || {};

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

                // Calcul côté frontend
                let correctAnswers: number = 0;
                const userAnswersDetails: UserAnswerDetail[] = [];

                questions.forEach((question: QuizQuestion) => {
                    const userAnswerIds = userAnswers[question.id];
                    const correctAnswersList = question.reponses.filter((a: QuizAnswer) => a.correct);
                    const isMultipleChoice = correctAnswersList.length > 1;
                    
                    // Convertir en tableau pour uniformiser le traitement
                    const userAnswerIdArray = Array.isArray(userAnswerIds) ? userAnswerIds : [userAnswerIds];
                    const userAnswersList = question.reponses.filter((a: QuizAnswer) => 
                        userAnswerIdArray.includes(a.id)
                    );

                    if (userAnswersList.length > 0 && correctAnswersList.length > 0) {
                        // Pour les questions à choix multiples : toutes les bonnes réponses doivent être sélectionnées ET aucune mauvaise
                        let isCorrect = false;
                        if (isMultipleChoice) {
                            const selectedCorrectIds = userAnswersList.filter(a => a.correct).map(a => a.id).sort();
                            const allCorrectIds = correctAnswersList.map(a => a.id).sort();
                            const hasOnlyCorrectAnswers = userAnswersList.every(a => a.correct);
                            isCorrect = hasOnlyCorrectAnswers && selectedCorrectIds.length === allCorrectIds.length &&
                                       selectedCorrectIds.every((id, index) => id === allCorrectIds[index]);
                        } else {
                            // Pour les questions à choix unique : la réponse doit être correcte
                            isCorrect = userAnswersList[0]?.correct || false;
                        }

                        if (isCorrect) {
                            correctAnswers++;
                        }

                        userAnswersDetails.push({
                            questionId: question.id,
                            questionText: question.texte,
                            userAnswers: userAnswersList,
                            correctAnswers: correctAnswersList,
                            isCorrect,
                            isMultipleChoice
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

            } catch (error) {
                console.error('Erreur lors du calcul des résultats:', error);
                navigate('/student');
            } finally {
                setIsCalculating(false);
            }
        };

        calculateResults();
    }, [quizInfo, userAnswers, navigate]);

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