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
} from '@/components/ui/select'; // Assurez-vous que ce chemin est correct

const ActiveUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

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

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <Card className={'p-4 m-4 font-semibold dark:bg-white text-black shadow-gray-700 shadow-md dark:shadow-md dark:shadow-slate-400 '}>
      <div className={'h-full w-full'}>
        <h2 className={'text-2xl mb-4 p-2 border-b-2 border-black'}>Utilisateurs Actifs</h2>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default ActiveUsers;
