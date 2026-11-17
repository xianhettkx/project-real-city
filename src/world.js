/**
 * PROJECT REAL CITY — World / Street Builder
 * High detail single street block first (quality over scale)
 */

import * as THREE from 'three';

export class World {
  constructor(scene, rendererSystem) {
    this.scene = scene;
    this.rendererSystem = rendererSystem;
    this.objects = [];
    this.textureLoader = new THREE.TextureLoader();
  }

  async init() {
    await this._loadTextures();
    this._buildGround();
    this._buildRoad();
    this._buildSidewalks();
    this._buildBuildings();
    this._buildStreetProps();
    this._buildStreetLights();
  }

  async _loadTextures() {
    const load = (url, colorSpace = THREE.NoColorSpace) => {
      return new Promise((resolve) => {
        this.textureLoader.load(url, (tex) => {
          tex.colorSpace = colorSpace;
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.anisotropy = this.rendererSystem.renderer.capabilities.getMaxAnisotropy();
          resolve(tex);
        }, undefined, () => {
          console.warn('Texture failed:', url);
          resolve(null);
        });
      });
    };

    this.tex = {};
    this.tex.asphaltDiff = await load('./assets/textures/asphalt/asphalt_diff_1k.jpg', THREE.SRGBColorSpace);
    this.tex.asphaltNor = await load('./assets/textures/asphalt/asphalt_nor_1k.jpg');
    this.tex.asphaltRough = await load('./assets/textures/asphalt/asphalt_rough_1k.jpg');
    this.tex.concreteDiff = await load('./assets/textures/concrete/concrete_diff_1k.jpg', THREE.SRGBColorSpace);
    this.tex.concreteNor = await load('./assets/textures/concrete/concrete_nor_1k.jpg');
    this.tex.concreteRough = await load('./assets/textures/concrete/concrete_rough_1k.jpg');

    if (this.tex.asphaltDiff) {
      this.tex.asphaltDiff.repeat.set(12, 4);
      this.tex.asphaltNor.repeat.set(12, 4);
      this.tex.asphaltRough.repeat.set(12, 4);
    }
    if (this.tex.concreteDiff) {
      this.tex.concreteDiff.repeat.set(6, 6);
      this.tex.concreteNor.repeat.set(6, 6);
      this.tex.concreteRough.repeat.set(6, 6);
    }
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(120, 80);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.95,
      metalness: 0.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -0.02;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  _buildRoad() {
    const roadW = 10;
    const roadL = 48;
    const geo = new THREE.PlaneGeometry(roadW, roadL, 1, 8);
    const mat = new THREE.MeshStandardMaterial({
      map: this.tex.asphaltDiff,
      normalMap: this.tex.asphaltNor,
      roughnessMap: this.tex.asphaltRough,
      roughness: 0.88,
      metalness: 0.02,
      envMapIntensity: 0.35
    });
    if (this.tex.asphaltNor) mat.normalScale.set(0.9, 0.9);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.01, 0);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.objects.push(mesh);

    this._addLaneMarkings(roadL);
  }

