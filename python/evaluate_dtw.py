import argparse
import json
import librosa
import numpy as np
from dtw import dtw

def analyze_pronunciation(user_audio_path, reference_audio_path):
    """
    Analyzes pronunciation by comparing user audio to a reference audio file
    using MFCC and Dynamic Time Warping (DTW).
    """
    try:
        # Load audio files
        y_user, sr_user = librosa.load(user_audio_path, sr=16000)
        y_ref, sr_ref = librosa.load(reference_audio_path, sr=16000)

        # Extract MFCCs
        mfcc_user = librosa.feature.mfcc(y=y_user, sr=sr_user, n_mfcc=13)
        mfcc_ref = librosa.feature.mfcc(y=y_ref, sr=sr_ref, n_mfcc=13)
        
        # Transpose MFCC matrices for DTW
        mfcc_user_t = mfcc_user.T
        mfcc_ref_t = mfcc_ref.T

        # Perform DTW
        alignment = dtw(mfcc_user_t, mfcc_ref_t, keep_internals=True)

        # The DTW distance is a measure of similarity. Lower is better.
        dtw_distance = alignment.distance

        # --- Robust Score Normalization ---
        # Normalize the distance to a score from 0 to 100 (higher is better).
        # This approach uses an exponential decay function, which is more robust
        # to variations in audio length and DTW distance magnitude.
        # The scaling factor 'k' can be tuned to adjust score sensitivity.
        # A smaller 'k' makes the score less sensitive to large distances.
        k = 0.000025
        similarity_score = 100 * np.exp(-k * dtw_distance)


        result = {
            "success": True,
            "dtwDistance": dtw_distance,
            "dtwScore": round(similarity_score, 2),
            "userMfccShape": mfcc_user_t.shape,
            "refMfccShape": mfcc_ref_t.shape
        }
        return result

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Pronunciation Analysis using DTW and MFCC.')
    parser.add_argument('user_audio_path', type=str, help='Path to the user\'s audio file.')
    parser.add_argument('reference_audio_path', type=str, help='Path to the reference audio file.')
    
    args = parser.parse_args()
    
    analysis_result = analyze_pronunciation(args.user_audio_path, args.reference_audio_path)
    
    print(json.dumps(analysis_result)) 