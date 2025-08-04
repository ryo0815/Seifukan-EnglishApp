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
    高度な音響分析による発音評価（完全書き直し）
    """
    try:
        # 音声ファイルを読み込み
        y, sr = librosa.load(audio_path, sr=16000)
        
        # 基本統計
        duration = len(y) / sr
        energy = np.mean(librosa.feature.rms(y=y))
        
        # カタカナ発音検出（最重要）
        katakana_detection = detect_katakana_pronunciation_improved(y, sr)
        
        # ピッチ分析
        pitch_analysis = analyze_pitch_improved(y, sr)
        
        # リズム分析
        rhythm_analysis = analyze_rhythm_improved(y, sr)
        
        # 音素分析
        phoneme_analysis = analyze_phonemes_improved(y, sr)
        
        # 総合スコア計算
        overall_score = calculate_final_score(
            katakana_detection, pitch_analysis, rhythm_analysis, 
            phoneme_analysis, energy, duration
        )
        
        return {
            "success": True,
            "overallScore": overall_score,
            "katakanaDetection": katakana_detection,
            "pitchAnalysis": pitch_analysis,
            "rhythmAnalysis": rhythm_analysis,
            "phonemeAnalysis": phoneme_analysis,
            "energyLevel": float(energy),
            "duration": duration,
            "detailedFeedback": generate_feedback(
                katakana_detection, pitch_analysis, rhythm_analysis, phoneme_analysis
            )
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def detect_katakana_pronunciation_improved(y: np.ndarray, sr: int) -> Dict:
    """
    カタカナ発音検出（改善版）
    """
    # 1. ピッチの平坦さを検出
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    valid_pitches = []
    for t in range(pitches.shape[1]):
        index = magnitudes[:, t].argmax()
        pitch = pitches[index, t]
        if pitch > 0:
            valid_pitches.append(pitch)
    
    pitch_variance = np.var(valid_pitches) if valid_pitches else 0
    
    # 2. フォルマントの安定性
    stft = librosa.stft(y, n_fft=1024, hop_length=256)
    spec = np.abs(stft)
    formant_stability = calculate_formant_stability(spec)
    
    # 3. リズムの不自然さ
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    rhythm_naturalness = calculate_rhythm_naturalness(y, sr)
    
    # カタカナ発音の特徴
    katakana_indicators = []
    confidence = 0
    
    if pitch_variance < 1000:  # ピッチ変化が少ない
        katakana_indicators.append("flat_pitch")
        confidence += 0.3
    
    if formant_stability < 0.5:  # フォルマントが不安定
        katakana_indicators.append("unstable_formants")
        confidence += 0.3
    
    if rhythm_naturalness < 0.6:  # リズムが不自然
        katakana_indicators.append("unnatural_rhythm")
        confidence += 0.4
    
    detected = confidence > 0.5
    
    return {
        "detected": detected,
        "confidence": float(confidence),
        "indicators": katakana_indicators,
        "pitch_variance": float(pitch_variance),
        "formant_stability": float(formant_stability),
        "rhythm_naturalness": float(rhythm_naturalness)
    }

def analyze_pitch_improved(y: np.ndarray, sr: int) -> Dict:
    """
    ピッチ分析（改善版）
    """
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    valid_pitches = []
    
    for t in range(pitches.shape[1]):
        index = magnitudes[:, t].argmax()
        pitch = pitches[index, t]
        if pitch > 0:
            valid_pitches.append(pitch)
    
    if valid_pitches:
        valid_pitches = np.array(valid_pitches)
        mean_pitch = np.mean(valid_pitches)
        pitch_std = np.std(valid_pitches)
        pitch_range = np.max(valid_pitches) - np.min(valid_pitches)
        
        # スコア計算
        score = 0
        if 80 <= mean_pitch <= 600:  # 適切なピッチ範囲
            score += 0.4
        if pitch_std > 50:  # 適度なピッチ変化
            score += 0.3
        if pitch_range > 200:  # 十分なピッチ範囲
            score += 0.3
        
        return {
            "mean_pitch": float(mean_pitch),
            "pitch_std": float(pitch_std),
            "pitch_range": float(pitch_range),
            "score": float(score)
        }
    
    return {
        "mean_pitch": 0,
        "pitch_std": 0,
        "pitch_range": 0,
        "score": 0
    }

def analyze_rhythm_improved(y: np.ndarray, sr: int) -> Dict:
    """
    リズム分析（改善版）
    """
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)
    
    # リズムの一貫性
    if len(onset_times) > 1:
        intervals = np.diff(onset_times)
        rhythm_consistency = 1.0 / (1.0 + np.std(intervals))
    else:
        rhythm_consistency = 0
    
    # スコア計算
    score = 0
    if 60 <= tempo <= 180:  # 適切なテンポ
        score += 0.4
    if rhythm_consistency > 0.7:  # リズムの一貫性
        score += 0.4
    if len(beats) > 0:  # ビート検出
        score += 0.2
    
    return {
        "tempo": float(tempo),
        "rhythm_consistency": float(rhythm_consistency),
        "beat_count": len(beats),
        "score": float(score)
    }

def analyze_phonemes_improved(y: np.ndarray, sr: int) -> Dict:
    """
    音素分析（改善版）
    """
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_diff = np.diff(mfcc, axis=1)
    change_points = np.sum(np.abs(mfcc_diff), axis=0)
    
    # 変化点の検出
    threshold = np.mean(change_points) + np.std(change_points)
    boundaries = np.where(change_points > threshold)[0]
    
    # スコア計算
    score = 0
    if len(boundaries) > 0:
        score += 0.5
    if np.mean(change_points) > 50:  # 適度な変化
        score += 0.5
    
    return {
        "boundary_count": len(boundaries),
        "change_intensity": float(np.mean(change_points)),
        "score": float(score)
    }

def calculate_final_score(katakana: Dict, pitch: Dict, rhythm: Dict, 
                         phoneme: Dict, energy: float, duration: float) -> float:
    """
    最終スコア計算（完全書き直し）
    """
    # 基本スコア
    base_score = 70.0
    
    # カタカナ発音の大幅減点
    if katakana.get("detected", False):
        base_score -= 40  # 大幅減点
    
    # 各要素の調整
    pitch_score = pitch.get("score", 0)
    rhythm_score = rhythm.get("score", 0)
    phoneme_score = phoneme.get("score", 0)
    
    # スコア調整
    if pitch_score > 0.7:
        base_score += 10
    elif pitch_score < 0.3:
        base_score -= 10
    
    if rhythm_score > 0.7:
        base_score += 10
    elif rhythm_score < 0.3:
        base_score -= 10
    
    if phoneme_score > 0.5:
        base_score += 5
    elif phoneme_score < 0.2:
        base_score -= 5
    
    # エネルギー補正
    if energy < 0.05:
        base_score -= 5
    
    # 0-100の範囲に制限
    return float(np.clip(base_score, 0, 100))

def calculate_formant_stability(spec: np.ndarray) -> float:
    """フォルマント安定性計算"""
    try:
        # スペクトラムの時間変化を計算
        spec_diff = np.diff(spec, axis=1)
        stability = 1.0 / (1.0 + np.mean(np.std(spec_diff, axis=0)))
        return float(stability)
    except:
        return 0.5

def calculate_rhythm_naturalness(y: np.ndarray, sr: int) -> float:
    """リズム自然性計算"""
    try:
        # オンスセット間隔の自然性
        onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
        if len(onset_frames) > 1:
            intervals = np.diff(onset_frames)
            naturalness = 1.0 / (1.0 + np.std(intervals))
            return float(naturalness)
        return 0.5
    except:
        return 0.5

def generate_feedback(katakana: Dict, pitch: Dict, rhythm: Dict, phoneme: Dict) -> List[str]:
    """フィードバック生成"""
    feedback = []
    
    if katakana.get("detected", False):
        feedback.append("カタカナ発音が検出されました。ネイティブ発音を心がけてください。")
    
    if pitch.get("score", 0) < 0.5:
        feedback.append("イントネーションをより自然にしてください。")
    
    if rhythm.get("score", 0) < 0.5:
        feedback.append("リズムをより自然にしてください。")
    
    if phoneme.get("score", 0) < 0.3:
        feedback.append("音素の境界をより明確にしてください。")
    
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