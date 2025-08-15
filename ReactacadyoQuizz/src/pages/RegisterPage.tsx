// RegisterPage.tsx
// Page d'inscription simplifiée avec React Hook Form uniquement

import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight } from 'lucide-react';

import type { 
    UserData,
    RegistrationSuccessResponse,
    ApiErrorResponse
} from '../types/register';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

// Interface pour les données du formulaire - AJOUTÉE firstName et lastName
interface RegisterFormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

// Fonction pour gérer les erreurs API de manière simplifiée
function handleApiError(
    error: AxiosError<ApiErrorResponse>, 
    setError: (field: keyof RegisterFormData, options: { type: string; message: string }) => void,
    clearErrors: (fields?: (keyof RegisterFormData)[]) => void
): void {
    // Nettoyer les erreurs existantes avant d'en afficher une nouvelle
    clearErrors(['firstName', 'lastName', 'email', 'password']);
    
    if (!error.response) {
        setError('email', { type: 'manual', message: 'Problème de connexion au serveur. Veuillez réessayer.' });
        return;
    }

    const status = error.response.status;
    const data = error.response.data;
    
    let message = '';
    
    switch (status) {
        case 409:
            message = "Cet email est déjà utilisé par un autre compte";
            break;
        case 422:
            if (data?.violations) {
                message = data.violations.map((v) => v.message).join(', ');
            } else if (data?.detail) {
                message = data.detail;
            } else {
                message = "Les données du formulaire ne sont pas valides";
            }
            break;
        case 400:
            message = "Données invalides. Vérifiez votre saisie.";
            break;
        case 404:
            message = "La route d'inscription n'est pas disponible";
            break;
        case 500:
            message = "Erreur interne du serveur. Veuillez réessayer plus tard.";
            break;
        default:
            message = data?.message || data?.detail || "Erreur lors de la création du compte";
    }
    
    setError('email', { type: 'manual', message });
}

// Fonction pour créer les données utilisateur - MODIFIÉE pour inclure firstName et lastName
function createUserData(data: RegisterFormData): UserData {
    return {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        password: data.password
    };
}

// =============================================================================
// COMPOSANTS D'INTERFACE
// =============================================================================

// Composant pour l'en-tête de la page
function RegisterHeader() {
    return (
        <div className="hidden xl:flex w-1/2 items-center justify-end pr-16">
            <div className="text-center">
                <h1 className="text-5xl font-bold mb-4">
                    <span className="text-white">Acadyo</span>
                    <span className="text-amber-500"> Quiz</span>
                </h1>
            </div>
        </div>
    );
}

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
    validation
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
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                disabled={disabled}
                className={`focus:ring-amber-500 focus:border-amber-500 ${
                    error ? 'border-red-500' : ''
                }`}
                {...(register as (name: string, options?: object) => object)(fieldName, validation)}
            />
            {error && (
                <p className="text-sm text-red-600">{error.message}</p>
            )}
        </div>
    );
}

// Composant pour le bouton d'inscription
function RegisterButton({ isDisabled }: { isDisabled: boolean }) {
    return (
        <Button
            type="submit"
            disabled={isDisabled}
            className="w-full bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
        >
            {isDisabled ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                </>
            ) : (
                <>
                    S'inscrire
                    <ArrowRight className="ml-2 h-4 w-4" />
                </>
            )}
        </Button>
    );
}

