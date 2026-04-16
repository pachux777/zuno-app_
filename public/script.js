// Global Variables
const socket = io();
let selectedGender = 'male';
let selectedGenderFilter = 'all';
let isChattingNow = false;
let localStream;
let currentCamera = null;
let currentMic = null;
let isMuted = false;
let isCameraOff = false;

// Login Handler
function handleLogin() {
    const name = document.getElementById('nameInput').value.trim();
    const age = document.getElementById('ageInput').value;

    if (!name || !age) {
        alert('Please enter your name and age');
        return;
    }

    if (age < 18) {
        alert('You must be 18 or older');
        return;
    }

    // Emit user join event
    socket.emit('user-join', {
        name: name,
        age: age,
        gender: selectedGender
    });

    // Show chat screen
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('chatScreen').classList.add('show');

    // Start local stream
    startLocalStream();

    // Update UI
    updateCameraDevices();
}

// Get Gender Button
document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedGender = this.dataset.gender;
    });
});

// Start Local Stream
async function startLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: true
        });
        document.getElementById('localVideo').srcObject = localStream;
        currentCamera = localStream.getVideoTracks()[0];
        currentMic = localStream.getAudioTracks()[0];
        updateCameraDevices();
    } catch (err) {
        console.error('Error accessing media devices:', err);
        alert('Unable to access camera/microphone. Please check permissions.');
    }
}

// Update Camera Devices
async function updateCameraDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');
        const mics = devices.filter(d => d.kind === 'audioinput');

        const cameraSelect = document.getElementById('cameraSelect');
        const micSelect = document.getElementById('micSelect');

        cameras.forEach(cam => {
            if (!cameraSelect.querySelector(`option[value="${cam.deviceId}"]`)) {
                const option = document.createElement('option');
                option.value = cam.deviceId;
                option.textContent = cam.label || `Camera ${cameraSelect.options.length}`;
                cameraSelect.appendChild(option);
            }
        });

        mics.forEach(mic => {
            if (!micSelect.querySelector(`option[value="${mic.deviceId}"]`)) {
                const option = document.createElement('option');
                option.value = mic.deviceId;
                option.textContent = mic.label || `Mic ${micSelect.options.length}`;
                micSelect.appendChild(option);
            }
        });
    } catch (err) {
        console.error('Error enumerating devices:', err);
    }
}

