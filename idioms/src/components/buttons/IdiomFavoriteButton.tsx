import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

interface IdiomFavoriteButtonProps {
  idiomId: string | undefined;
}

function IdiomFavoriteButton({ idiomId }: IdiomFavoriteButtonProps) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAccessTokenSilently } = useAuth0();

  const handleFavorite = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('/.netlify/functions/firestore-save-idiom-handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ idiom_id: idiomId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setError(null);
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setSuccess(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleFavorite}
        className="p-[10px] bg-[#4CAF50] text-white border-0 cursor-pointer hover:bg-[#45a049] transition-colors"
        aria-label={success ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={success}
      >
        {success ? '★' : '☆'} Favorite
      </button>
      {success && (
        <p className="text-[#2e7d32] text-sm mt-2" role="status">Idiom favorited!</p>
      )}
      {error && (
        <p className="text-[#d32f2f] text-sm mt-2" role="alert">{error}</p>
      )}
    </div>
  );
}

export default IdiomFavoriteButton;
