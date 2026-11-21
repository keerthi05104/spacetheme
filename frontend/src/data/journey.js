// Journey stages. `ship` is the shuttle position, `cam.off` is the camera offset relative to the
// ship and `cam.look` is the look-at offset relative to the ship.

export const STAGES = [
  {
    id: 'earth',
    short: 'Earth',
    title: 'Launch Pad: Earth',
    blurb: 'The Odyssey shuttle waits above a glowing Earth. Systems are green and the crew is ready.',
    ship: [0, 0, 8],
    cam: { off: [7.5, 2.6, 6.5], look: [-1, 0, -1] },
  },
  {
    id: 'board',
    short: 'Boarding',
    title: 'Boarding the Odyssey',
    blurb: 'The hatch opens and you step inside. Take your seat in the cockpit and strap in.',
    ship: [0, 0, 8],
    cam: { off: [0, 0.42, -0.55], look: [0, 0.3, -12] },
    cockpit: true,
  },
  {
    id: 'mars',
    short: 'Mars',
    title: 'Mars Flyby',
    blurb: 'Thrusters at full burn. We skim past the red planet and its two tiny moons.',
    ship: [1.5, 0.5, -70],
    cam: { off: [-8, 2.2, 8], look: [4, 0, -4] },
  },
  {
    id: 'belt',
    short: 'Asteroids',
    title: 'The Asteroid Field',
    blurb: 'Tumbling rock all around. Our autopilot threads the needle with a hair to spare.',
    ship: [0, 0, -135],
    cam: { off: [0, 2.2, 9], look: [0, 0, -8] },
  },
  {
    id: 'jupiter',
    short: 'Jupiter',
    title: 'Jupiter Close Pass',
    blurb: 'The giant fills the window, its Great Red Spot staring back as the Galilean moons drift by.',
    ship: [-2, 0.5, -205],
    cam: { off: [9, 2.4, 9], look: [-7, 0, -4] },
  },
  {
    id: 'nebula',
    short: 'Nebula',
    title: 'Through the Nebula',
    blurb: 'Violet and cyan clouds glow around the hull. The station is just ahead.',
    ship: [0, 0, -268],
    cam: { off: [0, 2, 9], look: [0, 0, -8] },
  },
  {
    id: 'arrive',
    short: 'Arrival',
    title: 'Arrival: Cosmic Dine Station',
    blurb: 'Welcome to the orbital ring, floating above Saturn. Your table is waiting.',
    ship: [0, 0, -318],
    cam: { off: [-15, 5, 17], look: [0, 1, -22] },
  },
];

export const JOURNEY_STORAGE_DEFAULT = { stage: 0, completed: false };
export const EARTH_STAGE_Z = 8;
