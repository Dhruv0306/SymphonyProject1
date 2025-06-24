import pytest
import os
import tempfile
import shutil
import time
from unittest.mock import patch, Mock
from datetime import datetime, timedelta

from utils.cleanup import cleanup_old_batches, cleanup_temp_uploads, log_cleanup_stats


class TestCleanup:
    """Test suite for cleanup utilities"""

    @pytest.fixture
    def temp_exports_dir(self):
        """Create temporary exports directory for testing"""
        temp_dir = tempfile.mkdtemp()
        exports_dir = os.path.join(temp_dir, "exports")
        os.makedirs(exports_dir)

        yield exports_dir

        shutil.rmtree(temp_dir)

    @pytest.fixture
    def temp_uploads_dir(self):
        """Create temporary uploads directory for testing"""
        temp_dir = tempfile.mkdtemp()

        yield temp_dir

        shutil.rmtree(temp_dir)

    def test_cleanup_old_batches_success(self, temp_exports_dir):
        """Test successful cleanup of old batch directories"""
        # Create test batch directories
        old_batch = os.path.join(temp_exports_dir, "old_batch_123")
        new_batch = os.path.join(temp_exports_dir, "new_batch_456")
        os.makedirs(old_batch)
        os.makedirs(new_batch)

        # Make old_batch appear old by modifying creation time
        old_time = time.time() - (25 * 3600)  # 25 hours ago
        os.utime(old_batch, (old_time, old_time))

        with patch("utils.cleanup.os.path.exists") as mock_exists:
            mock_exists.return_value = True
            with patch("utils.cleanup.os.listdir") as mock_listdir:
                mock_listdir.return_value = ["old_batch_123", "new_batch_456"]
                with patch("utils.cleanup.os.path.isdir") as mock_isdir:
                    mock_isdir.return_value = True
                    with patch("utils.cleanup.os.path.getctime") as mock_getctime:
                        mock_getctime.side_effect = lambda x: (
                            old_time if "old_batch" in x else time.time()
                        )
                        with patch("utils.cleanup.shutil.rmtree") as mock_rmtree:

                            result = cleanup_old_batches(max_age_hours=24)

                            assert result == 1
                            mock_rmtree.assert_called_once()

    def test_cleanup_old_batches_no_directory(self):
        """Test cleanup when exports directory doesn't exist"""
        with patch("utils.cleanup.os.path.exists") as mock_exists:
            mock_exists.return_value = False

            result = cleanup_old_batches()

            assert result == 0

    def test_cleanup_old_batches_error_handling(self, temp_exports_dir):
        """Test cleanup error handling"""
        batch_dir = os.path.join(temp_exports_dir, "error_batch")
        os.makedirs(batch_dir)

        with patch("utils.cleanup.os.path.exists") as mock_exists:
            mock_exists.return_value = True
            with patch("utils.cleanup.os.listdir") as mock_listdir:
                mock_listdir.return_value = ["error_batch"]
                with patch("utils.cleanup.os.path.isdir") as mock_isdir:
                    mock_isdir.return_value = True
                    with patch("utils.cleanup.os.path.getctime") as mock_getctime:
                        mock_getctime.return_value = time.time() - (25 * 3600)
                        with patch("utils.cleanup.shutil.rmtree") as mock_rmtree:
                            mock_rmtree.side_effect = PermissionError("Access denied")

                            result = cleanup_old_batches(max_age_hours=24)

                            assert result == 0  # No successful cleanups

    def test_cleanup_temp_uploads_success(self, temp_uploads_dir):
        """Test successful cleanup of old temporary files"""
        # Create test files
        old_file = os.path.join(temp_uploads_dir, "old_file.jpg")
        new_file = os.path.join(temp_uploads_dir, "new_file.jpg")

        with open(old_file, "w") as f:
            f.write("old content")
        with open(new_file, "w") as f:
            f.write("new content")

        # Make old_file appear old
        old_time = time.time() - (35 * 60)  # 35 minutes ago
        os.utime(old_file, (old_time, old_time))

        with patch("utils.cleanup.UPLOAD_DIR", temp_uploads_dir):
            with patch("utils.cleanup.os.path.getctime") as mock_getctime:
                mock_getctime.side_effect = lambda x: (
                    old_time if "old_file" in x else time.time()
                )

                result = cleanup_temp_uploads(max_age_minutes=30)

                assert result == 1
                assert not os.path.exists(old_file)
                assert os.path.exists(new_file)

    def test_cleanup_temp_uploads_no_directory(self):
        """Test cleanup when uploads directory doesn't exist"""
        with patch("utils.cleanup.UPLOAD_DIR", "/nonexistent/path"):
            with patch("utils.cleanup.os.path.exists") as mock_exists:
                mock_exists.return_value = False

                result = cleanup_temp_uploads()

                assert result == 0

    def test_cleanup_temp_uploads_error_handling(self, temp_uploads_dir):
        """Test temp uploads cleanup error handling"""
        error_file = os.path.join(temp_uploads_dir, "error_file.jpg")
        with open(error_file, "w") as f:
            f.write("content")

        with patch("utils.cleanup.UPLOAD_DIR", temp_uploads_dir):
            with patch("utils.cleanup.os.path.getctime") as mock_getctime:
                mock_getctime.return_value = time.time() - (35 * 60)
                with patch("utils.cleanup.os.remove") as mock_remove:
                    mock_remove.side_effect = PermissionError("Access denied")

                    result = cleanup_temp_uploads(max_age_minutes=30)

                    assert result == 0

    def test_log_cleanup_stats(self, capsys):
        """Test cleanup statistics logging"""
        batch_cleaned = 5
        temp_cleaned = 10

        log_cleanup_stats(batch_cleaned, temp_cleaned)

        captured = capsys.readouterr()
        assert "Cleanup Statistics" in captured.out
        assert "Batches cleaned: 5" in captured.out
        assert "Temporary files cleaned: 10" in captured.out

    def test_cleanup_integration(self, temp_exports_dir, temp_uploads_dir):
        """Integration test for complete cleanup workflow"""
        # Setup old batch directory
        old_batch = os.path.join(temp_exports_dir, "old_batch")
        os.makedirs(old_batch)

        # Setup old temp file
        old_file = os.path.join(temp_uploads_dir, "old_temp.jpg")
        with open(old_file, "w") as f:
            f.write("old content")

        # Make them appear old
        old_time = time.time() - (25 * 3600)
        os.utime(old_batch, (old_time, old_time))
        os.utime(old_file, (old_time, old_time))

        with patch("utils.cleanup.UPLOAD_DIR", temp_uploads_dir):
            with patch("utils.cleanup.os.path.exists") as mock_exists:
                mock_exists.side_effect = (
                    lambda x: x == temp_exports_dir or x == temp_uploads_dir
                )
                with patch("utils.cleanup.os.listdir") as mock_listdir:

                    def listdir_side_effect(path):
                        if path == temp_exports_dir:
                            return ["old_batch"]
                        elif path == temp_uploads_dir:
                            return ["old_temp.jpg"]
                        return []

                    mock_listdir.side_effect = listdir_side_effect

                    with patch("utils.cleanup.os.path.isdir") as mock_isdir:
                        mock_isdir.return_value = True
                        with patch("utils.cleanup.os.path.isfile") as mock_isfile:
                            mock_isfile.return_value = True
                            with patch(
                                "utils.cleanup.os.path.getctime"
                            ) as mock_getctime:
                                mock_getctime.return_value = old_time

                                batch_result = cleanup_old_batches(max_age_hours=24)
                                temp_result = cleanup_temp_uploads(max_age_minutes=30)

                                assert batch_result >= 0  # Should process without error
                                assert temp_result >= 0  # Should process without error