// Change Camera
async function changeCamera() {
    const deviceId = document.getElementById('cameraSelect').value;
    if (deviceId) {
        try {
            const constraints = {
                video: { deviceId: { exact: deviceId } },
                audio: true
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const videoTrack = newStream.getVideoTracks()[0];
            localStream.getVideoTracks().forEach(track => track.stop());
            localStream.removeTrack(localStream.getVideoTracks()[0]);
            localStream.addTrack(videoTrack);
            currentCamera = videoTrack;
        } catch (err) {
            console.error('Error switching camera:', err);
        }
    }
}

// Change Mic
async function changeMic() {
    const deviceId = document.getElementById('micSelect').value;
    if (deviceId) {
        try {
            const audioConstraints = { deviceId: { exact: deviceId } };
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
            const audioTrack = audioStream.getAudioTracks()[0];
            localStream.getAudioTracks().forEach(track => track.stop());
            localStream.removeTrack(localStream.getAudioTracks()[0]);
            localStream.addTrack(audioTrack);
            currentMic = audioTrack;
        } catch (err) {
            console.error('Error switching mic:', err);
        }
    }
}

// Flip Camera
async function flipCamera() {
    try {
        const videoTrack = localStream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const facingMode = settings.facingMode === 'user' ? 'environment' : 'user';
        
        const constraints = {
            video: { facingMode: { exact: facingMode } },
            audio: true
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        localStream.getVideoTracks().forEach(track => track.stop());
        localStream.removeTrack(videoTrack);
        localStream.addTrack(newVideoTrack);
        currentCamera = newVideoTrack;
    } catch (err) {
        console.error('Error flipping camera:', err);
    }
}

// Toggle Mute
function toggleMute() {
    isMuted = !isMuted;
    if (currentMic) {
        currentMic.enabled = !isMuted;
    }
    document.querySelectorAll('.tool-btn')[0].classList.toggle('active', isMuted);
}

// Toggle Camera
function toggleCamera() {
    isCameraOff = !isCameraOff;
    if (currentCamera) {
        currentCamera.enabled = !isCameraOff;
    }
    document.querySelectorAll('.tool-btn')[1].classList.toggle('active', isCameraOff);
    document.getElementById('strangerPlaceholder').style.display = isCameraOff ? 'flex' : 'none';
}

// Toggle Auto Off
function toggleAutoOff() {
    document.querySelectorAll('.tool-btn')[2].classList.toggle('active');
}

// Set Gender Filter
function setGenderFilter(btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedGenderFilter = btn.dataset.filter;
}

// Start Chat
function startChat() {
    if (!isChattingNow) {
        isChattingNow = true;
        document.getElementById('searchingText').style.display = 'block';
        document.getElementById('statusText').textContent = 'Searching...';
        socket.emit('start-search', { genderFilter: selectedGenderFilter });
    }
}

// Next Stranger
function nextStranger() {
    socket.emit('next-stranger');
    clearChat();
    document.getElementById('searchingText').style.display = 'block';
    document.getElementById('statusText').textContent = 'Finding next...';
}

// End Chat
function endChat() {
    socket.emit('end-chat');
    clearChat();
    document.getElementById('statusText').textContent = 'Idle';
    document.getElementById('messageInput').disabled = true;
    document.getElementById('messageInput').placeholder = 'Connect first...';
}

// Send Message
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (message && isChattingNow) {
        socket.emit('send-message', { message: message });
        addMessageToChat(message, true);
        input.value = '';
    }
}

// Handle Message Keypress
function handleMessageKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Add Message to Chat
function addMessageToChat(message, isOwn = false) {
    const messagesBox = document.getElementById('messagesBox');
    
    if (messagesBox.querySelector('.empty-chat')) {
        messagesBox.innerHTML = '';
    }

    const messageEl = document.createElement('div');
    messageEl.className = isOwn ? 'message own' : 'message';
    messageEl.textContent = message;
    messagesBox.appendChild(messageEl);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

// Clear Chat
function clearChat() {
    document.getElementById('messagesBox').innerHTML = '<div class="empty-chat">Connect to start chatting</div>';
    document.getElementById('messageInput').value = '';
    isChattingNow = false;
}

// Submit Report
function submitReport(reason) {
    socket.emit('report-user', { reason: reason });
    closeModal('report');
    alert(`Reported for: ${reason}`);
    nextStranger();
}

// Modal Functions
function openModal(type) {
    const modalIds = {
        rules: 'rulesModal',
        terms: 'termsModal',
        policy: 'policyModal',
        privacy: 'privacyModal',
        premium: 'premiumModal',
        history: 'historyModal',
        report: 'reportModal'
    };
    document.getElementById(modalIds[type]).classList.add('show');
}

function closeModal(type) {
    const modalIds = {
        rules: 'rulesModal',
        terms: 'termsModal',
        policy: 'policyModal',
        privacy: 'privacyModal',
        premium: 'premiumModal',
        history: 'historyModal',
        report: 'reportModal'
    };
    document.getElementById(modalIds[type]).classList.remove('show');
}

// Close modal on background click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// Socket Events
socket.on('user-joined', (data) => {
    console.log('User joined:', data.userId);
    document.getElementById('onlineUsers').textContent = data.onlineCount;
});

socket.on('online-count', (data) => {
    document.getElementById('onlineUsers').textContent = data.count;
});

socket.on('searching', (data) => {
    document.getElementById('statusText').textContent = 'Searching...';
    document.getElementById('searchingText').style.display = 'block';
});

socket.on('partner-found', (data) => {
    isChattingNow = true;
    document.getElementById('searchingText').style.display = 'none';
    document.getElementById('statusText').textContent = 'Connected';
    document.getElementById('videoTitle').textContent = `${data.partnerName} - ${data.partnerAge}`;
    document.getElementById('strangerPlaceholder').style.display = 'none';
    document.getElementById('messageInput').disabled = false;
    document.getElementById('messageInput').placeholder = 'Connect first...';
    clearChat();
    addMessageToChat(`Connected with ${data.partnerName}!`, true);
});

socket.on('receive-message', (data) => {
    addMessageToChat(`${data.sender}: ${data.message}`);
});

socket.on('partner-disconnected', (data) => {
    addMessageToChat('Stranger disconnected');
    document.getElementById('statusText').textContent = 'Idle';
    isChattingNow = false;
    document.getElementById('messageInput').disabled = true;
    document.getElementById('videoTitle').textContent = 'Stranger';
});

socket.on('chat-ended', (data) => {
    clearChat();
    document.getElementById('statusText').textContent = 'Idle';
    document.getElementById('videoTitle').textContent = 'Stranger';
    document.getElementById('messageInput').disabled = true;
});

socket.on('start-search-trigger', () => {
    startChat();
});

// Initialize
window.addEventListener('load', () => {
    updateCameraDevices();
});
