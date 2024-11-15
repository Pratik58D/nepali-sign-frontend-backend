from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import cv2
import mediapipe as mp
import joblib
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import io

# Load the trained SVM model and label encoder
svm_model = joblib.load('svm_model.pkl')
label_encoder = joblib.load('label_encoder.pkl')

# Initialize MediaPipe hands model
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all domains
CORS(app)  # This will allow all domains to access your API

# Load Nepali font for text rendering
font_path = './NotoSansDevanagari-Regular.ttf'  # Provide the correct path to your Nepali font
font = ImageFont.truetype(font_path, 40)

# Function to preprocess image data (convert from file to OpenCV image)
def preprocess_image(image_file):
    # Open the image using PIL and convert it to OpenCV format
    img = Image.open(image_file)
    img = np.array(img)
    # Convert image from RGB to BGR (OpenCV uses BGR format)
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    return img

# Function to recognize gesture from image
def recognize_gesture(image):
    # Convert the BGR image to RGB and process with MediaPipe
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            # Collect hand landmarks (21 points with (x, y, z) coordinates)
            hand_data = []
            for landmark in hand_landmarks.landmark:
                hand_data.extend([landmark.x, landmark.y, landmark.z])

            # Prepare the data for the model
            hand_data = np.array(hand_data).reshape(1, -1)

            # Make a prediction using the trained SVM model
            predicted_label = svm_model.predict(hand_data)
            predicted_label = label_encoder.inverse_transform(predicted_label)

            # Return the prediction result
            return predicted_label[0]
    return None

# API endpoint for gesture recognition
@app.route('/recognize_gesture', methods=['POST'])
def recognize_gesture_api():
    try:
        # Check if an image file is included in the request
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided."}), 400

        image_file = request.files['image']

        # Preprocess the image
        image = preprocess_image(image_file)

        # Recognize gesture
        prediction = recognize_gesture(image)

        if prediction:
            return jsonify({"predicted_gesture": prediction}), 200
        else:
            return jsonify({"message": "No hand detected."}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Start the Flask application
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
