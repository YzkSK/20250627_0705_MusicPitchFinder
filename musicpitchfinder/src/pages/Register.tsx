import { useState } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event : any) => {
    event.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      setMessage("User account created!");
    }

    setEmail("");
    setPassword("");
  };

  return (
    <div className="border centering_parent centering_item">
      <h1 className="font">Register</h1>
      {message && <span>{message}</span>}
      <form onSubmit={handleSubmit} >
        <div className="flex">
        <input className="margin"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
          placeholder="Email"
          required
        />
        <input className="margin"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
          placeholder="Password"
          required
        />
        <button type="submit" className="margin button">Create Account</button>
        </div>
      </form>
      <span>Already have an account?</span>
      <Link to="/login" className="color">Log in.</Link>
    </div>
  );
}

export default Register;