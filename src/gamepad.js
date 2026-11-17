/**
 * PROJECT REAL CITY — Gamepad Module
 * Strict physical Bluetooth gamepad only (飞智沙漠狐 / standard Gamepad API)
 * Enhanced for iOS Safari compatibility
 */

export class GamepadManager {
  constructor() {
    this.connected = false;
    this.gamepadIndex = null;
    this.deadzone = 0.12;
    this.sensitivity = 1.15;
    this.state = {
      leftStick: { x: 0, y: 0 },
      rightStick: { x: 0, y: 0 },
      buttons: {},
      triggers: { lt: 0, rt: 0 }
    };
    this._prevButtons = {};
    this.onConnect = null;
    this.onDisconnect = null;
    this._pollTimer = null;

    window.addEventListener('gamepadconnected', (e) => this._onConnect(e));
    window.addEventListener('gamepaddisconnected', (e) => this._onDisconnect(e));
  }

  _onConnect(e) {
    console.log('[Gamepad] Connected event:', e.gamepad.id, 'index:', e.gamepad.index);
    this.gamepadIndex = e.gamepad.index;
    this.connected = true;
    if (this.onConnect) this.onConnect(e.gamepad);
  }

  _onDisconnect(e) {
    if (e.gamepad.index === this.gamepadIndex) {
      console.log('[Gamepad] Disconnected');
      this.connected = false;
      this.gamepadIndex = null;
      this.state.leftStick = { x: 0, y: 0 };
      this.state.rightStick = { x: 0, y: 0 };
      if (this.onDisconnect) this.onDisconnect();
    }
  }

  /**
   * Strong detection for iOS Safari.
   * Must be called from a user gesture (button click).
   * Also starts a short continuous poll because Safari often
   * only populates getGamepads() after the user presses a button.
   */
  pollForConnection() {
    // Immediate check
    if (this._scanPads()) return true;

    // iOS Safari often needs a short delay + button press
    // Start aggressive polling for 4 seconds
    if (this._pollTimer) clearInterval(this._pollTimer);

    let attempts = 0;
    this._pollTimer = setInterval(() => {
      attempts++;
      if (this._scanPads() || attempts > 40) {
        clearInterval(this._pollTimer);
        this._pollTimer = null;
      }
    }, 100);

    return false;
  }

  _scanPads() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (p && p.connected) {
        // Accept any connected gamepad
        this.gamepadIndex = p.index;
        this.connected = true;
        console.log('[Gamepad] Found:', p.id, 'index:', p.index, 'buttons:', p.buttons.length, 'axes:', p.axes.length);
        if (this.onConnect) this.onConnect(p);
        return true;
      }
    }
    return false;
  }

  update() {
    // Always try to re-scan if not connected (helps on iOS)
    if (!this.connected) {
      this._scanPads();
      return;
    }

    if (this.gamepadIndex === null) return;

    const pads = navigator.getGamepads();
    const gp = pads[this.gamepadIndex];
    if (!gp || !gp.connected) {
      // Try to find another one
      if (!this._scanPads()) {
        this.connected = false;
        this.gamepadIndex = null;
      }
      return;
    }

    // Axes: 0=LX, 1=LY, 2=RX, 3=RY  (standard mapping)
    // Some controllers put right stick on axes 2/3 or 3/4
    const applyDeadzone = (v) => {
      const abs = Math.abs(v);
      if (abs < this.deadzone) return 0;
      const sign = v > 0 ? 1 : -1;
      return sign * ((abs - this.deadzone) / (1 - this.deadzone));
    };

    // Standard mapping first
    let lx = gp.axes[0] || 0;
    let ly = gp.axes[1] || 0;
    let rx = gp.axes[2] || 0;
    let ry = gp.axes[3] || 0;

    // Fallback for some Chinese controllers that use different axes
    if (gp.axes.length >= 4 && Math.abs(rx) < 0.01 && Math.abs(ry) < 0.01) {
      // try alternative
      if (gp.axes.length > 4) {
        rx = gp.axes[3] || 0;
        ry = gp.axes[4] || 0;
      }
    }

    this.state.leftStick.x = applyDeadzone(lx) * this.sensitivity;
    this.state.leftStick.y = applyDeadzone(ly) * this.sensitivity;
    this.state.rightStick.x = applyDeadzone(rx) * this.sensitivity;
    this.state.rightStick.y = applyDeadzone(ry) * this.sensitivity;

    // Buttons (standard mapping)
    const btnMap = {
      a: 0, b: 1, x: 2, y: 3,
      lb: 4, rb: 5, lt: 6, rt: 7,
      select: 8, start: 9, l3: 10, r3: 11
    };

    for (const [name, idx] of Object.entries(btnMap)) {
      const b = gp.buttons[idx];
      const pressed = b ? (b.pressed || b.value > 0.5) : false;
      const value = b ? b.value : 0;
      const was = this._prevButtons[name] || false;
      this.state.buttons[name] = {
        pressed,
        justPressed: pressed && !was,
        justReleased: !pressed && was,
        value
      };
      this._prevButtons[name] = pressed;
    }

    this.state.triggers.lt = gp.buttons[6] ? gp.buttons[6].value : 0;
    this.state.triggers.rt = gp.buttons[7] ? gp.buttons[7].value : 0;
  }

  get isConnected() {
    return this.connected;
  }
}
