def format_response(result: dict) -> dict:
    """Format the response to match the expected model structure"""
    return {
        "Image_Path_or_URL": result["Image Path/URL"],
        "Is_Valid": result["Is Valid"],
        "Error": result.get("Error")
    }