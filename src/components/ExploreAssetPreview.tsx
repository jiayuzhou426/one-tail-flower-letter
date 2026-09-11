import { exploreAssets } from '../game/explore/assetManifest';

/** Development-only visual asset sheet: /?exploreAssets=1 while on exploration. */
export function ExploreAssetPreview() {
  return <main style={{ minHeight: '100dvh', overflow: 'auto', padding: 16, background: '#53c8df', color: '#164a59' }}>
    <h1 style={{ fontSize: 16, fontWeight: 500 }}>探索素材校验</h1>
    <p style={{ fontSize: 12 }}>水底图、鱼帧与透明植物群均直接来自 final 目录。</p>
    <img src={exploreAssets.water} alt="完整水底图" style={{ width: '100%', display: 'block', borderRadius: 8 }} />
    <h2 style={{ fontSize: 14, marginTop: 20 }}>鱼帧</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: '#7cd8e6' }}>
      {exploreAssets.fish.map((src, index) => <img key={src} src={src} alt={`鱼帧 ${index + 1}`} style={{ width: '100%', background: '#56c8df' }} />)}
    </div>
    <h2 style={{ fontSize: 14, marginTop: 20 }}>植物组团</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
      {exploreAssets.clusters.map((src, index) => <img key={src} src={src} alt={`植物组团 ${index + 1}`} style={{ width: '100%', background: '#56c8df' }} />)}
    </div>
  </main>;
}
