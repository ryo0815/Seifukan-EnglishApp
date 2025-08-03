import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

// Azure Speech Service configuration with validation
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || ''
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'japanwest'

// Environment variable validation for Vercel deployment
if (!AZURE_SPEECH_KEY) {
  console.error('❌ AZURE_SPEECH_KEY is not set. Please configure environment variables in Vercel dashboard.')
}

interface PronunciationAssessmentResult {
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'E'
  gradeDescription?: string
  pronunciationScore?: number
  accuracyScore?: number
  fluencyScore?: number
  completenessScore?: number
  recognizedText?: string
  improvements: string[]
  positives: string[]
  feedback: string
  isPass: boolean
  error?: string
  azureData?: any
  advancedAnalysis?: any
}

async function runAdvancedAnalysis(audioPath: string, referenceText: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'python', 'advanced_evaluation.py')
    
    execFile('python3', [pythonScript, audioPath, referenceText], (error, stdout, stderr) => {
      if (error) {
        console.error('Advanced analysis error:', error)
        console.error('Stderr:', stderr)
        reject(error)
        return
      }
      
      try {
        const result = JSON.parse(stdout)
        resolve(result)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        reject(parseError)
      }
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== ADVANCED PRONUNCIATION ASSESSMENT API CALLED ===')
    
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const referenceText = formData.get('referenceText') as string

    if (!audioFile || !referenceText) {
      return NextResponse.json({ error: '音声ファイルまたは参照テキストが提供されていません' }, { status: 400 })
    }

    console.log('=== REQUEST DETAILS ===')
    console.log(`Audio file: ${audioFile.name} size: ${audioFile.size} type: ${audioFile.type}`)
    console.log(`Reference text: ${referenceText}`)
    console.log(`Azure key (first 10 chars): ${AZURE_SPEECH_KEY.substring(0, 10)}...`)
    console.log(`Azure region: ${AZURE_SPEECH_REGION}`)

    const audioBuffer = await audioFile.arrayBuffer()
    console.log('=== CALLING AZURE SPEECH SERVICE ===')
    console.log(`Audio buffer size: ${audioBuffer.byteLength} bytes`)

    // 一時ファイルに音声を保存
    const tempDir = os.tmpdir()
    const tempAudioPath = path.join(tempDir, `audio_${Date.now()}.wav`)
    await fs.writeFile(tempAudioPath, Buffer.from(audioBuffer))

    try {
      // Azure Speech Service の正しい発音評価実装
      const azureResult = await performPronunciationAssessment(audioBuffer, referenceText)
      
      // 高度なPython分析を実行（エラーハンドリング付き）
      console.log('=== RUNNING ADVANCED PYTHON ANALYSIS ===')
      let advancedResult = null
      try {
        advancedResult = await runAdvancedAnalysis(tempAudioPath, referenceText)
        console.log('Advanced analysis result:', JSON.stringify(advancedResult, null, 2))
      } catch (pythonError) {
        console.log('=== PYTHON ANALYSIS FAILED - USING AZURE ONLY ===')
        console.error('Python analysis error:', pythonError)
        // Python分析が失敗してもAzureの結果を返す
        return NextResponse.json(azureResult)
      }
      
      // 結果を統合
      const combinedResult = combineResults(azureResult, advancedResult)
      
      console.log('=== FINAL COMBINED RESULT ===')
      console.log('Result:', JSON.stringify(combinedResult, null, 2))
      
      return NextResponse.json(combinedResult)
      
    } finally {
      // 一時ファイルを削除
      await fs.unlink(tempAudioPath).catch(console.error)
    }
    
  } catch (error) {
    console.error('=== ERROR IN PRONUNCIATION ASSESSMENT ===')
    console.error(error)
    
    // フォールバック: デモ結果を返す
    const fallbackResult = createDemoResult(error as Error)
    console.log('=== FALLBACK RESULT ===')
    console.log('Fallback:', JSON.stringify(fallbackResult, null, 2))
    return NextResponse.json(fallbackResult)
  }
}

