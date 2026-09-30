"""
ThinkWire AI Services - Local Model Weight Downloader
======================================================
This utility script downloads pre-trained open-weight models from Hugging Face Hub
to a local cache directory for offline or on-premises inference.

Usage:
    python scripts/download_models.py --model sentence-transformers/all-MiniLM-L6-v2
    python scripts/download_models.py --model BAAI/bge-small-en-v1.5
    python scripts/download_models.py --model Qwen/Qwen2.5-1.5B-Instruct

Requirements:
    pip install huggingface_hub
"""

import os
import sys
import argparse
from pathlib import Path

# Supported recommended local open models
RECOMMENDED_MODELS = {
    "embedding-default": "sentence-transformers/all-MiniLM-L6-v2",
    "embedding-high-accuracy": "BAAI/bge-small-en-v1.5",
    "llm-lightweight": "Qwen/Qwen2.5-1.5B-Instruct",
    "llm-standard": "meta-llama/Meta-Llama-3-8B-Instruct",
}

DEFAULT_CACHE_DIR = Path(__file__).resolve().parent.parent / "models_cache"


def download_model(repo_id: str, local_dir: Path, token: str | None = None) -> Path:
    """
    Downloads model snapshot from Hugging Face Hub to the local directory.

    Args:
        repo_id: Hugging Face model repository ID (e.g. 'BAAI/bge-small-en-v1.5').
        local_dir: Destination path on local filesystem.
        token: Optional Hugging Face access token for gated models (Llama 3, etc.).

    Returns:
        Path to the downloaded model directory.
    """
    try:
        from huggingface_hub import snapshot_download
    except ImportError:
        print("[ERROR] 'huggingface_hub' is not installed.")
        print("Please install it by running: pip install huggingface_hub")
        sys.exit(1)

    print(f"[*] Target Model Repo: {repo_id}")
    print(f"[*] Target Local Directory: {local_dir}")
    print("[*] Initiating download from Hugging Face Hub...")

    local_dir.mkdir(parents=True, exist_ok=True)
    target_path = snapshot_download(
        repo_id=repo_id,
        local_dir=str(local_dir / repo_id.replace("/", "_")),
        token=token,
        resume_download=True,
    )

    print(f"[SUCCESS] Model successfully fetched and stored at:\n  --> {target_path}")
    return Path(target_path)


def main():
    parser = argparse.ArgumentParser(
        description="Download open-weight AI models for ThinkWire local inference."
    )
    parser.add_argument(
        "--model",
        type=str,
        default=RECOMMENDED_MODELS["embedding-default"],
        help=f"Hugging Face repository ID or preset key. Presets: {list(RECOMMENDED_MODELS.keys())}. "
             f"Default: {RECOMMENDED_MODELS['embedding-default']}",
    )
    parser.add_argument(
        "--cache-dir",
        type=Path,
        default=DEFAULT_CACHE_DIR,
        help=f"Directory to save weights. Default: {DEFAULT_CACHE_DIR}",
    )
    parser.add_argument(
        "--token",
        type=str,
        default=os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN"),
        help="Hugging Face access token (can also be set via HUGGINGFACE_API_KEY environment variable).",
    )

    args = parser.parse_args()

    model_repo = RECOMMENDED_MODELS.get(args.model, args.model)
    download_model(model_repo, args.cache_dir, token=args.token)


if __name__ == "__main__":
    main()
