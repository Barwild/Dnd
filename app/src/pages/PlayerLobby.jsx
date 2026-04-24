import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getCharacters, getRaces, getClasses, deleteCharacter, joinCampaign, getCampaigns, leaveCampaign } from '../api';
import { Plus, Trash2, Play, Link2, LogOut } from 'lucide-react';

export default function PlayerLobby() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [racesMap, setRacesMap] = useState({});
  const [classesMap, setClassesMap] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const load = async () => {
    try {
      const [charRes, raceRes, classRes, campRes] = await Promise.all([
        getCharacters(), getRaces(), getClasses(), getCampaigns()
      ]);
      setCharacters(charRes.data || []);
      const rm = {}; (raceRes.data || []).forEach(r => rm[r.id] = r.name); setRacesMap(rm);
      const cm = {}; (classRes.data || []).forEach(c => cm[c.id] = c.name); setClassesMap(cm);
      setCampaigns(campRes.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const handleJoin = async () => {
    if (!joinCode.trim() || joinCode.trim().length < 4) { setJoinError('Introduce un código válido'); return; }
    try {
      await joinCampaign(joinCode.trim().toUpperCase());
      setJoinError('');
      setJoinCode('');
      load();
    } catch (e) {
      setJoinError(e.response?.data?.detail || 'Campaña no encontrada');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('¿Destruir este personaje permanentemente?')) {
      await deleteCharacter(id);
      load();
    }
  };

  const handleLeaveCampaign = async (campId) => {
    await leaveCampaign(campId);
    load();
  };

  return (
    <div className="container fade-in" style={{ maxWidth: '850px' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>← Inicio</button>

      <h1 style={{ marginBottom: '0.5rem' }}>🎭 Lobby del Jugador</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Bienvenido, <strong style={{ color: 'var(--accent-gold)' }}>{user?.display_name}</strong>
      </p>

      {/* Join Campaign */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem', borderTop: '3px solid var(--accent-gold)' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>🎲 Unirse a una Campaña</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Introduce el código de 6 caracteres que te ha dado tu Dungeon Master.
        </p>
        <div className="flex-row">
          <input type="text" placeholder="CÓDIGO" maxLength={6} value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            style={{ width: '180px', fontSize: '1.3rem', textAlign: 'center', letterSpacing: '3px', fontWeight: 'bold', color: 'var(--accent-gold)' }} />
          <button className="btn btn-gold" onClick={handleJoin}><Link2 size={16} /> Unirse</button>
        </div>
        {joinError && <p style={{ color: '#f88', marginTop: '0.5rem', fontSize: '0.85rem' }}>{joinError}</p>}
      </div>

      {/* Active Campaigns */}
      {campaigns.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>Campañas Activas</h3>
          <div className="flex-col" style={{ gap: '0.5rem' }}>
            {campaigns.map(c => (
              <div key={c.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderLeft: `3px solid ${c.dm_user_id === user.id ? 'var(--accent-red)' : 'var(--accent-gold)'}` }}>
                <div>
                  <strong style={{ color: '#fff' }}>{c.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    DM: {c.dm_name} • {c.member_count} miembro(s) • Código: <span style={{ color: 'var(--accent-gold)' }}>{c.code}</span>
                  </div>
                </div>
                <div className="flex-row" style={{ gap: '0.5rem' }}>
                  {c.dm_user_id !== user.id && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleLeaveCampaign(c.id)}>
                      <LogOut size={14} /> Salir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Characters */}
      <div className="flex-row flex-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Mis Personajes</h2>
        <button className="btn btn-gold" onClick={() => navigate('/player/create')}>
          <Plus size={16} /> Forjar Nuevo Héroe
        </button>
      </div>

      <div className="flex-col">
        {characters.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No tienes personajes. ¡Es hora de crear uno!
          </div>
        ) : (
          characters.map(char => (
            <div key={char.id} className="glass-panel clickable" onClick={() => navigate(`/character/${char.id}`)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>{char.name}</h3>
                <div style={{ color: 'var(--accent-gold)', fontSize: '0.9rem' }}>
                  Nivel {char.level} • {racesMap[char.race_id] || 'Raza'} • {classesMap[char.class_id] || 'Clase'}
                </div>
              </div>
              <div className="flex-row" style={{ gap: '0.5rem' }}>
                <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, char.id)}>
                  <Trash2 size={14} />
                </button>
                <button className="btn btn-gold btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/character/${char.id}`); }}>
                  <Play size={14} /> Jugar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
