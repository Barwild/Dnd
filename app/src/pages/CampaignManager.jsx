import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getCampaigns, createCampaign, deleteCampaign } from '../api';
import { Plus, Trash2, Copy, Users, Calendar } from 'lucide-react';

export default function CampaignManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const load = () => getCampaigns().then(r => setCampaigns(r.data || []));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCampaign({ name: newName.trim(), description: newDesc.trim() });
    setNewName('');
    setNewDesc('');
    load();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar esta campaña y todos sus encuentros? Los personajes NO se borrarán.')) {
      await deleteCampaign(id);
      load();
    }
  };

  return (
    <div className="container fade-in" style={{ maxWidth: '850px' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>← Inicio</button>

      <h1 style={{ color: 'var(--accent-red)', textAlign: 'center', fontSize: '2.2rem', textShadow: '0 0 20px rgba(139,0,0,0.5)' }}>
        🗡️ Campañas del Dungeon Master
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Cada campaña genera un código único que puedes compartir con tus jugadores.
      </p>

      {/* Create new */}
      <div className="glass-panel" style={{ marginBottom: '2rem', borderTop: '3px solid var(--accent-gold)' }}>
        <h3>Crear Nueva Campaña</h3>
        <input type="text" placeholder="Nombre de la campaña..." value={newName}
          onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()}
          className="input-lg" style={{ marginBottom: '0.8rem' }} />
        <textarea placeholder="Descripción (opcional)..." value={newDesc}
          onChange={e => setNewDesc(e.target.value)} rows={2} style={{ marginBottom: '1rem' }} />
        <button className="btn btn-gold" onClick={handleCreate} disabled={!newName.trim()}>
          <Plus size={16} /> Crear Campaña
        </button>
      </div>

      {/* List */}
      {campaigns.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No tienes campañas aún. ¡Crea tu primera aventura!
        </div>
      ) : (
        <div className="flex-col">
          {campaigns.map(c => {
            const isDM = c.dm_user_id === user?.id;
            return (
              <div key={c.id} className="glass-panel clickable"
                onClick={() => isDM && navigate(`/master/${c.id}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isDM ? 'pointer' : 'default', borderLeft: `4px solid ${isDM ? 'var(--accent-red)' : 'var(--accent-gold)'}` }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>{c.name}</h2>
                  <div className="flex-row" style={{ gap: '1.2rem', marginTop: '0.3rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      🎲 Código: <strong style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', letterSpacing: '2px' }}>{c.code}</strong>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <Users size={14} /> {c.member_count || 0} miembro(s)
                    </span>
                    <span className="badge badge-gold">{isDM ? 'DM' : 'Jugador'}</span>
                  </div>
                  {c.description && <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.3rem 0 0' }}>{c.description}</p>}
                </div>

                <div className="flex-row" style={{ gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm"
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(c.code); alert(`¡Código copiado: ${c.code}!`); }}>
                    <Copy size={14} /> Copiar
                  </button>
                  {isDM && (
                    <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, c.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                  {isDM && <span style={{ color: 'var(--accent-gold)', fontSize: '1.5rem' }}>→</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
