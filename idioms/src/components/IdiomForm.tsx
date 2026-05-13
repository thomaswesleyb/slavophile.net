import { useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import IdiomRow from './IdiomRow';

interface RowData {
  id: number;
  idiom: string;
  translation: string;
  definition: string;
  example: string;
}

const emptyRow = (id: number): RowData => ({
  id,
  idiom: '',
  translation: '',
  definition: '',
  example: '',
});

function IdiomForm() {
  const { getAccessTokenSilently } = useAuth0();
  const [rows, setRows] = useState<RowData[]>([emptyRow(1)]);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleRowChange = useCallback((id: number, field: string, value: string) => {
    setRows(prev =>
      prev.map(row => (row.id === id ? { ...row, [field]: value } : row))
    );
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage(null);

    const payload = {
      rows: rows.map(row => ({
        ...row,
        example: row.example || 'N/A',
      })),
    };

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('/.netlify/functions/firestore-post-handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setSubmitMessage(
          response.status >= 400 && response.status < 500
            ? 'One or more fields are empty or invalid.'
            : 'An error occurred. Please try again later.'
        );
        return;
      }

      setSubmitMessage('New idioms submitted for review!');
      setRows([emptyRow(1)]);
    } catch {
      setSubmitMessage('An error occurred. Please try again later.');
    }
  };

  const onAddBtnClick = () => {
    setRows(prev => [...prev, emptyRow(prev.length + 1)]);
  };

  const onDeleteBtnClick = () => {
    if (rows.length > 1) {
      setRows(prev => prev.slice(0, -1));
    } else {
      setSubmitMessage('Cannot delete the only row');
    }
  };

  const onResetBtnClick = () => {
    setRows([emptyRow(1)]);
    setSubmitMessage(null);
  };

  const btnBase = "px-4 py-2 rounded cursor-pointer border-0 transition-colors mr-2";
  const btnSecondary = `${btnBase} bg-[var(--secondary-color)] text-[var(--text-color)] hover:bg-[var(--accent-color)] hover:text-white`;
  const btnPrimary = `${btnBase} bg-[var(--primary-color)] text-white hover:bg-[var(--accent-color)]`;

  return (
    <div className="w-full overflow-x-auto">
      <form onSubmit={handleSubmit}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2 text-left bg-gray-800 text-white">Idiom</th>
              <th className="border border-gray-300 p-2 text-left bg-gray-800 text-white">Translation</th>
              <th className="border border-gray-300 p-2 text-left bg-gray-800 text-white">Definition</th>
              <th className="border border-gray-300 p-2 text-left bg-gray-800 text-white">Example</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <IdiomRow key={row.id} id={row.id} data={row} onRowChange={handleRowChange} />
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={btnSecondary} onClick={onAddBtnClick}>Add</button>
          <button type="button" className={btnSecondary} onClick={onDeleteBtnClick}>Delete</button>
          <button type="button" className={btnSecondary} onClick={onResetBtnClick}>Reset</button>
          <button type="submit" className={btnPrimary}>Submit</button>
        </div>
      </form>
      {submitMessage && (
        <p role="status" aria-live="polite" className="mt-3 text-[var(--text-color)]">
          {submitMessage}
        </p>
      )}
    </div>
  );
}

export default IdiomForm;
