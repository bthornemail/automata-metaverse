---
id: aiportal-chat-integration
title: "AI Portal Chat Integration Guide"
level: practical
type: guide
tags: [aiportal, chat-integration, broadcast, direct-messaging, ui-components]
keywords: [aiportal, chat-integration, broadcast, direct-messaging, participant-list, click-interactions]
prerequisites: [chat-messaging-complete]
enables: []
related: [automaton-user-interactions-rfc2119-spec]
readingTime: 20
difficulty: 3
blackboard:
  status: active
  assignedAgent: "Multiplayer-Agent"
  lastUpdate: 2025-01-07
  dependencies: [chat-service, unified-websocket]
  watchers: []
---

# AI Portal Chat Integration Guide

## Overview

This guide explains how chat broadcast and direct messaging are integrated into the AI Portal interface, including UI components, click interactions, and participant management.

## Component Architecture

### Chat Service Integration

The AI Portal integrates with the `chat-service` for all messaging operations:

```typescript
import { chatService, ChatMessage, ChatParticipant } from '@/services/chat-service';
```

### State Management

**Chat State**:
```typescript
const [chatMode, setChatMode] = useState<'broadcast' | 'direct'>('broadcast');
const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
const [chatParticipants, setChatParticipants] = useState<ChatParticipant[]>([]);
const [broadcastMessages, setBroadcastMessages] = useState<ChatServiceMessage[]>([]);
const [directMessages, setDirectMessages] = useState<Map<string, ChatServiceMessage[]>>(new Map());
const [showChatPanel, setShowChatPanel] = useState(true);
```

## UI Components

### 1. Chat Mode Toggle

**Location**: Above participant list

**Implementation**:
```tsx
<div className="mb-4 flex gap-2">
  <button onClick={() => { setChatMode('broadcast'); setSelectedParticipant(null); }}>
    <MessageSquare /> Broadcast
  </button>
  <button onClick={() => setChatMode('direct')}>
    <User /> Direct
  </button>
</div>
```

**Behavior**:
- Switches between broadcast and direct modes
- Clears selected participant when switching to broadcast
- Visual indication of active mode (purple background)

### 2. Participant List

**Location**: Shown when in Direct mode

**Implementation**:
```tsx
{chatMode === 'direct' && (
  <div className="mb-4 p-3 bg-gray-900 rounded-lg">
    <div>Participants ({chatParticipants.length})</div>
    <div className="space-y-1">
      {chatParticipants.map((participant) => (
        <button onClick={() => handleParticipantClick(participant.id)}>
          {/* Participant info */}
        </button>
      ))}
    </div>
  </div>
)}
```

**Features**:
- Scrollable list (max-height: 48)
- Click to select participant
- Visual indicators:
  - Bot icon for agents (green when online)
  - User icon for humans (blue when online)
  - Dimension badges for agents
  - Online status dot

**Click Interaction**:
```typescript
const handleParticipantClick = (participantId: string) => {
  setSelectedParticipant(participantId);
  setChatMode('direct');
  
  // Load direct messages for this participant
  const messages = chatService.getDirectMessages(participantId);
  const conversationId = `${chatService.getCurrentUserId()}-${participantId}`;
  setDirectMessages(prev => {
    const newMap = new Map(prev);
    newMap.set(conversationId, messages);
    return newMap;
  });
};
```

### 3. Chat Messages Panel

**Location**: Between participant list and input area

**Implementation**:
```tsx
{showChatPanel && (
  <div className="mb-4 flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto">
    {getCurrentMessages().length === 0 ? (
      <div>No messages yet...</div>
    ) : (
      <div className="space-y-3">
        {getCurrentMessages().map((message) => (
          <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
            {/* Message bubble */}
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

**Features**:
- Displays messages based on current mode
- Broadcast mode: shows all broadcast messages
- Direct mode: shows messages for selected participant
- Message bubbles with sender info
- Timestamps
- Visual distinction between user and agent messages

### 4. Input Area

**Location**: Bottom of chat interface

**Implementation**:
```tsx
<div className="flex gap-2">
  <input
    value={inputMessage}
    onChange={(e) => setInputMessage(e.target.value)}
    onKeyPress={(e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (showChatPanel && chatMode) {
          handleSendChatMessage(inputMessage);
        } else {
          sendMessage(inputMessage);
        }
        setInputMessage('');
      }
    }}
    placeholder={/* Mode-aware placeholder */}
    disabled={isTyping || (chatMode === 'direct' && !selectedParticipant)}
  />
  <button onClick={/* Send handler */}>
    <Send />
  </button>
  <button onClick={() => setShowChatPanel(!showChatPanel)}>
    <MessageSquare />
  </button>
