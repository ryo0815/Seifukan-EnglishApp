"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  BookOpen,
  Clock,
  Target,
  Trophy,
  Users,
  Zap,
  CheckCircle,
  Calendar
} from "lucide-react"

const curriculumPhases = [
  {
    id: "phase1",
    title: "Phase 1: 基礎コミュニケーション",
    duration: "4週間",
    level: "初級",
    status: "active",
    progress: 75,
    description: "英語でのコミュニケーションの基礎を固める",
    objectives: [
      "基本的な挨拶と自己紹介ができる",
      "日常的な質問に答えることができる",
      "簡単な会話を維持できる"
    ],
    skills: ["発音", "リスニング", "基本語彙"],
    weeks: [
      { week: 1, title: "挨拶とマナー", completed: true },
      { week: 2, title: "自己紹介", completed: true },
      { week: 3, title: "基本的な質問", completed: true },
      { week: 4, title: "簡単な会話", completed: false }
    ]
  },
  {
    id: "phase2",
    title: "Phase 2: 実践コミュニケーション",
    duration: "6週間", 
    level: "初中級",
    status: "upcoming",
    progress: 0,
    description: "実際の場面で使える英語表現を習得",
    objectives: [
      "買い物での会話ができる",
      "レストランで注文できる",
      "道を尋ねることができる"
    ],
    skills: ["実用表現", "状況別会話", "文法応用"],
    weeks: [
      { week: 1, title: "ショッピング", completed: false },
      { week: 2, title: "レストラン", completed: false },
      { week: 3, title: "交通機関", completed: false },
      { week: 4, title: "観光・道案内", completed: false },
      { week: 5, title: "電話での会話", completed: false },
      { week: 6, title: "総合復習", completed: false }
    ]
  },
  {
    id: "phase3",
    title: "Phase 3: ビジネス英語入門",
    duration: "8週間",
    level: "中級",
    status: "locked",
    progress: 0,
    description: "仕事で使える英語スキルの基礎を学習",
    objectives: [
      "ビジネスメールが書ける",
      "会議で発言できる",
      "プレゼンテーションができる"
    ],
    skills: ["ビジネス語彙", "フォーマル表現", "プレゼン技術"],
    weeks: [
      { week: 1, title: "ビジネスマナー", completed: false },
      { week: 2, title: "メール作成", completed: false },
      { week: 3, title: "電話応対", completed: false },
      { week: 4, title: "会議参加", completed: false },
      { week: 5, title: "資料説明", completed: false },
      { week: 6, title: "プレゼン準備", completed: false },
      { week: 7, title: "プレゼン実践", completed: false },
      { week: 8, title: "総合評価", completed: false }
    ]
  }
]

const userStats = {
  totalHours: 32,
  completedLessons: 47,
  currentStreak: 12,
  totalPoints: 1500
}

