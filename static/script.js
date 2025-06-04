document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const imageUploadBtn = document.getElementById('imageUploadBtn');
    const cameraBtn = document.getElementById('cameraBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const languageSelect = document.getElementById('languageSelect');
    const cameraModal = document.getElementById('cameraModal');
    const cameraPreview = document.getElementById('cameraPreview');
    const captureBtn = document.getElementById('captureBtn');
    const closeCameraBtn = document.getElementById('closeCameraBtn');

    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];
    let cameraStream = null;
    let activeInputOption = null;

    // Function to handle input option selection
    function setActiveInputOption(button) {
        if (activeInputOption) {
            activeInputOption.classList.remove('active');
        }
        if (button) {
            button.classList.add('active');
            activeInputOption = button;
        } else {
            activeInputOption = null;
        }
    }

    // Function to add a message to the chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                ${message}
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to handle text input
    function handleTextInput() {
        const text = userInput.value.trim();
        if (text) {
            addMessage(text, true);
            userInput.value = '';
            setActiveInputOption(null);
            // Here you would typically send the text to your backend
            // For now, we'll just echo it back
            setTimeout(() => {
                addMessage('I received your message: ' + text);
            }, 1000);
        }
    }

    // Send button click handler
    sendBtn.addEventListener('click', handleTextInput);

    // Enter key handler
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTextInput();
        }
    });

    // Image upload handler
    imageUploadBtn.addEventListener('click', () => {
        setActiveInputOption(imageUploadBtn);
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    addMessage(`<img src="${event.target.result}" style="max-width: 200px; border-radius: 5px;">`, true);
                    setActiveInputOption(null);
                    // Here you would typically send the image to your backend
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    // Camera handlers
    cameraBtn.addEventListener('click', async () => {
        setActiveInputOption(cameraBtn);
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraPreview.srcObject = cameraStream;
            cameraModal.classList.add('active');
        } catch (err) {
            console.error('Error accessing camera:', err);
            addMessage('Error accessing camera. Please make sure you have granted camera permissions.');
            setActiveInputOption(null);
        }
    });

    closeCameraBtn.addEventListener('click', () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        cameraModal.classList.remove('active');
        setActiveInputOption(null);
    });

    captureBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = cameraPreview.videoWidth;
        canvas.height = cameraPreview.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(cameraPreview, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        addMessage(`<img src="${imageData}" style="max-width: 200px; border-radius: 5px;">`, true);
        setActiveInputOption(null);
        // Here you would typically send the image to your backend
        closeCameraBtn.click();
    });

    // Voice input handler with speech-to-text
    voiceBtn.addEventListener('click', async () => {
        if (!isRecording) {
            setActiveInputOption(voiceBtn);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    // Create a temporary audio element to get the duration
                    const audio = new Audio(audioUrl);
                    audio.onloadedmetadata = async () => {
                        // Show the audio player while processing
                        addMessage(`<audio controls src="${audioUrl}"></audio>`, true);
                        
                        // Convert audio to text using Web Speech API
                        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                        recognition.lang = languageSelect.value === 'en' ? 'en-US' : 'hi-IN';
                        
                        recognition.onresult = (event) => {
                            const text = event.results[0][0].transcript;
                            addMessage(text, true);
                            setActiveInputOption(null);
                            // Here you would typically send the text to your backend
                        };
                        
                        recognition.onerror = (event) => {
                            console.error('Speech recognition error:', event.error);
                            addMessage('Sorry, I could not understand your voice. Please try again.');
                            setActiveInputOption(null);
                        };
                        
                        recognition.start();
                    };
                };

                mediaRecorder.start();
                isRecording = true;
                voiceBtn.style.color = '#e74c3c';
            } catch (err) {
                console.error('Error accessing microphone:', err);
                addMessage('Error accessing microphone. Please make sure you have granted microphone permissions.');
                setActiveInputOption(null);
            }
        } else {
            mediaRecorder.stop();
            isRecording = false;
            voiceBtn.style.color = '#7f8c8d';
            setActiveInputOption(null);
        }
    });

    // Language selection handler
    languageSelect.addEventListener('change', () => {
        const selectedLanguage = languageSelect.value;
        userInput.placeholder = selectedLanguage === 'en' 
            ? 'Type your question here...' 
            : 'अपना प्रश्न यहाँ टाइप करें...';
    });
}); 