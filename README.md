**Symphony Logo Detection System: Enterprise-grade, real-time image validation using advanced YOLO models for brand compliance and automated QA.**

![Python](https://img.shields.io/badge/Python-3.7%2B-blue?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.12-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-Apache%202.0-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

# Symphony Logo Detection System

**Enterprise-Grade YOLO-Powered Image Validation**

## Overview

Symphony Logo Detection System is an enterprise-grade platform for automated, high-accuracy logo detection in product imagery. The system uses advanced YOLO machine learning models to verify Symphony branding compliance and reduce manual QA effort.

The platform combines six specialized YOLO models (including the latest YOLOv11s cooler detection model) with a fault-tolerant batch processing system that can handle large volumes of images efficiently. Built on a microservice architecture, the system offers both a modern React frontend for interactive usage and a comprehensive FastAPI backend for integration with existing workflows and systems.

Ideal for marketing teams, quality assurance departments, and brand compliance managers, Symphony Logo Detection can process thousands of images with minimal manual intervention while providing detailed detection information and exportable reports.

### Core Features

- **Advanced Multi-Model Detection**: Six specialized YOLO models in a cascade for maximum accuracy
  - YOLOv8s and YOLOv11s variants with early-exit optimization
  - Specialized YOLOv11s cooler detection model
- **Fault-Tolerant Batch Processing**: Reliable batch processing with automatic recovery
  - Dual-tracking system with pending files management
  - Server-side retry mechanism for failed requests
- **Modern React Frontend**: Professional UI with WebSocket real-time progress tracking
  - Real-time processing updates with ETA calculation
  - Support for both file uploads and image URLs
- **Comprehensive API**: FastAPI-powered backend with extensive validation
  - Structured error responses and proper status codes
  - Rate limiting with SlowAPI integration
- **Enterprise Security**: Session-based authentication, CSRF protection, rate limiting
  - Secure admin authentication workflow
  - Comprehensive input validation
- **Admin Dashboard**: View batch processing history and system statistics
  - Historical batch tracking with 24-hour retention
  - CSV export with detailed processing results

## 🧠 System Architecture

The Symphony Logo Detection System follows a modular, microservice-driven architecture:

- 🧩 **Frontend (React 19.1.0)** handles all user interactions including uploads, batch progress, and dashboard views.
- ⚙️ **FastAPI Backend (Python)** processes image validation requests, manages batch tracking, and communicates with the detection engine.
- 🧠 **YOLO Microservice** handles logo detection using sequential inference with YOLOv8/YOLOv11 models.
- 🧼 **Utility Services** handle WebSocket updates, cleanup tasks, logging, and concurrency control.

📄 **[See full architecture diagrams, sequence flows, and component breakdowns →](docs/architecture.md)**

## 📋 Key Features

Symphony Logo Detection provides enterprise-grade image validation with:

- 🔍 **Multi-Model Detection** using six specialized YOLO models in an optimized cascade sequence
- 🔄 **Fault-Tolerant Processing** with dual-tracking system and automatic server-side retries
- ⚡ **Real-Time Updates** through WebSocket connections with accurate progress tracking
- 📊 **Admin Dashboard** for batch history, system stats, and detailed CSV exports
- 🛡️ **Enterprise Security** including rate limiting, CSRF protection, and session management

📄 **[Explore detailed feature documentation →](docs/key-features.md)**

## 🚀 Getting Started

Get up and running quickly with Symphony Logo Detection:

- 📥 **Installation**: See the [Installation Guide](docs/installation.md) for setup steps
- ⚙️ **Configuration**: Follow the [Configuration Guide](docs/configuration.md) for system tuning
- 🏁 **Quick Start**: Use the commands below for local development

📄 **[Read the complete getting started guide →](docs/getting-started.md)**

## 📡 API Reference

The Symphony Logo Detection API offers comprehensive endpoints:

- 🖼️ **Single Image**: `/api/check-logo/single` for validating individual images
- 📦 **Batch Processing**: `/api/check-logo/batch/*` endpoints for batch operations
- 📊 **Admin Access**: `/api/admin/*` endpoints for authenticated admin users
- 📥 **CSV Export**: Batch result exports with detailed detection information

📄 **[See complete API documentation →](docs/api-reference.md)**

## 🔄 Batch Processing

Symphony's batch processing system provides enterprise-grade reliability:

- 📁 **Dual Tracking**: Simultaneous JSON state and file-based tracking for fault tolerance
- 🔁 **Automatic Recovery**: Server-side retry mechanism for failed requests
- 📊 **Progress Tracking**: Real-time WebSocket updates with accurate ETA
- 🧹 **Resource Management**: Automatic cleanup with configurable retention periods
- 🛠️ **Configurable Batch Size**: Adjustable processing batch size from 1-100 images

📄 **[Learn about batch processing workflows →](docs/batch-processing.md)**

## 🤖 Model Architecture

Symphony uses an advanced cascade of YOLO models for maximum accuracy:

- 🧠 **Sequential Testing**: Six models with early-exit optimization for efficiency
- 🔍 **YOLOv8s Models**: Three specialized base models for logo detection
- 🔎 **YOLOv11s Models**: Next-generation models for challenging cases
- 🧊 **Cooler Detection**: Specialized YOLOv11s model for cooler displays

📄 **[Explore model architecture details →](docs/model-details.md)**

## 🔒 Security Features

The system implements multiple layers of security:

- 🛡️ **Authentication**: Session-based admin authentication system
- 🚫 **Rate Limiting**: Protection against excessive API usage
- 🔐 **CSRF Protection**: Token-based safeguards for form submissions
- 🧹 **Security Headers**: Comprehensive HTTP security headers

📄 **[Read the complete security guide →](docs/security.md)**

## ⚡ Quick Start

Get up and running in minutes:

```bash
# Backend Setup
pip install -r requirements.txt

# Start YOLO service (Terminal 1)
cd yolo_service
python start.py

# Start main API (Terminal 2)
uvicorn App:app --reload --host 0.0.0.0 --port 8000
```

```bash
# Frontend Setup
cd frontend
npm install
npm run start-backend
```

Access the application at http://localhost:3000 and the API documentation at http://localhost:8000/docs.

## 👥 Contributing

We welcome contributions from the community to improve Symphony Logo Detection!

- 📝 **Guidelines**: Please follow our [Contributing Guidelines](CONTRIBUTING.md)
- 🐛 **Bug Reports**: Submit issues for any bugs you find
- ✨ **Feature Requests**: Suggest new features or improvements
- 🧪 **Testing**: Help improve our test coverage
- 📖 **Documentation**: Help us keep docs clear and up-to-date

📄 **[Read our detailed contribution guide →](CONTRIBUTING.md)**

## License & Support

### License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

### Support & Contact

- **Documentation:** [Project Wiki](https://github.com/Dhruv0306/SymphonyProject1/wiki)
- **Issues:** [GitHub Issues](https://github.com/Dhruv0306/SymphonyProject1/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Dhruv0306/SymphonyProject1/discussions)

### Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Acknowledgments

- **YOLO Framework:** Ultralytics for the YOLO implementation
- **FastAPI:** Sebastián Ramírez for the excellent web framework
- **React Team:** For the powerful frontend framework
- **Open Source Community:** All contributors and maintainers

---

**⚠️ Security Notice:** This system processes image data and should be deployed with appropriate security measures. Always follow security best practices and keep the system updated with the latest security patches.
