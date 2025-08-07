import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Calendar, BarChart3, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthService from '../services/AuthService';

import { QuizMetrics, StudentsList, StudentResultsDetail, exportAllResultsPDF, exportStudentResultPDF } from '../components';
import type { Student, AnswerDetail, Metrics, QuizResultsNavigationState, QuizAttempt, QuizQuestion, QuizAnswer, UserAnswer } from '../types/quizresultdetail';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Hook personnalisé pour les appels API
const useApi = () => {
  const navigate = useNavigate();
  
  const getToken = useCallback(() => {
    const token = AuthService.getToken();
    if (!token) {
      toast.error('Vous devez être connecté');
      navigate('/login');
      return null;
    }
    return token;
  }, [navigate]);

  const apiCall = useCallback(async (endpoint: string) => {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      
      const data = await response.json();
      // Simplifie la gestion API Platform - retourne toujours un tableau
      return Array.isArray(data) ? data : (data.member || data['hydra:member'] || []);
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }, [getToken]);

  return { apiCall };
};

// Hook pour les métriques
const useMetrics = (students: Student[]): Metrics => {
  return useMemo(() => {
    if (students.length === 0) {
      return { totalStudents: 0, averageScore: 0, bestScore: 0, lowestScore: 0, successRate: 0 };
    }

    const percentages = students.map(s => s.percentage);
    const average = Math.round(percentages.reduce((a, b) => a + b, 0) / students.length);
    const best = Math.max(...percentages);
    const lowest = Math.min(...percentages);
    const success = Math.round((students.filter(s => s.percentage >= 70).length / students.length) * 100);

    return {
      totalStudents: students.length,
      averageScore: average,
      bestScore: best,
      lowestScore: lowest,
      successRate: success
    };
  }, [students]);
};

// Hook pour charger les données du quiz
const useQuizData = (quizId: string) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { apiCall } = useApi();

  const loadQuizResults = useCallback(async () => {
    if (!quizId) return;

    try {
      setLoading(true);
      const attempts = await apiCall('/api/tentative_questionnaires');
      if (!attempts) return;

      // Filtrer et transformer en une seule étape
      const studentsData = attempts
        .filter((attempt: QuizAttempt) => attempt.questionnaire?.includes(quizId))
        .map((attempt: QuizAttempt) => {
          const percentage = attempt.nombreTotalQuestions && attempt.score
            ? Math.round((attempt.score / attempt.nombreTotalQuestions) * 100)
            : 0;

          return {
            id: attempt.id,
            name: `${attempt.prenomParticipant} ${attempt.nomParticipant}`,
            email: `${attempt.prenomParticipant}${attempt.nomParticipant}@gmail.com`,
            date: new Date(attempt.dateDebut).toLocaleDateString('fr-FR'),
            score: attempt.score || 0,
            totalQuestions: attempt.nombreTotalQuestions || 0,
            percentage
          };
        });

      setStudents(studentsData);
    } catch {
      toast.error('Erreur lors du chargement des résultats');
    } finally {
      setLoading(false);
    }
  }, [quizId, apiCall]);

  useEffect(() => {
    loadQuizResults();
  }, [loadQuizResults]);

  return { students, loading };
};

// Hook pour les détails d'un étudiant
const useStudentDetails = (quizId: string) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<AnswerDetail[]>([]);
  const { apiCall } = useApi();

  const handleStudentSelect = useCallback(async (student: Student) => {
    setSelectedStudent(student);

    try {
      // Charger toutes les données en parallèle
      const [questions, answers, userAnswers] = await Promise.all([
        apiCall('/api/questions'),
        apiCall('/api/reponses'),
        apiCall('/api/reponse_utilisateurs')
      ]);

      if (!questions || !answers || !userAnswers) return;

      // Filtrer et transformer
      const quizQuestions = questions.filter((q: QuizQuestion) => q.questionnaire?.includes(quizId));
      const studentUserAnswers = userAnswers.filter((ua: UserAnswer) => 
        ua.tentativeQuestionnaire?.includes(student.id.toString())
      );

      // Créer les détails des réponses
      const answersDetails = studentUserAnswers.map((userAnswer: UserAnswer) => {
        const questionId = userAnswer.question?.split('/').pop();
        const answerId = userAnswer.reponse?.split('/').pop();

        const question = quizQuestions.find((q: QuizQuestion) => q.id === parseInt(questionId || '0'));
        const questionAnswers = answers.filter((answer: QuizAnswer) => 
          answer.question?.includes(questionId || '')
        );
        const selectedAnswer = questionAnswers.find((answer: QuizAnswer) => 
          answer.id === parseInt(answerId || '0')
        );
        const correctAnswer = questionAnswers.find((answer: QuizAnswer) => answer.correct === true);

        return {
          questionText: question?.texte || 'Question non trouvée',
          userAnswer: selectedAnswer?.texte || 'Réponse non trouvée',
          correctAnswer: correctAnswer?.texte || 'Réponse correcte non trouvée',
          isCorrect: selectedAnswer?.correct || false
        };
      });

      setStudentAnswers(answersDetails);
    } catch {
      toast.error('Erreur lors du chargement des détails');
      setStudentAnswers([]);
    }
  }, [quizId, apiCall]);

  return { selectedStudent, studentAnswers, handleStudentSelect };
};

function QuizResultsDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { quizId, quizTitle, quizCode } = (location.state as QuizResultsNavigationState) || {};
  const [searchTerm, setSearchTerm] = useState('');

  // Redirection si pas de quizId
  useEffect(() => {
    if (!quizId) {
      navigate('/admin');
    }
  }, [quizId, navigate]);

  // Hooks personnalisés
  const { students, loading } = useQuizData(quizId);
  const metrics = useMetrics(students);
  const { selectedStudent, studentAnswers, handleStudentSelect } = useStudentDetails(quizId);

  // Étudiants filtrés (mémorisé)
  const filteredStudents = useMemo(() => 
    students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [students, searchTerm]);

  // Fonctions d'export
  const handleExportAllResults = useCallback(() => {
    exportAllResultsPDF({
      students,
      quizData: {
        title: quizTitle || 'Quiz',
        code: quizCode || 'QUIZ01'
      }
    });
  }, [students, quizTitle, quizCode]);

  const handleExportStudentResult = useCallback(() => {
    if (!selectedStudent) return;
    
    exportStudentResultPDF({
      student: selectedStudent,
      answers: studentAnswers,
      quizData: {
        title: quizTitle || 'Quiz',
        code: quizCode || 'QUIZ01'
      }
    });
  }, [selectedStudent, studentAnswers, quizTitle, quizCode]);

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
          <Button
            onClick={() => navigate('/admin')}
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

        {/* Recherche */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            onStudentSelect={handleStudentSelect}
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