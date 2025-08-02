"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { getSubStageById } from "@/lib/phrases"
import { AISpeakingPractice } from "@/components/ui/ai-speaking-practice"
import {
  X,
  CheckCircle,
  Home,
  Volume2,
  Loader2,
} from "lucide-react"

export default function SubStagePage() {
  const router = useRouter()
  const params = useParams()
  const stageId = params.stageId as string
  const subStageId = params.subStageId as string

  const [isAudioLoading, setIsAudioLoading] = useState(false)

  const subStage = getSubStageById(stageId, subStageId)
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [completedPhrases, setCompletedPhrases] = useState<Set<number>>(new Set())

  if (!subStage) {
    return <div>Sub-stage not found</div>
  }

  const currentPhrase = subStage.phrases[currentPhraseIndex]
  const progress = (currentPhraseIndex / subStage.phrases.length) * 100
  const isCompleted = completedPhrases.size === subStage.phrases.length

  const handleHome = () => {
    router.push('/')
  }

  const handleNext = () => {
    if (currentPhraseIndex < subStage.phrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1)
    } else {
      // Mark all as complete and show completion screen
      const allCompleted = new Set(subStage.phrases.map((_, i) => i))
      setCompletedPhrases(allCompleted)
    }
  }

  const onCorrect = () => {
    const newCompleted = new Set(completedPhrases)
    newCompleted.add(currentPhraseIndex)
    setCompletedPhrases(newCompleted)
    // setTimeout(() => {
    //   handleNext()
    // }, 1500) // NOTE: Automatic progression removed as per user request.
  }

  const handlePlayReferenceAudio = async () => {
    if (isAudioLoading) return;
    setIsAudioLoading(true);
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentPhrase.text })
      });
      if (!response.ok) throw new Error('Audio generation failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => {
        setIsAudioLoading(false);
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error("Failed to play reference audio:", error);
      setIsAudioLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-100 p-4">
        <div className="w-full max-w-[400px] text-center">
          <CheckCircle className="w-24 h-24 text-green-500 mb-6 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">ステージクリア！</h1>
          <p className="text-gray-600 mb-8">
            「{subStage.title}」のすべてのフレーズをマスターしました。<br />おめでとうございます！
          </p>
          <Button onClick={handleHome} size="lg" className="w-full">
            ホームに戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="p-4">
        <div className="flex items-center gap-4 max-w-[400px] mx-auto">
          <Button variant="ghost" size="icon" onClick={handleHome}>
            <X className="w-6 h-6" />
          </Button>
          <Progress value={progress} className="h-4" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              このフレーズを発音してみよう
            </h1>
          </div>

          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <div className="flex justify-center items-center gap-4">
                <CardTitle className="text-center text-3xl sm:text-4xl font-bold text-blue-600">
                  {currentPhrase.text}
                </CardTitle>
                <Button onClick={handlePlayReferenceAudio} size="icon" variant="ghost" disabled={isAudioLoading}>
                  {isAudioLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Volume2 className="w-6 h-6" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-center text-lg text-gray-500 font-mono tracking-wider">
                {currentPhrase.phonetic}
              </p>
              <p className="text-center text-xs text-gray-400 mt-2">
                (お手本を真似して発音してみましょう)
              </p>
            </CardContent>
          </Card>

          <AISpeakingPractice
            targetText={currentPhrase.text}
            targetMeaning={currentPhrase.katakana}
            onComplete={onCorrect}
            onIncorrect={() => {
              // You can add logic for incorrect attempts here, e.g. showing a hint
            }}
            onNextQuestion={handleNext}
          />
        </div>
      </main>
    </div>
  )
} 