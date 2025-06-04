from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import easyocr
import base64
import io
from PIL import Image
import requests
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize EasyOCR reader
reader = easyocr.Reader(['en', 'hi'])

GROQ_API_KEY = "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"  # Replace with your actual key
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    language = data.get('language', 'en')
    
    # Here you would implement your chat logic
    response = {
        'message': f'Received your message in {language}: {message}',
        'status': 'success'
    }
    return jsonify(response)

def extract_text_from_image(image_path_or_bytes, lang_list=['en', 'hi'], min_confidence=0.6):
    """
    Extracts text from an image using EasyOCR.
    """
    try:
        reader = easyocr.Reader(lang_list, gpu=False)
        if isinstance(image_path_or_bytes, bytes):
            image = Image.open(io.BytesIO(image_path_or_bytes)).convert('RGB')
            image_np = np.array(image)
        else:
            image_np = cv2.imread(image_path_or_bytes)
        results = reader.readtext(image_np)
        final_texts = [
            text.strip()
            for (bbox, text, confidence) in results
            if confidence >= min_confidence and len(text.strip()) > 1
        ]
        return "\n".join(final_texts) if final_texts else "⚠️ No clear text found."
    except Exception as e:
        return f"❌ Error reading image: {str(e)}"

@app.route('/api/process-image', methods=['POST'])
def process_image():
    try:
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file uploaded.'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No selected file.'}), 400
        file_bytes = file.read()
        # Check if file is an image
        try:
            Image.open(io.BytesIO(file_bytes))
        except Exception:
            return jsonify({'status': 'error', 'message': 'Only image files are supported for OCR.'}), 400
        # Extract text
        extracted_text = extract_text_from_image(file_bytes)
        return jsonify({'status': 'success', 'text': extracted_text})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/process-audio', methods=['POST'])
def process_audio():
    try:
        # Get the audio file from the request
        audio_file = request.files.get('audio')
        if not audio_file:
            return jsonify({'error': 'No audio file provided'}), 400

        # Save the audio file
        filename = secure_filename(audio_file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        audio_file.save(filepath)

        # Here you would implement speech-to-text conversion
        # For now, we'll just return a placeholder response
        response = {
            'status': 'success',
            'text': 'Audio received. Speech-to-text conversion will be implemented here.'
        }

        # Clean up
        os.remove(filepath)

        return jsonify(response)

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route("/ask", methods=["POST"])
def ask():
    question = request.json.get("question", "")
    profile = request.json.get("profile", {})

    # Compose a system prompt with user profile for context
    system_prompt = (
        f"Student Name: {profile.get('name', 'Unknown')}\n"
        f"Sex: {profile.get('sex', 'Unknown')}\n"
        f"Age: {profile.get('age', 'Unknown')}\n"
        f"Study Field: {profile.get('field', 'Unknown')}\n"
        f"Subject: {profile.get('subject', 'Unknown')}\n"
        f"Study Medium: {profile.get('medium', 'Unknown')}\n"
        f"Preferred Answer Length: {profile.get('answerLength', 'short')}\n"
        "Answer the user's question in a helpful, clear, and student-friendly way."
    )

    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ],
        "temperature": 0.7
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(GROQ_API_URL, json=payload, headers=headers)
    data = response.json()

    return jsonify({
        "reply": data["choices"][0]["message"]["content"]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000) 