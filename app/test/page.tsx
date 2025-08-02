"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TestPage() {
  return (
    <div className="p-8 bg-blue-500">
      <h1 className="text-white text-4xl font-bold mb-4">Tailwind CSSテスト</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-black text-2xl mb-4">これは白い背景です</h2>
        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          緑のボタン
        </button>
      </div>
      <div className="mt-6 bg-red-500 text-white p-4 rounded">
        <p>これは赤い背景の要素です</p>
      </div>
    </div>
  )
} 