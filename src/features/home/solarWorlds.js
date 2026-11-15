import mercury from './planet-textures/mercury.jpg';
import venus from './planet-textures/venus.jpg';
import earth from './planet-textures/earth.jpg';
import mars from './planet-textures/mars.jpg';
import jupiter from './planet-textures/jupiter.jpg';
import saturn from './planet-textures/saturn.jpg';
import uranus from './planet-textures/uranus.jpg';
import neptune from './planet-textures/neptune.jpg';

export const WORLDS = [
  { id: 'mercury', name: 'Mercury', kind: 'Rocky planet', color: '#a59b8a', texture: mercury, longitude: .7, rotation: .14 },
  { id: 'venus', name: 'Venus', kind: 'Rocky planet', color: '#eab775', texture: venus, longitude: .5, rotation: -.16 },
  { id: 'earth', name: 'Earth', kind: 'Rocky planet', color: '#62aaff', texture: earth, longitude: -.65, rotation: .23 },
  { id: 'mars', name: 'Mars', kind: 'Rocky planet', color: '#ea9872', texture: mars, longitude: 1.2, rotation: .21 },
  { id: 'jupiter', name: 'Jupiter', kind: 'Gas giant', color: '#e2ae93', texture: jupiter, longitude: 1.9, rotation: .31 },
  { id: 'saturn', name: 'Saturn', kind: 'Gas giant', color: '#dec49c', texture: saturn, longitude: .4, rotation: .29 },
  { id: 'uranus', name: 'Uranus', kind: 'Ice giant', color: '#8fd6dc', texture: uranus, longitude: -.25, rotation: -.22 },
  { id: 'neptune', name: 'Neptune', kind: 'Ice giant', color: '#6897ed', texture: neptune, longitude: .85, rotation: .26 },
].map(world => ({
  ...world,
  source: world.id === 'earth' ? 'https://science.nasa.gov/earth/' : `https://science.nasa.gov/solar-system/${world.id}/`,
}));
