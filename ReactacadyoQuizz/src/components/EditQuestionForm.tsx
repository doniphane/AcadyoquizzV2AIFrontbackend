
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Save, RotateCcw, Check, Square } from 'lucide-react';

// Import des types
import type { ApiQuestionData, ApiAnswerData } from '../types/managequestion';

// Interface pour les props du composant
interface EditQuestionFormProps {
    question: ApiQuestionData;
    onSave: (updatedQuestion: ApiQuestionData) => Promise<void>;
    onCancel: () => void;
}

function EditQuestionForm({ question, onSave, onCancel }: EditQuestionFormProps) {
    // États pour gérer les données du formulaire
    const [questionText, setQuestionText] = useState<string>(question.texte);
    const [answers, setAnswers] = useState<ApiAnswerData[]>(question.reponses);

    // Fonction pour mettre à jour le texte de la question
    const handleQuestionTextChange = (newText: string): void => {
        setQuestionText(newText);
    };

    // Fonction pour mettre à jour le texte d'une réponse
    const handleAnswerTextChange = (answerIndex: number, newText: string): void => {
        const updatedAnswers = [...answers];
        updatedAnswers[answerIndex] = {
            ...updatedAnswers[answerIndex],
            texte: newText
        };
        setAnswers(updatedAnswers);
    };

    // Fonction pour changer le statut correct/incorrect d'une réponse
    const handleAnswerCorrectChange = (answerIndex: number, isCorrect: boolean): void => {
        const updatedAnswers = [...answers];
        updatedAnswers[answerIndex] = {
            ...updatedAnswers[answerIndex],
            correct: isCorrect
        };
        setAnswers(updatedAnswers);
    };

    // Fonction pour supprimer une réponse
    const handleRemoveAnswer = (answerIndex: number): void => {
        if (answers.length > 2) { // Garder au moins 2 réponses
            const updatedAnswers = answers.filter((_, index) => index !== answerIndex);
            setAnswers(updatedAnswers);
        }
    };

    // Fonction pour ajouter une nouvelle réponse
    const handleAddAnswer = (): void => {
        const newAnswer: ApiAnswerData = {
            id: Date.now(), // ID temporaire pour les nouvelles réponses
            texte: '',
            numeroOrdre: answers.length + 1,
            correct: false
        };
        setAnswers([...answers, newAnswer]);
    };

    // Fonction pour valider le formulaire
    const validateForm = (): boolean => {
        // Vérifier que la question a un texte
        if (!questionText.trim()) {
            alert('Le texte de la question ne peut pas être vide');
            return false;
        }

        // Vérifier que la question a une longueur correcte
        if (questionText.trim().length < 5) {
            alert('La question doit contenir au moins 5 caractères');
            return false;
        }

        if (questionText.trim().length > 2000) {
            alert('La question ne peut pas dépasser 2000 caractères');
            return false;
        }

        // Vérifier que la question se termine par un point d'interrogation
        if (!questionText.trim().endsWith('?')) {
            alert('Une question doit se terminer par un point d\'interrogation');
            return false;
        }

        // Vérifier qu'il y a au moins 2 réponses
        if (answers.length < 2) {
            alert('Il faut au moins 2 réponses');
            return false;
        }

        // Vérifier que toutes les réponses ont un texte
        for (let i = 0; i < answers.length; i++) {
            if (!answers[i].texte.trim()) {
                alert(`La réponse ${i + 1} ne peut pas être vide`);
                return false;
            }
            if (answers[i].texte.trim().length > 1000) {
                alert(`La réponse ${i + 1} ne peut pas dépasser 1000 caractères`);
                return false;
            }
        }

        // Vérifier qu'il y a au moins une réponse correcte
        const hasCorrectAnswer = answers.some(answer => answer.correct);
        if (!hasCorrectAnswer) {
            alert('Il faut au moins une réponse correcte');
            return false;
        }

        return true;
    };

    // Fonction pour sauvegarder les modifications
    const handleSave = async (): Promise<void> => {
        if (!validateForm()) {
            return;
        }

        try {
            // Créer l'objet question mis à jour
            const updatedQuestion: ApiQuestionData = {
                ...question,
                texte: questionText.trim(), // Nettoyer le texte avant de l'envoyer
                reponses: answers.map(answer => ({
                    ...answer,
                    texte: answer.texte.trim() // Nettoyer aussi le texte des réponses
                }))
            };

            await onSave(updatedQuestion);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    };

    // Fonction pour annuler et revenir aux valeurs originales
    const handleCancel = (): void => {
        setQuestionText(question.texte);
        setAnswers(question.reponses);
        onCancel();
    };

    return (
        <Card className="mt-4 bg-blue-50 border-blue-200">
            <CardHeader>
                <CardTitle className="text-lg text-blue-800">
                    Modifier la question
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Champ pour le texte de la question */}
                <div className="space-y-2">
                    <Label htmlFor="question-text" className="text-blue-800 font-semibold">
                        Texte de la question
                    </Label>
                    <Input
                        id="question-text"
                        value={questionText}
                        onChange={(e) => handleQuestionTextChange(e.target.value)}
                        placeholder="Entrez le texte de la question"
                        className="border-blue-300 focus:border-blue-500"
                    />
                </div>

                {/* Liste des réponses */}
                <div className="space-y-3">
                    <Label className="text-blue-800 font-semibold">
                        Réponses ({answers.length})
                    </Label>
                    
                    {answers.map((answer, index) => (
                        <div key={`answer-${answer.id}-${index}`} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                            {/* Bouton pour réponse correcte */}
                            <Button
                                onClick={() => handleAnswerCorrectChange(index, !answer.correct)}
                                variant="outline"
                                size="sm"
                                className={`w-8 h-8 p-0 ${
                                    answer.correct 
                                        ? 'bg-green-500 border-green-500 text-white hover:bg-green-600' 
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {answer.correct ? <Check className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </Button>

                            {/* Numéro de la réponse */}
                            <span className="font-semibold text-blue-600 min-w-[30px]">
                                {index + 1}.
                            </span>

                            {/* Champ texte de la réponse */}
                            <Input
                                value={answer.texte}
                                onChange={(e) => handleAnswerTextChange(index, e.target.value)}
                                placeholder={`Réponse ${index + 1}`}
                                className="flex-1 border-blue-300 focus:border-blue-500"
                            />

                            {/* Bouton supprimer (seulement si plus de 2 réponses) */}
                            {answers.length > 2 && (
                                <Button
                                    onClick={() => handleRemoveAnswer(index)}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}

                    {/* Bouton pour ajouter une réponse */}
                    <Button
                        onClick={handleAddAnswer}
                        variant="outline"
                        className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                        + Ajouter une réponse
                    </Button>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3 pt-4">
                    <Button
                        onClick={handleSave}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                    </Button>
                    <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Annuler
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default EditQuestionForm; 