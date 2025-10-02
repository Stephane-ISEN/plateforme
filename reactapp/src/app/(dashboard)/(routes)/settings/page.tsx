"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/src/hocs/withauth';
import Navbar from '@/components/navbar/navbar';
import SettingsPage from '@/components/settings/setting-content';
import { useUser } from '@/components/user/UserContext';

const SettingsPageContent = () => {
  const router = useRouter();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token'); // Suppose that you store the token in localStorage

        if (!token) {
          router.push('/settings ');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/users/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const user = await response.json();
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur', error);
        router.push('/sign-in');
      }
    };

    fetchUserData().then(r => r);
  }, [setUser, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar />
      <SettingsPage />
    </div>
  );
}

export default withAuth(SettingsPageContent);