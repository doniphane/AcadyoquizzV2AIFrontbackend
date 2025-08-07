// Composant ListeQuiz
// Ce composant gère l'affichage et les actions sur la liste des quiz
// Il est utilisé dans AdminPage pour alléger le code principal

import { useNavigate } from "react-router-dom";

// Import des composants UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import des icônes
import {
  Eye,
  Edit,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Loader2,
} from "lucide-react";

// Import des types
import type { Quiz, LoadingQuizId } from "../types/admin";

// Interface pour les props du composant
interface ListeQuizProps {
  quizzes: Quiz[];
  loading: boolean;
  loadingQuizId: LoadingQuizId;
  onToggleStatus: (quizId: number, currentStatus: boolean) => Promise<void>;
  onDeleteQuiz: (quizId: number, quizTitle: string) => Promise<void>;
}

function ListeQuiz({
  quizzes,
  loading,
  loadingQuizId,
  onToggleStatus,
  onDeleteQuiz,
}: ListeQuizProps) {
  const navigate = useNavigate();

  // Fonction pour voir les résultats
  const viewResults = (quiz: Quiz): void => {
    const resultsParams = {
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizCode: quiz.accessCode,
    };
    
    navigate("/quiz-results-detail", {
      state: resultsParams,
    });
  };

  return (
    <Card className="bg-gray-100 text-gray-900">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Liste des Quiz</CardTitle>
        <p className="text-gray-600">Gérez vos quiz</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Chargement des quiz...</span>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            Aucun quiz créé pour le moment.
            <Button
              onClick={() => navigate("/create-quiz")}
              className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Créer votre premier quiz
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex flex-col justify-between p-4 bg-white rounded-lg border border-gray-200"
              >
                {/* Informations du quiz */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                  <p className="text-sm text-gray-500">
                    {quiz.createdAt
                      ? `Créé le ${new Date(quiz.createdAt).toLocaleDateString()}`
                      : "Date inconnue"}
                  </p>
                  <span className="px-3 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-medium">
                    {quiz.accessCode || "MATH01"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      quiz.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {quiz.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => onToggleStatus(quiz.id, quiz.isActive)}
                    disabled={loadingQuizId === quiz.id}
                    className={`${
                      quiz.isActive
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white flex-1`}
                  >
                    {loadingQuizId === quiz.id ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : quiz.isActive ? (
                      <Pause className="w-4 h-4 mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {quiz.isActive ? "Désactiver" : "Activer"}
                  </Button>

                  <Button
                    onClick={() => navigate(`/manage-questions/${quiz.id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>

                  <Button
                    onClick={() => viewResults(quiz)}
                    className="bg-gray-800 hover:bg-gray-700 text-white flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Résultat
                  </Button>

                  <Button
                    onClick={() => onDeleteQuiz(quiz.id, quiz.title)}
                    disabled={loadingQuizId === quiz.id}
                    className="bg-red-600 hover:bg-red-700 text-white flex-1"
                  >
                    {loadingQuizId === quiz.id ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ListeQuiz;