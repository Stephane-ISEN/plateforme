import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardTitle, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from '../../ui/button';

const CreateSessionForm = () => {
  const [sessionName, setSessionName] = useState('');
  const [description, setDescription] = useState('');
  const [instructorName, setInstructorName] = useState(''); // Rempli automatiquement avec l'email du formateur
  const [startTime, setStartTime] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setFile(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  // Récupérer l'email de l'utilisateur authentifié
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const data = await response.json();
        const roles = data.roles;

        // Assurez-vous que l'utilisateur est formateur-int, formateur-ext ou superadmin
        if (roles.includes('Formateur-int') || roles.includes('Formateur-ext') || roles.includes('SuperAdmin')) {
          setInstructorName(data.email); // Remplit automatiquement l'email du formateur
        } else {
          setError("Vous n'avez pas les permissions nécessaires pour créer une session.");
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError("Erreur lors de la récupération des informations de l'utilisateur.");
      }
    };

    fetchUserDetails().then(r => r);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('session_name', sessionName);
    formData.append('description', description);
    formData.append('formateur_name', instructorName);
    formData.append('start_time', startTime);
    if (file) {
      formData.append('file', file);
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sessions/create_session`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      alert('Session créée avec succès !');

      // Réinitialiser les champs du formulaire
      setSessionName('');
      setDescription('');
      setInstructorName(''); // Réinitialiser aussi l'instructeur
      setStartTime('');
      setFile(null);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Échec de la création de la session');
    }
  };

  return (
    <Card typeof={'primary'} className=" grid p-4 m-4 border dark:bg-white text-black shadow-gray-700 shadow-md dark:shadow-md dark:shadow-slate-400">
      <CardTitle className="flex flex-col text-2xl p-4 border-b-2 border-black ">Créer une nouvelle Session</CardTitle>
      <div className="flex flex-col p-2 m-2 sm:grid">
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-4">
          <div className={'flex sm:grid'}>
            <label className={'mx-2'}>Nom de la Session</label>
            <input
              className="items-center border rounded-lg p-2 m-2 dark:bg-white dark:text-black"
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              required
            />
          </div>
          <div className={'flex sm:grid'}>
            <label className={'mx-2'}>Description (optionnel)</label>
            <input
              className="border rounded-lg p-2 m-2 dark:bg-white dark:text-black"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className={'flex-grow sm:grid'}>
            <label className={'mx-2'}>Formateur</label>
            <input
              className=" border rounded-lg p-2 m-2 dark:bg-white dark:text-black"
              type="text"
              value={instructorName}
              readOnly // Empêche la modification manuelle
              required
            />
          </div>
          <div>
            <label className={'mx-2'}>Date et heure de début</label>
            <input
              className="border-black/10 rounded-lg p-2 m-2 bg-gray-500 text-white dark:bg-white dark:text-black"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div {...getRootProps()} style={{ border: '1px solid #ccc', cursor: 'pointer', position: 'relative' }} className="items-center rounded-lg shadow p-2 m-2">
            <input {...getInputProps()} />
            {file ? (
              <p>File: {file.name}</p>
            ) : (
              <div className="text-center">Déposez un fichier .CSV ou .TXT ici,<br />ou cliquez pour en sélectionner un.</div>
            )}
          </div>
          <div className="flex justify-center w-full ">
              <Button className=" w-full bg-[#111827] dark:border shadow-accent-foreground mt-4" type="submit">Créer une Session</Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default CreateSessionForm;
