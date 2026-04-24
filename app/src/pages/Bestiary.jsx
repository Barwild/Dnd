import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMonsters, getMonster, getMonstersCount, getImageUrl } from '../api';
import { Search, ChevronDown, ChevronUp, Shield, Heart, Zap, BookOpen } from 'lucide-react';

const CR_LABELS = { '0.125': '1/8', '0.25': '1/4', '0.5': '1/2' };

export default function Bestiary() {
  const navigate = useNavigate();
  const [monsters, setMonsters] = useState([]);
  const [search, setSearch] = useState('');
  const [crFilter, setCrFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);

  const PER_PAGE = 24;

  const loadMonsters = async () => {
    const params = { skip: page * PER_PAGE, limit: PER_PAGE };
    if (search) params.search = search;
    if (crFilter) params.cr = crFilter;
    if (typeFilter) params.type = typeFilter;
    
    const [res, countRes] = await Promise.all([
      getMonsters(params),
      getMonstersCount(params)
    ]);
    setMonsters(res.data || []);
    setTotal(countRes.data?.count || 0);
  };

  useEffect(() => { loadMonsters(); }, [page, search, crFilter, typeFilter]);

  const expandMonster = async (monsterId) => {
    if (expanded === monsterId) { setExpanded(null); return; }
    const res = await getMonster(monsterId);
    setDetail(res.data);
    setExpanded(monsterId);
  };

  const mod = (v) => { const m = Math.floor(((v || 10) - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };
  const crLabel = (cr) => CR_LABELS[cr] || cr;
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="container fade-in" style={{ maxWidth: '1200px' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>← Inicio</button>

      <h1 style={{ textAlign: 'center', color: 'var(--accent-red)', fontSize: '2.5rem', marginBottom: '0.3rem' }}>
        📖 Bestiario
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        {total} criaturas del Compendio D&D 5E en español
      </p>

      {/* Filters */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="flex-row" style={{ gap: '0.8rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Buscar monstruo..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              style={{ paddingLeft: '36px' }} />
          </div>
          <select value={crFilter} onChange={e => { setCrFilter(e.target.value); setPage(0); }} style={{ width: '100px' }}>
            <option value="">Todo CR</option>
            {['0', '0.125', '0.25', '0.5', ...Array.from({ length: 30 }, (_, i) => String(i + 1))].map(cr => (
              <option key={cr} value={cr}>CR {crLabel(cr)}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }} style={{ width: '140px' }}>
            <option value="">Todo Tipo</option>
            {['Aberración', 'Bestia', 'Celestial', 'Constructo', 'Dragón', 'Elemental', 'Feérico', 'Infernal', 'Gigante', 'Humanoide', 'Monstruosidad', 'Cieno', 'Planta', 'No-muerto'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Monster Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {monsters.map(m => (
          <div key={m.id} className="glass-panel clickable" onClick={() => expandMonster(m.id)}
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--accent-red)' }}>
            <div className="flex-row flex-between">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{m.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.type}</span>
              </div>
              <div className="flex-row" style={{ gap: '0.5rem' }}>
                <span className="badge badge-red">CR {crLabel(m.challenge_rating)}</span>
                <span className="badge badge-blue"><Shield size={10} /> {m.armor_class}</span>
                <span className="badge badge-green"><Heart size={10} /> {m.hit_points}</span>
              </div>
            </div>

            {expanded === m.id && detail && (
              <div className="fade-in" style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.3rem', marginBottom: '1rem' }}>
                  {[['FUE', detail.strength], ['DES', detail.dexterity], ['CON', detail.constitution], ['INT', detail.intelligence], ['SAB', detail.wisdom], ['CAR', detail.charisma]].map(([label, val]) => (
                    <div key={label} style={{ textAlign: 'center', padding: '0.4rem', background: 'rgba(0,0,0,0.4)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{val}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{mod(val)}</div>
                    </div>
                  ))}
                </div>

                {/* Info */}
                <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.8rem' }}>
                  <div><strong style={{ color: 'var(--accent-gold)' }}>Tamaño:</strong> {detail.size} • <strong style={{ color: 'var(--accent-gold)' }}>Alineamiento:</strong> {detail.alignment}</div>
                  <div><strong style={{ color: 'var(--accent-gold)' }}>Dados de Golpe:</strong> {detail.hit_dice}</div>
                  <div><strong style={{ color: 'var(--accent-gold)' }}>Idiomas:</strong> {detail.languages || 'Ninguno'}</div>
                  <div><strong style={{ color: 'var(--accent-gold)' }}>XP:</strong> {detail.xp}</div>
                </div>

                {/* Resistances */}
                {(() => { try {
                  const res = JSON.parse(detail.damage_resistances || '[]');
                  const imm = JSON.parse(detail.damage_immunities || '[]');
                  return (res.length + imm.length) > 0 ? (
                    <div style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>
                      {res.length > 0 && <div><strong style={{ color: '#8bf' }}>Resistencias:</strong> {res.join(', ')}</div>}
                      {imm.length > 0 && <div><strong style={{ color: '#f88' }}>Inmunidades:</strong> {imm.join(', ')}</div>}
                    </div>
                  ) : null;
                } catch { return null; } })()}

                {/* Special Abilities */}
                {(() => { try {
                  const abilities = JSON.parse(detail.special_abilities || '[]');
                  return abilities.length > 0 ? (
                    <div style={{ marginBottom: '0.8rem' }}>
                      <strong style={{ color: 'var(--accent-gold)', fontSize: '0.85rem' }}>Habilidades Especiales:</strong>
                      {abilities.map((a, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                          <strong style={{ color: 'var(--accent-red-bright)' }}>{a.name}:</strong>
                          <span style={{ color: '#ccc' }}> {a.desc}</span>
                        </div>
                      ))}
                    </div>
                  ) : null;
                } catch { return null; } })()}

                {/* Actions */}
                {(() => { try {
                  const actions = JSON.parse(detail.actions || '[]');
                  return actions.length > 0 ? (
                    <div style={{ marginBottom: '0.8rem' }}>
                      <strong style={{ color: 'var(--accent-gold)', fontSize: '0.85rem' }}>Acciones:</strong>
                      {actions.map((a, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                          <strong style={{ color: 'var(--accent-red-bright)' }}>{a.name}:</strong>
                          <span style={{ color: '#ccc' }}> {a.desc}</span>
                        </div>
                      ))}
                    </div>
                  ) : null;
                } catch { return null; } })()}

                {/* Legendary Actions */}
                {(() => { try {
                  const leg = JSON.parse(detail.legendary_actions || '[]');
                  return leg.length > 0 ? (
                    <div>
                      <strong style={{ color: '#c9b', fontSize: '0.85rem' }}>Acciones Legendarias:</strong>
                      {leg.map((a, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                          <strong style={{ color: '#c9b' }}>{a.name}:</strong>
                          <span style={{ color: '#ccc' }}> {a.desc}</span>
                        </div>
                      ))}
                    </div>
                  ) : null;
                } catch { return null; } })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-row flex-center" style={{ gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Anterior</button>
          <span style={{ color: 'var(--text-muted)' }}>Página {page + 1} de {totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}
