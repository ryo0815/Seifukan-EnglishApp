import { NextRequest, NextResponse } from 'next/server'

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION

async function getAzurePronunciationAssessment(audioBuffer: Buffer, referenceText: string) {
  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    throw new Error('Azure Speech credentials are not configured in environment variables.')
  }

  // 正しい発音評価エンドポイント
  const url = `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`
  
  // 発音評価の設定
  const pronunciationConfig = {
    ReferenceText: referenceText,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
  }

  const headers = {
    'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
    'Content-Type': 'audio/wav',
    'Accept': 'application/json',
    'Pronunciation-Assessment': Buffer.from(JSON.stringify(pronunciationConfig)).toString('base64'),
  }

  console.log('Sending request to Azure Speech Service...')
  console.log('URL:', url)
  console.log('Headers:', { ...headers, 'Ocp-Apim-Subscription-Key': '***' })
  console.log('Audio buffer size:', audioBuffer.length)

  const response = await fetch(url, { 
    method: 'POST', 
    headers, 
    body: audioBuffer 
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Azure Error Response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: errorText
    })
    throw new Error(`Azure pronunciation assessment failed. Status: ${response.status}, Message: ${errorText}`)
  }

  const result = await response.json()
  console.log('Azure Response:', JSON.stringify(result, null, 2))
  return result
}

function getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'E'
}

const getAdviceForScore = (score: number): string[] => {
  const advice: string[] = [];

  if (score >= 95) {
    advice.push("素晴らしい！完璧な発音です。");
    advice.push("自信を持って次に進みましょう。");
    advice.push("ネイティブに近い、自然な発音です。");
  } else if (score >= 85) {
    advice.push("高得点！とても良い発音です。");
    advice.push("細かい音を意識して、更に改善しましょう。");
    advice.push("リズムと抑揚も真似てみましょう。");
  } else if (score >= 75) {
    advice.push("良い調子！自信を持って発音しましょう。");
    advice.push("単語の繋がりを、より滑らかに。");
    advice.push("語尾の音まではっきりと。");
  } else if (score >= 60) {
    advice.push("惜しい！もう少しです。");
    advice.push("口の形と舌の動きを意識して再挑戦。");
    advice.push("お手本をよく聞いて、リズムを真似ましょう。");
  } else {
    advice.push("まずはお手本をゆっくり聞きましょう。");
    advice.push("一語一語をはっきりと発音しましょう。");
    advice.push("焦らず、自分のペースで練習しましょう。");
  }
  return advice;
};

export async function POST(request: NextRequest) {
  try {
    console.log('\n--- 🚀 Starting Speech Evaluation (Vercel Compatible) ---')

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const referenceText = formData.get('referenceText') as string

    if (!audioFile || !referenceText) {
      return NextResponse.json({ error: 'Missing audio file or reference text.' }, { status: 400 })
    }

    console.log('Received audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    })
    console.log('Reference text:', referenceText)

    const userAudioBuffer = Buffer.from(await audioFile.arrayBuffer())
    console.log('Converted to buffer, size:', userAudioBuffer.length)

    console.log('1. 🔬 Running Azure pronunciation assessment...')
    const azureResult = await getAzurePronunciationAssessment(userAudioBuffer, referenceText)
    
    const nBest = azureResult?.NBest?.[0]
    const pronunciationScore = nBest?.PronunciationAssessment?.PronScore || 0
    
    console.log('Azure result structure:', {
      hasNBest: !!azureResult?.NBest,
      nBestLength: azureResult?.NBest?.length,
      firstNBest: nBest,
      pronunciationScore
    })
    
    if (nBest) {
        console.log(`   ☁️ Azure Result: SUCCESS | Score: ${pronunciationScore}`)
    } else {
        console.log(`   ☁️ Azure Result: FAILED or No Score`)
    }

    console.log('2. 🧮 Calculating final score...')
    const grade = getGradeFromScore(pronunciationScore)
    const isPass = grade === 'A' || grade === 'B'
    const advice = getAdviceForScore(pronunciationScore)

    console.log(`   - Final Score: ${pronunciationScore}`)
    console.log(`   - Grade: ${grade} (${isPass ? 'Pass' : 'Fail'})`);
    console.log('--- ✅ Evaluation Complete --- \n')

    return NextResponse.json({
      success: true,
      pronunciationScore: pronunciationScore,
      accuracyScore: nBest?.PronunciationAssessment?.AccuracyScore || 0,
      fluencyScore: nBest?.PronunciationAssessment?.FluencyScore || 0,
      completenessScore: nBest?.PronunciationAssessment?.CompletenessScore || 0,
      grade: grade,
      isPass: isPass,
      advice: advice,
      recognizedText: nBest?.Display || "N/A",
      azureData: azureResult,
    })

  } catch (error) {
    console.error('\n--- ❌ Speech Evaluation CRASHED ---')
    const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred'
    console.error(errorMessage)
    console.error(error)
    console.error('--- END OF CRASH REPORT ---\n')
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}