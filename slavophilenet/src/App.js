import './App.css';
import {Cards} from "./components/Cards";
import {Header} from './components/Header';
import {Login} from "./Login";
import {Main} from "./Main";
import {Register} from "./Register";
import {BrowserRouter as Router, Link, Route, Routes} from "react-router-dom";
import {Sidebar} from "./components/Sidebar";



function App() {
    return (
        <Router>
            <Header/>
            <Sidebar/>
            <Routes>
                <Route
                    path="/"
                    element={<Main />}
                />
                <Route
                    path="/login"
                    element={<Login/>}
                />
                <Route
                    path="/register"
                    element={<Register/>}
                />
                <Route
                    path="/cards"
                    element={<div className={"cardsPage"}><Cards/></div>}
                />
            </Routes>
        </Router>
    );
}

export default App;
