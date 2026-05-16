import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCharacter, updateCharacter, getRace, getClass as getClassApi, getItems, rollDice, getCharacters, getCharacterEquipment, getCharacterWeapons, getCharacterArmor, equipItem, unequipItem, getSubclasses, getLevelingEntry, getSpells } from '../api';
import { Save, BookOpen, Heart, Shield, Swords, ArrowUp, Moon, Sunrise, Plus, Minus, Dice5, Target, UserCircle, Flame, Activity, Brain, Eye, Hammer, ShieldPlus, Printer } from 'lucide-react';
import { useAuth } from '../AuthContext';

const STAT_NAMES = { STR: 'FUE', DEX: 'DES', CON: 'CON', INT: 'INT', WIS: 'SAB', CHA: 'CAR' };
const STAT_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const STAT_ICONS = { 
  STR: Swords, 
  DEX: Activity, 
  CON: Heart, 
  INT: Brain, 
  WIS: Eye, 
  CHA: UserCircle 
};
const FULL_NAMES = { STR: 'Fuerza', DEX: 'Destreza', CON: 'Constitución', INT: 'Inteligencia', WIS: 'Sabiduría', CHA: 'Carisma' };

// HP per level (beyond lvl 1): avg or roll
const CLASS_HIT_DICE = { 'bárbaro': 12, 'guerrero': 10, 'paladín': 10, 'explorador': 10, 'bardo': 8, 'clérigo': 8, 'druida': 8, 'monje': 8, 'brujo': 8, 'pícaro': 8, 'hechicero': 6, 'mago': 6, 'artífice': 8 };

const FULL_CASTERS = ['bardo', 'clérigo', 'druida', 'hechicero', 'mago'];
const HALF_CASTERS = ['paladín', 'explorador', 'artífice'];

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

const SUBCLASS_LEVELS = {
  'clérigo': 1, 'hechicero': 1, 'brujo': 1,
  'druida': 2, 'mago': 2,
  'bárbaro': 3, 'bardo': 3, 'guerrero': 3, 'monje': 3,
  'paladín': 3, 'explorador': 3, 'pícaro': 3, 'artífice': 3,
};

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
const SKILL_STAT_MAP = {
  acrobatics: 'DEX', 'animal-handling': 'WIS', arcana: 'INT', athletics: 'STR',
  deception: 'CHA', history: 'INT', insight: 'WIS', intimidation: 'CHA',
  investigation: 'INT', medicine: 'WIS', nature: 'INT', perception: 'WIS',
  performance: 'CHA', persuasion: 'CHA', religion: 'INT', 'sleight-of-hand': 'DEX',
  stealth: 'DEX', survival: 'WIS'
};
const SPELL_ABILITY = {
  bardo: 'CHA', clérigo: 'WIS', druida: 'WIS', hechicero: 'CHA',
  brujo: 'CHA', mago: 'INT', paladín: 'WIS', explorador: 'WIS', artífice: 'INT'
};
const COIN_VALUES = { cp: 1, sp: 10, ep: 50, gp: 100, pp: 1000 };

