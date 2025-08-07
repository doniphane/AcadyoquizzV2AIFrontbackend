import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import axios from 'axios';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

import AuthService from '../services/AuthService';
import toast from 'react-hot-toast';
import type { 
    QuizCreateData,
    QuizCreateResponse,
    QuizCreateError,
    CreateQuizFormData
} from '../types/createquiz';
import { createQuizFormSchema } from '../types/createquiz';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function CreateQuizPage() {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        clearErrors
    } = useForm<CreateQuizFormData>({
        resolver: zodResolver(createQuizFormSchema),
        mode: 'onChange',
        defaultValues: { title: '', description: '' }
    });

    const getToken = useCallback((): string | null => {
        const token = AuthService.getToken();
        if (!token) {
            toast.error('Vous devez être connecté');
            navigate('/login');
            return null;
        }
        return token;
    }, [navigate]);

    const setCustomError = useCallback((field: keyof CreateQuizFormData, message: string): void => {
        setError(field, { type: 'manual', message });
    }, [setError]);

    const onSubmit: SubmitHandler<CreateQuizFormData> = useCallback(async (data) => {
        clearErrors();

        try {
            const token = getToken();
            if (!token) return;

            const dataToSend: QuizCreateData = {
                titre: data.title.trim(),
                description: data.description.trim(),
                estActif: true,
                estDemarre: false,
                scorePassage: 70
            };

            const response = await axios.post<QuizCreateResponse>(
                `${API_BASE_URL}/api/questionnaires`,
                dataToSend,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const createdQuiz = response.data;

            toast.success('Quiz créé avec succès !');

            if (createdQuiz.uniqueCode) {
                setTimeout(() => {
                    toast.success(`Code d'accès : ${createdQuiz.uniqueCode}`, {
                        duration: 10000,
                        icon: '📋'
                    });
                }, 1000);
            }

            setTimeout(() => navigate('/admin'), 2000);

        } catch (error) {
            const axiosError = error as AxiosError<QuizCreateError>;
            
            if (axiosError.response?.status === 401) {
                setCustomError('title', 'Vous devez être connecté');
            } else if (axiosError.response?.status === 403) {
                setCustomError('title', 'Vous n\'avez pas les permissions');
            } else if (axiosError.response?.status === 422) {
                if (axiosError.response.data?.violations) {
                    const messages = axiosError.response.data.violations
                        .map(v => v.message)
                        .join(', ');
                    setCustomError('title', messages);
                } else if (axiosError.response.data?.detail) {
                    setCustomError('title', axiosError.response.data.detail);
                } else {
                    setCustomError('title', 'Erreur lors de la création du quiz');
                }
            } else {
                setCustomError('title', 'Erreur lors de la création du quiz');
            }
        }
    }, [getToken, clearErrors, setCustomError, navigate]);

    const handleBack = useCallback(() => navigate('/admin'), [navigate]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleBack}
                        variant="outline"
                        className="border-gray-600 text-black hover:bg-gray-800 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour à l'accueil
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                            Créer un nouveau quiz
                        </h1>
                        <p className="text-gray-300 text-lg">
                            Créez votre quiz en quelques étapes simples
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                <Card className="bg-gray-100 text-gray-900">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Créer un nouveau quiz</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium">
                                    Titre du quiz <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    type="text"
                                    placeholder="Ex: Quiz de culture générale"
                                    disabled={isSubmitting}
                                    className={`focus:ring-amber-500 focus:border-amber-500 ${
                                        errors.title ? 'border-red-500' : ''
                                    }`}
                                    {...register('title')}
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-600">{errors.title.message}</p>
                                )}
                                <div className="text-sm text-gray-600">
                                    100 caractères maximum
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Description optionnelle du quiz"
                                    rows={3}
                                    disabled={isSubmitting}
                                    className={`focus:ring-amber-500 focus:border-amber-500 ${
                                        errors.description ? 'border-red-500' : ''
                                    }`}
                                    {...register('description')}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600">{errors.description.message}</p>
                                )}
                                <div className="text-sm text-gray-600">
                                    500 caractères maximum (optionnel)
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    onClick={handleBack}
                                    variant="outline"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Création...
                                        </>
                                    ) : (
                                        'Créer le quiz'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default CreateQuizPage;