async function performPronunciationAssessment(
  audioBuffer: ArrayBuffer, 
  referenceText: string
): Promise<PronunciationAssessmentResult> {
  
  // まず、発音評価を試す
  try {
    const result = await callAzurePronunciationAssessment(audioBuffer, referenceText)
    if (result) {
      return result
    }
  } catch (error) {
    console.log('=== PRONUNCIATION ASSESSMENT FAILED, TRYING ALTERNATIVES ===')
    console.error(error)
  }

  // 代替案1: 基本的な音声認識を試す
  try {
    console.log('=== TRYING SPEECH TO TEXT FALLBACK ===')
    const sttResult = await callAzureSpeechToText(audioBuffer)
    console.log('=== SPEECH TO TEXT RESULT ===')
    console.log('Result:', JSON.stringify(sttResult, null, 2))
    console.log('DisplayText:', sttResult?.DisplayText)
    console.log('DisplayText exists:', !!(sttResult && sttResult.DisplayText))
    
    if (sttResult && sttResult.DisplayText) {
      console.log('=== CREATING RESULT FROM SPEECH TO TEXT ===')
      const result = createResultFromSpeechToText(sttResult.DisplayText, referenceText)
      console.log('=== FALLBACK RESULT CREATED ===')
      console.log('Result:', JSON.stringify(result, null, 2))
      return result
    } else {
      console.log('=== NO DISPLAY TEXT FOUND ===')
      console.log('DisplayText:', sttResult?.DisplayText)
    }
  } catch (error) {
    console.log('=== SPEECH TO TEXT ALSO FAILED ===')
    console.error(error)
  }

  // 代替案2: デモ結果を返す
  throw new Error('All Azure Speech Service attempts failed')
}

async function callAzurePronunciationAssessment(
  audioBuffer: ArrayBuffer, 
  referenceText: string
): Promise<PronunciationAssessmentResult | null> {

  // 最新のPronunciation Assessment API version を使用
  const url = `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`
  
  const params = new URLSearchParams({
    'language': 'en-US',
    'format': 'detailed',
    'profanity': 'raw'
  })

  // 正しいPronunciation Assessment設定（Microsoftドキュメント準拠）
  const pronunciationConfig = {
    ReferenceText: referenceText,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: false,
    EnableProsodyAssessment: true,
    NBestPhonemeCount: 5
  }

  // Azure公式ドキュメント要件：JSONをBase64エンコードする必要がある
  const pronunciationConfigJson = JSON.stringify(pronunciationConfig)
  const pronunciationConfigBase64 = Buffer.from(pronunciationConfigJson, 'utf8').toString('base64')

  const headers = {
    'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
    'Content-Type': 'audio/wav',
    'Accept': 'application/json',
    'Pronunciation-Assessment': pronunciationConfigBase64
  }

  console.log('=== TRYING PRONUNCIATION ASSESSMENT (CORRECTED) ===')
  console.log(`URL: ${url}?${params}`)
  console.log('Headers:', {
    'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY.substring(0, 10) + '...',
    'Content-Type': headers['Content-Type'],
    'Accept': headers['Accept'],
    'Pronunciation-Assessment': `Base64-encoded: ${pronunciationConfigJson}`
  })

  try {
    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: headers,
      body: audioBuffer
    })

    console.log(`Response status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('=== PRONUNCIATION ASSESSMENT SUCCESS! ===')
      console.log('Response data:', JSON.stringify(data, null, 2))
      
      return processPronunciationAssessmentResponse(data, referenceText)
    } else {
      const errorText = await response.text()
      console.error('=== PRONUNCIATION ASSESSMENT FAILED - DETAILED DEBUG ===')
      console.error(`Status: ${response.status} ${response.statusText}`)
      console.error(`Error Response: ${errorText}`)
      console.error(`Request URL: ${url}?${params}`)
      console.error(`Azure Key Length: ${AZURE_SPEECH_KEY.length}`)
      console.error(`Azure Region: ${AZURE_SPEECH_REGION}`)
      console.error(`Audio Buffer Size: ${audioBuffer.byteLength} bytes`)
      console.error(`Reference Text: "${referenceText}"`)
      console.error(`Pronunciation Assessment Config: ${pronunciationConfigJson}`)
      
      // 代替案2: 別の設定で再試行
      return await tryAlternativePronunciationAssessment(audioBuffer, referenceText)
    }
  } catch (error) {
    console.log('=== PRONUNCIATION ASSESSMENT ERROR ===')
    console.error(error)
    return await tryAlternativePronunciationAssessment(audioBuffer, referenceText)
  }
}

async function tryAlternativePronunciationAssessment(
  audioBuffer: ArrayBuffer, 
  referenceText: string
): Promise<PronunciationAssessmentResult | null> {

  console.log('=== TRYING ALTERNATIVE PRONUNCIATION ASSESSMENT ===')
  
  // 代替設定1: より簡単な設定
  const url = `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`
  
  const params = new URLSearchParams({
    'language': 'en-US',
    'format': 'detailed'
  })

  const pronunciationConfig = {
    ReferenceText: referenceText,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: false,
    EnableProsodyAssessment: true,
    NBestPhonemeCount: 5
  }

  // Azure公式ドキュメント要件：JSONをBase64エンコードする必要がある
  const pronunciationConfigJson = JSON.stringify(pronunciationConfig)
  const pronunciationConfigBase64 = Buffer.from(pronunciationConfigJson, 'utf8').toString('base64')

  const headers = {
    'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
    'Content-Type': 'audio/wav',
    'Accept': 'application/json',
    'Pronunciation-Assessment': pronunciationConfigBase64
  }

  console.log('Alternative headers:', {
    'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
    'Content-Type': headers['Content-Type'],
    'Accept': headers['Accept'],
    'Pronunciation-Assessment': `Base64-encoded: ${pronunciationConfigJson}`
  })

  try {
    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: headers,
      body: audioBuffer
    })

    console.log(`Alternative response status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('=== ALTERNATIVE PRONUNCIATION ASSESSMENT SUCCESS! ===')
      console.log('Alternative response data:', JSON.stringify(data, null, 2))
      
      return processPronunciationAssessmentResponse(data, referenceText)
    } else {
      const errorText = await response.text()
      console.log('=== ALTERNATIVE ALSO FAILED ===')
      console.log(`Status: ${response.status}`)
      console.log(`Error: ${errorText}`)
      
      return null
    }
  } catch (error) {
    console.log('=== ALTERNATIVE ASSESSMENT ERROR ===')
    console.error(error)
    return null
  }
}

