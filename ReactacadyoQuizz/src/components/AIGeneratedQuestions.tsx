// Composant pour la génération automatique de questions avec l'IA
// Ce composant utilise Ollama pour analyser du texte et générer des questions

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Bot, 
    Loader2, 
    Sparkles, 
    AlertCircle, 
    CheckCircle, 
    XCircle,
    Plus,
    Trash2
} from 'lucide-react';

// Import du service IA
import AIService from '../services/AIService';
import type { AIQuestionResponse } from '../services/AIService';



// Interface pour les props du composant
interface AIGeneratedQuestionsProps {
    quizId: number;
    currentQuestionsCount: number;
    onAddQuestions: (questions: Array<{
        texte: string;
        numeroOrdre: number;
        questionnaire: string;
        reponses: Array<{
            texte: string;
            estCorrecte: boolean;
            numeroOrdre: number;
        }>;
    }>) => Promise<void>;
    isSubmitting: boolean;
}

function AIGeneratedQuestions({ 
    quizId, 
    currentQuestionsCount, 
    onAddQuestions, 
    isSubmitting 
}: AIGeneratedQuestionsProps) {
    // États pour la gestion de l'IA
    const [inputText, setInputText] = useState<string>('');
    const [numberOfQuestions, setNumberOfQuestions] = useState<number>(3);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<AIQuestionResponse[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isOllamaAvailable, setIsOllamaAvailable] = useState<boolean | null>(null);

    // Vérifier la disponibilité d'OpenRouter au chargement
    useState(() => {
        const checkOpenRouter = async () => {
            const available = await AIService.checkOpenRouterAvailability();
            setIsOllamaAvailable(available);
        };
        checkOpenRouter();
    });

    // Fonction pour générer des questions avec l'IA
    const handleGenerateQuestions = async (): Promise<void> => {
        if (!inputText.trim()) {
            setError('Veuillez entrer du texte à analyser');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await AIService.generateQuestionsFromText(inputText, numberOfQuestions);
            
            if (result.error) {
                setError(result.error);
                setGeneratedQuestions([]);
            } else if (result.questions.length > 0) {
                setGeneratedQuestions(result.questions);
                setSuccess(result.message || 'Questions générées avec succès');
                setError(null);
            } else {
                setError('Aucune question n\'a pu être générée. Essayez avec un texte plus détaillé.');
                setGeneratedQuestions([]);
            }
        } catch {
            setError('Erreur lors de la génération des questions');
            setGeneratedQuestions([]);
        } finally {
            setIsGenerating(false);
        }
    };

    // Fonction pour ajouter les questions générées au quiz
    const handleAddGeneratedQuestions = async (): Promise<void> => {
        if (generatedQuestions.length === 0) return;

        try {
            // Convertir les questions au format de l'API
            const apiQuestions = AIService.convertToApiFormat(
                generatedQuestions, 
                quizId, 
                currentQuestionsCount + 1
            );

            // Ajouter les questions au quiz
            await onAddQuestions(apiQuestions);

            // Réinitialiser l'état
            setGeneratedQuestions([]);
            setInputText('');
            setSuccess('Questions ajoutées au quiz avec succès');
            setError(null);

        } catch {
            setError('Erreur lors de l\'ajout des questions au quiz');
        }
    };

    // Fonction pour supprimer une question générée
    const handleRemoveQuestion = (index: number): void => {
        setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
    };

    // Fonction pour vider le texte d'entrée
    const handleClearText = (): void => {
        setInputText('');
        setError(null);
        setSuccess(null);
    };

    return (
        <Card className="bg-gray-100 text-gray-900">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    Génération IA
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Statut d'OpenRouter */}
                {isOllamaAvailable === false && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                OpenRouter n'est pas disponible
                            </span>
                        </div>
                        <p className="text-xs text-red-700 mt-1">
                            Vérifiez votre connexion internet et votre clé API OpenRouter
                        </p>
                        <div className="mt-2">
                            <p className="text-xs text-red-600">
                                Vérifiez que votre clé API OpenRouter est correcte dans le fichier .env
                            </p>
                        </div>
                    </div>
                )}

                {/* Zone de texte pour l'analyse */}
                <div className="space-y-2">
                    <Label htmlFor="ai-text-input" className="text-sm font-medium">
                        Texte à analyser <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Textarea
                            id="ai-text-input"
                            placeholder="Collez ici le texte que vous voulez analyser pour générer des questions automatiquement..."
                            rows={6}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            disabled={isGenerating || isSubmitting}
                            className="focus:ring-blue-500 focus:border-blue-500"
                        />
                        {inputText && (
                            <Button
                                type="button"
                                onClick={handleClearText}
                                variant="outline"
                                size="sm"
                                className="absolute top-2 right-2 h-6 w-6 p-0"
                                disabled={isGenerating || isSubmitting}
                            >
                                <XCircle className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Configuration du nombre de questions */}
                <div className="space-y-2">
                    <Label htmlFor="questions-count" className="text-sm font-medium">
                        Nombre de questions à générer
                    </Label>
                    <select
                        id="questions-count"
                        value={numberOfQuestions}
                        onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                        disabled={isGenerating || isSubmitting}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value={2}>2 questions</option>
                        <option value={3}>3 questions</option>
                        <option value={4}>4 questions</option>
                        <option value={5}>5 questions</option>
                    </select>
                </div>

                {/* Bouton de génération */}
                <Button
                    type="button"
                    onClick={handleGenerateQuestions}
                    disabled={!inputText.trim() || isGenerating || isSubmitting || isOllamaAvailable === false}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Génération en cours...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Générer des questions
                        </>
                    )}
                </Button>

                {/* Messages d'erreur et de succès */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Erreur</span>
                        </div>
                        <p className="text-xs text-red-700 mt-1">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Succès</span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">{success}</p>
                    </div>
                )}

                {/* Questions générées */}
                {generatedQuestions.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                                Questions générées ({generatedQuestions.length})
                            </Label>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                IA Généré
                            </Badge>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {generatedQuestions.map((question, index) => (
                                <div
                                    key={index}
                                    className="p-3 bg-white border border-gray-200 rounded-lg"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="font-medium text-sm">
                                            Question {index + 1}
                                        </h4>
                                        <Button
                                            type="button"
                                            onClick={() => handleRemoveQuestion(index)}
                                            variant="outline"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-red-600"
                                            disabled={isSubmitting}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    
                                    <p className="text-sm text-gray-700 mb-2">
                                        {question.question}
                                    </p>
                                    
                                    <div className="space-y-1">
                                        {question.answers.map((answer, answerIndex) => (
                                            <div
                                                key={answerIndex}
                                                className={`text-xs p-2 rounded ${
                                                    answer.correct
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                }`}
                                            >
                                                {answer.text}
                                                {answer.correct && (
                                                    <CheckCircle className="w-3 h-3 inline ml-1" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bouton pour ajouter toutes les questions */}
                        <Button
                            type="button"
                            onClick={handleAddGeneratedQuestions}
                            disabled={isSubmitting}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Ajout en cours...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter toutes les questions au quiz
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default AIGeneratedQuestions; 