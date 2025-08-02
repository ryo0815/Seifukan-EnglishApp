import { NextRequest, NextResponse } from 'next/server'

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || ''
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || ''

async function getAzureTtsToken(): Promise<string> {
  const tokenUrl = `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to get Azure TTS token')
  }
  return response.text()
}

export async function POST(request: NextRequest) {
  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    return NextResponse.json({ error: 'Azure credentials are not configured.' }, { status: 500 })
  }

  try {
    const { text } = await request.json()
    if (!text) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 })
    }

    const token = await getAzureTtsToken()
    const ttsUrl = `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`

    const ssml = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
        <voice name='en-US-JennyNeural'>
          ${text}
        </voice>
      </speak>
    `

    const ttsResponse = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
        'User-Agent': 'SeifukanEnglishApp',
      },
      body: ssml,
    })

    if (!ttsResponse.ok) {
      const errorBody = await ttsResponse.text()
      console.error('Azure TTS Error:', errorBody)
      return NextResponse.json({ error: 'Failed to generate speech from Azure.' }, { status: 500 })
    }

    const audioData = await ttsResponse.arrayBuffer()
    
    return new NextResponse(audioData, {
      status: 200,
      headers: { 'Content-Type': 'audio/wav' },
    })

  } catch (error) {
    console.error('TTS API Error:', error)
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 })
  }
} 