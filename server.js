const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Store connected users
const users = {};
const waitingQueue = { male: [], female: [], other: [] };
const activeChats = {};

// User class to store user data
class User {
    constructor(id, name, age, gender) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.partnerId = null;
        this.isSearching = false;
        this.createdAt = new Date();
    }
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins with profile info
    socket.on('user-join', (data) => {
        const user = new User(socket.id, data.name, data.age, data.gender);
        users[socket.id] = user;
        console.log(`User registered: ${user.name} - ${user.gender}`);
        socket.emit('user-joined', { userId: socket.id, onlineCount: Object.keys(users).length });
    });

    // Start finding a stranger
    socket.on('start-search', (data) => {
        const user = users[socket.id];
        if (!user) return;

        user.isSearching = true;
        const genderKey = data.genderFilter === 'all' ? null : data.genderFilter;

        // Find a partner
        const partner = findPartner(socket.id, genderKey);

        if (partner) {
            // Found a match
            matchUsers(socket.id, partner.id);
            io.to(socket.id).emit('partner-found', {
                partnerId: partner.id,
                partnerName: partner.name,
                partnerAge: partner.age,
                partnerGender: partner.gender
            });
            io.to(partner.id).emit('partner-found', {
                partnerId: user.id,
                partnerName: user.name,
                partnerAge: user.age,
                partnerGender: user.gender
            });
        } else {
            // Add to queue
            const queue = genderKey ? waitingQueue[genderKey] : getAllQueues();
            if (!queue.includes(socket.id)) {
                if (genderKey) {
                    waitingQueue[genderKey].push(socket.id);
                } else {
                    Object.values(waitingQueue).forEach(q => q.push(socket.id));
                }
            }
            socket.emit('searching', { message: 'Finding stranger...' });
        }

        // Send online count to all
        io.emit('online-count', { count: Object.keys(users).length });
    });

    // Send message
    socket.on('send-message', (data) => {
        const user = users[socket.id];
        if (user && user.partnerId) {
            io.to(user.partnerId).emit('receive-message', {
                sender: user.name,
                message: data.message,
                timestamp: new Date()
            });
        }
    });

    // Next stranger
    socket.on('next-stranger', () => {
        disconnectChat(socket.id);
        socket.emit('searching', { message: 'Finding next stranger...' });
        
        // Trigger new search
        socket.emit('start-search-trigger');
    });

    // End chat
    socket.on('end-chat', () => {
        disconnectChat(socket.id);
        socket.emit('chat-ended', { message: 'Chat ended' });
    });

    // Report user
    socket.on('report-user', (data) => {
        const user = users[socket.id];
        console.log(`Report submitted: ${user?.name} reported ${user?.partnerId} for ${data.reason}`);
        io.emit('report-received', { 
            reportedId: user?.partnerId,
            reason: data.reason,
            timestamp: new Date()
        });
        disconnectChat(socket.id);
    });

    // WebRTC Signaling
    socket.on('webrtc-offer', (data) => {
        const user = users[socket.id];
        if (user && user.partnerId) {
            io.to(user.partnerId).emit('webrtc-offer', {
                from: socket.id,
                offer: data.offer
            });
        }
    });

    socket.on('webrtc-answer', (data) => {
        const user = users[socket.id];
        if (user && user.partnerId) {
            io.to(user.partnerId).emit('webrtc-answer', {
                from: socket.id,
                answer: data.answer
            });
        }
    });

    socket.on('webrtc-ice', (data) => {
        const user = users[socket.id];
        if (user && user.partnerId) {
            io.to(user.partnerId).emit('webrtc-ice', {
                from: socket.id,
                ice: data.ice
            });
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            if (user.partnerId) {
                io.to(user.partnerId).emit('partner-disconnected', { message: 'Stranger disconnected' });
                if (users[user.partnerId]) {
                    users[user.partnerId].partnerId = null;
                }
            }
            removeFromQueues(socket.id);
            delete users[socket.id];
            console.log(`User disconnected: ${socket.id}`);
        }
        io.emit('online-count', { count: Object.keys(users).length });
    });
});

// Helper functions
function findPartner(userId, genderFilter) {
    const user = users[userId];
    if (!user) return null;

    let candidates = [];
    
    if (genderFilter) {
        candidates = waitingQueue[genderFilter].map(id => users[id]).filter(u => u && !u.partnerId);
    } else {
        const allWaiting = Object.values(waitingQueue).flat();
        candidates = allWaiting.map(id => users[id]).filter(u => u && !u.partnerId && u.id !== userId);
    }

    if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return null;
}

function matchUsers(userId1, userId2) {
    const user1 = users[userId1];
    const user2 = users[userId2];

    if (user1 && user2) {
        user1.partnerId = userId2;
        user2.partnerId = userId1;
        user1.isSearching = false;
        user2.isSearching = false;

        activeChats[userId1] = { user1: userId1, user2: userId2, startTime: new Date() };
        activeChats[userId2] = { user1: userId1, user2: userId2, startTime: new Date() };

        removeFromQueues(userId1);
        removeFromQueues(userId2);
    }
}

function disconnectChat(userId) {
    const user = users[userId];
    if (user && user.partnerId) {
        const partnerId = user.partnerId;
        user.partnerId = null;
        if (users[partnerId]) {
            users[partnerId].partnerId = null;
        }
        delete activeChats[userId];
        delete activeChats[partnerId];
    }
    removeFromQueues(userId);
}

function removeFromQueues(userId) {
    Object.keys(waitingQueue).forEach(key => {
        waitingQueue[key] = waitingQueue[key].filter(id => id !== userId);
    });
}

function getAllQueues() {
    return Object.values(waitingQueue).flat();
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`ZUNO Server running on http://localhost:${PORT}`);
});
