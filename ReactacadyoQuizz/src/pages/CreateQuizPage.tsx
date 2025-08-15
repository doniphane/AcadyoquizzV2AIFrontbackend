import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';

// Import des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


// Import des services
import AuthService from '../services/AuthService';

// =============================================================================
// INTERFACES ET TYPES
// =============================================================================

// Interface pour les données du formulaire
interface CreateQuizFormData {
    title: string;
    description: string;
}

// Interface pour les données envoyées à l'API
interface QuizDataToSend {
    titre: string;
    description: string;
    estActif: boolean;
    estDemarre: boolean;
    scorePassage: number;
}

// Interface pour la réponse de l'API
interface QuizResponse {
    id: number;
    uniqueCode: string;
    titre: string;
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

// Fonction pour valider le titre du quiz
function validateTitle(title: string): string | null {
    if (!title.trim()) {
        return 'Le titre est obligatoire';
    }
    if (title.length > 100) {
        return 'Le titre ne peut pas dépasser 100 caractères';
    }
    return null;
}

// Fonction pour valider la description du quiz
function validateDescription(description: string): string | null {
    if (description.length > 500) {
        return 'La description ne peut pas dépasser 500 caractères';
    }
    return null;
}

// Interface pour les erreurs de validation du serveur
interface ValidationViolation {
    message: string;
}

interface ServerErrorData {
    violations?: ValidationViolation[];
    detail?: string;
}

// Fonction pour gérer les erreurs de création de quiz
function handleCreateQuizError(error: unknown): string {
    // Vérifier si c'est une erreur Axios avec une réponse
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data?: ServerErrorData } };
        const status = axiosError.response.status;
        
        switch (status) {
            case 401:
                return 'Vous devez être connecté pour créer un quiz';
            case 403:
                return 'Vous n\'avez pas les permissions pour créer un quiz';
            case 422:
                // Erreur de validation du serveur
                if (axiosError.response.data?.violations) {
                    const messages = axiosError.response.data.violations
                        .map((v: ValidationViolation) => v.message)
                        .join(', ');
                    return messages;
                }
                return 'Données invalides. Vérifiez vos informations.';
            default:
                return 'Erreur lors de la création du quiz. Veuillez réessayer.';
        }
    }
    
    return 'Erreur réseau. Vérifiez votre connexion.';
}

// =============================================================================
// COMPOSANTS D'INTERFACE
// =============================================================================

// Composant pour le fil d'Ariane
function Breadcrumb({ onBack }: { onBack: () => void }) {
    return (
        <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
            <button
                onClick={onBack}
                className="hover:text-yellow-400 transition-colors duration-200"
            >
                Dashboard
            </button>
            <span className="text-gray-600">/</span>
            <span className="text-yellow-400 font-medium">Créer un quiz</span>
        </nav>
    );
}

// Composant pour l'en-tête de la page
function CreateQuizHeader() {
    return (
        <div className="mb-8">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                Créer un nouveau quiz
            </h1>
            <p className="text-gray-300 text-lg">
                Créez votre quiz en quelques étapes simples
            </p>
        </div>
    );
}

// Composant pour afficher les messages d'erreur
function ErrorMessage({ message }: { message: string | null }) {
    if (!message) return null;
    
    return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="text-sm">{message}</p>
        </div>
    );
}

// Composant pour le champ de formulaire
function FormField({ 
    label, 
    id, 
    type, 
    placeholder, 
    error, 
    disabled, 
    register,
    fieldName,
    validation,
    maxLength,
    isRequired = false
}: {
    label: string;
    id: string;
    type: string;
    placeholder: string;
    error: { message?: string } | undefined;
    disabled: boolean;
    register: unknown;
    fieldName: string;
    validation: object;
    maxLength?: number;
    isRequired?: boolean;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-medium">
                {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
                id={id}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                className={`border border-black focus:ring-amber-500 focus:border-amber-500 ${
                    error ? 'border-red-500' : ''
                }`}
                {...(register as (name: string, options?: object) => object)(fieldName, validation)}
            />
            {error && (
                <p className="text-sm text-red-600">{error.message}</p>
            )}
            {maxLength && (
                <div className="text-sm text-gray-600">
                    {maxLength} caractères maximum
                </div>
            )}
        </div>
    );
}

// Composant pour le champ textarea
function FormTextarea({ 
    label, 
    id, 
    placeholder, 
    error, 
    disabled, 
    register,
    fieldName,
    validation,
    maxLength,
    rows = 3
}: {
    label: string;
    id: string;
    placeholder: string;
    error: { message?: string } | undefined;
    disabled: boolean;
    register: unknown;
    fieldName: string;
    validation: object;
    maxLength?: number;
    rows?: number;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-medium">
                {label}
            </Label>
            <Textarea
                id={id}
                placeholder={placeholder}
                rows={rows}
                disabled={disabled}
                maxLength={maxLength}
                className={`border border-black focus:ring-amber-500 focus:border-amber-500 ${
                    error ? 'border-red-500' : ''
                }`}
                {...(register as (name: string, options?: object) => object)(fieldName, validation)}
            />
            {error && (
                <p className="text-sm text-red-600">{error.message}</p>
            )}
            {maxLength && (
                <div className="text-sm text-gray-600">
                    {maxLength} caractères maximum (optionnel)
                </div>
            )}
        </div>
    );
}

// Composant pour les boutons d'action
function ActionButtons({ 
    isSubmitting, 
    onCancel 
}: { 
    isSubmitting: boolean; 
    onCancel: () => void;
}) {
    return (
        <div className="flex gap-4 pt-4">
            <Button
                type="button"
                onClick={onCancel}
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
                        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Création...
                    </>
                ) : (
                    'Créer le quiz'
                )}
            </Button>
        </div>
    );
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

