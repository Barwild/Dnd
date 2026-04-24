import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  getCampaign, getCharacters, getMonsters, getMonster,
  createEncounter, updateEncounter, getEncounters, deleteEncounter
} from '../api';
import { Plus, Trash2, Sword, Search, Shield, Heart, Zap, Play, Save, AlertTriangle, Users, X } from 'lucide-react';

/* ── XP Thresholds per character level (PHB p.82) ── */
const XP_THRESHOLDS = {
  1:  { easy: 25,   medium: 50,    hard: 75,    deadly: 100   },
  2:  { easy: 50,   medium: 100,   hard: 150,   deadly: 200   },
  3:  { easy: 75,   medium: 150,   hard: 225,   deadly: 400   },
  4:  { easy: 125,  medium: 250,   hard: 375,   deadly: 500   },
  5:  { easy: 250,  medium: 500,   hard: 750,   deadly: 1100  },
  6:  { easy: 300,  medium: 600,   hard: 900,   deadly: 1400  },
  7:  { easy: 350,  medium: 750,   hard: 1100,  deadly: 1700  },
  8:  { easy: 450,  medium: 900,   hard: 1400,  deadly: 2100  },
  9:  { easy: 550,  medium: 1100,  hard: 1600,  deadly: 2400  },
  10: { easy: 600,  medium: 1200,  hard: 1900,  deadly: 2800  },
  11: { easy: 800,  medium: 1600,  hard: 2400,  deadly: 3600  },
  12: { easy: 1000, medium: 2000,  hard: 3000,  deadly: 4500  },
  13: { easy: 1100, medium: 2200,  hard: 3400,  deadly: 5100  },
  14: { easy: 1250, medium: 2500,  hard: 3800,  deadly: 5700  },
  15: { easy: 1400, medium: 2800,  hard: 4300,  deadly: 6400  },
  16: { easy: 1600, medium: 3200,  hard: 4800,  deadly: 7200  },
  17: { easy: 2000, medium: 3900,  hard: 5900,  deadly: 8800  },
  18: { easy: 2100, medium: 4200,  hard: 6300,  deadly: 9500  },
  19: { easy: 2400, medium: 4900,  hard: 7300,  deadly: 10900 },
  20: { easy: 2800, medium: 5700,  hard: 8500,  deadly: 12700 },
};

/* ── Group multiplier (PHB p.82) ── */
function getMultiplier(monsterCount, partySize) {
  let effectiveCount = monsterCount;
  // Adjust for party size
  if (partySize < 3) effectiveCount += 1; // small party = harder
  if (partySize >= 6) effectiveCount -= 1; // large party = easier

  if (effectiveCount <= 1) return 1;
  if (effectiveCount === 2) return 1.5;
  if (effectiveCount <= 6) return 2;
  if (effectiveCount <= 10) return 2.5;
  if (effectiveCount <= 14) return 3;
  return 4;
}

const CR_XP = {
  '0': 10, '0.125': 25, '0.25': 50, '0.5': 100,
  '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
  '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
  '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
  '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
  '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000,
  '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
};

const CR_LABELS = { '0.125': '1/8', '0.25': '1/4', '0.5': '1/2' };
const crLabel = (cr) => CR_LABELS[cr] || cr;

