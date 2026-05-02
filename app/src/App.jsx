import { useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PlayerLobby from './pages/PlayerLobby';
import PlayerCreator from './pages/PlayerCreator';
import CharacterSheet from './pages/CharacterSheet';
import SkillsSheet from './pages/SkillsSheet';
import Spellbook from './pages/Spellbook';
import CampaignManager from './pages/CampaignManager';
import MasterDashboard from './pages/MasterDashboard';
import EncounterBuilder from './pages/EncounterBuilder';
import Bestiary from './pages/Bestiary';
import ItemsCatalog from './pages/ItemsCatalog';
import ConditionsRef from './pages/ConditionsRef';
import { LogOut, User, Sword, BookOpen, Shield, Package, AlertTriangle, ChevronDown } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center"><h2>Cargando...</h2></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
        ⚔️ D&D 5E NEXUS
      </Link>
      
      {/* Mobile Menu Toggle */}
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{ display: 'none' }}
        id="mobile-menu-toggle"
      >
        ☰
      </button>
      
      <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`} id="navbar-links">
        <button className="btn btn-ghost btn-sm" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
          <Sword size={16} /> <span className="nav-text">Inicio</span>
        </button>
        {user.role === 'dm' && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => { navigate('/bestiary'); setMobileMenuOpen(false); }}>
              <BookOpen size={16} /> <span className="nav-text">Bestiario</span>
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { navigate('/items'); setMobileMenuOpen(false); }}>
              <Package size={16} /> <span className="nav-text">Objetos</span>
            </button>

            {/* Tools Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setToolsOpen(!toolsOpen)}>
                <Shield size={16} /> <span className="nav-text">Referencia</span> <ChevronDown size={12} />
              </button>
              {toolsOpen && (
                <div className="fade-in" style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                  background: 'rgba(20, 20, 28, 0.98)', backdropFilter: 'blur(16px)',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
                  minWidth: '200px', zIndex: 200, boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                  overflow: 'hidden'
                }}>
                  <button className="dropdown-item" onClick={() => { navigate('/conditions'); setToolsOpen(false); setMobileMenuOpen(false); }}>
                    <AlertTriangle size={14} /> Condiciones
                  </button>
                  <button className="dropdown-item" onClick={() => { navigate('/items'); setToolsOpen(false); setMobileMenuOpen(false); }}>
                    <Package size={14} /> Catálogo de Objetos
                  </button>
                  <button className="dropdown-item" onClick={() => { navigate('/bestiary'); setToolsOpen(false); setMobileMenuOpen(false); }}>
                    <BookOpen size={14} /> Bestiario
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <div className="user-info">
          <User size={14} />
          <span className="user-name">{user.display_name}</span>
          <span className="badge badge-gold">
            {user.role === 'dm' ? 'DM' : 'Jugador'}
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); setMobileMenuOpen(false); }} title="Cerrar sesión">
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/player-lobby" element={<ProtectedRoute><PlayerLobby /></ProtectedRoute>} />
        <Route path="/player/create" element={<ProtectedRoute><PlayerCreator /></ProtectedRoute>} />
        <Route path="/character/:id" element={<ProtectedRoute><CharacterSheet /></ProtectedRoute>} />
        <Route path="/character/:id/skills" element={<ProtectedRoute><SkillsSheet /></ProtectedRoute>} />
        <Route path="/character/:id/spells" element={<ProtectedRoute><Spellbook /></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute><CampaignManager /></ProtectedRoute>} />
        <Route path="/master/:campaignId" element={<ProtectedRoute><MasterDashboard /></ProtectedRoute>} />
        <Route path="/master/:campaignId/encounter-builder" element={<ProtectedRoute><EncounterBuilder /></ProtectedRoute>} />
        <Route path="/bestiary" element={<ProtectedRoute><Bestiary /></ProtectedRoute>} />
        <Route path="/items" element={<ProtectedRoute><ItemsCatalog /></ProtectedRoute>} />
        <Route path="/conditions" element={<ProtectedRoute><ConditionsRef /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
