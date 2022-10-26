import "./style.css";
import javascriptLogo from "./javascript.svg";
import * as THREE from "three";
import { OrbitControls } from "./OrbitControls";

const SIZE = 100;
const DECAY_STATES = 1;
const SURVIVE_RULE = [
  0, 1, 2, 4, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 26,
];
const ALIVE_RULE = [9, 10, 16, 23, 24];

let scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / innerHeight,
  0.1,
  1000
);
camera.position.set((3 * SIZE) / 4, (3 * SIZE) / 4, (3 * SIZE) / 4);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
});
const controls = new OrbitControls(camera, renderer.domElement);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
controls.update();

const pointLight = new THREE.PointLight(0xffffff);
const pointLight2 = new THREE.PointLight(0xffffff);
const pointLight3 = new THREE.PointLight(0xffffff);
pointLight.position.set(100, 100, 100);
pointLight2.position.set(SIZE / 2, SIZE / 2, SIZE / 2);
pointLight3.position.set(-100, -100, -100);

let boxes = [];
const createBoxes = (size, decayStates) => {
  const midRegion = Math.round(size / 6);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        if (
          x > size / 6 + midRegion ||
          x < size / 6 - midRegion ||
          y > size / 6 + midRegion ||
          y < size / 6 - midRegion ||
          z > size / 6 + midRegion ||
          z < size / 6 - midRegion
        ) {
          boxes.push({
            x,
            y,
            z,
            state: 0,
          });
          continue;
        }

        if (Math.round(Math.random() * 0.99))
          boxes.push({
            x,
            y,
            z,
            state: DECAY_STATES,
          });
        else
          boxes.push({
            x,
            y,
            z,
            state: 0,
          });
      }
    }
  }
};
createBoxes(SIZE, DECAY_STATES);

const startCol = { r: 251, g: 80, b: 18 };
const endCol = { r: 3, g: 252, b: 186 };
const gradient = Array(DECAY_STATES + 1)
  .fill(1)
  .map(
    (x, i) =>
      (x = {
        r: (startCol.r + ((endCol.r - startCol.r) * i) / DECAY_STATES) / 255,
        g: (startCol.g + ((endCol.g - startCol.g) * i) / DECAY_STATES) / 255,
        b: (startCol.g + ((endCol.b - startCol.b) * i) / DECAY_STATES) / 255,
      })
  );
const materials = Array(DECAY_STATES + 1)
  .fill(1)
  .map((x, i) => {
    const material = new THREE.MeshStandardMaterial();
    material.transparent = true;
    material.opacity = 0.5;
    material.color.setRGB(gradient[i].r, gradient[i].g, gradient[i].b);
    return material;
  });
console.log(materials);
const renderBoxes = () => {
  scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  for (const location of boxes) {
    if (location.state <= 0) continue;
    //console.log(location.state);
    //console.log(gradient[location.state].r);
    const box = new THREE.Mesh(geometry, materials[location.state]);
    box.position.set(
      location.x - SIZE / 2,
      location.y - SIZE / 2,
      location.z - SIZE / 2
    );
    scene.add(box);
  }
  scene.add(pointLight);
  scene.add(pointLight2);
  scene.add(pointLight3);
};
renderBoxes();

const validLocation = (x, y, z) => {
  if (x < 0 || x >= SIZE) return false;
  if (y < 0 || y >= SIZE) return false;
  if (z < 0 || z >= SIZE) return false;
  return true;
};

const getIndex = (x, y, z) => {
  return SIZE ** 2 * x + SIZE * y + z;
};

const getBoxState = (x, y, z) => {
  if (!validLocation(x, y, z)) return 0;
  return boxes[getIndex(x, y, z)].state;
};

const nextBoxes = Array(SIZE ** 3).fill(0);
const setBoxAlive = (x, y, z) => {
  nextBoxes[getIndex(x, y, z)] = {
    x,
    y,
    z,
    state: DECAY_STATES,
  };
};

const setBoxDecay = (x, y, z) => {
  nextBoxes[getIndex(x, y, z)] = {
    x,
    y,
    z,
    state: Math.max(getBoxState(x, y, z) - 1, 0),
  };
};

const stepBox = (xOriginal, yOriginal, zOriginal, aliveRule, surviveRule) => {
  let count = 0;
  for (let x = xOriginal - 1; x <= xOriginal + 1; x++) {
    for (let y = yOriginal - 1; y <= yOriginal + 1; y++) {
      for (let z = zOriginal - 1; z <= zOriginal + 1; z++) {
        if (x === y && y === z) continue;
        if (getBoxState(x, y, z) > 0) count++;
      }
    }
  }
  if (
    (surviveRule.includes(count) &&
      getBoxState(xOriginal, yOriginal, zOriginal) === 1) ||
    (aliveRule.includes(count) &&
      getBoxState(xOriginal, yOriginal, zOriginal) === 0)
  ) {
    setBoxAlive(xOriginal, yOriginal, zOriginal);
  } else setBoxDecay(xOriginal, yOriginal, zOriginal);
};

const step = () => {
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      for (let z = 0; z < SIZE; z++) {
        stepBox(x, y, z, ALIVE_RULE, SURVIVE_RULE);
      }
    }
  }
  boxes = nextBoxes;
};

let i = 0;

function animate() {
  requestAnimationFrame(animate);
  renderBoxes();
  step();
  controls.update();
  renderer.render(scene, camera);
  i++;
}

animate();
