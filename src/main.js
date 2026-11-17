/**
 * PROJECT REAL CITY — Main Entry
 * Phase 1: Real WebGL2 renderer, high quality street block, physical gamepad only
 */

import { RendererSystem } from './renderer.js';
import { World } from './world.js';
import { GamepadManager } from './gamepad.js';
import { Player } from './player.js';
import { CameraController } from './camera.js';

const container = document.getElementById('canvas-container');
const centerMsg = document.getElementById('center-msg');
const connectBtn = document.getElementById('connect-btn');
const gpStatus = document.getElementById('gp-status');
const gpDot = document.getElementById('gp-dot');
const fpsEl = document.getElementById('fps');
const timeBadge = document.getElementById('time-badge');

let rendererSys, world, gamepad, player, cameraCtrl;
let started = false;
let lastTime = performance.now();
let frames = 0;
let fpsTime = 0;

async function init() {
  rendererSys = new RendererSystem(container);
  gamepad = new GamepadManager();

  gamepad.onConnect = (gp) => {
    gpStatus.textContent = '手柄已连接 · ' + (gp.id || 'Gamepad').slice(0, 28);
    gpDot.className = 'dot ok';
    if (!started) {
      // Ready to start after gesture
    }
  };
  gamepad.onDisconnect = () => {
    gpStatus.textContent = '手柄已断开';
    gpDot.className = 'dot warn';
    if (started) {
      centerMsg.classList.remove('hidden');
      centerMsg.querySelector('h1').textContent = '手柄已断开';
      centerMsg.querySelector('p').textContent = '请重新连接蓝牙游戏手柄后继续。';
      started = false;
    }
  };

  // Load env map
  try {
    await rendererSys.loadEnvironment('./assets/environment/urban_street_1k.hdr');
    console.log('[Main] HDR environment loaded');
  } catch (e) {
    console.warn('[Main] HDR load failed, continuing with procedural lights', e);
  }

  world = new World(rendererSys.scene, rendererSys);
  await world.init();
  console.log('[Main] World street block ready');

  player = new Player(rendererSys.scene);
  cameraCtrl = new CameraController(rendererSys.camera, player.mesh);

  // UI button — required user gesture for iOS Gamepad API
  connectBtn.addEventListener('click', () => {
    const found = gamepad.pollForConnection();
    if (found || gamepad.isConnected) {
      centerMsg.classList.add('hidden');
      started = true;
      gpStatus.textContent = '手柄已连接 · 游戏中';
      gpDot.className = 'dot ok';
    } else {
      connectBtn.textContent = '未检测到手柄 — 请确认已配对并再试';
      setTimeout(() => { connectBtn.textContent = '检测并连接手柄'; }, 2200);
    }
  });

  // Also listen for automatic connect events
  window.addEventListener('gamepadconnected', () => {
    if (!started) {
      // Still need the button gesture on many iOS versions
      gpStatus.textContent = '手柄已检测到 · 请点击按钮开始';
      gpDot.className = 'dot ok';
    }
  });

  requestAnimationFrame(loop);
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  frames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fpsEl.textContent = Math.round(frames / fpsTime) + ' fps';
    frames = 0;
    fpsTime = 0;
  }

  gamepad.update();

  if (started && gamepad.isConnected) {
    const st = gamepad.state;
    const running = st.buttons.rb?.pressed || false;
    player.update(dt, st.leftStick, cameraCtrl.yaw, running);
    cameraCtrl.update(dt, st.rightStick);

    // Simple day time indicator (static for phase 1)
    timeBadge.textContent = '14:32 · 晴';
  }

  rendererSys.render();
}

init().catch((err) => {
  console.error(err);
  centerMsg.querySelector('h1').textContent = '初始化失败';
  centerMsg.querySelector('p').textContent = String(err);
});
