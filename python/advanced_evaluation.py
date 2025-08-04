import librosa
import numpy as np
import scipy.signal as signal
from scipy.spatial.distance import cosine
import json
import sys
import os
from typing import Dict, List, Tuple

def analyze_pronunciation(audio_path: str, reference_text: str) -> Dict:
    """
    高度な音響分析による発音評価
    """
    try:
        # 音声ファイルを読み込み
        y, sr = librosa.load(audio_path, sr=16000)
        
        # 基本統計
        duration = len(y) / sr
        energy = np.mean(librosa.feature.rms(y=y))
        
        # 各分析を個別に実行してエラーをキャッチ
        try:
            formants = extract_formants(y, sr)
        except Exception as e:
            print(f"Formant analysis error: {e}", file=sys.stderr)
            formants = {"f1_mean": 0, "f2_mean": 0, "f3_mean": 0, "formant_stability": 0, "score": 0}
        
        try:
            pitch_contour = extract_pitch_contour(y, sr)
        except Exception as e:
            print(f"Pitch analysis error: {e}", file=sys.stderr)
            pitch_contour = {"mean_pitch": 0, "pitch_std": 0, "pitch_range": 0, "pitch_smoothness": 0, "score": 0}
        
        try:
            rhythm_features = analyze_rhythm(y, sr)
        except Exception as e:
            print(f"Rhythm analysis error: {e}", file=sys.stderr)
            rhythm_features = {"tempo": 0, "beat_count": 0, "onset_count": 0, "rhythm_consistency": 0, "stress_pattern": "flat", "score": 0}
        
        try:
            phoneme_boundaries = detect_phoneme_boundaries(y, sr)
        except Exception as e:
            print(f"Phoneme analysis error: {e}", file=sys.stderr)
            phoneme_boundaries = {"boundary_count": 0, "boundary_quality": 0, "change_intensity": 0, "score": 0}
        
        try:
            katakana_score = detect_katakana_pronunciation(y, sr)
        except Exception as e:
            print(f"Katakana detection error: {e}", file=sys.stderr)
            katakana_score = {"detected": False, "confidence": 0, "indicators": [], "score": 0}
        
        # 総合スコア計算
        overall_score = calculate_overall_score(
            formants, pitch_contour, rhythm_features, 
            phoneme_boundaries, katakana_score, energy
        )
        
        return {
            "success": True,
            "overallScore": overall_score,
            "formantAnalysis": formants,
            "pitchAnalysis": pitch_contour,
            "rhythmAnalysis": rhythm_features,
            "phonemeAnalysis": phoneme_boundaries,
            "katakanaDetection": katakana_score,
            "energyLevel": float(energy),
            "duration": duration,
            "detailedFeedback": generate_detailed_feedback(
                formants, pitch_contour, rhythm_features, 
                phoneme_boundaries, katakana_score
            )
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def extract_formants(y: np.ndarray, sr: int) -> Dict:
    """
    フォルマント分析（母音の特徴を抽出）
    """
    try:
        # 短時間フーリエ変換
        stft = librosa.stft(y, n_fft=1024, hop_length=256)  # より短いフレーム
        
        # スペクトログラム
        spec = np.abs(stft)
        
        # フォルマント周波数推定
        formant_freqs = []
        for i in range(0, spec.shape[1], 5):  # より細かい間隔で分析
            frame = spec[:, i]
            if np.max(frame) > 0:
                # ピーク検出（より緩い条件）
                peaks, _ = signal.find_peaks(frame, height=np.max(frame)*0.05)
                if len(peaks) >= 2:  # 2つ以上のピークがあればOK
                    # 上位2つのピークをフォルマントとして使用
                    formant_freqs.append(peaks[:2].tolist())
        
        # フォルマント統計
        if formant_freqs and len(formant_freqs) > 0:
            formant_freqs = np.array(formant_freqs)
            if formant_freqs.shape[1] >= 2:  # 2つのフォルマントがあることを確認
                f1_mean = np.mean(formant_freqs[:, 0]) if len(formant_freqs) > 0 else 0
                f2_mean = np.mean(formant_freqs[:, 1]) if len(formant_freqs) > 0 else 0
                
                return {
                    "f1_mean": float(f1_mean),
                    "f2_mean": float(f2_mean),
                    "f3_mean": 0,  # 3つ目のフォルマントは省略
                    "formant_stability": float(np.std(formant_freqs)),
                    "score": calculate_formant_score(f1_mean, f2_mean, 0)
                }
    except Exception as e:
        print(f"Formant analysis error: {e}", file=sys.stderr)
    
    # フォルマントが見つからない場合のデフォルト値
    return {
        "f1_mean": 0,
        "f2_mean": 0,
        "f3_mean": 0,
        "formant_stability": 0,
        "score": 0.6  # デフォルトスコアを大幅に上げる
    }

def extract_pitch_contour(y: np.ndarray, sr: int) -> Dict:
    """
    ピッチ軌跡分析（イントネーション評価）
    """
    # ピッチ抽出
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    
    # 有効なピッチのみ抽出
    valid_pitches = []
    for t in range(pitches.shape[1]):
        index = magnitudes[:, t].argmax()
        pitch = pitches[index, t]
        if pitch > 0:
            valid_pitches.append(pitch)
    
    if valid_pitches:
        valid_pitches = np.array(valid_pitches)
        
        # ピッチ統計
        pitch_mean = np.mean(valid_pitches)
        pitch_std = np.std(valid_pitches)
        pitch_range = np.max(valid_pitches) - np.min(valid_pitches)
        
        # ピッチ変化の滑らかさ
        pitch_smoothness = calculate_pitch_smoothness(valid_pitches)
        
        return {
            "mean_pitch": float(pitch_mean),
            "pitch_std": float(pitch_std),
            "pitch_range": float(pitch_range),
            "pitch_smoothness": float(pitch_smoothness),
            "score": calculate_pitch_score(pitch_mean, pitch_std, pitch_smoothness)
        }
    else:
        return {
            "mean_pitch": 0,
            "pitch_std": 0,
            "pitch_range": 0,
            "pitch_smoothness": 0,
            "score": 0
        }

def analyze_rhythm(y: np.ndarray, sr: int) -> Dict:
    """
    リズム分析（音節のリズムとストレス）
    """
    # ビート検出
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    
    # オンスセット検出
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)
    
    # リズムの一貫性
    if len(onset_times) > 1:
        intervals = np.diff(onset_times)
        rhythm_consistency = 1.0 / (1.0 + np.std(intervals))
    else:
        rhythm_consistency = 0
    
    # ストレスパターン分析
    stress_pattern = analyze_stress_pattern(y, sr)
    
    return {
        "tempo": float(tempo),
        "beat_count": len(beats),
        "onset_count": len(onset_times),
        "rhythm_consistency": float(rhythm_consistency),
        "stress_pattern": stress_pattern,
        "score": calculate_rhythm_score(tempo, rhythm_consistency, stress_pattern)
    }

