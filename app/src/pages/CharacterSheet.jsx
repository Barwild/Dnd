import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCharacter, updateCharacter, getRace, getClass as getClassApi, getItems, rollDice, getCharacters } from '../api';
import { Save, BookOpen, Heart, Shield, Swords, ArrowUp, Moon, Sunrise, Plus, Minus, Dice5, Target, UserCircle, Flame } from 'lucide-react';
import { useAuth } from '../AuthContext';

const STAT_NAMES = { STR: 'FUE', DEX: 'DES', CON: 'CON', INT: 'INT', WIS: 'SAB', CHA: 'CAR' };
const STAT_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const FULL_NAMES = { STR: 'Fuerza', DEX: 'Destreza', CON: 'Constitución', INT: 'Inteligencia', WIS: 'Sabiduría', CHA: 'Carisma' };

// HP per level (beyond lvl 1): avg or roll
const CLASS_HIT_DICE = { 'bárbaro': 12, 'guerrero': 10, 'paladín': 10, 'explorador': 10, 'bardo': 8, 'clérigo': 8, 'druida': 8, 'monje': 8, 'brujo': 8, 'pícaro': 8, 'hechicero': 6, 'mago': 6 };

const FULL_CASTERS = ['bardo', 'clérigo', 'druida', 'hechicero', 'mago'];
const HALF_CASTERS = ['paladín', 'explorador'];

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

