import React from 'react';
import NoticeUserForm from '@/components/settings/dashboard/notice-user-form';
import FetchComments from "@/components/settings/dashboard/fetchComment";

const Organizations = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Support</h1>
      <div className="text-sm text-muted-foreground mb-4">
        <NoticeUserForm />
      </div>
        <div className="mt-4 p-2">
      <FetchComments/>
        </div>
    </div>
  );
};

export default Organizations;