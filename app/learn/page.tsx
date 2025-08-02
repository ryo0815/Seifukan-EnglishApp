"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Play, 
  BookOpen,
  Clock,
  Star,
  Award,
  ChevronRight
} from "lucide-react"

const learningPaths = [
  {
    id: "basic-greetings",
    title: "基本的な挨拶",
    description: "日常的な挨拶とその返答を学習",
    level: 1,
    progress: 75,
    lessons: 12,
    estimatedTime: "20分",
    difficulty: "初級",
    color: "blue",
    phrases: [
      "Hello! How are you?",
      "Good morning!",
      "Nice to meet you!",
      "Have a good day!"
    ]
  },
  {
    id: "self-introduction",
    title: "自己紹介",
    description: "名前、職業、趣味などの自己紹介",
    level: 2,
    progress: 25,
    lessons: 15,
    estimatedTime: "30分",
    difficulty: "初級",
    color: "green",
    phrases: [
      "My name is...",
      "I work as a...",
      "I'm from...",
      "I like..."
    ]
  },
  {
    id: "daily-conversation",
    title: "日常会話",
    description: "買い物、レストラン、道案内など",
    level: 3,
    progress: 0,
    lessons: 20,
    estimatedTime: "45分",
    difficulty: "中級",
    color: "purple",
    locked: true,
    phrases: [
      "How much is this?",
      "Where is the bathroom?",
      "Can you help me?",
      "What time is it?"
    ]
  },
  {
    id: "business-english",
    title: "ビジネス英語",
    description: "会議、プレゼンテーション、メールなど",
    level: 4,
    progress: 0,
    lessons: 25,
    estimatedTime: "60分",
    difficulty: "上級",
    color: "orange",
    locked: true,
    phrases: [
      "Let's schedule a meeting",
      "I'd like to present...",
      "Could you send me the report?",
      "Thank you for your time"
    ]
  }
]

export default function LearnPage() {
  const router = useRouter()
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const handleBack = () => {
    router.push('/')
  }

  const handleStartLesson = (pathId: string) => {
    if (pathId === "basic-greetings") {
      router.push('/stage/basic/greetings')
    } else {
      alert(`${pathId} - 準備中です！`)
    }
  }

  const getColorClasses = (color: string, isLocked: boolean = false) => {
    if (isLocked) {
      return {
        bg: "bg-gray-100",
        border: "border-gray-300",
        text: "text-gray-500",
        accent: "bg-gray-300"
      }
    }

    const colors = {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-600",
        accent: "bg-blue-500"
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-600",
        accent: "bg-green-500"
      },
      purple: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-600",
        accent: "bg-purple-500"
      },
      orange: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-600",
        accent: "bg-orange-500"
      }
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      {/* ヘッダー */}
      <motion.header 
        className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={handleBack}
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ホームに戻る
            </Button>
          </motion.div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold">学習コース</h1>
            <p className="text-green-100">あなたのペースで英語を学習しましょう</p>
          </div>
          
          <div className="w-20"></div> {/* スペーサー */}
        </div>
      </motion.header>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* 学習パス一覧 */}
        <div className="space-y-6">
          {learningPaths.map((path, index) => {
            const colors = getColorClasses(path.color, path.locked)
            
            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-xl shadow-lg border-2 ${colors.border} ${colors.bg} overflow-hidden ${path.locked ? 'opacity-75' : 'hover:shadow-xl'} transition-all duration-300`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className={`w-12 h-12 ${colors.accent} rounded-full flex items-center justify-center mr-4`}>
                          <span className="text-white font-bold text-lg">{path.level}</span>
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold ${path.locked ? 'text-gray-500' : 'text-gray-800'}`}>
                            {path.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className={`${colors.text} font-medium`}>{path.difficulty}</span>
                            <span className="text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {path.estimatedTime}
                            </span>
                            <span className="text-gray-500 flex items-center">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {path.lessons}レッスン
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className={`mb-4 ${path.locked ? 'text-gray-400' : 'text-gray-600'}`}>
                        {path.description}
                      </p>

                      {/* 例文プレビュー */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">学習内容の例:</p>
                        <div className="flex flex-wrap gap-2">
                          {path.phrases.slice(0, 2).map((phrase, i) => (
                            <span 
                              key={i}
                              className={`px-3 py-1 rounded-full text-xs ${path.locked ? 'bg-gray-200 text-gray-400' : 'bg-white text-gray-600'} border`}
                            >
                              "{phrase}"
                            </span>
                          ))}
                          {path.phrases.length > 2 && (
                            <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-500 border">
                              +{path.phrases.length - 2}個
                            </span>
                          )}
                        </div>
                      </div>

                      {/* プログレスバー */}
                      {!path.locked && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">進捗</span>
                            <span className={colors.text}>{path.progress}%</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${colors.accent} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${path.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* アクションボタン */}
                    <div className="ml-6">
                      {path.locked ? (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                            <Award className="w-6 h-6 text-gray-500" />
                          </div>
                          <p className="text-xs text-gray-500">前のレベルを<br />完了してください</p>
                        </div>
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={() => handleStartLesson(path.id)}
                            className={`${colors.accent} hover:opacity-90 text-white font-bold py-3 px-6 rounded-full flex items-center`}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {path.progress > 0 ? '続きから' : '開始'}
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 学習のヒント */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white rounded-xl shadow-lg p-6 border-2 border-yellow-200"
        >
          <div className="flex items-center mb-4">
            <Star className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-800">学習のコツ</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">毎日続けることが大切</h4>
              <p>短時間でも毎日練習することで、着実にスキルが向上します。</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">声に出して練習</h4>
              <p>発音練習は実際に声に出すことで効果が格段に向上します。</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">間違いを恐れない</h4>
              <p>間違いは学習の一部です。積極的にチャレンジしましょう。</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">復習を忘れずに</h4>
              <p>学習した内容は定期的に復習して定着させましょう。</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 