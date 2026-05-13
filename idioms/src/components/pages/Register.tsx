import { Link } from "react-router-dom";
import './css/Register.css';
import BackButton from "../buttons/BackButton.tsx";

export function Register() {
  return (
    <div className="register-container">
      <div className="register-box">
        <BackButton />
        <h1>Register</h1>
        <form>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input type="text" className="form-control" id="username" placeholder="Username" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              aria-describedby="emailHelp"
              placeholder="Email"
            />
            <small id="emailHelp" className="form-text text-muted">
              We'll never share your email with anyone else.
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" className="form-control" id="password" placeholder="Password" />
          </div>
          <button type="submit" className="btn btn-primary">Submit</button>
          <Link to="/login">
            <button type="button" className="btn btn-secondary ml-2">Login</button>
          </Link>
        </form>
      </div>
    </div>
  );
}
