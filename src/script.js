import './style.css';

import * as THREE from 'three';
import * as dat from 'dat.gui';

import { MeshLine, MeshLineMaterial } from 'three.meshline';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module';

// import fragment from './shaders/composeFrag.js';
// import vertex from './shaders/composeVert.js';

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
    gltf.scene.scale.set(0.01, 0.014, 0.01);
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Update shadow map from top sun light on next render
    sunLightTop.shadow.needsUpdate = true;
    scene.add(gltf.scene);
  }, 
  null, 
  (error) => {
    console.log('An error happened: ', error);
  });

// Railway mesh
const animatedMeshLineMaterial = new MeshLineMaterial({
  transparent: true,
  lineWidth: 0.008,
  color: new THREE.Color('#ff2248'),
  sizeAttenuation: 0,
  dashArray: 3,     // always has to be the double of the line
  dashOffset: 0,    // start the dash at zero
  dashRatio: 0.99,  // visible length range min: 0.99, max: 0.5
});

const staticMeshLineMaterial = new MeshLineMaterial({
  transparent: true,
  opacity: 0.4,
  lineWidth: 0.005,
  color: new THREE.Color('#ff2248'),
  sizeAttenuation: 0,
});

const updateLine = (deltaTime) => {
// Check if the dash is out to stop animate it.
  if (animatedMeshLineMaterial.uniforms.dashOffset.value < -1) {
    animatedMeshLineMaterial.uniforms.dashOffset.value = 0;
  } 

  // Decrement the dashOffset value to animate the path with the dash.
  animatedMeshLineMaterial.uniforms.dashOffset.value -= deltaTime * 0.03;
};

const objLoader = new OBJLoader();

objLoader.load('models/arosa-rhb-railway.obj',
  (obj) => {
    obj.children.forEach((child) => {
      const meshLine = new MeshLine();
      meshLine.setPoints(child.geometry.attributes.position.array);
      const animatedMesh = new THREE.Mesh(meshLine, animatedMeshLineMaterial);
      const staticMesh = new THREE.Mesh(meshLine, staticMeshLineMaterial);
      animatedMesh.scale.set(0.01, 0.014, 0.01);
      staticMesh.scale.set(0.01, 0.014, 0.01);
      animatedMesh.translateY(0.03);
      staticMesh.translateY(0.02);
      scene.add(animatedMesh);
      scene.add(staticMesh);
    });
  }, 
  null, 
  (error) => {
    console.log('An error happened: ', error);
  });

// Plane
const planeMaterial = new THREE.MeshStandardMaterial({ color: 'white', side: THREE.DoubleSide });
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
// camera.position.set(-38, 24, -32);
camera.position.set(25, 25, 8);
camera.lookAt(0,0,0);
scene.add(camera);

// Add camera position to gui
const guiCamFolder = gui.addFolder('Camera');
guiCamFolder.add(camera.position, 'x').listen();
guiCamFolder.add(camera.position, 'y').listen();
guiCamFolder.add(camera.position, 'z').listen();
guiCamFolder.open();

// Controls
const controls = new MapControls(camera, canvas);
controls.enableDamping = true;

document.addEventListener('keydown', (ev) => {
  if (ev.code === 'ArrowUp') {
    updateLine(0.1);
  } else if (ev.code === 'ArrowDown') {
    updateLine(-0.1);
  }
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  // powerPreference: 'high-performance',
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
 
/**
 * Post-Processing Passes
 */
// TODO Add bloom effect

/**
 * Render loop
 */

const clock = new THREE.Clock();

const render = () => {
  const deltaTime = clock.getDelta();
  // Update objects
  updateLine(deltaTime);

  // Update Orbital Controls
  controls.update(deltaTime);

  // Render
  renderer.render(scene, camera);

  // Update stats
  stats.update();

  // Call render again on the next frame
  window.requestAnimationFrame(render);
};

render();