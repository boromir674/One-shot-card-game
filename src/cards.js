const definitions = {
  strike: { name: 'Strike', type: 'attack', rarity: 'starter', cost: 1, target: 'enemy', tags: ['attack'], effects: [{ type: 'damage', amount: 6 }], description: 'Deal 6 damage.', upgrades: { effects: [{ type: 'damage', amount: 9 }], description: 'Deal 9 damage.' } },
  bash: { name: 'Bash', type: 'attack', rarity: 'starter', cost: 2, target: 'enemy', tags: ['attack'], effects: [{ type: 'damage', amount: 8 }, { type: 'debuff', status: 'vulnerable', amount: 2 }], description: 'Deal 8 damage. Apply 2 Vulnerable.', upgrades: { effects: [{ type: 'damage', amount: 10 }, { type: 'debuff', status: 'vulnerable', amount: 3 }], description: 'Deal 10 damage. Apply 3 Vulnerable.' } },
  pommelStrike: { name: 'Pommel Strike', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', tags: ['attack'], effects: [{ type: 'damage', amount: 9 }, { type: 'draw', amount: 1 }], description: 'Deal 9 damage. Draw 1 card.', upgrades: { effects: [{ type: 'damage', amount: 10 }, { type: 'draw', amount: 2 }], description: 'Deal 10 damage. Draw 2 cards.' } },
  cleave: { name: 'Cleave', type: 'attack', rarity: 'common', cost: 1, target: 'allEnemies', tags: ['attack'], effects: [{ type: 'damageAll', amount: 8 }], description: 'Deal 8 damage to ALL enemies.', upgrades: { effects: [{ type: 'damageAll', amount: 11 }], description: 'Deal 11 damage to ALL enemies.' } },
  ironWave: { name: 'Iron Wave', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', tags: ['attack'], effects: [{ type: 'block', amount: 5 }, { type: 'damage', amount: 5 }], description: 'Gain 5 Block. Deal 5 damage.', upgrades: { effects: [{ type: 'block', amount: 7 }, { type: 'damage', amount: 7 }], description: 'Gain 7 Block. Deal 7 damage.' } },
  wildStrike: { name: 'Wild Strike', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', tags: ['attack'], effects: [{ type: 'damage', amount: 12 }, { type: 'addStatus', card: 'wound', destination: 'discard', amount: 1 }], description: 'Deal 12 damage. Shuffle a Wound into your discard pile.', upgrades: { effects: [{ type: 'damage', amount: 17 }, { type: 'addStatus', card: 'wound', destination: 'discard', amount: 1 }], description: 'Deal 17 damage. Shuffle a Wound into your discard pile.' } },
  headbutt: { name: 'Headbutt', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', tags: ['attack'], effects: [{ type: 'damage', amount: 9 }, { type: 'headbuttRecover' }], description: 'Deal 9 damage. Put an attack from your discard pile on top of your draw pile.', upgrades: { effects: [{ type: 'damage', amount: 12 }, { type: 'headbuttRecover' }], description: 'Deal 12 damage. Put an attack from your discard pile on top of your draw pile.' } },
  thunderclap: { name: 'Thunderclap', type: 'attack', rarity: 'common', cost: 1, target: 'allEnemies', tags: ['attack'], effects: [{ type: 'damageAll', amount: 4 }, { type: 'debuffAll', status: 'vulnerable', amount: 1 }], description: 'Deal 4 damage and apply 1 Vulnerable to ALL enemies.', upgrades: { effects: [{ type: 'damageAll', amount: 7 }, { type: 'debuffAll', status: 'vulnerable', amount: 1 }], description: 'Deal 7 damage and apply 1 Vulnerable to ALL enemies.' } },
  searingBlow: { name: 'Searing Blow', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy', tags: ['attack'], effects: [{ type: 'damage', amount: 12 }], description: 'Deal 12 damage.', upgrades: { effects: [{ type: 'damage', amount: 20 }], description: 'Deal 20 damage.' } },
  twinStrike: { name: 'Twin Strike', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', tags: ['attack'], effects: [{ type: 'multiDamage', hits: 2, amount: 5 }], description: 'Deal 5 damage twice.', upgrades: { effects: [{ type: 'multiDamage', hits: 2, amount: 7 }], description: 'Deal 7 damage twice.' } },
  clothesline: { name: 'Clothesline', type: 'attack', rarity: 'common', cost: 2, target: 'enemy', tags: ['attack'], effects: [{ type: 'damage', amount: 12 }, { type: 'debuff', status: 'weak', amount: 2 }], description: 'Deal 12 damage. Apply 2 Weak.', upgrades: { effects: [{ type: 'damage', amount: 14 }, { type: 'debuff', status: 'weak', amount: 3 }], description: 'Deal 14 damage. Apply 3 Weak.' } },
  uppercut: { name: 'Uppercut', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy', tags: ['attack'], effects: [{ type: 'damage', amount: 13 }, { type: 'debuff', status: 'weak', amount: 1 }, { type: 'debuff', status: 'vulnerable', amount: 1 }], description: 'Deal 13 damage. Apply 1 Weak and 1 Vulnerable.', upgrades: { effects: [{ type: 'damage', amount: 16 }, { type: 'debuff', status: 'weak', amount: 2 }, { type: 'debuff', status: 'vulnerable', amount: 2 }], description: 'Deal 16 damage. Apply 2 Weak and 2 Vulnerable.' } },
  whirlwind: { name: 'Whirlwind', type: 'attack', rarity: 'uncommon', cost: 'X', target: 'allEnemies', tags: ['attack'], effects: [{ type: 'xDamageAll', amount: 5 }], description: 'Deal 5 damage to ALL enemies for each Energy spent.', upgrades: { effects: [{ type: 'xDamageAll', amount: 8 }], description: 'Deal 8 damage to ALL enemies for each Energy spent.' } },
  bludgeon: { name: 'Bludgeon', type: 'attack', rarity: 'rare', cost: 3, target: 'enemy', tags: ['attack'], effects: [{ type: 'damage', amount: 32 }], description: 'Deal 32 damage.', upgrades: { effects: [{ type: 'damage', amount: 42 }], description: 'Deal 42 damage.' } },
  immolate: { name: 'Immolate', type: 'attack', rarity: 'rare', cost: 2, target: 'allEnemies', tags: ['attack', 'fire'], effects: [{ type: 'damageAll', amount: 21 }, { type: 'addStatus', card: 'burn', destination: 'discard', amount: 2 }], description: 'Deal 21 damage to ALL enemies. Add 2 Burns into your discard pile.', upgrades: { effects: [{ type: 'damageAll', amount: 28 }, { type: 'addStatus', card: 'burn', destination: 'discard', amount: 2 }], description: 'Deal 28 damage to ALL enemies. Add 2 Burns into your discard pile.' } },
  defend: { name: 'Defend', type: 'skill', rarity: 'starter', cost: 1, target: 'self', tags: ['skill'], effects: [{ type: 'block', amount: 5 }], description: 'Gain 5 Block.', upgrades: { effects: [{ type: 'block', amount: 8 }], description: 'Gain 8 Block.' } },
  shrugItOff: { name: 'Shrug It Off', type: 'skill', rarity: 'common', cost: 1, target: 'self', tags: ['skill'], effects: [{ type: 'block', amount: 8 }, { type: 'draw', amount: 1 }], description: 'Gain 8 Block. Draw 1 card.', upgrades: { effects: [{ type: 'block', amount: 11 }, { type: 'draw', amount: 1 }], description: 'Gain 11 Block. Draw 1 card.' } },
  armaments: { name: 'Armaments', type: 'skill', rarity: 'common', cost: 1, target: 'self', tags: ['skill'], effects: [{ type: 'block', amount: 5 }, { type: 'upgradeHand', amount: 1 }], description: 'Gain 5 Block. Upgrade a card in your hand.', upgrades: { effects: [{ type: 'block', amount: 5 }, { type: 'upgradeHand', amount: 99 }], description: 'Gain 5 Block. Upgrade ALL cards in your hand.' } },
  flex: { name: 'Flex', type: 'skill', rarity: 'common', cost: 0, target: 'self', tags: ['skill'], effects: [{ type: 'tempStrength', amount: 2 }], description: 'Gain 2 Strength this turn.', upgrades: { effects: [{ type: 'tempStrength', amount: 4 }], description: 'Gain 4 Strength this turn.' } },
  havoc: { name: 'Havoc', type: 'skill', rarity: 'common', cost: 1, target: 'self', tags: ['skill'], effects: [{ type: 'havoc' }], description: 'Play the top card of your draw pile. Exhaust it.', upgrades: { cost: 0, effects: [{ type: 'havoc' }], description: 'Play the top card of your draw pile. Exhaust it.' } },
  trueGrit: { name: 'True Grit', type: 'skill', rarity: 'common', cost: 1, target: 'self', tags: ['skill'], exhaust: false, effects: [{ type: 'block', amount: 7 }, { type: 'exhaustFromHand', amount: 1 }], description: 'Gain 7 Block. Exhaust a card from your hand.', upgrades: { effects: [{ type: 'block', amount: 9 }, { type: 'chooseExhaustFromHand', amount: 1 }], description: 'Gain 9 Block. Choose a card in your hand to Exhaust.' } },
  warcry: { name: 'Warcry', type: 'skill', rarity: 'common', cost: 0, target: 'self', tags: ['skill'], effects: [{ type: 'draw', amount: 1 }, { type: 'topdeckFromHand', amount: 1 }], description: 'Draw 1 card. Put a card from your hand on top of your draw pile.', upgrades: { effects: [{ type: 'draw', amount: 2 }, { type: 'topdeckFromHand', amount: 1 }], description: 'Draw 2 cards. Put a card from your hand on top of your draw pile.' } },
  rage: { name: 'Rage', type: 'skill', rarity: 'uncommon', cost: 0, target: 'self', tags: ['skill'], effects: [{ type: 'powerBuff', power: 'rage', amount: 3 }], description: 'Whenever you play an Attack this turn, gain 3 Block.', upgrades: { effects: [{ type: 'powerBuff', power: 'rage', amount: 5 }], description: 'Whenever you play an Attack this turn, gain 5 Block.' } },
  infernalBlade: { name: 'Infernal Blade', type: 'skill', rarity: 'uncommon', cost: 1, target: 'self', tags: ['skill'], effects: [{ type: 'infernalBlade' }], description: 'Add a random Attack into your hand. It costs 0 this turn.', upgrades: { cost: 0, effects: [{ type: 'infernalBlade' }], description: 'Add a random Attack into your hand. It costs 0 this turn.' } },
  disarm: { name: 'Disarm', type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy', tags: ['skill'], effects: [{ type: 'debuff', status: 'strength', amount: -2 }], description: 'Enemy loses 2 Strength.', upgrades: { exhaust: false, effects: [{ type: 'debuff', status: 'strength', amount: -3 }], description: 'Enemy loses 3 Strength.' } },
  entrench: { name: 'Entrench', type: 'skill', rarity: 'uncommon', cost: 2, target: 'self', tags: ['skill'], effects: [{ type: 'entrench' }], description: 'Double your Block.', upgrades: { cost: 1, effects: [{ type: 'entrench' }], description: 'Double your Block.' } },
  impervious: { name: 'Impervious', type: 'skill', rarity: 'rare', cost: 2, target: 'self', tags: ['skill'], exhaust: true, effects: [{ type: 'block', amount: 30 }], description: 'Gain 30 Block. Exhaust.', upgrades: { effects: [{ type: 'block', amount: 40 }], description: 'Gain 40 Block. Exhaust.' } },
  intimidate: { name: 'Intimidate', type: 'skill', rarity: 'uncommon', cost: 0, target: 'allEnemies', tags: ['skill'], exhaust: true, effects: [{ type: 'debuffAll', status: 'weak', amount: 1 }], description: 'Apply 1 Weak to ALL enemies. Exhaust.', upgrades: { effects: [{ type: 'debuffAll', status: 'weak', amount: 2 }], description: 'Apply 2 Weak to ALL enemies. Exhaust.' } },
  bloodletting: { name: 'Bloodletting', type: 'skill', rarity: 'uncommon', cost: 0, target: 'self', tags: ['skill'], effects: [{ type: 'loseHp', amount: 3 }, { type: 'gainEnergy', amount: 2 }], description: 'Lose 3 HP. Gain 2 Energy.', upgrades: { effects: [{ type: 'loseHp', amount: 2 }, { type: 'gainEnergy', amount: 3 }], description: 'Lose 2 HP. Gain 3 Energy.' } },
  metallicize: { name: 'Metallicize', type: 'power', rarity: 'uncommon', cost: 1, target: 'self', tags: ['power'], effects: [{ type: 'powerBuff', power: 'metallicize', amount: 3 }], description: 'At the end of your turn, gain 3 Block.', upgrades: { effects: [{ type: 'powerBuff', power: 'metallicize', amount: 4 }], description: 'At the end of your turn, gain 4 Block.' } },
  juggernaut: { name: 'Juggernaut', type: 'power', rarity: 'rare', cost: 2, target: 'self', tags: ['power'], effects: [{ type: 'powerBuff', power: 'juggernaut', amount: 5 }], description: 'Whenever you gain Block, deal 5 damage to a random enemy.', upgrades: { effects: [{ type: 'powerBuff', power: 'juggernaut', amount: 7 }], description: 'Whenever you gain Block, deal 7 damage to a random enemy.' } },
  barricade: { name: 'Barricade', type: 'power', rarity: 'rare', cost: 3, target: 'self', tags: ['power'], effects: [{ type: 'powerToggle', power: 'barricade' }], description: 'Block is not removed at the start of your turn.', upgrades: { cost: 2, effects: [{ type: 'powerToggle', power: 'barricade' }], description: 'Block is not removed at the start of your turn.' } },
  demonForm: { name: 'Demon Form', type: 'power', rarity: 'rare', cost: 3, target: 'self', tags: ['power'], effects: [{ type: 'powerBuff', power: 'demonForm', amount: 2 }], description: 'At the start of each turn, gain 2 Strength.', upgrades: { cost: 2, effects: [{ type: 'powerBuff', power: 'demonForm', amount: 3 }], description: 'At the start of each turn, gain 3 Strength.' } },
  evolve: { name: 'Evolve', type: 'power', rarity: 'uncommon', cost: 1, target: 'self', tags: ['power'], effects: [{ type: 'powerBuff', power: 'evolve', amount: 1 }], description: 'Whenever you draw a Status, draw 1 card.', upgrades: { effects: [{ type: 'powerBuff', power: 'evolve', amount: 2 }], description: 'Whenever you draw a Status, draw 2 cards.' } },
  rupture: { name: 'Rupture', type: 'power', rarity: 'uncommon', cost: 1, target: 'self', tags: ['power'], effects: [{ type: 'powerBuff', power: 'rupture', amount: 1 }], description: 'Whenever you lose HP from a card, gain 1 Strength.', upgrades: { effects: [{ type: 'powerBuff', power: 'rupture', amount: 2 }], description: 'Whenever you lose HP from a card, gain 2 Strength.' } },
  brutality: { name: 'Brutality', type: 'power', rarity: 'rare', cost: 1, target: 'self', tags: ['power'], effects: [{ type: 'powerToggle', power: 'brutality' }], description: 'At the start of your turn, lose 1 HP and draw 1 card.', upgrades: { description: 'Innate. At the start of your turn, lose 1 HP and draw 1 card.', innate: true, effects: [{ type: 'powerToggle', power: 'brutality' }] } },
  darkEmbrace: { name: 'Dark Embrace', type: 'power', rarity: 'rare', cost: 2, target: 'self', tags: ['power'], effects: [{ type: 'powerToggle', power: 'darkEmbrace' }], description: 'Whenever a card is Exhausted, draw 1 card.', upgrades: { cost: 1, description: 'Whenever a card is Exhausted, draw 1 card.', effects: [{ type: 'powerToggle', power: 'darkEmbrace' }] } },
  feelNoPain: { name: 'Feel No Pain', type: 'power', rarity: 'uncommon', cost: 1, target: 'self', tags: ['power'], effects: [{ type: 'powerBuff', power: 'feelNoPain', amount: 3 }], description: 'Whenever a card is Exhausted, gain 3 Block.', upgrades: { effects: [{ type: 'powerBuff', power: 'feelNoPain', amount: 4 }], description: 'Whenever a card is Exhausted, gain 4 Block.' } },
  combust: { name: 'Combust', type: 'power', rarity: 'uncommon', cost: 1, target: 'self', tags: ['power', 'fire'], effects: [{ type: 'powerBuff', power: 'combust', amount: 5 }, { type: 'powerBuff', power: 'combustSelf', amount: 1 }], description: 'At the end of your turn, lose 1 HP and deal 5 damage to ALL enemies.', upgrades: { effects: [{ type: 'powerBuff', power: 'combust', amount: 7 }, { type: 'powerBuff', power: 'combustSelf', amount: 1 }], description: 'At the end of your turn, lose 1 HP and deal 7 damage to ALL enemies.' } },
  fireBreathing: { name: 'Fire Breathing', type: 'power', rarity: 'uncommon', cost: 1, target: 'self', tags: ['power', 'fire'], effects: [{ type: 'powerBuff', power: 'fireBreathing', amount: 6 }], description: 'Whenever you draw a Status, deal 6 damage to ALL enemies.', upgrades: { effects: [{ type: 'powerBuff', power: 'fireBreathing', amount: 10 }], description: 'Whenever you draw a Status, deal 10 damage to ALL enemies.' } },
  inflame: { name: 'Inflame', type: 'power', rarity: 'uncommon', cost: 1, target: 'self', tags: ['power'], effects: [{ type: 'strength', amount: 2 }], description: 'Gain 2 Strength.', upgrades: { effects: [{ type: 'strength', amount: 3 }], description: 'Gain 3 Strength.' } },
  corruption: { name: 'Corruption', type: 'power', rarity: 'rare', cost: 3, target: 'self', tags: ['power'], effects: [{ type: 'powerToggle', power: 'corruption' }], description: 'Skills cost 0. Whenever you play a Skill, Exhaust it.', upgrades: { cost: 2, effects: [{ type: 'powerToggle', power: 'corruption' }], description: 'Skills cost 0. Whenever you play a Skill, Exhaust it.' } },
  spotWeakness: { name: 'Spot Weakness', type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy', tags: ['skill'], effects: [{ type: 'spotWeakness', amount: 3 }], description: 'If the enemy intends to attack, gain 3 Strength.', upgrades: { effects: [{ type: 'spotWeakness', amount: 4 }], description: 'If the enemy intends to attack, gain 4 Strength.' } },
  battleTrance: { name: 'Battle Trance', type: 'skill', rarity: 'uncommon', cost: 0, target: 'self', tags: ['skill'], effects: [{ type: 'draw', amount: 2 }, { type: 'noDraw' }], description: 'Draw 2 cards. You cannot draw additional cards this turn.', upgrades: { effects: [{ type: 'draw', amount: 3 }, { type: 'noDraw' }], description: 'Draw 3 cards. You cannot draw additional cards this turn.' } },
  berserk: { name: 'Berserk', type: 'power', rarity: 'rare', cost: 1, target: 'self', tags: ['power'], effects: [{ type: 'powerToggle', power: 'berserk' }, { type: 'gainEnergyIfVulnerable', amount: 1 }], description: 'If you have Vulnerable, gain 1 Energy. While Vulnerable, gain 1 Energy at the start of your turn.', upgrades: { cost: 0, effects: [{ type: 'powerToggle', power: 'berserk' }, { type: 'gainEnergyIfVulnerable', amount: 1 }], description: 'If you have Vulnerable, gain 1 Energy. While Vulnerable, gain 1 Energy at the start of your turn.' } },
  burn: { name: 'Burn', type: 'status', rarity: 'status', cost: 99, target: 'none', tags: ['status'], unplayable: true, burn: 2, description: 'Unplayable. At end of turn, take 2 damage if this is in your hand.' },
  wound: { name: 'Wound', type: 'status', rarity: 'status', cost: 99, target: 'none', tags: ['status'], unplayable: true, description: 'Unplayable.' },
  dazed: { name: 'Dazed', type: 'status', rarity: 'status', cost: 99, target: 'none', tags: ['status'], unplayable: true, ethereal: true, description: 'Unplayable. Ethereal.' }
};

export const RELIC_DEFS = {
  burningBlood: { name: 'Burning Blood', icon: '🩸', description: 'Heal 6 HP after combat.', rarity: 'starter' },
  ringOfTheSnake: { name: 'Ring of the Snake', icon: '🐍', description: 'At the start of combat, draw 2 additional cards.', rarity: 'boss' },
  vajra: { name: 'Vajra', icon: '🗡️', description: 'Gain 1 Strength at the start of combat.', rarity: 'common' },
  orichalcum: { name: 'Orichalcum', icon: '🛡️', description: 'At end of turn, if you have no Block, gain 6 Block.', rarity: 'common' },
  paperFrog: { name: 'Paper Frog', icon: '🐸', description: 'Gain 40% more Block from cards and effects.', rarity: 'uncommon' },
  stoneCalendar: { name: 'Stone Calendar', icon: '🪨', description: 'At the end of turn 7, deal 52 damage to ALL enemies.', rarity: 'rare' },
  anchor: { name: 'Anchor', icon: '⚓', description: 'Start each combat with 10 Block.', rarity: 'common' },
  lantern: { name: 'Lantern', icon: '🏮', description: 'The first combat of the act starts with 1 extra Energy.', rarity: 'common' },
  boot: { name: 'The Boot', icon: '🥾', description: 'Attacks that would deal less than 5 unblocked damage deal 5 instead.', rarity: 'uncommon' },
  toyOrnithopter: { name: 'Toy Ornithopter', icon: '🕊️', description: 'Whenever you use a potion, gain 5 Block.', rarity: 'common' }
};

const rewardPool = Object.keys(definitions).filter((key) => !['status', 'starter'].includes(definitions[key].rarity));
const shopPool = rewardPool.filter((key) => definitions[key].type !== 'status');
const attackPool = rewardPool.filter((key) => definitions[key].tags?.includes('attack'));
const relicPool = Object.keys(RELIC_DEFS).filter((key) => key !== 'burningBlood');

export function createCard(key, upgraded = false) {
  const base = definitions[key];
  if (!base) throw new Error(`Unknown card: ${key}`);
  const patch = upgraded && base.upgrades ? base.upgrades : {};
  return {
    key,
    instanceId: `${key}-${Math.random().toString(36).slice(2, 11)}`,
    name: `${base.name}${upgraded ? '+' : ''}`,
    type: patch.type ?? base.type,
    rarity: patch.rarity ?? base.rarity,
    cost: patch.cost ?? base.cost,
    target: patch.target ?? base.target,
    tags: [...(patch.tags ?? base.tags ?? [])],
    description: patch.description ?? base.description,
    effects: JSON.parse(JSON.stringify(patch.effects ?? base.effects ?? [])),
    upgraded,
    exhaust: patch.exhaust ?? base.exhaust ?? false,
    ethereal: patch.ethereal ?? base.ethereal ?? false,
    innate: patch.innate ?? base.innate ?? false,
    unplayable: patch.unplayable ?? base.unplayable ?? false,
    burn: patch.burn ?? base.burn ?? 0,
    temporaryCost: null,
    generated: false
  };
}

export function cloneCard(card) {
  const copy = createCard(card.key, card.upgraded);
  copy.instanceId = `${card.key}-${Math.random().toString(36).slice(2, 11)}`;
  copy.temporaryCost = card.temporaryCost;
  copy.generated = card.generated ?? false;
  return copy;
}

export function upgradeCard(card) {
  if (card.upgraded || !definitions[card.key]?.upgrades) return card;
  const upgraded = createCard(card.key, true);
  upgraded.instanceId = card.instanceId;
  upgraded.temporaryCost = card.temporaryCost;
  upgraded.generated = card.generated ?? false;
  return upgraded;
}

export function getCardCost(card, player) {
  if (card.temporaryCost !== null) return card.temporaryCost;
  if (player?.powers?.corruption && card.type === 'skill') return 0;
  return card.cost;
}

export function getStarterDeck() {
  return [
    createCard('strike'), createCard('strike'), createCard('strike'), createCard('strike'), createCard('strike'),
    createCard('defend'), createCard('defend'), createCard('defend'), createCard('defend'),
    createCard('bash')
  ];
}

export function getRewardChoices(count = 3) {
  return getRandomUniqueCards(rewardPool, count);
}

export function getShopCards(count = 3) {
  return getRandomUniqueCards(shopPool, count);
}

export function getRandomAttack() {
  return createCard(attackPool[Math.floor(Math.random() * attackPool.length)]);
}

export function getRandomRelics(count = 2, owned = []) {
  const available = relicPool.filter((key) => !owned.includes(key));
  return shuffle([...available]).slice(0, count).map((key) => ({ key, ...RELIC_DEFS[key] }));
}

export function getCardPrice(card) {
  return ({ common: 60, uncommon: 90, rare: 140, starter: 50, status: 999 }[card.rarity] ?? 80);
}

export function getRewardPoolKeys() {
  return [...rewardPool];
}

export function getCardDefinition(key) {
  return definitions[key];
}

function getRandomUniqueCards(pool, count) {
  return shuffle([...pool]).slice(0, count).map((key) => createCard(key));
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
