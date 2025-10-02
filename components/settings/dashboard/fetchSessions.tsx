import React, { useState, useEffect } from 'react';
import { Session } from '@/types';
import { Card } from '@/components/ui/Card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from "@/components/ui/button";
import { Send, UserCog } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formatDateTime = (dateTimeString: string | number | Date) => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const date = new Date(dateTimeString);
  return date.toLocaleString('fr-FR');
};

const ActiveSessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [users, setUsers] = useState<{ email: string }[]>([]); // Pour stocker les utilisateurs
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch current user');
        }
        const userData = await response.json();
        setCurrentUserEmail(userData.email);
      } catch (err) {
        setError('Failed to fetch current user details');
      }
    };

    const fetchSessions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sessions/all_session/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setSessions(data);
      } catch (err) {
        setError('Failed to fetch active sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser().then(() => fetchSessions());
  }, []);

  useEffect(() => {
    if (currentUserEmail) {
      const userSessions = sessions.filter(session => session.formateur_name === currentUserEmail);
      setFilteredSessions(userSessions);
    }
  }, [sessions, currentUserEmail]);

  const handleResendEmail = async (email: string, sessionName: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/mails/send_invite/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          email: email,
          session_name: sessionName
        }),
      });

      if (response.ok) {
        alert(`Invitation resend to: ${email}`);
      } else {
        const result = await response.json();
        alert(`Failed to resend invitation: ${result.detail}`);
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      alert("Failed to resend invitation. Please try again.");
    }
  };
  const handleDeleteSession = async (sessionId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette session ?")) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sessions/delete/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          const result = await response.json();
          alert(`Échec de la suppression de la session : ${result.detail}`);
          return;
        }

        // Met à jour l'état pour retirer la session supprimée
        setSessions(prevSessions => prevSessions.filter(session => session._id !== sessionId));
        alert("Session supprimée avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression de la session :", error);
        alert("Échec de la suppression. Veuillez réessayer.");
      }
    }
  };

  const getStatusIndicator = (email: string) => {
    const user = users.find((user) => user.email === email);
    return (
      <span
        className={`h-3 w-3 rounded-full mr-2 ${user ? 'bg-green-500' : 'bg-red-500'}`}
        title={user ? 'Inscrit' : 'Non inscrit'}
      />
    );
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <Card className="p-4 m-4 border font-semibold text-black dark:bg-white shadow-gray-700 shadow-md dark:shadow-md dark:shadow-slate-400">
      <h2 className=" items-center text-2xl mb-4 p-2 border-b-2 border-black">Sessions Actives</h2>
      <Accordion type="single" collapsible>
        {filteredSessions.map((session) => (
          <AccordionItem key={session._id} value={session._id}>
            <AccordionTrigger className="text-xl">
              {session.session_name} ({session.formateur_name})
            </AccordionTrigger>
            <AccordionContent>
              <h1 className="text-lg font-normal mb-4">
                {formatDateTime(session.start_time)}
              </h1>
              <div className="flex flex-col mt-4">
                <h3 className="text-lg flex-col-1 font-bold mb-2">Participants</h3>
                <Button className=" flex-col-2 text-white bg-red-500" onClick={() => handleDeleteSession(session._id)}>
                  Supprimer la session
                </Button>

              </div>

              <ul className="grid-cols-1 mt-4">
              {session.emails.map((email, index) => (
                    <li key={index} className="flex py-1 justify-between">
                      <div className="flex items-center">
                        {getStatusIndicator(email)}
                        {email}
                      </div>
                      <div className="flex">
                        <Button className="text-white ml-2 dark:bg-[#111827]"
                                onClick={() => handleResendEmail(email, session.session_name)}>
                          <Send/>
                        </Button>
                      </div>
                    </li>
                ))}
              </ul>

            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
};

export default ActiveSessions;
