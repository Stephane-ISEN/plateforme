import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/components/user/UserContext';

export const UserAvatar: React.FC = () => {
  const { user } = useUser();
  const avatarFallback = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <Avatar className="h-8 w-8 rounded-full border shadow">
      <AvatarFallback>
        {avatarFallback}
      </AvatarFallback>
    </Avatar>
  );
};