import logo from './logo.svg';
import './App.css';
import {Cards} from "./components/Cards";
import {Login} from "./Login";
import {Main} from "./Main";
import {Register} from "./Register";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";


function App() {
    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={<Main/>}
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
