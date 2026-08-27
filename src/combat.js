import { createCard, getCardCost, getRandomAttack, upgradeCard } from './cards.js';
import { refreshEnemyIntents } from './enemies.js';

export class CombatEngine {
  constructor(game, encounter) {
    this.game = game;
    this.player = game.player;
    this.enemies = encounter.enemies;
    this.encounter = encounter;
    this.turn = 0;
    this.state = 'player';
    this.pendingSelection = null;
    this.firstTurn = true;
    this.playerTurnActive = false;
    this.bonusEnergyThisCombat = 0;
  }

  start() {
    this.turn = 1;
    this.game.view = 'combat';
    this.game.modal = null;
    this.player.resetCombatState();
    this.player.resetCombatZones();
    if (this.player.hasRelic('vajra')) this.player.strength += 1;
    if (this.player.hasRelic('lantern') && !this.game.flags.lanternUsed) {
      this.bonusEnergyThisCombat = 1;
      this.game.flags.lanternUsed = true;
      this.game.log('Lantern lights your first combat with +1 Energy.');
    }
    this.player.shuffleMasterDeckIntoDraw();
    this.sortInnates();
    refreshEnemyIntents(this.enemies);
    this.startPlayerTurn();
    this.game.emitState();
  }

  startPlayerTurn() {
    this.playerTurnActive = true;
    this.state = 'player';
    this.player.energy = this.player.maxEnergy;
    if (!this.player.powers.barricade) this.player.block = 0;
    if (this.turn === 1 && this.bonusEnergyThisCombat) this.player.energy += this.bonusEnergyThisCombat;
    if (this.turn === 1 && this.player.hasRelic('anchor')) this.player.gainBlock(10, this.game, false);
    if (this.player.powers.demonForm) {
      this.player.strength += this.player.powers.demonForm;
      this.game.log(`Demon Form grants ${this.player.powers.demonForm} Strength.`);
    }
    if (this.player.powers.brutality) {
      this.player.loseHp(1, this.game, { fromCard: true, silent: true });
      this.player.drawCards(1, this.game);
      this.game.log('Brutality draws a card at the price of blood.');
    }
    if (this.player.powers.berserk && this.player.statuses.vulnerable > 0) {
      this.player.energy += 1;
      this.game.log('Berserk surges with +1 Energy.');
    }
    this.player.noDrawThisTurn = false;
    const drawCount = 5 + (this.turn === 1 && this.player.hasRelic('ringOfTheSnake') ? 2 : 0);
    this.player.drawCards(drawCount, this.game);
    this.applyStartTurnRelics();
    this.game.log(`Turn ${this.turn} begins.`);
    this.game.emitState();
  }

  applyStartTurnRelics() {
    if (this.turn === 7 && this.player.hasRelic('stoneCalendar')) {
      this.game.log('Stone Calendar begins to glow ominously...');
    }
  }

  getEnemy(targetId) {
    return this.enemies.find((enemy) => enemy.id === targetId && enemy.hp > 0);
  }

  canPlayCard(card) {
    if (!this.playerTurnActive || card.unplayable) return false;
    const cost = getCardCost(card, this.player);
    if (cost !== 'X' && this.player.energy < cost) return false;
    if (this.player.skillsDisabled && card.type === 'skill') return false;
    return true;
  }

  playCard(cardId, targetId = null, { free = false, fromHavoc = false } = {}) {
    const cardIndex = this.player.hand.findIndex((card) => card.instanceId === cardId);
    if (cardIndex === -1) return false;
    const card = this.player.hand[cardIndex];
    if (!this.canPlayCard(card) && !free) return false;
    const validTarget = this.resolveTarget(card, targetId);
    if (card.target === 'enemy' && !validTarget) {
      this.game.toast('Choose a living enemy target.');
      return false;
    }
    const cost = free ? 0 : this.payCost(card);
    this.player.hand.splice(cardIndex, 1);
    this.game.emit('cardPlayed', { card, targetId: validTarget?.id ?? null, cost });
    this.game.log(`Played ${card.name}.`);

    if (card.tags.includes('attack') && this.player.rageThisTurn) {
      this.player.gainBlock(this.player.rageThisTurn, this.game);
    }

    const exhaustCard = card.exhaust || (this.player.powers.corruption && card.type === 'skill') || fromHavoc;
    this.resolveEffects(card, validTarget, cost, { fromCard: true });
    if (card.tags.includes('attack')) this.wakeSleepingEnemies();

    if (exhaustCard || card.ethereal) this.exhaustCard(card);
    else this.player.discardPile.push(card);

    this.cleanupDeadEnemies();
    if (this.enemies.every((enemy) => enemy.hp <= 0)) {
      this.winCombat();
      return true;
    }
    this.game.emitState();
    return true;
  }

