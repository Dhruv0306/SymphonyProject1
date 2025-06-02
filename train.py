from ultralytics import YOLO

# model = YOLO("yolov8s.pt")
# model.train(data="./data/data.yaml", epochs=150, imgsz=640, batch=8, name="yolov8s_logo_detection", exist_ok=True)

model = YOLO("yolo11s.pt")
model.train(data="./data/data.yaml", epochs=150, imgsz=640, batch=2, name="yolov11s_logo_detection", exist_ok=True)
