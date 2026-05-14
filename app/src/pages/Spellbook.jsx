import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCharacter, getClass as getClassApi, getSpells, updateCharacter } from '../api';
import { Save, Search, BookOpen, Flame } from 'lucide-react';

const CANTRIPS_KNOWN = {
  'mago': [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
  'hechicero': [4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6],
  'bardo': [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  'clérigo': [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
  'druida': [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  'brujo': [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  'artífice': [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
};

const SPELLS_KNOWN = {
  'bardo': [4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22],
  'hechicero': [2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15],
  'explorador': [0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11],
  'brujo': [2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15],
};

const PREPARED_CASTERS = ['mago', 'clérigo', 'druida', 'paladín', 'artífice'];
const NON_CASTERS = ['bárbaro', 'guerrero', 'monje', 'pícaro'];
const FULL_CASTERS = ['bardo', 'clérigo', 'druida', 'hechicero', 'mago'];
const HALF_CASTERS = ['paladín', 'explorador', 'artífice'];

const SPELLCASTING_ABILITY = {
  'mago': 'INT', 'hechicero': 'CHA', 'bardo': 'CHA', 'paladín': 'CHA',
  'clérigo': 'WIS', 'druida': 'WIS', 'explorador': 'WIS', 'brujo': 'CHA',
  'artífice': 'INT',
};

const SPELL_SLOTS_TABLE = [
  [0,0,0,0,0,0,0,0,0], // Lvl 0
  [2,0,0,0,0,0,0,0,0], // Lvl 1
  [3,0,0,0,0,0,0,0,0], // Lvl 2
  [4,2,0,0,0,0,0,0,0], // Lvl 3
  [4,3,0,0,0,0,0,0,0], // Lvl 4
  [4,3,2,0,0,0,0,0,0], // Lvl 5
  [4,3,3,0,0,0,0,0,0], // Lvl 6
  [4,3,3,1,0,0,0,0,0], // Lvl 7
  [4,3,3,2,0,0,0,0,0], // Lvl 8
  [4,3,3,3,1,0,0,0,0], // Lvl 9
  [4,3,3,3,2,0,0,0,0], // Lvl 10
  [4,3,3,3,2,1,0,0,0], // Lvl 11
  [4,3,3,3,2,1,0,0,0], // Lvl 12
  [4,3,3,3,2,1,1,0,0], // Lvl 13
  [4,3,3,3,2,1,1,0,0], // Lvl 14
  [4,3,3,3,2,1,1,1,0], // Lvl 15
  [4,3,3,3,2,1,1,1,0], // Lvl 16
  [4,3,3,3,2,1,1,1,1], // Lvl 17
  [4,3,3,3,3,1,1,1,1], // Lvl 18
  [4,3,3,3,3,2,1,1,1], // Lvl 19
  [4,3,3,3,3,2,2,1,1], // Lvl 20
];

const WARLOCK_SLOTS = [
  { count: 0, level: 0 },
  { count: 1, level: 1 }, { count: 2, level: 1 }, { count: 2, level: 2 }, { count: 2, level: 2 },
  { count: 2, level: 3 }, { count: 2, level: 3 }, { count: 2, level: 4 }, { count: 2, level: 4 },
  { count: 2, level: 5 }, { count: 2, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 },
  { count: 3, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 },
  { count: 4, level: 5 }, { count: 4, level: 5 }, { count: 4, level: 5 }, { count: 4, level: 5 },
];

export default function Spellbook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [statsObj, setStatsObj] = useState({});
  const [charClass, setCharClass] = useState(null);
  const [allSpells, setAllSpells] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [expandedSpell, setExpandedSpell] = useState(null);
  const [campaignCharacters, setCampaignCharacters] = useState([]);

  useEffect(() => {
    getCharacter(id).then(res => {
      const c = res.data;
      let s = {};
      try { s = JSON.parse(c.stats || '{}'); } catch {}
      if (!s.spells || s.spells.length === 0) {
        // Fallback: load from spell_list (for chars created before fix)
        try { s.spells = JSON.parse(c.spell_list || '[]'); } catch { s.spells = []; }
      }
      if (!s.spellSlots) {
        s.spellSlots = {};
        for (let i = 1; i <= 9; i++) s.spellSlots[i] = { max: 0, used: 0 };
      }
      setCharacter(c);
      setStatsObj(s);
      if (c.class_id) getClassApi(c.class_id).then(r => setCharClass(r.data));
      
      if (c.campaign_id) {
        import('../api').then(api => {
          api.getCharacters(c.campaign_id).then(res => {
            const myChars = (res.data || []).filter(char => char.user_id === c.user_id);
            setCampaignCharacters(myChars);
          });
        });
      }
    });
    getSpells({ limit: 500 }).then(r => setAllSpells(r.data || []));
  }, [id]);

  const saveSpells = async () => {
    setSaving(true);
    await updateCharacter(id, {
      stats: JSON.stringify(statsObj),
      spell_list: JSON.stringify(statsObj.spells || [])
    });
    setSaving(false);
  };

  const cn = charClass?.name?.toLowerCase() || '';
  const isNonCaster = NON_CASTERS.includes(cn);
  const lvlIdx = Math.min((character?.level || 1) - 1, 19);

  const getSpellLevel = (spell) => spell.level || 0;

  const knownSpells = statsObj.spells || [];
  const knownByLevel = {};
  for (let i = 0; i <= 9; i++) {
    knownByLevel[i] = knownSpells.filter(sIdx => {
      const sp = allSpells.find(s => s.index === sIdx);
      return sp && getSpellLevel(sp) === i;
    });
  }

  const currentCantrips = knownByLevel[0]?.length || 0;
  const maxCantrips = (CANTRIPS_KNOWN[cn] || [0])[lvlIdx] || 0;
  const currentNonCantrips = Object.keys(knownByLevel).filter(k => k > 0).reduce((sum, k) => sum + (knownByLevel[k]?.length || 0), 0);

  let maxSpells = 0, spellLimitLabel = '';
  if (SPELLS_KNOWN[cn]) {
    maxSpells = (SPELLS_KNOWN[cn][lvlIdx] || 0);
    spellLimitLabel = 'Conjuros conocidos';
  } else if (PREPARED_CASTERS.includes(cn)) {
    const abilityKey = SPELLCASTING_ABILITY[cn] || 'INT';
    const abilityMod = Math.floor(((statsObj[abilityKey] || 10) - 10) / 2);
    const isHalfCaster = HALF_CASTERS.includes(cn);
    const casterLevel = isHalfCaster ? Math.floor((character?.level || 1) / 2) : (character?.level || 1);
    maxSpells = Math.max(1, abilityMod + casterLevel);
    spellLimitLabel = 'Conjuros preparados';
  }

  const canAdd = (spellIndex) => {
    if (isNonCaster) return false;
    const sp = allSpells.find(s => s.index === spellIndex);
    if (!sp) return false;
    if (getSpellLevel(sp) === 0) return currentCantrips < maxCantrips;
    if (maxSpells > 0) return currentNonCantrips < maxSpells;
    return true;
  };

  const toggleSpell = (spellIndex) => {
    if (knownSpells.includes(spellIndex)) {
      setStatsObj(prev => ({ ...prev, spells: prev.spells.filter(s => s !== spellIndex) }));
    } else {
      if (!canAdd(spellIndex)) return;
      setStatsObj(prev => ({ ...prev, spells: [...prev.spells, spellIndex] }));
    }
  };

  const restoreSpellSlots = () => {
    const newSlots = {};
    const lvlIdx = Math.min((character?.level || 1) - 1, 19);
    
    if (cn === 'brujo') {
      // Warlocks use pact magic (different slots)
      const warlockInfo = WARLOCK_SLOTS[lvlIdx] || { count: 1, level: 1 };
      for (let i = 1; i <= 9; i++) {
        newSlots[i] = { max: i <= warlockInfo.level ? warlockInfo.count : 0, used: 0 };
      }
    } else if (HALF_CASTERS.includes(cn)) {
      // Half-casters get half the spell slots
      const fullSlots = SPELL_SLOTS_TABLE[Math.min(lvlIdx, 19)];
      for (let i = 1; i <= 9; i++) {
        const halfLevel = Math.max(0, lvlIdx - 6) + 1;
        const slotLevel = Math.min(halfLevel, 19);
        const slots = SPELL_SLOTS_TABLE[slotLevel] || [0,0,0,0,0,0,0,0,0];
        newSlots[i] = { max: slots[i-1] || 0, used: 0 };
      }
    } else if (FULL_CASTERS.includes(cn)) {
      // Full casters (wizard, sorcerer, etc.)
      const slots = SPELL_SLOTS_TABLE[lvlIdx] || [0,0,0,0,0,0,0,0,0];
      for (let i = 1; i <= 9; i++) {
        newSlots[i] = { max: slots[i-1] || 0, used: 0 };
      }
    } else {
      // Non-casters get no spell slots
      for (let i = 1; i <= 9; i++) {
        newSlots[i] = { max: 0, used: 0 };
      }
    }
    
    setStatsObj(prev => ({ ...prev, spellSlots: newSlots }));
  };

  // Spellcasting stats
  const abilityKey = SPELLCASTING_ABILITY[cn] || 'INT';
  const abilityScore = statsObj[abilityKey] || 10;
  const abilityMod = Math.floor((abilityScore - 10) / 2);
  const profBonus = Math.ceil((character?.level || 1) / 4) + 1;
  const saveDC = 8 + profBonus + abilityMod;
  const attackBonus = profBonus + abilityMod;

  const filteredSpells = allSpells.filter(s => {
    const matchName = s.name.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'all' || getSpellLevel(s) === parseInt(levelFilter);
    return matchName && matchLevel;
  });

  if (!character) return <div className="page-center"><h2>Cargando Grimorio...</h2></div>;

  return (
    <div className="container fade-in" style={{ maxWidth: '1200px' }}>
      <div className="flex-row flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex-row" style={{ gap: '0.8rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/character/${id}`)}>← Ficha de {character.name}</button>
          {campaignCharacters.length > 1 && (
            <div className="flex-row" style={{ gap: '0.5rem', alignItems: 'center', background: 'rgba(200,155,60,0.1)', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid var(--accent-gold)' }}>
              <select 
                value={id} 
                onChange={e => navigate(`/character/${e.target.value}/spells`)}
                style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
              >
                {campaignCharacters.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#1a1a24' }}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>📖 Grimorio Mágico</h1>
        <div className="flex-row" style={{ gap: '0.5rem' }}>
          {!isNonCaster && <button className="btn btn-blue btn-sm" onClick={restoreSpellSlots} title="Restaurar todos los espacios de conjuro">⚡ Restaurar Espacios</button>}
          <button className="btn btn-gold btn-sm" onClick={saveSpells}><Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>

      {/* Spellcasting stats bar */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.5rem', padding: '1rem', borderTop: '3px solid var(--accent-gold)', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Aptitud</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{abilityKey}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>CD Salvación</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>{saveDC}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Ataque Conjuro</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-red-bright)' }}>{attackBonus >= 0 ? '+' : ''}{attackBonus}</div>
        </div>
      </div>

      {/* Spell slots info panel */}
      {!isNonCaster && (
        <div className="glass-panel" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(200,155,60,0.1), rgba(139,0,0,0.1))', borderTop: '2px solid var(--accent-gold)', borderLeft: '4px solid var(--accent-gold)' }}>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚡ Espacios de Conjuro Disponibles
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.8rem' }}>
            {[1,2,3,4,5,6,7,8,9].map(lvl => {
              const slot = statsObj.spellSlots?.[lvl] || { max: 0, used: 0 };
              if (slot.max === 0) return null;
              const remaining = Math.max(0, slot.max - slot.used);
              const percentage = Math.round((remaining / slot.max) * 100);
              return (
                <div key={lvl} style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '6px', border: `1px solid ${remaining === 0 ? 'rgba(220,20,60,0.5)' : 'rgba(200,155,60,0.3)'}` }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Nivel {lvl}</div>
                  <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.4rem' }}>
                    {Array.from({ length: slot.max }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '4px',
                          background: i < (slot.max - slot.used) ? 'var(--accent-gold)' : 'rgba(139,0,0,0.5)',
                          borderRadius: '2px',
                          transition: 'all 0.3s'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: remaining === 0 ? 'var(--accent-red)' : 'var(--accent-gold)' }}>
                    {remaining}/{slot.max} disponibles
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Search side */}
        <div className="glass-panel" style={{ flex: '1', minWidth: '300px' }}>
          <h3 style={{ color: 'var(--accent-red-bright)' }}>Aprender Hechizos</h3>

          {isNonCaster && (
            <div style={{ background: 'rgba(139,0,0,0.2)', padding: '0.8rem', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(139,0,0,0.4)' }}>
              ⛔ {charClass?.name} no puede lanzar conjuros
            </div>
          )}

          {!isNonCaster && (
            <div className="flex-row" style={{ gap: '1rem', marginBottom: '0.8rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
              <span className="badge badge-gold">Trucos: {currentCantrips}/{maxCantrips}</span>
              {maxSpells > 0 && <span className="badge badge-blue">{spellLimitLabel}: {currentNonCantrips}/{maxSpells}</span>}
            </div>
          )}

          <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
            <input type="text" placeholder="Buscar hechizo..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={{ width: '80px' }}>
              <option value="all">Todos</option>
              <option value="0">Trucos</option>
              {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>Nv {n}</option>)}
            </select>
          </div>

          {(search.length > 1 || levelFilter !== 'all') && (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {filteredSpells.slice(0, 30).map(sp => {
                const isKnown = knownSpells.includes(sp.index);
                return (
                  <div key={sp.id} style={{ marginBottom: '0.6rem', borderBottom: '1px solid #222', paddingBottom: '0.6rem' }}>
                    <div className="flex-row flex-between">
                      <div>
                        <strong style={{ color: 'var(--accent-gold)' }}>{sp.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#888' }}>
                          Nv {sp.level} • {sp.school} {sp.concentration && '• [C]'} {sp.ritual && '• [R]'}
                        </div>
                      </div>
                      <div className="flex-row" style={{ gap: '0.3rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setExpandedSpell(expandedSpell === sp.id ? null : sp.id)}>Info</button>
                        <button className={`btn btn-sm ${isKnown ? 'btn-danger' : 'btn-gold'}`}
                          onClick={() => toggleSpell(sp.index)} disabled={!isKnown && !canAdd(sp.index)}>
                          {isKnown ? 'Quitar' : 'Aprender'}
                        </button>
                      </div>
                    </div>
                    {expandedSpell === sp.id && (
                      <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '4px', fontSize: '0.8rem', color: '#ccc' }}>
                        <div style={{ color: '#999', marginBottom: '0.3rem' }}>
                          Tiempo: {sp.casting_time} • Rango: {sp.range} • Duración: {sp.duration}
                        </div>
                        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{sp.description?.substring(0, 500)}{sp.description?.length > 500 ? '...' : ''}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredSpells.length > 30 && <p style={{ color: '#666', textAlign: 'center' }}>+{filteredSpells.length - 30} más...</p>}
            </div>
          )}
          {search.length <= 1 && levelFilter === 'all' && <p style={{ color: 'var(--text-dim)' }}>Busca un conjuro o filtra por nivel.</p>}
        </div>

        {/* Known spells side */}
        <div className="glass-panel" style={{ flex: '1.2', minWidth: '300px' }}>
          <h3 style={{ textAlign: 'center', borderBottom: '2px solid var(--accent-red)', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Conjuros Preparados</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem', maxHeight: '65vh', overflowY: 'auto' }}>
            {[0,1,2,3,4,5,6,7,8,9].map(lvl => {
              const spellsAtLevel = knownByLevel[lvl] || [];
              const slot = statsObj.spellSlots?.[lvl] || { max: 0, used: 0 };
              if (lvl > 0 && slot.max <= 0 && spellsAtLevel.length === 0 && lvl > 1) return null;

              return (
                <div key={lvl} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(139,0,0,0.2)' }}>
                  <div style={{ background: 'linear-gradient(90deg, rgba(139,0,0,0.4), rgba(139,0,0,0.1))', padding: '0.8rem', borderBottom: '1px solid rgba(139,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{lvl === 0 ? '✨ TRUCOS' : `📖 NIVEL ${lvl}`}</strong>
                    </div>
                    {lvl > 0 && slot.max > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <div className="flex-row" style={{ gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {Array.from({ length: Math.max(slot.max, 0) }).map((_, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                const newUsed = i < slot.used ? slot.used - 1 : i + 1;
                                setStatsObj(prev => ({
                                  ...prev, spellSlots: { ...prev.spellSlots, [lvl]: { ...slot, used: newUsed } }
                                }));
                              }}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: i < slot.used ? 'var(--accent-red)' : 'rgba(255,255,255,0.1)',
                                border: `2px solid ${i < slot.used ? 'var(--accent-red-bright)' : 'rgba(255,255,255,0.3)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                color: '#fff',
                                fontWeight: 'bold'
                              }}
                              title={i < slot.used ? 'Espacio usado' : 'Espacio disponible'}
                            >
                              {i < slot.used ? '✓' : ''}
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                          {slot.used}/{slot.max} espacios usados
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {spellsAtLevel.length === 0 ? (
                      <span style={{ color: '#555', fontSize: '0.85rem', padding: '0.4rem', fontStyle: 'italic' }}>Sin conjuros de este nivel</span>
                    ) : (
                      spellsAtLevel.map(sIdx => {
                        const sp = allSpells.find(s => s.index === sIdx);
                        return (
                          <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(200,155,60,0.1)', padding: '0.6rem 0.8rem', borderRadius: '6px', borderLeft: `4px solid ${lvl === 0 ? 'var(--accent-gold)' : 'var(--accent-red)'}` }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '0.95rem', color: '#ddd', fontWeight: '500' }}>{sp?.name || sIdx}</span>
                              {sp?.ritual && <span style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', marginLeft: '0.5rem', padding: '0.1rem 0.3rem', background: 'rgba(200,155,60,0.2)', borderRadius: '3px' }}>[R]</span>}
                              {sp?.concentration && <span style={{ fontSize: '0.65rem', color: 'var(--accent-red-bright)', marginLeft: '0.3rem', padding: '0.1rem 0.3rem', background: 'rgba(220,20,60,0.2)', borderRadius: '3px' }}>[C]</span>}
                            </div>
                            <button className="btn btn-ghost btn-sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--accent-red)' }} onClick={() => toggleSpell(sIdx)}>✕ Olvidar</button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
