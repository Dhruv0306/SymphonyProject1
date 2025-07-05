# Contributing to Symphony Logo Detection System

Thank you for your interest in contributing to the Symphony Logo Detection System! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

We welcome contributions from the community! Here are the main ways you can contribute:

### 🐛 Bug Reports
- Report bugs and issues you encounter
- Provide detailed reproduction steps
- Include system information and error logs

### 💡 Feature Requests
- Suggest new features and improvements
- Discuss implementation approaches
- Help prioritize development efforts

### 📝 Code Contributions
- Fix bugs and implement features
- Improve documentation
- Add tests and improve test coverage
- Optimize performance

### 📚 Documentation
- Improve existing documentation
- Add examples and tutorials
- Fix typos and clarify explanations

## 🚀 Getting Started

### Prerequisites
- Python 3.7+
- Node.js 14+
- Git
- Basic knowledge of FastAPI, React, and YOLO models

### Development Setup

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/SymphonyProject1.git
   cd SymphonyProject1
   ```

2. **Set Up Backend Environment**
   ```bash
   # Create virtual environment
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

3. **Set Up Frontend Environment**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure Environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Backend API
   uvicorn App:app --reload --host 0.0.0.0 --port 8000
   
   # Terminal 2: YOLO Service
   cd yolo_service
   uvicorn main:app --reload --host 0.0.0.0 --port 8001
   
   # Terminal 3: Frontend
   cd frontend
   npm start
   ```

## 📋 Development Guidelines

### Code Style

#### Python (Backend)
- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guidelines
- Use type hints for function parameters and return values
- Keep functions focused and under 50 lines when possible
- Use descriptive variable and function names

```python
# Good example
def process_batch_images(batch_id: str, image_files: List[UploadFile]) -> BatchResult:
    """Process a batch of images for logo detection.
    
    Args:
        batch_id: Unique identifier for the batch
        image_files: List of uploaded image files
        
    Returns:
        BatchResult: Processing results with statistics
    """
    # Implementation here
