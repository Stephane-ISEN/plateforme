"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {User, UserContextType } from "@/types";


const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token'); // Suppose that you store the token in localStorage

      if (!token) {
        throw new Error('No token found');
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

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur', error);
      setUser(null); // Optionally reset user to null on error
    }
  };

  useEffect(() => {
    fetchUserData().then(r => r);
  }, []);

  return (
    <UserContext.Provider value={{user, setUser, fetchUserData}}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