export default function CurriculumPage() {
  const router = useRouter()
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)

  const handleBack = () => {
    router.push('/')
  }

  const handleStartPhase = (phaseId: string) => {
    if (phaseId === "phase1") {
      router.push('/learn')
    } else {
      alert(`${phaseId} - 準備中です！`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return {
          bg: "bg-green-50",
          border: "border-green-200", 
          accent: "bg-green-500",
          text: "text-green-600"
        }
      case "upcoming":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          accent: "bg-blue-500", 
          text: "text-blue-600"
        }
      case "locked":
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          accent: "bg-gray-400",
          text: "text-gray-500"
        }
      default:
        return {
          bg: "bg-white",
          border: "border-gray-200",
          accent: "bg-gray-400",
          text: "text-gray-600"
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      {/* ヘッダー */}
      <motion.header 
        className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white"
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
            <h1 className="text-2xl font-bold">カリキュラム</h1>
            <p className="text-blue-100">体系的な学習プログラム</p>
          </div>
          
          <div className="w-20"></div>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* 学習統計 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-lg p-4 text-center shadow-md">
            <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{userStats.totalHours}</div>
            <div className="text-sm text-gray-600">学習時間</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-md">
            <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{userStats.completedLessons}</div>
            <div className="text-sm text-gray-600">完了レッスン</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-md">
            <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{userStats.currentStreak}</div>
            <div className="text-sm text-gray-600">連続学習日</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-md">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{userStats.totalPoints}</div>
            <div className="text-sm text-gray-600">獲得ポイント</div>
          </div>
        </motion.div>

        {/* カリキュラムフェーズ */}
        <div className="space-y-6">
          {curriculumPhases.map((phase, index) => {
            const colors = getStatusColor(phase.status)
            const isExpanded = selectedPhase === phase.id
            
            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className={`rounded-xl shadow-lg border-2 ${colors.border} ${colors.bg} overflow-hidden transition-all duration-300`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className={`w-12 h-12 ${colors.accent} rounded-full flex items-center justify-center mr-4`}>
                          <span className="text-white font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold ${phase.status === 'locked' ? 'text-gray-400' : 'text-gray-800'}`}>
                            {phase.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className={`${colors.text} font-medium`}>{phase.level}</span>
                            <span className="text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {phase.duration}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              phase.status === 'active' ? 'bg-green-100 text-green-700' :
                              phase.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {phase.status === 'active' ? '学習中' : 
                               phase.status === 'upcoming' ? '次のフェーズ' : 'ロック中'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className={`mb-4 ${phase.status === 'locked' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {phase.description}
                      </p>

                      {/* 進捗バー（アクティブフェーズのみ） */}
                      {phase.status === 'active' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">進捗</span>
                            <span className={colors.text}>{phase.progress}%</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${colors.accent} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${phase.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* 学習目標 */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-2" />
                          学習目標
                        </h4>
                        <ul className="space-y-1">
                          {phase.objectives.map((objective, i) => (
                            <li key={i} className={`text-sm flex items-center ${phase.status === 'locked' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                              {objective}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* スキル */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">習得スキル</h4>
                        <div className="flex flex-wrap gap-2">
                          {phase.skills.map((skill, i) => (
                            <span 
                              key={i}
                              className={`px-3 py-1 rounded-full text-xs ${
                                phase.status === 'locked' 
                                  ? 'bg-gray-200 text-gray-400' 
                                  : 'bg-white text-gray-600'
                              } border`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="ml-6">
                      {phase.status === 'locked' ? (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                            <BookOpen className="w-6 h-6 text-gray-500" />
                          </div>
                          <p className="text-xs text-gray-500">前のフェーズを<br />完了してください</p>
                        </div>
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={() => handleStartPhase(phase.id)}
                            className={`${colors.accent} hover:opacity-90 text-white font-bold py-3 px-6 rounded-full mb-2`}
                          >
                            {phase.status === 'active' ? '続きから' : '開始する'}
                          </Button>
                        </motion.div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPhase(isExpanded ? null : phase.id)}
                        className="w-full text-xs"
                      >
                        {isExpanded ? '詳細を閉じる' : '詳細を見る'}
                      </Button>
                    </div>
                  </div>

                  {/* 週別詳細（展開時） */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t pt-4 mt-4"
                    >
                      <h4 className="font-medium text-gray-800 mb-3">週別カリキュラム</h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {phase.weeks.map((week, i) => (
                          <div 
                            key={i}
                            className={`p-3 rounded-lg border-2 ${
                              week.completed 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Week {week.week}</span>
                              {week.completed && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600">{week.title}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 学習のコツ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200"
        >
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-800">カリキュラムの特徴</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">段階的学習</h4>
              <p>基礎から上級まで、無理なく着実にレベルアップできる構成になっています。</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">実践重視</h4>
              <p>実際の場面で使える表現を中心に、実用的な英語スキルを身につけます。</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">個別ペース</h4>
              <p>あなたのペースに合わせて学習を進められ、無理なく継続できます。</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 