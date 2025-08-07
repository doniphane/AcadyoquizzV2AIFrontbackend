// Composant pour ajouter une nouvelle question à un quiz
// Ce composant utilise React Hook Form avec Zod pour la validation

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Plus, Loader2 } from 'lucide-react';

// Import des types et schéma de validation
import type { ApiQuestion } from '../types/managequestion';
import { addQuestionFormSchema } from '../types/managequestion';
import type { AddQuestionFormData } from '../types/managequestion';

// Interface pour les props du composant
interface AddQuestionFormProps {
    quizId: number;
    currentQuestionsCount: number;
    onSubmit: (questionData: ApiQuestion) => Promise<void>;
    isSubmitting: boolean;
}

function AddQuestionForm({ quizId, currentQuestionsCount, onSubmit, isSubmitting }: AddQuestionFormProps) {
    // Configuration de React Hook Form avec Zod
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        setError,
        clearErrors,
        reset,
        watch
    } = useForm<AddQuestionFormData>({
        resolver: zodResolver(addQuestionFormSchema),
        mode: 'onChange',
        defaultValues: {
            text: '',
            answers: [
                { text: '', correct: false },
                { text: '', correct: false }
            ]
        }
    });

    // Gestion du tableau de réponses avec useFieldArray
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'answers'
    });

    // Fonction pour ajouter une réponse
    const handleAddAnswer = (): void => {
        if (fields.length < 6) {
            append({ text: '', correct: false });
        }
    };

    // Fonction pour supprimer une réponse
    const handleRemoveAnswer = (index: number): void => {
        if (fields.length > 2) {
            remove(index);
        }
    };

    // Fonction pour soumettre le formulaire
    const handleFormSubmit = async (data: AddQuestionFormData): Promise<void> => {
        // Réinitialise les erreurs
        clearErrors();

        try {
            // Vérifier qu'il y a au moins 2 réponses
            if (data.answers.length < 2) {
                setError('answers', {
                    type: 'manual',
                    message: 'Une question doit avoir au moins 2 réponses.'
                });
                return;
            }

            // Vérifier qu'il y a au moins une réponse correcte
            const hasCorrectAnswer = data.answers.some(answer => answer.correct);
            if (!hasCorrectAnswer) {
                setError('answers', {
                    type: 'manual',
                    message: 'Il faut au moins une réponse correcte.'
                });
                return;
            }

            // Vérifier que la question se termine par un point d'interrogation
            let questionText = data.text.trim();
            if (!questionText.endsWith('?')) {
                questionText += '?';
            }

            // Préparer les données de la question
            const questionData: ApiQuestion = {
                texte: questionText,
                numeroOrdre: currentQuestionsCount + 1,
                questionnaire: `/api/questionnaires/${quizId}`,
                reponses: data.answers.map((answer, index) => ({
                    texte: answer.text.trim(),
                    estCorrecte: answer.correct,
                    numeroOrdre: index + 1
                }))
            };

            // Appeler la fonction de soumission
            await onSubmit(questionData);

            // Réinitialiser le formulaire
            reset();

        } catch {
            // Gestion des erreurs
            setError('text', {
                type: 'manual',
                message: 'Erreur lors de l\'ajout de la question'
            });
        }
    };

    return (
        <Card className="bg-gray-100 text-gray-900">
            <CardHeader>
                <CardTitle className="text-lg font-bold">Ajouter une question</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {/* Texte de la question */}
                    <div className="space-y-2">
                        <Label htmlFor="question-text" className="text-sm font-medium">
                            Question <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="question-text"
                            placeholder="Entrez votre question ici..."
                            rows={3}
                            disabled={isSubmitting}
                            className={`focus:ring-amber-500 focus:border-amber-500 ${
                                errors.text ? 'border-red-500' : ''
                            }`}
                            {...register('text')}
                        />
                        {/* Message d'erreur de validation pour la question */}
                        {errors.text && (
                            <p className="text-sm text-red-600">{errors.text.message}</p>
                        )}
                    </div>

                    {/* Réponses */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Réponses <span className="text-red-500">*</span>
                        </Label>
                        
                        {/* Indication pour les choix multiples */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-blue-600">💡</span>
                                <span className="text-sm font-medium text-blue-800">Question à choix multiples</span>
                            </div>
                            <p className="text-xs text-blue-700">
                                Cochez plusieurs réponses comme "correctes" pour créer une question à choix multiples. 
                                L'étudiant devra sélectionner TOUTES les bonnes réponses pour obtenir le point.
                            </p>
                            {watch('answers') && (
                                <div className="mt-2 text-xs">
                                    <span className="text-blue-600">
                                        Réponses correctes sélectionnées : {watch('answers')?.filter(a => a.correct).length || 0}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className={`p-3 rounded-lg border-2 ${
                                        field.correct
                                            ? 'bg-green-50 border-green-300'
                                            : 'bg-gray-50 border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Icône de statut */}
                                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                            field.correct
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-400 text-white'
                                        }`}>
                                            {field.correct ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <XCircle className="w-4 h-4" />
                                            )}
                                        </div>

                                        {/* Input de réponse */}
                                        <Input
                                            placeholder={`Réponse ${index + 1}`}
                                            disabled={isSubmitting}
                                            className="flex-1"
                                            {...register(`answers.${index}.text` as const)}
                                        />

                                        {/* Checkbox pour marquer comme correcte */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                disabled={isSubmitting}
                                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                {...register(`answers.${index}.correct` as const)}
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                Correct
                                            </span>
                                        </div>

                                        {/* Bouton supprimer */}
                                        {fields.length > 2 && (
                                            <Button
                                                type="button"
                                                onClick={() => handleRemoveAnswer(index)}
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                                disabled={isSubmitting}
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Message d'erreur pour les réponses */}
                        {errors.answers && (
                            <p className="text-sm text-red-600">{errors.answers.message}</p>
                        )}

                        {/* Bouton pour ajouter une réponse */}
                        {fields.length < 6 && (
                            <Button
                                type="button"
                                onClick={handleAddAnswer}
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                disabled={isSubmitting}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter une réponse
                            </Button>
                        )}
                    </div>

                    {/* Bouton de soumission */}
                    <Button
                        type="submit"
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Ajout...
                            </>
                        ) : (
                            'Ajouter la question'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default AddQuestionForm; 