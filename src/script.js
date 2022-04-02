import './style.css';

import * as THREE from 'three';
import * as dat from 'dat.gui';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module';

// Debug
const gui = new dat.GUI();
const stats = Stats();
document.body.appendChild(stats.dom);

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Lights
 */ 

// Ambient lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Directional sun light
const sunLightTop = new THREE.DirectionalLight(0xffefbf, 0.9);
sunLightTop.position.set(0, 30, 0);
sunLightTop.castShadow = true;
scene.add(sunLightTop);

// Setup shadow map
sunLightTop.shadow.mapSize.width = 64;
sunLightTop.shadow.mapSize.height = 64;
sunLightTop.shadow.autoUpdate = false;

const d = 35;
sunLightTop.shadow.camera.left = - d;
sunLightTop.shadow.camera.right = d;
sunLightTop.shadow.camera.top = d;
sunLightTop.shadow.camera.bottom = - d;

sunLightTop.shadow.camera.far = 50;
sunLightTop.shadow.bias = -0.0001;

const sunLight = new THREE.DirectionalLight(0xffefbf, 0.9);
sunLight.position.set(-40, 20, 0);
scene.add(sunLight);

// GLTF Loader
const gltfLoader = new GLTFLoader();

// Terrain mesh
gltfLoader.load('models/arosa-rhb.glb',
  (gltf) => {
    sunLightTop.target = gltf.scene;
    gltf.scene.scale.set(0.01,0.01,0.01);
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Update shadow map from top sun light on next render
    sunLightTop.shadow.needsUpdate = true;
    scene.add(gltf.scene);
  }, (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  }, (error) => {
    console.log('An error happened: ', error);
  });

// Railway mesh
gltfLoader.load('models/arosa-rhb-railway.glb',
  (gltf) => {
    gltf.scene.scale.set(0.01,0.01,0.01);
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(gltf.scene);
  }, (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  }, (error) => {
    console.log('An error happened: ', error);
  });

// Plane
const planeMaterial = new THREE.MeshStandardMaterial({ color: 'darkgrey', side: THREE.DoubleSide });
const plane = new THREE.PlaneGeometry(80, 80);
const planeMesh = new THREE.Mesh(plane, planeMaterial);
planeMesh.receiveShadow = true;
planeMesh.position.set(0, -4, 0);
planeMesh.rotateX(Math.PI * 0.5);
scene.add(planeMesh);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 20000);
camera.position.set(-38, 24, -32);
scene.add(camera);

// Add camera position to gui
const guiCamFolder = gui.addFolder('Camera');
guiCamFolder.add(camera.position, 'x').listen();
guiCamFolder.add(camera.position, 'y').listen();
guiCamFolder.add(camera.position, 'z').listen();
guiCamFolder.open();

// Controls
const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/**
 * Animate
 */

// const clock = new THREE.Clock();

const tick = () => {

  // const elapsedTime = clock.getElapsedTime();

  // Update objects
  // sphere.rotation.y = .5 * elapsedTime;

  // Update Orbital Controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Update stats
  stats.update();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();