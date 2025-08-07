// Composant de page d'administration
// Ce composant affiche le dashboard admin avec :
// - Liste des quiz créés
// - Métriques (nombre de quiz, tentatives, utilisateurs)
// - Actions sur les quiz (activer/désactiver, modifier, supprimer)
// - Navigation vers les autres pages

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Import des composants UI
import { Button } from "@/components/ui/button";

// Import des icônes
import {
  Plus,
  LogOut,
  User,
  Menu,
  X
} from "lucide-react";

// Import des services et utilitaires
import AuthService from "../services/AuthService";
import toast from "react-hot-toast";

// Import des composants
import { ListeQuiz, MetricsDashboard } from "../components";

// Import des types centralisés
import type {
  Quiz,
  AdminMetrics,
  QuizApiResponse,
  UserApiResponse,
  AttemptApiResponse,
  LoadingQuizId
} from "../types/admin";

// URL de l'API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function AdminPage() {
  const navigate = useNavigate();

  // États simples
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuizId, setLoadingQuizId] = useState<LoadingQuizId>(null);

  // Métriques simples
  const [metrics, setMetrics] = useState<AdminMetrics>({
    quizzesCreated: 0,
    totalAttempts: 0,
    registeredUsers: 15, 
  });

  // État pour gérer l'ouverture du menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fonction pour obtenir le token
  const getToken = useCallback((): string | null => {
    const token = AuthService.getToken();
    if (!token) {
      toast.error("Vous devez être connecté");
      navigate("/login");
      return null;
    }
    return token;
  }, [navigate]);

  // Fonction pour récupérer les quiz
  const fetchQuizzes = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      // Récupérer les quiz
      const response = await axios.get<QuizApiResponse>(`${API_BASE_URL}/api/questionnaires`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Récupérer les quiz depuis la réponse
      let quizList: Quiz[] = [];
      if (Array.isArray(response.data)) {
        quizList = response.data;
      } else if (response.data.member) {
        quizList = response.data.member;
      } else if (response.data["hydra:member"]) {
        quizList = response.data["hydra:member"];
      }

      setQuizzes(quizList);

      // Récupérer le nombre d'utilisateurs
      let registeredUsers = 0;
      try {
        const usersResponse = await axios.get<UserApiResponse>(`${API_BASE_URL}/api/utilisateurs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        let usersList: unknown[] = [];
        if (Array.isArray(usersResponse.data)) {
          usersList = usersResponse.data;
        } else if (usersResponse.data.member) {
          usersList = usersResponse.data.member;
        } else if (usersResponse.data["hydra:member"]) {
          usersList = usersResponse.data["hydra:member"];
        }

        registeredUsers = usersList.length;
      } catch {
        registeredUsers = 0;
      }

      // Récupérer le nombre total de tentatives
      let totalAttempts = 0;
      try {
        const attemptsResponse = await axios.get<AttemptApiResponse>(`${API_BASE_URL}/api/tentative_questionnaires`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        let attemptsList: unknown[] = [];
        if (Array.isArray(attemptsResponse.data)) {
          attemptsList = attemptsResponse.data;
        } else if (attemptsResponse.data.member) {
          attemptsList = attemptsResponse.data.member;
        } else if (attemptsResponse.data["hydra:member"]) {
          attemptsList = attemptsResponse.data["hydra:member"];
        }

        totalAttempts = attemptsList.length;
      } catch {
        totalAttempts = 0;
      }

      // Mettre à jour les métriques
      setMetrics({
        quizzesCreated: quizList.length,
        totalAttempts: totalAttempts,
        registeredUsers: registeredUsers,
      });
    } catch {
      toast.error("Erreur lors du chargement des quiz");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Fonction pour activer/désactiver un quiz
  const toggleQuizStatus = async (quizId: number, currentStatus: boolean): Promise<void> => {
    try {
      setLoadingQuizId(quizId);
      const token = getToken();
      if (!token) return;

      await axios.put(
        `${API_BASE_URL}/api/questionnaires/${quizId}`,
        { estActif: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Mettre à jour la liste localement
      setQuizzes(
        quizzes.map((quiz) =>
          quiz.id === quizId ? { ...quiz, isActive: !currentStatus } : quiz
        )
      );

      toast.success(!currentStatus ? "Quiz activé" : "Quiz désactivé");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoadingQuizId(null);
    }
  };

  // Fonction pour supprimer un quiz
  const deleteQuiz = async (quizId: number, quizTitre: string): Promise<void> => {
    // Demander confirmation
    if (!window.confirm(`Supprimer le quiz "${quizTitre}" ?`)) {
      return;
    }

    try {
      setLoadingQuizId(quizId);
      const token = getToken();
      if (!token) return;

      await axios.delete(`${API_BASE_URL}/api/questionnaires/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Retirer le quiz de la liste
      setQuizzes(quizzes.filter((quiz) => quiz.id !== quizId));
      toast.success("Quiz supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoadingQuizId(null);
    }
  };

  // Fonction de déconnexion
  const handleLogout = async (): Promise<void> => {
    try {
      await AuthService.logout();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  // Charger les quiz au démarrage
  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Fonction pour basculer le menu mobile
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
            Dashboard Admin
          </h1>
          <p className="text-sm md:text-lg text-gray-300">
            Gérez vos quiz et analysez les performances
          </p>
        </div>

        {/* Bouton hamburger pour mobile */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="text-white focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Boutons d'action pour desktop */}
        <div className="hidden md:flex gap-4">
          <Button
            onClick={() => navigate("/create-quiz")}
            className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un quiz
          </Button>
          <Button
            onClick={() => navigate("/student")}
            className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3"
          >
            <User className="w-4 h-4 mr-2" />
            Espace Élève
          </Button>
          <Button
            onClick={handleLogout}
            className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800 p-4 rounded-lg space-y-4">
          <Button
            onClick={() => navigate("/create-quiz")}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un quiz
          </Button>
          <Button
            onClick={() => navigate("/student")}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3"
          >
            <User className="w-4 h-4 mr-2" />
            Espace Élève
          </Button>
          <Button
            onClick={handleLogout}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      )}

      {/* Métriques */}
      <MetricsDashboard metrics={metrics} />

      {/* Liste des quiz */}
      <ListeQuiz
        quizzes={quizzes}
        loading={loading}
        loadingQuizId={loadingQuizId}
        onToggleStatus={toggleQuizStatus}
        onDeleteQuiz={deleteQuiz}
      />
    </div>
  );
}

export default AdminPage;