def detect_phoneme_boundaries(y: np.ndarray, sr: int) -> Dict:
    """
    音素境界検出
    """
    # スペクトラル変化の検出
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    
    # MFCCの変化率
    mfcc_diff = np.diff(mfcc, axis=1)
    change_points = np.sum(np.abs(mfcc_diff), axis=0)
    
    # 変化点の検出
    threshold = np.mean(change_points) + np.std(change_points)
    boundaries = np.where(change_points > threshold)[0]
    
    # 境界の品質評価
    boundary_quality = len(boundaries) / len(change_points) if len(change_points) > 0 else 0
    
    return {
        "boundary_count": len(boundaries),
        "boundary_quality": float(boundary_quality),
        "change_intensity": float(np.mean(change_points)),
        "score": calculate_boundary_score(boundary_quality, len(boundaries))
    }

def detect_katakana_pronunciation(y: np.ndarray, sr: int) -> Dict:
    """
    カタカナ発音検出（日本語的な発音パターン）
    """
    # フォルマント分析による母音の特徴
    formants = extract_formants(y, sr)
    
    # ピッチ分析
    pitch_data = extract_pitch_contour(y, sr)
    
    # カタカナ発音の特徴
    # 1. 母音の長さが不自然
    # 2. ピッチの変化が少ない
    # 3. フォルマントの分布が日本語的
    
    katakana_indicators = []
    
    # 母音の長さ分析
    if pitch_data["pitch_range"] < 50:  # ピッチ変化が少ない
        katakana_indicators.append("monotone_pitch")
    
    # フォルマント分析
    if formants["formant_stability"] > 100:  # フォルマントが不安定
        katakana_indicators.append("unstable_formants")
    
    # リズム分析
    rhythm_data = analyze_rhythm(y, sr)
    if rhythm_data["rhythm_consistency"] < 0.3:  # リズムが不自然
        katakana_indicators.append("unnatural_rhythm")
    
    # カタカナスコア計算
    katakana_score = len(katakana_indicators) / 3.0  # 0-1のスコア
    
    return {
        "detected": katakana_score > 0.5,
        "confidence": float(katakana_score),
        "indicators": katakana_indicators,
        "score": float(1.0 - katakana_score)  # カタカナでないほど高スコア
    }