export default function CharacterSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [campaignCharacters, setCampaignCharacters] = useState([]);
  const [stats, setStats] = useState({});
  const [raceName, setRaceName] = useState('');
  const [className, setClassName] = useState('');
  const [classIndex, setClassIndex] = useState('');
  const [hitDie, setHitDie] = useState(8);
  const [equipment, setEquipment] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [shopPage, setShopPage] = useState(0);
  const [shopSearch, setShopSearch] = useState('');
  const [shopLoading, setShopLoading] = useState(false);
  const [shopExpanded, setShopExpanded] = useState(null);
  const [equipmentStats, setEquipmentStats] = useState(null);
  const [weapons, setWeapons] = useState([]);
  const [armor, setArmor] = useState([]);
  const [saving, setSaving] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [levelUpModal, setLevelUpModal] = useState(null); // {newLevel, hpGain}
  const [subclassList, setSubclassList] = useState([]);
  const [subclassName, setSubclassName] = useState('');
  const [allSpells, setAllSpells] = useState([]);
  const [expandedSpell, setExpandedSpell] = useState(null);


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
    const result = { pp: 0, ep: 0 };
    result.gp = Math.floor(remaining / COIN_VALUES.gp); remaining %= COIN_VALUES.gp;
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
      try { 
        const parsed = JSON.parse(char.equipment || '[]'); 
        if (Array.isArray(parsed)) eq = parsed;
      } catch {}
      
      if (eq.length === 0 && char.starting_equipment) {
        try { 
          const parsedStart = JSON.parse(char.starting_equipment || '[]'); 
          if (Array.isArray(parsedStart)) eq = parsedStart;
        } catch {}
      }

      setCharacter(char);
      setStats(statsObj);
      setEquipment(Array.isArray(eq) ? eq : []);

      // Load spells for print layout
      getSpells({ limit: 500 }).then(r => setAllSpells(r.data || [])).catch(() => {});

      // Cargar equipo específico
      loadEquipmentData(id);

      if (char.race_id) getRace(char.race_id).then(r => setRaceName(r.data.name)).catch(() => {});
      if (char.class_id) getClassApi(char.class_id).then(c => { setClassName(c.data.name); setClassIndex(c.data.index); setHitDie(c.data.hit_die); }).catch(() => {});
      if (char.subclass_id) getSubclasses().then(res => {
        const found = (res.data || []).find(s => s.id === char.subclass_id);
        if (found) setSubclassName(found.name);
      }).catch(() => {});
      
      if (char.campaign_id) {
        getCharacters(char.campaign_id).then(res => {
          const myChars = (res.data || []).filter(c => c.user_id === user?.id);
          setCampaignCharacters(myChars);
        }).catch(() => {});
      }
    } catch (e) { console.error(e); }
  };

  const loadEquipmentData = async (characterId) => {
    try {
      // Cargar estadísticas de equipo
      const equipRes = await getCharacterEquipment(characterId);
      setEquipmentStats(equipRes.data.equipment_stats);
      
      // Cargar armas
      const weaponsRes = await getCharacterWeapons(characterId);
      setWeapons(Array.isArray(weaponsRes.data) ? weaponsRes.data : []);
      
      // Cargar armaduras
      const armorRes = await getCharacterArmor(characterId);
      setArmor(Array.isArray(armorRes.data) ? armorRes.data : []);
    } catch (e) {
      console.error('Error cargando datos de equipo:', e);
    }
  };

  useEffect(() => { load(); }, [id]);

  const loadShopItems = async () => {
    setShopLoading(true);
    try {
      const params = { skip: shopPage * 20, limit: 20 };
      if (shopSearch) params.search = shopSearch;
      const res = await getItems(params);
      setShopItems(Array.isArray(res.data) ? res.data : []);
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
    const newStats = { ...stats, coins: remaining };
    setStats(newStats);
    
    // Añadir item al inventario con ID
    const newItem = { 
      id: item.id, 
      name: item.name, 
      cost: renderCost(item),
      category: item.category,
      damage_dice: item.damage_dice,
      damage_type: item.damage_type,
      weapon_range: item.weapon_range,
      armor_class_base: item.armor_class_base,
      armor_class_dex_bonus: item.armor_class_dex_bonus,
      stealth_disadvantage: item.stealth_disadvantage,
      properties: item.properties || []
    };
    
    const newEq = [...equipment, newItem];
    setEquipment(newEq);
    
    // Persistir compra al backend
    await updateCharacter(id, { stats: JSON.stringify(newStats), equipment: JSON.stringify(newEq) });
    await loadEquipmentData(id);
    alert(`Comprado ${item.name}. Te quedan ${formatCoins(remaining)}.`);
    
    // Si es arma o armadura, ofrecer equipar automáticamente
    if (item.category === 'Weapon' || item.category === 'Armor' || item.category === 'Arma' || item.category === 'Armadura' || item.category === 'Shield' || item.category === 'Escudo') {
      const shouldEquip = window.confirm(`¿Quieres equipar ${item.name} ahora?`);
      if (shouldEquip) {
        const isWeapon = item.category === 'Weapon' || item.category === 'Arma';
        const slot = isWeapon ? 'weapon' : 'armor';
        equipItemToCharacter(item.id, slot);
      }
    }
  };

  const equipItemToCharacter = async (itemId, slot) => {
    try {
      const result = await equipItem(id, itemId, slot);
      if (result.data.success) {
        alert(`${result.data.equipped_item.name} equipado en ranura ${slot}`);
        // Recargar datos de equipo
        await loadEquipmentData(id);
      } else {
        alert('Error al equipar item: ' + (result.data.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error equipando item:', e);
      alert('Error al equipar item');
    }
  };

  const unequipItemFromCharacter = async (slot) => {
    try {
      const result = await unequipItem(id, slot);
      if (result.data.success) {
        alert(`Item desequipado de ranura ${slot}`);
        // Recargar datos de equipo
        await loadEquipmentData(id);
      } else {
        alert('Error al desequipar item: ' + (result.data.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error desequipando item:', e);
      alert('Error al desequipar item');
    }
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
    const diceToSpend = parseInt(window.prompt(
      `Tienes ${hitDiceAvail} d${hitDie} disponibles. ¿Cuántos quieres gastar? (1-${hitDiceAvail})`, '1'), 10);
    if (!diceToSpend || diceToSpend < 1 || diceToSpend > hitDiceAvail) {
      alert('Número inválido. No se gastaron dados de golpe.');
      return;
    }
    
    let totalHealed = 0;
    for (let i = 0; i < diceToSpend; i++) {
      totalHealed += Math.floor(Math.random() * hitDie) + 1 + mod(stats.CON || 10);
    }
    totalHealed = Math.max(0, totalHealed);
    
    setStats(prev => {
      const newState = {
        ...prev,
        currHP: Math.min(prev.maxHP, (prev.currHP || 0) + totalHealed),
        hitDiceUsed: Math.min(character?.level || 1, (prev.hitDiceUsed || 0) + diceToSpend)
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
    alert(`Descanso Corto: Gastas ${diceToSpend}d${hitDie}. Recuperas ${totalHealed} PG. ${className.toLowerCase() === 'brujo' ? 'Espacios de pacto restaurados.' : ''}`);
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

  const levelUp = async () => {
    const newLevel = (character?.level || 1) + 1;
    const cn = className.toLowerCase();
    const hd = CLASS_HIT_DICE[cn] || hitDie;
    const avg = Math.floor(hd / 2) + 1;
    const conMod = mod(stats.CON || 10);
    const isCaster = FULL_CASTERS.includes(cn) || HALF_CASTERS.includes(cn) || cn === 'brujo';
    const subclassLevel = SUBCLASS_LEVELS[cn];
    const needsSubclass = !character?.subclass_id && newLevel >= subclassLevel;

    // Fetch leveling data from DB
    let levelData = null;
    let features = [];
    let dbSlots = null;
    let cantripCount = 0;
    let newPB = 0;
    try {
      const res = await getLevelingEntry(cn, newLevel);
      levelData = res.data;
      if (levelData) {
        try { features = JSON.parse(levelData.features || '[]'); } catch {}
        if (levelData.spell_slots) try { dbSlots = JSON.parse(levelData.spell_slots); } catch {}
        cantripCount = levelData.cantrips_known || 0;
        newPB = levelData.proficiency_bonus || 0;
      }
    } catch (e) { console.error('Error fetching leveling data:', e); }

    const oldPB = Math.ceil((character?.level || 1) / 4) + 1;
    const pbIncreased = newPB > oldPB;
    const asiLevels = [4, 8, 12, 16, 19];
    const isASI = asiLevels.includes(newLevel);
    const cantripIncreased = cantripCount > 0;

    let newSubclassList = [];
    if (needsSubclass) {
      const res = await getSubclasses();
      newSubclassList = (res.data || []).filter(s => s.class_index === classIndex);
    }

    setLevelUpModal({
      newLevel, hd, avg, conMod, cn, isCaster, rollMode: 'avg',
      needsSubclass, subclassList: newSubclassList, selectedSubclassId: null,
      features, pbIncreased, newPB, cantripCount, cantripIncreased, isASI,
      dbSlots, asiChanges: {}
    });
  };

  const confirmLevelUp = async () => {
    const { newLevel, hd, conMod, cn, rollMode, selectedSubclassId, subclassList, dbSlots, asiChanges, features, cantripIncreased } = levelUpModal;
    const hpRoll = rollMode === 'roll' ? Math.max(1, Math.floor(Math.random() * hd) + 1) : Math.floor(hd / 2) + 1;
    const hpGain = hpRoll + conMod;

    const oldMaxHP = stats.maxHP || 1;
    const oldCurrHP = stats.currHP || 0;
    const newMaxHP = oldMaxHP + Math.max(1, hpGain);
    const newCurrHP = oldCurrHP + Math.max(1, hpGain);

    // Apply ASI changes to stats
    const asiApplied = {};
    if (asiChanges && Object.keys(asiChanges).length > 0) {
      STAT_KEYS.forEach(k => {
        if (asiChanges[k]) asiApplied[k] = (stats[k] || 10) + asiChanges[k];
      });
    }

    setStats(prev => {
      const newState = { 
        ...prev, 
        maxHP: (prev.maxHP || 1) + Math.max(1, hpGain), 
        currHP: (prev.currHP || 0) + Math.max(1, hpGain),
        ...asiApplied
      };

      // Use DB spell slots if available, otherwise fallback to hardcoded tables
      if (dbSlots) {
        const newSlots = { ...(prev.spellSlots || {}) };
        if (dbSlots.pact) {
          const pact = dbSlots.pact;
          if (pact.level > 0) newSlots[pact.level] = { max: pact.count, used: 0 };
        } else {
          Object.entries(dbSlots).forEach(([lvl, info]) => {
            const maxVal = info.max || info || 0;
            if (typeof maxVal === 'number') {
              newSlots[lvl] = { max: maxVal, used: (newSlots[lvl]?.used || 0) };
            }
          });
        }
        newState.spellSlots = newSlots;
      } else if (FULL_CASTERS.includes(cn)) {
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
    if (selectedSubclassId) {
      const found = (subclassList || []).find(s => s.id === selectedSubclassId);
      if (found) setSubclassName(found.name);
    }
    setLevelUpModal(null);

    const updatedStats = { ...stats, maxHP: newMaxHP, currHP: newCurrHP, ...asiApplied };
    const updatePayload = { stats: JSON.stringify(updatedStats), level: newLevel };
    if (selectedSubclassId) updatePayload.subclass_id = selectedSubclassId;
    await updateCharacter(id, updatePayload);

    if (features.some(f => f.toLowerCase().includes('conjuro')) || cantripIncreased) {
      navigate(`/character/${id}/spells`);
    }
  };

  // ── Print layout computed values ──
  const spellAbility = SPELL_ABILITY[className.toLowerCase()] || 'INT';
  const spellMod = mod(stats[spellAbility] || 10);
  const saveDC = 8 + spellMod + profBonus;
  const spellAtk = spellMod + profBonus;
  const printSkills = SKILLS_MASTER.map(sk => {
    const skStat = SKILL_STAT_MAP[sk.index];
    const statVal = mod(stats[skStat] || 10);
    const isProf = (stats.skillProficiencies || []).includes(sk.index);
    const isExpert = (stats.expertise || []).includes(sk.index);
    const total = statVal + (isExpert ? profBonus * 2 : isProf ? profBonus : 0);
    return { ...sk, stat: skStat, total, prof: isExpert ? 'expertise' : isProf ? 'proficient' : '' };
  });
  const knownSpells = (stats.spells || []).map(sIdx => allSpells.find(s => s.index === sIdx)).filter(Boolean);
  const knownByLevel = {};
  for (let i = 0; i <= 9; i++) { knownByLevel[i] = knownSpells.filter(s => (s.level || 0) === i); }

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
  
  // Use equipped armor CA if available, then monster/natural ac, otherwise 10 + DEX
  const ac = equipmentStats?.armor_class || stats.ac || (10 + mod(stats.DEX));
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
        <div className="flex-row char-header-buttons" style={{ gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/character/${id}/skills`)}><Target size={16} /> Habilidades</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/character/${id}/spells`)}><BookOpen size={16} /> Grimorio</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/character/${id}/inventory`)}><Shield size={16} /> Inventario</button>
          <button className="btn btn-gold btn-sm" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}</button>
          <button className="btn btn-ghost btn-sm print-trigger" onClick={() => window.print()}><Printer size={16} /> PDF</button>
        </div>
      </div>

      {/* Dice notification */}
      {diceResult && (
        <div className="glass-panel slide-up dice-notification" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 999, borderColor: 'var(--accent-gold)', padding: '1rem', maxWidth: '300px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{diceResult.description}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{diceResult.total}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>{diceResult.dice_formula}</div>
        </div>
      )}

      {/* Character Name & Identity */}
      <div className="glass-panel" style={{ textAlign: 'center', borderTop: '3px solid var(--accent-gold)', marginBottom: '1.5rem', position: 'relative' }}>
        <h1 style={{ fontSize: '2.2rem', margin: 0, color: '#fff' }}>{character.name}</h1>
        <p style={{ color: 'var(--accent-gold)', fontSize: '1rem', margin: '0.3rem 0' }}>
          Nivel {character.level} {raceName ? `• ${raceName}` : ''} {className ? `• ${className}` : ''}{subclassName ? ` → ${subclassName}` : ''} {!raceName && !className && '• Monstruo'}
          {character.level < 20 && (
            <button className="btn btn-ghost btn-sm" onClick={levelUp} style={{ marginLeft: '10px', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
              <ArrowUp size={12} style={{marginRight: '3px'}}/> Subir de Nivel
            </button>
          )}
        </p>
        <span className="badge badge-gold">Competencia: +{profBonus}</span>
      </div>

      {/* Combat row */}
      <div className="combat-row" style={{ marginBottom: '1.5rem' }}>
        <div className="combat-badge" style={{ borderColor: 'var(--accent-blue)' }}>
          <span className="label">Clase de Armadura</span>
          <span className="value" style={{ color: 'var(--accent-blue)' }}>{ac}</span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>{equipmentStats?.armor_class ? 'Armadura Equipada' : (stats.ac ? 'Armadura Natural / Fija' : `10 + DES (${modStr(stats.DEX)})`)}</span>
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
          {STAT_KEYS.map(stat => {
            const Icon = STAT_ICONS[stat];
            return (
              <div key={stat} className="stat-block" style={{ cursor: 'pointer' }}
                onClick={() => handleRoll(`1d20${mod(stats[stat]) >= 0 ? '+' : ''}${mod(stats[stat])}`, `Chequeo de ${FULL_NAMES[stat]}`)}>
                <Icon size={24} className="stat-icon" />
                <span className="stat-label">{STAT_NAMES[stat]}</span>
                <span className="stat-mod">{modStr(stats[stat])}</span>
                <span className="stat-score">{stats[stat] || 10}</span>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
          Haz clic en un atributo para tirar un chequeo (1d20 + mod)
        </p>
        {/* Objetos Atunados */}
        <div style={{ marginTop: '0.8rem', textAlign: 'center', fontSize: '0.8rem', color: '#888' }}>
          Objetos Atunados: {Array.isArray(stats.attunedItems) ? stats.attunedItems.length : 0} / 3
        </div>
      </div>

      {/* Weapons & Armor */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--accent-gold)' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Armas */}
          <div style={{ flex: '1 1 300px' }}>
            <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-gold)' }}>
              <Swords size={18} /> Ataques y Armas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Ataque sin armas (siempre disponible) */}
              {(() => {
                const strMod = mod(stats.STR);
                const unarmedAtk = `1d20${strMod >= 0 ? '+' : ''}${strMod}`;
                const unarmedDmg = `1${strMod >= 0 ? '+' : ''}${strMod}`;
                return (
                  <div className="weapon-armor-item flex-row flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '6px', opacity: 0.8 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#888' }}>Ataque sin Armas</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>1 contundente • Cuerpo a cuerpo</div>
                    </div>
                    <div className="flex-row btn-group" style={{ gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRoll(unarmedAtk, 'Ataque sin Armas')} title="Tirar Ataque" style={{ color: 'var(--accent-blue)', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                        Atq {strMod >= 0 ? '+' : ''}{strMod}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRoll(unarmedDmg, 'Daño sin Armas')} title="Tirar Daño" style={{ color: 'var(--accent-red)', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                        Daño {strMod >= 0 ? '+' : ''}{strMod}
                      </button>
                    </div>
                  </div>
                );
              })()}
              {weapons.map((w, idx) => {
                const isFinesse = (w.properties || []).some(p => p?.index === 'finesse' || p?.name?.toLowerCase().includes('sutil'));
                const isRanged = w.weapon_range === 'Ranged';
                const baseStat = isRanged ? 'DEX' : (isFinesse ? (stats.DEX > stats.STR ? 'DEX' : 'STR') : 'STR');
                const attackMod = mod(stats[baseStat]) + profBonus;
                const dmgMod = mod(stats[baseStat]);
                
                return (
                  <div key={idx} className="weapon-armor-item flex-row flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#fff' }}>{w.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>{w.damage_dice || '1'} {w.damage_type?.name || w.damage_type || ''} • {w.weapon_range}</div>
                    </div>
                    <div className="flex-row btn-group" style={{ gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRoll(`1d20+${attackMod}`, `Ataque con ${w.name}`)} title="Tirar Ataque" style={{ color: 'var(--accent-blue)', padding: '0.2rem 0.5rem' }}>
                        Atq {attackMod >= 0 ? '+' : ''}{attackMod}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRoll(`${w.damage_dice || '1'}${dmgMod >= 0 ? '+' : ''}${dmgMod}`, `Daño con ${w.name}`)} title="Tirar Daño" style={{ color: 'var(--accent-red)', padding: '0.2rem 0.5rem' }}>
                        Daño {dmgMod >= 0 ? '+' : ''}{dmgMod}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Armaduras */}
          <div style={{ flex: '1 1 200px' }}>
            <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
              <Shield size={18} /> Armadura Equipada
            </h3>
            {armor.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin armadura (Base 10 + DES).</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {armor.map((a, idx) => (
                  <div key={idx} className="weapon-armor-item flex-row flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#fff' }}>{a.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>
                        CA Base: {a.armor_class_base || 10}
                        {a.armor_class_dex_bonus ? ' (+DES)' : ''}
                      </div>
                    </div>
                    {a.stealth_disadvantage && (
                      <span className="badge badge-red" style={{ fontSize: '0.6rem' }}>Sigilo Desv.</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Known Spells */}
      {knownSpells.length > 0 && (
        <div className="glass-panel" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--accent-red)' }}>
          <h3 style={{ marginBottom: '1rem' }}><BookOpen size={18} style={{ color: 'var(--accent-red)' }} /> Conjuros Conocidos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[0,1,2,3,4,5,6,7,8,9].map(lvl => {
              const spellsAtLevel = knownByLevel[lvl] || [];
              const slot = (stats.spellSlots || {})[lvl] || { max: 0, used: 0 };
              if (lvl > 1 && slot.max <= 0 && spellsAtLevel.length === 0) return null;
              return (
                <div key={lvl}>
                  <div className="flex-row flex-between" style={{ background: 'rgba(139,0,0,0.15)', padding: '0.4rem 0.6rem', borderRadius: '6px', marginBottom: '0.3rem' }}>
                    <strong style={{ color: '#e88', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                      {lvl === 0 ? 'Trucos' : `Nivel ${lvl}`}
                    </strong>
                    {lvl > 0 && slot.max > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
                        Espacios: {slot.used}/{slot.max}
                      </span>
                    )}
                  </div>
                  {spellsAtLevel.map(sp => (
                    <div key={sp.id || sp.index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem' }}>
                      <div className="flex-row flex-between" style={{ cursor: 'pointer' }} onClick={() => setExpandedSpell(expandedSpell === sp.id ? null : sp.id)}>
                        <div>
                          <span style={{ color: 'var(--accent-gold)', fontSize: '0.85rem' }}>{sp.name}</span>
                          <span style={{ fontSize: '0.65rem', color: '#888', marginLeft: '0.5rem' }}>
                            {sp.school} {sp.concentration ? '• [C]' : ''} {sp.ritual ? '• [R]' : ''}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#666' }}>{expandedSpell === sp.id ? '▲' : '▼'}</span>
                      </div>
                      {expandedSpell === sp.id && (
                        <div style={{ marginTop: '0.3rem', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '0.75rem', color: '#ccc' }}>
                          <div style={{ color: '#999', marginBottom: '0.2rem' }}>
                            Tiempo: {sp.casting_time} • Rango: {sp.range} • Duración: {sp.duration}
                          </div>
                          {sp.components && <div style={{ color: '#999', marginBottom: '0.2rem' }}>Componentes: {sp.components}</div>}
                          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4', margin: 0 }}>{sp.description || 'Sin descripción'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Notas del Personaje</h3>
        <textarea value={character.notes || ''} onChange={e => setCharacter(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Escribe notas, rasgos, ideales, vínculos, defectos..."
          rows={4} style={{ width: '100%', resize: 'vertical' }} />
      </div>

      {/* Level Up Modal */}
      {levelUpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '90%', padding: '1.5rem', borderTop: '4px solid var(--accent-gold)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ textAlign: 'center', color: 'var(--accent-gold)' }}>
              <ArrowUp size={24} /> ¡Nivel {levelUpModal.newLevel}!
            </h2>

            {/* HP */}
            <div style={{ background: 'rgba(0,100,0,0.15)', border: '1px solid rgba(0,100,0,0.3)', padding: '0.8rem', borderRadius: '8px', textAlign: 'center', margin: '0.8rem 0' }}>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Puntos de Golpe</div>
              <div style={{ fontSize: '1.1rem', color: '#aaa' }}>d{levelUpModal.hd} + CON ({mod(stats.CON || 10)})</div>
              <div className="flex-row" style={{ justifyContent: 'center', gap: '1rem', marginTop: '0.6rem' }}>
                <button className={`btn btn-sm ${levelUpModal.rollMode === 'avg' ? 'btn-gold' : 'btn-ghost'}`}
                  onClick={() => setLevelUpModal(prev => ({ ...prev, rollMode: 'avg' }))}>
                  Promedio (+{levelUpModal.avg + levelUpModal.conMod})
                </button>
                <button className={`btn btn-sm ${levelUpModal.rollMode === 'roll' ? 'btn-gold' : 'btn-ghost'}`}
                  onClick={() => setLevelUpModal(prev => ({ ...prev, rollMode: 'roll' }))}>
                  Tirar d{levelUpModal.hd}
                </button>
              </div>
            </div>

            {/* Proficiency Bonus */}
            {levelUpModal.pbIncreased && (
              <div style={{ background: 'rgba(0,100,200,0.12)', border: '1px solid rgba(0,100,200,0.3)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', margin: '0.5rem 0' }}>
                <span style={{ color: '#6af', fontWeight: 'bold' }}>Bonificador de Competencia: +{levelUpModal.newPB}</span>
              </div>
            )}

            {/* Features */}
            {levelUpModal.features?.length > 0 && (
              <div style={{ background: 'rgba(100,200,100,0.08)', border: '1px solid rgba(100,200,100,0.2)', padding: '0.8rem', borderRadius: '8px', margin: '0.5rem 0' }}>
                <div style={{ fontSize: '0.8rem', color: '#8c8', marginBottom: '0.4rem' }}>Nuevas características</div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#ccc' }}>
                  {levelUpModal.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cantrips */}
            {levelUpModal.cantripIncreased && (
              <div style={{ background: 'rgba(200,100,200,0.12)', border: '1px solid rgba(200,100,200,0.3)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', margin: '0.5rem 0' }}>
                <span style={{ color: '#c8c', fontWeight: 'bold' }}>Nuevo truco conocido ({levelUpModal.cantripCount} total)</span>
              </div>
            )}

            {/* ASI */}
            {levelUpModal.isASI && (
              <div style={{ background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.3)', padding: '0.8rem', borderRadius: '8px', margin: '0.5rem 0' }}>
                <div style={{ fontSize: '0.8rem', color: '#fd0', marginBottom: '0.4rem', textAlign: 'center' }}>Mejora de Características (+2 a uno o +1 a dos)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  {STAT_KEYS.map(k => {
                    const change = levelUpModal.asiChanges?.[k] || 0;
                    const totalUsed = Object.values(levelUpModal.asiChanges || {}).reduce((s, v) => s + v, 0);
                    return (
                      <div key={k} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#aaa' }}>{FULL_NAMES[k]}</div>
                        <div style={{ fontSize: '1rem', color: '#fff' }}>{(stats[k] || 10) + change}</div>
                        <div className="flex-row" style={{ justifyContent: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                          <button className="btn btn-ghost btn-sm"
                            style={{ padding: '0 0.3rem', fontSize: '0.7rem', minWidth: '22px', lineHeight: '20px' }}
                            disabled={change <= 0}
                            onClick={() => setLevelUpModal(prev => ({
                              ...prev,
                              asiChanges: { ...prev.asiChanges, [k]: change - 1 }
                            }))}>-</button>
                          <span style={{ fontSize: '0.8rem', minWidth: '16px', textAlign: 'center', color: change > 0 ? '#fd0' : '#666' }}>{change || ''}</span>
                          <button className="btn btn-ghost btn-sm"
                            style={{ padding: '0 0.3rem', fontSize: '0.7rem', minWidth: '22px', lineHeight: '20px' }}
                            disabled={totalUsed >= 2 || change >= 2 || (change >= 1 && totalUsed >= 2)}
                            onClick={() => setLevelUpModal(prev => ({
                              ...prev,
                              asiChanges: { ...prev.asiChanges, [k]: change + 1 }
                            }))}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subclass */}
            {levelUpModal.needsSubclass && (
              <div style={{ background: 'rgba(200,155,60,0.12)', border: '1px solid rgba(200,155,60,0.3)', padding: '0.8rem', borderRadius: '8px', margin: '0.5rem 0' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', textAlign: 'center', marginBottom: '0.4rem' }}>
                  Elige tu subclase (nivel {levelUpModal.newLevel})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {levelUpModal.subclassList.map(sc => {
                    const sel = levelUpModal.selectedSubclassId === sc.id;
                    return (
                      <div key={sc.id} className="glass-panel clickable"
                        onClick={() => setLevelUpModal(prev => ({ ...prev, selectedSubclassId: sc.id }))}
                        style={{
                          cursor: 'pointer', padding: '0.5rem',
                          borderColor: sel ? 'var(--accent-gold)' : 'rgba(255,255,255,0.08)',
                          background: sel ? 'rgba(200,155,60,0.1)' : ''
                        }}>
                        <strong style={{ color: sel ? '#fff' : 'var(--text-main)', fontSize: '0.85rem' }}>{sc.name}</strong>
                        <p style={{ fontSize: '0.65rem', color: '#aaa', margin: '0.15rem 0 0' }}>
                          {(sc.description || '').substring(0, 100)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Spell slots notification */}
            {(levelUpModal.isCaster || levelUpModal.dbSlots) && (
              <div style={{ background: 'rgba(139,0,0,0.12)', border: '1px solid rgba(139,0,0,0.25)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', margin: '0.5rem 0' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>Espacios de conjuro actualizados</div>
              </div>
            )}

            <div className="flex-row" style={{ justifyContent: 'center', marginTop: '1rem', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setLevelUpModal(null)}>Cancelar</button>
              <button className="btn btn-gold" onClick={confirmLevelUp}
                disabled={levelUpModal.needsSubclass && !levelUpModal.selectedSubclassId}>Subir de Nivel</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ PRINT LAYOUT — Official D&D 5E Spanish Sheet ═══════ */}
      <div className="print-sheet">

        {/* ───── PAGE 1: Stats, Skills, Combat, Attacks ───── */}
        <div className="print-page">
          <div className="ps-header">
            <div className="ps-field"><label>Nombre del Personaje</label><span>{character?.name || ''}</span></div>
            <div className="ps-field"><label>Clase y Nivel</label><span>{className}{subclassName ? ` (${subclassName})` : ''} {character?.level}</span></div>
            <div className="ps-field"><label>Trasfondo</label><span>{character?.background_name || ''}</span></div>
            <div className="ps-field"><label>Jugador</label><span>{character?.user_name || ''}</span></div>
            <div className="ps-field"><label>Raza</label><span>{raceName}</span></div>
            <div className="ps-field"><label>Alineamiento</label><span>{character?.alignment || ''}</span></div>
            <div className="ps-field"><label>Puntos de Experiencia</label><span>{character?.xp || ''}</span></div>
          </div>

          <div className="ps-body">
            {/* LEFT COLUMN: Stats */}
            <div className="ps-stats-col">
              {STAT_KEYS.map(k => {
                const val = stats[k] || 10;
                const m = mod(val);
                const saveProf = (stats.savingThrows || []).includes(k);
                const saveVal = m + (saveProf ? profBonus : 0);
                return (
                  <div key={k} className="ps-stat-row">
                    <div className="ps-stat-box">
                      <span className="ps-stat-label">{STAT_NAMES[k].substring(0,3)}</span>
                      <span className="ps-stat-score">{val}</span>
                      <span className="ps-stat-mod-above">Modificador</span>
                      <span className="ps-stat-mod">{m >= 0 ? '+' : ''}{m}</span>
                    </div>
                    <div className="ps-save-box">
                      <div className={`ps-save-dot ${saveProf ? 'filled' : ''}`}></div>
                      <span className="ps-save-val">{saveVal >= 0 ? '+' : ''}{saveVal}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Skills */}
            <div className="ps-skills-col">
              <div className="ps-skills-top-row">
                <div className="ps-inspiration">
                  <span>Inspiración</span>
                  <div className="ps-dot-box"></div>
                </div>
                <div className="ps-prof-bonus">
                  <span>Bonificador de Competencia</span>
                  <span className="ps-value">+{profBonus}</span>
                </div>
              </div>
              <div className="ps-skill-header-row">
                <span className="ps-sh-dot"></span>
                <span className="ps-sh-bonus">Bonus</span>
                <span className="ps-sh-name">Habilidad</span>
                <span className="ps-sh-stat">Atrib.</span>
              </div>
              <div className="ps-skills-list">
                {printSkills.map(sk => (
                  <div key={sk.index} className="ps-skill-row">
                    <div className={`ps-skill-dot ${sk.prof === 'expertise' ? 'double' : sk.prof ? 'filled' : ''}`}></div>
                    <span className="ps-skill-total">{sk.total >= 0 ? '+' : ''}{sk.total}</span>
                    <span className="ps-skill-name">{sk.name}</span>
                    <span className="ps-skill-stat">{sk.stat}</span>
                  </div>
                ))}
              </div>
              <div className="ps-passive">
                <span>Percepción Pasiva (Sabiduría)</span>
                <span className="ps-value">{10 + mod(stats.WIS || 10) + (printSkills.find(s => s.index === 'perception')?.prof ? profBonus : 0)}</span>
              </div>
            </div>

            {/* BOTTOM: Combat + HP */}
            <div className="ps-combat">
              <div className="ps-combat-stats">
                <div className="ps-combat-item">
                  <label>Clase de Armadura</label>
                  <span className="ps-value-lg">{ac}</span>
                </div>
                <div className="ps-combat-item">
                  <label>Iniciativa</label>
                  <span className="ps-value-lg">{initiative >= 0 ? '+' : ''}{initiative}</span>
                </div>
                <div className="ps-combat-item">
                  <label>Velocidad</label>
                  <span className="ps-value-lg">{speed}</span>
                </div>
              </div>
              <div className="ps-vida-section">
                <div className="ps-vida-title">Puntos de Golpe</div>
                <div className="ps-vida-row">
                  <span>Máximo</span><span className="ps-underline">{stats.maxHP || 1}</span>
                </div>
                <div className="ps-vida-row">
                  <span>Actuales</span><span className="ps-underline">{stats.currHP || 0}</span>
                </div>
                <div className="ps-vida-row">
                  <span>Temporales</span><span className="ps-underline">{stats.tempHP || 0}</span>
                </div>
              </div>
              <div className="ps-dados-section">
                <div className="ps-dados-title">Dados de Golpe</div>
                <div className="ps-dados-row">
                  <span>Total</span><span className="ps-underline">{character?.level || 1}d{hitDie}</span>
                </div>
                <div className="ps-dados-row">
                  <span>Usados</span><span className="ps-underline">{stats.hitDiceUsed || 0}</span>
                </div>
                <div className="ps-dados-row">
                  <span>Disponibles</span><span className="ps-underline">{(character?.level || 1) - (stats.hitDiceUsed || 0)}</span>
                </div>
              </div>
              <div className="ps-muerte-section">
                <div className="ps-muerte-title">Tiradas de Muerte</div>
                <div className="ps-muerte-row">
                  <span>Éxitos</span>
                  <span className="ps-check-dots">☐ ☐ ☐</span>
                </div>
                <div className="ps-muerte-row">
                  <span>Fallos</span>
                  <span className="ps-check-dots">☐ ☐ ☐</span>
                </div>
              </div>
              <div className="ps-otros-section">
                <div className="ps-otros-title">Otros</div>
                <div className="ps-otros-row">
                  <span>Objetos Atunados</span><span className="ps-underline">{Array.isArray(stats.attunedItems) ? stats.attunedItems.length : 0} / 3</span>
                </div>
              </div>
            </div>

            {/* BOTTOM: Attacks + Armor */}
            <div className="ps-attacks">
              <div className="ps-attacks-header">Ataques y Lanzamiento de Conjuros</div>
              <div className="ps-attacks-table">
                <div className="ps-attack-row ps-attack-header">
                  <span>Nombre</span>
                  <span>Bonif. Ataque</span>
                  <span>Daño / Tipo</span>
                </div>
                <div className="ps-attack-row">
                  <span>Ataque sin Armas</span>
                  <span>{mod(stats.STR) >= 0 ? '+' : ''}{mod(stats.STR)}</span>
                  <span>1 + {mod(stats.STR)} contundente</span>
                </div>
                {weapons.map((w, i) => {
                  const isFinesse = (w.properties || []).some(p => p?.index === 'finesse' || p?.name?.toLowerCase().includes('sutil'));
                  const isRanged = w.weapon_range === 'Ranged';
                  const baseStat = isRanged ? 'DEX' : (isFinesse ? (stats.DEX > stats.STR ? 'DEX' : 'STR') : 'STR');
                  const atkMod = mod(stats[baseStat]) + profBonus;
                  const dmgMod = mod(stats[baseStat]);
                  return (
                    <div key={i} className="ps-attack-row">
                      <span>{w.name}</span>
                      <span>{atkMod >= 0 ? '+' : ''}{atkMod}</span>
                      <span>{w.damage_dice || '1'}{dmgMod >= 0 ? '+' : ''}{dmgMod} {w.damage_type?.name || w.damage_type || ''}</span>
                    </div>
                  );
                })}
                {armor.length > 0 && (
                  <div className="ps-attack-divider">Armadura Equipada</div>
                )}
                {armor.map((a, i) => (
                  <div key={i} className="ps-attack-row">
                    <span>{a.name}</span>
                    <span>CA {a.armor_class_base || 10}{a.armor_class_dex_bonus ? ' (+DES)' : ''}</span>
                    <span>{a.stealth_disadvantage ? 'Sigilo Desv.' : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ───── PAGE 2: Equipment, Features, Personality, Notes ───── */}
        <div className="print-page">
          <div className="ps-page2-grid">
            <div className="ps-rasgos">
              <div className="ps-rasgos-label">Rasgos de Personalidad</div>
              <div className="ps-rasgos-content">{character?.personality || ''}</div>
            </div>
            <div className="ps-rasgos">
              <div className="ps-rasgos-label">Ideales</div>
              <div className="ps-rasgos-content">{character?.ideals || ''}</div>
            </div>
            <div className="ps-rasgos">
              <div className="ps-rasgos-label">Vínculos</div>
              <div className="ps-rasgos-content">{character?.bonds || ''}</div>
            </div>
            <div className="ps-rasgos">
              <div className="ps-rasgos-label">Defectos</div>
              <div className="ps-rasgos-content">{character?.flaws || ''}</div>
            </div>

            <div className="ps-equipment-block">
              <div className="ps-block-title">Equipo</div>
              <div className="ps-equipment-inner">
                <div className="ps-equipment-list">
                  {equipment.map((eq, i) => (
                    <div key={i} className="ps-eq-item">{eq.name || eq}</div>
                  ))}
                </div>
                <div className="ps-moneda-box">
                  <div className="ps-moneda-title">Monedas</div>
                  <div className="ps-moneda-grid">
                    <div className="ps-moneda-row"><span className="ps-coin-icon">pp</span><span className="ps-coin-val">{parseCoins(stats.coins).pp || 0}</span></div>
                    <div className="ps-moneda-row"><span className="ps-coin-icon">gp</span><span className="ps-coin-val">{parseCoins(stats.coins).gp || 0}</span></div>
                    <div className="ps-moneda-row"><span className="ps-coin-icon">ep</span><span className="ps-coin-val">{parseCoins(stats.coins).ep || 0}</span></div>
                    <div className="ps-moneda-row"><span className="ps-coin-icon">sp</span><span className="ps-coin-val">{parseCoins(stats.coins).sp || 0}</span></div>
                    <div className="ps-moneda-row"><span className="ps-coin-icon">cp</span><span className="ps-coin-val">{parseCoins(stats.coins).cp || 0}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ps-features-block">
              <div className="ps-block-title">Características y Rasgos</div>
              <div className="ps-features-text">
                {character?.features ? (
                  Array.isArray(character.features) ? character.features.join(', ') : character.features
                ) : ''}
              </div>
            </div>

            <div className="ps-notes-block">
              <div className="ps-block-title">Notas</div>
              <div className="ps-notes-text">{character?.notes || ''}</div>
            </div>
          </div>
        </div>

        {/* ───── PAGE 3: Spellcasting ───── */}
        <div className="print-page">
          <div className="ps-spell-header">
            <div className="ps-spell-field"><label>Clase Conjuro</label><span>{className}</span></div>
            <div className="ps-spell-field"><label>Habilidad de Conjuración</label><span>{spellAbility || '—'}</span></div>
            <div className="ps-spell-field"><label>CD de Salvación</label><span>{saveDC || '—'}</span></div>
            <div className="ps-spell-field"><label>Bonif. Ataque</label><span>{spellAtk || '—'}</span></div>
          </div>

          <div className="ps-spell-section">
            <div className="ps-spell-section-title">Trucos (Nivel 0)</div>
            <div className="ps-spell-list">
              {(knownSpells || []).filter(s => s.level === 0).map((sp, i) => (
                <div key={i} className="ps-spell-entry">{sp.name}</div>
              ))}
            </div>
          </div>

          {[1,2,3,4,5,6,7,8,9].map(lvl => {
            const slot = (stats.spellSlots || {})[lvl] || { max: 0, used: 0 };
            const lvlSpells = knownByLevel?.[lvl] || [];
            if (slot.max === 0 && lvlSpells.length === 0) return null;
            return (
              <div key={lvl} className="ps-spell-section">
                <div className="ps-spell-section-title">
                  <span>Nivel {lvl}</span>
                  <span className="ps-spell-slots">Espacios: {slot.used}/{slot.max}</span>
                </div>
                <div className="ps-spell-list">
                  {lvlSpells.map((sp, i) => (
                    <div key={i} className="ps-spell-entry">{sp.name}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
