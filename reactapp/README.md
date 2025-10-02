![AI EXPLORER](/reactapp/public/aiexplorerwhite.png)

# AI Explorer - Application React

## L'application React est la vitrine de la plateforme AI Explorer, conçue pour offrir une expérience utilisateur centrée sur l’accessibilité et la simplicité. Nous avons placé un point d'honneur à utiliser les bibliothèques ShadCN/UI et TailwindCSS pour garantir une interface moderne et intuitive.

Fonctionnalités principales :
Génération de contenu :

- [Texte](/reactapp/src/app/(dashboard)/(routes)/conversation/page.tsx) (GPT-4o, Gemini, etc.)
- [Images](/reactapp/src/app/(dashboard)/(routes)/imagegenerator/page.tsx) (Replicate/flux, etc)
- [Vidéos](/reactapp/src/app/(dashboard)/(routes)/videogenerator/page.tsx) (Replicate/animatediff, etc.)
- [Documentation](/reactapp/src/app/(dashboard)/(routes)/documentations/page.tsx) : - création de sessions - gestion des utilisateurs - création d'invitation par mail à partir de liste - section commentaire ...
## Stack technique (Front) :
- [`Next`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app)
- [`Nodejs`](https://github.com/tailwindlabs/tailwindcss)
- [`TailwindCss`](https://github.com/tailwindlabs/tailwindcss)
- [`ShadCn/ui`](https://github.com/shadcn-ui/ui)

## Installation et démarrage (Développement local) :
- Clonez le dépôt : git clone `https://github.com/managia-website`

- Installez les dépendances :`npm install`

- Lancez l'application :`npm run dev`

L'application est accessible à l'adresse :
http://localhost:3000

Configuration :
Veillez à bien configurer vos variables d’environnement dans un fichier ``.env.local`` en vous basant sur le fichier ``.env.example`` fourni.