</div>
```

**Features**:
- Mode-aware placeholder text
- Disabled when no participant selected (direct mode)
- Enter key to send
- Toggle button to show/hide chat panel

## Message Handling

### Broadcast Message Flow

```typescript
const handleSendChatMessage = async (content: string) => {
  if (chatMode === 'broadcast') {
    // Send broadcast message
    chatService.sendBroadcast(content);
    
    // Also send via NL Query if enabled
    if (useNLQuery && nlQueryConversationId) {
      const nlResponse = await nlQueryService.ask(content, nlQueryConversationId);
      if (nlResponse.confidence > 0.5) {
        chatService.sendBroadcast(nlResponse.answer, {
          citations: nlResponse.citations,
          confidence: nlResponse.confidence
        });
      }
    }
  }
};
```

### Direct Message Flow

```typescript
if (chatMode === 'direct' && selectedParticipant) {
  const participant = chatParticipants.find(p => p.id === selectedParticipant);
  
  if (participant?.type === 'agent') {
    // Query agent via NL Query
    const nlResponse = await nlQueryService.ask(content, nlQueryConversationId);
    if (nlResponse.confidence > 0.5) {
      chatService.sendAgentMessage(selectedParticipant, nlResponse.answer, {
        citations: nlResponse.citations,
        confidence: nlResponse.confidence
      });
    }
  } else {
    // Send direct message to human
    chatService.sendDirectMessage(selectedParticipant, content);
  }
}
```

## Event Subscriptions

### Participant Updates

```typescript
useEffect(() => {
  // Get initial participants
  setChatParticipants(chatService.getParticipants());
  
  // Subscribe to participant changes
  const unsubscribeParticipants = chatService.onParticipantsChange((participants) => {
    setChatParticipants(participants);
  });
  
  return () => {
    unsubscribeParticipants();
  };
}, []);
```

### Message Updates

```typescript
useEffect(() => {
  // Subscribe to broadcast messages
  const unsubscribeBroadcast = chatService.onMessage('broadcast', null, (message) => {
    setBroadcastMessages(prev => [...prev, message]);
  });
  
  // Subscribe to direct messages
  const unsubscribeDirect = chatService.onMessage('direct', null, (message) => {
    // Update direct messages map
  });
  
  return () => {
    unsubscribeBroadcast();
    unsubscribeDirect();
  };
}, []);
```

## Message Display

### Current Messages Getter

```typescript
const getCurrentMessages = (): ChatServiceMessage[] => {
  if (chatMode === 'broadcast') {
    return broadcastMessages;
  } else if (chatMode === 'direct' && selectedParticipant) {
    const conversationId = `${chatService.getCurrentUserId()}-${selectedParticipant}`;
    return directMessages.get(conversationId) || [];
  }
  return [];
};
```

### Message Rendering

```tsx
{getCurrentMessages().map((message) => {
  const sender = chatParticipants.find(p => p.id === message.from);
  const isFromMe = message.from === chatService.getCurrentUserId();
  
  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      {!isFromMe && (
        <div className={`w-6 h-6 rounded-full ${
          sender?.type === 'agent' ? 'bg-[#6366f1]' : 'bg-blue-600'
        }`}>
          {sender?.type === 'agent' ? <Bot /> : <User />}
        </div>
      )}
      
      <div className={`max-w-[75%] rounded-lg p-2 ${
        isFromMe
          ? 'bg-blue-600 text-white'
          : sender?.type === 'agent'
            ? 'bg-gray-700 text-gray-100'
            : 'bg-gray-800 text-gray-200'
      }`}>
        {!isFromMe && (
          <div className="text-[10px] text-gray-400">
            {sender?.name || 'Unknown'}
          </div>
        )}
        <div>{message.content}</div>
        <div className="text-[10px] text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
      
      {isFromMe && (
        <div className="w-6 h-6 bg-blue-600 rounded-full">
          <User />
        </div>
      )}
    </div>
  );
})}
```

## Integration Points

### Natural Language Query

- Broadcast messages trigger NL Query for agent responses
- Direct messages to agents trigger NL Query
- Agent responses include citations and confidence scores

### WebSocket Connection

- Chat service uses unified WebSocket service
- Real-time message synchronization
- Participant join/leave notifications

### Agent System

- Agent participants initialized from AGENTS.md
- Agent responses via NL Query integration
- Agent avatars distinct from human avatars

## Styling

### Color Scheme

- **Broadcast Mode Active**: `bg-[#6366f1]` (purple)
- **Direct Mode Active**: `bg-[#6366f1]` (purple)
- **Selected Participant**: `bg-[#6366f1]` (purple)
- **User Messages**: `bg-blue-600` (blue)
- **Agent Messages**: `bg-gray-700` (gray)
- **Online Indicator**: `bg-green-400` (green)

### Layout

- **Participant List**: Max height 48 (12rem), scrollable
- **Chat Messages**: Max height 64 (16rem), scrollable
- **Input Area**: Fixed at bottom
- **Mode Toggle**: Full width buttons

## Testing

### Manual Testing

1. **Broadcast Mode**:
   - Click "Broadcast" button
   - Verify button is highlighted
   - Send message
   - Verify message appears in chat panel
   - Open second browser window
   - Verify message appears in both windows

2. **Direct Mode**:
   - Click "Direct" button
   - Verify participant list appears
   - Click on participant
   - Verify participant is highlighted
   - Send message
   - Verify message appears in chat panel
   - Verify conversation ID is correct

3. **Click Interactions**:
   - Click different participants
   - Verify selection changes
   - Verify conversation switches
   - Verify message history loads

4. **Agent Messaging**:
   - Select agent from list
   - Send query message
   - Verify agent response appears
   - Verify citations are included

## Troubleshooting

### Messages Not Appearing

- Check WebSocket connection: `unifiedWebSocket.isConnected()`
- Check chat service initialization
- Check event subscriptions
- Check browser console for errors

### Participant List Empty

- Check chat service initialization
- Check agent initialization
- Check WebSocket connection
- Verify participant join events

### Direct Messages Not Sending

- Verify participant is selected
- Check WebSocket connection
- Check message routing in server
- Verify conversation ID generation

## Related Documentation

- **`CHAT_MESSAGING_COMPLETE.md`**: Complete chat messaging implementation
- **`docs/17-Automaton-User-Interactions/AUTOMATON-USER-INTERACTIONS-RFC2119-SPEC.md`**: User interactions specification
- **`ui/src/services/chat-service.ts`**: Chat service implementation
- **`ui/src/components/AIPortal/AIPortal.tsx`**: AI Portal component

---

**Last Updated**: 2025-01-07  
**Status**: Complete  
**Maintainer**: Multiplayer-Agent
