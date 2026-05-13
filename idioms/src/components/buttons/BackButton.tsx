import { useNavigate } from 'react-router-dom';
import backButton from '../../img/back.png';

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <img
      className="relative w-10 h-10 cursor-pointer mb-4"
      src={backButton}
      alt="Back"
      onClick={() => navigate(-1)}
    />
  );
};

export default BackButton;
