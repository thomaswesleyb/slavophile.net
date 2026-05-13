import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Idiom } from '../../types/types';

const Admin = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [pendingIdioms, setPendingIdioms] = useState<Idiom[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch('/.netlify/functions/firestore-get-pending-idioms', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPendingIdioms(data);
        }
      } catch {
        setMessage('Failed to load pending idioms.');
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [getAccessTokenSilently]);

  const handleAction = async (idiomId: string, action: 'approve' | 'reject') => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('/.netlify/functions/firestore-approve-idiom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ idiom_id: idiomId, action }),
      });

      if (response.ok) {
        setPendingIdioms(prev => prev.filter(i => i.id !== idiomId));
        setMessage(`Idiom ${action}d.`);
      } else {
        setMessage('Action failed.');
      }
    } catch {
      setMessage('An error occurred.');
    }
  };

  if (loading) {
    return (
      <div className="idiom-page">
        <div className="idiom-page-header"><h1>Admin</h1></div>
        <div aria-busy="true" className="p-4">Loading...</div>
      </div>
    );
  }

  return (
    <div className="idiom-page">
      <div className="idiom-page-header">
        <h1>Admin — Pending Idioms</h1>
      </div>
      {message && <p role="status" className="p-4">{message}</p>}
      <div className="profile-table-container">
        {pendingIdioms.length === 0 ? (
          <p>No pending idioms.</p>
        ) : (
          <table className="profile-table">
            <thead>
              <tr>
                <th>Idiom</th>
                <th>Translation</th>
                <th>Definition</th>
                <th>Submitted By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingIdioms.map(idiom => (
                <tr key={idiom.id}>
                  <td>{idiom.idiom}</td>
                  <td>{idiom.english}</td>
                  <td>{idiom.definition}</td>
                  <td>{idiom.submittedBy}</td>
                  <td className="flex gap-2 p-2">
                    <button
                      className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
                      onClick={() => handleAction(idiom.id, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      className="px-3 py-1 bg-red-800 text-white rounded hover:bg-red-900 transition-colors"
                      onClick={() => handleAction(idiom.id, 'reject')}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Admin;
