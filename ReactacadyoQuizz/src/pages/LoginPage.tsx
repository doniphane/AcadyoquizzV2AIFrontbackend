import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../store/authStore';

// Import des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Import des types et schéma de validation
import type { 
    LocationState,
    LoginFormData
} from '../types/login';
import { loginFormSchema } from '../types/login';

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

function LoginPage() {
    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // Hook pour récupérer les informations de l'URL
    const location = useLocation();

    // Utilise le store d'authentification
    const { login, isLoading, error, clearError, isAdmin, isStudent } = useAuth();

    // Configuration de React Hook Form avec Zod
    // Ce hook gère automatiquement la validation et l'état du formulaire
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        clearErrors,
        setError
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginFormSchema),
        mode: 'onChange' // Valide à chaque changement
    });

    // Effet pour afficher les messages d'erreur d'accès non autorisé et les messages de succès
    useEffect(() => {
        // Vérifie s'il y a un message d'erreur dans l'état de navigation
        if (location.state && (location.state as LocationState).error) {
            // Note: Le store gère déjà les erreurs, mais on peut afficher ce message spécifique
        }
        
        // Vérifie s'il y a un message de succès (après inscription)
        if (location.state && (location.state as LocationState & { successMessage?: string }).successMessage) {
            // Le message de succès sera affiché dans le JSX
        }
    }, [location.state]);

    // Fonction appelée quand l'utilisateur soumet le formulaire
    // Cette fonction gère la connexion et la redirection selon le rôle :
    // - ROLE_ADMIN → /admin
    // - ROLE_USER → /student
    // - Autres rôles → /student (par défaut)
    const onSubmit = async (data: LoginFormData): Promise<void> => {
        clearError();
        clearErrors();

        try {
            const success = await login(data.email, data.password);

            if (success) {
                const fromLocation: Location | string | undefined = location.state?.from;

                if (fromLocation) {
                    let targetPath: string;

                    if (typeof fromLocation === 'string') {
                        targetPath = fromLocation;
                    } else {
                        const locationObj = fromLocation as Location;
                        targetPath = locationObj.pathname + locationObj.search;
                    }

                    if (targetPath.startsWith('/admin') && !isAdmin()) {
                        if (isStudent()) {
                            navigate('/student', { replace: true });
                        } else {
                            navigate('/student', { replace: true });
                        }
                    } else if (targetPath.startsWith('/student') && !isStudent() && !isAdmin()) {
                        if (isAdmin()) {
                            navigate('/admin', { replace: true });
                        } else {
                            navigate('/student', { replace: true });
                        }
                    } else {
                        navigate(targetPath, { replace: true });
                    }
                } else {
                    if (isAdmin()) {
                        navigate('/admin');
                    } else if (isStudent()) {
                        navigate('/student');
                    } else {
                        navigate('/student');
                    }
                }
            }
        } catch (err) {
            const error = err as { response?: { status: number } };
            if (error.response) {
                const status = error.response.status;
                if (status === 401) {
                    clearError();
                    setError('email', { type: 'manual', message: 'Identifiants incorrects. Veuillez réessayer.' });
                } else if (status === 500) {
                    clearError();
                    setError('email', { type: 'manual', message: 'Erreur interne du serveur. Veuillez réessayer plus tard.' });
                } else {
                    clearError();
                    setError('email', { type: 'manual', message: `Erreur inattendue : ${status}. Veuillez contacter le support.` });
                }
            } else {
                clearError();
                setError('email', { type: 'manual', message: 'Erreur réseau. Veuillez vérifier votre connexion.' });
            }
        }
    };

    // Fonction pour naviguer vers la page d'inscription
    const handleNavigateToRegister = (): void => {
        navigate('/register');
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: '#18191D' }}>
            {/* Section de gauche - Fond sombre avec logo */}
            <div className="hidden xl:flex w-1/2 items-center justify-end pr-16">
                <div className="text-center">
                    <h1 className="text-5xl font-bold mb-4">
                        <span className="text-white">Acadyo</span>
                        <span className="text-amber-500"> Quiz</span>
                    </h1>
                    <p className="text-white text-xl">Plateforme de quiz</p>
                </div>
            </div>

            {/* Section de droite - Formulaire de connexion */}
            <div className="w-full xl:w-1/2 flex items-center justify-center p-6 xl:justify-start xl:pl-16">
                <Card className="w-full max-w-md border-2 border-amber-500 shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Connexion
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Accédez à votre espace
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Message d'erreur du store */}
                        {error && (
                            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Message de succès après inscription */}
                        {location.state && (location.state as LocationState & { successMessage?: string }).successMessage && (
                            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                <p className="text-sm font-medium">{(location.state as LocationState & { successMessage?: string }).successMessage}</p>
                            </div>
                        )}

                        {/* Formulaire avec React Hook Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Champ email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="Entrez votre email"
                                    disabled={isLoading || isSubmitting}
                                    className={`focus:ring-amber-500 focus:border-amber-500 ${
                                        errors.email ? 'border-red-500' : ''
                                    }`}
                                    {...register('email')}
                                />
                                {/* Message d'erreur de validation pour l'email */}
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Champ mot de passe */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="Entrez votre mot de passe"
                                    disabled={isLoading || isSubmitting}
                                    className={`focus:ring-amber-500 focus:border-amber-500 ${
                                        errors.password ? 'border-red-500' : ''
                                    }`}
                                    {...register('password')}
                                />
                                {/* Message d'erreur de validation pour le mot de passe */}
                                {errors.password && (
                                    <p className="text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Bouton de connexion */}
                            <Button
                                type="submit"
                                disabled={isLoading || isSubmitting}
                                className="w-full bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
                            >
                                {(isLoading || isSubmitting) ? (
                                    <>
                                        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connexion en cours...
                                    </>
                                ) : (
                                    <>
                                        Se Connecter
                                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Lien d'inscription */}
                        <div className="text-center pt-4">
                            <p className="text-sm text-gray-600">
                                Pas de compte ?{' '}
                                <Button
                                    variant="link"
                                    className="p-0 h-auto font-medium text-amber-500 hover:text-amber-600"
                                    onClick={handleNavigateToRegister}
                                >
                                    S'inscrire
                                </Button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default LoginPage;