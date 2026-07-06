export const NORTH_TRANSIT_SIZE = 320;

const POINTS = {
  topLeft:[0,0], top:[160,0], topRight:[320,0],
  topMidLeft:[80,80], topMidRight:[240,80],
  left:[0,160], centre:[160,160], right:[320,160],
  bottomMidLeft:[80,240], bottomMidRight:[240,240],
  bottomLeft:[0,320], bottom:[160,320], bottomRight:[320,320],
};

export const NORTH_TRANSIT_SIGN_SLOTS = [
  { sign:1,  points:[POINTS.top, POINTS.topMidLeft, POINTS.centre, POINTS.topMidRight] },
  { sign:2,  points:[POINTS.topLeft, POINTS.top, POINTS.topMidLeft] },
  { sign:3,  points:[POINTS.topLeft, POINTS.left, POINTS.topMidLeft] },
  { sign:4,  points:[POINTS.left, POINTS.topMidLeft, POINTS.centre, POINTS.bottomMidLeft] },
  { sign:5,  points:[POINTS.bottomLeft, POINTS.left, POINTS.bottomMidLeft] },
  { sign:6,  points:[POINTS.bottomLeft, POINTS.bottom, POINTS.bottomMidLeft] },
  { sign:7,  points:[POINTS.bottom, POINTS.bottomMidLeft, POINTS.centre, POINTS.bottomMidRight] },
  { sign:8,  points:[POINTS.bottomRight, POINTS.bottom, POINTS.bottomMidRight] },
  { sign:9,  points:[POINTS.bottomRight, POINTS.right, POINTS.bottomMidRight] },
  { sign:10, points:[POINTS.right, POINTS.topMidRight, POINTS.centre, POINTS.bottomMidRight] },
  { sign:11, points:[POINTS.topRight, POINTS.right, POINTS.topMidRight] },
  { sign:12, points:[POINTS.topRight, POINTS.top, POINTS.topMidRight] },
];

export function normalizePlanetaryChartStyle(value, fallback = 'south') {
  return value === 'north' || value === 'south' ? value : fallback;
}

export function groupPlanetPositionsByRashi(positions = []) {
  const grouped = Object.fromEntries(Array.from({ length:12 }, (_, index) => [index + 1, []]));
  for (const position of positions) {
    const rashi = Number(position?.rashi_num);
    if (Number.isInteger(rashi) && grouped[rashi]) grouped[rashi].push(position);
  }
  return grouped;
}
