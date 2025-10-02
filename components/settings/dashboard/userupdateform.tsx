import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {UserUpdateFormProps} from "@/types";
import {FormValues} from "@/types";



const UserUpdateForm: React.FC<UserUpdateFormProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      email: user.email,
      is_active: user.is_active,
      roles: user.roles, // Assuming user.roles is an array and we use the first role as the default value
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/update/${user.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to update user', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier Utilisateur</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l&apos;utilisateur ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <Input
              id="email"
              {...register('email', { required: 'Email is required' })}
              className="mt-1 block w-full"
            />
            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
          </div>
          <div className="mb-4">
            <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">Status</label>
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="mt-1"
            />
            {errors.is_active && <span className="text-red-500 text-sm">{errors.is_active.message}</span>}
          </div>
          <div className="mb-4">
            <label htmlFor="roles" className="block text-sm font-medium text-gray-700">Roles</label>
            <Select onValueChange={(value) => setValue('roles', [value])}>
              <SelectTrigger>
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
            {errors.roles && <span className="text-red-500 text-sm">{errors.roles.message}</span>}
          </div>
          <DialogFooter>
            <Button type="submit">Mettre à jour</Button>
            <Button type="button" onClick={onClose}>Fermer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserUpdateForm;
