#!/usr/bin/env python3
"""
Test runner script for enhanced test coverage
Runs both backend and frontend tests with coverage reporting
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(command, cwd=None, description=""):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(command)}")
    print(f"{'='*60}")

    try:
        result = subprocess.run(
            command, cwd=cwd, check=True, capture_output=True, text=True
        )
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        return False


def main():
    """Main test runner function"""
    project_root = Path(__file__).parent
    frontend_dir = project_root / "frontend"

    print("🧪 Enhanced Test Coverage Runner")
    print("=" * 60)

    # Backend Tests
    print("\n🐍 Running Backend Tests...")

    # Install backend test dependencies
    if not run_command(
        [sys.executable, "-m", "pip", "install", "-r", "requirements-dev.txt"],
        cwd=project_root,
        description="Installing backend test dependencies",
    ):
        print("❌ Failed to install backend dependencies")
        return False

    # Run new backend tests
    backend_tests = [
        "tests/test_detect_logo.py",
        "tests/test_ws_manager.py",
        "tests/test_cleanup.py",
    ]

    for test_file in backend_tests:
        if not run_command(
            [sys.executable, "-m", "pytest", test_file, "-v", "--tb=short"],
            cwd=project_root,
            description=f"Running {test_file}",
        ):
            print(f"❌ Failed: {test_file}")
        else:
            print(f"✅ Passed: {test_file}")

    # Run all backend tests with coverage
    if not run_command(
        [
            sys.executable,
            "-m",
            "pytest",
            "tests/",
            "--cov=.",
            "--cov-report=html",
            "--cov-report=term",
        ],
        cwd=project_root,
        description="Running all backend tests with coverage",
    ):
        print("❌ Backend test suite failed")
    else:
        print("✅ Backend test suite passed")

    # Frontend Tests
    print("\n⚛️  Running Frontend Tests...")

    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False

    # Install frontend dependencies
    if not run_command(
        ["npm", "install"],
        cwd=frontend_dir,
        description="Installing frontend dependencies",
    ):
        print("❌ Failed to install frontend dependencies")
        return False

    # Run new frontend tests
    frontend_tests = [
        "src/__tests__/Dashboard.test.js",
        "src/__tests__/BatchHistory.test.js",
        "src/__tests__/BatchSubmissionFlow.test.js",
        "src/__tests__/WebSocketIntegration.test.js",
    ]

    for test_file in frontend_tests:
        if not run_command(
            ["npm", "test", "--", "--testPathPattern=" + test_file, "--watchAll=false"],
            cwd=frontend_dir,
            description=f"Running {test_file}",
        ):
            print(f"❌ Failed: {test_file}")
        else:
            print(f"✅ Passed: {test_file}")

    # Run all frontend tests with coverage
    if not run_command(
        ["npm", "test", "--", "--coverage", "--watchAll=false"],
        cwd=frontend_dir,
        description="Running all frontend tests with coverage",
    ):
        print("❌ Frontend test suite failed")
    else:
        print("✅ Frontend test suite passed")

    print("\n🎉 Test Coverage Enhancement Complete!")
    print("\nCoverage Reports:")
    print(f"📊 Backend: {project_root}/htmlcov/index.html")
    print(f"📊 Frontend: {frontend_dir}/coverage/lcov-report/index.html")

    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
