from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import easyocr
import base64
import io
from PIL import Image

app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize EasyOCR reader
reader = easyocr.Reader(['en', 'hi'])

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

@app.route('/api/process-image', methods=['POST'])
def process_image():
    try:
        # Get the image data from the request
        image_data = request.json.get('image')
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400

        # Remove the data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        # Convert base64 to image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))

        # Save the image temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_image.jpg')
        image.save(temp_path)

        # Process the image with EasyOCR
        results = reader.readtext(temp_path)

        # Extract text from results
        extracted_text = ' '.join([text for _, text, _ in results])

        # Clean up
        os.remove(temp_path)

        return jsonify({
            'status': 'success',
            'text': extracted_text
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

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

if __name__ == '__main__':
    app.run(debug=True, port=5000) 