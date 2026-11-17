/**
 * PROJECT REAL CITY — Gamepad Module
 * Strict physical Bluetooth gamepad only (飞智沙漠狐 / standard Gamepad API)
 * No touch controls of any kind.
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

    window.addEventListener('gamepadconnected', (e) => this._onConnect(e));
    window.addEventListener('gamepaddisconnected', (e) => this._onDisconnect(e));
  }

  _onConnect(e) {
    console.log('[Gamepad] Connected:', e.gamepad.id, e.gamepad.index);
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

  /** Call once from a user gesture (button click) to unlock Gamepad API on iOS */
  pollForConnection() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (p && p.connected) {
        this.gamepadIndex = p.index;
        this.connected = true;
        if (this.onConnect) this.onConnect(p);
        return true;
      }
    }
    return false;
  }

  update() {
    if (!this.connected || this.gamepadIndex === null) return;

    const pads = navigator.getGamepads();
    const gp = pads[this.gamepadIndex];
    if (!gp || !gp.connected) {
      this.connected = false;
      return;
    }

    // Axes: 0=LX, 1=LY, 2=RX, 3=RY  (standard mapping)
    const applyDeadzone = (v) => {
      const abs = Math.abs(v);
      if (abs < this.deadzone) return 0;
      const sign = v > 0 ? 1 : -1;
      return sign * ((abs - this.deadzone) / (1 - this.deadzone));
    };

    this.state.leftStick.x = applyDeadzone(gp.axes[0] || 0) * this.sensitivity;
    this.state.leftStick.y = applyDeadzone(gp.axes[1] || 0) * this.sensitivity;
    this.state.rightStick.x = applyDeadzone(gp.axes[2] || 0) * this.sensitivity;
    this.state.rightStick.y = applyDeadzone(gp.axes[3] || 0) * this.sensitivity;

    // Buttons (standard)
    // 0=A, 1=B, 2=X, 3=Y, 4=LB, 5=RB, 6=LT, 7=RT, 8=Select, 9=Start, 10=L3, 11=R3
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

    // Triggers as analog
    this.state.triggers.lt = gp.buttons[6] ? gp.buttons[6].value : 0;
    this.state.triggers.rt = gp.buttons[7] ? gp.buttons[7].value : 0;
  }

  get isConnected() {
    return this.connected;
  }
}
