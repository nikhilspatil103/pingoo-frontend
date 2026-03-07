## Seen/Read Message Implementation - ChatScreen.js

### 1. Add isRead to message state
In loadChatHistory, add isRead field:
```javascript
const formattedMessages = (data.messages || []).map(msg => ({
  ...msg,
  isRead: msg.isRead || false,  // Add this line
  time: msg.timestamp ? formatTime(new Date(msg.timestamp)) : msg.time
}));
```

### 2. Mark messages as seen when chat opens
Add this useEffect after loadChatHistory:
```javascript
useEffect(() => {
  // Mark received messages as seen
  messages.forEach(msg => {
    if (!msg.sent && !msg.isRead) {
      SocketService.markMessageSeen(msg.id, profile.id);
    }
  });
}, [messages]);
```

### 3. Listen for messageSeen event
In the socket listeners useEffect, add:
```javascript
const handleMessageSeen = (data) => {
  setMessages(prev => prev.map(m => 
    m.id === data.messageId ? { ...m, isRead: true } : m
  ));
};

SocketService.onMessageSeen(handleMessageSeen);

// In cleanup:
SocketService.offMessageSeen(handleMessageSeen);
```

### 4. Show checkmarks in message bubble
In AnimatedMessage component, after the message text, add:
```javascript
{msg.sent && (
  <Text style={styles.checkmark}>
    {msg.isRead ? '✓✓' : '✓'}
  </Text>
)}
```

### 5. Add checkmark style
In styles:
```javascript
checkmark: { 
  fontSize: 10, 
  color: msg.isRead ? '#4FC3F7' : theme.textSecondary, 
  marginLeft: 4,
  alignSelf: 'flex-end'
},
```

This gives you:
- Single checkmark (✓) = Sent
- Double blue checkmark (✓✓) = Seen/Read
