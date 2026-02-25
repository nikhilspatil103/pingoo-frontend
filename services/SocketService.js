import io from 'socket.io-client';
import { API_URL } from '../config/urlConfig';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageListeners = [];
    this.typingListeners = [];
    this.stopTypingListeners = [];
  }

  connect(userId) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const socketUrl = API_URL.replace('/api', '');
    this.socket = io(socketUrl);

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.socket.emit('join', userId);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });
    
    this.socket.on('receiveMessage', (data) => {
      this.messageListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in message listener:', error);
        }
      });
    });
    
    this.socket.on('userTyping', (data) => {
      this.typingListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in typing listener:', error);
        }
      });
    });
    
    this.socket.on('userStopTyping', (data) => {
      this.stopTypingListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in stop typing listener:', error);
        }
      });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.messageListeners = [];
    }
  }

  sendMessage(receiverId, message, senderId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('sendMessage', {
        receiverId,
        message,
        senderId
      });
    }
  }

  emitTyping(receiverId, userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { receiverId, userId });
    }
  }

  emitStopTyping(receiverId, userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('stopTyping', { receiverId, userId });
    }
  }

  onReceiveMessage(callback) {
    if (!this.messageListeners.includes(callback)) {
      this.messageListeners.push(callback);
    }
  }

  offReceiveMessage(callback) {
    if (callback) {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    } else {
      this.messageListeners = [];
    }
  }

  onTyping(callback) {
    if (!this.typingListeners.includes(callback)) {
      this.typingListeners.push(callback);
    }
  }

  offTyping(callback) {
    if (callback) {
      this.typingListeners = this.typingListeners.filter(cb => cb !== callback);
    } else {
      this.typingListeners = [];
    }
  }

  onStopTyping(callback) {
    if (!this.stopTypingListeners.includes(callback)) {
      this.stopTypingListeners.push(callback);
    }
  }

  offStopTyping(callback) {
    if (callback) {
      this.stopTypingListeners = this.stopTypingListeners.filter(cb => cb !== callback);
    } else {
      this.stopTypingListeners = [];
    }
  }
}

export default new SocketService();