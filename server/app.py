import os
from pathlib import Path

from flask import Flask, jsonify, request

from bridge import compare_forest_loss, get_deforestation_mask, save_mask

app = Flask(__name__)

OUTPUT_DIR = Path(__file__).resolve().parent / "artifacts"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


@app.route("/health", methods=["GET"])
def health():
  return {"status": "ok"}


@app.route("/analyze", methods=["POST"])
def analyze():
  """
  Expects JSON:
  {
    "before_image": "/abs/path/to/before.png",
    "after_image": "/abs/path/to/after.png"
  }
  """
  payload = request.get_json(force=True, silent=True) or {}
  before_path = payload.get("before_image")
  after_path = payload.get("after_image")

  if not before_path or not after_path:
    return jsonify({"error": "before_image and after_image are required"}), 400

  if not Path(before_path).exists() or not Path(after_path).exists():
    return jsonify({"error": "One or more image paths do not exist"}), 400

  try:
    before_mask = get_deforestation_mask(before_path)
    after_mask = get_deforestation_mask(after_path)
    loss_pct = compare_forest_loss(before_mask, after_mask)

    before_mask_path = save_mask(before_mask, OUTPUT_DIR / "before_mask.png")
    after_mask_path = save_mask(after_mask, OUTPUT_DIR / "after_mask.png")

    return jsonify(
      {
        "loss_percent": round(loss_pct, 2),
        "before_mask": before_mask_path,
        "after_mask": after_mask_path,
      }
    )
  except FileNotFoundError as missing_weights:
    return jsonify({"error": str(missing_weights)}), 500
  except Exception as exc:  # pragma: no cover - runtime safety
    return jsonify({"error": f"analysis_failed: {exc}"}), 500


if __name__ == "__main__":
  port = int(os.environ.get("PORT", 5000))
  app.run(host="0.0.0.0", port=port)

