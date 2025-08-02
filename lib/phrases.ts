export interface SubStage {
  id: string
  title: string
  description: string
  phrases: Phrase[]
}

export interface Phrase {
  id: string
  text: string
  translation: string
  phonetic?: string
  katakana?: string
  audioUrl?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface Stage {
  id: string
  title: string
  description: string
  subStages: SubStage[]
  level: 'defense' | 'attack' | 'broadcast'
}

export const stages: Stage[] = [
  {
    id: 'stage-0',
    title: '防御 - 基本応答',
    description: '基本的な挨拶と応答を身につけよう',
    level: 'defense',
    subStages: [
      {
        id: 'greeting',
        title: '挨拶',
        description: '基本的な挨拶を覚えよう',
        phrases: [
          {
            id: 'hello',
            text: 'Hello!',
            translation: 'こんにちは！',
            phonetic: '/həˈloʊ/',
            katakana: 'ハロー',
            difficulty: 'beginner'
          },
          {
            id: 'good-morning',
            text: 'Good morning!',
            translation: 'おはようございます！',
            phonetic: '/ɡʊd ˈmɔrnɪŋ/',
            katakana: 'グッド モーニング',
            difficulty: 'beginner'
          },
          {
            id: 'how-are-you',
            text: 'How are you?',
            translation: '元気ですか？',
            phonetic: '/haʊ ɑr ju/',
            katakana: 'ハウ アー ユー',
            difficulty: 'beginner'
          },
          {
            id: 'fine-thanks',
            text: "I'm fine, thank you.",
            translation: '元気です、ありがとう。',
            phonetic: "/aɪm faɪn, ˈθæŋk ju/",
            katakana: 'アイム ファイン サンキュー',
            difficulty: 'beginner'
          }
        ]
      },
      {
        id: 'introduction',
        title: '自己紹介',
        description: '自分について話そう',
        phrases: [
          {
            id: 'my-name-is',
            text: 'My name is...',
            translation: '私の名前は...です',
            phonetic: '/maɪ neɪm ɪz.../',
            katakana: 'マイ ネーム イズ',
            difficulty: 'beginner'
          },
          {
            id: 'im-from',
            text: "I'm from Japan.",
            translation: '私は日本出身です。',
            phonetic: '/aɪm frʌm dʒəˈpæn/',
            katakana: 'アイム フロム ジャパン',
            difficulty: 'beginner'
          },
          {
            id: 'nice-to-meet-you',
            text: 'Nice to meet you.',
            translation: 'はじめまして。',
            phonetic: '/naɪs tu mit ju/',
            katakana: 'ナイス トゥ ミート ユー',
            difficulty: 'beginner'
          }
        ]
      }
    ]
  },
  {
    id: 'stage-1',
    title: '攻撃 - 積極的会話',
    description: '積極的に会話を始めよう',
    level: 'attack',
    subStages: [
      {
        id: 'asking-questions',
        title: '質問する',
        description: '相手に質問してみよう',
        phrases: [
          {
            id: 'where-are-you-from',
            text: 'Where are you from?',
            translation: 'どちらの出身ですか？',
            phonetic: '/wɛər ɑr ju frʌm?/',
            difficulty: 'intermediate'
          },
          {
            id: 'what-do-you-do',
            text: 'What do you do for work?',
            translation: 'お仕事は何をされていますか？',
            phonetic: '/wʌt du ju du fɔr wɜrk?/',
            difficulty: 'intermediate'
          },
          {
            id: 'do-you-like',
            text: 'Do you like Japanese food?',
            translation: '日本料理は好きですか？',
            phonetic: '/du ju laɪk ˌdʒæpəˈniz fud?/',
            difficulty: 'intermediate'
          }
        ]
      },
      {
        id: 'expressing-opinions',
        title: '意見を言う',
        description: '自分の考えを伝えよう',
        phrases: [
          {
            id: 'i-think',
            text: 'I think this is great.',
            translation: 'これは素晴らしいと思います。',
            phonetic: '/aɪ θɪŋk ðɪs ɪz ɡreɪt./',
            difficulty: 'intermediate'
          },
          {
            id: 'in-my-opinion',
            text: 'In my opinion, this is the best choice.',
            translation: '私の意見では、これが最良の選択です。',
            phonetic: '/ɪn maɪ əˈpɪnjən, ðɪs ɪz ðə bɛst tʃɔɪs./',
            difficulty: 'advanced'
          }
        ]
      }
    ]
  },
  {
    id: 'stage-2',
    title: '発信 - 情報発信',
    description: '自分の情報を積極的に発信しよう',
    level: 'broadcast',
    subStages: [
      {
        id: 'telling-stories',
        title: '体験談を話す',
        description: '自分の経験を話そう',
        phrases: [
          {
            id: 'yesterday-i',
            text: 'Yesterday, I went to Tokyo.',
            translation: '昨日、東京に行きました。',
            phonetic: '/ˌjɛstərˌdeɪ, aɪ wɛnt tu ˈtoʊkiˌoʊ./',
            difficulty: 'intermediate'
          },
          {
            id: 'last-week',
            text: 'Last week, I tried a new restaurant.',
            translation: '先週、新しいレストランに行きました。',
            phonetic: '/læst wik, aɪ traɪd ə nu ˈrɛstəˌrɑnt./',
            difficulty: 'intermediate'
          },
          {
            id: 'it-was-amazing',
            text: 'It was an amazing experience.',
            translation: '素晴らしい体験でした。',
            phonetic: '/ɪt wʌz ən əˈmeɪzɪŋ ɪkˈspɪriəns./',
            difficulty: 'advanced'
          }
        ]
      },
      {
        id: 'making-plans',
        title: '計画を立てる',
        description: '将来の計画について話そう',
        phrases: [
          {
            id: 'i-plan-to',
            text: 'I plan to visit Kyoto next month.',
            translation: '来月京都を訪れる予定です。',
            phonetic: '/aɪ plæn tu ˈvɪzɪt ˈkjoʊtoʊ nɛkst mʌnθ./',
            difficulty: 'advanced'
          },
          {
            id: 'would-you-like',
            text: 'Would you like to join me?',
            translation: '一緒に来ませんか？',
            phonetic: '/wʊd ju laɪk tu dʒɔɪn mi?/',
            difficulty: 'advanced'
          }
        ]
      }
    ]
  }
]

export function getStageById(stageId: string): Stage | undefined {
  return stages.find(stage => stage.id === stageId)
}

export function getSubStageById(stageId: string, subStageId: string): SubStage | undefined {
  const stage = getStageById(stageId)
  if (!stage) return undefined
  return stage.subStages.find(subStage => subStage.id === subStageId)
} 