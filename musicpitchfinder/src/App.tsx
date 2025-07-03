import './App.css'
import { Link } from 'react-router-dom'

export default function App() {
  return (
    <>
      <Link to="/Login">
        <button>
          Go to Login
        </button>
      </Link>
    </>
  )
}