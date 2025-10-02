import React, { useEffect, useState } from 'react';
import { CommentModelDisplay } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const fetchComments = async (): Promise<CommentModelDisplay[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/commentaire/comments/read_all`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }
  const data = await response.json();
  return data;
};

const FetchComments: React.FC = () => {
  const [comments, setComments] = useState<CommentModelDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [filter, setFilter] = useState<{ rating?: number; user_email?: string }>({});
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const loadComments = async () => {
      try {
        const fetchedComments = await fetchComments();
        setComments(fetchedComments);
      } catch (err) {
        setError('Failed to fetch comments');
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [page, filter]);

  const handleRatingFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter({
      ...filter,
      rating: e.target.value ? parseInt(e.target.value, 10) : undefined,
    });
    setPage(1); // Reset to first page when filter changes
  };

  const handleEmailFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({
      ...filter,
      user_email: e.target.value || undefined,
    });
    setPage(1); // Reset to first page when filter changes
  };

  const handleSortOrderChange = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.rating - b.rating;
    } else {
      return b.rating - a.rating;
    }
  });

  const filteredComments = sortedComments.filter((comment) => {
    return (
      (!filter.rating || comment.rating === filter.rating) &&
      (!filter.user_email || comment.user_email.includes(filter.user_email))
    );
  });

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <div className="flex space-x-4 mb-4">
        <select
          name="rating"
          value={filter.rating || ''}
          onChange={handleRatingFilterChange}
          className="border p-2 rounded"
        >
          <option value="">All Ratings</option>
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by email"
          value={filter.user_email || ''}
          onChange={handleEmailFilterChange}
          className="border p-2 rounded"
        />
        <button onClick={handleSortOrderChange} className="border p-2 rounded">
          Sort by Rating ({sortOrder === 'asc' ? 'Asc' : 'Desc'})
        </button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Commentaire</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredComments.map((comment) => (
            <TableRow key={comment.id}>
              <TableCell>{comment.titre}</TableCell>
              <TableCell>{comment.rating}/5</TableCell>
              <TableCell>{comment.user_email}</TableCell>
              <TableCell>{comment.contenu}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FetchComments;
