import pytest
from unittest.mock import patch, MagicMock
import os
import shutil
from PIL import Image
import numpy as np
import sys
import logging

# Configure logging for test execution
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Mock cv2 module for testing image processing functions
mock_cv2 = MagicMock()
sys.modules["cv2"] = mock_cv2


class MockYOLO:
    """
    Mock implementation of YOLO model class for testing.
    Simulates the behavior of the actual YOLO model without requiring model weights.
    """

    def __init__(self, model_path):
        self.model_path = model_path
        self.names = {0: "symphony"}  # Default class names for testing

    def predict(self, img, conf=None):
        """
        Mock prediction method to be overridden in test cases.
        Args:
            img: Input image
            conf: Confidence threshold
        """
        pass


# Setup mock ultralytics module with MockYOLO class
mock_ultralytics = MagicMock()
mock_ultralytics.YOLO = MockYOLO
sys.modules["ultralytics"] = mock_ultralytics

from detect_logo import check_logo, MODEL_PATHS, CONFIDENCE_THRESHOLD


@pytest.fixture(scope="function")
def setup_test_images():
    """
    Fixture to create and manage test image files.
    Creates a test directory and sample image, then cleans up after tests.

    Returns:
        str: Path to the test image file
    """
    # Create test directory if it doesn't exist
    os.makedirs("tests/test_images", exist_ok=True)

    # Create a sample test image with actual image data
    test_image_path = "tests/test_images/sample_valid.jpg"
    img = Image.new("RGB", (100, 100), color="red")
    img.save(test_image_path)

    yield test_image_path

    # Cleanup test files after test completion
    if os.path.exists("tests/test_images"):
        shutil.rmtree("tests/test_images")


@pytest.fixture(scope="function")
def mock_image():
    """
    Fixture to create mock image data and configure cv2 mock responses.

    Returns:
        ndarray: Mock image array for testing
    """
    # Create a test image array with correct shape and type
    test_img = np.zeros((100, 100, 3), dtype=np.uint8)  # Original size
    mock_cv2.imread.return_value = test_img
    mock_cv2.cvtColor.return_value = test_img
    mock_cv2.resize.return_value = test_img
    return test_img


class Box:
    """
    Mock implementation of YOLO detection box.
    Simulates detection results with class, confidence and coordinates.
    """

    def __init__(self, cls=0, conf=0.95, xyxy=None):
        self.cls = np.array([cls])
        self.conf = np.array([conf])
        self.xyxy = np.array([[10, 20, 30, 40]]) if xyxy is None else np.array([xyxy])


class Results:
    """
    Mock implementation of YOLO results.
    Contains detection boxes and implements iteration.
    """

    def __init__(self, boxes=None):
        self.boxes = boxes if boxes is not None else []

    def __iter__(self):
        yield self


@patch("detect_logo.load_models")
@patch("detect_logo.add_boundary")
@patch("PIL.Image.open")
def test_fallback_on_model_error(
    mock_image_open, mock_add_boundary, mock_load_models, setup_test_images, mock_image
):
    """
    Test handling of model errors in the detection pipeline.
    Verifies that system gracefully handles cases where all models fail.
    """
    # Setup mock image handling
    test_img = Image.new("RGB", (100, 100), color="red")
    test_img.convert = MagicMock(return_value=test_img)
    mock_image_open.return_value = test_img

    # Configure boundary addition mock
    def mock_add_boundary_fn(img):
        img_with_boundary = Image.new("RGB", (120, 120), color="white")
        img_with_boundary.paste(img, (10, 10))
        img_with_boundary.convert = MagicMock(return_value=img_with_boundary)
        return img_with_boundary

    mock_add_boundary.side_effect = mock_add_boundary_fn

    # Configure all models to fail with exceptions
    mock_models = []
    for path in MODEL_PATHS:
        model = MockYOLO(path)
        model.predict = MagicMock(side_effect=Exception("Model crash"))
        mock_models.append((model, path))

    mock_load_models.return_value = mock_models

    # Verify error handling behavior
    result = check_logo(setup_test_images)
    assert result["Is_Valid"] == "Invalid"
    assert "Error" not in result