  payCost(card) {
    const raw = getCardCost(card, this.player);
    const spent = raw === 'X' ? this.player.energy : raw;
    this.player.energy -= spent;
    return spent;
  }

  resolveTarget(card, targetId) {
    if (card.target !== 'enemy') return null;
    if (targetId) return this.getEnemy(targetId);
    const alive = this.enemies.filter((enemy) => enemy.hp > 0);
    return alive.length === 1 ? alive[0] : null;
  }

  resolveEffects(card, target, energySpent, context = {}) {
    for (const effect of card.effects) {
      switch (effect.type) {
        case 'damage':
          this.dealDamage(target, effect.amount, { attack: true, card });
          break;
        case 'multiDamage':
          for (let i = 0; i < effect.hits; i += 1) this.dealDamage(target, effect.amount, { attack: true, card, small: true });
          break;
        case 'damageAll':
          this.enemies.filter((enemy) => enemy.hp > 0).forEach((enemy) => this.dealDamage(enemy, effect.amount, { attack: true, card, all: true }));
          break;
        case 'xDamageAll':
          this.enemies.filter((enemy) => enemy.hp > 0).forEach((enemy) => {
            for (let i = 0; i < energySpent; i += 1) this.dealDamage(enemy, effect.amount, { attack: true, card, all: true, small: true });
          });
          break;
        case 'block':
          this.player.gainBlock(effect.amount, this.game);
          break;
        case 'draw':
          this.player.drawCards(effect.amount, this.game);
          break;
        case 'debuff':
          this.applyEnemyEffect(target, effect);
          break;
        case 'debuffAll':
          this.enemies.filter((enemy) => enemy.hp > 0).forEach((enemy) => this.applyEnemyEffect(enemy, effect));
          break;
        case 'addStatus':
          for (let i = 0; i < effect.amount; i += 1) this.addStatusCard(effect.card, effect.destination);
          break;
        case 'headbuttRecover':
          this.headbuttRecover();
          break;
        case 'upgradeHand':
          this.upgradeHand(effect.amount);
          break;
        case 'tempStrength':
          this.player.strength += effect.amount;
          this.player.tempStrength += effect.amount;
          this.game.log(`Flex grants ${effect.amount} temporary Strength.`);
          break;
        case 'havoc':
          this.playTopCardFromDraw();
          break;
        case 'exhaustFromHand':
          this.exhaustFromHand(false);
          break;
        case 'chooseExhaustFromHand':
          this.exhaustFromHand(true);
          break;
        case 'topdeckFromHand':
          this.topdeckFromHand();
          break;
        case 'powerBuff':
          if (effect.power === 'rage') {
            this.player.rageThisTurn += effect.amount;
          } else {
            this.player.powers[effect.power] = (this.player.powers[effect.power] ?? 0) + effect.amount;
          }
          this.game.log(`${card.name} empowers ${effect.power.replace(/([A-Z])/g, ' $1')}.`);
          break;
        case 'powerToggle':
          this.player.powers[effect.power] = true;
          this.game.log(`${card.name} activates ${effect.power}.`);
          break;
        case 'infernalBlade':
          this.infernalBlade();
          break;
        case 'entrench':
          this.player.block *= 2;
          this.game.log('Entrench doubles your Block.');
          break;
        case 'loseHp':
          this.player.loseHp(effect.amount, this.game, { fromCard: true });
          break;
        case 'gainEnergy':
          this.player.energy += effect.amount;
          this.game.log(`Gain ${effect.amount} Energy.`);
          break;
        case 'strength':
          this.player.strength += effect.amount;
          this.game.log(`Gain ${effect.amount} Strength.`);
          break;
        case 'spotWeakness':
          if (target?.intent?.type?.includes('attack')) {
            this.player.strength += effect.amount;
            this.game.log(`Spot Weakness lands: +${effect.amount} Strength.`);
          } else {
            this.game.log('Spot Weakness fizzles; the foe is not attacking.');
          }
          break;
        case 'noDraw':
          this.player.noDrawThisTurn = true;
          this.game.log('Battle Trance seals further draws this turn.');
          break;
        case 'gainEnergyIfVulnerable':
          if (this.player.statuses.vulnerable > 0) {
            this.player.energy += effect.amount;
            this.game.log(`Berserk grants ${effect.amount} Energy.`);
          }
          break;
        default:
          break;
      }
    }
    if (context.fromCard) this.cleanupDeadEnemies();
  }

