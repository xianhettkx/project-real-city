/**
 * Player (Phase 1) — simple capsule representation with movement
 * Will be replaced by high quality character model + animations in Phase 3
 */

import * as THREE from 'three';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.speed = 4.8;
    this.runMultiplier = 1.85;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    // Temporary visual (will be replaced)
    const geo = new THREE.CapsuleGeometry(0.35, 1.0, 6, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3a6ea5,
      roughness: 0.55,
      metalness: 0.1
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(0, 0.85, 4);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    // Head reference for camera
    this.head = new THREE.Object3D();
    this.head.position.set(0, 1.55, 0);
    this.mesh.add(this.head);

    this.isRunning = false;
  }

  get position() {
    return this.mesh.position;
  }

  update(dt, leftStick, yaw, isRunning) {
    this.isRunning = isRunning;
    const moveSpeed = this.speed * (isRunning ? this.runMultiplier : 1);

    // Camera-relative movement
    this.direction.set(0, 0, 0);
    if (Math.abs(leftStick.x) > 0.01 || Math.abs(leftStick.y) > 0.01) {
      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      this.direction.addScaledVector(forward, -leftStick.y);
      this.direction.addScaledVector(right, leftStick.x);
      this.direction.normalize();

      this.velocity.x = this.direction.x * moveSpeed;
      this.velocity.z = this.direction.z * moveSpeed;

      // Face movement direction
      const targetYaw = Math.atan2(this.direction.x, this.direction.z);
      this.mesh.rotation.y = THREE.MathUtils.lerp(
        this.mesh.rotation.y,
        targetYaw,
        1 - Math.pow(0.1, dt * 60)
      );
    } else {
      this.velocity.x *= 0.82;
      this.velocity.z *= 0.82;
    }

    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.z += this.velocity.z * dt;

    // Simple bounds for the street
    this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -14, 14);
    this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -22, 22);
  }
}
