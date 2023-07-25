import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GUI from 'lil-gui';

// variables init
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const scene = new THREE.Scene();
const gui = new GUI();
const params = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// models loader
const gltfLoader = new GLTFLoader();
let mixer: THREE.AnimationMixer | null = null;

gltfLoader.load('models/Fox/glTF/Fox.gltf', (gltf) => {
  mixer = new THREE.AnimationMixer(gltf.scene);
  const action = mixer.clipAction(gltf.animations[1]);
  action.play();

  gltf.scene.scale.set(0.01, 0.01, 0.01);
  scene.add(gltf.scene);
});

// camera
const camera = new THREE.PerspectiveCamera(
  45,
  params.width / params.height,
  1,
  20
);
camera.position.z = 5;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// lightning
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(params.width, params.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.render(scene, camera);

window.addEventListener('resize', () => {
  params.width = window.innerWidth;
  params.height = window.innerHeight;

  camera.aspect = params.width / params.height;
  camera.updateProjectionMatrix();

  renderer.setSize(params.width, params.height);
});

// debuggers
const cameraDebug = gui.addFolder('Camera');
cameraDebug
  .add(controls, 'dampingFactor')
  .min(0.01)
  .max(0.1)
  .step(0.01)
  .name('Damping Factor');

const lightDebug = gui.addFolder('Lightning');
lightDebug
  .add(ambientLight, 'intensity')
  .min(0)
  .max(1)
  .step(0.1)
  .name('Ambient Intensity');

const clock = new THREE.Clock();
let prevElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - prevElapsedTime;
  prevElapsedTime = elapsedTime;

  // animations
  if (mixer) mixer.update(deltaTime);

  // constant update
  controls.update();
  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
