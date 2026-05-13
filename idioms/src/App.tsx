import './App.css';
import { Cards } from "./components/pages/Cards";
import { Header } from './components/Header';
import { Login } from "./components/pages/Login";
import { Main } from "./components/pages/Main";
import { Register } from "./components/pages/Register";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import Auth0ProviderWithHistory from "./auth0Provider";
import Profile from "./components/pages/Profile";
import AddIdiom from "./components/pages/AddIdiom";
import LoginRequired from "./components/pages/LoginRequired";
import MyIdioms from "./components/pages/MyIdioms";
import Admin from "./components/pages/Admin";
import { IdiomProvider, useIdioms } from "./components/IdiomStore";
import IdiomsDatabase from "./components/pages/IdiomsDatabase";
import DonateButton from "./components/buttons/DonateButton.tsx";

const AppContent = () => {
  const { loading } = useIdioms();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" aria-busy="true">
        <div className="skeleton-row" style={{ width: '200px' }} />
      </div>
    );
  }

  return (
    <>
      <Header />
      <Sidebar />
      <DonateButton />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cards" element={
          <div className="cardsPage">
            <LoginRequired><Cards /></LoginRequired>
          </div>
        } />
        <Route path="/profile" element={
          <div className="profilePage">
            <LoginRequired><Profile /></LoginRequired>
          </div>
        } />
        <Route path="/new-idiom" element={
          <div className="newIdiomPage">
            <LoginRequired><AddIdiom /></LoginRequired>
          </div>
        } />
        <Route path="/my-idioms" element={
          <div className="newIdiomPage">
            <LoginRequired><MyIdioms /></LoginRequired>
          </div>
        } />
        <Route path="/idioms" element={
          <div className="idiomsPage">
            <IdiomsDatabase />
          </div>
        } />
        <Route path="/admin" element={
          <div className="newIdiomPage">
            <LoginRequired><Admin /></LoginRequired>
          </div>
        } />
      </Routes>
      <Footer />
    </>
  );
};

function App() {
  return (
    <Router>
      <Auth0ProviderWithHistory>
        <IdiomProvider>
          <AppContent />
        </IdiomProvider>
      </Auth0ProviderWithHistory>
    </Router>
  );
}

export default App;
