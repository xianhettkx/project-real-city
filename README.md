# PROJECT REAL CITY — Phase 1

电影级照片真实感开放世界城市模拟器（当前阶段：高质量街道原型）

## 当前状态

- 真实 WebGL 2 渲染
- PBR 沥青道路 + 混凝土人行道（Poly Haven 纹理）
- 带玻璃幕墙的建筑
- 动态阴影 + Bloom + ACES 色调映射
- 严格仅支持实体蓝牙游戏手柄（飞智沙漠狐 / 标准 Gamepad API）
- 无任何触屏控制

## 如何运行

```bash
# 克隆仓库
git clone https://github.com/xianhettkx/project-real-city.git
cd project-real-city

# 启动本地服务器（必须用 HTTP）
python3 -m http.server 8080
```

然后打开浏览器访问：http://127.0.0.1:8080/

## 操作说明

1. 连接实体蓝牙游戏手柄
2. 点击页面上的「检测并连接手柄」按钮（iOS Safari 需要用户手势）
3. 连接成功后进入场景

**手柄映射：**
- 左摇杆 → 移动
- 右摇杆 → 视角
- RB → 奔跑

## 技术栈

- Three.js r170
- WebGL 2
- 原生 Gamepad API
- 模块化结构（src/）

## 重要说明

这是 Phase 1 原型。完整开放世界（车辆、NPC、昼夜、天气、可进入建筑等）尚未实现。  
当前优先保证近距离画面质量和真实可运行性。

## 资源来源

- 沥青与混凝土纹理：Poly Haven（CC0）
- HDR 环境贴图：Poly Haven（CC0）
