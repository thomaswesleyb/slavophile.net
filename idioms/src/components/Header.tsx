import { Link } from "react-router-dom";
import { useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import LoginButton from "./buttons/LoginButton.tsx";

export function Header() {
  const { user, isLoading, getAccessTokenSilently } = useAuth0();

  const initializeUser = async () => {
    try {
      const token = await getAccessTokenSilently();
      await fetch('/.netlify/functions/firestore-initialize-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user?.name,
          email: user?.email,
        }),
      });
    } catch {
      // silently fail — user initialization is best-effort
    }
  };

  useEffect(() => {
    if (user) {
      initializeUser();
    }
  }, [user]); // getAccessTokenSilently is stable, intentionally omitted

  return (
    <header className="fixed top-0 w-full z-[1000] bg-[var(--primary-color)] text-[var(--background-color)] px-2 py-2 flex justify-between items-center border-b-2 border-[var(--secondary-color)] shadow-sm">
      <Link to="/" className="no-underline text-inherit">
        <h1 className="ml-4 text-inherit select-text">Russianidioms.com</h1>
      </Link>
      <div className="flex gap-4">
        {!isLoading && !user && <LoginButton />}
        {!isLoading && user && <LoginButton useLogout={true} />}
        {!isLoading && user && (
          <Link
            to="/profile"
            className="text-[#61dafb] no-underline text-base border-2 border-[#61dafb] rounded px-4 py-2 transition-all hover:bg-[#61dafb] hover:text-white"
          >
            Profile
          </Link>
        )}
      </div>
    </header>
  );
}