  dealDamage(target, baseAmount, options = {}) {
    if (!target || target.hp <= 0) return 0;
    const isAttack = options.attack;
    let amount = baseAmount + (isAttack ? this.player.strength : 0);
    if (isAttack && this.player.statuses.weak > 0) amount = Math.floor(amount * 0.75);
    if (target.statuses.vulnerable > 0) amount = Math.floor(amount * 1.5);
    amount = Math.max(0, amount);
    if (this.player.hasRelic('boot') && target.block < amount && amount > 0 && amount < 5) amount = 5;
    const dealt = this.applyDamageToEnemy(target, amount, options.small ? 'small-hit' : 'hit');
    if (dealt >= 12) this.game.emit('screenShake', { heavy: dealt >= 20 });
    return dealt;
  }

  applyDamageToEnemy(target, amount, fx = 'hit') {
    const blocked = Math.min(target.block, amount);
    target.block -= blocked;
    const final = Math.max(0, amount - blocked);
    target.hp -= final;
    target.damageTakenThisMode += final;
    this.game.emit('floatText', { kind: final > 0 ? 'damage' : 'block', targetId: target.id, value: final > 0 ? `-${final}` : 'Blocked' });
    if (final > 0) this.game.log(`${target.name} takes ${final} damage.`);
    if (target.key === 'guardian' && target.mode === 'attack' && target.damageTakenThisMode >= 30) {
      target.mode = 'defense';
      target.damageTakenThisMode = 0;
      target.block += 20;
      this.game.log('The Guardian curls into defensive mode!');
    }
    if (target.hp <= 0) {
      target.hp = 0;
      this.game.log(`${target.name} is defeated.`);
    }
    return final;
  }

  applyEnemyEffect(enemy, effect) {
    if (!enemy || enemy.hp <= 0) return;
    if (effect.status === 'strength') {
      enemy.strength += effect.amount;
      this.game.log(`${enemy.name} loses ${Math.abs(effect.amount)} Strength.`);
      return;
    }
    enemy.statuses[effect.status] = Math.max(0, (enemy.statuses[effect.status] ?? 0) + effect.amount);
    this.game.log(`${enemy.name} gains ${effect.amount} ${effect.status}.`);
  }

  addStatusCard(cardKey, destination) {
    const zone = destination === 'draw' ? this.player.drawPile : this.player.discardPile;
    zone.push(createCard(cardKey));
    this.game.log(`${cardKey[0].toUpperCase()}${cardKey.slice(1)} is added to your ${destination} pile.`);
  }

  headbuttRecover() {
    const index = this.player.discardPile.findIndex((card) => card.tags.includes('attack'));
    if (index === -1) return;
    const [card] = this.player.discardPile.splice(index, 1);
    this.player.drawPile.unshift(card);
    this.game.log(`${card.name} returns to the top of your draw pile.`);
  }

  upgradeHand(amount) {
    if (amount > 50) {
      this.player.hand = this.player.hand.map((card) => upgradeCard(card));
      this.game.log('All cards in your hand shimmer with new power.');
      return;
    }
    const index = this.player.hand.findIndex((card) => !card.upgraded && card.type !== 'status');
    if (index !== -1) {
      this.player.hand[index] = upgradeCard(this.player.hand[index]);
      this.game.log(`${this.player.hand[index].name} is upgraded.`);
    }
  }

  playTopCardFromDraw() {
    if (!this.player.drawPile.length && this.player.discardPile.length) this.player.reshuffle();
    const top = this.player.drawPile.shift();
    if (!top) return;
    this.player.hand.push(top);
    this.game.log(`Havoc unleashes ${top.name}.`);
    this.playCard(top.instanceId, this.chooseAutoTargetId(top), { free: true, fromHavoc: true });
  }

