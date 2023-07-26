import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'stats.js';
import GUI from 'lil-gui';

// variables init
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const scene = new THREE.Scene();
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const gui = new GUI();
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
const params = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// fog
const fog = new THREE.Fog(0xffffff, 3, 20);
scene.fog = fog;

// camera
const camera = new THREE.PerspectiveCamera(
  60,
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
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 25;
controls.minPolarAngle = 0.75;
controls.maxPolarAngle = Math.PI * 0.475;
controls.autoRotate = false;

// models loader
let mixer: THREE.AnimationMixer | null = null;
let foxModel: THREE.Group | null = null;
let idleAction: THREE.AnimationAction | null = null;
let walkAction: THREE.AnimationAction | null = null;
let runAction: THREE.AnimationAction | null = null;

gltfLoader.load('models/Fox/glTF/Fox.gltf', (gltf) => {
  mixer = new THREE.AnimationMixer(gltf.scene);
  foxModel = gltf.scene;
  idleAction = mixer.clipAction(gltf.animations[0]);
  walkAction = mixer.clipAction(gltf.animations[1]);
  runAction = mixer.clipAction(gltf.animations[2]);
  idleAction.play();

  foxModel.scale.set(0.01, 0.01, 0.01);

  foxModel.children[0].traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });

  controls.target = new THREE.Vector3(
    foxModel.position.x,
    foxModel.position.y + 0.5,
    foxModel.position.z
  );
  scene.add(foxModel);
});

// particles
const particlesCount = 4800;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
  const i3 = i * 3;
  positions[i3] = (Math.random() - 0.5) * 50;
  positions[i3 + 1] = Math.abs((Math.random() - 0.5) * 50);
  positions[i3 + 2] = (Math.random() - 0.5) * 50;
}

const particleGeometry = new THREE.BufferGeometry();
const particleTexture = textureLoader.load('textures/particles/snow.png');
const particleMaterial = new THREE.PointsMaterial({
  color: 0xf0f8ff,
  map: particleTexture,
  transparent: true,
  alphaMap: particleTexture,
  size: 0.175,
  sizeAttenuation: true,
  depthWrite: true,
});

particleGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positions, 3)
);

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

const animateParticles = (time: number) => {
  for (let i = 0; i < particlesCount; i++) {
    const i3 = i * 3;
    positions[i3 + 1] -= 0.2 * time * 2;
    if (positions[i3 + 1] <= 0.1) {
      positions[i3 + 1] = Math.abs(Math.random() * 3 + 5);
    }
  }

  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );
};

// ground object
const groundGeometry = new THREE.PlaneGeometry(50, 50, 100, 100);
const groundAoTexture = textureLoader.load('textures/objects/Snow/ao.jpg');
const groundColorTexture = textureLoader.load(
  'textures/objects/Snow/color.jpg'
);
const groundHeightTexture = textureLoader.load(
  'textures/objects/Snow/height.png'
);
const groundNormalTexture = textureLoader.load(
  'textures/objects/Snow/normal.jpg'
);
const groundRoughTexture = textureLoader.load(
  'textures/objects/Snow/rough.jpg'
);

const groundMaterial = new THREE.MeshStandardMaterial({
  metalness: 0,
  aoMap: groundAoTexture,
  map: groundColorTexture,
  displacementMap: groundHeightTexture,
  displacementScale: 0.1,
  normalMap: groundNormalTexture,
  roughnessMap: groundRoughTexture,
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.geometry.setAttribute(
  'uv2',
  new THREE.Float32BufferAttribute(ground.geometry.attributes.uv.array, 2)
);
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
const debugParams = {
  resetCam: () => {
    camera.fov = 60;
    camera.position.set(2, 2, 5);
    camera.updateProjectionMatrix();
    controls.dampingFactor = 0.05;
  },
  idleAnimation: () => {
    if (idleAction && walkAction && runAction) {
      walkAction.stop();
      runAction.stop();
      idleAction.play();
    }
  },
  walkAnimation: () => {
    if (idleAction && walkAction && runAction) {
      idleAction.stop();
      runAction.stop();
      walkAction.play();
    }
  },
  runAnimation: () => {
    if (idleAction && walkAction && runAction) {
      idleAction.stop();
      walkAction.stop();
      runAction.play();
    }
  },
  disableAnimation: () => {
    if (idleAction && walkAction && runAction) {
      idleAction.stop();
      walkAction.stop();
      runAction.stop();
    }
  },
};

// camera debug
const cameraDebug = gui.addFolder('Camera').open();
cameraDebug.add(controls, 'autoRotate').name('Auto Rotate Cam');
cameraDebug
  .add(camera, 'fov')
  .min(45)
  .max(75)
  .name('Camera FOV')
  .onChange(() => camera.updateProjectionMatrix())
  .listen(true)
  .updateDisplay();
cameraDebug
  .add(controls, 'dampingFactor')
  .min(0)
  .max(0.1)
  .step(0.01)
  .name('Damping Factor')
  .listen(true)
  .updateDisplay();
cameraDebug.add(debugParams, 'resetCam').name('Reset Camera Settings');

// lighting debug
const lightDebug = gui.addFolder('Lighting').open();
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

// fox debug
const foxDebug = gui.addFolder('Fox Animation').open();
foxDebug.add(debugParams, 'idleAnimation').name('Idle');
foxDebug.add(debugParams, 'walkAnimation').name('Walk');
foxDebug.add(debugParams, 'runAnimation').name('Run');
foxDebug.add(debugParams, 'disableAnimation').name('Disable');

const clock = new THREE.Clock();
let prevElapsedTime = 0;

const tick = () => {
  stats.begin();
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - prevElapsedTime;
  prevElapsedTime = elapsedTime;

  // animations
  if (mixer) mixer.update(deltaTime);
  animateParticles(deltaTime);

  // constant update
  controls.update();
  renderer.render(scene, camera);
  stats.end();

  window.requestAnimationFrame(tick);
};

tick();
