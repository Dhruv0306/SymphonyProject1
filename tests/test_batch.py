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
    
    # Create sample test images with actual image data
    test_images = ["sample1.jpg", "sample2.jpg"]
    for img_name in test_images:
        # Create a small valid image
        img = Image.new('RGB', (100, 100), color='red')
        img_path = f"tests/test_images/{img_name}"
        img.save(img_path)
    
    yield test_images
    
    # Cleanup after tests
    if os.path.exists("tests/test_images"):
        shutil.rmtree("tests/test_images")

def test_batch_multiple_files(setup_test_images):
    files = []
    file_handles = []
    
    for img_name in setup_test_images:
        img_file = open(f"tests/test_images/{img_name}", "rb")
        file_handles.append(img_file)
        files.append(("files", (img_name, img_file, "image/jpeg")))
    
    try:
        response = client.post("/api/check-logo/batch/", files=files)
        assert response.status_code == 200
        result = response.json()
        assert "batch_id" in result
        assert "total_processed" in result
        assert "results" in result
        assert isinstance(result["results"], list)
        assert len(result["results"]) == len(setup_test_images)
        for item in result["results"]:
            assert "Is_Valid" in item
            assert item["Is_Valid"] in ["Valid", "Invalid"]
    finally:
        # Close files in finally block
        for fh in file_handles:
            fh.close()

def test_batch_no_files():
    response = client.post("/api/check-logo/batch/")
    assert response.status_code == 200
    result = response.json()
    assert result["total_processed"] == 0
    assert result["valid_count"] == 0
    assert result["invalid_count"] == 0
    assert len(result["results"]) == 0

def test_batch_single_file(setup_test_images):
    img_file = open(f"tests/test_images/{setup_test_images[0]}", "rb")
    try:
        files = [("files", (setup_test_images[0], img_file, "image/jpeg"))]
        response = client.post("/api/check-logo/batch/", files=files)
        assert response.status_code == 200
        result = response.json()
        assert "batch_id" in result
        assert result["total_processed"] == 1
        assert len(result["results"]) == 1
        assert result["results"][0]["Is_Valid"] in ["Valid", "Invalid"]
    finally:
        img_file.close()

def test_batch_mixed_valid_invalid_files(setup_test_images):
    files = []
    file_handles = []

    # Add one valid image
    img_file = open(f"tests/test_images/{setup_test_images[0]}", "rb")
    file_handles.append(img_file)
    files.append(("files", (setup_test_images[0], img_file, "image/jpeg")))

    # Add one invalid file
    with open("tests/test_images/invalid.txt", "w") as f:
        f.write("This is not an image")

    txt_file = open("tests/test_images/invalid.txt", "rb")
    file_handles.append(txt_file)
    files.append(("files", ("invalid.txt", txt_file, "text/plain")))

    try:
        response = client.post("/api/check-logo/batch/", files=files)
        assert response.status_code == 200
        result = response.json()
        assert "batch_id" in result
        assert result["total_processed"] == 2
        assert len(result["results"]) == 2
        # Check that one file is processed as invalid due to being a text file
        assert any(r["Is_Valid"] == "Invalid" and "invalid.txt" in r["Image_Path_or_URL"] for r in result["results"])
    finally:
        for fh in file_handles:
            fh.close() 