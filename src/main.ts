import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GroundProjectedSkybox } from 'three/addons/objects/GroundProjectedSkybox.js';
import Stats from 'stats.js';

// variables init
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const scene = new THREE.Scene();
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const rgbeLoader = new RGBELoader();
const stats = new Stats();
stats.showPanel(0);
// document.body.appendChild(stats.dom);
const params = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// environment map
rgbeLoader.load('textures/environmentMap/puresky.hdr', (envMap) => {
  envMap.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = envMap;
  const skybox = new GroundProjectedSkybox(envMap);
  skybox.scale.setScalar(80);
  skybox.height = 50;
  skybox.radius = 1000;
  scene.add(skybox);
});

// camera
const camera = new THREE.PerspectiveCamera(
  60,
  params.width / params.height,
  0.1,
  100
);
camera.position.set(-2, 0, -8);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 15;
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI * 0.45;

// models loader
let mixer: THREE.AnimationMixer | null = null;
let foxModel: THREE.Group | null = null;
let idleAction: THREE.AnimationAction | null = null;

gltfLoader.load('models/Fox/glTF/Fox.gltf', (gltf) => {
  mixer = new THREE.AnimationMixer(gltf.scene);
  foxModel = gltf.scene;
  idleAction = mixer.clipAction(gltf.animations[0]);
  idleAction.play();

  foxModel.scale.set(0.01, 0.01, 0.01);
  foxModel.children[0].traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });

  scene.add(foxModel);
});

// particles
const particlesCount = 2000;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
  const i3 = i * 3;
  positions[i3] = (Math.random() - 0.5) * 100;
  positions[i3 + 1] = Math.abs((Math.random() - 0.5) * 100);
  positions[i3 + 2] = (Math.random() - 0.5) * 100;
}

const particleGeometry = new THREE.BufferGeometry();
const particleTexture = textureLoader.load('textures/particles/snow.png');
const particleMaterial = new THREE.PointsMaterial({
  color: 0xf0f8ff,
  map: particleTexture,
  transparent: true,
  alphaMap: particleTexture,
  size: 0.3,
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
    positions[i3 + 1] -= 0.5 * time * 2;
    if (positions[i3 + 1] <= 0.1) {
      positions[i3 + 1] = Math.abs(Math.random() * 5 + 10);
    }
  }

  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );
};

// ground object
const groundGeometry = new THREE.CircleGeometry(65, 32);
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
  metalness: 0.25,
  aoMap: groundAoTexture,
  map: groundColorTexture,
  displacementMap: groundHeightTexture,
  displacementScale: 0.01,
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
ground.visible = true;
scene.add(ground);

// lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
directionalLight.position.set(25, 3, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 256;
directionalLight.shadow.mapSize.height = 256;
const directionalLightHelper = new THREE.DirectionalLightHelper(
  directionalLight,
  3,
  0xf300f3
);
directionalLightHelper.visible = false;

scene.add(directionalLight, directionalLight.target);

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

// clock
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

  window.requestAnimationFrame(tick);
  stats.end();
};

tick();