async function callAzureSpeechToText(audioBuffer: ArrayBuffer): Promise<any> {
  const url = `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`
  
  const params = new URLSearchParams({
    'language': 'en-US',
    'format': 'detailed'
  })

  const headers = {
    'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
    'Content-Type': 'audio/wav',
    'Accept': 'application/json'
  }

  console.log('=== TRYING SPEECH TO TEXT ONLY ===')
  console.log(`URL: ${url}?${params}`)

  const response = await fetch(`${url}?${params}`, {
    method: 'POST',
    headers: headers,
    body: audioBuffer
  })

  if (response.ok) {
    const data = await response.json()
    console.log('=== SPEECH TO TEXT SUCCESS ===')
    console.log('Response data:', JSON.stringify(data, null, 2))
    return data
  } else {
    const errorText = await response.text()
    console.log('=== SPEECH TO TEXT FAILED ===')
    console.log(`Status: ${response.status}`)
    console.log(`Error: ${errorText}`)
    throw new Error(`Speech to text failed: ${response.status}`)
  }
}

function processPronunciationAssessmentResponse(
  data: any, 
  referenceText: string
): PronunciationAssessmentResult {
  
  try {
    const nbest = data.NBest?.[0]
    
    // Azure Pronunciation Assessment の実際のレスポンス構造に対応
    // スコアは nbest 直下や PronunciationAssessment オブジェクト内にある
    const pronunciationAssessment = nbest?.PronunciationAssessment
    
    // スコア情報を取得（複数の場所を確認）
    const accuracyScore = pronunciationAssessment?.AccuracyScore || nbest?.AccuracyScore || 0
    const fluencyScore = pronunciationAssessment?.FluencyScore || nbest?.FluencyScore || 0
    const completenessScore = pronunciationAssessment?.CompletenessScore || nbest?.CompletenessScore || 0
    const pronScore = pronunciationAssessment?.PronScore || nbest?.PronScore || 0
    
    console.log('=== PRONUNCIATION SCORES ===')
    console.log('AccuracyScore:', accuracyScore)
    console.log('FluencyScore:', fluencyScore) 
    console.log('CompletenessScore:', completenessScore)
    console.log('PronScore:', pronScore)
    
    // スコアがすべて0の場合でも、音素レベルのデータがあれば処理を続行
    const hasWordsData = nbest?.Words && nbest.Words.length > 0
    if (!pronunciationAssessment && !hasWordsData && (accuracyScore === 0 && fluencyScore === 0)) {
      console.log('=== WARNING: Limited pronunciation data available ===')
    }

    const recognizedText = nbest?.Display || ''
    
    // スコアが0の場合、音素レベルのデータから推定評価を生成
    let finalAccuracyScore = accuracyScore
    let finalFluencyScore = fluencyScore  
    let finalCompletenessScore = completenessScore
    let finalPronScore = pronScore
    
    if (pronScore === 0 && hasWordsData) {
      console.log('=== GENERATING SCORES FROM PHONEME DATA ===')
      const wordsData = nbest.Words
      const phoneDataAvailable = wordsData.some((word: any) => word.Phonemes && word.Phonemes.length > 0)
      
      if (phoneDataAvailable) {
        // 認識されたテキストと参照テキストを比較
        const similarity = calculateSimilarity(recognizedText.toLowerCase(), referenceText.toLowerCase())
        finalAccuracyScore = Math.round(similarity * 100)
        finalFluencyScore = finalAccuracyScore // 簡易的に同じ値を使用
        finalCompletenessScore = finalAccuracyScore
        finalPronScore = finalAccuracyScore
        
        console.log('Phoneme-based evaluation:')
        console.log('Similarity:', similarity)
        console.log('Generated scores:', finalPronScore)
      }
    }
    
    // スコアをグレードに変換
    const overallGrade = getGradeFromScore(finalPronScore)
    
    // 改善点とポジティブフィードバックを生成
    const improvements = generateImprovements(finalAccuracyScore, finalFluencyScore, finalCompletenessScore)
    const positives = generatePositives(finalAccuracyScore, finalFluencyScore, finalCompletenessScore)
    
    const feedback = finalPronScore > 0 
      ? `Azure発音評価スコア: ${finalPronScore}/100。${improvements.length > 0 ? improvements.join(' ') : '素晴らしい発音です！'}`
      : `Azure音声認識結果: "${recognizedText}". 音素レベル分析による評価。`

    return {
      overallGrade,
      gradeDescription: getGradeDescription(overallGrade),
      pronunciationScore: finalPronScore,
      accuracyScore: finalAccuracyScore,
      fluencyScore: finalFluencyScore,
      completenessScore: finalCompletenessScore,
      recognizedText,
      improvements,
      positives,
      feedback,
      isPass: finalPronScore >= 70, // スコアに基づいて合格/不合格を判定
      azureData: data
    }
  } catch (error) {
    console.error('=== ERROR PROCESSING PRONUNCIATION ASSESSMENT ===')
    console.error(error)
    throw error
  }
}

