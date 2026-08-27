import { RELIC_DEFS, getCardCost, getCardPrice } from './cards.js';
import { getNodeMeta } from './map.js';

export class GameUI {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('app');
    this.elements = {
      hpFill: document.getElementById('player-hp-fill'),
      hpText: document.getElementById('player-hp-text'),
      gold: document.getElementById('gold-display'),
      floor: document.getElementById('floor-display'),
      energy: document.getElementById('energy-display'),
      relicBar: document.getElementById('relic-bar'),
      playerStatus: document.getElementById('player-status'),
      mapView: document.getElementById('map-view'),
      combatView: document.getElementById('combat-view'),
      enemyArea: document.getElementById('enemy-area'),
      hand: document.getElementById('hand'),
      handHelp: document.getElementById('hand-help'),
      drawDiscardSummary: document.getElementById('draw-discard-summary'),
      modalRoot: document.getElementById('modal-root'),
      floatingLayer: document.getElementById('floating-layer'),
      sceneTitle: document.getElementById('scene-title'),
      sceneDescription: document.getElementById('scene-description'),
      turnIndicator: document.getElementById('combat-turn-indicator'),
      log: document.getElementById('combat-log'),
      runInfo: document.getElementById('run-info'),
      endTurn: document.getElementById('btn-end-turn'),
      mapButton: document.getElementById('btn-map'),
      deckButton: document.getElementById('btn-deck'),
      discardButton: document.getElementById('btn-discard'),
      drawButton: document.getElementById('btn-draw'),
      exhaustButton: document.getElementById('btn-exhaust'),
      potionButton: document.getElementById('btn-potion')
    };
    this.selectedCardId = null;
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    this.game.addEventListener('statechange', () => this.render());
    this.game.addEventListener('floatText', (event) => this.spawnFloatingText(event.detail));
    this.game.addEventListener('screenShake', (event) => this.shake(event.detail.heavy));
    this.game.addEventListener('cardPlayed', (event) => this.animateCardPlay(event.detail.card.instanceId));
    this.game.addEventListener('toast', (event) => this.showToast(event.detail.message));

