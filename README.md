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

无外部图片、字体或在线资源；视觉元素均由 Canvas、CSS 与内联 SVG 生成。
