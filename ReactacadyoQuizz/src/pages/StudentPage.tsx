
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { AxiosError } from 'axios';

// Import des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import des icônes Lucide React
import { LogOut, AlertCircle, User, BookOpen, History, Menu, X } from 'lucide-react';

// Import du service d'authentification et du store
import AuthService from '../services/AuthService';
import { useAuth } from '../store/authStore';

// Interface pour les données du formulaire
interface StudentFormData {
    firstName: string;
    lastName: string;
    quizCode: string;
}

// Interface pour les informations du quiz
interface QuizInfo {
    id: number;
    titre: string;
    description?: string;
    estActif: boolean;
    estDemarre: boolean;
    codeAcces: string;
    scorePassage?: number;
    questions?: unknown[];
}

// URL de base de l'API
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

// =============================================================================
// COMPOSANTS D'INTERFACE
// =============================================================================

// Composant pour le champ de formulaire
function FormField({ 
    label, 
    id, 
    type, 
    placeholder, 
    autoComplete, 
    error, 
    disabled, 
    register,
    fieldName,
    validation,
    maxLength,
    className = ""
}: {
    label: string;
    id: string;
    type: string;
    placeholder: string;
    autoComplete: string;
    error: { message?: string } | undefined;
    disabled: boolean;
    register: unknown;
    fieldName: string;
    validation: object;
    maxLength?: number;
    className?: string;
}) {
    return (
        <div>
            <Label htmlFor={id} className="text-sm font-medium">
                {label}
            </Label>
            <Input
                id={id}
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                className={`mt-1 border-black border-2 ${error ? 'border-red-500' : ''} ${className}`}
                {...(register as (name: string, options?: object) => object)(fieldName, validation)}
            />
            {error && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span>{error.message}</span>
                </div>
            )}
        </div>
    );
}

