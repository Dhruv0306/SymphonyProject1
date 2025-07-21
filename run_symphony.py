"""
Symphony Logo Detection System Launcher

This script launches all three components of the Symphony Logo Detection System:
1. YOLO Service - Handles logo detection using YOLOv8/YOLOv11 models
2. FastAPI Backend - Processes image validation requests and manages batch tracking
3. React Frontend - Provides the user interface for interacting with the system

Usage:
    python run_symphony.py [--host HOST] [--port PORT] [--no-frontend] [--venv VENV_PATH] [--skip-venv] [--skip-install] [--skip-npm]

Options:
    --host HOST           Host interface to bind to (default: localhost)
                          The same host is used for all three services
    --port PORT           Base port for the FastAPI backend (default: 8000)
                          YOLO service will use port+1, frontend will use port+2
    --no-frontend         Run only the backend services without the frontend
    --venv VENV_PATH      Path to virtual environment (default: .venv)
    --skip-venv           Skip virtual environment creation/activation
    --skip-install        Skip Python requirements installation
    --skip-npm            Skip npm dependencies installation
"""

import os
import sys
import time
import argparse
import subprocess
import threading
import webbrowser
import venv
from pathlib import Path


# Define colors for console output
class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"


def print_banner():
    """Print the Symphony Logo Detection System banner"""
    banner = f"""
{Colors.BLUE}{Colors.BOLD}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║             SYMPHONY LOGO DETECTION SYSTEM                   ║
║                                                              ║
║  Enterprise-Grade YOLO-Powered Image Validation              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝{Colors.ENDC}
"""
    print(banner)


def run_command(cmd, name, cwd=None):
    """Run a command in a subprocess and handle its output"""
    print(f"{Colors.YELLOW}[{name}] Starting...{Colors.ENDC}")

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=cwd,
            bufsize=1,
            universal_newlines=True,
        )

        prefix = f"{Colors.BLUE}[{name}]{Colors.ENDC} "

        # Print the process output with the service name as prefix
        for line in process.stdout:
            print(f"{prefix}{line.rstrip()}")

        process.wait()
        if process.returncode != 0:
            print(
                f"{Colors.RED}[{name}] Process exited with code {process.returncode}{Colors.ENDC}"
            )
            return False
        return True

    except Exception as e:
        print(f"{Colors.RED}[{name}] Error: {str(e)}{Colors.ENDC}")
        return False


def start_yolo_service(host, port, venv_path=None):
    """Start the YOLO service"""
    yolo_port = port + 1  # YOLO service runs on backend port + 1
    yolo_dir = os.path.join(os.getcwd(), "yolo_service")

    if venv_path:
        if sys.platform == "win32":
            python_path = os.path.join(venv_path, "Scripts", "python.exe")
        else:
            python_path = os.path.join(venv_path, "bin", "python")
        cmd = [python_path, "start.py", "--host", host, "--port", str(yolo_port)]
    else:
        if sys.platform == "win32":
            cmd = ["python", "start.py", "--host", host, "--port", str(yolo_port)]
        else:
            cmd = ["python3", "start.py", "--host", host, "--port", str(yolo_port)]

    return threading.Thread(
        target=run_command, args=(cmd, "YOLO Service", yolo_dir), daemon=True
    )


def start_fastapi_backend(host, port, venv_path=None):
    """Start the FastAPI backend using run.py"""
    if venv_path:
        if sys.platform == "win32":
            python_path = os.path.join(venv_path, "Scripts", "python.exe")
        else:
            python_path = os.path.join(venv_path, "bin", "python")
        cmd = [python_path, "run.py", "--host", host, "--port", str(port)]
    else:
        if sys.platform == "win32":
            cmd = ["python", "run.py", "--host", host, "--port", str(port)]
        else:
            cmd = ["python3", "run.py", "--host", host, "--port", str(port)]

    return threading.Thread(
        target=run_command, args=(cmd, "FastAPI Backend"), daemon=True
    )


