/**
 * Camera controller — third person free look driven by right stick
 */

import * as THREE from 'three';

export class CameraController {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target; // Object3D or Vector3
    this.distance = 5.5;
    this.height = 2.1;
    this.yaw = 0;
    this.pitch = 0.18;
    this.minPitch = -0.35;
    this.maxPitch = 1.15;
    this.sensitivity = 2.4;
    this.smooth = 0.12;

    this._currentPos = new THREE.Vector3();
    this._lookAt = new THREE.Vector3();
  }

  update(dt, rightStick) {
    // Right stick look
    this.yaw -= rightStick.x * this.sensitivity * dt;
    this.pitch -= rightStick.y * this.sensitivity * dt * 0.85;
    this.pitch = THREE.MathUtils.clamp(this.pitch, this.minPitch, this.maxPitch);

    const targetPos = this.target.position || this.target;
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance,
      Math.sin(this.pitch) * this.distance + this.height * 0.35,
      Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance
    );

    const desired = targetPos.clone().add(offset);
    this._currentPos.lerp(desired, 1 - Math.pow(1 - this.smooth, dt * 60));
    this.camera.position.copy(this._currentPos);

    this._lookAt.copy(targetPos).add(new THREE.Vector3(0, 1.45, 0));
    this.camera.lookAt(this._lookAt);
  }
}
