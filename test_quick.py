#!/usr/bin/env python3
"""Quick test to verify fixes"""

import subprocess
import sys


def test_specific_files():
    """Test the specific files that were failing"""
    test_files = [
        "tests/test_detect_logo.py::TestDetectLogo::test_check_logo_local_file_valid",
        "tests/test_ws_manager.py::TestConnectionManager::test_prune_stale_connections",
        "tests/test_ws_manager.py::TestBatchManagement::test_init_batch",
    ]

    for test in test_files:
        print(f"\n{'='*60}")
        print(f"Testing: {test}")
        print(f"{'='*60}")

        try:
            result = subprocess.run(
                [sys.executable, "-m", "pytest", test, "-v"],
                capture_output=True,
                text=True,
                check=True,
            )
            print("✅ PASSED")
            print(result.stdout)
        except subprocess.CalledProcessError as e:
            print("❌ FAILED")
            print(e.stdout)
            print(e.stderr)


if __name__ == "__main__":
    test_specific_files()
