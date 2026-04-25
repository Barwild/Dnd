import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRaces, getClasses, getBackgrounds, getSubclasses, createCharacter, getCampaigns, getSpells } from '../api';
import { Sword, Shield, BookOpen, Sparkles, Users, ChevronRight, ChevronLeft, Dice5, Heart, Zap, X } from 'lucide-react';

const STAT_NAMES = { STR: 'Fuerza', DEX: 'Destreza', CON: 'Constitución', INT: 'Inteligencia', WIS: 'Sabiduría', CHA: 'Carisma' };
const STAT_SHORT = { STR: 'FUE', DEX: 'DES', CON: 'CON', INT: 'INT', WIS: 'SAB', CHA: 'CAR' };
const STAT_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

/* Map ability names from DB → stat keys */
const ABILITY_MAP = {
  'Fuerza': 'STR', 'FUE': 'STR', 'Destreza': 'DEX', 'DES': 'DEX',
  'Constitución': 'CON', 'CON': 'CON', 'Inteligencia': 'INT', 'INT': 'INT',
  'Sabiduría': 'WIS', 'SAB': 'WIS', 'Carisma': 'CHA', 'CAR': 'CHA',
  'Strength': 'STR', 'Dexterity': 'DEX', 'Constitution': 'CON',
  'Intelligence': 'INT', 'Wisdom': 'WIS', 'Charisma': 'CHA',
};

// Cantrips per class level 1
const CASTER_CANTRIPS = { 'bardo': 2, 'clérigo': 3, 'druida': 2, 'hechicero': 4, 'mago': 3, 'brujo': 2 };
const CASTER_SLOTS = { 'bardo': { 1: 2 }, 'clérigo': { 1: 2 }, 'druida': { 1: 2 }, 'hechicero': { 1: 2 }, 'mago': { 1: 2 }, 'brujo': { 1: 1 } };

const SKILLS_MASTER = [
  { index: 'acrobatics', name: 'Acrobacias' }, { index: 'animal-handling', name: 'Trato con Animales' },
  { index: 'arcana', name: 'Arcanos' }, { index: 'athletics', name: 'Atletismo' },
  { index: 'deception', name: 'Engaño' }, { index: 'history', name: 'Historia' },
  { index: 'insight', name: 'Perspicacia' }, { index: 'intimidation', name: 'Intimidación' },
  { index: 'investigation', name: 'Investigación' }, { index: 'medicine', name: 'Medicina' },
  { index: 'nature', name: 'Naturaleza' }, { index: 'perception', name: 'Percepción' },
  { index: 'performance', name: 'Interpretación' }, { index: 'persuasion', name: 'Persuasión' },
  { index: 'religion', name: 'Religión' }, { index: 'sleight-of-hand', name: 'Juego de Manos' },
  { index: 'stealth', name: 'Sigilo' }, { index: 'survival', name: 'Supervivencia' }
];

const CLASS_SKILL_COUNT = {
  'bárbaro': 2, 'bardo': 3, 'clérigo': 2, 'druida': 2, 'guerrero': 2, 'monje': 2,
  'paladín': 2, 'explorador': 3, 'pícaro': 4, 'hechicero': 2, 'brujo': 2, 'mago': 2
};

