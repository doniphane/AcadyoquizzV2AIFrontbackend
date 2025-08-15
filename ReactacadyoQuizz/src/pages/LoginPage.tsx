
import { useNavigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../store/authStore';
import AuthService from '../services/AuthService';

// Import des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Types locaux pour la navigation
interface LocationState {
    from?: Location;
    error?: string;
    successMessage?: string;
}

// Interface pour les données du formulaire
interface LoginFormData {
    email: string;
    password: string;
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

// Fonction pour déterminer la page de destination selon le rôle
function getDestinationPage(isAdmin: boolean, isStudent: boolean): string {
    if (isAdmin) return '/admin';
    if (isStudent) return '/student';
    return '/student'; // Page par défaut
}

// Fonction pour gérer les erreurs de connexion
function handleLoginError(
    error: unknown, 
    setError: (field: 'email' | 'password', options: { type: string; message: string }) => void, 
    clearError: () => void,
    clearErrors: (fields?: ('email' | 'password')[]) => void
): void {
    clearError();
    // Nettoyer les erreurs existantes avant d'en afficher une nouvelle
    clearErrors(['email', 'password']);
    
    // Type guard pour vérifier si l'erreur a une propriété response
    if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error as { response: { status: number } };
        const status = errorResponse.response.status;
        let message = '';
        
        switch (status) {
            case 401:
                message = 'Identifiants incorrects. Veuillez réessayer.';
                break;
            case 500:
                message = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
                break;
            default:
                message = `Erreur inattendue : ${status}. `;
        }
        
        setError('email', { type: 'manual', message });
    } else {
        setError('email', { type: 'manual', message: 'Erreur réseau. Veuillez vérifier votre connexion.' });
    }
}

// Fonction pour obtenir le chemin de redirection après connexion
function getRedirectPath(location: Location, isAdmin: boolean, isStudent: boolean): string {
    const fromLocation = location.state?.from;
    
    if (!fromLocation) {
        return getDestinationPage(isAdmin, isStudent);
    }
    
    // Convertir la location en chemin string
    const targetPath = typeof fromLocation === 'string' 
        ? fromLocation 
        : fromLocation.pathname + fromLocation.search;
    
    // Vérifier si l'utilisateur a accès à la page demandée
    if (targetPath.startsWith('/admin') && !isAdmin) {
        return getDestinationPage(isAdmin, isStudent);
    }
    
    if (targetPath.startsWith('/student') && !isStudent && !isAdmin) {
        return getDestinationPage(isAdmin, isStudent);
    }
    
    return targetPath;
}

// =============================================================================
// COMPOSANTS D'INTERFACE
// =============================================================================

// Composant pour l'en-tête de la page
function LoginHeader() {
    return (
        <div className="hidden xl:flex w-1/2 items-center justify-end pr-16">
            <div className="text-center">
                <h1 className="text-5xl font-bold mb-4">
                    <span className="text-white">Acadyo</span>
                    <span className="text-amber-500"> Quiz</span>
                </h1>
                <p className="text-white text-xl">Plateforme de quiz</p>
            </div>
        </div>
    );
}

// Composant pour les messages d'état
function StatusMessages({ 
    error, 
    successMessage, 
    onClearSuccess 
}: { 
    error: string | null; 
    successMessage?: string; 
    onClearSuccess?: () => void;
}) {
    return (
        <>
            {/* Message d'erreur du store */}
            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Message de succès après inscription */}
            {successMessage && (
                <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg relative">
                    <p className="text-sm font-medium pr-8">{successMessage}</p>
                    {onClearSuccess && (
                        <button
                            onClick={onClearSuccess}
                            className="absolute top-2 right-2 text-green-600 hover:text-green-800"
                            type="button"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </>
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

// Composant pour le bouton de connexion
function LoginButton({ isDisabled }: { isDisabled: boolean }) {
    return (
        <Button
            type="submit"
            disabled={isDisabled}
            className="w-full bg-yellow-500 hover:bg-yellow-400 focus:ring-amber-500 text-black font-bold"
        >
            {isDisabled ? (
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
    );
}

// Composant pour le lien d'inscription
function RegisterLink({ onNavigate }: { onNavigate: () => void }) {
    return (
        <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
                Pas de compte ?{' '}
                <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-amber-500 hover:text-amber-600"
                    onClick={onNavigate}
                >
                    S'inscrire
                </Button>
            </p>
        </div>
    );
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isLoading, error, clearError } = useAuth();

    // Configuration de React Hook Form - SIMPLIFIÉE
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        clearErrors,
        setError
    } = useForm<LoginFormData>({
        mode: 'onChange',
        defaultValues: { email: '', password: '' }
    });

    // Récupération du message de succès depuis l'état de navigation
    const successMessage = location.state && 
        (location.state as LocationState & { successMessage?: string }).successMessage;

    // Fonction pour nettoyer le message de succès
    const clearSuccessMessage = (): void => {
        // Nettoyer l'état de navigation pour supprimer le message de succès
        navigate(location.pathname, { replace: true, state: {} });
    };

    // Fonction de soumission simplifiée
    const onSubmit = async (data: LoginFormData): Promise<void> => {
        clearError();
        clearErrors();

        try {
            const success = await login(data.email, data.password);

            if (success) {
                // Récupérer l'utilisateur actuel pour déterminer la redirection
                const currentUser = await AuthService.getCurrentUser();
                const userIsAdmin = currentUser?.roles?.includes('ROLE_ADMIN') || false;
                const userIsStudent = currentUser?.roles?.includes('ROLE_USER') || false;
                
                const redirectPath = getRedirectPath(location, userIsAdmin, userIsStudent);
                navigate(redirectPath, { replace: true });
            }
        } catch (err) {
            handleLoginError(err, setError, clearError, clearErrors);
        }
    };

    // Navigation vers la page d'inscription
    const handleNavigateToRegister = (): void => {
        navigate('/register');
    };

    const isFormDisabled = isLoading || isSubmitting;

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: '#18191D' }}>
            {/* Section de gauche - Logo */}
            <LoginHeader />

            {/* Section de droite - Formulaire */}
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
                        {/* Messages d'état */}
                        <StatusMessages 
                            error={error} 
                            successMessage={successMessage} 
                            onClearSuccess={clearSuccessMessage}
                        />

                        {/* Formulaire */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Champ email */}
                            <FormField
                                label="Email"
                                id="email"
                                type="email"
                                placeholder="Entrez votre email"
                                autoComplete="email"
                                error={errors.email}
                                disabled={isFormDisabled}
                                register={register}
                                fieldName="email"
                                validation={{
                                    required: 'Email requis',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Email invalide'
                                    }
                                }}
                            />

                            {/* Champ mot de passe */}
                            <FormField
                                label="Mot de passe"
                                id="password"
                                type="password"
                                placeholder="Entrez votre mot de passe"
                                autoComplete="current-password"
                                error={errors.password}
                                disabled={isFormDisabled}
                                register={register}
                                fieldName="password"
                                validation={{
                                    required: 'Mot de passe requis',
                                    minLength: {
                                        value: 6,
                                        message: 'Le mot de passe doit contenir au moins 6 caractères'
                                    }
                                }}
                            />

                            {/* Bouton de connexion */}
                            <LoginButton isDisabled={isFormDisabled} />
                        </form>

                        {/* Lien d'inscription */}
                        <RegisterLink onNavigate={handleNavigateToRegister} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default LoginPage;