import pytest
from fastapi.testclient import TestClient
from App import app
import os
import shutil
from PIL import Image
import io

# Initialize test client for FastAPI application
client = TestClient(app)


@pytest.fixture(scope="function")
def setup_test_images():
    """
    Pytest fixture to setup and teardown test image files.

    Creates a test directory and sample image file before tests,
    and cleans up afterwards.

    Returns:
        str: Path to the created test image file
    """
    # Create test directory if it doesn't exist
    os.makedirs("tests/test_images", exist_ok=True)

    # Create a sample test image with actual image data - 100x100 red square
    test_image_path = "tests/test_images/sample_valid.jpg"
    img = Image.new("RGB", (100, 100), color="red")
    img.save(test_image_path)

    yield test_image_path

    # Cleanup test directory and files after tests complete
    if os.path.exists("tests/test_images"):
        shutil.rmtree("tests/test_images")


def test_single_valid_image(setup_test_images):
    """
    Test the single image validation endpoint with a valid image file.

    Tests that:
    - Endpoint returns 200 status code
    - Response contains Is_Valid field
    - Is_Valid contains either "Valid" or "Invalid"

    Args:
        setup_test_images: Pytest fixture providing test image path
    """
    with open(setup_test_images, "rb") as img:
        # Send POST request with valid image file
        response = client.post(
            "/api/check-logo/single/", files={"file": ("image.jpg", img, "image/jpeg")}
        )
        assert response.status_code == 200
        result = response.json()
        assert "Is_Valid" in result
        assert result["Is_Valid"] in ["Valid", "Invalid"]


def test_single_no_file():
    """
    Test the single image validation endpoint with no file provided.

    Tests that:
    - Endpoint returns 400 status code
    - Error message indicates file/path is required
    """
    # Send POST request with no file attached
    response = client.post("/api/check-logo/single/")
    assert response.status_code == 400
    assert "Either file or image_path must be provided" in response.json()["detail"]


def test_single_invalid_file_type(setup_test_images):
    """
    Test the single image validation endpoint with an invalid file type.

    Tests that:
    - Endpoint returns 400 status code
    - Error message indicates only JPG/PNG allowed

    Args:
        setup_test_images: Pytest fixture providing test directory
    """
    # Create and test with a text file instead of an image
    test_file_path = "tests/test_images/invalid.txt"
    with open(test_file_path, "w") as f:
        f.write("This is not an image")

    with open(test_file_path, "rb") as f:
        # Send POST request with text file
        response = client.post(
            "/api/check-logo/single/", files={"file": ("invalid.txt", f, "text/plain")}
        )
        assert response.status_code == 400
        assert "File must be a non-empty JPG or PNG image" in response.json()["detail"]