def install_npm_dependencies():
    """Install npm dependencies for the frontend"""
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    print(f"{Colors.YELLOW}Installing npm dependencies for frontend...{Colors.ENDC}")

    cmd = ["npm", "install"]

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=frontend_dir,
            bufsize=1,
            universal_newlines=True,
        )

        prefix = f"{Colors.BLUE}[npm]{Colors.ENDC} "

        for line in process.stdout:
            print(f"{prefix}{line.rstrip()}")

        process.wait()
        if process.returncode != 0:
            print(
                f"{Colors.RED}Error installing npm dependencies (code {process.returncode}){Colors.ENDC}"
            )
            return False

        print(f"{Colors.GREEN}npm dependencies installed successfully{Colors.ENDC}")
        return True

    except Exception as e:
        print(f"{Colors.RED}Error installing npm dependencies: {str(e)}{Colors.ENDC}")
        return False


def start_react_frontend(host, backend_port, frontend_port=3000):
    """Start the React frontend using npm run start-backend"""
    frontend_dir = os.path.join(os.getcwd(), "frontend")

    # Generate backend URL based on host and port
    backend_url = f"http://{host}:{backend_port}"

    # Use npm run start-backend with appropriate arguments
    cmd = [
        "npm",
        "run",
        "start-backend",
        "--",
        f"--backend={backend_url}",
        f"--port={frontend_port}",
        "--host",
        host,
    ]

    return threading.Thread(
        target=run_command, args=(cmd, "React Frontend", frontend_dir), daemon=True
    )


def create_virtual_environment(venv_path):
    """Create a virtual environment at the specified path"""
    print(f"{Colors.YELLOW}Creating virtual environment at {venv_path}...{Colors.ENDC}")
    try:
        # Create directory if it doesn't exist
        venv_dir = Path(venv_path)
        if not venv_dir.parent.exists():
            venv_dir.parent.mkdir(parents=True, exist_ok=True)

        venv.create(venv_path, with_pip=True)
        print(f"{Colors.GREEN}Virtual environment created successfully{Colors.ENDC}")
        return True
    except Exception as e:
        print(f"{Colors.RED}Error creating virtual environment: {str(e)}{Colors.ENDC}")
        return False


def install_requirements(venv_path):
    """Install requirements from requirements.txt"""
    print(
        f"{Colors.YELLOW}Installing requirements from requirements.txt...{Colors.ENDC}"
    )

    if sys.platform == "win32":
        pip_path = os.path.join(venv_path, "Scripts", "pip.exe")
    else:
        pip_path = os.path.join(venv_path, "bin", "pip")

    # First upgrade pip
    upgrade_cmd = [pip_path, "install", "--upgrade", "pip"]
    try:
        subprocess.run(
            upgrade_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT
        )
        print(f"{Colors.GREEN}Pip upgraded successfully{Colors.ENDC}")
    except subprocess.CalledProcessError as e:
        print(f"{Colors.YELLOW}Warning: Could not upgrade pip: {e.output}{Colors.ENDC}")

    # Install requirements from main requirements.txt
    cmd = [pip_path, "install", "-r", "requirements.txt"]

    # Also install YOLO service requirements if they exist
    yolo_requirements = os.path.join("yolo_service", "requirements.txt")
    if os.path.exists(yolo_requirements):
        print(
            f"{Colors.YELLOW}Also installing YOLO service requirements...{Colors.ENDC}"
        )
        yolo_cmd = [pip_path, "install", "-r", yolo_requirements]

    try:
        # Install main requirements
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True,
        )

        prefix = f"{Colors.BLUE}[pip]{Colors.ENDC} "

        for line in process.stdout:
            print(f"{prefix}{line.rstrip()}")

        process.wait()
        if process.returncode != 0:
            print(
                f"{Colors.RED}Error installing main requirements (code {process.returncode}){Colors.ENDC}"
            )
            return False

        # Install YOLO service requirements if they exist
        yolo_requirements = os.path.join("yolo_service", "requirements.txt")
        if os.path.exists(yolo_requirements):
            print(
                f"{Colors.YELLOW}Installing YOLO service requirements...{Colors.ENDC}"
            )
            yolo_cmd = [pip_path, "install", "-r", yolo_requirements]

            yolo_process = subprocess.Popen(
                yolo_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True,
            )

            for line in yolo_process.stdout:
                print(f"{prefix}{line.rstrip()}")

            yolo_process.wait()
            if yolo_process.returncode != 0:
                print(
                    f"{Colors.RED}Error installing YOLO requirements (code {yolo_process.returncode}){Colors.ENDC}"
                )
                return False

        print(f"{Colors.GREEN}All requirements installed successfully{Colors.ENDC}")
        return True

    except Exception as e:
        print(f"{Colors.RED}Error installing requirements: {str(e)}{Colors.ENDC}")
        return False