// Composant pour le lien de connexion
function LoginLink({ onNavigate, isDisabled }: { onNavigate: () => void; isDisabled: boolean }) {
    return (
        <div className="mt-6 text-center">
            <p className="text-white text-sm">
                Déjà un compte ?{" "}
                <Button
                    variant="link"
                    className="p-0 h-auto text-amber-500 hover:text-amber-400 font-medium underline"
                    onClick={onNavigate}
                    disabled={isDisabled}
                >
                    Se connecter
                </Button>
            </p>
        </div>
    );
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

function RegisterPage() {
    const navigate = useNavigate();

    // Configuration de React Hook Form - MODIFIÉE pour inclure firstName et lastName
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        clearErrors
    } = useForm<RegisterFormData>({
        defaultValues: { firstName: '', lastName: '', email: '', password: '' }
    });

    // Fonction de soumission simplifiée
    const onSubmit = async (data: RegisterFormData): Promise<void> => {
        clearErrors();

        const userData = createUserData(data);

        try {
            const response: AxiosResponse<RegistrationSuccessResponse> = await axios.post<RegistrationSuccessResponse>(
                `${API_BASE_URL}/api/register`, 
                userData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 201 || response.status === 200) {
                navigate('/login', { 
                    state: { 
                        successMessage: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.' 
                    } 
                });
            } else {
                setError('email', { type: 'manual', message: "Erreur lors de la création du compte" });
            }
        } catch (error) {
            handleApiError(error as AxiosError<ApiErrorResponse>, setError, clearErrors);
        }
    };

    // Navigation vers la page de connexion
    const goToLoginPage = (): void => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: "#18191D" }}>
            {/* Section de gauche - Logo */}
            <RegisterHeader />

            {/* Section de droite - Formulaire */}
            <div className="w-full xl:w-1/2 flex items-center justify-center p-6 xl:justify-start xl:pl-16">
                <div className="w-full max-w-md">
                    <Card className="bg-white rounded-lg border-2 border-amber-500 shadow-2xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold text-gray-900">
                                Inscription
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Créez votre compte pour accéder au Quiz de Acadyo
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {/* Champs prénom et nom - NOUVEAUX */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Champ prénom */}
                                    <FormField
                                        label="Prénom"
                                        id="firstName"
                                        type="text"
                                        placeholder="Votre prénom"
                                        autoComplete="given-name"
                                        error={errors.firstName}
                                        disabled={isSubmitting}
                                        register={register}
                                        fieldName="firstName"
                                        validation={{
                                            required: 'Prénom requis',
                                            minLength: {
                                                value: 2,
                                                message: 'Le prénom doit contenir au moins 2 caractères'
                                            },
                                            maxLength: {
                                                value: 255,
                                                message: 'Le prénom ne peut pas dépasser 255 caractères'
                                            },
                                            pattern: {
                                                value: /^[a-zA-ZÀ-ÿ\s'-]+$/u,
                                                message: 'Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets'
                                            }
                                        }}
                                    />

                                    {/* Champ nom */}
                                    <FormField
                                        label="Nom"
                                        id="lastName"
                                        type="text"
                                        placeholder="Votre nom"
                                        autoComplete="family-name"
                                        error={errors.lastName}
                                        disabled={isSubmitting}
                                        register={register}
                                        fieldName="lastName"
                                        validation={{
                                            required: 'Nom requis',
                                            minLength: {
                                                value: 2,
                                                message: 'Le nom doit contenir au moins 2 caractères'
                                            },
                                            maxLength: {
                                                value: 255,
                                                message: 'Le nom ne peut pas dépasser 255 caractères'
                                            },
                                            pattern: {
                                                value: /^[a-zA-ZÀ-ÿ\s'-]+$/u,
                                                message: 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'
                                            }
                                        }}
                                    />
                                </div>

                                {/* Champ email */}
                                <FormField
                                    label="Email"
                                    id="email"
                                    type="email"
                                    placeholder="Entrez votre email"
                                    autoComplete="email"
                                    error={errors.email}
                                    disabled={isSubmitting}
                                    register={register}
                                    fieldName="email"
                                    validation={{
                                        required: 'Email requis',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Email invalide'
                                        },
                                        maxLength: {
                                            value: 180,
                                            message: 'L\'email ne peut pas dépasser 180 caractères'
                                        }
                                    }}
                                />

                                {/* Champ mot de passe */}
                                <FormField
                                    label="Mot de passe"
                                    id="password"
                                    type="password"
                                    placeholder="Entrez votre mot de passe"
                                    autoComplete="new-password"
                                    error={errors.password}
                                    disabled={isSubmitting}
                                    register={register}
                                    fieldName="password"
                                    validation={{
                                        required: 'Mot de passe requis',
                                        minLength: {
                                            value: 6,
                                            message: 'Le mot de passe doit contenir au moins 6 caractères'
                                        },
                                        maxLength: {
                                            value: 255,
                                            message: 'Le mot de passe ne peut pas dépasser 255 caractères'
                                        },
                                        pattern: {
                                            value: /^(?=.*[a-zA-Z])(?=.*\d)/,
                                            message: 'Le mot de passe doit contenir au moins une lettre et un chiffre'
                                        }
                                    }}
                                />

                                {/* Bouton d'inscription */}
                                <RegisterButton isDisabled={isSubmitting} />
                            </form>
                        </CardContent>
                    </Card>

                    {/* Lien de connexion */}
                    <LoginLink onNavigate={goToLoginPage} isDisabled={isSubmitting} />
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;