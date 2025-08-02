// lib/pronunciation-comparison.ts

// This is a simulated implementation based on the API routes.
// In a real-world scenario, this would involve complex audio processing.

interface EvaluationResult {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  accuracyScore: number;
  fluencyScore: number;
  intonationScore: number;
  rhythmScore: number;
  feedback: string[];
  detailedAnalysis: {
    katakanaDetection: {
      detected: boolean;
      confidence: number;
      patterns: string[];
    };
  };
}

// Simple text similarity function (Levenshtein distance based)
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  return matrix[str2.length][str1.length];
}

function getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'E';
}

/**
 * Simulates the detection of Katakana-like pronunciation.
 * In a real implementation, this would analyze audio features.
 */
function detectKatakanaPronunciation(text: string): { detected: boolean; confidence: number; patterns: string[] } {
  const katakanaPatterns = [
    { pattern: /\b(and|but|that)\b/i, message: "and/but/thatの発音が弱い" },
    { pattern: /o$/i, message: "語尾の'o'が強すぎる" },
    { pattern: /u$/i, message: "語尾の'u'が母音化している" }
  ];

  let detected = false;
  let confidence = 0;
  const patterns: string[] = [];
  
  // Simple heuristic: short words are more prone to katakana pronunciation
  if (text.split(' ').length <= 2) {
    confidence = Math.random() * 0.4 + 0.2; // 20-60%
  } else {
    confidence = Math.random() * 0.2; // 0-20%
  }

  katakanaPatterns.forEach(p => {
    if (p.pattern.test(text)) {
      detected = true;
      patterns.push(p.message);
      confidence = Math.min(0.95, confidence + 0.3);
    }
  });

  if(patterns.length > 0) detected = true

  return { detected, confidence, patterns };
}

export function evaluatePronunciation(
  audioBuffer: ArrayBuffer,
  referenceText: string,
  userRecognizedText: string,
  userProsody: any
): EvaluationResult {
  // 1. Accuracy Score (based on text similarity)
  const accuracyScore = Math.round(calculateSimilarity(
    referenceText.toLowerCase().replace(/[^a-z0-9\s]/g, ''),
    userRecognizedText.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  ) * 100);

  // 2. Fluency, Intonation, Rhythm (simulated scores)
  const fluencyScore = Math.round(80 + Math.random() * 15);
  const intonationScore = Math.round(75 + Math.random() * 20);
  const rhythmScore = Math.round(78 + Math.random() * 18);

  // 3. Katakana Detection
  const katakanaDetection = detectKatakanaPronunciation(userRecognizedText);

  // 4. Overall Score Calculation
  let overallScore = (accuracyScore * 0.5) + (fluencyScore * 0.2) + (intonationScore * 0.15) + (rhythmScore * 0.15);
  
  // Penalize for katakana pronunciation
  if (katakanaDetection.detected) {
    overallScore *= (1 - katakanaDetection.confidence * 0.5);
  }
  overallScore = Math.round(Math.max(40, overallScore));

  // 5. Feedback Generation
  const feedback: string[] = [];
  if (accuracyScore < 70) feedback.push("単語の認識精度に課題があります。");
  if (katakanaDetection.detected) feedback.push("カタカナ発音に近い部分が検出されました。");
  if (intonationScore < 80) feedback.push("イントネーションをより意識してみましょう。");
  
  if (feedback.length === 0) feedback.push("素晴らしい発音です！");

  return {
    overallScore,
    grade: getGradeFromScore(overallScore),
    accuracyScore,
    fluencyScore,
    intonationScore,
    rhythmScore,
    feedback,
    detailedAnalysis: {
      katakanaDetection
    },
  };
} 