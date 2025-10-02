import React, {useEffect} from 'react';
import {useUser} from "@/components/user/UserContext";


interface GeneralProps {
    role?: string
}

const General: React.FC = ({role}: GeneralProps) => {
    const {user, fetchUserData} = useUser();
    useEffect(() => {
        if (!user) {
            fetchUserData();
        }
    }, [user, fetchUserData]);
    const renderContent = (role: string | undefined) => {
        switch (role) {
            case 'SuperAdmin':
                return (
                    <>
                        <h2 className={'text-xl font-bold mt-2'}>Bienvenue SuperAdmin!</h2>
                        <p className={'font-semibold mt-2'}>Cette espace vous est dédié, pour la création et gestion des Sessions, la visualisation des utilisateurs et l&apos;ajout de commentaires.</p>
                        <p className={'mt-2'}>Voici quelques informations utiles :</p>
                        <ul className={'mt-2'}>
                            <li className={'p-2'}> . Créer une nouvelle session en cliquant sur &quot;Nouvelle Session&quot;.</li>
                            <li className={'p-2'}> . Voir la liste des utilisateurs actifs en cliquant sur &quot;Liste Utilisateurs&quot;.</li>
                            <li className={'p-2'}> . Voir la liste des sessions actives en cliquant sur &quot;Liste Sessions&quot;.</li>
                            <li className={'p-2'}> . Pouvoir laisser un commentaire en cliquant sur &quot;Support&quot;.</li>
                            <li className={'p-2'}> . Voir d&apos;autres paramètres de personnalisation en cliquant sur &quot;Paramètres Avancés&quot;.</li>
                        </ul>
                    </>
                );
            case 'Formateur-int':
                return (
                    <>
                        <h2>Bienvenue Formateur Interne!</h2>
                        <p>Voici vos ressources de formation interne.</p>
                    </>
                );
            case 'Formateur-ext':
                return (
                    <>
                        <h2>Bienvenue Formateur Externe!</h2>
                        <p>Voici vos ressources de formation externe.</p>
                    </>
                );
            case 'Formé':
                return (
                    <>
                        <h2>Bienvenue Formé!</h2>
                        <p>Voici vos matériels d&apos;apprentissage.</p>
                    </>
                );
            case 'Banni':
                return (
                    <>
                        <h2>Votre compte a été banni</h2>
                        <p>Veuillez contacter le support pour plus d&apos;informations.</p>
                    </>
                );
            default:
                return (
                    <>
                        <h2>Bienvenue!</h2>
                        <p>Voici vos informations générales.</p>
                    </>
                );
        }
    };

    return <div>{user ? renderContent(user.roles[0]) : 'Loading...'}</div>;
};

export default General;
