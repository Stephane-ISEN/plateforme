import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { Card } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import InviteModal from '@/components/settings/dashboard/invitemodal';
import UserUpdateForm from "@/components/settings/dashboard/userupdateform";

const ActiveUsersAdmin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); // State for Invite Modal

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError('Failed to fetch active users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers().then(r => r);
  }, []);

  const handleRoleFilterChange = (value: string | null) => {
    setRoleFilter(value);
  };

  const filteredUsers = roleFilter
    ? users.filter(user => user.roles.includes(roleFilter))
    : users;

  const handleUpdateClick = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleUpdate = () => {
    // Fetch users again after update
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError('Failed to fetch active users');
      }
    };

    fetchUsers().then(r => r);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }
    const handleSendInvite = async (email: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/mails/send_invite/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          email: email,
          session_name: 'Default Session',
        }),
      });
      if (response.ok) {
        alert(`Invitation sent to: ${email}`);
        setIsInviteModalOpen(false);
      } else {
        const result = await response.json();
        alert(`Failed to send invitation: ${result.detail}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };
  const handleDeleteUser = async (userId: string, role: string) => {
  // Empêche la suppression d'un SuperAdmin
    if (role === 'SuperAdmin') {
      alert("Impossible de supprimer un SuperAdmin.");
      return;
    }
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/delete/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          const result = await response.json();
          alert(`Échec de la suppression de l'utilisateur : ${result.detail}`);
          return;
        }

        // Met à jour l'état pour retirer l'utilisateur supprimé
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        alert("Utilisateur supprimé avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur :", error);
        alert("Échec de la suppression. Veuillez réessayer.");
      }
    }
  };

  return (
    <Card className={'p-4 m-4 font-semibold dark:bg-white text-black shadow-gray-700 shadow-md dark:shadow-md dark:shadow-slate-400'}>
      <div className={'h-full w-full'}>
        <h2 className={'text-2xl mb-4 p-2 border-b-2 border-black'}>Utilisateurs Actifs</h2>

        {/* Invite Modal Button and Modal */}
        <Button onClick={() => setIsInviteModalOpen(true)} className="mb-4 w-full dark:bg-[#111827]">
          Envoyer une invitation
        </Button>
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}  // Close Invite Modal
          onSend={handleSendInvite}  // Pass the function to handle sending
          initialEmail=""  // No specific user email, can be blank initially
        />

        {/* Role selection dropdown */}
        <Select onValueChange={handleRoleFilterChange}>
          <SelectTrigger className={"dark:text-white "}>
            <SelectValue placeholder="Sélectionner un rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
            <SelectItem value="Formateur-int">Formateur Int</SelectItem>
            <SelectItem value="Formateur-ext">Formateur Ext</SelectItem>
            <SelectItem value="Formé">Formé</SelectItem>
            <SelectItem value="Banni">Banni</SelectItem>
          </SelectContent>
        </Select>
        <Table className={'w-full mt-4'}>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="flex items-center">
                    <span
                      className={`h-3 w-3 rounded-full mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}
                      title={user.is_active ? 'En ligne' : 'Hors ligne'}
                    />
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>{user.is_active ? 'En ligne' : 'Hors ligne'}</TableCell>
                <TableCell>
                  <Button onClick={() => handleUpdateClick(user)}>
                    Modifier
                  </Button>
                  <Button onClick={() => handleDeleteUser(user._id, user.roles[0])} className="bg-red-500 text-white p-2 m-2">
                    Supprimer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedUser && (
        <UserUpdateForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={selectedUser}
          onUpdate={handleUpdate}
        />
      )}
    </Card>
  );
};

export default ActiveUsersAdmin;