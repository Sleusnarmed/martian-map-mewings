import mercury from './planet-textures/mercury.jpg';
import venus from './planet-textures/venus.jpg';
import earth from './planet-textures/earth.jpg';
import mars from './planet-textures/mars.jpg';
import jupiter from './planet-textures/jupiter.jpg';
import saturn from './planet-textures/saturn.jpg';
import uranus from './planet-textures/uranus.jpg';
import neptune from './planet-textures/neptune.jpg';

export const WORLDS = [
  { id: 'mercury', name: 'Mercurio', kind: 'Planeta rocoso', color: '#a59b8a', texture: mercury, longitude: .7, rotation: .14, description: 'El planeta más pequeño y el más cercano al Sol.', detail: 'Su superficie está marcada por cráteres de impacto.' },
  { id: 'venus', name: 'Venus', kind: 'Planeta rocoso', color: '#eab775', texture: venus, longitude: .5, rotation: -.16, description: 'Una atmósfera densa atrapa el calor bajo una cubierta de nubes.', detail: 'Es el planeta más caliente del sistema solar.' },
  { id: 'earth', name: 'Tierra', kind: 'Planeta rocoso', color: '#62aaff', texture: earth, longitude: -.65, rotation: .23, description: 'Océanos, continentes y una atmósfera que sostiene la vida.', detail: 'Es nuestro punto de partida para explorar otros mundos.' },
  { id: 'mars', name: 'Marte', kind: 'Planeta rocoso', color: '#ea9872', texture: mars, longitude: 1.2, rotation: .21, description: 'Un antiguo delta en el cráter Jezero es el punto de partida de nuestra excursión.', detail: 'Destino de la misión · Wildcat Ridge' },
  { id: 'jupiter', name: 'Júpiter', kind: 'Gigante gaseoso', color: '#e2ae93', texture: jupiter, longitude: 1.9, rotation: .31, description: 'El planeta más grande del sistema solar.', detail: 'Sus bandas de nubes albergan tormentas como la Gran Mancha Roja.' },
  { id: 'saturn', name: 'Saturno', kind: 'Gigante gaseoso', color: '#dec49c', texture: saturn, longitude: .4, rotation: .29, description: 'Sus anillos están formados principalmente por hielo y roca.', detail: 'Es el segundo planeta más grande del sistema solar.' },
  { id: 'uranus', name: 'Urano', kind: 'Gigante helado', color: '#8fd6dc', texture: uranus, longitude: -.25, rotation: -.22, description: 'Su eje está inclinado casi de lado respecto a su órbita.', detail: 'El metano de su atmósfera contribuye a su tono azul verdoso.' },
  { id: 'neptune', name: 'Neptuno', kind: 'Gigante helado', color: '#6897ed', texture: neptune, longitude: .85, rotation: .26, description: 'El planeta más lejano al Sol.', detail: 'En su atmósfera soplan los vientos más rápidos del sistema solar.' },
].map(world => ({
  ...world,
  source: world.id === 'earth' ? 'https://science.nasa.gov/earth/' : `https://science.nasa.gov/solar-system/${world.id}/`,
}));
