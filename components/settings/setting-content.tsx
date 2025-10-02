"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/components/user/UserContext';
import { Card } from '@/components/ui/Card';
import PromptDownloadModal from '@/components/prompt/PromptDownloadModal';
import { Button } from '../ui/button';
import Dashboard from "@/components/settings/dashboard-content";

const SettingsPage: React.FC = () => {
  const { user, fetchUserData } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    if (!user) {
      router.push('/settings');
    }
  }, [user, router]);


  const handleDownloadClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
      <div className="settings-page px-4 md:px-20 lg:px-32 dark:bg-[#111827] space-y-6">
        <h1 className={'text-4xl font-semibold border-b-2 p-2 border-black dark:border-white '}>Settings</h1>
        <Card className=" mx-2 p-4 text-black dark:text-white
       items-center grid grid-cols-2 justify-center font-semibold">
          <div className="flex user-profile  mx-2 ">
            <Avatar className="h-16 w-16 mt-2 text-black dark:text-white ">
              <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="user-details m-4 ">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
            </div>
          </div>
          <Button onClick={handleDownloadClick}
                  className=" justify-items-end dark:bg-white bg-[#111827] dark:hover:bg-white dark:hover:text-black btn-download ">Mes
            Prompts en PDF</Button>
        </Card>
        <div className="text-2xl font-semibold border-b-2 p-2 border-black dark:border-white">Dashboard</div>
        <Dashboard />
        <div className="space-y-4 ml-72 w-28 h-28">
          <PromptDownloadModal isOpen={isModalOpen} onRequestClose={handleCloseModal}
                               onDownloadOnly={handleCloseModal}/>
        </div>
        <div className={"pb-20 bg-white dark:bg-[#111827]"}>
          <div className={"flex items-center justify-center"}>
            <div>
              <h3 className={"flex mt-72 justify-center dark:text-white text-lg font-semibold text-black"}>
                ManagIA
              </h3>
              <p className={"text-sm font-semibold text-black dark:text-white"}>
                © 2021 ManagIA, Inc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

  );
};


export default SettingsPage;
