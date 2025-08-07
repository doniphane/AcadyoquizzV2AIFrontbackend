// Composant MetricsDashboard
// Ce composant gère l'affichage des métriques du dashboard admin
// Il est utilisé dans AdminPage pour alléger le code principal

// Import des composants UI
import { Card, CardContent } from "@/components/ui/card";

// Import des icônes
import { FileText, UserCheck, Users } from "lucide-react";

// Import des types
import type { AdminMetrics } from "../types/admin";

// Interface pour les props du composant
interface MetricsDashboardProps {
  metrics: AdminMetrics;
}

function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="bg-yellow-400 text-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Quiz Créés</p>
              <p className="text-2xl font-bold">{metrics.quizzesCreated}</p>
            </div>
            <FileText className="w-8 h-8" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-400 text-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">NB : Tentative</p>
              <p className="text-2xl font-bold">{metrics.totalAttempts}</p>
            </div>
            <UserCheck className="w-8 h-8" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-400 text-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Nombre Inscrits</p>
              <p className="text-2xl font-bold">{metrics.registeredUsers}</p>
            </div>
            <Users className="w-8 h-8" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MetricsDashboard; 