// Composant pour le bouton de soumission
function SubmitButton({ isDisabled, isLoading }: { isDisabled: boolean; isLoading: boolean }) {
    return (
        <Button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 text-lg disabled:opacity-50"
            disabled={isDisabled || isLoading}
        >
            {isLoading ? 'Vérification...' : 'Commencer le quiz'}
        </Button>
    );
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

function StudentPage() {
    const navigate = useNavigate();
    
    // Récupérer les données de l'utilisateur connecté
    const { user } = useAuth();

    // Configuration de React Hook Form - SIMPLIFIÉE
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        clearErrors,
        setValue
    } = useForm<StudentFormData>({
        defaultValues: { firstName: '', lastName: '', quizCode: '' }
    });

    // État pour le chargement
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // État pour le menu mobile
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Pré-remplir les champs avec les données de l'utilisateur connecté
    useEffect(() => {
        if (user && user.id) {
            // Utiliser les champs prenom/nom du type User
            const firstName = user.prenom || '';
            const lastName = user.nom || '';
            
            // Vérifier si les champs ne sont pas déjà remplis
            if (firstName || lastName) {
                setValue('firstName', firstName);
                setValue('lastName', lastName);
            }
        }
    }, [user, setValue]);

    // Fonction de soumission simplifiée
    const onSubmit = async (data: StudentFormData): Promise<void> => {
        clearErrors();
        setIsLoading(true);

        try {
            // Récupérer le token d'authentification
            const token = AuthService.getToken();
            if (!token) {
                setError('quizCode', { type: 'manual', message: 'Vous devez être connecté pour participer à un quiz' });
                return;
            }

            // Appeler l'API pour vérifier le code du quiz
            const response = await axios.get<QuizInfo>(`${API_BASE_URL}/api/public/questionnaires/code/${data.quizCode.toUpperCase()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const quizData: QuizInfo = response.data;

            // Vérifier que le quiz est actif
            if (!quizData.estActif) {
                setError('quizCode', { type: 'manual', message: 'Ce quiz n\'est pas actif pour le moment' });
                return;
            }

            // Navigation vers la page du quiz
            navigate('/take-quiz', {
                state: {
                    participantData: {
                        firstName: data.firstName.trim(),
                        lastName: data.lastName.trim(),
                        quizCode: data.quizCode.toUpperCase()
                    },
                    quizInfo: quizData
                }
            });

        } catch (error) {
            // Gérer les erreurs de l'API
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                const status: number = axiosError.response.status;
                let message = '';
                
                switch (status) {
                    case 404:
                        message = 'Code de quiz invalide ou quiz non trouvé';
                        break;
                    case 403:
                        message = 'Accès refusé à ce quiz';
                        break;
                    case 429:
                        message = 'Trop de tentatives. Veuillez patienter quelques minutes';
                        break;
                    default:
                        message = 'Erreur lors de la vérification du code. Veuillez réessayer';
                }
                
                setError('quizCode', { type: 'manual', message });
            } else {
                setError('quizCode', { type: 'manual', message: 'Erreur lors de la vérification du code. Veuillez réessayer' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour gérer la déconnexion
    const handleLogout = async (): Promise<void> => {
        try {
            await AuthService.logout();
            navigate('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            navigate('/login');
        }
    };

    // Fonction pour naviguer vers l'historique
    const handleNavigateToHistory = (): void => {
        navigate('/student-history');
    };

    // Fonction pour basculer le menu mobile
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8">
                {/* Titre et sous-titre */}
                <div>
                    <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                        Espace Élève
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Bonjour {user?.prenom || 'Étudiant'} !
                    </p>
                </div>

                {/* Bouton hamburger pour mobile */}
                <div className="md:hidden">
                    <button
                        onClick={toggleMobileMenu}
                        className="text-white focus:outline-none"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Boutons d'action pour desktop */}
                <div className="hidden md:flex gap-3">
                    <Button
                        onClick={handleNavigateToHistory}
                        className="bg-white hover:bg-yellow-600 text-gray-900 px-6 py-3"
                    >
                        <History className="w-4 h-4 mr-2" />
                        Mon Historique
                    </Button>
                    <Button
                        onClick={handleLogout}
                        className="bg-white hover:bg-yellow-600 text-gray-900 px-6 py-3"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                    </Button>
                </div>
            </div>

            {/* Menu mobile */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-gray-800 p-4 rounded-lg space-y-4">
                    <Button
                        onClick={handleNavigateToHistory}
                        className="w-full bg-white hover:bg-yellow-600 text-gray-900 px-6 py-3"
                    >
                        <History className="w-4 h-4 mr-2" />
                        Mon Historique
                    </Button>
                    <Button
                        onClick={handleLogout}
                        className="w-full bg-white hover:bg-yellow-600 text-gray-900 px-6 py-3"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                    </Button>
                </div>
            )}

            {/* Section principale */}
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Carte Vos Informations */}
                <Card className="bg-gray-100 text-gray-900">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg font-bold">
                            <User className="w-5 h-5 mr-2" />
                            Vos Informations
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Vos informations sont pré-remplies depuis votre profil
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Champ Prénom */}
                            <FormField
                                label="Prénom"
                                id="first_name"
                                type="text"
                                placeholder="Prénom"
                                autoComplete="given-name"
                                error={errors.firstName}
                                disabled={isSubmitting || isLoading}
                                register={register}
                                fieldName="firstName"
                                validation={{
                                    required: 'Prénom requis',
                                    minLength: {
                                        value: 2,
                                        message: 'Minimum 2 caractères'
                                    },
                                    maxLength: {
                                        value: 50,
                                        message: 'Maximum 50 caractères'
                                    },
                                    pattern: {
                                        value: /^[a-zA-ZÀ-ÿ\s\-'.]+$/,
                                        message: 'Seules les lettres, espaces, tirets et apostrophes sont autorisés'
                                    }
                                }}
                                maxLength={50}
                            />

                            {/* Champ Nom */}
                            <FormField
                                label="Nom"
                                id="last_name"
                                type="text"
                                placeholder="Nom"
                                autoComplete="family-name"
                                error={errors.lastName}
                                disabled={isSubmitting || isLoading}
                                register={register}
                                fieldName="lastName"
                                validation={{
                                    required: 'Nom requis',
                                    minLength: {
                                        value: 2,
                                        message: 'Minimum 2 caractères'
                                    },
                                    maxLength: {
                                        value: 50,
                                        message: 'Maximum 50 caractères'
                                    },
                                    pattern: {
                                        value: /^[a-zA-ZÀ-ÿ\s\-'.]+$/,
                                        message: 'Seules les lettres, espaces, tirets et apostrophes sont autorisés'
                                    }
                                }}
                                maxLength={50}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Carte Code du Quiz */}
                <Card className="bg-gray-100 text-gray-900">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg font-bold">
                            <BookOpen className="w-5 h-5 mr-2" />
                            Code du Quiz
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Entrez le code fourni par votre professeur
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit(onSubmit)} noValidate>
                            {/* Champ Code du Quiz */}
                            <div className="mb-4">
                                <FormField
                                    label="Code du Quiz *"
                                    id="quiz_code"
                                    type="text"
                                    placeholder="Entrez le code du quiz"
                                    autoComplete="off"
                                    error={errors.quizCode}
                                    disabled={isSubmitting || isLoading}
                                    register={register}
                                    fieldName="quizCode"
                                    validation={{
                                        required: 'Code du quiz requis',
                                        minLength: {
                                            value: 6,
                                            message: 'Le code doit contenir exactement 6 caractères'
                                        },
                                        maxLength: {
                                            value: 6,
                                            message: 'Le code doit contenir exactement 6 caractères'
                                        },
                                        pattern: {
                                            value: /^[A-Z0-9]{6}$/,
                                            message: 'Le code ne peut contenir que des lettres majuscules et des chiffres'
                                        }
                                    }}
                                    maxLength={6}
                                    className="uppercase"
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    Code à 6 caractères fourni par votre professeur
                                </div>
                            </div>

                            {/* Bouton Commencer le Quiz */}
                            <SubmitButton isDisabled={isSubmitting} isLoading={isLoading} />
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default StudentPage;