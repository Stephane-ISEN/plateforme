"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt } from 'react-icons/fa';
import PromptDownloadModal from '@/components/prompt/PromptDownloadModal';
import { useUser } from '@/components/user/UserContext';
import useFetchAll from '@/src/hooks/FetchAllPrompt';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const LogoutButton = () => {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogout, setIsLogout] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const { messages } = useFetchAll(user, shouldFetch);
  const router = useRouter();

  const logout = async () => {
    if (user) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/set_inactive/${user.email}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to set user inactive');
        }
      } catch (error) {
        console.error('Error setting user inactive:', error);
      }
    }
    localStorage.removeItem('token');
    router.push('/sign-in'); // Rediriger vers la page de login
  };

  const handleLogoutClick = () => {
    setIsLogout(true);
    setIsModalOpen(true);
    setShouldFetch(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (isLogout) {
      logout();
    }
  };

  const handleDownloadOnly = async () => {
    const element = document.getElementById('prompts-list');
    if (element) {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'cm', 'a4', true);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('prompts.pdf');
    }
    setIsModalOpen(false);
    setShouldFetch(false); // Arrêtez le fetch après le téléchargement
  };

  useEffect(() => {
    if (isModalOpen) {
      setShouldFetch(true); // Déclenchez le fetch lorsque le modal est ouvert
    }
  }, [isModalOpen]);

  return (
    <>
      <div
        onClick={handleLogoutClick}
        className={'h-9 border rounded-lg hover:shadow-md transition cursor-pointer'}
      >
        <div className={'flex items-center text-center font-semibold'}>
          <div className={'flex p-1'}>
            <span>Log out</span>
          </div>
          <div className={'mr-1 flex text-red-500'}>
            <FaSignOutAlt />
          </div>
        </div>
      </div>

      {user && (
        <PromptDownloadModal
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal}
          onDownloadOnly={handleDownloadOnly}
        />
      )}
    </>
  );
};

export default LogoutButton;
