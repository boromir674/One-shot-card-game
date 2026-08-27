const NODE_TYPES = {
  combat: { icon: '⚔️', label: 'Combat' },
  elite: { icon: '💀', label: 'Elite' },
  rest: { icon: '🔥', label: 'Rest Site' },
  shop: { icon: '💰', label: 'Shop' },
  event: { icon: '❓', label: 'Unknown' },
  boss: { icon: '👑', label: 'Boss' }
};

export function generateActMap() {
  const laneCount = 5;
  const floors = [];
  for (let floor = 1; floor <= 15; floor += 1) {
    if (floor === 15) {
      floors.push([{ id: 'f15-boss', floor, lane: 2, type: 'boss', connections: [] }]);
      continue;
    }
    if (floor === 14) {
      floors.push(makeNodes(floor, [2], ['rest']));
      continue;
    }
    const lanes = floor === 1 ? [1, 2, 3] : chooseLanes(laneCount, floor <= 3 ? 3 : 4);
    const nodes = lanes.map((lane, index) => ({
      id: `f${floor}-n${index}-${lane}`,
      floor,
      lane,
      type: pickNodeType(floor),
      connections: []
    }));
    if (floor === 1) nodes.forEach((node) => { node.type = 'combat'; });
    floors.push(nodes);
  }

  for (let i = 0; i < floors.length - 1; i += 1) {
    const current = floors[i];
    const next = floors[i + 1];
    current.forEach((node) => {
      const candidates = next
        .filter((candidate) => Math.abs(candidate.lane - node.lane) <= 1)
        .sort((a, b) => Math.abs(a.lane - node.lane) - Math.abs(b.lane - node.lane));
      const count = Math.min(candidates.length, Math.random() > 0.45 ? 2 : 1);
      node.connections = candidates.slice(0, count).map((candidate) => candidate.id);
    });
  }

  const nodeIndex = Object.fromEntries(floors.flat().map((node) => [node.id, node]));
  return {
    act: 1,
    floors,
    nodeIndex,
    currentNodeId: null,
    availableNodeIds: floors[0].map((node) => node.id),
    visitedNodeIds: []
  };
}

export function getNodeMeta(type) {
  return NODE_TYPES[type] ?? NODE_TYPES.event;
}

function pickNodeType(floor) {
  const roll = Math.random();
  if (floor >= 12 && roll > 0.85) return 'elite';
  if (roll < 0.5) return 'combat';
  if (roll < 0.63) return 'event';
  if (roll < 0.76) return 'shop';
  if (roll < 0.9) return 'rest';
  return 'elite';
}

function chooseLanes(total, count) {
  const lanes = Array.from({ length: total }, (_, index) => index);
  for (let i = lanes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  return lanes.slice(0, count).sort((a, b) => a - b);
}

function makeNodes(floor, lanes, types) {
  return lanes.map((lane, index) => ({ id: `f${floor}-n${index}-${lane}`, floor, lane, type: types[index] ?? types[0], connections: [] }));
}