  chooseAutoTargetId(card) {
    if (card.target !== 'enemy') return null;
    return this.enemies.find((enemy) => enemy.hp > 0)?.id ?? null;
  }

  exhaustFromHand(chosen) {
    if (!this.player.hand.length) return;
    let index = this.player.hand.findIndex((card) => card.type === 'status');
    if (index === -1) index = chosen ? this.player.hand.length - 1 : Math.floor(Math.random() * this.player.hand.length);
    const [card] = this.player.hand.splice(index, 1);
    this.exhaustCard(card);
    this.game.log(`${card.name} is Exhausted.`);
  }

  topdeckFromHand() {
    if (!this.player.hand.length) return;
    const index = [...this.player.hand].reverse().findIndex((card) => !card.unplayable);
    const actualIndex = index === -1 ? 0 : this.player.hand.length - 1 - index;
    const [card] = this.player.hand.splice(actualIndex, 1);
    this.player.drawPile.unshift(card);
    this.game.log(`${card.name} is placed on top of your draw pile.`);
  }

  infernalBlade() {
    const card = getRandomAttack();
    card.temporaryCost = 0;
    card.generated = true;
    this.player.hand.push(card);
    this.game.log(`Infernal Blade conjures ${card.name}.`);
  }

  exhaustCard(card) {
    this.player.exhaustPile.push(card);
    if (this.player.powers.darkEmbrace) this.player.drawCards(1, this.game);
    if (this.player.powers.feelNoPain) this.player.gainBlock(this.player.powers.feelNoPain, this.game);
  }

  wakeSleepingEnemies() {
    this.enemies.forEach((enemy) => {
      if (enemy.sleeping) {
        enemy.sleeping = false;
        enemy.asleepTurns = 0;
        this.game.log(`${enemy.name} wakes in fury!`);
      }
    });
  }

  endPlayerTurn() {
    if (!this.playerTurnActive) return;
    this.playerTurnActive = false;
    this.processEndOfTurnHand();
    this.clearTemporaryCosts();
    if (this.player.hasRelic('orichalcum') && this.player.block === 0) this.player.gainBlock(6, this.game);
    if (this.player.powers.metallicize) this.player.gainBlock(this.player.powers.metallicize, this.game, false);
    if (this.player.powers.combust) {
      this.player.loseHp(this.player.powers.combustSelf ?? 1, this.game, { fromCard: true, silent: true });
      this.enemies.filter((enemy) => enemy.hp > 0).forEach((enemy) => this.applyDamageToEnemy(enemy, this.player.powers.combust, 'burn'));
      this.game.log('Combust scorches the battlefield.');
    }
    if (this.turn === 7 && this.player.hasRelic('stoneCalendar')) {
      this.enemies.filter((enemy) => enemy.hp > 0).forEach((enemy) => this.applyDamageToEnemy(enemy, 52, 'meteor'));
      this.game.log('Stone Calendar crashes down for 52 damage to all foes!');
    }
    this.player.statuses.vulnerable = Math.max(0, this.player.statuses.vulnerable - 1);
    this.player.statuses.weak = Math.max(0, this.player.statuses.weak - 1);
    this.player.skillsDisabled = false;
    this.player.rageThisTurn = 0;
    this.enemyTurn();
  }

  processEndOfTurnHand() {
    const remaining = [...this.player.hand];
    this.player.hand = [];
    remaining.forEach((card) => {
      if (card.burn) {
        this.player.loseHp(card.burn, this.game, { fromCard: true, silent: true });
        this.game.log(`Burn sears you for ${card.burn}.`);
      }
      if (card.ethereal) this.exhaustCard(card);
      else this.player.discardPile.push(card);
    });
  }

  clearTemporaryCosts() {
    [this.player.hand, this.player.drawPile, this.player.discardPile].forEach((pile) => {
      pile.forEach((card) => {
        card.temporaryCost = null;
      });
    });
  }