    this.elements.endTurn.addEventListener('click', () => this.game.endTurn());
    this.elements.mapButton.addEventListener('click', () => this.game.openMap());
    this.elements.deckButton.addEventListener('click', () => this.openPileModal('Master Deck', this.game.player.masterDeck));
    this.elements.discardButton.addEventListener('click', () => this.openPileModal('Discard Pile', this.game.player.discardPile));
    this.elements.drawButton.addEventListener('click', () => this.openPileModal('Draw Pile', this.game.player.drawPile));
    this.elements.exhaustButton.addEventListener('click', () => this.openPileModal('Exhaust Pile', this.game.player.exhaustPile));
    this.elements.potionButton.addEventListener('click', () => this.usePotion());
  }

  render() {
    const { player, map, combat, view, modal, logs } = this.game;
    if (!combat) this.selectedCardId = null;
    this.renderResources(player, map, combat);
    this.renderRelics(player);
    this.renderStatuses(player);
    this.renderHand(player, combat);
    this.renderMap(map, view);
    this.renderCombat(combat, view);
    this.renderRunInfo();
    this.renderLog(logs);
    this.renderModal(modal);
  }

  renderResources(player, map, combat) {
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    this.elements.hpFill.style.width = `${hpPct}%`;
    this.elements.hpText.textContent = `${player.hp} / ${player.maxHp}`;
    this.elements.gold.textContent = player.gold;
    const currentFloor = map.currentNodeId ? map.nodeIndex[map.currentNodeId].floor : 1;
    this.elements.floor.textContent = `${currentFloor} / 15`;
    this.elements.energy.innerHTML = '';
    const energyCount = combat ? player.energy : player.maxEnergy;
    for (let i = 0; i < energyCount; i += 1) {
      const orb = document.createElement('div');
      orb.className = 'energy-orb';
      orb.innerHTML = '<span>✦</span>';
      this.elements.energy.appendChild(orb);
    }
    if (energyCount === 0) this.elements.energy.innerHTML = '<div class="energy-empty">No Energy</div>';
  }

  renderRelics(player) {
    this.elements.relicBar.innerHTML = player.relics.map((key) => {
      const relic = RELIC_DEFS[key];
      return `<div class="relic-chip" title="${relic.name}: ${relic.description}"><span>${relic.icon}</span><small>${relic.name}</small></div>`;
    }).join('');
  }

  renderStatuses(player) {
    const statuses = [];
    if (player.block > 0) statuses.push({ label: 'Block', value: player.block, kind: 'block' });
    if (player.strength !== 0) statuses.push({ label: 'Strength', value: player.strength, kind: 'buff' });
    if (player.dexterity !== 0) statuses.push({ label: 'Dexterity', value: player.dexterity, kind: 'buff' });
    if (player.statuses.vulnerable > 0) statuses.push({ label: 'Vulnerable', value: player.statuses.vulnerable, kind: 'debuff' });
    if (player.statuses.weak > 0) statuses.push({ label: 'Weak', value: player.statuses.weak, kind: 'debuff' });
    if (player.skillsDisabled) statuses.push({ label: 'Entangled', value: '!', kind: 'debuff' });
    if (player.rageThisTurn > 0) statuses.push({ label: 'Rage', value: player.rageThisTurn, kind: 'buff' });
    Object.entries(player.powers).forEach(([key, value]) => {
      if (!value) return;
      statuses.push({ label: beautifyKey(key), value: value === true ? '∞' : value, kind: 'power' });
    });
    this.elements.playerStatus.innerHTML = statuses.length
      ? statuses.map((item) => `<div class="status-badge ${item.kind}"><span>${item.label}</span><strong>${item.value}</strong></div>`).join('')
      : '<p class="muted">No active effects.</p>';
  }

  renderHand(player, combat) {
    this.elements.hand.innerHTML = '';
    this.elements.handHelp.textContent = combat
      ? (this.selectedCardId ? 'Select a target enemy or click the card again to cancel.' : 'Play cards by clicking them, then pick a target if needed.')
      : 'Your cards will appear here during combat.';
    this.elements.drawDiscardSummary.innerHTML = `Draw <strong>${player.drawPile.length}</strong> · Discard <strong>${player.discardPile.length}</strong> · Exhaust <strong>${player.exhaustPile.length}</strong>`;
    player.hand.forEach((card) => {
      const playable = combat?.canPlayCard(card);
      const cost = getCardCost(card, player);
      const cardEl = document.createElement('button');
      cardEl.className = `card ${card.type} rarity-${card.rarity} ${playable ? '' : 'disabled'} ${this.selectedCardId === card.instanceId ? 'selected' : ''}`;
      cardEl.dataset.cardId = card.instanceId;
      cardEl.id = `card-${card.instanceId}`;
      cardEl.innerHTML = `
        <div class="card-topline"><span class="card-cost">${cost === 'X' ? 'X' : cost}</span><span class="card-type">${card.type}</span></div>
        <div class="card-art">${iconForCard(card)}</div>
        <div class="card-title">${card.name}</div>
        <div class="card-desc">${card.description}</div>
        <div class="card-tags">${card.tags.map((tag) => `<span>${tag}</span>`).join('')}</div>
      `;
      cardEl.addEventListener('click', () => this.onCardClick(card));
      this.elements.hand.appendChild(cardEl);
    });
  }

  renderMap(map, view) {
    const showMap = view !== 'combat';
    this.elements.mapView.classList.toggle('hidden', !showMap);
    if (!showMap) return;
    this.elements.sceneTitle.textContent = 'Act I Map';
    this.elements.sceneDescription.textContent = 'Choose a glowing path upward through the Spire.';
    this.elements.turnIndicator.classList.add('hidden');

    const laneWidth = 18;
    const floorHeight = 70;
    const canvasHeight = 40 + map.floors.length * floorHeight;
    let html = `<div class="map-canvas" style="min-height:${canvasHeight}px"><svg class="map-link" viewBox="0 0 100 ${canvasHeight}" preserveAspectRatio="none">`;
    map.floors.forEach((floorNodes, floorIndex) => {
      floorNodes.forEach((node) => {
        const x = 8 + node.lane * laneWidth;
        const y = 30 + floorIndex * floorHeight;
        node.connections.forEach((targetId) => {
          const target = map.nodeIndex[targetId];
          const tx = 8 + target.lane * laneWidth;
          const ty = 30 + floorIndex * floorHeight + floorHeight;
          html += `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}"/>`;
        });
      });
    });
    html += '</svg>';

    map.floors.forEach((floorNodes) => {
      floorNodes.forEach((node) => {
        const meta = getNodeMeta(node.type);
        const current = node.id === map.currentNodeId;
        const available = map.availableNodeIds.includes(node.id);
        const visited = map.visitedNodeIds.includes(node.id);
        const x = 8 + node.lane * laneWidth;
        const y = 10 + (node.floor - 1) * floorHeight;
        html += `
          <button class="map-node ${node.type} ${current ? 'current' : ''} ${available ? 'available' : ''} ${visited ? 'visited' : ''}"
            style="left:${x}%; top:${y}px" data-node-id="${node.id}" ${available ? '' : 'disabled'}>
            <span>${meta.icon}</span>
            <small>${node.floor}</small>
          </button>`;
      });
    });
    html += '</div>';
    this.elements.mapView.innerHTML = html;
    this.elements.mapView.querySelectorAll('[data-node-id]').forEach((button) => {
      button.addEventListener('click', () => this.game.chooseMapNode(button.dataset.nodeId));
    });
  }

  renderCombat(combat, view) {
    const showCombat = view === 'combat' && combat;
    this.elements.combatView.classList.toggle('hidden', !showCombat);
    if (!showCombat) return;
    this.elements.mapView.classList.add('hidden');
    this.elements.sceneTitle.textContent = combat.encounter.boss ? 'Act I Boss' : combat.encounter.name;
    this.elements.sceneDescription.textContent = combat.encounter.boss ? 'The Spire trembles before an ancient guardian.' : 'Read enemy intent, spend energy, and survive.';
    this.elements.turnIndicator.textContent = `Turn ${combat.turn}`;
    this.elements.turnIndicator.classList.remove('hidden');
    this.elements.enemyArea.innerHTML = combat.enemies.map((enemy) => {
      const hpPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
      const statuses = [];
      if (enemy.block > 0) statuses.push(`<span class="status-badge block"><span>Block</span><strong>${enemy.block}</strong></span>`);
      if (enemy.strength !== 0) statuses.push(`<span class="status-badge buff"><span>STR</span><strong>${enemy.strength}</strong></span>`);
      if (enemy.statuses.vulnerable > 0) statuses.push(`<span class="status-badge debuff"><span>Vuln</span><strong>${enemy.statuses.vulnerable}</strong></span>`);
      if (enemy.statuses.weak > 0) statuses.push(`<span class="status-badge debuff"><span>Weak</span><strong>${enemy.statuses.weak}</strong></span>`);
      const intent = enemy.intent ?? { type: 'idle', text: '...' };
      return `
        <button class="enemy ${enemy.hp <= 0 ? 'dead' : ''} ${this.selectedCardId ? 'targetable' : ''}" id="enemy-${enemy.id}" data-enemy-id="${enemy.id}" ${enemy.hp <= 0 ? 'disabled' : ''}>
          <div class="enemy-intent ${intent.type}">${intentGlyph(intent.type)}<span>${intent.text}</span></div>
          <div class="enemy-avatar" id="enemy-anchor-${enemy.id}">${enemy.icon}</div>
          <div class="enemy-name">${enemy.name}</div>
          <div class="hp-track enemy-track"><div class="hp-fill" style="width:${hpPct}%"></div></div>
          <div class="enemy-hp">${enemy.hp} / ${enemy.maxHp}</div>
          <div class="status-list compact">${statuses.join('')}</div>
        </button>`;
    }).join('');

    this.elements.enemyArea.querySelectorAll('[data-enemy-id]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!this.selectedCardId) return;
        const card = this.game.player.hand.find((entry) => entry.instanceId === this.selectedCardId);
        if (!card) return;
        const played = this.game.playCard(this.selectedCardId, button.dataset.enemyId);
        if (played) this.selectedCardId = null;
        this.render();
      });
    });
  }

  renderRunInfo() {
    const { player, map } = this.game;
    const node = map.currentNodeId ? map.nodeIndex[map.currentNodeId] : null;
    this.elements.runInfo.innerHTML = `
      <div class="info-card"><span>Current Node</span><strong>${node ? getNodeMeta(node.type).label : 'Path Start'}</strong></div>
      <div class="info-card"><span>Potion</span><strong>${player.potion ? `${player.potion.icon} ${player.potion.name}` : 'None'}</strong></div>
      <div class="info-card"><span>Deck Size</span><strong>${player.masterDeck.length}</strong></div>
      <div class="info-card"><span>Visited</span><strong>${map.visitedNodeIds.length}</strong></div>
    `;
  }

  renderLog(logs) {
    this.elements.log.innerHTML = logs.slice(-30).reverse().map((entry) => `<div class="log-entry">${entry}</div>`).join('');
  }

  renderModal(modal) {
    const root = this.elements.modalRoot;
    if (!modal) {
      root.classList.add('hidden');
      root.innerHTML = '';
      return;
    }
    root.classList.remove('hidden');
    if (modal.type === 'reward') this.renderRewardModal(modal);
    else if (modal.type === 'shop') this.renderShopModal(modal);
    else if (modal.type === 'rest') this.renderRestModal(modal);
    else if (modal.type === 'pile') this.renderPileModal(modal);
    else if (modal.type === 'end') this.renderEndModal(modal);
    else if (modal.type === 'event') this.renderEventModal(modal);
  }

  renderRewardModal(modal) {
    this.elements.modalRoot.innerHTML = `
      <div class="modal-shell panel-glass wide">
        <h2>Choose a Reward</h2>
        <p>Victory grants power. Select 1 of 3 cards, or skip.</p>
        <div class="modal-card-row">${modal.cards.map((card) => this.cardMarkup(card)).join('')}</div>
        <div class="modal-actions"><button class="fantasy-button subtle" data-close>Skip</button></div>
      </div>`;
    this.wireCardSelection(modal.cards, (card) => this.game.takeReward(card.instanceId));
    this.elements.modalRoot.querySelector('[data-close]').addEventListener('click', () => this.game.skipReward());
  }

  renderShopModal(modal) {
    this.elements.modalRoot.innerHTML = `
      <div class="modal-shell panel-glass wide">
        <h2>Merchant</h2>
        <p>Spend gold on new cards, rare relics, or remove a burden from your deck.</p>
        <div class="shop-columns">
          <div>
            <h3>Cards</h3>
            <div class="modal-card-row">${modal.cards.map((card) => `<div class="shop-entry" data-card-buy="${card.instanceId}">${this.cardMarkup(card)}<button class="fantasy-button">Buy ${getCardPrice(card)}g</button></div>`).join('')}</div>
          </div>
          <div>
            <h3>Relics</h3>
            <div class="relic-shop">${modal.relics.map((relic) => `<button class="relic-shop-item" data-relic-buy="${relic.key}"><span>${relic.icon}</span><strong>${relic.name}</strong><small>${relic.description}</small><em>${modal.relicPrices[relic.key]}g</em></button>`).join('')}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="fantasy-button" data-remove>Remove Card (75g)</button>
          <button class="fantasy-button subtle" data-leave>Leave</button>
        </div>
      </div>`;
    this.elements.modalRoot.querySelectorAll('[data-card-buy]').forEach((item) => item.addEventListener('click', () => this.game.buyShopCard(item.dataset.cardBuy)));
    this.elements.modalRoot.querySelectorAll('[data-relic-buy]').forEach((item) => item.addEventListener('click', () => this.game.buyRelic(item.dataset.relicBuy)));
    this.elements.modalRoot.querySelector('[data-remove]').addEventListener('click', () => this.game.beginRemoveCard());
    this.elements.modalRoot.querySelector('[data-leave]').addEventListener('click', () => this.game.leaveModalNode());
  }

  renderRestModal(modal) {
    this.elements.modalRoot.innerHTML = `
      <div class="modal-shell panel-glass">
        <h2>Rest Site</h2>
        <p>The flames whisper. Recover strength or temper steel.</p>
        <div class="modal-actions stacked">
          <button class="fantasy-button" data-rest>Rest (+${modal.healAmount} HP)</button>
          <button class="fantasy-button" data-smith>Smith a Card</button>
          <button class="fantasy-button subtle" data-leave>Leave</button>
        </div>
      </div>`;
    this.elements.modalRoot.querySelector('[data-rest]').addEventListener('click', () => this.game.rest());
    this.elements.modalRoot.querySelector('[data-smith]').addEventListener('click', () => this.game.openSmith());
    this.elements.modalRoot.querySelector('[data-leave]').addEventListener('click', () => this.game.leaveModalNode());
  }

  renderPileModal(modal) {
    const removable = modal.mode === 'remove';
    const smith = modal.mode === 'smith';
    this.elements.modalRoot.innerHTML = `
      <div class="modal-shell panel-glass wide">
        <h2>${modal.title}</h2>
        <p>${removable ? 'Choose one card to remove from your deck.' : smith ? 'Choose a card to upgrade.' : `Viewing ${modal.cards.length} cards.`}</p>
        <div class="pile-grid">${modal.cards.map((card) => `<button class="pile-entry ${removable || smith ? 'interactive' : ''}" data-pile-card="${card.instanceId}">${this.cardMarkup(card)}</button>`).join('')}</div>
        <div class="modal-actions"><button class="fantasy-button subtle" data-close>Close</button></div>
      </div>`;
    if (removable) this.elements.modalRoot.querySelectorAll('[data-pile-card]').forEach((btn) => btn.addEventListener('click', () => this.game.removeCardFromDeck(btn.dataset.pileCard)));
    if (smith) this.elements.modalRoot.querySelectorAll('[data-pile-card]').forEach((btn) => btn.addEventListener('click', () => this.game.smithCard(btn.dataset.pileCard)));
    this.elements.modalRoot.querySelector('[data-close]').addEventListener('click', () => this.game.closeModal());
  }

  renderEndModal(modal) {
    this.elements.modalRoot.innerHTML = `
      <div class="modal-shell panel-glass">
        <h2>${modal.victory ? 'Victory!' : 'Defeat'}</h2>
        <p>${modal.victory ? 'The Act I guardian lies shattered. Your legend climbs higher.' : 'Your climb ends here, but the Spire will remember your spark.'}</p>
        <div class="modal-actions"><button class="fantasy-button" data-restart>Start New Run</button></div>
      </div>`;
    this.elements.modalRoot.querySelector('[data-restart]').addEventListener('click', () => window.location.reload());
  }

  renderEventModal(modal) {
    this.elements.modalRoot.innerHTML = `
      <div class="modal-shell panel-glass">
        <h2>Unknown Room</h2>
        <p>${modal.text}</p>
        <div class="modal-actions stacked">${modal.choices.map((choice, index) => `<button class="fantasy-button" data-choice="${index}">${choice.label}</button>`).join('')}</div>
      </div>`;
    this.elements.modalRoot.querySelectorAll('[data-choice]').forEach((button) => button.addEventListener('click', () => this.game.resolveEventChoice(Number(button.dataset.choice))));
  }

  openPileModal(title, cards) {
    this.game.modal = { type: 'pile', title, cards: cards.map((card) => ({ ...card })), mode: 'view' };
    this.game.emitState();
  }

  cardMarkup(card) {
    const cost = card.temporaryCost ?? card.cost;
    return `
      <div class="card ${card.type} rarity-${card.rarity}">
        <div class="card-topline"><span class="card-cost">${cost === 'X' ? 'X' : cost}</span><span class="card-type">${card.type}</span></div>
        <div class="card-art">${iconForCard(card)}</div>
        <div class="card-title">${card.name}</div>
        <div class="card-desc">${card.description}</div>
      </div>`;
  }

  wireCardSelection(cards, handler) {
    this.elements.modalRoot.querySelectorAll('.modal-card-row .card').forEach((cardElement, index) => {
      cardElement.addEventListener('click', () => handler(cards[index]));
    });
  }

  onCardClick(card) {
    if (!this.game.combat) return;
    if (this.selectedCardId === card.instanceId) {
      this.selectedCardId = null;
      this.render();
      return;
    }
    if (card.target === 'enemy') {
      if (this.game.combat.enemies.filter((enemy) => enemy.hp > 0).length === 1) {
        const targetId = this.game.combat.enemies.find((enemy) => enemy.hp > 0)?.id;
        if (this.game.playCard(card.instanceId, targetId)) this.selectedCardId = null;
      } else {
        this.selectedCardId = card.instanceId;
      }
    } else {
      if (this.game.playCard(card.instanceId)) this.selectedCardId = null;
    }
    this.render();
  }

  spawnFloatingText({ targetId, value, kind }) {
    const anchor = targetId === 'player-avatar'
      ? document.getElementById('player-hp-text')
      : document.getElementById(targetId.startsWith('enemy') ? `enemy-anchor-${targetId.replace(/^enemy-/, '')}` : targetId) || document.getElementById(`enemy-anchor-${targetId}`) || document.getElementById(targetId);
    const rect = (anchor ?? this.root).getBoundingClientRect();
    const layerRect = this.elements.floatingLayer.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = `floating-number ${kind}`;
    el.textContent = value;
    el.style.left = `${rect.left - layerRect.left + rect.width / 2}px`;
    el.style.top = `${rect.top - layerRect.top + rect.height / 2}px`;
    this.elements.floatingLayer.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  shake(heavy) {
    this.elements.combatView.classList.remove('shake', 'shake-heavy');
    void this.elements.combatView.offsetWidth;
    this.elements.combatView.classList.add(heavy ? 'shake-heavy' : 'shake');
  }

  animateCardPlay(cardId) {
    const source = document.getElementById(`card-${cardId}`);
    const target = document.getElementById('combat-center-flair');
    if (!source || !target) return;
    const clone = source.cloneNode(true);
    clone.classList.add('card-flyer');
    const srcRect = source.getBoundingClientRect();
    const tgtRect = target.getBoundingClientRect();
    clone.style.left = `${srcRect.left}px`;
    clone.style.top = `${srcRect.top}px`;
    clone.style.width = `${srcRect.width}px`;
    clone.style.height = `${srcRect.height}px`;
    document.body.appendChild(clone);
    requestAnimationFrame(() => {
      clone.style.transform = `translate(${tgtRect.left - srcRect.left}px, ${tgtRect.top - srcRect.top - 150}px) scale(0.75)`;
      clone.style.opacity = '0';
    });
    setTimeout(() => clone.remove(), 600);
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.elements.floatingLayer.appendChild(toast);
    setTimeout(() => toast.remove(), 1400);
  }

  usePotion() {
    const potion = this.game.player.potion;
    if (!potion) {
      this.game.toast('No potion available.');
      return;
    }
    if (potion.type === 'heal') this.game.player.heal(potion.amount);
    if (potion.type === 'block') this.game.player.gainBlock(potion.amount, this.game);
    if (this.game.player.hasRelic('toyOrnithopter')) this.game.player.gainBlock(5, this.game);
    this.game.log(`Used ${potion.name}.`);
    this.game.player.potion = null;
    this.game.emitState();
  }
}

function intentGlyph(type) {
  if (type?.includes('attack')) return '⚔️';
  if (type === 'buff') return '✨';
  if (type === 'defend' || type === 'defendDebuff') return '🛡️';
  if (type === 'sleep') return '💤';
  return '❖';
}

function iconForCard(card) {
  if (card.tags.includes('fire')) return '🔥';
  if (card.type === 'attack') return '⚔️';
  if (card.type === 'skill') return '🛡️';
  if (card.type === 'power') return '✦';
  return '☠️';
}

function beautifyKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}
