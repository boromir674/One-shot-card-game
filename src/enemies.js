function enemy(template) {
  return {
    id: `${template.key}-${Math.random().toString(36).slice(2, 10)}`,
    ...template,
    hp: template.maxHp,
    block: 0,
    statuses: { vulnerable: 0, weak: 0 },
    strength: template.strength ?? 0,
    dexterity: template.dexterity ?? 0,
    turn: 0,
    sleeping: template.sleeping ?? false,
    asleepTurns: template.asleepTurns ?? 0,
    ritual: template.ritual ?? 0,
    damageTakenThisMode: 0,
    mode: template.mode ?? 'attack',
    intent: null,
    lastIntentKey: null
  };
}

const templates = {
  cultist: {
    key: 'cultist', name: 'Cultist', maxHp: 52, icon: '🦅', flavor: 'CAW! CAW!',
    getIntent(self) {
      if (self.turn === 0) return { key: 'ritual', type: 'buff', text: 'Ritual +3 STR', action: { type: 'buffSelf', strength: 3, ritual: 1 } };
      return { key: 'darkStrike', type: 'attack', value: 6 + self.strength, text: `${6 + self.strength} Attack`, action: { type: 'attack', damage: 6 } };
    }
  },
  jawWorm: {
    key: 'jawWorm', name: 'Jaw Worm', maxHp: 44, icon: '🪱',
    getIntent(self) {
      const pattern = ['chomp', 'thrash', 'bellow'];
      const pick = pattern[self.turn % pattern.length];
      if (pick === 'chomp') return { key: 'chomp', type: 'attack', value: 11 + self.strength, text: `${11 + self.strength} Chomp`, action: { type: 'attack', damage: 11 } };
      if (pick === 'thrash') return { key: 'thrash', type: 'attackDefend', value: 7 + self.strength, text: `${7 + self.strength} + 5 Block`, action: { type: 'attackBlock', damage: 7, block: 5 } };
      return { key: 'bellow', type: 'buff', text: '+3 STR +6 Block', action: { type: 'buffBlock', strength: 3, block: 6 } };
    }
  },
  redLouse: {
    key: 'redLouse', name: 'Red Louse', maxHp: 15, icon: '🕷️',
    getIntent(self) {
      const bite = 5 + (self.turn % 3);
      if (self.turn % 2 === 0) return { key: 'bite', type: 'attack', value: bite + self.strength, text: `${bite + self.strength} Bite`, action: { type: 'attack', damage: bite } };
      return { key: 'grow', type: 'buff', text: '+3 STR', action: { type: 'buffSelf', strength: 3 } };
    }
  },
  greenLouse: {
    key: 'greenLouse', name: 'Green Louse', maxHp: 17, icon: '🐛',
    getIntent(self) {
      if (self.turn % 2 === 0) return { key: 'bite', type: 'attack', value: 7 + self.strength, text: `${7 + self.strength} Bite`, action: { type: 'attack', damage: 7 } };
      return { key: 'grow', type: 'buff', text: '+3 STR', action: { type: 'buffSelf', strength: 3 } };
    }
  },
  madGremlin: {
    key: 'madGremlin', name: 'Mad Gremlin', maxHp: 22, icon: '👹',
    getIntent(self) {
      return { key: 'scratch', type: 'attack', value: 5 + self.strength, text: `${5 + self.strength} Scratch`, action: { type: 'attack', damage: 5 } };
    }
  },
  sneakyGremlin: {
    key: 'sneakyGremlin', name: 'Sneaky Gremlin', maxHp: 20, icon: '🗡️',
    getIntent(self) {
      return { key: 'shiv', type: 'attack', value: 9 + self.strength, text: `${9 + self.strength} Shiv`, action: { type: 'attack', damage: 9 } };
    }
  },
  fatGremlin: {
    key: 'fatGremlin', name: 'Fat Gremlin', maxHp: 28, icon: '🧿',
    getIntent(self) {
      if (self.turn % 2 === 0) return { key: 'smash', type: 'attack', value: 4 + self.strength, text: `${4 + self.strength} Smash`, action: { type: 'attack', damage: 4 } };
      return { key: 'weaken', type: 'debuff', text: '3 Weak', action: { type: 'applyPlayerStatus', status: 'weak', amount: 2 } };
    }
  },
  shieldGremlin: {
    key: 'shieldGremlin', name: 'Shield Gremlin', maxHp: 25, icon: '🛡️',
    getIntent(self) {
      return { key: 'guard', type: 'defend', text: '+8 Block team', action: { type: 'teamBlock', block: 8 } };
    }
  },
  blueSlaver: {
    key: 'blueSlaver', name: 'Blue Slaver', maxHp: 48, icon: '🔵',
    getIntent(self) {
      if (self.turn % 3 === 1) return { key: 'rake', type: 'attackDebuff', value: 7 + self.strength, text: `${7 + self.strength} + 2 Weak`, action: { type: 'attackStatus', damage: 7, status: 'weak', amount: 2 } };
      return { key: 'stab', type: 'attack', value: 13 + self.strength, text: `${13 + self.strength} Stab`, action: { type: 'attack', damage: 13 } };
    }
  },
  redSlaver: {
    key: 'redSlaver', name: 'Red Slaver', maxHp: 50, icon: '🔴',
    getIntent(self) {
      if (self.turn === 1) return { key: 'entangle', type: 'debuff', text: 'Entangle', action: { type: 'entangle' } };
      return { key: 'stab', type: 'attack', value: 13 + self.strength, text: `${13 + self.strength} Stab`, action: { type: 'attack', damage: 13 } };
    }
  },
  lagavulin: {
    key: 'lagavulin', name: 'Lagavulin', maxHp: 112, icon: '🗿', sleeping: true, asleepTurns: 2,
    getIntent(self) {
      if (self.sleeping) return { key: 'sleep', type: 'sleep', text: 'Sleeping', action: { type: 'sleep' } };
      if (self.turn % 3 === 1) return { key: 'siphon', type: 'debuff', text: '-1 STR -1 DEX', action: { type: 'siphonSoul' } };
      return { key: 'slam', type: 'attack', value: 18 + self.strength, text: `${18 + self.strength} Slam`, action: { type: 'attack', damage: 18 } };
    }
  },
  sentry: {
    key: 'sentry', name: 'Sentry', maxHp: 42, icon: '🔶',
    getIntent(self) {
      if (self.turn % 2 === 0) return { key: 'beam', type: 'attack', value: 9 + self.strength, text: `${9 + self.strength} Beam`, action: { type: 'attack', damage: 9 } };
      return { key: 'bolt', type: 'defendDebuff', text: '+8 Block, 2 Dazed', action: { type: 'blockStatus', block: 8, statusCard: 'dazed', amount: 2 } };
    }
  },
  guardian: {
    key: 'guardian', name: 'The Guardian', maxHp: 240, icon: '👁️', mode: 'attack',
    getIntent(self) {
      if (self.mode === 'defense') {
        if (self.turn % 2 === 0) return { key: 'whirl', type: 'attack', value: 8 + self.strength, text: `${8 + self.strength} Twin Slam`, action: { type: 'multiAttack', hits: 2, damage: 8 } };
        return { key: 'reboot', type: 'defend', text: '+18 Block', action: { type: 'selfBlock', block: 18 } };
      }
      if (self.turn % 3 === 0) return { key: 'fierceBash', type: 'attack', value: 20 + self.strength, text: `${20 + self.strength} Fierce Bash`, action: { type: 'attack', damage: 20 } };
      if (self.turn % 3 === 1) return { key: 'ventSteam', type: 'debuff', text: '2 Vulnerable', action: { type: 'applyPlayerStatus', status: 'vulnerable', amount: 2 } };
      return { key: 'whirlwind', type: 'attack', value: 10 + self.strength, text: `${10 + self.strength} Spin`, action: { type: 'attack', damage: 10 } };
    }
  }
};