@patch("detect_logo.load_models")
@patch("detect_logo.add_boundary")
@patch("PIL.Image.open")
def test_fallback_on_no_predictions(
    mock_image_open, mock_add_boundary, mock_load_models, setup_test_images, mock_image
):
    """
    Test handling of cases where no models make predictions.
    Verifies system behavior when all models return empty results.
    """
    # Setup mock image handling
    test_img = Image.new("RGB", (100, 100), color="red")
    test_img.convert = MagicMock(return_value=test_img)
    mock_image_open.return_value = test_img

    # Configure boundary addition mock
    def mock_add_boundary_fn(img):
        img_with_boundary = Image.new("RGB", (120, 120), color="white")
        img_with_boundary.paste(img, (10, 10))
        img_with_boundary.convert = MagicMock(return_value=img_with_boundary)
        return img_with_boundary

    mock_add_boundary.side_effect = mock_add_boundary_fn

    # Configure all models to return empty predictions
    mock_models = []
    for path in MODEL_PATHS:
        model = MockYOLO(path)
        model.predict = MagicMock(return_value=[Results(boxes=[])])
        mock_models.append((model, path))

    mock_load_models.return_value = mock_models

    # Verify handling of no predictions
    result = check_logo(setup_test_images)
    assert result["Is_Valid"] == "Invalid"
    assert "Error" not in result


@patch("detect_logo.models")
@patch("detect_logo.add_boundary")
@patch("PIL.Image.open")
def test_fallback_chain(
    mock_image_open, mock_add_boundary, mock_models_patch, setup_test_images, mock_image
):
    """
    Test the model fallback chain mechanism.
    Verifies that system properly falls back through multiple models until finding valid prediction.
    """
    # Setup mock image handling
    test_img = Image.new("RGB", (100, 100), color="red")
    test_img.convert = MagicMock(return_value=test_img)
    mock_image_open.return_value = test_img

    # Configure boundary addition mock
    def mock_add_boundary_fn(img):
        img_with_boundary = Image.new("RGB", (120, 120), color="white")
        img_with_boundary.paste(img, (10, 10))
        img_with_boundary.convert = MagicMock(return_value=img_with_boundary)
        return img_with_boundary

    mock_add_boundary.side_effect = mock_add_boundary_fn

    # Setup chain of models with different behaviors
    mock_models = []

    # Configure models with various failure modes and one success
    model1 = MockYOLO(MODEL_PATHS[0])
    model1.predict = MagicMock(return_value=[Results(boxes=[])])
    mock_models.append((model1, MODEL_PATHS[0]))

    model2 = MockYOLO(MODEL_PATHS[1])
    model2.predict = MagicMock(side_effect=Exception("Model 2 crash"))
    mock_models.append((model2, MODEL_PATHS[1]))

    model3 = MockYOLO(MODEL_PATHS[2])
    model3.predict = MagicMock(return_value=[Results(boxes=[])])
    mock_models.append((model3, MODEL_PATHS[2]))

    model4 = MockYOLO(MODEL_PATHS[3])
    model4.predict = MagicMock(return_value=[Results(boxes=[])])
    mock_models.append((model4, MODEL_PATHS[3]))

    model5 = MockYOLO(MODEL_PATHS[4])
    box = Box(cls=0, conf=0.95, xyxy=[10, 20, 30, 40])
    model5.predict = MagicMock(return_value=[Results(boxes=[box])])
    mock_models.append((model5, MODEL_PATHS[4]))

    # Configure model iteration
    mock_models_patch.__iter__.return_value = iter(mock_models)

    # Verify fallback chain results in successful detection
    result = check_logo(setup_test_images)
    logger.debug(f"Final result: {result}")
    assert result["Is_Valid"] == "Valid"
    assert result["Confidence"] > 0.9
    assert "Bounding_Box" in result
