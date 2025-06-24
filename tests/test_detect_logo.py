import pytest
from unittest.mock import Mock, patch, MagicMock
from PIL import Image
import requests
from io import BytesIO
import os
import tempfile

from detect_logo import (
    add_boundary,
    is_url,
    load_models,
    check_logo,
    MODEL_PATHS,
    CONFIDENCE_THRESHOLD,
)


class TestDetectLogo:
    """Test suite for detect_logo.py module"""

    def test_add_boundary(self):
        """Test adding white boundary to image"""
        img = Image.new("RGB", (100, 100), color="red")
        result = add_boundary(img, boundary_size=5)

        assert result.size == (110, 110)  # 100 + 2*5

        # Test custom color
        result_blue = add_boundary(img, boundary_size=10, color=(0, 0, 255))
        assert result_blue.size == (120, 120)

    def test_is_url(self):
        """Test URL detection"""
        assert is_url("https://example.com/image.jpg") is True
        assert is_url("http://example.com/image.jpg") is True
        assert is_url("/local/path/image.jpg") is False
        assert is_url("image.jpg") is False

    @patch("detect_logo.os.path.exists")
    @patch("detect_logo.YOLO")
    def test_load_models_success(self, mock_yolo, mock_exists):
        """Test successful model loading"""
        mock_exists.return_value = True
        mock_model = Mock()
        mock_yolo.return_value = mock_model

        with patch("detect_logo.MODEL_PATHS", ["test_model.pt"]):
            models = load_models()

        assert len(models) == 1
        assert models[0][0] == mock_model
        assert models[0][1] == "test_model.pt"

    @patch("detect_logo.os.path.exists")
    def test_load_models_missing_file(self, mock_exists):
        """Test model loading with missing files"""
        mock_exists.return_value = False

        with patch("detect_logo.MODEL_PATHS", ["missing_model.pt"]):
            models = load_models()

        assert len(models) == 0

    @patch("detect_logo.os.path.exists")
    @patch("detect_logo.Image.open")
    def test_check_logo_local_file_invalid(self, mock_image_open, mock_exists):
        """Test logo detection with local file - no logo found"""
        mock_exists.return_value = True
        mock_img = Mock()
        mock_image_open.return_value.convert.return_value = mock_img

        # Mock model prediction - no boxes found
        mock_model = Mock()
        mock_result = Mock()
        mock_result.boxes = []
        mock_model.predict.return_value = [mock_result]

        with patch("detect_logo.models", [(mock_model, "test_model.pt")]):
            result = check_logo("test_image.jpg")

        assert result["Is_Valid"] == "Invalid"

    @patch("detect_logo.models", [(Mock(), "test_model.pt")])
    @patch("detect_logo.requests.get")
    def test_check_logo_url_valid(self, mock_get):
        """Test logo detection with URL"""
        # Mock successful HTTP response
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_img_data = BytesIO()
        test_img = Image.new("RGB", (100, 100), color="red")
        test_img.save(mock_img_data, format="JPEG")
        mock_img_data.seek(0)
        mock_response.content = mock_img_data.getvalue()
        mock_get.return_value = mock_response

        # Mock model prediction - no logo found
        mock_model = Mock()
        mock_model.predict.return_value = []

        with patch.dict(
            check_logo.__globals__, {"models": [(mock_model, "test_model.pt")]}
        ):
            result = check_logo("https://example.com/image.jpg")

        assert result["Is_Valid"] == "Invalid"

    @patch("detect_logo.models", [(Mock(), "test_model.pt")])
    def test_check_logo_file_not_found(self):
        """Test logo detection with non-existent file"""
        result = check_logo("nonexistent.jpg")

        assert result["Is_Valid"] == "Invalid"
        assert result["Error"] == "File not found"

    @patch("detect_logo.models", [(Mock(), "test_model.pt")])
    @patch("detect_logo.requests.get")
    def test_check_logo_url_error(self, mock_get):
        """Test logo detection with URL error"""
        mock_get.side_effect = requests.RequestException("Network error")

        result = check_logo("https://example.com/image.jpg")

        assert result["Is_Valid"] == "Invalid"
        assert "Failed to load URL" in result["Error"]

    @patch("detect_logo.models", [(Mock(), "test_model.pt")])
    @patch("detect_logo.os.path.exists")
    @patch("detect_logo.Image.open")
    def test_check_logo_model_inference_error(self, mock_image_open, mock_exists):
        """Test logo detection with model inference error"""
        mock_exists.return_value = True
        mock_img = Mock()
        mock_image_open.return_value.convert.return_value = mock_img

        # Mock model that raises exception
        mock_model = Mock()
        mock_model.predict.side_effect = Exception("Model error")

        with patch("detect_logo.models", [(mock_model, "test_model.pt")]):
            result = check_logo("test_image.jpg")

        assert result["Is_Valid"] == "Invalid"
