# Teaching AI Chatbot

A modern AI-powered teaching assistant chatbot that supports multiple input methods and languages.

## Features

- 💬 Text-based chat interface
- 📷 Image upload and camera capture
- 🎤 Voice input with speech-to-text
- 🌐 Multi-language support (English and Hindi)
- 📱 Responsive design for all devices
- 🎨 Modern and intuitive UI

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript
- Backend: Python (Flask)
- OCR: EasyOCR
- Speech Recognition: Web Speech API

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/teaching-ai-chatbot.git
cd teaching-ai-chatbot
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to:
```
http://localhost:5000
```

## Project Structure

```
teaching-ai-chatbot/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── static/            # Static files
│   ├── style.css      # Styles
│   └── script.js      # Frontend logic
├── templates/         # HTML templates
│   └── index.html     # Main page
└── uploads/          # Uploaded files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.