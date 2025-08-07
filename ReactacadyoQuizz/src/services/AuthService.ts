import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';
import type { User } from '../types/User';


// Interface pour les credentials de connexion
interface LoginCredentials {
    username: string;
    password: string;
}


// Interface pour la réponse d'erreur du backend
interface LoginErrorResponse {
    message?: string;
    error?: string;
    code?: number;
}

// Interface pour les infos utilisateur
export interface UserInfo {
    id: number;
    email: string;
    roles: string[];
    prenom?: string;
    nom?: string;
}

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

class AuthService {
    private tokenKey = 'jwt_token';

    constructor() {
        // Configurer axios pour envoyer automatiquement le token
        axios.interceptors.request.use((config) => {
            const token = this.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    // Récupère le token stocké
    public getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    // Stocke le token
    private setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
    }

    // Supprime le token
    private removeToken(): void {
        localStorage.removeItem(this.tokenKey);
    }

    // Connexion : récupère et stocke le token
    public async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
        try {
            const credentials: LoginCredentials = {
                username: email,
                password: password
            };
            const response = await axios.post(`${API_BASE_URL}/api/login_check`, credentials);
            
            if (response.data.token) {
                this.setToken(response.data.token);
                return { success: true, message: 'Connexion réussie' };
            }
            
            return { success: false, message: 'Token non reçu' };
        } catch (error) {
            const err = error as AxiosError<LoginErrorResponse>;
            let message = 'Erreur de connexion';
            if (err.response?.data?.message) message = err.response.data.message;
            return { success: false, message };
        }
    }

    // Déconnexion : supprime le token
    public async logout(): Promise<void> {
        this.removeToken();
    }

    // Récupère l'utilisateur connecté via /api/user/me
    public async getCurrentUser(): Promise<User | null> {
        try {
            const token = this.getToken();
            if (!token) return null;

            const response: AxiosResponse<UserInfo> = await axios.get(`${API_BASE_URL}/api/user/me`);
            const userInfo = response.data;
            
            // Adapter les données du backend vers le format attendu par le front
            const user: User = {
                id: userInfo.id,
                email: userInfo.email,
                roles: userInfo.roles,
                prenom: userInfo.prenom,
                nom: userInfo.nom,
                name: userInfo.prenom && userInfo.nom ? `${userInfo.prenom} ${userInfo.nom}` : userInfo.email
            };
            
            return user;
        } catch {
            // Si erreur (token invalide/expiré), supprimer le token
            this.removeToken();
            return null;
        }
    }

    // Vérifie l'authentification
    public async isAuthenticated(): Promise<boolean> {
        const user = await this.getCurrentUser();
        return !!user;
    }
}

export default new AuthService();