import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Providers from './pages/Providers';
import ProviderDetail from './pages/ProviderDetail';
import ProviderDashboard from './pages/ProviderDashboard';

function NavBar({ theme, setTheme }) {
  const navigate = useNavigate();
  const loggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">🔧 FixTriage</Link>
      <NavLink to="/" end>Home</NavLink>
      <NavLink to="/providers">Browse Providers</NavLink>
      <NavLink to="/dashboard">Provider Dashboard</NavLink>
      <button
        className="theme-toggle"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle dark mode"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      {loggedIn && (
        <button className="btn btn-danger" onClick={handleLogout}>
          Log out
        </button>
      )}
    </nav>
  );
}

function App() {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <NavBar theme={theme} setTheme={setTheme} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/providers/:id" element={<ProviderDetail />} />
        <Route path="/dashboard" element={<ProviderDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;