const CLASS_SKILL_LIST = {
  'bárbaro': ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
  'bardo': SKILLS_MASTER.map(s => s.index),
  'clérigo': ['history', 'insight', 'medicine', 'persuasion', 'religion'],
  'druida': ['animal-handling', 'arcana', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
  'guerrero': ['acrobatics', 'animal-handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
  'monje': ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
  'paladín': ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
  'explorador': ['animal-handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
  'pícaro': ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight-of-hand', 'stealth'],
  'hechicero': ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
  'brujo': ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
  'mago': ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion']
};

export default function PlayerCreator() {
  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [subclasses, setSubclasses] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [cantrips, setCantrips] = useState([]);
  const [level1Spells, setLevel1Spells] = useState([]);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [charData, setCharData] = useState({
    name: '', race_id: '', subrace_index: null, class_id: '', subclass_id: null, background_id: null, campaign_id: null,
    stats: { STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null },
    spell_list: [],
    skill_proficiencies: []
  });

  const [statPool, setStatPool] = useState([]);

  useEffect(() => {
    Promise.all([getRaces(), getClasses(), getBackgrounds(), getSubclasses(), getCampaigns(), getSpells({ limit: 500 })])
      .then(([r, c, b, s, camp, spl]) => {
        setRaces(r.data || []);
        setClasses(c.data || []);
        setBackgrounds(b.data || []);
        setSubclasses(s.data || []);
        setCampaigns(camp.data || []);
        setCantrips((spl.data || []).filter(s => s.level === 0));
        setLevel1Spells((spl.data || []).filter(s => s.level === 1));
      });
  }, []);

  const selectedRace = races.find(r => r.id === charData.race_id);
  const selectedClass = classes.find(c => c.id === charData.class_id);
  const selectedBg = backgrounds.find(b => b.id === charData.background_id);
  const raceSubraces = selectedRace ? (() => { try { return JSON.parse(selectedRace.subraces || '[]'); } catch { return []; } })() : [];
  const selectedSubrace = raceSubraces.find(s => s.index === charData.subrace_index);
  const clsSubclasses = subclasses.filter(s => s.class_index === selectedClass?.index);

  const allowedCantripsCount = (CASTER_CANTRIPS[selectedClass?.name?.toLowerCase()] || 0) + (charData.subrace_index === 'high-elf' ? 1 : 0);
  // Caster classes that learn spells (not prepare)
  const KNOWN_LVL1_SPELLS = { 'bardo': 4, 'hechicero': 2, 'brujo': 2, 'mago': 6 };
  const prepareAllClasses = ['clérigo', 'druida'];
  
  const classNameLow = selectedClass?.name?.toLowerCase() || '';
  const allowedLevel1Count = KNOWN_LVL1_SPELLS[classNameLow] || 0;
  // If cleric/druid, they essentially know all their level 1 spells, so we don't force 'spell selection' here.
  const needsMagicStep = allowedCantripsCount > 0 || allowedLevel1Count > 0;
  
  const availableCantrips = cantrips.filter(c => {
    try {
      const clsList = JSON.parse(c.classes || '[]');
      return clsList.includes(selectedClass?.name) || (charData.subrace_index === 'high-elf' && clsList.includes('Mago'));
    } catch { return false; }
  });

  const availableLevel1Spells = level1Spells.filter(c => {
    try {
      return JSON.parse(c.classes || '[]').includes(selectedClass?.name);
    } catch { return false; }
  });

  const selectedCantripsCount = charData.spell_list.filter(sIndex => availableCantrips.some(c => c.index === sIndex)).length;
  const selectedLevel1Count = charData.spell_list.filter(sIndex => availableLevel1Spells.some(c => c.index === sIndex)).length;


  /* Parse racial ability bonuses from DB JSON */
  const getRacialBonuses = () => {
    if (!selectedRace) return {};
    const result = {};
    const addBonus = (bonusesArray) => {
      bonusesArray.forEach(b => {
        const key = ABILITY_MAP[b.ability] || b.ability;
        result[key] = (result[key] || 0) + (b.bonus || 0);
      });
    };
    try { addBonus(JSON.parse(selectedRace.ability_bonuses || '[]')); } catch {}
    if (selectedSubrace) {
      try { addBonus(selectedSubrace.ability_bonuses || []); } catch {}
    }
    return result;
  };

  const racialBonuses = getRacialBonuses();

  // --- STATS LOGIC ---
  const rollDice = () => {
    const newPool = [];
    for (let i = 0; i < 6; i++) {
        const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
        newPool.push({ id: Math.random().toString(), val: rolls[0] + rolls[1] + rolls[2] });
    }
    setStatPool(newPool.sort((a,b) => b.val - a.val));
    setCharData(prev => ({ ...prev, stats: { STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null } }));
  };

  const setStandard = () => {
    setStatPool([
      { id: '15', val: 15 }, { id: '14', val: 14 }, { id: '13', val: 13 },
      { id: '12', val: 12 }, { id: '10', val: 10 }, { id: '8', val: 8 }
    ]);
    setCharData(prev => ({ ...prev, stats: { STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null } }));
  };

  const assignStat = (statKey, poolItem) => {
    const current = charData.stats[statKey];
    let newPool = statPool.filter(i => i.id !== poolItem.id);
    if (current) newPool.push(current);
    newPool.sort((a, b) => b.val - a.val);
    setStatPool(newPool);
    setCharData(prev => ({ ...prev, stats: { ...prev.stats, [statKey]: poolItem } }));
  };

  const unassignStat = (statKey) => {
    const current = charData.stats[statKey];
    if (current) {
        setStatPool(prev => [...prev, current].sort((a,b) => b.val - a.val));
        setCharData(prev => ({ ...prev, stats: { ...prev.stats, [statKey]: null } }));
    }
  };

  const isStatsComplete = Object.values(charData.stats).every(s => s !== null);

  const getFinalStats = () => {
    const f = {};
    STAT_KEYS.forEach(s => f[s] = (charData.stats[s]?.val || 10) + (racialBonuses[s] || 0));
    return f;
  };

  const handleSave = async () => {
    try {
      const cls = selectedClass;
      const final = getFinalStats();
      const conMod = Math.floor((final.CON - 10) / 2);
      const hitDie = cls?.hit_die || 8;
      const maxHP = hitDie + conMod;

      const cn = cls?.name?.toLowerCase() || '';
      const classSlots = CASTER_SLOTS[cn] || {};
      const spellSlots = {};
      for (let lvl = 1; lvl <= 9; lvl++) spellSlots[lvl] = { max: classSlots[lvl] || 0, used: 0 };

      let bgSkills = [];
      if (selectedBg) {
        try { bgSkills = JSON.parse(selectedBg.skill_proficiencies || '[]'); } catch {}
      }

      const statsPayload = {
        ...final, currHP: Math.max(maxHP, 1), maxHP: Math.max(maxHP, 1),
        spells: [], spell_slots: spellSlots,
        skillProficiencies: Array.from(new Set([...bgSkills, ...charData.skill_proficiencies])), 
        saveProficiencies: [], expertise: [],
        background_id: charData.background_id, asiHistory: [], hitDiceUsed: 0
      };

      await createCharacter({
        name: charData.name, level: 1,
        race_id: parseInt(charData.race_id), class_id: parseInt(charData.class_id),
        subclass_id: charData.subclass_id, background_id: charData.background_id,
        campaign_id: charData.campaign_id,
        stats: JSON.stringify(statsPayload), equipment: '[]', spell_list: JSON.stringify(charData.spell_list)
      });
      navigate('/player-lobby');
    } catch (e) {
      console.error(e);
      alert('Error al guardar el personaje.');
    }
  };

  const mod = (val) => { const m = Math.floor((val - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };

  // Step calculations
  // Steps: 1: Identidad, 2: Linaje, 3: Vocación, (4: Magia), 5: Atributos, 6: Resumen
  const getStepNumber = (name) => {
    if (name === 'Identidad') return 1;
    if (name === 'Linaje') return 2;
    if (name === 'Vocación') return 3;
    if (name === 'Habilidades') return 4;
    if (name === 'Magia' && needsMagicStep) return 5;
    if (name === 'Atributos') return needsMagicStep ? 6 : 5;
    if (name === 'Resumen') return needsMagicStep ? 7 : 6;
    return -1;
  };
  const stepCount = needsMagicStep ? 7 : 6;
  const stepTitles = ['Identidad', 'Linaje', 'Vocación', 'Habilidades', ...(needsMagicStep ? ['Magia'] : []), 'Atributos', 'Resumen'];

  return (
    <div className="container fade-in" style={{ maxWidth: '900px', paddingBottom: '3rem' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/player-lobby')} style={{ marginBottom: '1rem' }}>← Cancelar</button>

      <div className="glass-panel" style={{ minHeight: '500px' }}>
        <h1 style={{ textAlign: 'center', color: 'var(--accent-red)', fontSize: '1.8rem' }}>⚔️ Creación de Personaje</h1>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {stepTitles.map((name, i) => {
             const sn = i + 1;
             const isPast = step >= sn;
             const isCurrent = step === sn;
             return (
              <span key={i} style={{
                fontSize: '0.8rem', padding: '0.3rem 0.8rem', borderRadius: '12px',
                background: isPast ? 'rgba(200,155,60,0.2)' : 'rgba(255,255,255,0.03)',
                color: isPast ? 'var(--accent-gold)' : 'var(--text-dim)',
                border: `1px solid ${isCurrent ? 'var(--accent-gold)' : 'transparent'}`,
                cursor: step > sn ? 'pointer' : 'default'
              }} onClick={() => step > sn && setStep(sn)}>
                {sn}. {name}
              </span>
             );
          })}
        </div>

        {/* ═══ STEP 1: Identity ═══ */}
        {step === getStepNumber('Identidad') && (
          <div className="fade-in">
            <h2>📝 ¿Quién es tu Héroe?</h2>
            <input type="text" placeholder="Nombre del personaje" value={charData.name}
              onChange={e => setCharData({ ...charData, name: e.target.value })}
              className="input-lg" style={{ marginBottom: '1.5rem', fontSize: '1.2rem', width: '100%' }} />

            <h3>📜 Trasfondo <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>(opcional)</span></h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '1.5rem', maxHeight: '250px', overflowY: 'auto', padding: '5px' }}>
              {backgrounds.map(b => {
                const isSelected = charData.background_id === b.id;
                let skills = [];
                try { skills = JSON.parse(b.skill_proficiencies || '[]'); } catch {}
                return (
                  <div key={b.id} className="glass-panel clickable"
                    onClick={() => setCharData({ ...charData, background_id: isSelected ? null : b.id })}
                    style={{
                      padding: '0.7rem', textAlign: 'center', cursor: 'pointer',
                      borderColor: isSelected ? 'var(--accent-gold)' : '',
                      background: isSelected ? 'rgba(200,155,60,0.1)' : ''
                    }}>
                    <div style={{ fontWeight: 600, color: isSelected ? '#fff' : 'var(--text-main)', fontSize: '0.95rem' }}>{b.name}</div>
                    {skills.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', marginTop: '0.2rem' }}>
                        {skills.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedBg && (
              <div style={{ background: 'rgba(200,155,60,0.08)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(200,155,60,0.2)' }}>
                <strong style={{ color: 'var(--accent-gold)' }}>{selectedBg.feature_name}</strong>
                <p style={{ fontSize: '0.8rem', color: '#ccc', margin: '0.3rem 0 0' }}>{selectedBg.feature_desc}</p>
              </div>
            )}

            {campaigns.length > 0 && (
              <>
                <h3>🎪 Campaña <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>(opcional)</span></h3>
                <select className="input-md" value={charData.campaign_id || ''} onChange={e => setCharData({ ...charData, campaign_id: e.target.value ? parseInt(e.target.value) : null })} style={{width: '100%'}}>
                  <option value="">Sin campaña</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </>
            )}

            <div style={{ textAlign: 'right', marginTop: '2rem' }}>
              <button className="btn btn-gold" onClick={() => setStep(getStepNumber('Linaje'))} disabled={!charData.name.trim()}>
                Elegir Raza <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Race & Subrace ═══ */}
        {step === getStepNumber('Linaje') && (
          <div className="fade-in">
            <h2>🧬 Selecciona tu Linaje</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', maxHeight: '250px', overflowY: 'auto', padding: '0.5rem' }}>
              {races.map(r => {
                const isSelected = charData.race_id === r.id;
                let bonusText = '';
                try {
                  const b = JSON.parse(r.ability_bonuses);
                  bonusText = b.map(x => `${x.ability} +${x.bonus}`).join(', ');
                } catch {}
                let langs = '';
                try { const l = JSON.parse(r.languages || '[]'); langs = l.join(', '); } catch {}
                return (
                  <div key={r.id} className="glass-panel clickable" onClick={() => setCharData({ ...charData, race_id: r.id, subrace_index: null })}
                    style={{
                      cursor: 'pointer', padding: '0.8rem',
                      borderColor: isSelected ? 'var(--accent-gold)' : '',
                      background: isSelected ? 'rgba(200,155,60,0.1)' : ''
                    }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: isSelected ? '#fff' : '' }}>{r.name}</h3>
                    {bonusText && <p style={{ fontSize: '0.75rem', margin: '0.3rem 0 0', color: 'var(--accent-gold)' }}>{bonusText}</p>}
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: '0.2rem 0 0' }}>Vel: {r.speed} ft • {r.size}</p>
                    {langs && <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: '0.1rem 0 0' }}>🗣 {langs}</p>}
                  </div>
                );
              })}
            </div>

            {charData.race_id && raceSubraces.length > 0 && (
              <div style={{ marginTop: '1.5rem' }} className="slide-up">
                <h3 style={{ color: 'var(--accent-gold)' }}>🌱 Subraza / Variante</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.8rem' }}>
                  {raceSubraces.map(sr => {
                    const isSelected = charData.subrace_index === sr.index;
                    const b = sr.ability_bonuses.map(x => `${x.ability} +${x.bonus}`).join(', ');
                    return (
                        <div key={sr.index} className="glass-panel clickable" onClick={() => setCharData({ ...charData, subrace_index: sr.index })}
                        style={{
                            cursor: 'pointer', padding: '0.8rem',
                            borderColor: isSelected ? 'var(--accent-gold)' : '',
                            background: isSelected ? 'rgba(200,155,60,0.1)' : ''
                        }}>
                        <strong style={{ color: isSelected ? '#fff' : 'var(--text-main)' }}>{sr.name}</strong>
                        {b && <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', marginTop: '0.2rem' }}>{b}</div>}
                        <p style={{ fontSize: '0.75rem', color: '#bbb', margin: '0.3rem 0 0' }}>{sr.desc}</p>
                        </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex-row flex-between" style={{ marginTop: '2rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(getStepNumber('Identidad'))}><ChevronLeft size={16} /> Identidad</button>
              <button className="btn btn-gold" onClick={() => setStep(getStepNumber('Vocación'))} disabled={!charData.race_id || (raceSubraces.length > 0 && !charData.subrace_index)}>
                Elegir Clase <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Class & Subclass ═══ */}
        {step === getStepNumber('Vocación') && (
          <div className="fade-in">
            <h2>⚔️ Selecciona tu Vocación</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}>
              {classes.map(c => {
                const isSelected = charData.class_id === c.id;
                let saves = '';
                try { saves = JSON.parse(c.saving_throws || '[]').join(', '); } catch {}
                return (
                  <div key={c.id} className="glass-panel clickable" onClick={() => setCharData({ ...charData, class_id: c.id, subclass_id: null, spell_list: [] })}
                    style={{
                      cursor: 'pointer', padding: '0.8rem',
                      borderColor: isSelected ? 'var(--accent-red)' : '',
                      background: isSelected ? 'rgba(139,0,0,0.1)' : ''
                    }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: isSelected ? '#fff' : '' }}>{c.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-red-bright)', margin: '0.2rem 0 0' }}>
                      <Heart size={12} /> d{c.hit_die}
                    </p>
                    {saves && <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: '0.2rem 0 0' }}>Salvaciones: {saves}</p>}
                  </div>
                );
              })}
            </div>

            {charData.class_id && clsSubclasses.length > 0 && (
              <div style={{ marginTop: '1.5rem' }} className="slide-up">
                <h3 style={{ color: 'var(--accent-gold)' }}>🛡️ Subclase / Arquetipo <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>(se elige al nivel 3, pero puedes marcarlo ya)</span></h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.8rem' }}>
                  {clsSubclasses.map(sc => {
                    const isSelected = charData.subclass_id === sc.id;
                    return (
                      <div key={sc.id} className="glass-panel clickable"
                        onClick={() => setCharData({ ...charData, subclass_id: isSelected ? null : sc.id })}
                        style={{
                          cursor: 'pointer', padding: '0.8rem',
                          borderColor: isSelected ? 'var(--accent-gold)' : '',
                          background: isSelected ? 'rgba(200,155,60,0.08)' : ''
                        }}>
                        <strong style={{ color: isSelected ? '#fff' : 'var(--text-main)' }}>{sc.name}</strong>
                        <p style={{ fontSize: '0.75rem', color: '#bbb', margin: '0.3rem 0 0' }}>
                          {(sc.description || '').substring(0, 120)}{(sc.description || '').length > 120 ? '...' : ''}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex-row flex-between" style={{ marginTop: '2rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(getStepNumber('Linaje'))}><ChevronLeft size={16} /> Raza</button>
              <button className="btn btn-gold" onClick={() => setStep(getStepNumber('Habilidades'))} disabled={!charData.class_id}>
                Habilidades <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Skills ═══ */}
        {step === getStepNumber('Habilidades') && (
          <div className="fade-in">
            <h2>🎯 Elige tus Habilidades</h2>
            {(() => {
              const bgSkills = selectedBg ? (() => { try { return JSON.parse(selectedBg.skill_proficiencies || '[]'); } catch { return []; } })() : [];
              const classLimit = CLASS_SKILL_COUNT[classNameLow] || 2;
              const classOptions = CLASS_SKILL_LIST[classNameLow] || [];
              const selectedFromClass = charData.skill_proficiencies.filter(s => classOptions.includes(s));
              
              return (
                <>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Como <strong>{selectedClass?.name}</strong>, puedes elegir <strong>{classLimit}</strong> habilidades de tu lista de clase.
                  </p>
                  
                  {bgSkills.length > 0 && (
                    <div style={{ marginBottom: '1rem', padding: '0.8rem', background: 'rgba(200,155,60,0.1)', borderRadius: '8px', border: '1px solid var(--accent-gold)' }}>
                      <span style={{ color: 'var(--accent-gold)', fontSize: '0.85rem' }}>✨ Otorgadas por {selectedBg.name}: <strong>{bgSkills.join(', ')}</strong></span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
                    {SKILLS_MASTER.map(skill => {
                      const isBg = bgSkills.includes(skill.name);
                      const isClassOption = classOptions.includes(skill.index);
                      const isSelected = charData.skill_proficiencies.includes(skill.index);
                      const disabled = !isSelected && selectedFromClass.length >= classLimit;

                      return (
                        <div key={skill.index} className={`glass-panel ${isClassOption && !isBg ? 'clickable' : ''}`}
                          onClick={() => {
                            if (!isClassOption || isBg) return;
                            if (isSelected) {
                              setCharData(prev => ({ ...prev, skill_proficiencies: prev.skill_proficiencies.filter(s => s !== skill.index) }));
                            } else if (!disabled) {
                              setCharData(prev => ({ ...prev, skill_proficiencies: [...prev.skill_proficiencies, skill.index] }));
                            }
                          }}
                          style={{
                            padding: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
                            opacity: isBg ? 0.8 : (isClassOption ? (disabled && !isSelected ? 0.5 : 1) : 0.3),
                            borderColor: isSelected ? 'var(--accent-gold)' : '',
                            background: isSelected ? 'rgba(200,155,60,0.1)' : '',
                            cursor: isClassOption && !isBg ? 'pointer' : 'default'
                          }}>
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%',
                            border: `2px solid ${isSelected || isBg ? 'var(--accent-gold)' : '#555'}`,
                            background: isSelected || isBg ? 'var(--accent-gold)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {(isSelected || isBg) && <span style={{ fontSize: '10px', color: '#000', fontWeight: 'bold' }}>✓</span>}
                          </div>
                          <span style={{ fontSize: '0.9rem', color: isBg ? 'var(--accent-gold)' : '#ddd' }}>{skill.name}</span>
                          {isBg && <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>(Trasfondo)</span>}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{ textAlign: 'right', color: selectedFromClass.length === classLimit ? 'var(--accent-green)' : 'var(--accent-gold)' }}>
                    Seleccionadas: {selectedFromClass.length} / {classLimit}
                  </div>
                </>
              );
            })()}

            <div className="flex-row flex-between" style={{ marginTop: '2rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(getStepNumber('Vocación'))}><ChevronLeft size={16} /> Clase</button>
              <button className="btn btn-gold" onClick={() => setStep(getStepNumber(needsMagicStep ? 'Magia' : 'Atributos'))} 
                disabled={(() => {
                  const limit = CLASS_SKILL_COUNT[classNameLow] || 2;
                  const selected = charData.skill_proficiencies.filter(s => (CLASS_SKILL_LIST[classNameLow] || []).includes(s));
                  return selected.length < limit;
                })()}>
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Magic (Cantrips & Level 1) ═══ */}
        {needsMagicStep && step === getStepNumber('Magia') && (
            <div className="fade-in">
                <h2>✨ Magia de Nivel 1</h2>
                
                {/* CANTRIPS SECTION */}
                {allowedCantripsCount > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: 'var(--accent-purple)' }}>Trucos (Nivel 0)</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Como {selectedClass?.name}{charData.subrace_index === 'high-elf' ? ' (y Alto Elfo)' : ''}, sabes <strong>{allowedCantripsCount} trucos</strong>.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}>
                        {availableCantrips.map(c => {
                            const isSelected = charData.spell_list.includes(c.index);
                            return (
                                <div key={c.index} className="glass-panel clickable" 
                                    onClick={() => {
                                        if (isSelected) {
                                            setCharData(prev => ({ ...prev, spell_list: prev.spell_list.filter(i => i !== c.index) }));
                                        } else if (selectedCantripsCount < allowedCantripsCount) {
                                            setCharData(prev => ({ ...prev, spell_list: [...prev.spell_list, c.index] }));
                                        }
                                    }}
                                    style={{
                                        cursor: 'pointer', padding: '0.8rem',
                                        borderColor: isSelected ? 'var(--accent-purple)' : '',
                                        background: isSelected ? 'rgba(123, 94, 167, 0.15)' : '',
                                        opacity: (!isSelected && selectedCantripsCount >= allowedCantripsCount) ? 0.5 : 1
                                    }}>
                                    <strong style={{ color: isSelected ? '#fff' : 'var(--text-main)' }}><Zap size={12} style={{marginRight: '4px', color:'var(--accent-purple)'}} /> {c.name}</strong>
                                    <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.2rem' }}>
                                        {c.casting_time} • {c.range}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{marginTop: '0.5rem', textAlign: 'right'}}>
                        <span style={{ fontSize: '0.85rem', color: selectedCantripsCount === allowedCantripsCount ? 'var(--accent-green)' : 'var(--accent-gold)' }}>
                            Trucos Seleccionados: {selectedCantripsCount} / {allowedCantripsCount}
                        </span>
                    </div>
                  </div>
                )}

                {/* LEVEL 1 SPELLS SECTION */}
                {allowedLevel1Count > 0 && (
                  <div>
                    <h3 style={{ color: 'var(--accent-blue-bright)' }}>Conjuros Conocidos (Nivel 1)</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Como {selectedClass?.name}, comienzas con <strong>{allowedLevel1Count} conjuros</strong> de nivel 1. {prepareAllClasses.includes(classNameLow) ? '(Conoces todos, solo selecciona aquellos que usualmente prepararías en tu lista).' : ''}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}>
                        {availableLevel1Spells.map(c => {
                            const isSelected = charData.spell_list.includes(c.index);
                            return (
                                <div key={c.index} className="glass-panel clickable" 
                                    onClick={() => {
                                        if (isSelected) {
                                            setCharData(prev => ({ ...prev, spell_list: prev.spell_list.filter(i => i !== c.index) }));
                                        } else if (selectedLevel1Count < allowedLevel1Count) {
                                            setCharData(prev => ({ ...prev, spell_list: [...prev.spell_list, c.index] }));
                                        }
                                    }}
                                    style={{
                                        cursor: 'pointer', padding: '0.8rem',
                                        borderColor: isSelected ? 'var(--accent-blue-bright)' : '',
                                        background: isSelected ? 'rgba(0, 150, 255, 0.1)' : '',
                                        opacity: (!isSelected && selectedLevel1Count >= allowedLevel1Count) ? 0.5 : 1
                                    }}>
                                    <strong style={{ color: isSelected ? '#fff' : 'var(--text-main)' }}>{c.name}</strong>
                                    <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.2rem' }}>
                                        {c.casting_time} • {c.range}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{marginTop: '0.5rem', textAlign: 'right'}}>
                        <span style={{ fontSize: '0.85rem', color: selectedLevel1Count === allowedLevel1Count ? 'var(--accent-green)' : 'var(--accent-blue-bright)' }}>
                            Conjuros Seleccionados: {selectedLevel1Count} / {allowedLevel1Count}
                        </span>
                    </div>
                  </div>
                )}

                <div className="flex-row flex-between" style={{ marginTop: '2rem' }}>
                    <button className="btn btn-ghost" onClick={() => setStep(getStepNumber('Vocación'))}><ChevronLeft size={16} /> Clase</button>
                    <button className="btn btn-gold" onClick={() => setStep(getStepNumber('Atributos'))} 
                      disabled={(allowedCantripsCount > 0 && selectedCantripsCount < allowedCantripsCount) || (allowedLevel1Count > 0 && selectedLevel1Count < allowedLevel1Count)}>
                        Atributos <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        )}

        {/* ═══ STEP 5: Stats ═══ */}
        {step === getStepNumber('Atributos') && (
          <div className="fade-in">
            <div className="flex-row flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>🎲 Atributos Base</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Asigna los valores según prefieras.</p>
              </div>
              <div className="flex-row" style={{ gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={rollDice}><Dice5 size={14} /> Tirar 4d6</button>
                <button className="btn btn-ghost btn-sm" onClick={setStandard}>Array Estándar</button>
              </div>
            </div>

            {/* Score Pool */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', marginBottom: '2rem', minHeight: '80px', border: '1px dashed var(--glass-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem', textAlign: 'center' }}>VALORES DISPONIBLES (Haz clic para asignar)</div>
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {statPool.length === 0 ? (
                      <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.8rem' }}>Sin valores. Genera o elige array estándar.</div>
                  ) : (
                      statPool.map(item => (
                          <div key={item.id} style={{
                              background: 'var(--bg-secondary)', border: '1px solid var(--accent-gold)', 
                              borderRadius: '8px', padding: '0.8rem', fontSize: '1.2rem', fontWeight: 'bold', 
                              cursor: 'grab', minWidth: '50px', textAlign: 'center', color: '#fff'
                          }}>
                              {item.val}
                          </div>
                      ))
                  )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', margin: '2rem 0' }}>
              {STAT_KEYS.map(statKey => {
                const currentVal = charData.stats[statKey];
                const bonus = racialBonuses[statKey] || 0;
                
                return (
                  <div key={statKey} style={{
                    background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: '10px', textAlign: 'center',
                    border: '1px solid #333', position: 'relative'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                      {STAT_NAMES[statKey]}
                    </div>
                    
                    {currentVal ? (
                        <div className="clickable" onClick={() => unassignStat(statKey)} style={{
                            fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', 
                            cursor: 'pointer', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem', position: 'relative'
                        }}>
                             {currentVal.val}
                             <div style={{position: 'absolute', top: '2px', right: '5px'}}><X size={14} color="#888" /></div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', flexWrap: 'wrap', minHeight: '60px', alignItems: 'center' }}>
                            {statPool.map(poolItem => (
                                <button key={poolItem.id} onClick={() => assignStat(statKey, poolItem)} 
                                    className="btn btn-ghost btn-sm" 
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                                    {poolItem.val}
                                </button>
                            ))}
                            {statPool.length === 0 && <span style={{color:'var(--text-dim)', fontSize:'0.8rem'}}>-</span>}
                        </div>
                    )}

                    {currentVal && (
                        <div style={{marginTop: '0.5rem'}}>
                            <div style={{ fontSize: '1rem', color: mod(currentVal.val) >= '+0' ? 'var(--accent-green)' : 'var(--accent-red-bright)', fontWeight: 'bold' }}>
                            {mod(currentVal.val)}
                            </div>
                            {bonus > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', marginTop: '0.3rem' }}>
                                Racial: +{bonus} → <strong>{currentVal.val + bonus}</strong> ({mod(currentVal.val + bonus)})
                            </div>
                            )}
                        </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex-row flex-between" style={{ marginTop: '2rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(getStepNumber(needsMagicStep ? 'Magia' : 'Vocación'))}><ChevronLeft size={16} /> Volver</button>
              <button className="btn btn-gold" onClick={() => setStep(getStepNumber('Resumen'))} disabled={!isStatsComplete}>
                Ver Resumen <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 6: Summary ═══ */}
        {step === getStepNumber('Resumen') && (
          <div className="fade-in">
            <h2>✨ Resumen del Personaje</h2>

            {/* Identity card */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1.2rem', borderRadius: '10px', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-gold)' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{charData.name}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className="badge badge-gold">{selectedRace?.name || '—'} {selectedSubrace ? `(${selectedSubrace.name})` : ''}</span>
                <span className="badge badge-red">{selectedClass?.name || '—'} (d{selectedClass?.hit_die})</span>
                {selectedBg && <span className="badge" style={{ background: 'rgba(100,100,255,0.15)', border: '1px solid rgba(100,100,255,0.3)', color: '#aaf' }}>{selectedBg.name}</span>}
                {charData.subclass_id && (
                  <span className="badge" style={{ background: 'rgba(200,155,60,0.15)', border: '1px solid rgba(200,155,60,0.3)', color: 'var(--accent-gold)' }}>
                    {subclasses.find(s => s.id === charData.subclass_id)?.name}
                  </span>
                )}
              </div>
            </div>

            {/* Final stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {STAT_KEYS.map(stat => {
                const base = charData.stats[stat]?.val || 10;
                const bonus = racialBonuses[stat] || 0;
                const final = base + bonus;
                return (
                  <div key={stat} style={{
                    background: 'rgba(0,0,0,0.4)', padding: '0.8rem 0.5rem', borderRadius: '8px', textAlign: 'center',
                    border: bonus > 0 ? '1px solid var(--accent-gold)' : '1px solid #333'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', textTransform: 'uppercase' }}>{STAT_SHORT[stat]}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{final}</div>
                    <div style={{ fontSize: '0.85rem', color: mod(final).startsWith('+') || mod(final) === '+0' ? 'var(--accent-green)' : 'var(--accent-red-bright)' }}>
                      {mod(final)}
                    </div>
                    {bonus > 0 && (
                      <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '0.2rem' }}>{base} + {bonus}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* HP preview */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {(() => {
                const final = getFinalStats();
                const conMod = Math.floor((final.CON - 10) / 2);
                const hitDie = selectedClass?.hit_die || 8;
                const maxHP = hitDie + conMod;
                return (
                  <>
                    <div style={{ background: 'rgba(0,100,0,0.15)', border: '1px solid rgba(0,100,0,0.3)', padding: '0.8rem 1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#aaa' }}>PG Máx</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4a4' }}>{Math.max(maxHP, 1)}</div>
                      <div style={{ fontSize: '0.65rem', color: '#888' }}>d{hitDie} + CON ({conMod >= 0 ? '+' : ''}{conMod})</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,139,0.15)', border: '1px solid rgba(0,0,139,0.3)', padding: '0.8rem 1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#aaa' }}>CA Base</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{10 + Math.floor((final.DEX - 10) / 2)}</div>
                      <div style={{ fontSize: '0.65rem', color: '#888' }}>10 + DES ({mod(final.DEX)})</div>
                    </div>
                    <div style={{ background: 'rgba(139,0,0,0.15)', border: '1px solid rgba(139,0,0,0.3)', padding: '0.8rem 1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Iniciativa</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{mod(final.DEX)}</div>
                      <div style={{ fontSize: '0.65rem', color: '#888' }}>DES ({mod(final.DEX)})</div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex-row flex-between" style={{ marginTop: '2rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(getStepNumber('Atributos'))}><ChevronLeft size={16} /> Atributos</button>
              <button className="btn btn-gold btn-lg" onClick={handleSave} style={{ fontSize: '1.1rem' }}>
                ✨ ¡Crear Personaje!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
