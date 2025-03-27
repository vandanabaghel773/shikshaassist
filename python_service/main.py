from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import cv2
import mediapipe as mp
import os
import shutil
import uvicorn

app = FastAPI(title="MediaPipe Pose Processing API", version="1.0")

# ✅ Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

# ✅ Root route for testing if the API is live
@app.get("/")
async def read_root():
    return {"message": "Welcome to the MediaPipe Pose Processing API!"}

# ✅ Optional: Docs route link (for Swagger UI)
@app.get("/docs-link")
async def docs_link():
    return {"message": "Visit /docs for the interactive Swagger UI!"}

# ✅ Upload and process video route
@app.post("/process-video/")
async def process_video(file: UploadFile = File(...)):
    temp_dir = "temp_videos"
    os.makedirs(temp_dir, exist_ok=True)

    temp_filename = os.path.join(temp_dir, f"temp_{file.filename}")

    try:
        # ✅ Save uploaded video to the temp folder
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # ✅ Open video with OpenCV
        cap = cv2.VideoCapture(temp_filename)

        if not cap.isOpened():
            return JSONResponse(content={"error": "Failed to open video file."}, status_code=400)

        frame_count = 0
        processed_frames = 0
        results_data = []

        print("✅ Starting video frame analysis...")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1

            # Convert frame to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Process frame for pose detection
            results = pose.process(frame_rgb)

            # ✅ Collect pose landmarks if detected
            if results.pose_landmarks:
                frame_landmarks = []
                for lm in results.pose_landmarks.landmark:
                    frame_landmarks.append({
                        'x': lm.x,
                        'y': lm.y,
                        'z': lm.z,
                        'visibility': lm.visibility
                    })

                # Append landmarks for current frame
                results_data.append({
                    'frame': frame_count,
                    'landmarks': frame_landmarks
                })

                processed_frames += 1

        cap.release()

        # ✅ Remove temporary video after processing
        os.remove(temp_filename)

        print(f"✅ Processed {processed_frames} frames with pose landmarks out of {frame_count} total frames.")

        # ✅ Return a JSON response with stats and sample data
        response = {
            "status": "success",
            "message": "Video processed successfully!",
            "frames_analyzed": frame_count,
            "frames_with_landmarks": processed_frames,
            "pose_data_sample": results_data[:3],  # Optional: return full data or just a sample
        }

        return JSONResponse(content=response, status_code=200)

    except Exception as e:
        print("❌ Error processing video:", str(e))
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

    finally:
        # ✅ Cleanup: delete temp files if they still exist
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        # Optional: clean up temp folder if empty
        if os.path.exists(temp_dir) and not os.listdir(temp_dir):
            os.rmdir(temp_dir)


# ✅ Run the FastAPI server (optional for direct run)
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