  _addLaneMarkings(length) {
    const markMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0e8,
      roughness: 0.55,
      metalness: 0.0,
      emissive: 0x222218,
      emissiveIntensity: 0.15
    });

    const dashLen = 2.2;
    const gap = 1.8;
    for (let z = -length / 2 + 1; z < length / 2; z += dashLen + gap) {
      const geo = new THREE.PlaneGeometry(0.18, dashLen);
      const m = new THREE.Mesh(geo, markMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, 0.025, z + dashLen / 2);
      this.scene.add(m);
    }

    for (const x of [-4.6, 4.6]) {
      const geo = new THREE.PlaneGeometry(0.14, length - 2);
      const m = new THREE.Mesh(geo, markMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.022, 0);
      this.scene.add(m);
    }
  }

  _buildSidewalks() {
    const mat = new THREE.MeshStandardMaterial({
      map: this.tex.concreteDiff,
      normalMap: this.tex.concreteNor,
      roughnessMap: this.tex.concreteRough,
      roughness: 0.82,
      metalness: 0.0,
      envMapIntensity: 0.25
    });
    if (this.tex.concreteNor) mat.normalScale.set(0.7, 0.7);

    for (const side of [-1, 1]) {
      const geo = new THREE.BoxGeometry(4.2, 0.18, 48);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(side * 7.2, 0.09, 0);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      this.scene.add(mesh);

      const curbGeo = new THREE.BoxGeometry(0.22, 0.22, 48);
      const curbMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(side * 5.15, 0.11, 0);
      curb.castShadow = true;
      curb.receiveShadow = true;
      this.scene.add(curb);
    }
  }

  _buildBuildings() {
    this._createBuilding(-11.5, 0, 14, 22, 18, {
      facade: 0xc8c0b4,
      glass: 0x88aacc,
      accent: 0x2a2a2e
    });
    this._createBuilding(-11.5, -16, 11, 28, 14, {
      facade: 0xb8b0a4,
      glass: 0x6a9abc,
      accent: 0x1e1e22
    });
    this._createBuilding(-11.5, 16, 12, 16, 16, {
      facade: 0xd0c8bc,
      glass: 0x9ab8d0,
      accent: 0x333338
    });

    this._createBuilding(11.5, -8, 13, 32, 15, {
      facade: 0xa8b0b8,
      glass: 0x5a8aaa,
      accent: 0x1a1a1e
    });
    this._createBuilding(11.5, 12, 10, 20, 13, {
      facade: 0xc0b8ac,
      glass: 0x7aa0c0,
      accent: 0x252528
    });
    this._createBuilding(11.5, -22, 9, 14, 12, {
      facade: 0xb0a898,
      glass: 0x6a90b0,
      accent: 0x222226
    });
  }

  _createBuilding(x, z, width, height, depth, colors) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colors.facade,
      roughness: 0.78,
      metalness: 0.08,
      envMapIntensity: 0.4
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: colors.glass,
      metalness: 0.05,
      roughness: 0.05,
      transmission: 0.72,
      thickness: 0.6,
      ior: 1.5,
      envMapIntensity: 2.2,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    });

    const isLeft = x < 0;
    const faceX = isLeft ? width / 2 + 0.02 : -width / 2 - 0.02;
    const winW = 1.35;
    const winH = 1.7;
    const gapX = 0.55;
    const gapY = 0.7;
    const cols = Math.floor((depth - 1.5) / (winW + gapX));
    const rows = Math.floor((height - 3) / (winH + gapY));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wy = 2.2 + r * (winH + gapY) + winH / 2;
        const wz = -depth / 2 + 1.2 + c * (winW + gapX) + winW / 2;
        const winGeo = new THREE.PlaneGeometry(winW, winH);
        const win = new THREE.Mesh(winGeo, glassMat);
        win.position.set(faceX, wy, wz);
        win.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
        group.add(win);

        const frameMat = new THREE.MeshStandardMaterial({
          color: colors.accent,
          roughness: 0.45,
          metalness: 0.65
        });
        const frameGeo = new THREE.BoxGeometry(0.08, winH + 0.12, winW + 0.12);
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(faceX + (isLeft ? 0.04 : -0.04), wy, wz);
        group.add(frame);
      }
    }

    const roofGeo = new THREE.BoxGeometry(width + 0.6, 0.35, depth + 0.6);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x333338, roughness: 0.6, metalness: 0.3 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height + 0.15;
    roof.castShadow = true;
    group.add(roof);

    const equipGeo = new THREE.BoxGeometry(2.2, 1.4, 1.8);
    const equip = new THREE.Mesh(equipGeo, roofMat);
    equip.position.set(0, height + 1.0, depth * 0.2);
    equip.castShadow = true;
    group.add(equip);

    this.scene.add(group);
    this.objects.push(group);
  }

  _buildStreetProps() {
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3c,
      roughness: 0.4,
      metalness: 0.85
    });

    for (const z of [-12, -4, 6, 14]) {
      const geo = new THREE.CylinderGeometry(0.45, 0.45, 0.06, 24);
      const m = new THREE.Mesh(geo, metalMat);
      m.position.set(1.8, 0.04, z);
      m.rotation.x = Math.PI / 2;
      m.receiveShadow = true;
      this.scene.add(m);
    }

    this._addTrafficLight(0, 18);
    this._addTrafficLight(0, -18);
  }

  _addTrafficLight(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5, metalness: 0.4 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2, 12), poleMat);
    pole.position.y = 2.1;
    pole.castShadow = true;
    group.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.4), poleMat);
    arm.position.set(0, 4.0, 1.0);
    group.add(arm);

    const headMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.4, metalness: 0.5 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.45), headMat);
    head.position.set(0, 4.0, 2.15);
    group.add(head);

    const colors = [0xff2222, 0xffaa00, 0x22ff44];
    colors.forEach((c, i) => {
      const l = new THREE.Mesh(
        new THREE.CircleGeometry(0.1, 16),
        new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.8, roughness: 0.3 })
      );
      l.position.set(0, 4.25 - i * 0.28, 2.38);
      group.add(l);
    });

    this.scene.add(group);
  }

  _buildStreetLights() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c2c30, roughness: 0.45, metalness: 0.55 });
    const positions = [
      [-6.5, -20], [-6.5, -8], [-6.5, 6], [-6.5, 18],
      [6.5, -20], [6.5, -8], [6.5, 6], [6.5, 18]
    ];

    for (const [x, z] of positions) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 5.5, 10), poleMat);
      pole.position.y = 2.75;
      pole.castShadow = true;
      group.add(pole);

      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.12, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x1e1e22, roughness: 0.4, metalness: 0.6 })
      );
      fixture.position.set(0, 5.5, 0.15);
      group.add(fixture);

      const light = new THREE.PointLight(0xfff0d8, 2.8, 18, 1.8);
      light.position.set(0, 5.35, 0.15);
      light.castShadow = false;
      group.add(light);

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 8),
        new THREE.MeshStandardMaterial({
          color: 0xfff4e0,
          emissive: 0xffe8c0,
          emissiveIntensity: 2.5,
          transparent: true,
          opacity: 0.9
        })
      );
      glow.position.copy(light.position);
      group.add(glow);

      this.scene.add(group);
    }
  }
}
