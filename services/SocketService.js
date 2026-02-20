import io from 'socket.io-client';
import { API_URL } from '../config/urlConfig';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(userId) {
    if (this.socket) {
      this.disconnect();
    }

    const socketUrl = API_URL.replace('/api', '');
    this.socket = io(socketUrl);

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.socket.emit('join', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
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

  onReceiveMessage(callback) {
    if (this.socket) {
      this.socket.on('receiveMessage', callback);
    }
  }

  offReceiveMessage() {
    if (this.socket) {
      this.socket.off('receiveMessage');
    }
  }
}

export default new SocketService();