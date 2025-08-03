import { NextRequest, NextResponse } from 'next/server'

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION

async function getAzurePronunciationAssessment(audioBuffer: Buffer, referenceText: string) {
  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    throw new Error('Azure Speech credentials are not configured in environment variables.')
  }

  const url = `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`
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

  const response = await fetch(url, { method: 'POST', headers, body: audioBuffer })
  if (!response.ok) {
    const errorText = await response.text()
    console.error("Azure Error:", errorText)
    throw new Error(`Azure pronunciation assessment failed. Status: ${response.status}, Message: ${errorText}`)
  }
  return response.json()
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

    const userAudioBuffer = Buffer.from(await audioFile.arrayBuffer())

    console.log('1. 🔬 Running Azure pronunciation assessment...')
    const azureResult = await getAzurePronunciationAssessment(userAudioBuffer, referenceText)
    
    // Log the full Azure response for debugging
    console.log('   ☁️ Full Azure Response:', JSON.stringify(azureResult, null, 2))

    // Handle cases where recognition fails
    if (azureResult.RecognitionStatus !== 'Success') {
      console.warn(`   ⚠️ Azure recognition failed with status: ${azureResult.RecognitionStatus}`)
      if (azureResult.RecognitionStatus === 'NoMatch') {
         throw new Error("音声が認識できませんでした。はっきりと発音してください。")
      }
      throw new Error(`Azure recognition failed: ${azureResult.RecognitionStatus}`)
    }

    const nBest = azureResult?.NBest?.[0]
    // FIX: Correctly access the score from the NBest object directly.
    const pronunciationScore = nBest?.PronScore || 0
    
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
      // FIX: Correctly access scores from the NBest object.
      accuracyScore: nBest?.AccuracyScore,
      fluencyScore: nBest?.FluencyScore,
      completenessScore: nBest?.CompletenessScore,
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