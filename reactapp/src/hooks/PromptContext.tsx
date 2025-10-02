"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Message, PromptContextType } from '@/types';

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const PromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async (shouldFetch: boolean) => {
    if (!shouldFetch) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/prompts/list_prompt_user`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }
      const data = await response.json();
      const transformedMessages = data.flatMap((prompt: any) => [
        { role: 'user', content: prompt.user_prompt, image: prompt.image },
        { role: 'api', content: prompt.generated_response }
      ]);
      setMessages(transformedMessages);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts(true).then(r => r );
  }, [fetchPrompts]);

  return (
    <PromptContext.Provider value={{ messages, loading, error, fetchPrompts }}>
      {children}
    </PromptContext.Provider>
  );
};

export const usePrompts = () => {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error('usePrompts must be used within a PromptProvider');
  }
  return context;
};