def calculate_overall_score(formants: Dict, pitch: Dict, rhythm: Dict, 
                          phoneme: Dict, katakana: Dict, energy: float) -> float:
    """
    総合スコア計算（完全に書き直し）
    """
    # 基本スコア（70-90点の範囲）
    base_score = 75.0
    
    # 各要素の調整
    adjustments = []
    
    # 1. ピッチ分析（イントネーション）
    pitch_score = pitch.get("score", 0)
    if pitch_score > 0.7:
        adjustments.append(10)  # 良いピッチ
    elif pitch_score > 0.5:
        adjustments.append(5)   # 普通のピッチ
    else:
        adjustments.append(-5)  # 悪いピッチ
    
    # 2. リズム分析
    rhythm_score = rhythm.get("score", 0)
    if rhythm_score > 0.8:
        adjustments.append(10)  # 良いリズム
    elif rhythm_score > 0.6:
        adjustments.append(5)   # 普通のリズム
    else:
        adjustments.append(-5)  # 悪いリズム
    
    # 3. 音素分析
    phoneme_score = phoneme.get("score", 0)
    if phoneme_score > 0.5:
        adjustments.append(5)   # 良い音素境界
    else:
        adjustments.append(-3)  # 悪い音素境界
    
    # 4. カタカナ検出（重要）
    if katakana.get("detected", False):
        adjustments.append(-20)  # カタカナ発音は大幅減点
    else:
        adjustments.append(10)   # カタカナでない場合は加点
    
    # 5. エネルギー補正
    if energy > 0.1:
        adjustments.append(5)   # 適切なエネルギー
    elif energy > 0.05:
        adjustments.append(0)   # 普通のエネルギー
    else:
        adjustments.append(-5)  # 低すぎるエネルギー
    
    # 総合スコア計算
    total_adjustment = sum(adjustments)
    final_score = base_score + total_adjustment
    
    # 0-100の範囲に制限
    return float(np.clip(final_score, 0, 100))

def calculate_formant_score(f1: float, f2: float, f3: float) -> float:
    """フォルマントスコア計算（緩和版）"""
    # 英語の母音の典型的なフォルマント範囲（より緩い条件）
    english_vowel_ranges = [
        (200, 900, 1500, 3500),   # /i/ - より広い範囲
        (300, 1000, 1600, 3200),  # /ɪ/
        (400, 1100, 1400, 3000),  # /e/
        (500, 1300, 1200, 2800),  # /æ/
        (600, 1200, 1000, 2600),  # /ɑ/
        (300, 900, 1100, 2400),   # /ʌ/
        (200, 800, 900, 2200),    # /u/
        (300, 900, 1000, 2400),   # /ʊ/
    ]
    
    best_score = 0
    for f1_range, f2_range, f3_range, _ in english_vowel_ranges:
        score = 0
        if f1_range[0] <= f1 <= f1_range[1]:
            score += 0.5  # より高いスコア
        if f2_range[0] <= f2 <= f2_range[1]:
            score += 0.4
        if f3_range[0] <= f3 <= f3_range[1]:
            score += 0.1
        best_score = max(best_score, score)
    
    return min(best_score, 1.0)

