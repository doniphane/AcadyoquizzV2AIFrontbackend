import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
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
    ApiErrorResponse,
    RegisterFormData
} from '../types/register';
import { registerFormSchema } from '../types/register';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

function RegisterPage() {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        clearErrors
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerFormSchema),
        mode: 'onChange',
        defaultValues: { email: '', password: '' }
    });

    const setCustomError = useCallback((field: keyof RegisterFormData, message: string): void => {
        setError(field, { type: 'manual', message });
    }, [setError]);

    const handleApiError = useCallback((error: AxiosError<ApiErrorResponse>): void => {
        if (error.response) {
            const status: number = error.response.status;
            const data: ApiErrorResponse = error.response.data;

            if (status === 409) {
                setCustomError('email', "Cet email est déjà utilisé par un autre compte");
            } else if (status === 422) {
                if (data && data.violations) {
                    const messages: string = data.violations.map((v) => v.message).join(', ');
                    setCustomError('email', messages);
                } else if (data && data.detail) {
                    setCustomError('email', data.detail);
                } else {
                    setCustomError('email', "Les données du formulaire ne sont pas valides");
                }
            } else if (status === 400) {
                setCustomError('email', "Données invalides. Vérifiez votre saisie.");
            } else if (status === 404) {
                setCustomError('email', "La route d'inscription n'est pas disponible");
            } else if (status === 500) {
                setCustomError('email', "Erreur interne du serveur. Veuillez réessayer plus tard.");
            } else {
                setCustomError('email', data?.message || data?.detail || "Erreur lors de la création du compte");
            }
        } else if (error.request) {
            setCustomError('email', "Problème de connexion au serveur. Veuillez réessayer.");
        } else {
            setCustomError('email', "Une erreur est survenue. Veuillez réessayer plus tard.");
        }
    }, [setCustomError]);

    const onSubmit = useCallback(async (data: RegisterFormData): Promise<void> => {
        clearErrors();

        const userData: UserData = {
            email: data.email.trim(),
            password: data.password
        };

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
                setCustomError('email', "Erreur lors de la création du compte");
            }
        } catch (error) {
            handleApiError(error as AxiosError<ApiErrorResponse>);
        }
    }, [clearErrors, handleApiError, navigate, setCustomError]);

    const goToLoginPage = useCallback((): void => {
        navigate('/login');
    }, [navigate]);

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: "#18191D" }}>
            <div className="hidden xl:flex w-1/2 items-center justify-end pr-16">
                <div className="text-center">
                    <h1 className="text-5xl font-bold mb-4">
                        <span className="text-white">Acadyo</span>
                        <span className="text-amber-500"> Quiz</span>
                    </h1>
                </div>
            </div>

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
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="Entrez votre email"
                                        disabled={isSubmitting}
                                        className={`focus:ring-amber-500 focus:border-amber-500 ${
                                            errors.email ? 'border-red-500' : ''
                                        }`}
                                        {...register('email')}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-600">{errors.email.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Mot de passe</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="Entrez votre mot de passe"
                                        disabled={isSubmitting}
                                        className={`focus:ring-amber-500 focus:border-amber-500 ${
                                            errors.password ? 'border-red-500' : ''
                                        }`}
                                        {...register('password')}
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-600">{errors.password.message}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
                                >
                                    {isSubmitting ? (
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
                            </form>
                        </CardContent>
                    </Card>

                    <div className="mt-6 text-center">
                        <p className="text-white text-sm">
                            Déjà un compte ?{" "}
                            <Button
                                variant="link"
                                className="p-0 h-auto text-amber-500 hover:text-amber-400 font-medium underline"
                                onClick={goToLoginPage}
                                disabled={isSubmitting}
                            >
                                Se connecter
                            </Button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;