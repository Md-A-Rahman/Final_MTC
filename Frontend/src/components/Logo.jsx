import { Link } from 'react-router-dom'

const Logo = ({ useLink = true }) => {
  const content = (
    <>
      <img 
        src="https://thequranfoundation.org/wp-content/uploads/2024/02/The_Quran_Foundation_TQF_Organization_Charity_Donation_Logo.png" 
        alt="Logo" 
        className="h-16 w-auto mr-8" 
      />
      <span className="text-xl font-poppins font-bold text-black">
        <span className="text-accent-600">Mohalla</span> Tuition Center Program
      </span>
    </>
  );

  return useLink ? (
    <Link to="/" className="flex items-center">
      {content}
    </Link>
  ) : (
    <div className="flex items-center">
      {content}
    </div>
  );
}

export default Logo
