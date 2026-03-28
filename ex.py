import os
import random
import numpy as np
import cv2
from deepface import DeepFace

DATASET_PATH = "data"
AUG_DIR = "data_output"  # your existing augmented folder

# -----------------------------
# Distance computation
# -----------------------------
def compute_distance(img1, img2):
    result = DeepFace.verify(
        img1_path=img1,
        img2_path=img2,
        model_name="ArcFace",
        detector_backend="retinaface",
        distance_metric="cosine",
        enforce_detection=False
    )
    return result["distance"]


# -----------------------------
# 

def generate_distances():

    images = [
        os.path.join(DATASET_PATH, f)
        for f in os.listdir(DATASET_PATH)
        if f.lower().endswith((".jpg", ".png", ".jpeg"))
    ]

    aug_images = [
        os.path.join(AUG_DIR, f)
        for f in os.listdir(AUG_DIR)
        if f.lower().endswith((".jpg", ".png", ".jpeg"))
    ]

    genuine = []
    imposter = []

    print("Total original images:", len(images))
    print("Total augmented images:", len(aug_images))

    # =========================
    # ✅ Genuine pairs (FIXED: match by person ID in filename)
    # =========================
    print("Generating genuine pairs from existing augmentations...")

    for img_path in images:
        base = os.path.splitext(os.path.basename(img_path))[0]  # e.g. "001"
        # find augmented images belonging to the SAME person
        matching_augs = [
            a for a in aug_images
            if os.path.splitext(os.path.basename(a))[0].startswith(base)
        ]
        if not matching_augs:
            print(f"  No aug found for: {base} — skipping")
            continue
        aug_img = random.choice(matching_augs)
        try:
            d = compute_distance(img_path, aug_img)
            genuine.append(d)
            print(f"  Genuine pair: {os.path.basename(img_path)} <-> {os.path.basename(aug_img)}  dist={d:.4f}")
        except Exception as e:
            print(f"  Error on {base}: {e}")

    # =========================
    # ❌ Imposter pairs (unchanged)
    # =========================
    print("Generating imposter pairs...")

    for _ in range(min(300, len(images) * 2)):
        img1, img2 = random.sample(images, 2)
        try:
            d = compute_distance(img1, img2)
            imposter.append(d)
        except:
            pass

    print("Genuine:", len(genuine))
    print("Imposter:", len(imposter))

    np.save("genuine_distances.npy", genuine)
    np.save("imposter_distances.npy", imposter)

if __name__ == "__main__":
    generate_distances()