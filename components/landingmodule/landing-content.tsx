"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { SwipeCarousel } from "@/components/image/horizontalscrollcarousel";

const testimonials = [
  {
    name: "Maxime L",
    avatar: "./testimonialsID/selfie1.png",
    title: "Formateur",
    description:
      "En tant que formateur, j'ai trouvé que l'interface de Manag’IA est incroyablement intuitive. " +
      "La gestion des sessions et la préparation des contenus de formation n'ont jamais été aussi simples. " +
      "Mes étudiants apprécient la facilité avec laquelle ils peuvent accéder aux ressources et interagir avec les différents modèles d'IA.",
  },
  {
    name: "Élodie T",
    avatar: "./testimonialsID/selfie2.png",
    title: "Etudiante",
    description:
      "J'ai été impressionnée par la richesse des fonctionnalités de ManagIA. " +
      "En tant que personne formée, la possibilité de sauvegarder mes prompts favoris et de télécharger les résultats a vraiment enrichi mon expérience d'apprentissage.",
  },
  {
    name: "Thibault G",
    avatar: "./testimonialsID/selfie3.png",
    title: "Etudiant",
    description:
      "ManagIA m'a permis de personnaliser mes sessions de formation comme jamais auparavant. " +
      "La souplesse d'accès aux modèles d'IA et la facilité de partage des contenus sont des atouts majeurs pour un formateur moderne",
  },
  {
    name: "Meryem V",
    avatar: "./testimonialsID/selfie4.png",
    title: "Responsable RH",
    description:
      "Je recommande vivement Manag’IA pour toute formation professionnelle. " +
      "L'utilisation de différents modèles d'IA est un outil puissant pour comprendre les nuances de l'intelligence artificielle.",
  },
  {
    name: "Hayato D",
    avatar: "./testimonialsID/selfie5.png",
    title: "Etudiant",
    description:
      "L'application Manag’IA est un vrai game changer pour le secteur de la formation. " +
      "La possibilité d'ajout des pièces jointes dans les prompts et le téléchargement de conversations sont des fonctionnalités que j'apprécie particulièrement pour mon suivi post-formation.",
  },
];

