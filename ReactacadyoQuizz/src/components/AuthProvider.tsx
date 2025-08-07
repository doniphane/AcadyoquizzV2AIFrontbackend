import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * AuthProvider :
 * Ce composant vérifie l'authentification au chargement de l'app
 * et synchronise le store Zustand avec l'état du backend (cookie JWT).
 * À placer tout en haut de votre App (ex: dans App.tsx ou Layout).
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Vérifie l'authentification dès le chargement de l'app
    checkAuth();
    // On ne met pas de dépendance pour éviter de relancer à chaque render
    // eslint-disable-next-line
  }, []);

  return <>{children}</>;
}