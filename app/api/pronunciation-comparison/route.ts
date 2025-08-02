import { NextRequest, NextResponse } from 'next/server'
import { evaluatePronunciation } from '@/lib/pronunciation-comparison'

interface PronunciationComparisonRequest {
  audioBuffer: ArrayBuffer
  referenceText: string
  userRecognizedText: string
  userProsody: any
}

interface PronunciationComparisonResponse {
  success: boolean
  result?: any
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<PronunciationComparisonResponse>> {
  try {
    console.log('=== PRONUNCIATION COMPARISON API CALLED ===')
    
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const referenceText = formData.get('referenceText') as string
    const userRecognizedText = formData.get('userRecognizedText') as string
    const userProsodyData = formData.get('userProsody') as string
    
    if (!audioFile || !referenceText) {
      return NextResponse.json({
        success: false,
        error: '音声ファイルと参照テキストが必要です'
      })
    }
    
    console.log('=== REQUEST DETAILS ===')
    console.log('Audio file:', audioFile.name, 'size:', audioFile.size, 'type:', audioFile.type)
    console.log('Reference text:', referenceText)
    console.log('User recognized text:', userRecognizedText)
    
    // 音声ファイルをArrayBufferに変換
    const audioBuffer = await audioFile.arrayBuffer()
    
    // プロソディデータをパース
    let userProsody = {}
    try {
      userProsody = JSON.parse(userProsodyData || '{}')
    } catch (error) {
      console.log('プロソディデータのパースに失敗:', error)
    }
    
    console.log('=== PERFORMING PRONUNCIATION COMPARISON ===')
    
    // お手本音声との比較評価を実行
    const result = evaluatePronunciation(
      audioBuffer,
      referenceText,
      userRecognizedText || '',
      userProsody
    )
    
    console.log('=== COMPARISON RESULT ===')
    console.log('Overall Score:', result.overallScore)
    console.log('Grade:', result.grade)
    console.log('Accuracy Score:', result.accuracyScore)
    console.log('Fluency Score:', result.fluencyScore)
    console.log('Intonation Score:', result.intonationScore)
    console.log('Rhythm Score:', result.rhythmScore)
    console.log('Feedback:', result.feedback)
    
    return NextResponse.json({
      success: true,
      result: {
        overallGrade: result.grade,
        gradeDescription: getGradeDescription(result.grade),
        pronunciationScore: result.overallScore,
        accuracyScore: result.accuracyScore,
        fluencyScore: result.fluencyScore,
        intonationScore: result.intonationScore,
        rhythmScore: result.rhythmScore,
        recognizedText: userRecognizedText,
        improvements: result.feedback,
        positives: generatePositives(result),
        feedback: generateDetailedFeedback(result),
        detailedAnalysis: {
          phonemeScores: [],
          wordScores: [],
          fluencyScore: result.fluencyScore,
          intonationScore: result.intonationScore,
          rhythmScore: result.rhythmScore,
          detailedComparison: result.detailedAnalysis
        }
      }
    })
    
  } catch (error) {
    console.error('Pronunciation comparison error:', error)
    return NextResponse.json({
      success: false,
      error: '発音比較評価中にエラーが発生しました'
    })
  }
}

function getGradeDescription(grade: string): string {
  const descriptions = {
    'A': '優秀 - お手本に近い発音（合格）',
    'B': '良好 - お手本に近い発音（合格）',
    'C': '普通 - お手本との差があります（要改善）',
    'D': '要改善 - お手本との差が大きい',
    'E': '大幅改善必要 - お手本との差が非常に大きい'
  }
  return descriptions[grade as keyof typeof descriptions] || '評価できません'
}

function generatePositives(result: any): string[] {
  const positives: string[] = []
  
  if (result.overallScore >= 90) {
    positives.push('お手本に非常に近い発音です')
  }
  
  if (result.accuracyScore >= 90) {
    positives.push('単語の認識が正確です')
  }
  
  if (result.fluencyScore >= 85) {
    positives.push('音素の発音が正確です')
  }
  
  if (result.intonationScore >= 80) {
    positives.push('イントネーションが自然です')
  }
  
  if (result.rhythmScore >= 75) {
    positives.push('リズムが自然です')
  }
  
  return positives
}

function generateDetailedFeedback(result: any): string {
  return `お手本比較評価: ${result.overallScore.toFixed(1)}/100点。` +
         `単語精度: ${result.accuracyScore.toFixed(1)}点、` +
         `流暢性: ${result.fluencyScore.toFixed(1)}点、` +
         `イントネーション: ${result.intonationScore.toFixed(1)}点、` +
         `リズム: ${result.rhythmScore.toFixed(1)}点`
} 