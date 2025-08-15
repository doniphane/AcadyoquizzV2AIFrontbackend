import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Calendar, BarChart3, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import AuthService from '../services/AuthService';

import { QuizMetrics, StudentsList, StudentResultsDetail, exportAllResultsPDF, exportStudentResultPDF } from '../components';
import type { Student, AnswerDetail, Metrics, QuizResultsNavigationState, QuizAttempt, QuizQuestion, QuizAnswer, UserAnswer } from '../types/quizresultdetail';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Interface pour les données de l'API
interface ApiResponse {
  member?: unknown[];
  'hydra:member'?: unknown[];
}

function QuizResultsDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupération des données depuis la navigation
  const { quizId, quizTitle, quizCode } = (location.state as QuizResultsNavigationState) || {};
  
  // États pour les données
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<AnswerDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fonction pour vérifier l'authentification
  const checkAuthentication = async (): Promise<boolean> => {
    try {
      const isAuth = await AuthService.isAuthenticated();
      return isAuth;
    } catch {
      return false;
    }
  };

  // Fonction pour faire un appel API
  const makeApiCall = async (endpoint: string): Promise<unknown[]> => {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
      navigate('/login');
      return [];
    }

    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      const data = response.data;
      
      // Gestion de la réponse API Platform
      if (Array.isArray(data)) {
        return data;
      }
      
      return (data as ApiResponse).member || (data as ApiResponse)['hydra:member'] || [];
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  };

  // Fonction pour calculer les métriques
  const calculateMetrics = (studentsList: Student[]): Metrics => {
    if (studentsList.length === 0) {
      return { 
        totalStudents: 0, 
        averageScore: 0, 
        bestScore: 0, 
        lowestScore: 0, 
        successRate: 0 
      };
    }

    const percentages = studentsList.map(student => student.percentage);
    const average = Math.round(percentages.reduce((sum, score) => sum + score, 0) / studentsList.length);
    const best = Math.max(...percentages);
    const lowest = Math.min(...percentages);
    const successCount = studentsList.filter(student => student.percentage >= 70).length;
    const success = Math.round((successCount / studentsList.length) * 100);

    return {
      totalStudents: studentsList.length,
      averageScore: average,
      bestScore: best,
      lowestScore: lowest,
      successRate: success
    };
  };

  // Fonction pour charger les résultats du quiz
  const loadQuizResults = async () => {
    if (!quizId) {
      toast.error('ID du quiz manquant');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const attempts = await makeApiCall('/api/tentative_questionnaires');
      
      // Filtrer les tentatives pour ce quiz
      const quizAttempts = attempts.filter((attempt) => 
        (attempt as QuizAttempt).questionnaire?.includes(quizId)
      );

      // Transformer les tentatives en données d'étudiants
      const studentsData: Student[] = quizAttempts.map((attempt) => {
        const quizAttempt = attempt as QuizAttempt;
        const percentage = quizAttempt.nombreTotalQuestions && quizAttempt.score
          ? Math.round((quizAttempt.score / quizAttempt.nombreTotalQuestions) * 100)
          : 0;

        return {
          id: quizAttempt.id,
          name: `${quizAttempt.prenomParticipant} ${quizAttempt.nomParticipant}`,
          email: `${quizAttempt.prenomParticipant}${quizAttempt.nomParticipant}@gmail.com`,
          date: new Date(quizAttempt.dateDebut).toLocaleDateString('fr-FR'),
          score: quizAttempt.score || 0,
          totalQuestions: quizAttempt.nombreTotalQuestions || 0,
          percentage
        };
      });

      setStudents(studentsData);
    } catch (error) {
      toast.error('Erreur lors du chargement des résultats');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les détails d'un étudiant
  const loadStudentDetails = async (student: Student) => {
    setSelectedStudent(student);

    try {
      // Charger toutes les données en parallèle
      const [questions, answers, userAnswers] = await Promise.all([
        makeApiCall('/api/questions'),
        makeApiCall('/api/reponses'),
        makeApiCall('/api/reponse_utilisateurs')
      ]);

      // Filtrer les questions du quiz
      const quizQuestions = questions.filter((question) => 
        (question as QuizQuestion).questionnaire?.includes(quizId)
      );

      // Filtrer les réponses de l'étudiant
      const studentUserAnswers = userAnswers.filter((userAnswer) => 
        (userAnswer as UserAnswer).tentativeQuestionnaire?.includes(student.id.toString())
      );

      // Créer les détails des réponses
      const answersDetails: AnswerDetail[] = studentUserAnswers.map((userAnswer) => {
        const userAnswerData = userAnswer as UserAnswer;
        const questionId = userAnswerData.question?.split('/').pop();
        const answerId = userAnswerData.reponse?.split('/').pop();

        // Trouver la question
        const question = quizQuestions.find((q) => 
          (q as QuizQuestion).id === parseInt(questionId || '0')
        );

        // Trouver les réponses de cette question
        const questionAnswers = answers.filter((answer) => 
          (answer as QuizAnswer).question?.includes(questionId || '')
        );

        // Trouver la réponse sélectionnée par l'étudiant
        const selectedAnswer = questionAnswers.find((answer) => 
          (answer as QuizAnswer).id === parseInt(answerId || '0')
        );

        // Trouver la réponse correcte
        const correctAnswer = questionAnswers.find((answer) => 
          (answer as QuizAnswer).correct === true
        );

        return {
          questionText: (question as QuizQuestion)?.texte || 'Question non trouvée',
          userAnswer: (selectedAnswer as QuizAnswer)?.texte || 'Réponse non trouvée',
          correctAnswer: (correctAnswer as QuizAnswer)?.texte || 'Réponse correcte non trouvée',
          isCorrect: (selectedAnswer as QuizAnswer)?.correct || false
        };
      });

      setStudentAnswers(answersDetails);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
      setStudentAnswers([]);
      console.error('Erreur:', error);
    }
  };

  // Fonction pour filtrer les étudiants
  const getFilteredStudents = (): Student[] => {
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Fonction pour exporter tous les résultats
  const handleExportAllResults = () => {
    exportAllResultsPDF({
      students,
      quizData: {
        title: quizTitle || 'Quiz',
        code: quizCode || 'QUIZ01'
      }
    });
  };

  // Fonction pour exporter le résultat d'un étudiant
  const handleExportStudentResult = () => {
    if (!selectedStudent) return;
    
    exportStudentResultPDF({
      student: selectedStudent,
      answers: studentAnswers,
      quizData: {
        title: quizTitle || 'Quiz',
        code: quizCode || 'QUIZ01'
      }
    });
  };

  // Fonction pour retourner à l'admin
  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  // Fonction pour gérer la recherche
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadQuizResults();
  }, [quizId, loadQuizResults]);

  // Rediriger si pas de quizId
  useEffect(() => {
    if (!quizId) {
      navigate('/admin');
    }
  }, [quizId, navigate]);

  // Calculs pour l'interface
  const metrics = calculateMetrics(students);
  const filteredStudents = getFilteredStudents();

  // Affichage de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-400" />
          <div className="text-xl">Chargement des résultats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
          <Button
            onClick={handleBackToAdmin}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 mb-4 sm:mb-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>

          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-4xl font-bold text-yellow-400 mb-2">
              {quizTitle || 'Quiz'}
            </h1>
            <p className="text-sm sm:text-base text-gray-300">
              Code: {quizCode || 'QUIZ01'} • {metrics.totalStudents} participants
            </p>
          </div>

          <Button
            onClick={handleExportAllResults}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter les Résultats
          </Button>
        </div>

        {/* Métriques */}
        <QuizMetrics metrics={metrics} />

        {/* Recherche et filtres */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 bg-gray-800 border-gray-700 text-white w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="bg-white hover:bg-yellow-600 text-gray-900 flex-1 sm:flex-none">
              <Calendar className="w-4 h-4 mr-2" />
              Trier par date
            </Button>
            <Button className="bg-white hover:bg-yellow-600 text-gray-900 flex-1 sm:flex-none">
              <BarChart3 className="w-4 h-4 mr-2" />
              Trier par résultat
            </Button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <StudentsList 
            students={filteredStudents}
            selectedStudent={selectedStudent}
            onStudentSelect={loadStudentDetails}
          />

          <StudentResultsDetail
            selectedStudent={selectedStudent}
            studentAnswers={studentAnswers}
            onExportPDF={handleExportStudentResult}
          />
        </div>
      </div>
    </div>
  );
}

export default QuizResultsDetailPage;