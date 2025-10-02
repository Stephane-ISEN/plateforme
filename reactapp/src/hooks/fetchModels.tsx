import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types';

const useFetchModels = (
  user: { email: string } | null, 
  shouldFetch: boolean | null, 
  selectedModel: string | null, 
  page: string
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    if (!user || !selectedModel || !shouldFetch) return;
    
    setLoading(true);
    setMessages([]); // Réinitialiser les messages quand on change de modèle

    let apiurl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/prompts/list_prompts_model?model=${selectedModel}`;
    if (page === 'conversation') {
      apiurl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/prompts/list_prompts_page?model=${selectedModel}&page=conversation`;
    } else if (page === 'codegenerator') {
      apiurl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/prompts/list_prompts_page?model=${selectedModel}&page=codegenerator`;
    }

    try {
      const response = await fetch(apiurl, {
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
        { role: 'api', content: prompt.generated_response },
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
  }, [user, selectedModel, shouldFetch, page]);

  useEffect(() => {
    fetchModels().then(r => r); // Appelle la fonction de fetch lors de chaque changement
  }, [fetchModels]);

  return { messages, loading, error };
};

export default useFetchModels;
