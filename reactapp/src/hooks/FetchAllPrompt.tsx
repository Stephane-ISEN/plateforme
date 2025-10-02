import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types';

const useFetchAll = (user: { email: string } | null, shouldFetch: boolean | null) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const FetchAll = useCallback(async () => {
        if (!user || !shouldFetch) return;
        
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
                { role: 'api', content: prompt.generated_response },
            ]);
            
            console.log('Transformed messages:', transformedMessages); // Add a log to inspect the transformed messages
            
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
    }, [user, shouldFetch]);

    useEffect(() => {
        FetchAll().then(r => r);
    }, [FetchAll]);

    return { messages, loading, error };
};

export default useFetchAll;