export default function EncounterBuilder() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [partyLevels, setPartyLevels] = useState([]);

  // Encounter state
  const [encounterName, setEncounterName] = useState('Nuevo Encuentro');
  const [encounterMonsters, setEncounterMonsters] = useState([]);
  const [savedEncounters, setSavedEncounters] = useState([]);

  // Monster search
  const [monsterSearch, setMonsterSearch] = useState('');
  const [monsterCR, setMonsterCR] = useState('');
  const [monsterResults, setMonsterResults] = useState([]);

  // Custom party levels
  const [customLevels, setCustomLevels] = useState('');
  const [useCustomParty, setUseCustomParty] = useState(false);

  useEffect(() => {
    getCampaign(campaignId).then(r => setCampaign(r.data)).catch(() => {});
    getCharacters(campaignId).then(r => {
      const chars = r.data || [];
      setCharacters(chars);
      setPartyLevels(chars.map(c => c.level || 1));
    }).catch(() => {});
    getEncounters(campaignId).then(r => setSavedEncounters(r.data || [])).catch(() => {});
  }, [campaignId]);

  // Monster search
  const searchMonsters = async () => {
    const params = { limit: 20 };
    if (monsterSearch) params.search = monsterSearch;
    if (monsterCR) params.cr = monsterCR;
    const res = await getMonsters(params);
    setMonsterResults(res.data || []);
  };

  useEffect(() => { if (monsterSearch.length > 1 || monsterCR) searchMonsters(); }, [monsterSearch, monsterCR]);

  const addMonster = async (monster) => {
    // Get full details for XP
    let xp = monster.xp || CR_XP[monster.challenge_rating] || 0;
    setEncounterMonsters(prev => {
      const existing = prev.find(m => m.id === monster.id);
      if (existing) {
        return prev.map(m => m.id === monster.id ? { ...m, count: m.count + 1 } : m);
      }
      return [...prev, { id: monster.id, name: monster.name, cr: monster.challenge_rating, xp, hp: monster.hit_points, ac: monster.armor_class, count: 1 }];
    });
  };

  const removeMonster = (monsterId) => {
    setEncounterMonsters(prev => {
      const existing = prev.find(m => m.id === monsterId);
      if (existing && existing.count > 1) {
        return prev.map(m => m.id === monsterId ? { ...m, count: m.count - 1 } : m);
      }
      return prev.filter(m => m.id !== monsterId);
    });
  };

  const clearEncounter = () => setEncounterMonsters([]);

  // ── Calculations ──
  const effectiveLevels = useCustomParty && customLevels.trim()
    ? customLevels.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0)
    : partyLevels;

  const partySize = effectiveLevels.length;
  const totalMonsters = encounterMonsters.reduce((sum, m) => sum + m.count, 0);
  const baseXP = encounterMonsters.reduce((sum, m) => sum + m.xp * m.count, 0);
  const multiplier = getMultiplier(totalMonsters, partySize);
  const adjustedXP = Math.floor(baseXP * multiplier);

  const thresholds = { easy: 0, medium: 0, hard: 0, deadly: 0 };
  effectiveLevels.forEach(lvl => {
    const t = XP_THRESHOLDS[Math.min(Math.max(lvl, 1), 20)];
    thresholds.easy += t.easy;
    thresholds.medium += t.medium;
    thresholds.hard += t.hard;
    thresholds.deadly += t.deadly;
  });

  let difficulty = 'Trivial';
  let diffColor = '#555';
  if (adjustedXP >= thresholds.deadly) { difficulty = '☠️ Mortal'; diffColor = '#d44'; }
  else if (adjustedXP >= thresholds.hard) { difficulty = '🔥 Difícil'; diffColor = '#e84'; }
  else if (adjustedXP >= thresholds.medium) { difficulty = '⚔️ Medio'; diffColor = 'var(--accent-gold)'; }
  else if (adjustedXP >= thresholds.easy) { difficulty = '🟢 Fácil'; diffColor = 'var(--accent-green)'; }

  // ── Save encounter ──
  const saveEncounter = async () => {
    try {
      const data = {
        campaign_id: parseInt(campaignId),
        name: encounterName || 'Encuentro',
      };
      const res = await createEncounter(data);
      await updateEncounter(res.data.id, {
        combatants: JSON.stringify(encounterMonsters),
        status: 'preparing'
      });
      getEncounters(campaignId).then(r => setSavedEncounters(r.data || []));
    } catch (e) { console.error(e); }
  };

  const loadEncounter = (enc) => {
    setEncounterName(enc.name);
    try {
      setEncounterMonsters(JSON.parse(enc.combatants || '[]'));
    } catch { setEncounterMonsters([]); }
  };

  const deleteSavedEncounter = async (id) => {
    if (!window.confirm('¿Eliminar este encuentro guardado?')) return;
    await deleteEncounter(id);
    getEncounters(campaignId).then(r => setSavedEncounters(r.data || []));
  };

  const launchCombat = () => {
    // Navigate to master dashboard — the encounter data can be passed via state
    navigate(`/master/${campaignId}`, {
      state: { launchEncounter: encounterMonsters, encounterName }
    });
  };

  if (!campaign) return <div className="page-center"><h2>Cargando...</h2></div>;

  return (
    <div className="container fade-in" style={{ maxWidth: '1300px' }}>
      <div className="flex-row flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/master/${campaignId}`)}>← Dashboard</button>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--accent-red)' }}>⚔️ Constructor de Encuentros</h1>
        <span className="badge badge-gold" style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>{campaign.name}</span>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* LEFT: Monster search */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <div className="glass-panel" style={{ borderTop: '3px solid var(--accent-red)' }}>
            <h3><Search size={16} /> Buscar Monstruos</h3>
            <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '0.8rem' }}>
              <input type="text" placeholder="Nombre..." value={monsterSearch}
                onChange={e => setMonsterSearch(e.target.value)} style={{ flex: 1 }} />
              <select value={monsterCR} onChange={e => setMonsterCR(e.target.value)} style={{ width: '80px' }}>
                <option value="">CR</option>
                {['0', '0.125', '0.25', '0.5', ...Array.from({ length: 30 }, (_, i) => String(i + 1))].map(cr => (
                  <option key={cr} value={cr}>CR {crLabel(cr)}</option>
                ))}
              </select>
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {monsterResults.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid #222' }}>
                  <div>
                    <strong style={{ color: 'var(--accent-gold)' }}>{m.name}</strong>
                    <div style={{ fontSize: '0.7rem', color: '#888' }}>
                      CR {crLabel(m.challenge_rating)} • CA {m.armor_class} • PG {m.hit_points} • {m.xp} XP
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => addMonster(m)} style={{ padding: '0.2rem 0.6rem' }}>
                    <Plus size={12} />
                  </button>
                </div>
              ))}
              {monsterSearch.length <= 1 && !monsterCR && (
                <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '1rem' }}>Busca monstruos por nombre o CR</p>
              )}
            </div>
          </div>

          {/* Saved Encounters */}
          {savedEncounters.length > 0 && (
            <div className="glass-panel" style={{ marginTop: '1rem', borderTop: '3px solid var(--accent-gold)' }}>
              <h3><Save size={16} /> Encuentros Guardados</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {savedEncounters.map(enc => (
                  <div key={enc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.8rem', borderRadius: '6px' }}>
                    <span style={{ color: '#ddd', cursor: 'pointer' }} onClick={() => loadEncounter(enc)}>{enc.name}</span>
                    <div className="flex-row" style={{ gap: '0.3rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => loadEncounter(enc)} style={{ padding: '0.2rem 0.5rem' }}>Cargar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteSavedEncounter(enc.id)} style={{ padding: '0.2rem 0.5rem' }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Encounter composition */}
        <div style={{ flex: '1.3', minWidth: '350px' }}>
          <div className="glass-panel" style={{ borderTop: '3px solid var(--accent-gold)' }}>
            <div className="flex-row flex-between" style={{ marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <input type="text" value={encounterName} onChange={e => setEncounterName(e.target.value)}
                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--accent-gold)', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'Cinzel, serif', width: '100%', outline: 'none' }} />
              </div>
              <div className="flex-row" style={{ gap: '0.3rem' }}>
                <button className="btn btn-gold btn-sm" onClick={saveEncounter} disabled={encounterMonsters.length === 0}>
                  <Save size={14} /> Guardar
                </button>
                <button className="btn btn-danger btn-sm" onClick={clearEncounter} disabled={encounterMonsters.length === 0}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {encounterMonsters.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                Añade monstruos desde la búsqueda para construir tu encuentro.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {encounterMonsters.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0.8rem',
                    background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '3px solid var(--accent-red)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#fff' }}>{m.name}</strong>
                      <span style={{ color: 'var(--accent-gold)', marginLeft: '0.5rem' }}>×{m.count}</span>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>
                        CR {crLabel(m.cr)} • <Shield size={10} /> {m.ac} • <Heart size={10} /> {m.hp} • {m.xp} XP c/u
                      </div>
                    </div>
                    <div className="flex-row" style={{ gap: '0.3rem' }}>
                      <button className="btn btn-sm btn-icon" onClick={() => addMonster(m)}
                        style={{ width: '24px', height: '24px', padding: 0, background: 'rgba(0,100,0,0.5)', border: '1px solid #3a3', color: '#fff', fontSize: '0.8rem' }}>+</button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeMonster(m.id)}
                        style={{ width: '24px', height: '24px', padding: 0, fontSize: '0.8rem' }}>−</button>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div style={{ borderTop: '1px solid #333', paddingTop: '0.8rem', marginTop: '0.5rem' }}>
                  <div className="flex-row flex-between" style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Monstruos totales:</span>
                    <strong style={{ color: '#fff' }}>{totalMonsters}</strong>
                  </div>
                  <div className="flex-row flex-between" style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>XP base:</span>
                    <strong style={{ color: 'var(--accent-gold)' }}>{baseXP.toLocaleString()}</strong>
                  </div>
                  <div className="flex-row flex-between" style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Multiplicador de grupo (×{multiplier}):</span>
                    <strong style={{ color: 'var(--accent-gold)' }}>{adjustedXP.toLocaleString()} XP ajustado</strong>
                  </div>
                </div>

                {/* Launch */}
                <button className="btn btn-gold btn-lg" style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={launchCombat}>
                  <Play size={18} /> ¡Lanzar Combate!
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Difficulty panel */}
        <div style={{ flex: '0.8', minWidth: '260px' }}>
          {/* Party config */}
          <div className="glass-panel" style={{ borderTop: '3px solid var(--accent-blue)', marginBottom: '1rem' }}>
            <h3><Users size={16} /> Grupo ({partySize} PJs)</h3>
            {!useCustomParty ? (
              <div style={{ fontSize: '0.85rem' }}>
                {characters.length > 0 ? characters.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid #222' }}>
                    <span style={{ color: '#ddd' }}>{c.name}</span>
                    <span style={{ color: 'var(--accent-gold)' }}>Nv {c.level}</span>
                  </div>
                )) : <p style={{ color: 'var(--text-dim)' }}>No hay PJs en la campaña</p>}
              </div>
            ) : (
              <div>
                <input type="text" placeholder="Ej: 3, 4, 5, 5" value={customLevels}
                  onChange={e => setCustomLevels(e.target.value)}
                  style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Niveles separados por comas</p>
              </div>
            )}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem', width: '100%' }}
              onClick={() => setUseCustomParty(!useCustomParty)}>
              {useCustomParty ? 'Usar PJs de campaña' : 'Niveles personalizados'}
            </button>
          </div>

          {/* Difficulty meter */}
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}><Zap size={16} /> Dificultad</h3>

            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: diffColor, marginBottom: '1rem' }}>
              {difficulty}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Fácil', value: thresholds.easy, color: 'var(--accent-green)' },
                { label: 'Medio', value: thresholds.medium, color: 'var(--accent-gold)' },
                { label: 'Difícil', value: thresholds.hard, color: '#e84' },
                { label: 'Mortal', value: thresholds.deadly, color: '#d44' },
              ].map(t => {
                const pct = t.value > 0 ? Math.min((adjustedXP / t.value) * 100, 100) : 0;
                return (
                  <div key={t.label}>
                    <div className="flex-row flex-between" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                      <span style={{ color: t.color }}>{t.label}</span>
                      <span style={{ color: 'var(--text-dim)' }}>{t.value.toLocaleString()} XP</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                      <div style={{ background: t.color, height: '100%', width: `${pct}%`, transition: 'width 0.3s', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {adjustedXP > 0 && partySize > 0 && (
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                XP por jugador: <strong style={{ color: 'var(--accent-gold)' }}>{Math.floor(baseXP / partySize).toLocaleString()}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
