import { useAuth0 } from '@auth0/auth0-react';
import './css/MyIdioms.css';
import IdiomForm from "../IdiomForm";

const AddIdiom = () => {
  const { user } = useAuth0();

  return (
    <div className="idiom-page">
      <div className="idiom-page-header">
        <h1>New Idioms</h1>
      </div>
      <div className="profile-table-container">
        <div>
          <p>Do you know a Russian idiom that is not in our database? Submit it here!</p>
        </div>
        {!user ? (
          <p>You must be logged in to use this feature.</p>
        ) : (
          <IdiomForm />
        )}
      </div>
    </div>
  );
};

export default AddIdiom;
