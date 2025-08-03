'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default function TestPronunciationPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioData, setAudioData] = useState<Blob | null>(null)
  const [evaluation, setEvaluation] = useState<any>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testPhrases = [
    { text: 'Sorry', description: 'カタカナ発音: ソーリー' },
    { text: 'Hello', description: 'カタカナ発音: ハロー' },
    { text: 'Thank you', description: 'カタカナ発音: サンキュー' },
    { text: 'One more time please', description: '複数単語のフレーズ' },
    { text: 'How are you?', description: '質問文のフレーズ' }
  ]

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const currentPhrase = testPhrases[currentPhraseIndex]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioData(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

      // 5秒後に自動停止
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
          setIsRecording(false)
        }
      }, 5000)
    } catch (err) {
      console.error('Recording error:', err)
      setError('録音に失敗しました')
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
  }

  const evaluatePronunciation = async () => {
    if (!audioData) return

    setIsEvaluating(true)
    setError(null)

    try {
      // Convert to WAV format
      const wavBlob = await convertToWav(audioData)
      
      const formData = new FormData()
      formData.append('audio', wavBlob, 'recording.wav')
      formData.append('referenceText', currentPhrase.text)

      const response = await fetch('/api/speech-evaluation', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Evaluation failed with no data' }))
        throw new Error(errorData.error || 'Evaluation failed')
      }

      const result = await response.json()
      
      setEvaluation(result)
    } catch (err) {
      console.error('Evaluation error:', err)
      setError('評価中にエラーが発生しました')
    } finally {
      setIsEvaluating(false)
    }
  }

  const convertToWav = async (blob: Blob): Promise<Blob> => {
    try {
      console.log('Converting audio to WAV format...')
      console.log('Input blob:', { size: blob.size, type: blob.type })
      
      // Web Audio APIを使用してWAV形式に変換
      const audioContext = new (window as any).AudioContext()
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      console.log('Audio buffer decoded:', {
        length: audioBuffer.length,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
      })
      
      // WAV形式に変換
      const wavBlob = await audioBufferToWav(audioBuffer)
      console.log('WAV conversion completed, size:', wavBlob.size)
      return wavBlob
    } catch (error) {
      console.error('WAV conversion error:', error)
      // フォールバック: 元のblobを返すのをやめ、エラーを投げる
      throw new Error('音声ファイルのWAV形式への変換に失敗しました。');
    }
  }

  const audioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const length = audioBuffer.length
    const numberOfChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
    const view = new DataView(arrayBuffer)
    
    // WAVヘッダー
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * numberOfChannels * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * numberOfChannels * 2, true)
    
    // 音声データ
    const channelData = audioBuffer.getChannelData(0)
    let offset = 44
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  const nextPhrase = () => {
    setCurrentPhraseIndex((prev) => (prev + 1) % testPhrases.length)
    setAudioData(null)
    setEvaluation(null)
    setError(null)
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500'
      case 'B': return 'bg-blue-500'
      case 'C': return 'bg-yellow-500'
      case 'D': return 'bg-orange-500'
      case 'E': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">発音評価システム テスト</h1>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">🎯 新しい評価システム</h2>
        <p className="text-sm text-blue-700">
          お手本音声との比較評価により、より正確で実用的な発音評価を提供します。
          カタカナ発音とネイティブ発音を明確に区別し、適切なフィードバックを提供します。
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 録音セクション */}
        <Card>
          <CardHeader>
            <CardTitle>録音テスト</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">テストフレーズ {currentPhraseIndex + 1}/{testPhrases.length}</h3>
              <p className="text-2xl font-bold text-blue-600 mb-2">{currentPhrase.text}</p>
              <p className="text-sm text-gray-600">{currentPhrase.description}</p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                disabled={isEvaluating}
              >
                {isRecording ? '録音停止' : '録音開始'}
              </Button>
              
              <Button 
                onClick={evaluatePronunciation}
                disabled={!audioData || isEvaluating}
                variant="outline"
              >
                {isEvaluating ? '評価中...' : '発音評価'}
              </Button>
              
              <Button 
                onClick={nextPhrase}
                variant="outline"
                disabled={isRecording || isEvaluating}
              >
                次のフレーズ
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 評価結果セクション */}
        <Card>
          <CardHeader>
            <CardTitle>評価結果</CardTitle>
          </CardHeader>
          <CardContent>
            {evaluation ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge className={`text-white ${getGradeColor(evaluation.grade)}`}>
                    {evaluation.grade}
                  </Badge>
                  <span className="text-lg font-semibold">
                    {evaluation.pronunciationScore}/100点
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">認識されたテキスト:</label>
                    <p className="text-gray-700">{evaluation.recognizedText || '認識されませんでした'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">詳細スコア:</label>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>正確性:</span>
                        <span>{evaluation.accuracyScore}点</span>
                      </div>
                      <Progress value={evaluation.accuracyScore} className="h-2" />
                      
                      <div className="flex justify-between">
                        <span>流暢性:</span>
                        <span>{evaluation.fluencyScore}点</span>
                      </div>
                      <Progress value={evaluation.fluencyScore} className="h-2" />
                      
                      <div className="flex justify-between">
                        <span>完全性:</span>
                        <span>{evaluation.completenessScore}点</span>
                      </div>
                      <Progress value={evaluation.completenessScore} className="h-2" />
                    </div>
                  </div>

                  {evaluation.advice && evaluation.advice.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">アドバイス:</label>
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {evaluation.advice.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                録音して評価を実行してください
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* システム説明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>システム改良内容</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. 高度な音響分析</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>フォルマント分析による母音の正確な評価</li>
                <li>ピッチ軌跡分析によるイントネーション評価</li>
                <li>リズム一貫性分析による自然な発音の評価</li>
                <li>音節境界検出による音節構造の評価</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. カタカナ発音検出</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>音響特徴に基づくカタカナ発音の自動検出</li>
                <li>複数の検出パターンによる高精度な判定</li>
                <li>信頼度スコアによる検出精度の評価</li>
                <li>カタカナ発音検出時の大幅減点システム</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. ネイティブ発音評価</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>英語の音韻体系に基づく評価</li>
                <li>ネイティブ発音の特徴を考慮したスコアリング</li>
                <li>音素レベルの詳細な分析</li>
                <li>自然なリズムとイントネーションの評価</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 