import { CombatEngine } from './combat.js';
import { GameUI } from './ui.js';
import { createEncounter } from './enemies.js';
import { generateActMap, getNodeMeta } from './map.js';
import { RELIC_DEFS, cloneCard, createCard, getCardPrice, getRandomRelics, getRewardChoices, getShopCards, getStarterDeck, upgradeCard } from './cards.js';

class Player {
  constructor() {
    this.maxHp = 80;
    this.hp = 80;
    this.gold = 99;
    this.maxEnergy = 3;
    this.energy = 3;
    this.block = 0;
    this.strength = 0;
    this.dexterity = 0;
    this.tempStrength = 0;
    this.statuses = { vulnerable: 0, weak: 0 };
    this.powers = {};
    this.skillsDisabled = false;
    this.noDrawThisTurn = false;
    this.rageThisTurn = 0;
    this.masterDeck = getStarterDeck();
    this.relics = ['burningBlood'];
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.potion = { name: 'Iron Brew', icon: '🧪', type: 'block', amount: 12 };
  }

  hasRelic(key) {
    return this.relics.includes(key);
  }

  gainBlock(amount, game, triggerJuggernaut = true) {
    const scaled = Math.round(amount * (this.hasRelic('paperFrog') ? 1.4 : 1) + this.dexterity);
    const final = Math.max(0, scaled);
    this.block += final;
    if (triggerJuggernaut && this.powers.juggernaut && game?.combat) {
      const targets = game.combat.enemies.filter((enemy) => enemy.hp > 0);
      if (targets.length) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        game.combat.applyDamageToEnemy(target, this.powers.juggernaut, 'shock');
        game.log(`Juggernaut crashes into ${target.name}.`);
      }
    }
    return final;
  }

  takeDamage(amount, game) {
    const blocked = Math.min(this.block, amount);
    this.block -= blocked;
    const final = Math.max(0, amount - blocked);
    this.hp = Math.max(0, this.hp - final);
    if (final > 0 && game) game.log(`You lose ${final} HP.`);
    return final;
  }

  loseHp(amount, game, { fromCard = false, silent = false } = {}) {
    this.hp = Math.max(0, this.hp - amount);
    if (fromCard && this.powers.rupture) {
      this.strength += this.powers.rupture;
      game?.log(`Rupture grants ${this.powers.rupture} Strength.`);
    }
    if (!silent && game) game.log(`You lose ${amount} HP.`);
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  resetCombatZones() {
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.block = 0;
  }

  resetCombatState() {
    this.resetCombatZones();
    this.energy = this.maxEnergy;
    this.block = 0;
    this.strength = 0;
    this.dexterity = 0;
    this.tempStrength = 0;
    this.statuses = { vulnerable: 0, weak: 0 };
    this.powers = {};
    this.skillsDisabled = false;
    this.noDrawThisTurn = false;
    this.rageThisTurn = 0;
  }

  shuffleMasterDeckIntoDraw() {
    this.drawPile = shuffle(this.masterDeck.map((card) => cloneCard(card)));
  }

  drawCards(amount, game) {
    if (this.noDrawThisTurn) return;
    for (let i = 0; i < amount; i += 1) {
      if (!this.drawPile.length) this.reshuffle();
      const card = this.drawPile.shift();
      if (!card) break;
      this.hand.push(card);
      if (card.type === 'status') {
        if (this.powers.fireBreathing && game?.combat) {
          game.combat.enemies.filter((enemy) => enemy.hp > 0).forEach((enemy) => game.combat.applyDamageToEnemy(enemy, this.powers.fireBreathing, 'fire'));
          game.log('Fire Breathing erupts from a drawn status card.');
        }
        if (this.powers.evolve) this.drawCards(this.powers.evolve, game);
      }
    }
  }

  reshuffle() {
    if (!this.discardPile.length) return;
    this.drawPile = shuffle(this.discardPile);
    this.discardPile = [];
  }
}

