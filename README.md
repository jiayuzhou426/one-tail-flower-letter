# 一尾花信

手机优先的单页网页小游戏。鱼在十秒远游中带回花种，花在池塘开放，最后被安放进一只花瓶。

## 启动

```bash
npm install
npm run dev
```

构建生产版本：

```bash
npm run build
```

## 玩法

1. 点击“随水远游”，在探索画面左右拖动来引导小鱼。
2. 十秒后小鱼化为雨滴，花种会回到花塘。
3. 在花塘水面松手种下花种；首次发现的花会收进图鉴。
4. 在花瓶页点击花朵加入插花；拖动已插入的花调节高度，点击切换角度，双击移除。

数据自动存于浏览器 localStorage（`one-tail-flower-letter-save-v1`）。初始页提供二次确认的“重置花塘”。

## 主要结构

- `src/pages/`：初始、远游、花塘与插花页面
- `src/components/`：Canvas 探索、鱼、花、水波、花瓶和底部导航
- `src/data/`：花朵、场景与文案配置
- `src/GameContext.tsx`：轻量全局游戏状态
- `src/persistence.ts`：localStorage 容错读取及写入
- `src/types.ts`：游戏领域数据类型

探索地图使用项目内置图片与可编辑碰撞蒙版，不请求在线资源；其他视觉元素由 Canvas、WebGL、CSS 与内联 SVG 生成。

## 探索碰撞轮廓检查

启动开发服务器后打开：

```text
http://127.0.0.1:5175/?exploreCollision=1&collisionDebug=1&level=1
```

把 `level` 改为 `1` 至 `5` 检查五关。底部滑杆可暂停并浏览整张地图：青色是可通行水面，红色是障碍，白线是连续碰撞边界，鱼周围黄圈是安全范围。

蒙版位于 `public/assets/explore/levels/level-N-mask.png`，必须保持与关卡图相同的 853×3688 尺寸。白色表示可通行，黑色表示障碍；可在绘图软件中直接修正。`scripts/generate_explore_masks.py` 仅用于更换源图时重新生成初稿，不会在运行或构建时覆盖手工调整。
