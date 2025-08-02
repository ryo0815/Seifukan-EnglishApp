export default function DebugCSSPage() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', margin: '20px', color: 'black' }}>
        CSS読み込みデバッグページ
      </h1>
      
      {/* インラインスタイル（確実に動作） */}
      <div style={{ backgroundColor: '#3b82f6', color: 'white', padding: '20px', margin: '20px' }}>
        インラインスタイル（青背景）
      </div>
      
      {/* カスタムCSSクラス */}
      <div className="test-red" style={{ margin: '20px' }}>
        カスタムCSSクラス test-red
      </div>
      
      <div className="test-blue" style={{ margin: '20px' }}>
        カスタムCSSクラス test-blue
      </div>
      
      {/* 基本的なTailwind */}
      <div className="bg-green-500 text-white p-4 m-5">
        Tailwindクラス: bg-green-500 text-white p-4 m-5
      </div>
      
      {/* より複雑なTailwind */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 m-5 rounded-lg shadow-lg">
        高度なTailwind: グラデーション + シャドウ + 角丸
      </div>
      
      {/* フォールバック表示 */}
      <div className="bg-red-500 text-white p-4 m-5" style={{ backgroundColor: '#ef4444', color: 'white', padding: '16px', margin: '20px' }}>
        Tailwind + インラインフォールバック
      </div>
      
      <div style={{ margin: '20px', padding: '20px', border: '2px solid black' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>結果の確認:</h2>
        <ul style={{ listStyle: 'disc', marginLeft: '20px' }}>
          <li>インラインスタイルが見えますか？</li>
          <li>カスタムCSSクラスが効いていますか？</li>
          <li>基本的なTailwindクラスが効いていますか？</li>
          <li>高度なTailwindクラスが効いていますか？</li>
        </ul>
      </div>
    </div>
  )
} 