export const LandingContent = () => {
  return (
    <div className="px-lg-5 m-0 space-y-6">
      {/* Nouvelle section basée sur ton image */}
      <section className="bg-[#111827] p-8 rounded-lg shadow-card text-[#dddee2] w-100 h-75">
        <div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 shadow-lg shadow-[#202e4b] rounded-lg p-4 m-4 border border-opacity-30 border-[#dddee2] ">
          {/* Première colonne */}
          <div className="flex flex-col w-50 h-50 justify-center">
            <Card className="text-2xl text-[#dddee2] border-0 bg-transparent ">
              Chat GPT, Gemini, où encore Mistral. Accessible pour créer des
              contenus de haute qualité, avec une suite d&apos;outils adaptés à vos
              besoins professionnels.
            </Card>
          </div>

          {/* Deuxième colonne */}
          <div className="bg-gradient-to-r from-blue-500 to-emerald-600 transition-colors duration-300 text-black p-6 m-6 rounded-lg shadow-[#202e4b] shadow-inner  ">
            <h3 className="text-xl font-semibold mb-2">
              Accès Pro : Profitez de la puissance des comptes professionnels
            </h3>
            <p className="text-md">
              Cas d&apos;Usage : Rédaction d&apos;articles, création de contenu
              marketing, assistance à l&apos;écriture créative.
            </p>
            <Button variant="default"
                    className="mt-4 bg-[#dddee2] hover:bg-[#202e4b] text-black hover:text-[#dddee2] hover:animate-pulse">
              Commencez Maintenant !
            </Button>
          </div>
        </div>
        <div className=" mt-24"/>

        {/* Autre ligne */}
        <div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 shadow-lg shadow-[#202e4b] rounded-lg p-4 m-4 border border-opacity-30 border-[#dddee2] ">
          {/* Troisième colonne */}
          <div className="bg-gradient-to-r from-emerald-600 to-blue-500 text-[#020203] p-6 m-6 rounded-lg shadow-[#202e4b] shadow-inner ">
            <h3 className="text-xl font-semibold ">
              Accès Pro : Testez les modèles les plus récents pour une qualité
              d&apos;image exceptionnelle
            </h3>
            <p className="text-md">
              Cas d&apos;Usage : Design de produits, illustrations créatives, contenu
              visuel pour le web et les réseaux sociaux.
            </p>
            <Button variant="default"
                    className="mt-4 bg-[#dddee2] transition-colors duration-300 hover:bg-[#202e4b] text-black hover:text-[#dddee2] hover:animate-pulse">
              Testez Gratuitement !
            </Button>
          </div>


          {/* Quatrième colonne */}
          <div className="flex flex-col justify-center ">
            <p className="text-2xl text-[#dddee2] border-0 bg-transparent ">
              Transformez vos idées en images exceptionnelles avec nos modèles
              d&apos;image assistés par IA.
            </p>
          </div>
        </div>
        <div className="mt-14"/>
        <SwipeCarousel/>
        <div className=" mt-14"/>

        {/* Bandeau spécial */}
        <div className="bg-gradient-to-r from-blue-500 to-emerald-600 transition-colors duration-300 text-white p-8 rounded-lg text-center m-8 shadow-[#202e4b] shadow-inner ">
          <p className="text-lg">
            Offrez à vos équipes ou à vos étudiants une immersion dans le monde
            des IA génératives avec des sessions de formation sur mesure.
          </p>
        </div>
        <div className=" mt-24"/>

        {/* Section formateurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 mt-12 ">
          <div className="text-black p-6 rounded-lg text-center bg-gradient-to-r from-emerald-600 to-blue-500 transition-colors duration-300 mt-8 shadow-[#202e4b] shadow-inner">
            <p className="text-xl font-semibold mb-2 text-[#202e4b]">
              Formateurs en entreprise, freelance, enseignants du collège à
              l&apos;université.
            </p>
          </div>
          <div className="bg-blue-500 transition-colors duration-300 text-black p-2 rounded-lg shadow-[#202e4b] shadow-inner text-center">
            <div className={'justify-center pr-3 mt-6'}>
              <Button variant="default" className={'bg-[#dddee2] text-black hover:text-white p-2 m-2 w-full shadow-lg'}>Testez
                Gratuitement !</Button>
              <Button variant="default" className={'bg-[#dddee2] text-black hover:text-white p-2 m-2 w-full shadow-lg'}>
                Réservez une Session
              </Button>
            </div>
          </div>
          <div className=" bg-gradient-to-r from-blue-500 to-emerald-600 transition-colors duration-300 text-[#202e4b] p-6 rounded-lg shadow-[#202e4b] shadow-inner text-center mt-8">
            <p className="text-xl font-semibold">
              Maîtrisez le prompt engineering et apprenez à tirer parti des IA
              génératives dans vos projets.
            </p>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="mt-10">
        <h2 className="text-center text-4xl font-extrabold text-[#dddee2]">
          Vos Témoignages
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-24">
          {testimonials.map((item) => (
            <Card
              key={item.description}
              className="bg-[#dddee2] rounded-lg border-none text-white shadow-md shadow-[#748dc3] p-6"
            >
              <div className="flex items-center gap-x-4">
                <div className="flex items-center justify-center h-40 w-40 rounded-full bg-[#111827]">
                  {item.avatar.includes(".jpg") || item.avatar.includes(".png") ? (
                      <img
                          src={item.avatar}
                          alt={`${item.name}'s avatar`}
                          className="h-full w-full object-cover rounded-full"
                      />
                  ) : (
                      <span className="text-4xl font-semibold text-white">
                        {item.avatar || item.name[0]}
                      </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">
                    {item.name}
                  </h3>
                  <p className="text-sm font-semibold text-gray-500">
                    {item.title}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-10">
        <div className="flex p-6 m-6 items-center justify-center">
          <div>
            <h3 className="flex justify-center text-lg font-semibold text-gray-400">
              ManagIA
            </h3>
            <p className="text-sm font-semibold text-gray-500">
              © 2021 ManagIA, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
