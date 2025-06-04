document.addEventListener('DOMContentLoaded', () => {
    // Sidebar menu logic (guaranteed to run first)
    const menuBtn = document.getElementById('menuBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const closeMenuBtn = document.getElementById('closeMenuBtn');

    if (menuBtn && sidebarMenu && closeMenuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebarMenu.classList.add('open');
            console.log('Sidebar menu opened');
        });
        closeMenuBtn.addEventListener('click', () => {
            sidebarMenu.classList.remove('open');
            console.log('Sidebar menu closed (button)');
        });
        sidebarMenu.addEventListener('mousedown', function(e) {
            if (e.target === sidebarMenu) {
                sidebarMenu.classList.remove('open');
                console.log('Sidebar menu closed (overlay)');
            }
        });
    } else {
        console.log('Sidebar menu elements not found:', { menuBtn, sidebarMenu, closeMenuBtn });
    }

    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const plusBtn = document.getElementById('plusBtn');
    const floatingMenu = document.getElementById('floatingMenu');
    const fileOption = document.getElementById('fileOption');
    const cameraOption = document.getElementById('cameraOption');
    const photosOption = document.getElementById('photosOption');
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

    // Floating menu show/hide logic
    plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        floatingMenu.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
        if (floatingMenu.classList.contains('show') && !floatingMenu.contains(e.target) && e.target !== plusBtn) {
            floatingMenu.classList.remove('show');
        }
    });

    // Helper: handle file upload and OCR, then send to AI
    async function handleFileUpload(file) {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        // Show loading message
        const loadingMsg = addMessage('<em>Extracting text from image...</em>', true);
        try {
            const res = await fetch('/api/process-image', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            loadingMsg.remove();
            if (data.status === 'success') {
                addMessage(`<b>Extracted Text:</b><br>${data.text.replace(/\n/g, '<br>')}`, true);
                // Now send to AI for answers
                const userProfile = getUserProfile();
                const aiLoading = addMessage('<em>Thinking...</em>', false);
                const prompt = `pick all questions in order and answer all of them :\n${data.text}`;
                try {
                    const aiRes = await fetch('/ask', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ question: prompt, profile: userProfile })
                    });
                    const aiData = await aiRes.json();
                    aiLoading.remove();
                    addMessage(aiData.reply, false);
                } catch (err) {
                    aiLoading.remove();
                    addMessage('<span style="color:red;">Error getting response from AI.</span>', false);
                }
            } else {
                addMessage(`<span style="color:red;">${data.message}</span>`, true);
            }
        } catch (err) {
            loadingMsg.remove();
            addMessage('<span style="color:red;">Error uploading or processing file.</span>', true);
        }
    }

    // Files option (generic file upload)
    fileOption.addEventListener('click', () => {
        floatingMenu.classList.remove('show');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            handleFileUpload(file);
        };
        input.click();
    });

    // Photos option (image upload only)
    photosOption.addEventListener('click', () => {
        floatingMenu.classList.remove('show');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            handleFileUpload(file);
        };
        input.click();
    });

    // Camera option
    cameraOption.addEventListener('click', async () => {
        floatingMenu.classList.remove('show');
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraPreview.srcObject = cameraStream;
            cameraModal.classList.add('active');
        } catch (err) {
            console.error('Error accessing camera:', err);
            addMessage('Error accessing camera. Please make sure you have granted camera permissions.');
        }
    });

    closeCameraBtn.addEventListener('click', () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        cameraModal.classList.remove('active');
    });

    captureBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = cameraPreview.videoWidth;
        canvas.height = cameraPreview.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(cameraPreview, 0, 0);
        canvas.toBlob(blob => {
            handleFileUpload(new File([blob], 'camera.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg');
        closeCameraBtn.click();
    });

    // Function to handle input option selection (for voice)
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

    // Onboarding modal logic
    const onboardingModal = document.getElementById('onboardingModal');
    const onboardingForm = document.getElementById('onboardingForm');

    // Show modal if no user profile
    if (!getUserProfile()) {
        showOnboardingModal();
    } else {
        hideOnboardingModal();
    }

    onboardingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const profile = {
            name: document.getElementById('studentName').value.trim(),
            sex: document.getElementById('studentSex').value,
            age: document.getElementById('studentAge').value,
            field: document.getElementById('studyField').value.trim(),
            subject: document.getElementById('subject').value.trim(),
            medium: document.getElementById('studyMedium').value,
            answerLength: document.getElementById('answerLength').value
        };
        saveUserProfile(profile);
        hideOnboardingModal();
    });

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
        return messageDiv;
    }

    // Function to handle text input
    async function handleTextInput() {
        const text = userInput.value.trim();
        if (text) {
            addMessage(text, true);
            userInput.value = '';
            setActiveInputOption(null);

            const userProfile = getUserProfile();
            // Show a loading message
            const loadingMsg = addMessage('<em>Thinking...</em>', false);

            try {
                const res = await fetch('/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: text, profile: userProfile })
                });
                const data = await res.json();
                loadingMsg.remove();
                addMessage(data.reply, false);
            } catch (err) {
                loadingMsg.remove();
                addMessage('<span style="color:red;">Error getting response from AI.</span>', false);
            }
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
                voiceBtn.style.color = '#a78bfa';
            } catch (err) {
                console.error('Error accessing microphone:', err);
                addMessage('Error accessing microphone. Please make sure you have granted microphone permissions.');
                setActiveInputOption(null);
            }
        } else {
            mediaRecorder.stop();
            isRecording = false;
            voiceBtn.style.color = '';
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

    // Reset Profile Button
    const resetProfileBtn = document.getElementById('resetProfileBtn');
    resetProfileBtn.addEventListener('click', () => {
        localStorage.clear();
        location.reload();
    });
});

function showOnboardingModal() {
    document.getElementById('onboardingModal').style.display = 'flex';
}
function hideOnboardingModal() {
    document.getElementById('onboardingModal').style.display = 'none';
}
function getUserProfile() {
    const data = localStorage.getItem('userProfile');
    return data ? JSON.parse(data) : null;
}
function saveUserProfile(profile) {
    localStorage.setItem('userProfile', JSON.stringify(profile));
} 