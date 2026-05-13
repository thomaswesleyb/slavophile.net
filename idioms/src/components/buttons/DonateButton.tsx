import donateButtonImage from '../../img/donate.png';

const DonateButton = () => {
  return (
    <div className="fixed top-[30px] right-0 flex justify-end mr-5">
      <a href="https://www.razomforukraine.org/donate/" target="_blank" rel="noopener noreferrer">
        <img
          className="w-[150px] h-auto cursor-pointer transition-transform duration-200 rounded-[20px] hover:scale-110"
          src={donateButtonImage}
          alt="Donate"
        />
      </a>
    </div>
  );
};

export default DonateButton;
