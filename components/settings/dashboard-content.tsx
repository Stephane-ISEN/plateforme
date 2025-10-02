"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import General from '@/components/settings/dashboard/general';
import CreateSessionForm from '@/components/settings/dashboard/Inscription-Form';
import ActiveUsers from '@/components/settings/dashboard/fetchUsers';
import ActiveUsersAdmin from "@/components/settings/dashboard/fetchUsersAdmin";
import ActiveSessions from '@/components/settings/dashboard/fetchSessions';
import Organizations from '@/components/settings/dashboard/organisations';
import Advanced from '@/components/settings/dashboard/advanced';
import { useUser } from '@/components/user/UserContext';

const Dashboard: React.FC = () => {
  const { user, fetchUserData } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get('section');

  useEffect(() => {
    if (!user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  if (!user) return <p>Loading...</p>;

  const renderContent = () => {
    switch (section) {
      case 'new-session':
        return <CreateSessionForm />;
      case 'users':
        return <ActiveUsers />;
      case 'users-admin':
        return <ActiveUsersAdmin />;
      case 'sessions':
        return <ActiveSessions />;
      case 'organizations':
        return <Organizations />;
      case 'advanced':
        return <Advanced />;
      case 'general':
      default:
        return <General />;

    }
  };

  return (
    <div className=" mx-2 grid w-full max-w-6xl items-start md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
      <nav className=" grid gap-4 text-sm text-muted-foreground">
        {user.roles.includes('SuperAdmin') && (
          <>
            <Link href="?section=general" className="hover:font-semibold">General</Link>
            <Link href="?section=new-session" className="hover:font-semibold">Nouvelle Session</Link>
            <Link href="?section=sessions" className="hover:font-semibold">Liste Sessions</Link>
            <Link href="?section=users-admin" className="hover:font-semibold">Liste Utilisateurs</Link>
            <Link href="?section=organizations" className="hover:font-semibold">Support</Link>
            <Link href="?section=advanced" className="hover:font-semibold">Paramètres Avancés</Link>
          </>
        )}
        {user.roles.includes('Formateur-int') && (
          <>
            <Link href="?section=general" className="hover:font-semibold">General</Link>
            <Link href="?section=new-session" className="hover:font-semibold">Nouvelle Session</Link>
            <Link href="?section=sessions" className="hover:font-semibold">Liste Sessions</Link>
            <Link href="?section=users" className="hover:font-semibold">Liste Utilisateurs</Link>
            <Link href="?section=organizations" className="hover:font-semibold">Support</Link>
            <Link href="?section=advanced" className="hover:font-semibold">Paramètres Avancés</Link>
          </>
        )}
        {user.roles.includes('Formateur-ext') && (
          <>
            <Link href="?section=general" className="hover:font-semibold">General</Link>
            <Link href="?section=new-session" className="hover:font-semibold">Nouvelle Session</Link>
            <Link href="?section=sessions" className="hover:font-semibold">Liste Sessions</Link>
            <Link href="?section=users" className="hover:font-semibold">Liste Utilisateurs</Link>
            <Link href="?section=organizations" className="hover:font-semibold">Support</Link>
            <Link href="?section=advanced" className="hover:font-semibold">Paramètres Avancés</Link>
          </>
        )}
        {user.roles.includes('Formé') && (
          <>
            <Link href="?section=general" className="hover:font-semibold">General</Link>
            <Link href="?section=organizations" className="hover:font-semibold">Support</Link>
            <Link href="?section=advanced" className="hover:font-semibold">Advanced</Link>
          </>
        )}
      </nav>
      <div className="grid gap-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