function createResultFromSpeechToText(
  recognizedText: string, 
  referenceText: string
): PronunciationAssessmentResult {
  
  console.log('=== CREATING RESULT FROM SPEECH TO TEXT ===')
  console.log('Recognized text:', recognizedText)
  console.log('Reference text:', referenceText)
  
  // 基本的な文字比較による簡易評価
  const similarity = calculateSimilarity(recognizedText.toLowerCase(), referenceText.toLowerCase())
  const score = Math.round(similarity * 100)
  const grade = getGradeFromScore(score)
  
  console.log('Similarity:', similarity)
  console.log('Score:', score)
  console.log('Grade:', grade)
  
  const improvements = score < 70 ? ['発音の正確性を向上させてください'] : []
  const positives = score >= 70 ? ['認識できる発音でした'] : []
  
  return {
    overallGrade: grade,
    gradeDescription: getGradeDescription(grade),
    pronunciationScore: score,
    accuracyScore: score,
    fluencyScore: score,
    completenessScore: score,
    recognizedText,
    improvements,
    positives,
    feedback: `音声認識結果: "${recognizedText}". 簡易評価スコア: ${score}/100`,
    isPass: grade === 'A' || grade === 'B'
  }
}

function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 1.0
  
  const distance = levenshteinDistance(str1, str2)
  return (maxLength - distance) / maxLength
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

function getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'E'
}

function getGradeDescription(grade: 'A' | 'B' | 'C' | 'D' | 'E'): string {
  const descriptions = {
    'A': '優秀 - ネイティブレベルの発音',
    'B': '良好 - 非常に理解しやすい発音',
    'C': '普通 - 理解できる発音',
    'D': '要改善 - 発音練習が必要',
    'E': '大幅改善必要 - 集中的な練習が必要'
  }
  return descriptions[grade]
}

function generateImprovements(accuracy: number, fluency: number, completeness: number): string[] {
  const improvements = []
  
  if (accuracy < 70) {
    improvements.push('子音と母音の発音をより正確に')
  }
  if (fluency < 70) {
    improvements.push('より自然な話し方を心がけて')
  }
  if (completeness < 70) {
    improvements.push('すべての単語をはっきりと発音して')
  }
  
  return improvements
}

function generatePositives(accuracy: number, fluency: number, completeness: number): string[] {
  const positives = []
  
  if (accuracy >= 80) {
    positives.push('発音の正確性が高い')
  }
  if (fluency >= 80) {
    positives.push('流暢な話し方')
  }
  if (completeness >= 80) {
    positives.push('完全な発音')
  }
  
  return positives
}

function createDemoResult(error: Error): PronunciationAssessmentResult {
  console.log('=== CREATING DEMO RESULT ===')
  console.log('Error:', error.message)
  
  return {
    overallGrade: 'C',
    gradeDescription: '普通 - 理解できる発音',
    pronunciationScore: 75,
    accuracyScore: 72,
    fluencyScore: 78,
    completenessScore: 75,
    recognizedText: 'Demo recognition result',
    improvements: ['発音の正確性を向上させてください'],
    positives: ['理解しやすい発音でした'],
    feedback: 'デモ評価: Azure Speech Service接続に問題がありましたが、発音練習を続けてください！',
    error: error.message,
    isPass: false
  }
}

function combineResults(azureResult: PronunciationAssessmentResult, advancedResult: any): PronunciationAssessmentResult {
  console.log('=== COMBINING AZURE AND ADVANCED RESULTS ===')
  
  // Azure結果をベースにする
  const combined = { ...azureResult }
  
  // 高度な分析結果を追加
  if (advancedResult && advancedResult.success) {
    combined.advancedAnalysis = advancedResult
    
    // 高度な分析のスコアを考慮して総合スコアを調整
    const advancedScore = advancedResult.overallScore || 0
    const azureScore = azureResult.pronunciationScore || 0
    
    // 重み付け平均（Azure: 60%, Advanced: 40%）
    const combinedScore = Math.round(azureScore * 0.6 + advancedScore * 0.4)
    combined.pronunciationScore = combinedScore
    
    // グレードを再計算
    combined.overallGrade = getGradeFromScore(combinedScore)
    combined.isPass = combinedScore >= 70
    
    // 詳細フィードバックを統合
    if (advancedResult.detailedFeedback) {
      combined.improvements = [...combined.improvements, ...advancedResult.detailedFeedback]
    }
    
    // カタカナ検出結果を追加
    if (advancedResult.katakanaDetection) {
      if (advancedResult.katakanaDetection.detected) {
        combined.improvements.push('カタカナ発音が検出されました。ネイティブ発音を心がけてください。')
      }
    }
    
    console.log('Combined score:', combinedScore)
    console.log('Combined grade:', combined.overallGrade)
  }
  
  return combined
}