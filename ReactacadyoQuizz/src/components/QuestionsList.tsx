// Composant pour afficher la liste des questions d'un quiz
// Ce composant affiche toutes les questions d'un quiz avec leurs réponses

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

// Import des types
import type { ApiQuestionData, ApiAnswerData } from '../types/managequestion';

// Interface pour les props du composant
interface QuestionsListProps {
    questions: ApiQuestionData[];
    quizTitle: string;
}

function QuestionsList({ questions, quizTitle }: QuestionsListProps) {
    // Si aucune question, afficher un message informatif
    if (!questions || questions.length === 0) {
        return (
            <Card className="bg-gray-100 text-gray-900">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">
                        Questions du quiz "{quizTitle}"
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-blue-800 font-semibold mb-2">Aucune question</h4>
                        <p className="text-blue-700">
                            Ce quiz n'a pas encore de questions. Ajoutez-en une ci-dessous !
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-gray-100 text-gray-900">
            <CardHeader>
                <CardTitle className="text-xl font-bold">
                    Questions du quiz "{quizTitle}"
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {questions.map((question, index) => (
                        <div 
                            key={`question-${question.id}-${index}`} 
                            className="border border-gray-200 rounded-lg p-4 bg-white"
                        >
                            <h5 className="font-semibold text-gray-900 mb-3">
                                Question {index + 1}: {question.texte || 'Question sans texte'}
                            </h5>
                            <div className="ml-4 space-y-3">
                                {question.reponses && Array.isArray(question.reponses) && 
                                    question.reponses.map((answer: ApiAnswerData, answerIndex: number) => (
                                        <div
                                            key={`answer-${answer.id}-${index}-${answerIndex}`}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                                                answer.correct
                                                    ? 'bg-green-50 border-green-300'
                                                    : 'bg-red-50 border-red-300'
                                            }`}
                                        >
                                            {/* Icône de statut */}
                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                                answer.correct
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-red-500 text-white'
                                            }`}>
                                                {answer.correct ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <XCircle className="w-4 h-4" />
                                                )}
                                            </div>

                                            {/* Numéro et texte de la réponse */}
                                            <div className="flex-1">
                                                <span className={`font-semibold ${
                                                    answer.correct ? 'text-green-800' : 'text-red-800'
                                                }`}>
                                                    {answerIndex + 1}. {answer.texte || 'Réponse sans texte'}
                                                </span>
                                            </div>

                                            {/* Badge de statut */}
                                            <Badge className={`${
                                                answer.correct
                                                    ? 'bg-green-100 text-green-800 border-green-300'
                                                    : 'bg-red-100 text-red-800 border-red-300'
                                            }`}>
                                                {answer.correct ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Correct
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        Incorrect
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default QuestionsList; 