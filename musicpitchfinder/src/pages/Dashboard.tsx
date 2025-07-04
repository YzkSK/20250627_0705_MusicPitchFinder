import { supabase } from "../supabase";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import "./Dashboard.css";
import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [musicData, setMusicData] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true); // 初期ロードはtrue
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setUser(userData.user);

        if (userData.user) {
          const { data: musicResData, error: musicError } = await supabase
            .from("music")
            .select("*")
            .eq("profiles_id", userData.user.id);

          if (musicError) throw musicError;
          setMusicData(musicResData || []);
        } else {
          setMusicData([]);
        }
        setError(null);
      } catch (err) {
        console.error("データの取得中にエラーが発生しました:", err);
        setError(err);
        setMusicData([]);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

    if (loading) {
      return <div>Loading...</div>;
    }
  
    if (!user) {
      return (
        <div>
          {error ? (
            <div>Error: {error.message}. Please log in.</div>
          ) : (
            <div>Please log in to access the dashboard.</div>
          )}
        </div>
      );
    }
  
    const signOut = async () => {
      try {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        navigate("/");
      } catch (err) {
        console.error("サインアウト中にエラーが発生しました:", err);
        setError(err);
      }
    };
    const Header: React.FC = () => {
      return (
        <>
          <header className="header">
            <Link to="/dashboard"><h1 className="bold">Music Pitch Finder</h1></Link>
            <nav className="flex_container">
              <ul className="nav-links">
                <li>
                  <Link to="/UI_page2"><button className="button_hover">➕</button></Link>
                </li>
                <li>
                  <Link to="/UI_page3"><button className="button_hover">🎶</button></Link>
                </li>
                <li>
                  <button onClick={signOut} className="button_hover">Sign out</button>
                </li>
              </ul>
            </nav>
          </header>
          <div className="main_container">
            <div>
              {error ? (
                <div>Error: {error.message}</div>
              ) : musicData.length > 0 ? (
                <table className="list">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Original URL</th>
                      <th>Cover URL</th>
                      <th>High Pitch</th>
                      <th>Low Pitch</th>
                      <th>Optimal Pitch</th>
                      <th>Comparison Pitch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {musicData.map((musicItem) => (
                      <tr key={musicItem.id}>
                        <td>{musicItem.title}</td>
                        <td className="link"><a href={musicItem.original_url}><span>Original</span></a></td>
                        <td className="link"><a href={musicItem.cover_url}>Cover</a></td>
                        <td>{musicItem.high_pitch}</td>
                        <td>{musicItem.low_pitch}</td>
                        <td>{musicItem.optimal_pitch}</td>
                        <td>{musicItem.comparison_pitch}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>No music data found for this user.</div>
              )}
            </div>
          </div>
        </>
      );
    }
  
    return <Header />;
  }
  
  export default Dashboard;