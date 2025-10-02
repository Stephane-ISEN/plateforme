import { useRouter } from 'next/navigation';
import React, { useEffect, ComponentType } from 'react';
import { WithAuthProps } from '@/types';

export default function withAuth<P extends WithAuthProps>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const Router = useRouter();

    useEffect(() => {
      const token = localStorage.getItem('token');

      const checkTokenValidity = async () => {
        if (!token) {
          Router.replace('/sign-in');
          return;
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/users/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.status === 401) {
            Router.replace('/sign-in');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          Router.replace('/sign-in');
        }
      };

      checkTokenValidity().then(r => r);
    }, [Router]);

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${getDisplayName(WrappedComponent)})`;

  return WithAuthComponent;
};

function getDisplayName(WrappedComponent: ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
