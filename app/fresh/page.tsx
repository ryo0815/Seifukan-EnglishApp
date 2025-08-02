export default function FreshPage() {
  const currentTime = new Date().toLocaleTimeString()
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#3b82f6', minHeight: '100vh' }}>
      <h1 style={{ color: 'white', fontSize: '3rem', marginBottom: '20px' }}>
        インラインスタイル動作確認
      </h1>
      <p style={{ color: 'white', fontSize: '1.2rem', marginBottom: '20px' }}>
        時刻: {currentTime}
      </p>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-black text-2xl mb-4">Tailwindテスト</h2>
        <p className="text-gray-600 mb-4">
          このテキストがスタイルされて表示されていますか？
        </p>
        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
          Tailwindボタン
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-red-500 text-white rounded">
        <p>TailwindのクラスがAppliedされているかテスト</p>
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#ef4444', color: 'white', borderRadius: '8px' }}>
        <p>こちらはインラインスタイル（確実に動作）</p>
      </div>
    </div>
  )
} 