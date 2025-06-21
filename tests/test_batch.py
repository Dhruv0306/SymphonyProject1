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
        img = Image.new("RGB", (100, 100), color="red")
        img_path = f"tests/test_images/{img_name}"
        img.save(img_path)

    yield test_images

    # Cleanup after tests
    if os.path.exists("tests/test_images"):
        shutil.rmtree("tests/test_images")


def test_batch_multiple_files(setup_test_images):
    # Step 1: Start batch
    batch_response = client.post("/api/start-batch")
    assert batch_response.status_code == 201
    batch_id = batch_response.json()["batch_id"]

    # Step 2: Initialize batch with total count
    init_response = client.post(
        "/api/init-batch",
        json={
            "batch_id": batch_id,
            "client_id": "test_client",
            "total": len(setup_test_images),
        },
    )
    assert init_response.status_code == 200

    # Step 3: Upload files
    files = []
    file_handles = []

    for img_name in setup_test_images:
        img_file = open(f"tests/test_images/{img_name}", "rb")
        file_handles.append(img_file)
        files.append(("files", (img_name, img_file, "image/jpeg")))

    try:
        response = client.post(
            "/api/check-logo/batch/", files=files, data={"batch_id": batch_id}
        )
        assert response.status_code == 200
        result = response.json()
        assert "batch_id" in result
        assert "message" in result
        assert result["status"] == "processing"
    finally:
        for fh in file_handles:
            fh.close()


def test_batch_status():
    # Start and initialize batch
    batch_response = client.post("/api/start-batch")
    batch_id = batch_response.json()["batch_id"]

    client.post(
        "/api/init-batch",
        json={"batch_id": batch_id, "client_id": "test_client", "total": 5},
    )

    # Check status
    status_response = client.get(f"/api/check-logo/batch/{batch_id}/status")
    assert status_response.status_code == 200
    result = status_response.json()
    assert "batch_id" in result
    assert "status" in result
    assert "counts" in result
    assert "progress" in result


def test_batch_invalid_id():
    fake_batch_id = "non-existent-batch-id"

    # Test status with invalid ID
    status_response = client.get(f"/api/check-logo/batch/{fake_batch_id}/status")
    assert status_response.status_code == 404
    assert "not found" in status_response.json()["detail"]

    # Test processing with invalid ID - API checks files first
    process_response = client.post(
        "/api/check-logo/batch/", data={"batch_id": fake_batch_id}
    )
    assert process_response.status_code == 400
    assert "Files or URLs required" in process_response.json()["detail"]


def test_batch_with_urls():
    # Start and initialize batch
    batch_response = client.post("/api/start-batch")
    batch_id = batch_response.json()["batch_id"]

    client.post(
        "/api/init-batch",
        json={"batch_id": batch_id, "client_id": "test_client", "total": 2},
    )

    # Process with URLs
    url_payload = {
        "batch_id": batch_id,
        "image_paths": [
            "https://example.com/image1.jpg",
            "https://example.com/image2.jpg",
        ],
    }

    response = client.post("/api/check-logo/batch/", json=url_payload)
    assert response.status_code == 200
    result = response.json()
    assert "batch_id" in result
    assert "message" in result
    assert result["status"] == "processing"


def test_batch_no_files():
    # Step 1: Start batch
    batch_response = client.post("/api/start-batch")
    assert batch_response.status_code == 201
    batch_id = batch_response.json()["batch_id"]

    # Step 2: Try to process without files or URLs
    response = client.post("/api/check-logo/batch/", data={"batch_id": batch_id})
    assert response.status_code == 400
    assert "Files or URLs required" in response.json()["detail"]


def test_batch_single_file(setup_test_images):
    # Step 1: Start batch
    batch_response = client.post("/api/start-batch")
    assert batch_response.status_code == 201
    batch_id = batch_response.json()["batch_id"]

    # Step 2: Initialize batch
    init_response = client.post(
        "/api/init-batch",
        json={"batch_id": batch_id, "client_id": "test_client", "total": 1},
    )
    assert init_response.status_code == 200

    # Step 3: Upload single file
    img_file = open(f"tests/test_images/{setup_test_images[0]}", "rb")
    try:
        files = [("files", (setup_test_images[0], img_file, "image/jpeg"))]
        response = client.post(
            "/api/check-logo/batch/", files=files, data={"batch_id": batch_id}
        )
        assert response.status_code == 200
        result = response.json()
        assert "batch_id" in result
        assert "message" in result
        assert result["status"] == "processing"
    finally:
        img_file.close()


def test_batch_mixed_valid_invalid_files(setup_test_images):
    # Step 1: Start batch
    batch_response = client.post("/api/start-batch")
    assert batch_response.status_code == 201
    batch_id = batch_response.json()["batch_id"]

    # Step 2: Initialize batch
    init_response = client.post(
        "/api/init-batch",
        json={"batch_id": batch_id, "client_id": "test_client", "total": 2},
    )
    assert init_response.status_code == 200

    # Step 3: Prepare files
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
        response = client.post(
            "/api/check-logo/batch/", files=files, data={"batch_id": batch_id}
        )
        assert response.status_code == 200
        result = response.json()
        assert "batch_id" in result
        assert "message" in result
        assert result["status"] == "processing"
    finally:
        for fh in file_handles:
            fh.close()
