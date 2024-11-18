import React, { useEffect, useRef, useState } from "react";

const RealTimeGestureRecognition = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gesture, setGesture] = useState("Loading...");
  const [stream, setStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // Start the camera and process frames
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      processFrames();
      setIsCameraOn(true);
    } catch (error) {
      console.error("Error accessing camera: ", error);
      alert("Cannot access the camera.");
    }
  };

  // Stop the camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOn(false);
  };

  // Process video frames and send to backend
  const processFrames = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // Draw the video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0);

      // Convert canvas content to Blob
      canvas.toBlob(async (blob) => {
        try {
          const formData = new FormData();
          formData.append("image", blob, "gesture.jpg");

          const response = await fetch("http://localhost:5000/recognize_gesture", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            setGesture(data.predicted_gesture || "No gesture detected");
          } else {
            setGesture("No gesture detected");
          }
        } catch (error) {
          console.error("Error:", error);
          setGesture("Error recognizing gesture.");
        }

        // Continue processing if the camera is on
        if (isCameraOn) {
          requestAnimationFrame(processFrames);
        }
      }, "image/jpeg");
    }
  };

  useEffect(() => {
    startCamera();

    // Cleanup: stop the camera when the component unmounts
    return () => stopCamera();
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Real-Time Gesture Recognition</h1>

      {/* Video Preview */}
      <video ref={videoRef} autoPlay style={{ width: "100%", maxWidth: "500px", border: "1px solid #ccc" }} />

      {/* Gesture Prediction */}
      <div id="result" style={{ fontSize: "1.5em", marginTop: "20px" }}>
        <p>Predicted Gesture: <span>{gesture}</span></p>
      </div>

      {/* Buttons */}
      <div style={{ marginTop: "20px" }}>
        <button onClick={startCamera} disabled={isCameraOn}>Start Camera</button>
        <button onClick={stopCamera} disabled={!isCameraOn} style={{ marginLeft: "10px" }}>
          Stop Camera
        </button>
      </div>

      {/* Hidden Canvas for Processing Frames */}
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
    </div>
  );
};

export default RealTimeGestureRecognition;