export default function CharacterSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [campaignCharacters, setCampaignCharacters] = useState([]);
  const [stats, setStats] = useState({});
  const [raceName, setRaceName] = useState('');
  const [className, setClassName] = useState('');
  const [hitDie, setHitDie] = useState(8);
  const [equipment, setEquipment] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [shopSearch, setShopSearch] = useState('');
  const [shopPage, setShopPage] = useState(0);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopExpanded, setShopExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [diceResult, setDiceResult] = useState(null);

  const COIN_VALUES = { cp: 1, sp: 10, ep: 50, gp: 100, pp: 1000 };
  const normalizeCoins = (coins) => ({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, ...coins });
  const parseCoins = (coins) => {
    if (typeof coins === 'string') {
      try { return JSON.parse(coins || '{}'); } catch { return {}; }
    }
    return coins || {};
  };
  const totalCopper = (coins) => Object.entries(normalizeCoins(parseCoins(coins)))
    .reduce((sum, [k, v]) => sum + (Number(v) || 0) * (COIN_VALUES[k] || 0), 0);
  const copperToCoins = (copper) => {
    let remaining = Math.max(0, Math.floor(copper));
    const result = {};
    result.pp = Math.floor(remaining / COIN_VALUES.pp); remaining %= COIN_VALUES.pp;
    result.gp = Math.floor(remaining / COIN_VALUES.gp); remaining %= COIN_VALUES.gp;
    result.ep = Math.floor(remaining / COIN_VALUES.ep); remaining %= COIN_VALUES.ep;
    result.sp = Math.floor(remaining / COIN_VALUES.sp); remaining %= COIN_VALUES.sp;
    result.cp = remaining;
    return result;
  };
  const formatCoins = (coins) => {
    const normalized = normalizeCoins(parseCoins(coins));
    return Object.entries(normalized)
      .filter(([, value]) => value !== undefined && value !== null && value !== 0)
      .map(([coin, value]) => `${value}${coin}`)
      .join(' ') || '0cp';
  };
  const setCoinValue = (coin, value) => {
    const amount = Math.max(0, parseInt(value, 10) || 0);
    setStats(prev => ({
      ...prev,
      coins: { ...normalizeCoins(prev.coins), [coin]: amount }
    }));
  };
  const totalValueSummary = copperToCoins(totalCopper(stats.coins));
  const renderCost = (item) => {
    if (!item.cost_quantity) return 'Gratis';
    return `${item.cost_quantity} ${item.cost_unit || 'gp'}`;
  };

  const normalizeStats = (stats) => {
    const normalized = { ...stats };
    if (normalized.spell_slots && !normalized.spellSlots) normalized.spellSlots = normalized.spell_slots;
    if (normalized.spellSlots && !normalized.spell_slots) normalized.spell_slots = normalized.spellSlots;
    return normalized;
  };

  const load = async () => {
    try {
      const res = await getCharacter(id);
      const char = res.data;
      let statsObj = {};
      try { statsObj = normalizeStats(JSON.parse(char.stats || '{}')); } catch {}
      statsObj.coins = normalizeCoins(parseCoins(statsObj.coins));

      let eq = [];
      try { eq = JSON.parse(char.equipment || '[]'); } catch {}
      if ((!eq || eq.length === 0) && char.starting_equipment) {
        try { eq = JSON.parse(char.starting_equipment || '[]'); } catch {}
      }

      setCharacter(char);
      setStats(statsObj);
      setEquipment(eq);

      if (char.race_id) getRace(char.race_id).then(r => setRaceName(r.data.name)).catch(() => {});
      if (char.class_id) getClassApi(char.class_id).then(c => { setClassName(c.data.name); setHitDie(c.data.hit_die); }).catch(() => {});
      
      if (char.campaign_id) {
        getCharacters(char.campaign_id).then(res => {
          const myChars = (res.data || []).filter(c => c.user_id === user?.id);
          setCampaignCharacters(myChars);
        }).catch(() => {});
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [id]);

  const loadShopItems = async () => {
    setShopLoading(true);
    try {
      const params = { skip: shopPage * 20, limit: 20 };
      if (shopSearch) params.search = shopSearch;
      const res = await getItems(params);
      setShopItems(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setShopLoading(false);
    }
  };

  useEffect(() => { loadShopItems(); }, [shopPage, shopSearch]);

  const buyItem = async (item) => {
    const costCopper = (Number(item.cost_quantity) || 0) * (COIN_VALUES[(item.cost_unit || 'gp').toLowerCase()] || COIN_VALUES.gp);
    const currentCopper = totalCopper(stats.coins);
    if (costCopper <= 0) {
      alert('Este objeto no tiene un precio válido.');
      return;
    }
    if (costCopper > currentCopper) {
      alert('No tienes suficiente dinero para comprar este objeto.');
      return;
    }

    const remaining = copperToCoins(currentCopper - costCopper);
    setStats(prev => ({ ...prev, coins: remaining }));
    setEquipment(prev => ([...prev, { name: item.name, cost: renderCost(item) }]));
    alert(`Comprado ${item.name}. Te quedan ${formatCoins(remaining)}.`);
  };

  const save = async () => {
    setSaving(true);
    await updateCharacter(id, {
      stats: JSON.stringify(stats),
      equipment: JSON.stringify(equipment),
      level: character.level,
      notes: character.notes
    });
    setSaving(false);
  };

  const mod = (val) => Math.floor(((val || 10) - 10) / 2);
  const modStr = (val) => { const m = mod(val); return m >= 0 ? `+${m}` : `${m}`; };
  const profBonus = Math.ceil((character?.level || 1) / 4) + 1;

  const adjustHP = (delta) => {
    setStats(prev => ({
      ...prev,
      currHP: Math.max(0, Math.min(prev.maxHP || 1, (prev.currHP || 0) + delta))
    }));
  };

  const shortRest = () => {
    const hitDiceAvail = (character?.level || 1) - (stats.hitDiceUsed || 0);
    if (hitDiceAvail <= 0) {
      alert('No te quedan dados de golpe. No puedes recuperar vida en este descanso corto.');
      return;
    }
    const roll = Math.floor(Math.random() * hitDie) + 1 + mod(stats.CON || 10);
    const healed = Math.max(0, roll);
    
    setStats(prev => {
      const newState = {
        ...prev,
        currHP: Math.min(prev.maxHP, (prev.currHP || 0) + healed),
        hitDiceUsed: Math.min(character?.level || 1, (prev.hitDiceUsed || 0) + 1)
      };
      
      // Warlocks restore spell slots on short rest
      if (className.toLowerCase() === 'brujo') {
        const slots = prev.spellSlots || {};
        const newSlots = {};
        Object.keys(slots).forEach(k => {
          newSlots[k] = { ...slots[k], used: 0 };
        });
        newState.spellSlots = newSlots;
      }
      return newState;
    });
    alert(`Descanso Corto: Recuperas ${healed} PG. ${className.toLowerCase() === 'brujo' ? 'Espacios de pacto restaurados.' : ''}`);
  };

  const longRest = () => {
    const halfDice = Math.max(1, Math.floor((character?.level || 1) / 2));
    setStats(prev => {
      const slots = prev.spellSlots || {};
      const newSlots = {};
      Object.keys(slots).forEach(k => {
        newSlots[k] = { ...slots[k], used: 0 };
      });
      
      return {
        ...prev,
        currHP: prev.maxHP || 1,
        hitDiceUsed: Math.max(0, (prev.hitDiceUsed || 0) - halfDice),
        spellSlots: newSlots
      };
    });
    alert('Descanso Largo: PG y todos los Espacios de Conjuro restaurados.');
  };

  const toggleSpellSlot = (level, used) => {
    setStats(prev => {
      const slots = prev.spellSlots || {};
      const slot = slots[level] || { max: 0, used: 0 };
      const newUsed = used ? Math.max(0, slot.used - 1) : Math.min(slot.max, slot.used + 1);
      return {
        ...prev,
        spellSlots: { ...slots, [level]: { ...slot, used: newUsed } }
      };
    });
  };

  const levelUp = () => {
    const newLevel = (character?.level || 1) + 1;
    const cn = className.toLowerCase();
    const hd = CLASS_HIT_DICE[cn] || hitDie;
    const avg = Math.floor(hd / 2) + 1;
    const hpGain = avg + mod(stats.CON || 10);
    
    setStats(prev => {
      const newState = { 
        ...prev, 
        maxHP: (prev.maxHP || 1) + Math.max(1, hpGain), 
        currHP: (prev.currHP || 0) + Math.max(1, hpGain) 
      };

      // Auto-update spell slots
      if (FULL_CASTERS.includes(cn)) {
        const row = SPELL_SLOTS_TABLE[newLevel] || [0,0,0,0,0,0,0,0,0];
        const newSlots = { ...(prev.spellSlots || {}) };
        row.forEach((max, i) => {
          const lvl = i + 1;
          newSlots[lvl] = { max, used: (newSlots[lvl]?.used || 0) };
        });
        newState.spellSlots = newSlots;
      } else if (HALF_CASTERS.includes(cn)) {
        const halfLevel = Math.ceil(newLevel / 2);
        const row = SPELL_SLOTS_TABLE[halfLevel] || [0,0,0,0,0,0,0,0,0];
        const newSlots = { ...(prev.spellSlots || {}) };
        row.forEach((max, i) => {
          const lvl = i + 1;
          newSlots[lvl] = { max, used: (newSlots[lvl]?.used || 0) };
        });
        newState.spellSlots = newSlots;
      } else if (cn === 'brujo') {
        const pact = WARLOCK_SLOTS[newLevel] || { count: 0, level: 0 };
        const newSlots = {};
        if (pact.level > 0) {
          newSlots[pact.level] = { max: pact.count, used: 0 };
        }
        newState.spellSlots = newSlots;
      }
      return newState;
    });
    setCharacter(prev => ({ ...prev, level: newLevel }));
  };

  const handleRoll = async (formula, desc) => {
    try {
      const res = await rollDice({ dice_formula: formula, character_name: character?.name || '', description: desc, roll_type: 'check' });
      setDiceResult({ ...res.data, description: desc });
      setTimeout(() => setDiceResult(null), 5000);
    } catch { /* silent */ }
  };

  if (!character) return <div className="page-center"><h2>Cargando ficha...</h2></div>;

  const hpPercent = stats.maxHP ? (stats.currHP / stats.maxHP) * 100 : 100;
  const hpColor = hpPercent > 60 ? '#4a4' : hpPercent > 30 ? '#e84' : '#d44';
  
  // Use stats.ac if it's a monster or has natural armor, otherwise 10 + DEX
  const ac = stats.ac || (10 + mod(stats.DEX));
  const initiative = mod(stats.DEX);
  const speed = stats.speed || 30;

  return (
    <div className="container fade-in" style={{ maxWidth: '900px', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex-row flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex-row" style={{ gap: '0.8rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/player-lobby')}>← Lobby</button>
          {campaignCharacters.length > 1 && (
            <div className="flex-row" style={{ gap: '0.5rem', alignItems: 'center', background: 'rgba(200,155,60,0.1)', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid var(--accent-gold)' }}>
              <UserCircle size={16} style={{ color: 'var(--accent-gold)' }} />
              <select 
                value={id} 
                onChange={e => navigate(`/character/${e.target.value}`)}
                style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
              >
                {campaignCharacters.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#1a1a24' }}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex-row" style={{ gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/character/${id}/skills`)}><Target size={16} /> Habilidades</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/character/${id}/spells`)}><BookOpen size={16} /> Grimorio</button>
          <button className="btn btn-gold btn-sm" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>

      {/* Dice notification */}
      {diceResult && (
        <div className="glass-panel slide-up" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 999, borderColor: 'var(--accent-gold)', padding: '1rem', maxWidth: '300px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{diceResult.description}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{diceResult.total}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>{diceResult.dice_formula}</div>
        </div>
      )}

      {/* Character Name & Identity */}
      <div className="glass-panel" style={{ textAlign: 'center', borderTop: '3px solid var(--accent-gold)', marginBottom: '1.5rem', position: 'relative' }}>
        <h1 style={{ fontSize: '2.2rem', margin: 0, color: '#fff' }}>{character.name}</h1>
        <p style={{ color: 'var(--accent-gold)', fontSize: '1rem', margin: '0.3rem 0' }}>
          Nivel {character.level} {raceName ? `• ${raceName}` : ''} {className ? `• ${className}` : ''} {!raceName && !className && '• Monstruo'}
        </p>
        <span className="badge badge-gold">Competencia: +{profBonus}</span>
      </div>

      {/* Combat row */}
      <div className="combat-row" style={{ marginBottom: '1.5rem' }}>
        <div className="combat-badge" style={{ borderColor: 'var(--accent-blue)' }}>
          <span className="label">Clase de Armadura</span>
          <span className="value" style={{ color: 'var(--accent-blue)' }}>{ac}</span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>{stats.ac ? 'Armadura Natural / Fija' : `10 + DES (${modStr(stats.DEX)})`}</span>
        </div>
        <div className="combat-badge" style={{ borderColor: 'var(--accent-green)' }}>
          <span className="label">Iniciativa</span>
          <span className="value" style={{ color: 'var(--accent-green)', cursor: 'pointer' }}
            onClick={() => handleRoll('1d20' + (initiative >= 0 ? `+${initiative}` : initiative), 'Tirada de Iniciativa')}>
            {initiative >= 0 ? '+' : ''}{initiative}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>Clic para tirar</span>
        </div>
        <div className="combat-badge" style={{ borderColor: 'var(--accent-purple)' }}>
          <span className="label">Velocidad</span>
          <span className="value" style={{ color: 'var(--accent-purple)' }}>{speed}</span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>ft (9 m)</span>
        </div>
      </div>

      {/* HP & Spell Slots Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* HP Block */}
        <div className="glass-panel" style={{ height: '100%' }}>
          <div className="flex-row flex-between" style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}><Heart size={18} style={{ color: hpColor }} /> Vida</h3>
            <div className="flex-row" style={{ gap: '0.4rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={shortRest} title="Restaurar vida y pactos"><Moon size={14} /> Corto</button>
              <button className="btn btn-ghost btn-sm" onClick={longRest} title="Restaurar todo"><Sunrise size={14} /> Largo</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <button className="btn btn-danger btn-sm" onClick={() => adjustHP(-1)} style={{ width: '35px', padding: '0.3rem' }}><Minus size={14} /></button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', height: '24px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ background: hpColor, height: '100%', width: `${hpPercent}%`, transition: 'width 0.3s ease' }} />
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: '#fff' }}>
                  {stats.currHP || 0} / {stats.maxHP || 1}
                </span>
              </div>
            </div>
            <button className="btn btn-sm" onClick={() => adjustHP(1)} style={{ width: '35px', padding: '0.3rem', background: 'rgba(0,100,0,0.5)', border: '1px solid #4a4', color: '#fff' }}><Plus size={14} /></button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Dados de Golpe: {(character?.level || 1) - (stats.hitDiceUsed || 0)}d{hitDie}
          </div>
        </div>

        {/* Spell Slots Block */}
        {!['guerrero', 'bárbaro', 'monje', 'pícaro'].includes(className.toLowerCase()) && (
          <div className="glass-panel" style={{ borderLeft: '3px solid var(--accent-red)', height: '100%' }}>
            <h3 style={{ margin: '0 0 1rem' }}><Flame size={18} style={{ color: 'var(--accent-red)' }} /> Espacios de Conjuro</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[1,2,3,4,5,6,7,8,9].map(lvl => {
                const slot = stats.spellSlots?.[lvl] || { max: 0, used: 0 };
                if (slot.max <= 0) return null;
                return (
                  <div key={lvl} className="flex-row flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>Nv {lvl}</span>
                    <div className="flex-row" style={{ gap: '0.3rem' }}>
                      {Array.from({ length: slot.max }).map((_, i) => (
                        <div key={i} 
                          onClick={() => toggleSpellSlot(lvl, i < slot.used)}
                          style={{ 
                            width: '16px', height: '16px', borderRadius: '3px',
                            border: '2px solid var(--accent-red)',
                            background: i < slot.used ? 'var(--accent-red)' : 'transparent',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {(!stats.spellSlots || Object.values(stats.spellSlots).every(s => s.max === 0)) && (
                <p style={{ color: '#555', fontSize: '0.75rem', fontStyle: 'italic', margin: 0 }}>Define tus espacios en el Grimorio.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Características</h3>
        <div className="stats-grid" style={{ marginBottom: '0.5rem' }}>
          {STAT_KEYS.map(stat => (
            <div key={stat} className="stat-block" style={{ cursor: 'pointer' }}
              onClick={() => handleRoll(`1d20${mod(stats[stat]) >= 0 ? '+' : ''}${mod(stats[stat])}`, `Chequeo de ${FULL_NAMES[stat]}`)}>
              <span className="stat-label">{STAT_NAMES[stat]}</span>
              <span className="stat-mod">{modStr(stats[stat])}</span>
              <span className="stat-score">{stats[stat] || 10}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
          Haz clic en un atributo para tirar un chequeo (1d20 + mod)
        </p>
      </div>

      {/* Notes */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Notas del Personaje</h3>
        <textarea value={character.notes || ''} onChange={e => setCharacter(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Escribe notas, rasgos, ideales, vínculos, defectos..."
          rows={4} style={{ width: '100%', resize: 'vertical' }} />
      </div>

      {/* Equipment */}
      <div className="glass-panel">
        <h3>Equipo e Inventario</h3>
        {equipment.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Inventario vacío. Añade objetos desde el Bestiario.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {equipment.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.8rem', borderRadius: '6px' }}>
                <span>{item.name || item}</span>
                <button className="btn btn-danger btn-sm" onClick={() => setEquipment(prev => prev.filter((_, j) => j !== i))} style={{ padding: '0.2rem 0.5rem' }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shop and Currency */}
      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <div className="flex-row flex-between" style={{ marginBottom: '1rem' }}>
          <h3>Monedas y Tienda</h3>
          <span className="badge badge-gold" style={{ fontSize: '0.95rem' }}>{formatCoins(stats.coins)}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
          {Object.entries(normalizeCoins(stats.coins)).map(([coin, value]) => (
            <div key={coin} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.7rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#888' }}>{coin.toUpperCase()}</div>
              <input type="number" min="0" value={value}
                onChange={e => setCoinValue(coin, e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center' }} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#ccc' }}>
          <strong>Total equivalente:</strong> {formatCoins(totalValueSummary)} ({totalCopper(stats.coins)} cp)
        </div>

        <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Buscar objeto..." value={shopSearch}
            onChange={e => { setShopSearch(e.target.value); setShopPage(0); }}
            style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" onClick={loadShopItems}>Buscar</button>
        </div>

        {shopLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando tienda...</p>
        ) : shopItems.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay objetos en la tienda o usa el buscador.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {shopItems.map(item => {
              const costCopper = (Number(item.cost_quantity) || 0) * (COIN_VALUES[(item.cost_unit || 'gp').toLowerCase()] || COIN_VALUES.gp);
              const currentCopper = totalCopper(stats.coins);
              const canBuy = costCopper > 0 && costCopper <= currentCopper;
              const remaining = canBuy ? copperToCoins(currentCopper - costCopper) : null;
              return (
                <div key={item.id} className="glass-panel" style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}>
                  <div className="flex-row flex-between" style={{ gap: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ color: '#fff' }}>{item.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{renderCost(item)}</div>
                    </div>
                    <button className={`btn btn-sm ${canBuy ? 'btn-gold' : 'btn-ghost'}`} disabled={!canBuy} onClick={() => buyItem(item)}>
                      {canBuy ? 'Comprar' : 'No puedes'}
                    </button>
                  </div>
                  {shopExpanded === item.id && item.description && (
                    <p style={{ marginTop: '0.6rem', color: '#ccc', fontSize: '0.85rem' }}>{item.description}</p>
                  )}
                  <div className="flex-row" style={{ gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShopExpanded(shopExpanded === item.id ? null : item.id)}>
                      {shopExpanded === item.id ? 'Ocultar' : 'Ver'} detalles
                    </button>
                    {remaining && (
                      <span style={{ color: canBuy ? 'var(--accent-gold)' : '#888', fontSize: '0.8rem' }}>
                        Quedarías con: {formatCoins(remaining)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-row flex-between" style={{ marginTop: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShopPage(p => Math.max(0, p - 1))} disabled={shopPage === 0}>← Anterior</button>
          <span style={{ color: '#888' }}>Página {shopPage + 1}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setShopPage(p => p + 1)} disabled={shopItems.length < 20}>Siguiente →</button>
        </div>
      </div>
    </div>
  );
}
