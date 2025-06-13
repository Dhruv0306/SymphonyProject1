import pytest
from fastapi.testclient import TestClient
from App import app
import os
import shutil
from PIL import Image
import io

client = TestClient(app)

@pytest.fixture(scope="function")
def setup_test_images():
    # Create test directory if it doesn't exist
    os.makedirs("tests/test_images", exist_ok=True)
    
    # Create a sample test image with actual image data
    test_image_path = "tests/test_images/sample_valid.jpg"
    img = Image.new('RGB', (100, 100), color='red')
    img.save(test_image_path)
    
    yield test_image_path
    
    # Cleanup after tests
    if os.path.exists("tests/test_images"):
        shutil.rmtree("tests/test_images")

def test_single_valid_image(setup_test_images):
    with open(setup_test_images, "rb") as img:
        response = client.post(
            "/api/check-logo/single/",
            files={"file": ("image.jpg", img, "image/jpeg")}
        )
        assert response.status_code == 200
        result = response.json()
        assert "Is_Valid" in result
        assert result["Is_Valid"] in ["Valid", "Invalid"]

def test_single_no_file():
    response = client.post("/api/check-logo/single/")
    assert response.status_code == 400
    assert "Either file or image_path must be provided" in response.json()["detail"]

def test_single_invalid_file_type(setup_test_images):
    # Test with a text file instead of an image
    test_file_path = "tests/test_images/invalid.txt"
    with open(test_file_path, "w") as f:
        f.write("This is not an image")
    
    with open(test_file_path, "rb") as f:
        response = client.post(
            "/api/check-logo/single/",
            files={"file": ("invalid.txt", f, "text/plain")}
        )
        assert response.status_code == 400
        assert "File must be a non-empty JPG or PNG image" in response.json()["detail"] 