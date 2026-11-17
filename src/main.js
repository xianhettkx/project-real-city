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
    const name = (gp.id || 'Gamepad').slice(0, 26);
    gpStatus.textContent = '手柄已连接 · ' + name;
    gpDot.className = 'dot ok';
    console.log('[Main] Gamepad connected:', gp.id);

    // Auto-start if user already clicked the button
    if (!started) {
      // keep center message until explicit start, but show status
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
    connectBtn.textContent = '正在检测... 请按手柄任意键';
    connectBtn.disabled = true;

    const found = gamepad.pollForConnection();

    // Give iOS Safari a few seconds to populate the gamepad list
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      if (gamepad.isConnected || gamepad.pollForConnection()) {
        clearInterval(checkInterval);
        centerMsg.classList.add('hidden');
        started = true;
        gpStatus.textContent = '手柄已连接 · 游戏中';
        gpDot.className = 'dot ok';
        connectBtn.textContent = '检测并连接手柄';
        connectBtn.disabled = false;
      } else if (checkCount >= 30) {
        // 3 seconds
        clearInterval(checkInterval);
        connectBtn.textContent = '未检测到 — 请按手柄按键后再点';
        connectBtn.disabled = false;
        setTimeout(() => {
          connectBtn.textContent = '检测并连接手柄';
        }, 2500);
      }
    }, 100);
  });

  // Also listen for automatic connect events
  window.addEventListener('gamepadconnected', () => {
    if (!started) {
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