def main():
    """Main function to parse arguments and start all services"""
    parser = argparse.ArgumentParser(description="Run Symphony Logo Detection System")
    parser.add_argument(
        "--host",
        default="localhost",
        help="Host interface to bind to for all services (default: localhost)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Base port for the FastAPI backend (default: 8000)",
    )
    parser.add_argument(
        "--no-frontend",
        action="store_true",
        help="Run only the backend services without the frontend",
    )
    parser.add_argument(
        "--venv", default=".venv", help="Path to virtual environment (default: .venv)"
    )
    parser.add_argument(
        "--skip-venv",
        action="store_true",
        help="Skip virtual environment creation/activation",
    )
    parser.add_argument(
        "--skip-install", action="store_true", help="Skip requirements installation"
    )
    parser.add_argument(
        "--skip-npm", action="store_true", help="Skip npm dependencies installation"
    )
    parser.add_argument(
        "--skip-npm", action="store_true", help="Skip npm dependencies installation"
    )
    args = parser.parse_args()

    # Calculate ports for each service
    backend_port = args.port
    yolo_port = backend_port + 1
    frontend_port = backend_port + 2

    print_banner()
    print(f"{Colors.GREEN}Starting Symphony Logo Detection System...{Colors.ENDC}")
    print(f"{Colors.YELLOW}Host: {args.host} (same for all services){Colors.ENDC}")
    print(
        f"{Colors.YELLOW}Ports: Backend: {backend_port}, YOLO: {yolo_port}, Frontend: {frontend_port}{Colors.ENDC}"
    )

    # Setup virtual environment if not skipped
    venv_path = args.venv
    if not args.skip_venv:
        # Check if virtual environment exists
        if sys.platform == "win32":
            python_exe = os.path.join(venv_path, "Scripts", "python.exe")
        else:
            python_exe = os.path.join(venv_path, "bin", "python")

        if not os.path.exists(python_exe):
            print(
                f"{Colors.YELLOW}Virtual environment not found at {venv_path}, creating...{Colors.ENDC}"
            )
            if not create_virtual_environment(venv_path):
                print(
                    f"{Colors.RED}Failed to create virtual environment. Exiting.{Colors.ENDC}"
                )
                sys.exit(1)
        else:
            print(
                f"{Colors.GREEN}Using existing virtual environment at {venv_path}{Colors.ENDC}"
            )

        # Install requirements if not skipped
        if not args.skip_install:
            if not install_requirements(venv_path):
                print(
                    f"{Colors.RED}Failed to install requirements. Exiting.{Colors.ENDC}"
                )
                sys.exit(1)
    else:
        print(f"{Colors.YELLOW}Skipping virtual environment setup{Colors.ENDC}")
        venv_path = None  # Don't use venv if skipped

    # Start services in separate threads
    print(f"{Colors.GREEN}Starting services...{Colors.ENDC}")
    yolo_thread = start_yolo_service(args.host, args.port, venv_path)
    yolo_thread.start()

    # Give YOLO service time to initialize before starting backend
    time.sleep(3)

    backend_thread = start_fastapi_backend(args.host, args.port, venv_path)
    backend_thread.start()

    # Give backend time to initialize before starting frontend
    time.sleep(3)

    if not args.no_frontend:
        # Install npm dependencies before starting frontend
        if not args.skip_npm:
            print(f"{Colors.YELLOW}Setting up frontend...{Colors.ENDC}")
            if not install_npm_dependencies():
                print(
                    f"{Colors.RED}Failed to install npm dependencies. Frontend may not work correctly.{Colors.ENDC}"
                )
        else:
            print(f"{Colors.YELLOW}Skipping npm dependencies installation{Colors.ENDC}")

        frontend_thread = start_react_frontend(args.host, args.port, frontend_port)
        frontend_thread.start()

        # Wait a bit and then open the browser
        time.sleep(5)
        webbrowser.open(f"http://{args.host}:{frontend_port}")

    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(
            f"\n{Colors.YELLOW}Shutting down Symphony Logo Detection System...{Colors.ENDC}"
        )
        sys.exit(0)


if __name__ == "__main__":
    main()
