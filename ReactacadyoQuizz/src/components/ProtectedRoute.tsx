

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useAuth } from '../store/authStore';


// Interface pour définir les props du composant ProtectedRoute
interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: string;
    redirectTo?: string;
}

// Interface pour l'état de navigation qui peut être passé avec Navigate
interface NavigationState {
    from?: Location;
    error?: string;
}

// Type pour les rôles utilisateur supportés
type UserRole = 'ROLE_ADMIN' | 'ROLE_STUDENT' | 'ROLE_USER' | string;



// Type pour le statut de vérification des rôles
type RoleCheckResult = boolean;



function ProtectedRoute({ 
    children, 
    requiredRole, 
    redirectTo = '/login' 
}: ProtectedRouteProps) {
    // Hook pour récupérer l'URL actuelle
    const location: Location = useLocation();

    // Utilise le store d'authentification
    const { isAuthenticated, hasRole, isAdmin, isStudent } = useAuth();

    // Si l'utilisateur n'est pas connecté, on le redirige vers la page de connexion
    if (!isAuthenticated) {
        // On sauvegarde l'URL actuelle pour rediriger après connexion
        const navigationState: NavigationState = { 
            from: location,
            error: 'Veuillez vous connecter pour accéder à cette page'
        };
        
        return <Navigate to={redirectTo} state={navigationState} replace />;
    }

    // Si un rôle spécifique est requis, on vérifie que l'utilisateur l'a
    if (requiredRole) {
        const hasRequiredRole: RoleCheckResult = hasRole(requiredRole as UserRole);

        if (!hasRequiredRole) {
            // Si l'utilisateur n'a pas le bon rôle, on le redirige vers sa page appropriée
            // au lieu de /login
            let appropriateRedirect: string;
            
            if (isAdmin()) {
                appropriateRedirect = '/admin';
            } else if (isStudent()) {
                appropriateRedirect = '/student';
            } else {
                // Par défaut, redirige vers /student
                appropriateRedirect = '/student';
            }
            
            // On sauvegarde l'URL pour permettre un retour après connexion avec le bon rôle
            const navigationState: NavigationState = { 
                from: location, 
                error: `Accès non autorisé. Rôle requis: ${requiredRole}` 
            };
            
            return <Navigate to={appropriateRedirect} state={navigationState} replace />;
        }
    }

    return <>{children}</>;
}

export default ProtectedRoute;