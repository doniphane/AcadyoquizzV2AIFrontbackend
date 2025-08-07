import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import type { CalculatedResults } from '../types/quizresultpage';

// Interface pour les props du composant
interface AnswerDetailsCardProps {
    results: CalculatedResults;
}

/**
 * Composant pour afficher les détails des réponses de l'utilisateur
 * Affiche chaque question avec la réponse de l'utilisateur et la réponse correcte
 */
function AnswerDetailsCard({ results }: AnswerDetailsCardProps) {
    return (
        <Card className="bg-gray-200 text-gray-900">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Détail des Réponses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {results.userAnswers.map((answerDetail, index) => (
                    <div 
                        key={answerDetail.questionId} 
                        className="border border-gray-300 rounded-lg p-4 bg-gray-100"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            {answerDetail.isCorrect ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <h3 className="font-semibold">
                                Question {index + 1}: {answerDetail.questionText}
                            </h3>
                        </div>
                        <div className="ml-8 space-y-1">
                            <div className={answerDetail.isCorrect ? "text-green-600" : "text-red-600"}>
                                <span className="font-medium">Votre réponse:</span> {answerDetail.userAnswer.texte}
                            </div>
                            {!answerDetail.isCorrect && (
                                <div className="text-green-600">
                                    <span className="font-medium">Réponse correcte:</span> {answerDetail.correctAnswer.texte}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default AnswerDetailsCard; 