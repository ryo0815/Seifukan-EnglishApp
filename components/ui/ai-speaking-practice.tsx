"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "./button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog"
import { Mic, Square, SkipForward } from "lucide-react"

interface AISpeakingPracticeProps {
  targetText: string
  targetMeaning: string | undefined
  onComplete: (score: number) => void
  onIncorrect: () => void
  onNextQuestion: () => void
}

interface EvaluationResult {
  pronunciationScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  isPass: boolean;
  advice: string[];
  recognizedText: string;
}

export function AISpeakingPractice({
  targetText,
  targetMeaning,
  onComplete,
  onIncorrect,
  onNextQuestion
}: AISpeakingPracticeProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const recorderMimeType = useRef<string>('')

  // Reset component state when the phrase changes
  useEffect(() => {
    setEvaluationResult(null);
    setIsProcessing(false);
    setIsRecording(false);
  }, [targetText]);

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels
    const length = buffer.length * numOfChan * 2 + 44
    const wavBuffer = new ArrayBuffer(length)
    const view = new DataView(wavBuffer)
    const channels = []
    let i, sample
    let offset = 0
    let pos = 0

    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true)
      pos += 2
    }
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true)
      pos += 4
    }

    // Write WAVE header
    setUint32(0x46464952) // "RIFF"
    setUint32(length - 8) // file length - 8
    setUint32(0x45564157) // "WAVE"

    // Write "fmt " sub-chunk
    setUint32(0x20746d66) // "fmt "
    setUint32(16) // chunk size
    setUint16(1) // audio format 1 (PCM)
    setUint16(numOfChan)
    setUint32(buffer.sampleRate)
    setUint32(buffer.sampleRate * 2 * numOfChan) // byte rate
    setUint16(numOfChan * 2) // block align
    setUint16(16) // bits per sample

    // Write "data" sub-chunk
    setUint32(0x61746164) // "data"
    setUint32(length - pos - 4)

    // Get PCM data
    for (i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i))
    }

    // Write PCM samples
    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset])) // clamp
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff // scale to 16-bit
        view.setInt16(pos, sample, true)
        pos += 2
      }
      offset++
    }

    return new Blob([view], { type: 'audio/wav' })
  }

  const convertToWav = async (blob: Blob): Promise<Blob> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
    const arrayBuffer = await blob.arrayBuffer()

    if (arrayBuffer.byteLength === 0) {
      throw new Error("Cannot process empty audio file.")
    }

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    if (audioBuffer.length === 0) {
      throw new Error("Decoded audio buffer is empty.")
    }
    return audioBufferToWav(audioBuffer)
  }

  const startRecording = async () => {
    setEvaluationResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1 }
      })

      // Find a supported MIME type
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm'];
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

      if (!supportedMimeType) {
        alert("お使いのブラウザは音声録音に対応していません。");
        return;
      }
      recorderMimeType.current = supportedMimeType;
      console.log(`[Recording] Using supported MIME type: ${recorderMimeType.current}`);

      const recorder = new MediaRecorder(stream, { mimeType: recorderMimeType.current })
      mediaRecorder.current = recorder
      audioChunks.current = []
      recorder.ondataavailable = (event) => audioChunks.current.push(event.data)
      recorder.onstop = processSpeech
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Microphone access error:", error)
      alert("マイクへのアクセスを許可してください。")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      setIsProcessing(true)
    }
  }

  const processSpeech = async () => {
    if (audioChunks.current.length === 0) {
      console.log("[Speech Processing] No audio chunks recorded.");
      setIsProcessing(false)
      return
    }

    try {
      const audioBlob = new Blob(audioChunks.current, { type: recorderMimeType.current })
      console.log(`[Speech Processing] Created audioBlob with size: ${audioBlob.size}`);

      if (audioBlob.size < 1000) { // Increased minimum size
        console.error("[Speech Processing] Recorded audio blob is too small.");
        alert("録音された音声が短すぎるか、無音です。もう一度お試しください。");
        setIsProcessing(false);
        return;
      }
      
      const wavBlob = await convertToWav(audioBlob)

      const formData = new FormData()
      formData.append("audio", wavBlob, "recording.wav")
      formData.append("referenceText", targetText)
      
      const response = await fetch("/api/speech-evaluation", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()

      if (response.ok) {
        setEvaluationResult(result) // Show dialog
        if (result.isPass) {
          onComplete(result.pronunciationScore)
        } else {
          onIncorrect()
        }
      } else {
        throw new Error(result.error || "Evaluation failed")
      }

    } catch (error) {
      console.error("Evaluation processing error:", error)
      alert(`音声の処理に失敗しました: ${(error as Error).message}`)
      setEvaluationResult(null)
      onIncorrect()
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleDialogContinue = () => {
    onNextQuestion();
    setEvaluationResult(null);
  };

  const handleDialogRetry = () => {
    setEvaluationResult(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-6">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            size="lg"
            className={`w-32 h-32 rounded-full text-white ${isRecording ? 'bg-red-500' : 'bg-blue-500'}`}
          >
            {isProcessing ? (
              <span
                className="text-base font-semibold whitespace-nowrap"
                style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}
              >
                評価中...
              </span>
            ) : (
              isRecording ? <Square className="w-12 h-12" /> : <Mic className="w-12 h-12" />
            )}
          </Button>
          <Button variant="outline" onClick={onNextQuestion} disabled={isProcessing}>
            <SkipForward className="w-4 h-4 mr-2" />
            スキップ
          </Button>
        </div>
      </div>

      {evaluationResult && (
        <AlertDialog open={!!evaluationResult}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className={`text-2xl font-bold ${evaluationResult.isPass ? 'text-green-500' : 'text-red-500'}`}>
                {evaluationResult.isPass ? '合格！' : 'もう一回！'} ({evaluationResult.grade})
              </AlertDialogTitle>
              <div className="text-left bg-white rounded-lg space-y-2 pt-4">
                  <h4 className="font-bold text-slate-700">改善アドバイス</h4>
                  <AlertDialogDescription>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                        {evaluationResult.advice.map((item, index) => <li key={index} className="text-sm">{item}</li>)}
                    </ul>
                  </AlertDialogDescription>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {!evaluationResult.isPass && (
                <AlertDialogCancel onClick={handleDialogRetry}>再挑戦</AlertDialogCancel>
              )}
              <AlertDialogAction onClick={handleDialogContinue}>
                次へ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
} 