// Composant de page Student

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
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

// Import du service d'authentification
import AuthService from '../services/AuthService';


// Interface pour les données du participant
interface ParticipantData {
    firstName: string;
    lastName: string;
    quizCode: string;
}

// Interface pour les erreurs de validation
interface ValidationErrors {
    firstName?: string;
    lastName?: string;
    quizCode?: string;
}

// Interface pour les informations du quiz
interface QuizInfo {
    id: number;
    titre: string; // Correspond au champ 'titre' de l'API Symfony
    description?: string;
    estActif: boolean; // Correspond au champ 'estActif' de l'API Symfony
    estDemarre: boolean; // Correspond au champ 'estDemarre' de l'API Symfony
    codeAcces: string; // Correspond au champ 'codeAcces' de l'API Symfony
    scorePassage?: number; // Correspond au champ 'scorePassage' de l'API Symfony
    questions?: unknown[];
}

// Interface pour les données sanitisées à envoyer
interface SanitizedParticipantData {
    firstName: string;
    lastName: string;
    quizCode: string;
}

// Interface pour les props du composant ErrorMessage
interface ErrorMessageProps {
    error?: string;
}


// Utilitaires de validation et sécurité
const ValidationUtils = {
    // Nettoie une chaîne de caractères dangereux
    sanitizeInput: (input: string): string => {
        return input
            .trim()
            .replace(/[<>"'&]/g, '') // Supprime les caractères dangereux pour XSS
            .replace(/\s+/g, ' '); // Normalise les espaces
    },

    // Valide un nom (prénom/nom)
    validateName: (name: string): string | null => {
        const sanitized: string = ValidationUtils.sanitizeInput(name);

        if (!sanitized) {
            return 'Ce champ est obligatoire';
        }

        if (sanitized.length < 2) {
            return 'Minimum 2 caractères requis';
        }

        if (sanitized.length > 50) {
            return 'Maximum 50 caractères autorisés';
        }

        // Regex stricte : lettres, espaces, tirets, apostrophes uniquement
        const nameRegex: RegExp = /^[a-zA-ZÀ-ÿ\s\-'.]+$/;
        if (!nameRegex.test(sanitized)) {
            return 'Seules les lettres, espaces, tirets et apostrophes sont autorisés';
        }

        // Vérifier qu'il n'y a pas que des espaces/caractères spéciaux
        if (!/[a-zA-ZÀ-ÿ]/.test(sanitized)) {
            return 'Le nom doit contenir au moins une lettre';
        }

        return null;
    },

    // Valide le code du quiz
    validateQuizCode: (code: string): string | null => {
        const sanitized: string = code.trim().toUpperCase();

        if (!sanitized) {
            return 'Le code du quiz est obligatoire';
        }

        if (sanitized.length !== 6) {
            return 'Le code doit contenir exactement 6 caractères';
        }

        // Regex stricte : lettres majuscules et chiffres uniquement
        const codeRegex: RegExp = /^[A-Z0-9]{6}$/;
        if (!codeRegex.test(sanitized)) {
            return 'Le code ne peut contenir que des lettres majuscules et des chiffres';
        }

        return null;
    },

    // Échappe les caractères HTML pour éviter XSS
    escapeHtml: (text: string): string => {
        const div: HTMLDivElement = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};


// URL de base de l'API Symfony
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

function StudentPage() {
    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // État pour les données du participant
    const [participantData, setParticipantData] = useState<ParticipantData>({
        firstName: '',
        lastName: '',
        quizCode: ''
    });

    // État pour les erreurs de validation
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    // État pour stocker les informations du quiz (utilisé dans la navigation)
    const [, setQuizInfo] = useState<QuizInfo | null>(null);

    // État pour indiquer si on cherche le quiz
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // État pour l'erreur générale
    const [generalError, setGeneralError] = useState<string>('');

    // État pour gérer l'ouverture du menu mobile
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Fonction pour valider un champ spécifique
    const validateField = (field: keyof ParticipantData, value: string): string | null => {
        switch (field) {
            case 'firstName':
                return ValidationUtils.validateName(value);
            case 'lastName':
                return ValidationUtils.validateName(value);
            case 'quizCode':
                return ValidationUtils.validateQuizCode(value);
            default:
                return null;
        }
    };

    const handleInputChange = (field: keyof ParticipantData, value: string): void => {
        // Limiter la longueur maximale par sécurité
        const maxLengths = {
            firstName: 50,
            lastName: 50,
            quizCode: 6
        };

        if (value.length > maxLengths[field]) {
            return; // Ignore les caractères supplémentaires
        }

        // Sanitiser l'entrée
        let sanitizedValue: string = value;
        if (field === 'quizCode') {
            sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        } else {
            // Pour les noms, permettre seulement les caractères autorisés
            sanitizedValue = value.replace(/[^a-zA-ZÀ-ÿ\s\-'.]/g, '');
        }

        // Mettre à jour les données
        setParticipantData((prev: ParticipantData) => ({
            ...prev,
            [field]: sanitizedValue
        }));

        // Valider le champ et mettre à jour les erreurs
        const error: string | null = validateField(field, sanitizedValue);
        setValidationErrors((prev: ValidationErrors) => ({
            ...prev,
            [field]: error || undefined
        }));

        // Effacer l'erreur générale si l'utilisateur modifie les champs
        if (generalError) {
            setGeneralError('');
        }
    };

    // Fonction pour valider tout le formulaire
    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};
        let isValid: boolean = true;

        // Valider chaque champ
        Object.keys(participantData).forEach((key: string) => {
            const field = key as keyof ParticipantData;
            const error: string | null = validateField(field, participantData[field]);
            if (error) {
                errors[field] = error;
                isValid = false;
            }
        });

        setValidationErrors(errors);
        return isValid;
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

    // Fonction pour gérer la soumission du formulaire
    const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setGeneralError('');

        // Validation complète du formulaire
        if (!validateForm()) {
            setGeneralError('Veuillez corriger les erreurs dans le formulaire');
            return;
        }

        setIsLoading(true);

        try {
            // Sanitiser les données avant l'envoi
            const sanitizedData: SanitizedParticipantData = {
                firstName: ValidationUtils.sanitizeInput(participantData.firstName),
                lastName: ValidationUtils.sanitizeInput(participantData.lastName),
                quizCode: participantData.quizCode.trim().toUpperCase()
            };

            // Récupérer le token d'authentification
            const token = AuthService.getToken();
            if (!token) {
                setGeneralError('Vous devez être connecté pour participer à un quiz');
                return;
            }

            // Appeler l'API pour vérifier le code du quiz avec authentification
            const response = await axios.get<QuizInfo>(`${API_BASE_URL}/api/public/questionnaires/code/${sanitizedData.quizCode}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const quizData: QuizInfo = response.data;

            // Vérifier que le quiz est actif
            if (!quizData.estActif) {
                setGeneralError('Ce quiz n\'est pas actif pour le moment');
                return;
            }

            // Stocker les informations du quiz (pour utilisation future)
            setQuizInfo(quizData);

            // Navigation vers la page du quiz avec les données sanitisées
            navigate('/take-quiz', {
                state: {
                    participantData: sanitizedData,
                    quizInfo: quizData
                }
            });

        } catch (error) {
            // Gérer les erreurs de l'API de manière sécurisée
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                const status: number = axiosError.response.status;
                if (status === 404) {
                    setGeneralError('Code de quiz invalide ou quiz non trouvé');
                } else if (status === 403) {
                    setGeneralError('Accès refusé à ce quiz');
                } else if (status === 429) {
                    setGeneralError('Trop de tentatives. Veuillez patienter quelques minutes');
                } else {
                    setGeneralError('Erreur lors de la vérification du code. Veuillez réessayer');
                }
            } else {
                setGeneralError('Erreur lors de la vérification du code. Veuillez réessayer');
                console.error('Quiz verification error:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour gérer les changements d'input avec types
    const handleFirstNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
        handleInputChange('firstName', e.target.value);
    };

    const handleLastNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
        handleInputChange('lastName', e.target.value);
    };

    const handleQuizCodeChange = (e: ChangeEvent<HTMLInputElement>): void => {
        handleInputChange('quizCode', e.target.value);
    };

    // Fonction pour naviguer vers l'historique
    const handleNavigateToHistory = (): void => {
        navigate('/student-history');
    };

    // Composant pour afficher les erreurs
    const ErrorMessage = ({ error }: ErrorMessageProps) => {
        if (!error) return null;

        return (
            <div className="flex items-center mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span>{ValidationUtils.escapeHtml(error)}</span>
            </div>
        );
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
                        Bonjour Étudiant !
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
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Champ Prénom */}
                            <div>
                                <Label htmlFor="first_name" className="text-sm font-medium ">
                                    Prénom
                                </Label>
                                <Input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    value={participantData.firstName}
                                    onChange={handleFirstNameChange}
                                    className={`mt-1 border-black border-2 ${validationErrors.firstName ? 'border-red-500' : ''}`}
                                    placeholder="Prénom"
                                    maxLength={50}
                                    autoComplete="given-name"
                                />
                                <ErrorMessage error={validationErrors.firstName} />
                            </div>

                            {/* Champ Nom */}
                            <div>
                                <Label htmlFor="last_name" className="text-sm font-medium">
                                    Nom
                                </Label>
                                <Input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    value={participantData.lastName}
                                    onChange={handleLastNameChange}
                                    className={`mt-1 border-black border-2 ${validationErrors.lastName ? 'border-red-500' : ''}`}
                                    placeholder="Nom"
                                    maxLength={50}
                                    autoComplete="family-name"
                                />
                                <ErrorMessage error={validationErrors.lastName} />
                            </div>
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
                        {/* Erreur générale */}
                        {generalError && (
                            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                <div className="flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    <span>{ValidationUtils.escapeHtml(generalError)}</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            {/* Champ Code du Quiz */}
                            <div className="mb-4">
                                <Label htmlFor="quiz_code" className="text-sm font-medium">
                                    Code du Quiz <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="quiz_code"
                                    name="quiz_code"
                                    type="text"
                                    value={participantData.quizCode}
                                    onChange={handleQuizCodeChange}
                                    placeholder="Entrez le code du quizz"
                                    className={`mt-1 uppercase border-black border-2 ${validationErrors.quizCode ? 'border-red-500' : ''}`}
                                    maxLength={6}
                                    style={{ textTransform: 'uppercase' }}
                                    autoComplete="off"
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    Code à 6 caractères fourni par votre professeur
                                </div>
                                <ErrorMessage error={validationErrors.quizCode} />
                            </div>

                            {/* Bouton Commencer le Quiz */}
                            <Button
                                type="submit"
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 text-lg disabled:opacity-50"
                                disabled={isLoading || Object.keys(validationErrors).some((key: string) => validationErrors[key as keyof ValidationErrors])}
                            >
                                {isLoading ? 'Vérification...' : 'Commencer le qizz'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default StudentPage;