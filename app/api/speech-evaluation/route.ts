import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || ''
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || ''
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// --- Helper Functions ---

async function getAzurePronunciationAssessment(audioBuffer: Buffer, referenceText: string) {
  // This is a simplified version of the original Azure call
  // In a real scenario, you'd reuse the more complex logic from before
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
    console.error("Azure Error:", await response.text())
    throw new Error('Azure pronunciation assessment failed.')
  }
  return response.json()
}

function runPythonScript(userAudioPath: string, refAudioPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // More robust way to call the python script in the virtual environment
    const pythonExecutable = path.join(process.cwd(), '.venv', 'bin', 'python3')
    const scriptPath = path.join(process.cwd(), 'python', 'evaluate_dtw.py')

    execFile(pythonExecutable, [scriptPath, userAudioPath, refAudioPath], (error, stdout, stderr) => {
      if (error) {
        console.error('Python Script Stderr:', stderr)
        // Add more context to the error
        const detailedError = new Error(`Python script execution failed: ${error.message}\nStderr: ${stderr}`)
        return reject(detailedError)
      }
      try {
        resolve(JSON.parse(stdout))
      } catch (parseError) {
        reject(parseError)
      }
    })
  })
}

// --- Helper Functions for Grading and Feedback ---

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


// --- Main API Handler ---

export async function POST(request: NextRequest) {
  let tempUserAudioPath = ''
  let tempRefAudioPath = ''

  try {
    console.log('\n--- 🚀 Starting Speech Evaluation ---')

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const referenceText = formData.get('referenceText') as string

    if (!audioFile || !referenceText) {
      return NextResponse.json({ error: 'Missing audio file or reference text.' }, { status: 400 })
    }

    const userAudioBuffer = Buffer.from(await audioFile.arrayBuffer())

    // 1. Get reference audio from TTS API
    console.log('1. 🗣️ Generating reference audio via TTS...')
    const ttsResponse = await fetch(`${NEXT_PUBLIC_API_URL}/api/text-to-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: referenceText }),
    })
    if (!ttsResponse.ok) throw new Error('Failed to get reference audio from TTS API.')
    const refAudioBuffer = Buffer.from(await ttsResponse.arrayBuffer())
    console.log('   ✅ TTS audio generated successfully.')


    // 2. Write audio files to temp directory
    const tempDir = os.tmpdir()
    tempUserAudioPath = path.join(tempDir, `user_${Date.now()}.wav`)
    tempRefAudioPath = path.join(tempDir, `ref_${Date.now()}.wav`)
    await fs.writeFile(tempUserAudioPath, userAudioBuffer)
    await fs.writeFile(tempRefAudioPath, refAudioBuffer)

    // 3. Run evaluations in parallel
    console.log('2. 🔬 Running evaluations in parallel (Azure & Python)...')
    const [azureResult, dtwResult] = await Promise.all([
      getAzurePronunciationAssessment(userAudioBuffer, referenceText),
      runPythonScript(tempUserAudioPath, tempRefAudioPath)
    ])

    if (dtwResult.success) {
        console.log(`   🐍 Python (DTW) Result: SUCCESS | Score: ${dtwResult.dtwScore}`)
    } else {
        console.error(`   🐍 Python (DTW) Result: FAILED | Error: ${dtwResult.error}`)
    }
    
    const dtwScore = dtwResult.dtwScore || 0
    const nBest = azureResult?.NBest?.[0]
    const azureScore = nBest?.PronunciationAssessment?.PronScore || 0
    if (nBest) {
        console.log(`   ☁️ Azure Result: SUCCESS | Score: ${azureScore}`)
    } else {
        console.log(`   ☁️ Azure Result: FAILED or No Score`)
    }

    // 4. Combine results and generate final score
    console.log('3. 🧮 Calculating final score...')
    
    let combinedScore = 0
    let feedback = ""

    // If Azure provides a meaningful score, combine it with DTW.
    if (azureScore > 0) {
        combinedScore = Math.round(azureScore * 0.6 + dtwScore * 0.4); // Adjusted weights
        feedback = `総合スコア: ${combinedScore}`;
        console.log(`   - Combining scores: Azure Score: ${azureScore} (60%) + DTW Score: ${dtwScore} (40%)`);
    } else { // If Azure score is 0, rely solely on DTW score.
        combinedScore = Math.round(dtwScore);
        feedback = `音響分析スコア: ${combinedScore}`;
        console.log(`   - Azure score is 0. Using DTW score as final score.`);
    }

    console.log(`   - Final Combined Score: ${combinedScore}`)

    const grade = getGradeFromScore(combinedScore);
    const isPass = grade === 'A' || grade === 'B';
    const advice = getAdviceForScore(combinedScore);

    console.log(`   - Grade: ${grade} (${isPass ? 'Pass' : 'Fail'})`);
    console.log('--- ✅ Evaluation Complete --- \n')

    return NextResponse.json({
      success: true,
      pronunciationScore: combinedScore,
      grade: grade,
      isPass: isPass,
      advice: advice,
      recognizedText: nBest?.Display || "N/A",
      // ... keep azureData and dtwData for potential detailed view later
      azureData: azureResult,
      dtwData: dtwResult,
    })

  } catch (error) {
    console.error('\n--- ❌ Speech Evaluation CRASHED ---')
    console.error(error)
    console.error('--- END OF CRASH REPORT ---\n')
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  } finally {
    // 5. Clean up temporary files
    if (tempUserAudioPath) await fs.unlink(tempUserAudioPath).catch(console.error)
    if (tempRefAudioPath) await fs.unlink(tempRefAudioPath).catch(console.error)
  }
}