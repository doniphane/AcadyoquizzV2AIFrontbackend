import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { 
  QuizInfo, 
  ParticipantData, 
  Question, 
  UserAnswers, 
  QuizSubmissionData,
  ApiQuestionData,
  ApiAnswerData
} from '@/types/TakeQuizPage';

import AuthService from '../services/AuthService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Hook API pour TakeQuiz
const useQuizApi = () => {
  const navigate = useNavigate();
  
  const getToken = useCallback(() => {
    const token = AuthService.getToken();
    if (!token) {
      toast.error('Vous devez être connecté pour participer à un quiz');
      navigate('/login');
      return null;
    }
    return token;
  }, [navigate]);

  const apiCall = useCallback(async (endpoint: string, options?: RequestInit) => {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options?.headers
        },
        ...options
      });
      
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }, [getToken]);

  return { apiCall };
};

// Hook pour charger les données du quiz
const useQuizData = (quizInfo: QuizInfo | undefined) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { apiCall } = useQuizApi();
  const navigate = useNavigate();

  const loadQuestions = useCallback(async () => {
    if (!quizInfo) {
      navigate('/student');
      return;
    }

    try {
      setIsLoading(true);
      const quizData = await apiCall(`/api/public/questionnaires/${quizInfo.id}`);
      if (!quizData) return;

      // Debug temporaire pour voir les données
      console.log('Données reçues de l\'API:', quizData);
      if (quizData.questions) {
        console.log('Questions reçues:', quizData.questions);
        quizData.questions.forEach((q: any, index: number) => {
          console.log(`Question ${index + 1}:`, q);
          if (q.reponses) {
            console.log(`  Réponses de la question ${index + 1}:`, q.reponses);
          }
        });
      }

      // Transformer les données en une seule étape
      const transformedQuestions: Question[] = (quizData.questions || []).map((questionData: ApiQuestionData) => ({
        id: questionData.id,
        text: questionData.texte,
        orderNumber: questionData.numeroOrdre,
        answers: questionData.reponses.map((answerData: ApiAnswerData) => ({
          id: answerData.id,
          text: answerData.texte,
          orderNumber: answerData.numeroOrdre,
          isCorrect: answerData.estCorrecte
        }))
      }));

      setQuestions(transformedQuestions);
    } catch {
      toast.error('Erreur lors du chargement des questions');
      navigate('/student');
    } finally {
      setIsLoading(false);
    }
  }, [quizInfo, apiCall, navigate]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return { questions, isLoading };
};

// Hook pour la navigation dans le quiz
const useQuizNavigation = (questions: Question[]) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});

  // Fonction pour détecter si une question a plusieurs réponses correctes
  const isMultipleChoiceQuestion = useCallback((question: Question): boolean => {
    const correctAnswers = question.answers.filter(answer => answer.isCorrect);
    const isMultiple = correctAnswers.length > 1;
    
    return isMultiple;
  }, []);

  const handleAnswerSelect = useCallback((questionId: number, answerId: number) => {
    setUserAnswers(prev => {
      const currentAnswers = prev[questionId];
      const question = questions.find(q => q.id === questionId);
      
      if (!question) return prev;

      // Si c'est une question à choix multiples
      if (isMultipleChoiceQuestion(question)) {
        const currentArray = Array.isArray(currentAnswers) ? currentAnswers : [];
        const newAnswers = currentArray.includes(answerId)
          ? currentArray.filter(id => id !== answerId)
          : [...currentArray, answerId];
        return { ...prev, [questionId]: newAnswers };
      }
      
      // Si c'est une question à choix unique
      return { ...prev, [questionId]: answerId };
    });
  }, [questions, isMultipleChoiceQuestion]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const progressPercentage = useMemo(() => 
    questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
  , [currentQuestionIndex, questions.length]);

  const isComplete = useMemo(() => 
    Object.keys(userAnswers).length === questions.length
  , [userAnswers, questions.length]);

  const currentQuestion = questions[currentQuestionIndex];

  return {
    currentQuestionIndex,
    currentQuestion,
    userAnswers,
    progressPercentage,
    isComplete,
    handleAnswerSelect,
    handleNextQuestion,
    isMultipleChoiceQuestion
  };
};

// Hook pour la soumission du quiz
const useQuizSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { apiCall } = useQuizApi();
  const navigate = useNavigate();

  const submitQuiz = useCallback(async (
    quizInfo: QuizInfo, 
    participantData: ParticipantData, 
    userAnswers: UserAnswers,
    questions: Question[]
  ) => {
    if (Object.keys(userAnswers).length < questions.length) {
      toast.error(`Veuillez répondre à toutes les questions. ${Object.keys(userAnswers).length}/${questions.length} réponses`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Format des réponses pour supporter les choix multiples
      const formattedAnswers = Object.entries(userAnswers).map(([questionId, answerIdOrIds]) => {
        const questionIdNum = parseInt(questionId);
        
        // Si c'est un tableau (choix multiples), créer une entrée pour chaque réponse
        if (Array.isArray(answerIdOrIds)) {
          return answerIdOrIds.map(answerId => ({
            questionId: questionIdNum,
            answerId: answerId
          }));
        }
        
        // Si c'est un nombre (choix unique)
        return [{
          questionId: questionIdNum,
          answerId: answerIdOrIds as number
        }];
      }).flat(); // Aplatir le tableau

      const submissionData: QuizSubmissionData = {
        participantFirstName: participantData.firstName,
        participantLastName: participantData.lastName,
        answers: formattedAnswers
      };

      const results = await apiCall(`/api/public/questionnaires/${quizInfo.id}/submit`, {
        method: 'POST',
        body: JSON.stringify(submissionData)
      });

      if (results) {
        navigate('/quiz-results', {
          state: {
            participantData,
            quizInfo,
            userAnswers,
            questions,
            results
          }
        });
      }
    } catch {
      toast.error('Erreur lors de la soumission du quiz');
    } finally {
      setIsSubmitting(false);
    }
  }, [apiCall, navigate]);

  return { isSubmitting, submitQuiz };
};

function TakeQuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { participantData, quizInfo } = (location.state as { participantData?: ParticipantData; quizInfo?: QuizInfo }) || {};

  // Hooks doivent être appelés avant les early returns
  const { questions, isLoading } = useQuizData(quizInfo || undefined);
  const {
    currentQuestionIndex,
    currentQuestion,
    userAnswers,
    progressPercentage,
    isComplete,
    handleAnswerSelect,
    handleNextQuestion,
    isMultipleChoiceQuestion
  } = useQuizNavigation(questions);
  const { isSubmitting, submitQuiz } = useQuizSubmission();

  // Rediriger si pas de données
  useEffect(() => {
    if (!participantData || !quizInfo) {
      navigate('/student');
    }
  }, [participantData, quizInfo, navigate]);

  // Fonctions de navigation
  const handleBack = useCallback(() => {
    navigate('/student');
  }, [navigate]);

  const handleNext = useCallback(async () => {
    if (currentQuestionIndex === questions.length - 1) {
      // Dernière question, soumettre le quiz
      if (quizInfo && participantData) {
        await submitQuiz(quizInfo, participantData, userAnswers, questions);
      }
    } else {
      // Question suivante
      handleNextQuestion();
    }
  }, [currentQuestionIndex, questions.length, submitQuiz, quizInfo, participantData, userAnswers, handleNextQuestion]);

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceed = currentQuestion && userAnswers[currentQuestion.id] !== undefined;

  // Affichage de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-400" />
          <div className="text-xl">Chargement du quiz...</div>
        </div>
      </div>
    );
  }

  // Affichage si pas de données
  if (!participantData || !quizInfo) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Données manquantes</h1>
          <Button onClick={() => navigate('/student')} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Affichage si pas de questions
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xl mb-4">Aucune question disponible pour ce quiz.</div>
          <Button onClick={handleBack} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header avec progression */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-yellow-400">
            Question {currentQuestionIndex + 1}/{questions.length}
          </h1>
          <div className="text-white text-lg">
            {participantData?.firstName} {participantData?.lastName}
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="h-full bg-yellow-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Section question */}
          <div className="bg-yellow-500 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentQuestion.text}
            </h2>
            <p className="text-gray-800">
              {isMultipleChoiceQuestion(currentQuestion) 
                ? "Choisissez une ou plusieurs réponses possibles" 
                : "Choisissez une réponse"
              }
            </p>
            {isMultipleChoiceQuestion(currentQuestion) && (
              <div className="mt-3 p-3 bg-yellow-400 rounded-lg text-gray-800 text-sm border-2 border-yellow-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚠️</span>
                  <strong>Question à choix multiples</strong>
                </div>
                <p className="text-xs">
                  <strong>Règle de scoring :</strong> Vous devez sélectionner TOUTES les bonnes réponses 
                  (et aucune mauvaise) pour obtenir le point. Sinon, la question est comptée comme fausse.
                </p>
              </div>
            )}
          </div>

          {/* Section réponses */}
          <div className="bg-gray-50 p-6">
            <div className="space-y-4">
              {currentQuestion.answers
                .sort((a, b) => a.orderNumber - b.orderNumber)
                .map((answer) => {
                  const isMultipleChoice = isMultipleChoiceQuestion(currentQuestion);
                  const currentAnswers = userAnswers[currentQuestion.id];
                  
                  // Déterminer si cette réponse est sélectionnée
                  const isSelected = isMultipleChoice 
                    ? Array.isArray(currentAnswers) 
                      ? currentAnswers.includes(answer.id)
                      : false
                    : currentAnswers === answer.id;

                  return (
                    <div key={answer.id} className="flex items-center">
                      <input
                        type={isMultipleChoice ? "checkbox" : "radio"}
                        name={isMultipleChoice ? `question_${currentQuestion.id}_checkbox` : `question_${currentQuestion.id}`}
                        id={`answer_${answer.id}`}
                        value={answer.id}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`answer_${answer.id}`}
                        className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        {answer.text}
                      </label>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Bouton Suivant/Terminer */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleNext}
            disabled={!canProceed || (isLastQuestion && (!isComplete || isSubmitting))}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Soumission...
              </>
            ) : isLastQuestion ? (
              'Terminer le Quiz'
            ) : (
              'Suivant'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TakeQuizPage;