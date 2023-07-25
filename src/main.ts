import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'stats.js';
import GUI from 'lil-gui';

// variables init
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const scene = new THREE.Scene();
const gltfLoader = new GLTFLoader();
const gui = new GUI();
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
const params = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// camera
const camera = new THREE.PerspectiveCamera(
  45,
  params.width / params.height,
  0.1,
  100
);
camera.position.x = 2;
camera.position.y = 2;
camera.position.z = 5;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = false;

// models loader
let mixer: THREE.AnimationMixer | null = null;
let foxModel = null;

gltfLoader.load('models/Fox/glTF/Fox.gltf', (gltf) => {
  mixer = new THREE.AnimationMixer(gltf.scene);
  foxModel = gltf.scene;
  const walkAction = mixer.clipAction(gltf.animations[1]);
  walkAction.play();

  foxModel.scale.set(0.01, 0.01, 0.01);

  foxModel.children[0].traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });

  scene.add(foxModel);
});

// ground object
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshStandardMaterial();
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI * 0.5;
ground.receiveShadow = true;
scene.add(ground);

// lightning
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-5, 5, -5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(ambientLight, directionalLight);

// renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(params.width, params.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
cameraDebug.add(controls, 'autoRotate').name('Auto Rotate Cam');
cameraDebug
  .add(controls, 'dampingFactor')
  .min(0)
  .max(0.1)
  .step(0.01)
  .name('Damping Factor');

const lightDebug = gui.addFolder('Lighting');
lightDebug.add(ground, 'receiveShadow').name('Enable Shadow');
lightDebug
  .add(ambientLight, 'intensity')
  .min(0)
  .max(1)
  .step(0.1)
  .name('Ambient Intensity');
lightDebug
  .add(directionalLight, 'intensity')
  .min(0)
  .max(1)
  .step(0.1)
  .name('Light Intensity');

const clock = new THREE.Clock();
let prevElapsedTime = 0;

const tick = () => {
  stats.begin();
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - prevElapsedTime;
  prevElapsedTime = elapsedTime;

  // animations
  if (mixer) mixer.update(deltaTime);

  // constant update
  controls.update();
  renderer.render(scene, camera);
  stats.end();

  window.requestAnimationFrame(tick);
};

tick();
