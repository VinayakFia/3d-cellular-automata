import './style.css'
import javascriptLogo from './javascript.svg'
import * as THREE from 'three';
import { OrbitControls } from './OrbitControls';

const SIZE = 35;
const DECAY_STATES = 5;

let scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});
const controls = new OrbitControls( camera, renderer.domElement );

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(50);
controls.update();

const pointLight = new THREE.PointLight(0xFFFFFF);
const pointLight2 = new THREE.PointLight(0xFFFFFF);
const pointLight3 = new THREE.PointLight(0xFFFFFF);
pointLight.position.set(100, 100, 100);
pointLight2.position.set(SIZE/2, SIZE/2, SIZE/2);
pointLight3.position.set(-100, -100, -100);

let boxes = [];
const createBoxes = (size, decayStates) => {
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        if (Math.round(Math.random() * 0.7)) boxes.push({
          x,
          y,
          z,
          state: Math.round(Math.random() * DECAY_STATES)
        });
        else boxes.push({
          x,
          y,
          z,
          state: 0
        });
      }
    }  
  }
}
createBoxes(SIZE, DECAY_STATES);

const renderBoxes = () => {
  scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  for (const location of boxes) {
    if (location.state <= 0) continue;
    const material = new THREE.MeshStandardMaterial({color: 0xFF6347})
    const box = new THREE.Mesh(geometry, material);
    box.position.set(location.x, location.y, location.z)
    scene.add(box);
  }
  scene.add(pointLight);
  scene.add(pointLight2);
}
renderBoxes();

const validLocation = (x, y, z) => {
  if (x < 0 || x >= SIZE) return false;
  if (y < 0 || y >= SIZE) return false;
  if (z < 0 || z >= SIZE) return false;
  return true;
}

const getBoxState = (x, y, z) => {
  if (!validLocation(x, y, z)) return 0;
  return boxes[SIZE**2 * x + SIZE * y + z].state;
}

const nextBoxes = Array(SIZE**3).fill(0);
const setBoxAlive = (x, y, z) => {
  nextBoxes[SIZE**2 * x + SIZE * y + z] = {
    x,
    y,
    z,
    state: DECAY_STATES
  }
}

const setBoxDecay = (x, y, z) => {
  nextBoxes[SIZE**2 * x + SIZE * y + z] = {
    x,
    y,
    z,
    state: getBoxState(x, y, z) - 1
  }
}

// TODO: Figure out rule implmenetation, i.e. will there be a deadRule?
// aliveRule e.g. = [4, 5, 6, 7]
const stepBox = (xOriginal, yOriginal, zOriginal, aliveRule, surviveRule) => {
  let count = 0;
  for (let x = xOriginal - 1; x < xOriginal + 1; x++) {
    for (let y = yOriginal - 1; y < yOriginal + 1; y++) {
      for (let z = zOriginal - 1; z < zOriginal + 1; z++) {
        if (x === y && y === z) continue;
        if (getBoxState(x, y, z) > 0) count++;
      }
    }  
  }
  if ((surviveRule.includes(count) && getBoxState(xOriginal, yOriginal, zOriginal === 1)
      || (aliveRule.includes(count) && getBoxState(xOriginal, yOriginal, zOriginal) === 0))) 
    setBoxAlive(xOriginal, yOriginal, zOriginal);
  else setBoxDecay(xOriginal, yOriginal, zOriginal);
}

const step = () => {
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      for (let z = 0; z < SIZE; z++) {
        stepBox(x, y, z, [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26], 
        [13, 14, 17, 18]);
      }
    }  
  }
  boxes = nextBoxes;
}

function animate() {
  requestAnimationFrame(animate);
  step();
  renderBoxes();
  controls.update();
  renderer.render(scene, camera);
}

animate();