export function createEncounter(nodeType, floor = 1) {
  const elites = [
    [templates.lagavulin],
    [templates.sentry, templates.sentry],
    [templates.redSlaver, templates.blueSlaver]
  ];
  const regular = [
    [templates.cultist],
    [templates.jawWorm],
    [templates.redLouse, templates.greenLouse],
    [templates.madGremlin, templates.sneakyGremlin, templates.shieldGremlin],
    [templates.blueSlaver],
    [templates.redSlaver]
  ];
  if (nodeType === 'boss') return { name: 'Boss Battle', enemies: [enemy(templates.guardian)], elite: true, boss: true, rewardGold: 180 };
  if (nodeType === 'elite') {
    const pick = elites[Math.floor(Math.random() * elites.length)];
    return { name: 'Elite Encounter', enemies: pick.map(enemy), elite: true, rewardGold: 65 + floor * 4 };
  }
  const pick = regular[Math.floor(Math.random() * regular.length)];
  return { name: 'Combat', enemies: pick.map(enemy), elite: false, rewardGold: 22 + floor * 3 };
}

export function refreshEnemyIntents(enemies) {
  enemies.filter((enemy) => enemy.hp > 0).forEach((enemy) => {
    enemy.intent = enemy.getIntent(enemy);
  });
}
