import { useEffect, useState } from "react";
import './css/MyIdioms.css';
import { useAuth0 } from "@auth0/auth0-react";
import { useIdioms } from "../IdiomStore";
import IdiomsTable from "../IdiomsTable";
import { Idiom } from "../../types/types";

const MyIdioms = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const { idioms } = useIdioms();

  const submittedIdioms = idioms.filter(
    (idiom) => idiom.submittedBy != null && idiom.submittedBy === user?.sub
  );

  const savedIdioms: Idiom[] = idioms.filter(idiom => savedIds.includes(idiom.id));

  useEffect(() => {
    const fetchSavedIds = async () => {
      if (!user) return;
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch('/.netlify/functions/firestore-get-user-idioms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setSavedIds(data.idioms || []);
      } catch {
        // user sees empty table
      } finally {
        setLoadingSaved(false);
      }
    };

    fetchSavedIds();
  }, [user, getAccessTokenSilently]);

  return (
    <div className="idiom-page">
      <div className="idiom-page-header">
        <h1>Your personalized idiom page</h1>
      </div>

      <div className="profile-table-container">
        <h1>Submitted idioms</h1>
        <IdiomsTable idioms={[...submittedIdioms]} showAuthor={false} showStatus={true} />
      </div>

      <div className="profile-table-container">
        <h1>Saved idioms</h1>
        {loadingSaved ? (
          <div aria-busy="true" aria-label="Loading idioms">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : (
          <IdiomsTable idioms={[...savedIdioms]} showAuthor={true} />
        )}
      </div>
    </div>
  );
};

export default MyIdioms;