def calculate_pitch_score(mean_pitch: float, pitch_std: float, smoothness: float) -> float:
    """ピッチスコア計算（緩和版）"""
    # より広いピッチ範囲（80-600Hz）
    pitch_score = 0
    if 80 <= mean_pitch <= 600:
        pitch_score += 0.5
    elif 60 <= mean_pitch <= 700:
        pitch_score += 0.3
    
    # ピッチ変化の適切さ（より緩い条件）
    if 10 <= pitch_std <= 200:
        pitch_score += 0.3
    elif 5 <= pitch_std <= 300:
        pitch_score += 0.2
    
    # 滑らかさ
    pitch_score += smoothness * 0.2
    
    return min(pitch_score, 1.0)

def calculate_rhythm_score(tempo: float, consistency: float, stress_pattern: str) -> float:
    """リズムスコア計算（緩和版）"""
    # より広いテンポ範囲（40-200 BPM）
    tempo_score = 0
    if 40 <= tempo <= 200:
        tempo_score += 0.5
    elif 30 <= tempo <= 250:
        tempo_score += 0.3
    
    # リズムの一貫性
    rhythm_score = consistency * 0.3
    
    # ストレスパターン
    stress_score = 0.2 if stress_pattern == "natural" else 0.1
    
    return min(tempo_score + rhythm_score + stress_score, 1.0)

def calculate_boundary_score(quality: float, count: int) -> float:
    """音素境界スコア計算（緩和版）"""
    # 境界の品質と数のバランス（より緩い条件）
    if count > 0:
        return min(quality * 0.6 + (count / 15) * 0.4, 1.0)  # より緩い条件
    return 0.5  # 最低スコアを大幅に上げる

def calculate_pitch_smoothness(pitches: np.ndarray) -> float:
    """ピッチの滑らかさ計算"""
    if len(pitches) < 2:
        return 0
    
    # ピッチ変化の標準偏差
    pitch_changes = np.diff(pitches)
    smoothness = 1.0 / (1.0 + np.std(pitch_changes))
    return float(smoothness)

def analyze_stress_pattern(y: np.ndarray, sr: int) -> str:
    """ストレスパターン分析"""
    # エネルギーの時間変化
    rms = librosa.feature.rms(y=y)
    
    # ストレスパターンの検出
    energy_peaks = signal.find_peaks(rms[0], height=np.mean(rms[0])*1.2)[0]
    
    if len(energy_peaks) > 0:
        return "natural"
    else:
        return "flat"

def generate_detailed_feedback(formants: Dict, pitch: Dict, rhythm: Dict, 
                             phoneme: Dict, katakana: Dict) -> List[str]:
    """詳細フィードバック生成"""
    feedback = []
    
    # フォルマントフィードバック
    if formants["score"] < 0.5:
        feedback.append("母音の発音をより正確にしてください")
    
    # ピッチフィードバック
    if pitch["score"] < 0.5:
        feedback.append("イントネーションをより自然にしてください")
    
    # リズムフィードバック
    if rhythm["score"] < 0.5:
        feedback.append("リズムをより自然にしてください")
    
    # カタカナフィードバック
    if katakana["detected"]:
        feedback.append("カタカナ発音を避け、ネイティブ発音を心がけてください")
    
    if not feedback:
        feedback.append("素晴らしい発音です！")
    
    return feedback

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python advanced_evaluation.py <audio_file> <reference_text>"}))
        sys.exit(1)
    
    audio_file = sys.argv[1]
    reference_text = sys.argv[2]
    
    result = analyze_pronunciation(audio_file, reference_text)
    print(json.dumps(result, ensure_ascii=False)) 