function CreateQuizPage() {
    const navigate = useNavigate();
    
    // État pour gérer les erreurs globales
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Configuration de React Hook Form - SIMPLIFIÉE
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        clearErrors,
        setError
    } = useForm<CreateQuizFormData>({
        mode: 'onChange',
        defaultValues: { title: '', description: '' }
    });

    // Fonction pour naviguer vers la page admin
    const handleBackToAdmin = (): void => {
        navigate('/admin');
    };

    // Fonction de soumission simplifiée
    const onSubmit = async (data: CreateQuizFormData): Promise<void> => {
        // Nettoyer les erreurs précédentes
        setGlobalError(null);
        clearErrors();

        // Validation côté client
        const titleError = validateTitle(data.title);
        const descriptionError = validateDescription(data.description);

        if (titleError) {
            setError('title', { type: 'manual', message: titleError });
            return;
        }

        if (descriptionError) {
            setError('description', { type: 'manual', message: descriptionError });
            return;
        }

        try {
            // Vérifier si l'utilisateur est connecté
            const token = AuthService.getToken();
            if (!token) {
                setGlobalError('Vous devez être connecté pour créer un quiz');
                return;
            }

            // Préparer les données à envoyer
            const dataToSend: QuizDataToSend = {
                titre: data.title.trim(),
                description: data.description.trim(),
                estActif: true,
                estDemarre: false,
                scorePassage: 70
            };

            // Envoyer la requête à l'API
            const response = await axios.post<QuizResponse>(
                `${import.meta.env.VITE_API_BASE_URL}/api/questionnaires`,
                dataToSend,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const createdQuiz = response.data;

            // Afficher le succès avec toast
            toast.success('Quiz créé avec succès !');

            // Afficher le code d'accès si disponible
            if (createdQuiz.uniqueCode) {
                setTimeout(() => {
                    toast.success(`Code d'accès : ${createdQuiz.uniqueCode}`, {
                        duration: 10000,
                        icon: '📋'
                    });
                }, 1000);
            }

            // Rediriger vers la page de gestion des questions du quiz créé
            setTimeout(() => {
                navigate(`/manage-questions/${createdQuiz.id}`);
            }, 2000);

        } catch (error) {
            // Gérer les erreurs
            const errorMessage = handleCreateQuizError(error);
            setGlobalError(errorMessage);
        }
    };



    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Fil d'Ariane */}
            <Breadcrumb onBack={handleBackToAdmin} />

            {/* En-tête de la page */}
            <CreateQuizHeader />

            {/* Contenu principal */}
            <div className="max-w-2xl mx-auto">
                <Card className="bg-gray-100 text-gray-900">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">
                            Créer un nouveau quiz
                        </CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                        {/* Message d'erreur global */}
                        <ErrorMessage message={globalError} />

                        {/* Formulaire */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
                            {/* Champ titre */}
                            <FormField
                                label="Titre du quiz"
                                id="title"
                                type="text"
                                placeholder="Ex: Quiz de culture générale"
                                error={errors.title}
                                disabled={isSubmitting}
                                register={register}
                                fieldName="title"
                                validation={{
                                    required: 'Le titre est obligatoire',
                                    maxLength: {
                                        value: 100,
                                        message: 'Le titre ne peut pas dépasser 100 caractères'
                                    }
                                }}
                                maxLength={100}
                                isRequired={true}
                            />

                            {/* Champ description */}
                            <FormTextarea
                                label="Description"
                                id="description"
                                placeholder="Description optionnelle du quiz"
                                error={errors.description}
                                disabled={isSubmitting}
                                register={register}
                                fieldName="description"
                                validation={{
                                    maxLength: {
                                        value: 500,
                                        message: 'La description ne peut pas dépasser 500 caractères'
                                    }
                                }}
                                maxLength={500}
                            />

                            {/* Boutons d'action */}
                            <ActionButtons 
                                isSubmitting={isSubmitting} 
                                onCancel={handleBackToAdmin} 
                            />
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default CreateQuizPage;