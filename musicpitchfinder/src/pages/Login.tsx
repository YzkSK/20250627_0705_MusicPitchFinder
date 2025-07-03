import { useState } from "react";
import { supabase } from "../supabase";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event : any) => {
    event.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMessage(error.message);
      setEmail("");
      setPassword("");
      return;
    }

    if (data) {
      navigate("/Dashboard");
      return null;
    }
  };

  return (
    <div className="border centering_parent centering_item">
      <h1 className="title">Login</h1>
      {message && <span>{message}</span>}
      <form onSubmit={handleSubmit}>
        <div className="flex">
        <input className="margin"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
          placeholder="email"
          required
        />
        <input className="margin"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
          placeholder="password"
          required
        />
        <button type="submit" className="margin button">Login</button>
        </div>
      </form>
      <span>Don't have an account?</span>
      <Link to="/register" className="color">Register.</Link>
    </div>
  );
}

export default Login;