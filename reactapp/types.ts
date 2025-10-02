import React, {Dispatch, FormEvent, ReactNode, SetStateAction} from 'react';
import {LucideIcon} from "lucide-react";

// Interface pour les propriétés de mise en page (layout)
export interface LayoutProps {
  children?: ReactNode; // Contenu enfant à afficher dans le layout
  params?: Record<string, any>; // Paramètres optionnels passés au layout
}

// Interface pour les propriétés des pages
export interface PageProps {
  children?: ReactNode; // Contenu enfant à afficher sur la page
  params?: Record<string, any>; // Paramètres optionnels passés à la page
  searchParams?: Record<string, any>; // Paramètres de recherche optionnels passés à la page
}

// Interface pour les propriétés des composants avec authentification
export interface WithAuthProps {
  // Actuellement vide, mais peut être utilisé pour ajouter des propriétés spécifiques aux composants authentifiés
}

// Interface pour un message
export interface Message {
  role: string; // Rôle de l'expéditeur du message (ex: 'user' ou 'bot')
  content: string; // Contenu du message
  image?: string; // image en base64
}

// Interface pour les propriétés du composant Empty
export interface Emptyprops {
  label: string; // Texte à afficher lorsque le composant est vide
}

// Interface pour un lien de documentation
export interface DocumentationLink {
  title: string; // Titre du lien de documentation
  url: string; // URL du lien de documentation
  avatar: string; // Avatar ou icône associé au lien de documentation
  description: string; // Description du lien de documentation
}

// Interface pour les propriétés du composant CodeBlock
export interface CodeBlockProps {
  language: string; // Langage de programmation du bloc de code
  value: string; // Contenu du bloc de code
}

// Interface pour les propriétés pour les fichiers
export interface file {
    name: string;// Nom du fichier
    url: string; // URL du fichier
}


// Interface pour les propriétés du composant AuthHeader
export interface AuthHeaderProps {
    label: string // Texte à afficher dans le header
    title: string // Titre de la page
    }


// Interface pour les propriétés du composant BackButton
export interface BackButtonProps {
    label: string // Texte à afficher dans le bouton
    href: string // URL de destination du bouton
    }


// Interface pour les propriétés du composant CardWrapper
export interface CardWrapperProps {
    label: string // Texte à afficher dans le header
    title: string // Titre de la page
    backButtonHref: string // URL de destination du bouton
    backButtonLabel: string // Texte à afficher dans le bouton
    children: React.ReactNode // Contenu enfant à afficher dans le layout
    }


// Interface pour les propriétés du composant User
export interface User {
  _id: string; // Identifiant unique de l'utilisateur
  email: string; // Adresse e-mail de l'utilisateur
  is_active: boolean; // Statut d'activation de l'utilisateur
  roles: string[]; // Rôle de l'utilisateur
}

// Interface pour les propriétés du composant Session
export interface Session {
  participants: any;
  _id: string;
  session_name: string;
  description: string;
  start_time: string;
  end_time: string;
  formateur_name: string;
  emails: string[];
}


// Interface pour les propriétés du composant UserContextType
export interface UserContextType {
  user: User | null; // Utilisateur actuellement connecté
  setUser: Dispatch<SetStateAction<User | null>>; // Fonction pour mettre à jour l'utilisateur
  fetchUserData: () => void; // Fonction pour récupérer les données de l'utilisateur
}


export interface PromptDownloadModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onDownloadOnly: () => void;
}

export interface FileWithPreview extends File{
    preview: string;
}

declare module 'pdfmake/build/pdfmake' {
  const pdfMake: any;
  // @ts-ignore
    export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
    const pdfFonts: any;
    // @ts-ignore
    export default pdfFonts;
}

export interface PromptContextType {
  messages: Message[];
  loading: boolean;
  error: string | null;
  fetchPrompts: (shouldFetch: boolean) => void;
}

export interface CommentFormData  {
  titre: string;
  rating: number;
  contenu: string;
}

export interface FormProps {
  children: ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export interface CommentModelDisplay {
  id: string;
  user_email: string;
  titre: string;
  rating: number;
  contenu: string;
}

export interface ImageResponse {
    image_url: string;
    prompt: string;
    created_at?: string;
    _id: string;
}

export interface VideoResponse {
    video_url: string;
    prompt: string;
    created_at?: string;
    _id: string;
}

export interface HeadingProps {
    title: string;
    description: string | React.ReactNode;
    icon : LucideIcon;
    iconColor: string;
    bgColor: string;
}

export interface FetchImagesProps {
    refreshKey: number;
}

export interface FetchVideosProps {
    refreshKey: number;
}

 export interface UserUpdateFormProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: () => void;
}

export interface FormValues {
  email: string;
  is_active: boolean;
  roles: string[];
}

export interface InviteModalProps {
    isOpen: boolean,
    onClose: () => void,
    onSend: (email: string) => void,
    initialEmail?: string,
    userEmail?: string
}
export interface CardType {
  id: number;
  src: string;
  title: string;
}
export interface FormattedPromptsProps {
  messages: Message[];
}


export interface FormatedPromptsProps {
    messages: Message[];
}

export interface Agent {
  _id: string;
  agent_id: string;
  name?: string;
}

export interface MessageAgent {
  _id: string;
  session_id: string;
  role: "user" | "assistant";
  text: string;
  audio_url?: string;
  created_at: string;
}