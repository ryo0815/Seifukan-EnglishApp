"use client"


import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DebugButtonPage() {
  const [clickCount, setClickCount] = useState(0)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const router = useRouter()

  const addToConsole = (message: string) => {
    console.log(message)
    setConsoleOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleSimpleClick = () => {
    setClickCount(prev => prev + 1)
    addToConsole(`シンプルクリック - カウント: ${clickCount + 1}`)
  }

  const handleRouterClick = () => {
    addToConsole('ルーター機能をテスト中...')
    try {
      router.push('/')
      addToConsole('ルーター機能は正常に動作しました')
    } catch (error) {
      addToConsole(`ルーターエラー: ${error}`)
    }
  }

  const handleStateUpdate = () => {
    addToConsole('状態更新をテスト中...')
    setClickCount(0)
    addToConsole('状態が正常にリセットされました')
  }

  const handleAsyncOperation = async () => {
    addToConsole('非同期処理をテスト中...')
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      addToConsole('非同期処理が正常に完了しました')
    } catch (error) {
      addToConsole(`非同期処理エラー: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
            ボタンテスト
          </h1>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {clickCount}
            </div>
            <p className="text-gray-600">クリック回数</p>
          </div>
        </Card>

        {/* Test Buttons */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">ボタンテスト</h2>
          
          <Button
            onClick={handleSimpleClick}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            シンプルクリック
          </Button>

          <Button
            onClick={handleRouterClick}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            ホームページに戻る
          </Button>

          <Button
            onClick={handleStateUpdate}
            className="w-full bg-purple-500 hover:bg-purple-600"
          >
            カウンターリセット
          </Button>

          <Button
            onClick={handleAsyncOperation}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            非同期処理テスト（1秒）
          </Button>
        </Card>

        {/* Console Output */}
        <Card className="p-4 bg-white/95 backdrop-blur-sm">
          <h3 className="text-md font-medium text-gray-800 mb-2">コンソール出力</h3>
          <div className="bg-gray-900 p-3 rounded text-xs text-green-400 font-mono h-40 overflow-y-auto">
            {consoleOutput.length === 0 ? (
              <div className="text-gray-500">ボタンをクリックしてテストしてください...</div>
            ) : (
              consoleOutput.map((line, index) => (
                <div key={index}>{line}</div>
              ))
            )}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h3 className="text-md font-medium text-yellow-800 mb-2">テスト手順</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. 各ボタンをクリックしてください</li>
            <li>2. カウンターが増加するか確認</li>
            <li>3. コンソール出力を確認</li>
            <li>4. ブラウザの開発者ツールのコンソールもチェック</li>
          </ol>
        </Card>
      </div>
    </div>
  )
} 