  enemyTurn() {
    this.state = 'enemy';
    this.game.log('Enemies act.');
    for (const enemy of this.enemies.filter((unit) => unit.hp > 0)) {
      if (enemy.ritual) enemy.strength += enemy.ritual;
      this.executeEnemyAction(enemy);
      if (this.player.hp <= 0) {
        this.loseCombat();
        return;
      }
      enemy.statuses.vulnerable = Math.max(0, enemy.statuses.vulnerable - 1);
      enemy.statuses.weak = Math.max(0, enemy.statuses.weak - 1);
      enemy.turn += 1;
      if (enemy.key === 'guardian' && enemy.mode === 'defense' && enemy.turn % 2 === 0) {
        enemy.mode = 'attack';
        enemy.damageTakenThisMode = 0;
        this.game.log('The Guardian opens back up.');
      }
    }
    this.cleanupDeadEnemies();
    if (this.enemies.every((enemy) => enemy.hp <= 0)) {
      this.winCombat();
      return;
    }
    refreshEnemyIntents(this.enemies);
    if (this.player.tempStrength > 0) {
      this.player.strength -= this.player.tempStrength;
      this.player.tempStrength = 0;
    }
    this.turn += 1;
    this.startPlayerTurn();
  }

  executeEnemyAction(enemy) {
    const action = enemy.intent?.action;
    if (!action) return;
    if (enemy.sleeping) {
      enemy.asleepTurns -= 1;
      if (enemy.asleepTurns <= 0) enemy.sleeping = false;
      return;
    }
    switch (action.type) {
      case 'attack':
        this.damagePlayer(action.damage + enemy.strength, enemy);
        break;
      case 'multiAttack':
        for (let i = 0; i < action.hits; i += 1) this.damagePlayer(action.damage + enemy.strength, enemy, true);
        break;
      case 'attackBlock':
        this.damagePlayer(action.damage + enemy.strength, enemy);
        enemy.block += action.block;
        break;
      case 'buffSelf':
        enemy.strength += action.strength ?? 0;
        enemy.ritual = action.ritual ?? enemy.ritual;
        break;
      case 'buffBlock':
        enemy.strength += action.strength ?? 0;
        enemy.block += action.block ?? 0;
        break;
      case 'applyPlayerStatus':
        this.player.statuses[action.status] = (this.player.statuses[action.status] ?? 0) + action.amount;
        if (action.status === 'weak') this.game.log(`${enemy.name} weakens you.`);
        break;
      case 'attackStatus':
        this.damagePlayer(action.damage + enemy.strength, enemy);
        this.player.statuses[action.status] = (this.player.statuses[action.status] ?? 0) + action.amount;
        break;
      case 'entangle':
        this.player.skillsDisabled = true;
        this.game.log('You are Entangled: skills are unusable next turn.');
        break;
      case 'siphonSoul':
        this.player.strength -= 1;
        this.player.dexterity -= 1;
        this.game.log('Lagavulin drains your strength and dexterity.');
        break;
      case 'blockStatus':
        enemy.block += action.block;
        for (let i = 0; i < action.amount; i += 1) this.addStatusCard(action.statusCard, 'discard');
        break;
      case 'teamBlock':
        this.enemies.filter((unit) => unit.hp > 0).forEach((unit) => { unit.block += action.block; });
        break;
      case 'selfBlock':
        enemy.block += action.block;
        break;
      case 'sleep':
      default:
        break;
    }
  }

  damagePlayer(amount, enemy, small = false) {
    let modified = amount;
    if (enemy.statuses.weak > 0) modified = Math.floor(modified * 0.75);
    if (this.player.statuses.vulnerable > 0) modified = Math.floor(modified * 1.5);
    this.player.takeDamage(modified, this.game);
    this.game.emit('floatText', { kind: 'damage', targetId: 'player-avatar', value: `-${modified}` });
    if (modified >= 12) this.game.emit('screenShake', { heavy: modified >= 20 });
    if (!small) this.game.log(`${enemy.name} hits you for ${modified}.`);
  }

  cleanupDeadEnemies() {
    this.enemies.forEach((enemy) => {
      if (enemy.hp < 0) enemy.hp = 0;
    });
  }

  sortInnates() {
    const innates = this.player.drawPile.filter((card) => card.innate);
    const rest = this.player.drawPile.filter((card) => !card.innate);
    this.player.drawPile = [...innates, ...rest];
  }

  winCombat() {
    this.game.log('Victory!');
    this.game.finishCombat(true, this.encounter);
  }

  loseCombat() {
    this.game.log('Defeat...');
    this.game.finishCombat(false, this.encounter);
  }
}
