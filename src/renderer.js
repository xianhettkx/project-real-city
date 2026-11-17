/**
 * PROJECT REAL CITY — High Quality Renderer
 * WebGL2 + PBR + Shadows + Post-processing (mobile tuned for iPhone 14 Pro)
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export class RendererSystem {
  constructor(container) {
    this.container = container;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // cap for mobile

    // WebGL2 renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // we use SMAA
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.physicallyCorrectLights = true;

    // Check WebGL2
    const gl = this.renderer.getContext();
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
    console.log('[Renderer] WebGL2:', this.isWebGL2);

    container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87a0c0);
    this.scene.fog = new THREE.FogExp2(0x9ab0c8, 0.008);

    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.15, 280);
    this.camera.position.set(0, 1.7, 6);

    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0.35, // strength
      0.55, // radius
      0.85  // threshold
    );
    this.composer.addPass(this.bloomPass);

    // SMAA for better AA on mobile
    this.smaaPass = new SMAAPass(this.width * this.pixelRatio, this.height * this.pixelRatio);
    this.composer.addPass(this.smaaPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    // Lights
    this.sun = new THREE.DirectionalLight(0xfff4e0, 4.5);
    this.sun.position.set(35, 55, 20);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 160;
    this.sun.shadow.camera.left = -40;
    this.sun.shadow.camera.right = 40;
    this.sun.shadow.camera.top = 40;
    this.sun.shadow.camera.bottom = -40;
    this.sun.shadow.bias = -0.00025;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xb8d0f0, 0x3a2f28, 0.55);
    this.scene.add(this.hemi);

    this.ambient = new THREE.AmbientLight(0x404860, 0.25);
    this.scene.add(this.ambient);

    // Quality preset
    this.quality = 'high'; // extreme | high | balanced

    window.addEventListener('resize', () => this.onResize());
  }

  async loadEnvironment(url) {
    return new Promise((resolve, reject) => {
      new RGBELoader().load(url, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = texture;
        // subtle background from env (or keep solid + fog)
        // this.scene.background = texture;
        resolve(texture);
      }, undefined, reject);
    });
  }

  setQuality(level) {
    this.quality = level;
    if (level === 'extreme') {
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
      this.bloomPass.strength = 0.42;
      this.sun.shadow.mapSize.set(2048, 2048);
    } else if (level === 'high') {
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      this.bloomPass.strength = 0.35;
      this.sun.shadow.mapSize.set(1024, 1024);
    } else {
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      this.bloomPass.strength = 0.25;
      this.sun.shadow.mapSize.set(512, 512);
    }
    this.renderer.setPixelRatio(this.pixelRatio);
    this.onResize();
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.smaaPass.setSize(this.width * this.pixelRatio, this.height * this.pixelRatio);
  }

  render() {
    this.composer.render();
  }
}
