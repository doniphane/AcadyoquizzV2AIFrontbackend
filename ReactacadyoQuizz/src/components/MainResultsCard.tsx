import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import type { CalculatedResults } from '../types/quizresultpage';

// Interface pour les props du composant
interface MainResultsCardProps {
    results: CalculatedResults;
}

/**
 * Composant pour afficher les résultats principaux du quiz
 * Affiche le score, le pourcentage et un message de motivation
 */
function MainResultsCard({ results }: MainResultsCardProps) {
    // Déterminer le message de motivation basé sur le pourcentage
    const getMotivationMessage = (percentage: number): string => {
        if (percentage >= 80) {
            return 'Excellent !';
        } else if (percentage >= 60) {
            return 'Bien, mais peut mieux faire !';
        } else {
            return 'Il faut réviser !';
        }
    };

    // Déterminer la couleur du message basé sur le pourcentage
    const getMessageColor = (percentage: number): string => {
        if (percentage >= 80) {
            return 'text-green-600';
        } else if (percentage >= 60) {
            return 'text-yellow-600';
        } else {
            return 'text-red-600';
        }
    };

    return (
        <Card className="bg-gray-200 text-gray-900 mb-6">
            <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                    <Trophy className="w-16 h-16 text-yellow-500" />
                </div>
                <div className="text-6xl font-bold mb-2">
                    {results.score}/{results.totalQuestions}
                </div>
                <div className="text-2xl text-gray-600 mb-4">
                    {Math.round(results.percentage)}%
                </div>
                <div className={`font-semibold text-lg ${getMessageColor(results.percentage)}`}>
                    {getMotivationMessage(results.percentage)}
                </div>
            </CardContent>
        </Card>
    );
}

export default MainResultsCard; 