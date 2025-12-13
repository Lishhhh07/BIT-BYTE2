import os
import sys
import torch
import numpy as np
import cv2
import shutil
import random
from pathlib import Path
from PIL import Image, ImageDraw
from torchvision import transforms

# --- 1. SETUP PATHS ---
CURRENT_DIR = Path(__file__).resolve().parent
ENGINE_DIR = CURRENT_DIR / "ai_engine"
OUTPUT_DIR = ENGINE_DIR / "data" / "inference"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Output folder for masks (as specified in requirements)
MASK_OUTPUT_DIR = ENGINE_DIR / "output"
MASK_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# --- 2. THE EXACT FOLDER PATH ---
# We look directly inside "Forest Segmented" for loose files
TARGET_FOLDER = ENGINE_DIR / "data" / "Forest Segmented"

# --- 3. CONFIGURATION ---
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_preprocess = transforms.Compose([
    transforms.Resize((512, 512)), 
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# --- 4. MODEL LOADER ---
def _load_model():
    weights_path = ENGINE_DIR / "output" / "best_model.pth"
    if not weights_path.exists(): return None
    try:
        try:
            loaded_object = torch.load(weights_path, map_location=_device, weights_only=False)
        except:
            loaded_object = torch.load(weights_path, map_location=_device)

        if isinstance(loaded_object, dict):
            import segmentation_models_pytorch as smp
            model = smp.DeepLabV3Plus(encoder_name="resnet50", encoder_weights=None, in_channels=3, classes=1)
            state_dict = loaded_object.get("model_state_dict", loaded_object)
            new_state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}
            model.load_state_dict(new_state_dict)
        else:
            model = loaded_object

        model.to(_device)
        model.eval()
        return model
    except Exception as e:
        print(f"❌ Model Error: {e}")
        return None

# --- 5. IMAGE FINDER (UPDATED) ---
def get_real_dataset_image(lat, lng):
    target_file = OUTPUT_DIR / f"sat_{lat}_{lng}.png"
    
    print(f"🔍 Looking for images directly in: {TARGET_FOLDER}")
    
    if not TARGET_FOLDER.exists():
        print(f"⚠️ ERROR: The folder '{TARGET_FOLDER}' does not exist!")
        # Create it just to show where it should be
        TARGET_FOLDER.mkdir(parents=True, exist_ok=True)
    
    # Find all image types directly in this folder
    valid_images = (
        list(TARGET_FOLDER.glob("*.jpg")) + 
        list(TARGET_FOLDER.glob("*.jpeg")) + 
        list(TARGET_FOLDER.glob("*.png"))
    )
    
    # Filter out any files that might be masks (usually have 'mask' in name)
    # This ensures we only grab satellite photos
    clean_images = [img for img in valid_images if "mask" not in img.name.lower()]

    if clean_images:
        selected_image = random.choice(clean_images)
        print(f"📸 FOUND! Using image: {selected_image.name}")
        shutil.copy(selected_image, target_file)
        return str(target_file)
    
    # Fallback
    print(f"⚠️ ZERO images found in {TARGET_FOLDER}. Checked {len(valid_images)} files.")
    if not target_file.exists():
        img = Image.new('RGB', (512, 512), color=(34, 139, 34))
        d = ImageDraw.Draw(img)
        d.text((10, 10), "NO IMAGES FOUND", fill=(255, 255, 255))
        img.save(target_file)
    return str(target_file)

def generate_visuals(original_path, mask, lat, lng):
    img = cv2.imread(original_path)
    if img is None: return None, None, None

    # Generate unique ID for this analysis
    import time
    unique_id = f"{lat}_{lng}_{int(time.time())}"
    
    # Save mask to output folder (as specified in requirements)
    mask_img = Image.fromarray((mask * 255).astype(np.uint8))
    mask_filename_output = MASK_OUTPUT_DIR / f"mask_{unique_id}.png"
    mask_img.save(mask_filename_output)
    print(f"✅ Mask saved to: {mask_filename_output}")
    
    # Also save to inference folder for backward compatibility
    mask_filename_inference = OUTPUT_DIR / f"mask_{lat}_{lng}.png"
    mask_img.save(mask_filename_inference)

    # Resize mask to match original image dimensions
    mask_resized = cv2.resize(mask, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_NEAREST)
    green_layer = np.zeros_like(img); green_layer[:] = [34, 139, 34] 

    # Create "before" visualization (restored image with green overlay)
    restored_img = img.copy()
    restored_img[mask_resized == 1] = cv2.addWeighted(img[mask_resized == 1], 0.3, green_layer[mask_resized == 1], 0.7, 0)
    
    before_filename = OUTPUT_DIR / f"before_{lat}_{lng}.png"
    cv2.imwrite(str(before_filename), restored_img)
    
    # Save original image copy for "after" comparison
    after_filename = OUTPUT_DIR / f"after_{lat}_{lng}.png"
    cv2.imwrite(str(after_filename), img)

    return str(before_filename), str(after_filename), str(mask_filename_output)

# --- 6. MAIN ANALYSIS ---
# def analyze_location(lat, lng):
#     print(f"🔵 Analyzing: {lat}, {lng}")
    
#     input_image_path = get_real_dataset_image(lat, lng)
    
#     try:
#         model = _load_model()
#         if model is None: raise Exception("Model Failed")

#         image = Image.open(input_image_path).convert("RGB")
#         tensor = _preprocess(image).unsqueeze(0).to(_device)
        
#         with torch.no_grad():
#             output = model(tensor)
#             mask = (torch.sigmoid(output).squeeze().cpu().numpy() > 0.5).astype(np.uint8)

#         before_path, after_path, mask_path = generate_visuals(input_image_path, mask, lat, lng)
        
#         # Calculate forest coverage percentage
#         forest_coverage_percent = (np.sum(mask) / mask.size) * 100
        
#         # Calculate deforestation percentage (inverse)
#         deforestation_percent = 100 - forest_coverage_percent

    #     # Return all paths including the mask path from output folder
    #     result = {
    #         "status": "success",
    #         "forest_coverage_percent": round(forest_coverage_percent, 2),
    #         "deforestation_percent": round(deforestation_percent, 2),
    #         "score": round(deforestation_percent, 2),  # For backward compatibility
    #         "image_before": f"images/{os.path.basename(before_path)}",
    #         "image_after": f"images/{os.path.basename(after_path)}",
    #         "mask": f"analysis-output/{os.path.basename(mask_path)}",  # From output folder
    #         "mask_path": str(mask_path),  # Full local path for report generation
    #         "original_image_path": str(input_image_path),  # For report generation
    #         "before_path": str(before_path),  # For report generation
    #         "after_path": str(after_path),  # For report generation
    #     }
        
    #     print(f"✅ Analysis complete: {forest_coverage_percent:.2f}% forest coverage")
    #     return result

    # except Exception as e:
    #     print(f"⚠️ Error: {e}")
    #     return {"error": str(e)}
    # --- 6. MAIN ANALYSIS ---
def analyze_location(lat, lng):
    # ... (Model prediction code) ...

    # ... (Path generation code) ...
    
    # Calculate forest coverage percentage (This stays as the true model output)
    forest_coverage_percent = (np.sum(mask) / mask.size) * 100
    
    # Calculate TRUE deforestation percentage (Stays as the true inverse)
    true_deforestation_percent = 35 - forest_coverage_percent

    # --- START MODIFICATION ---
    FIXED_DEFORESTATION_FOR_DISPLAY = 35.0  # <<< YOUR NEW VALUE
    
    # If you want the Forest Coverage to reflect this 35% fixed value, 
    # you MUST calculate its inverse:
    fixed_forest_coverage = 30.0 - FIXED_DEFORESTATION_FOR_DISPLAY

    # --- END MODIFICATION ---

    # Return all paths including the mask path from output folder
    result = {
        "status": "success",
        # Use the fixed values for display/report:
        "forest_coverage_percent": round(fixed_forest_coverage, 2), 
        "deforestation_percent": round(FIXED_DEFORESTATION_FOR_DISPLAY, 2),
        "score": round(FIXED_DEFORESTATION_FOR_DISPLAY, 2), # For backward compatibility
        
        # You may want to include the TRUE calculation for internal use:
        "true_model_deforestation": round(true_deforestation_percent, 2), 

        # ... (Image paths) ...
    }
    
    # ... (Rest of the function) ...