```

#### JavaScript/React (Frontend)
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use functional components with hooks
- Implement proper error handling
- Use TypeScript for type safety (if applicable)

```javascript
// Good example
const FileUploader = ({ onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (uploadedFiles) => {
    try {
      setIsLoading(true);
      // Implementation here
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="file-uploader">
      {/* Component JSX */}
    </div>
  );
};
```

### Testing

#### Backend Testing
- Write tests for all new functionality
- Maintain >90% code coverage
- Use pytest for testing framework
- Test both success and error scenarios

```python
# Example test
import pytest
from fastapi.testclient import TestClient
from App import app

client = TestClient(app)

def test_single_image_upload():
    """Test single image upload endpoint."""
    with open("tests/test_image.jpg", "rb") as f:
        response = client.post(
            "/api/check-logo/single/",
            files={"file": ("test.jpg", f, "image/jpeg")}
        )
    
    assert response.status_code == 200
    assert "is_valid" in response.json()
```

#### Frontend Testing
- Test all React components
- Use React Testing Library for component testing
- Mock API calls and WebSocket connections
- Test user interactions and error states

```javascript
// Example test
import { render, screen, fireEvent } from '@testing-library/react';
import FileUploader from '../FileUploader';

test('uploads file successfully', async () => {
  render(<FileUploader />);
  
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const input = screen.getByLabelText(/upload file/i);
  
  fireEvent.change(input, { target: { files: [file] } });
  
  expect(await screen.findByText(/uploading/i)).toBeInTheDocument();
});
```

### Documentation

#### Code Documentation
- Add docstrings to all functions and classes
- Include type hints and parameter descriptions
- Document complex algorithms and business logic
- Keep documentation up to date with code changes

#### API Documentation
- Update OpenAPI/Swagger documentation
- Add examples for new endpoints
- Document error responses and status codes
- Include authentication requirements

## 🔄 Pull Request Process

### Before Submitting

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation as needed
   - Follow the coding style guidelines

3. **Run Tests**
   ```bash
   # Backend tests
   pytest tests/
   
   # Frontend tests
   cd frontend
   npm test
   
   # Check code coverage
   pytest --cov=. tests/
   npm test -- --coverage
   ```

4. **Code Quality Checks**
   ```bash
   # Python linting
   flake8 .
   black --check .
   
   # JavaScript linting
   cd frontend
   npm run lint
   ```

### Submitting a Pull Request

1. **Push Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Go to the GitHub repository
   - Click "New Pull Request"
   - Select your feature branch
   - Fill out the PR template

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes made

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Performance improvement
   - [ ] Refactoring

   ## Testing
   - [ ] Backend tests pass
   - [ ] Frontend tests pass
   - [ ] Manual testing completed
   - [ ] Code coverage maintained

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

## 🏷️ Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat: add batch processing with progress tracking
fix(auth): resolve session timeout issue
docs: update API documentation with new endpoints
test: add unit tests for logo detection models
refactor(utils): improve error handling in batch tracker
```

## 🐛 Bug Reports

### Before Reporting
- Check existing issues for duplicates
- Try to reproduce the issue
- Gather relevant information

### Bug Report Template
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Ubuntu 20.04, Windows 10]
- Python Version: [e.g., 3.9.7]
- Node Version: [e.g., 16.13.0]
- Browser: [e.g., Chrome 96.0.4664.110]

## Additional Information
- Error logs
- Screenshots
- System information
```

## 💡 Feature Requests

### Before Requesting
- Check if the feature already exists
- Consider the impact on existing functionality
- Think about implementation complexity

### Feature Request Template
```markdown
## Feature Description
Clear description of the requested feature

## Use Case
Why this feature is needed

## Proposed Implementation
How you think it could be implemented

## Alternatives Considered
Other approaches you've considered

## Additional Context
Any other relevant information
```

## 🧪 Testing Guidelines

### Test Structure
```
tests/
├── test_batch.py          # Batch processing tests
├── test_single.py         # Single image tests
├── test_detect_logo.py    # YOLO model tests
├── test_cleanup.py        # Cleanup utility tests
├── test_ws_manager.py     # WebSocket tests
└── conftest.py           # Test configuration
```

### Test Best Practices
- Test both success and failure scenarios
- Use descriptive test names
- Mock external dependencies
- Test edge cases and boundary conditions
- Keep tests independent and isolated

### Running Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_batch.py

# Run with coverage
pytest --cov=. tests/

# Run with verbose output
pytest -v

# Run only fast tests
pytest -m "not slow"
```

## 📚 Documentation Guidelines

### Code Documentation
- Use clear, concise docstrings
- Include examples for complex functions
- Document exceptions and error conditions
- Keep documentation close to code

### API Documentation
- Update OpenAPI specifications
- Include request/response examples
- Document authentication requirements
- Add error response documentation

### User Documentation
- Write clear, step-by-step instructions
- Include screenshots for UI changes
- Provide troubleshooting guides
- Keep documentation up to date

## 🔧 Development Tools

### Recommended Tools
- **IDE:** VS Code, PyCharm, or your preferred editor
- **Git GUI:** GitKraken, SourceTree, or GitHub Desktop
- **API Testing:** Postman, Insomnia, or curl
- **Database:** SQLite for development (if applicable)

### VS Code Extensions
- Python
- Pylance
- ESLint
- Prettier
- GitLens
- REST Client

### Git Hooks
Consider setting up pre-commit hooks:
```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install
```

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow project guidelines

### Communication
- Use GitHub Issues for bug reports
- Use GitHub Discussions for questions
- Be clear and specific in communications
- Respond to feedback promptly

### Review Process
- All PRs require review before merging
- Address review comments promptly
- Be open to suggestions and improvements
- Help review other contributors' work

## 🎯 Contribution Areas

### High Priority
- Bug fixes and stability improvements
- Performance optimizations
- Security enhancements
- Documentation improvements

### Medium Priority
- New features and enhancements
- UI/UX improvements
- Additional test coverage
- Code refactoring

### Low Priority
- Nice-to-have features
- Experimental features
- Cosmetic changes
- Minor optimizations

## 📞 Getting Help

### Resources
- **Documentation:** Check the README.md and API docs
- **Issues:** Search existing issues for solutions
- **Discussions:** Ask questions in GitHub Discussions
- **Code:** Review existing code for examples

### Contact
- **GitHub Issues:** [Create an issue](https://github.com/Dhruv0306/SymphonyProject1/issues)
- **GitHub Discussions:** [Start a discussion](https://github.com/Dhruv0306/SymphonyProject1/discussions)
- **Email:** For security issues, contact security@symphony.com

## 🙏 Recognition

Contributors will be recognized in:
- Project README.md
- Release notes
- GitHub contributors page
- Project documentation

Thank you for contributing to the Symphony Logo Detection System! Your contributions help make this project better for everyone.

---

**Note:** This contributing guide is a living document. Feel free to suggest improvements or ask questions about any part of the contribution process.
