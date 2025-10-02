import { useEffect, useState } from 'react';
import { DocumentationLink } from "@/types";

const useFetchDocumentation = (category: string) => {
  const [docs, setDocs] = useState<DocumentationLink[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        if (category === 'all_docs') {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documentation/all_docs/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          });
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          setDocs(data);
        } else {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documentation/docs/?categorie=${category}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          });
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          setDocs(data);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchDocs();
  }, [category]);

  return { docs, error };
};

export default useFetchDocumentation;
