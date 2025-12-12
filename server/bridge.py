import os
import sys
from pathlib import Path
from typing import Optional

import numpy as np
import torch
from PIL import Image
from torchvision import transforms

# Ensure ai_engine is importable
CURRENT_DIR = Path(__file__).resolve().parent
ENGINE_DIR = CURRENT_DIR / "ai_engine"
if str(ENGINE_DIR) not in sys.path:
  sys.path.insert(0, str(ENGINE_DIR))

from models.arch_config import DeepLabModel  # type: ignore

_model: Optional[torch.nn.Module] = None
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_preprocess = transforms.Compose(
  [
    transforms.Resize((512, 512)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
  ]
)


def _load_model() -> torch.nn.Module:
  global _model
  if _model is not None:
    return _model

  weights_path = Path(
    os.environ.get(
      "FORESTRY_MODEL_WEIGHTS",
      ENGINE_DIR / "output" / "best_model.pth",
    )
  )

  if not weights_path.exists():
    raise FileNotFoundError(
      f"Model weights not found at {weights_path}. "
      "Set FORESTRY_MODEL_WEIGHTS to your .pth file."
    )

  # Match the trained architecture (resnet50 per provided weights)
  deeplab = DeepLabModel(arch="resnet50", pretrained=None, activation=None)
  model = deeplab.get_model()
  state = torch.load(weights_path, map_location=_device)
  state_dict = state.get("model_state_dict", state) if isinstance(state, dict) else state
  model.load_state_dict(state_dict)
  model.to(_device)
  model.eval()

  _model = model
  return _model


def get_deforestation_mask(image_path: str) -> np.ndarray:
  """
  Runs the forestry segmentation model and returns a binary mask array.
  The mask marks forested pixels as 1 and background as 0.
  """
  model = _load_model()
  image = Image.open(image_path).convert("RGB")
  tensor = _preprocess(image).unsqueeze(0).to(_device)

  with torch.no_grad():
    logits = model(tensor)
    probs = torch.sigmoid(logits)
    mask = (probs.squeeze().cpu().numpy() > 0.5).astype(np.uint8)

  return mask


def compare_forest_loss(before_mask: np.ndarray, after_mask: np.ndarray) -> float:
  """
  Returns percentage loss between two binary masks.
  """
  before_count = float(before_mask.sum())
  after_count = float(after_mask.sum())
  if before_count == 0:
    return 0.0
  loss = max(0.0, before_count - after_count)
  return (loss / before_count) * 100.0


def save_mask(mask: np.ndarray, target_path: Path) -> str:
  target_path.parent.mkdir(parents=True, exist_ok=True)
  mask_img = Image.fromarray((mask * 255).astype(np.uint8))
  mask_img.save(target_path)
  return str(target_path)