class GameState extends EventTarget {
  constructor() {
    super();
    this.player = new Player();
    this.map = generateActMap();
    this.view = 'map';
    this.combat = null;
    this.modal = null;
    this.logs = ['A new climb begins.'];
    this.flags = { lanternUsed: false };
    this.pendingNodeResolution = null;
    this.pendingEvent = null;
  }

  emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  emitState() {
    this.emit('statechange', {});
  }

  log(message) {
    this.logs.push(message);
    this.emitState();
  }

  toast(message) {
    this.emit('toast', { message });
  }

  chooseMapNode(nodeId) {
    if (!this.map.availableNodeIds.includes(nodeId)) return;
    const node = this.map.nodeIndex[nodeId];
    this.log(`Entering ${getNodeMeta(node.type).label}.`);
    this.map.currentNodeId = nodeId;
    this.map.visitedNodeIds.push(nodeId);
    this.map.availableNodeIds = [];
    this.pendingNodeResolution = node;
    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      this.startCombat(node);
      return;
    }
    if (node.type === 'shop') {
      this.modal = {
        type: 'shop',
        cards: getShopCards(),
        relics: getRandomRelics(2, this.player.relics),
        relicPrices: {}
      };
      this.modal.relics.forEach((relic) => { this.modal.relicPrices[relic.key] = relic.rarity === 'rare' ? 180 : relic.rarity === 'uncommon' ? 140 : 110; });
      this.view = 'map';
      this.log('A shadowed merchant greets you.');
      this.emitState();
      return;
    }
    if (node.type === 'rest') {
      this.modal = { type: 'rest', healAmount: Math.round(this.player.maxHp * 0.3) };
      this.view = 'map';
      this.emitState();
      return;
    }
    this.openEvent();
  }

  openEvent() {
    const heal = Math.min(this.player.maxHp - this.player.hp, 12);
    const options = [
      { label: `Pray for ${heal || 8} HP`, effect: () => { this.player.heal(heal || 8); this.log('Moonlight mends your wounds.'); } },
      { label: 'Search the shadows (+35 gold)', effect: () => { this.player.gold += 35; this.log('You find a hidden cache of gold.'); } },
      { label: 'Challenge a spirit (gain Inflame)', effect: () => { this.player.masterDeck.push(createCard('inflame')); this.log('A spirit gifts you Inflame.'); } }
    ];
    this.modal = { type: 'event', text: 'Ancient braziers hiss as an unseen presence offers a bargain.', choices: options };
    this.pendingEvent = options;
    this.emitState();
  }

  resolveEventChoice(index) {
    this.pendingEvent[index]?.effect();
    this.pendingEvent = null;
    this.leaveModalNode();
  }

  startCombat(node) {
    this.combat = new CombatEngine(this, createEncounter(node.type === 'boss' ? 'boss' : node.type, node.floor));
    this.log(node.type === 'boss' ? 'The final chamber opens.' : 'Combat begins.');
    this.combat.start();
  }

  playCard(cardId, targetId) {
    return this.combat?.playCard(cardId, targetId);
  }

  endTurn() {
    this.combat?.endPlayerTurn();
  }

  finishCombat(victory, encounter) {
    if (!victory) {
      this.player.resetCombatState();
      this.modal = { type: 'end', victory: false };
      this.view = 'map';
      this.combat = null;
      this.emitState();
      return;
    }
    this.player.gold += encounter.rewardGold;
    if (this.player.hasRelic('burningBlood')) {
      this.player.heal(6);
      this.log('Burning Blood restores 6 HP.');
    }
    if (encounter.elite && !this.player.potion) {
      this.player.potion = { name: 'Reinforced Tonic', icon: '🧪', type: 'heal', amount: 15 };
      this.log('An elite cache grants a potion.');
    }
    this.player.resetCombatState();
    this.combat = null;
    this.view = 'map';
    if (this.pendingNodeResolution?.type === 'boss') {
      this.modal = { type: 'end', victory: true };
    } else {
      this.modal = { type: 'reward', cards: getRewardChoices() };
    }
    this.emitState();
  }

  takeReward(cardId) {
    const card = this.modal?.cards.find((entry) => entry.instanceId === cardId);
    if (!card) return;
    this.player.masterDeck.push(createCard(card.key, card.upgraded));
    this.log(`${card.name} joins your deck.`);
    this.advanceMap();
  }

  skipReward() {
    this.log('You skip the reward.');
    this.advanceMap();
  }

  leaveModalNode() {
    this.advanceMap();
  }

  advanceMap() {
    const current = this.pendingNodeResolution;
    if (current) this.map.availableNodeIds = current.connections;
    if (!this.map.availableNodeIds.length && current?.type !== 'boss') {
      const nextFloor = this.map.floors.find((floorNodes) => floorNodes[0].floor === current.floor + 1);
      this.map.availableNodeIds = nextFloor?.map((node) => node.id) ?? [];
    }
    this.modal = null;
    this.pendingNodeResolution = null;
    this.emitState();
  }

  buyShopCard(cardId) {
    const card = this.modal?.cards.find((entry) => entry.instanceId === cardId);
    if (!card) return;
    const cost = getCardPrice(card);
    if (this.player.gold < cost) return this.toast('Not enough gold.');
    this.player.gold -= cost;
    this.player.masterDeck.push(createCard(card.key, card.upgraded));
    this.modal.cards = this.modal.cards.filter((entry) => entry.instanceId !== cardId);
    this.log(`Purchased ${card.name}.`);
    this.emitState();
  }

  buyRelic(relicKey) {
    const price = this.modal?.relicPrices?.[relicKey] ?? 999;
    if (this.player.gold < price) return this.toast('Not enough gold.');
    if (this.player.relics.includes(relicKey)) return;
    this.player.gold -= price;
    this.player.relics.push(relicKey);
    this.modal.relics = this.modal.relics.filter((entry) => entry.key !== relicKey);
    this.log(`Purchased relic: ${RELIC_DEFS[relicKey].name}.`);
    this.emitState();
  }

  beginRemoveCard() {
    if (this.player.gold < 75) return this.toast('Need 75 gold to remove a card.');
    this.modal = { type: 'pile', title: 'Remove a Card', cards: this.player.masterDeck.map((card) => ({ ...card })), mode: 'remove' };
    this.emitState();
  }

  removeCardFromDeck(instanceId) {
    const index = this.player.masterDeck.findIndex((card) => card.instanceId === instanceId);
    if (index === -1) return;
    const [card] = this.player.masterDeck.splice(index, 1);
    this.player.gold -= 75;
    this.log(`${card.name} is removed from your deck.`);
    this.modal = {
      type: 'shop',
      cards: getShopCards(),
      relics: getRandomRelics(2, this.player.relics),
      relicPrices: {}
    };
    this.modal.relics.forEach((relic) => { this.modal.relicPrices[relic.key] = relic.rarity === 'rare' ? 180 : relic.rarity === 'uncommon' ? 140 : 110; });
    this.emitState();
  }

  rest() {
    const amount = Math.round(this.player.maxHp * 0.3);
    this.player.heal(amount);
    this.log(`You rest and recover ${amount} HP.`);
    this.advanceMap();
  }

  openSmith() {
    this.modal = { type: 'pile', title: 'Smith a Card', cards: this.player.masterDeck.map((card) => ({ ...card })), mode: 'smith' };
    this.emitState();
  }

  smithCard(instanceId) {
    const index = this.player.masterDeck.findIndex((card) => card.instanceId === instanceId);
    if (index === -1) return;
    this.player.masterDeck[index] = upgradeCard(this.player.masterDeck[index]);
    this.log(`${this.player.masterDeck[index].name} is upgraded at the fire.`);
    this.advanceMap();
  }

  openMap() {
    if (this.combat) return this.toast('The map must wait until combat ends.');
    this.view = 'map';
    this.emitState();
  }

  closeModal() {
    this.modal = null;
    this.emitState();
  }
}

function shuffle(items) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

const game = new GameState();
new GameUI(game);
game.emitState();
