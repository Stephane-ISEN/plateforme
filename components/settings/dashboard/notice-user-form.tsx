import React, { useState } from 'react';
import {useForm, Controller, FormProvider} from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Form, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AiOutlineRobot } from 'react-icons/ai';
import {CommentFormData, FormProps} from "@/types";


const NoticeUserForm: React.FC = () => {
  const methods = useForm<CommentFormData>({
    defaultValues: {
      titre: '',
      rating: 0,
      contenu: '',
    },
  });

  const { control, handleSubmit, reset } = methods;

 const onSubmit = async (data: CommentFormData) => {
    const formData = new FormData();
    formData.append('titre', data.titre);
    formData.append('rating', data.rating.toString());
    formData.append('contenu', data.contenu);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/commentaire/comments/create_comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      alert('Commentaire envoyé avec succès !');
      reset();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment');
    }
  };

  return (
    <FormProvider {...methods}>
      <Card className={'border font-semibold text-black dark:bg-white shadow-gray-700 shadow-md dark:shadow-md dark:shadow-slate-400'}>
        <CardHeader>
          <CardTitle className={'text-2xl'}>Laissez un commentaire</CardTitle>
          <CardDescription>
            Partagez vos retours avec nous. Vos commentaires nous aident à nous améliorer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} >
            <FormItem>
              <FormLabel className={'text-xl'}>Titre</FormLabel>
              <FormControl>
                <Controller
                  name="titre"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem className={'mt-2'}>
              <FormLabel className={'text-xl'}>Note</FormLabel>
              <FormControl>
                <Controller
                  name="rating"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <AiOutlineRobot
                          key={value}
                          onClick={() => field.onChange(value)}
                          className={`text-4xl cursor-pointer ${value <= field.value ? 'text-yellow-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem className={'mt-2'}>
              <FormLabel className={'text-xl'} htmlFor="contenu">Commentaire</FormLabel>
              <FormControl>
                <Controller
                  name="contenu"
                  control={control}
                  render={({ field }) => <Textarea {...field} />}

                />
              </FormControl>
              <FormMessage className={'dark:bg-[#111827] dark:text-white'}/>
            </FormItem>

            <CardFooter className="flex mt-4 p-2 dark:bg-[#111827] dark:text-white ">
              <Button className={'w-full h-full dark:bg-[#111827] dark:text-white'} type="submit">Envoyer</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
};

export default NoticeUserForm;
