import { useState, useEffect } from 'react'
import './App.css'
import { Link } from 'react-router-dom'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export default function App() {
  const [musicData, setMusicData] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    })();
  }, []);

  console.log("User:", user?.id);

  useEffect(() => {
    const fetchMusic = async () => {
      const { data, error } = await supabase.from("music").select("*").eq('uuid',user?.id).single();
      if (error) {
        setError(error);
      } else {
        setMusicData(data || []);
      }
    };
    fetchMusic();
  }, []);

  return (
    <>
      <Link to="/Login">
        <button>
          Go to Login
        </button>
      </Link>
      <div>
        <h2>Music Data</h2>
        {error ? (
          <div>Error: {error.message}</div>
        ) : (
          <pre>{JSON.stringify(musicData, null, 2)}</pre>
        )}
      </div>
    </>
  );
}
