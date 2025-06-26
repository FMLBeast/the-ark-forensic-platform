import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle,
  Send,
  Users,
  Bot,
  FileText,
  Eye,
  AlertCircle,
  Minimize2
} from 'lucide-react';
import { chatService, type ChatMessage, type ChatUser, type ChatRoom } from '@services/chatService';
import { cn } from '@utils/cn';

interface LiveChatProps {
  className?: string;
  defaultRoom?: string;
  minimizable?: boolean;
}

export const LiveChat: React.FC<LiveChatProps> = ({
  className,
  defaultRoom = 'general',
  minimizable = true
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string>(defaultRoom);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChatData();
    
    // Set up real-time message listening
    const unsubscribeMessages = chatService.onMessage((message: ChatMessage) => {
      // For now, add all messages to current room (can be enhanced with room filtering)
      setMessages(prev => [...prev, message]);
    });

    const unsubscribeUsers = chatService.onUserStatusChange((updatedUsers: ChatUser[]) => {
      setUsers(updatedUsers);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeUsers();
    };
  }, [currentRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatData = async () => {
    try {
      const [roomsData, messagesData, usersData] = await Promise.all([
        chatService.getRooms(),
        chatService.getMessages(currentRoom),
        chatService.getRoomUsers(currentRoom)
      ]);
      
      setRooms(roomsData);
      setMessages(messagesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load chat data:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      await chatService.sendMessage(currentRoom, newMessage.trim());
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleRoomChange = (roomId: string) => {
    setCurrentRoom(roomId);
    loadChatData();
  };

  const getMessageIcon = (type: ChatMessage['message_type']) => {
    switch (type) {
      case 'file_annotation': return FileText;
      case 'agent_insight': return Bot;
      case 'system': return AlertCircle;
      default: return MessageCircle;
    }
  };

  const getMessageColor = (type: ChatMessage['message_type']) => {
    switch (type) {
      case 'file_annotation': return 'border-l-blue-500 bg-blue-500/5';
      case 'agent_insight': return 'border-l-purple-500 bg-purple-500/5';
      case 'system': return 'border-l-yellow-500 bg-yellow-500/5';
      default: return 'border-l-matrix-500 bg-matrix-500/5';
    }
  };

  const getUserStatusColor = (status: ChatUser['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-matrix-500';
    }
  };

  const currentRoomData = rooms.find(r => r.room_id === currentRoom);
  const onlineUsers = users.filter(u => u.status === 'online').length;

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn(
          'fixed bottom-4 right-4 z-50',
          className
        )}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 bg-bg-panel border border-matrix-500 rounded-lg text-matrix-500 hover:bg-matrix-500/10 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="font-mono text-sm">Chat</span>
          {messages.length > 0 && (
            <div className="w-2 h-2 bg-matrix-500 rounded-full animate-pulse" />
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col h-96 bg-bg-panel border border-matrix-800 rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-matrix-800">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-matrix-500" />
          <div>
            <h3 className="font-mono font-semibold text-matrix-500 text-sm">
              {currentRoomData?.name || 'Chat'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-matrix-600">
              <Users className="w-3 h-3" />
              <span>{onlineUsers} online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Room Selector */}
          <select
            value={currentRoom}
            onChange={(e) => handleRoomChange(e.target.value)}
            className="text-xs bg-bg-secondary border border-matrix-800 rounded px-2 py-1 text-matrix-500 font-mono"
          >
            {rooms.map(room => (
              <option key={room.room_id} value={room.room_id}>
                {room.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowUserList(!showUserList)}
            className="p-1 text-matrix-600 hover:text-matrix-500 transition-colors"
            title="Toggle user list"
          >
            <Users className="w-4 h-4" />
          </button>

          {minimizable && (
            <>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 text-matrix-600 hover:text-matrix-500 transition-colors"
                title="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <AnimatePresence>
              {messages.map((message, index) => {
                const MessageIcon = getMessageIcon(message.message_type);
                const user = users.find(u => u.user_id === message.user_id);
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'flex gap-3 p-3 rounded-lg border-l-2',
                      getMessageColor(message.message_type)
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                      style={{ 
                        backgroundColor: user?.avatar_color || '#00ff41',
                        color: '#000' 
                      }}
                    >
                      {message.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold text-sm text-matrix-500">
                          {message.username}
                        </span>
                        <MessageIcon className="w-3 h-3 text-matrix-600" />
                        <span className="text-xs text-matrix-600">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-matrix-600">
                        {message.message}
                      </p>

                      {/* Metadata for special message types */}
                      {message.metadata && (
                        <div className="mt-2 text-xs text-matrix-700">
                          {message.metadata.file_path && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>{message.metadata.file_path}</span>
                            </div>
                          )}
                          {message.metadata.coordinates && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>
                                Position: {message.metadata.coordinates.x}, {message.metadata.coordinates.y}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-matrix-800">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-bg-secondary border border-matrix-800 rounded-lg text-matrix-500 placeholder-matrix-700 font-mono text-sm focus:outline-none focus:border-matrix-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-3 py-2 bg-matrix-500/20 border border-matrix-500 rounded-lg text-matrix-500 hover:bg-matrix-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* User List Sidebar */}
        <AnimatePresence>
          {showUserList && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-matrix-800 bg-bg-secondary/50"
            >
              <div className="p-3">
                <h4 className="font-mono font-semibold text-sm text-matrix-500 mb-3">
                  Users ({users.length})
                </h4>
                <div className="space-y-2">
                  {users.map(user => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-matrix-500/10 transition-colors"
                    >
                      <div className="relative">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                          style={{ 
                            backgroundColor: user.avatar_color,
                            color: '#000' 
                          }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-bg-secondary',
                          getUserStatusColor(user.status)
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-matrix-500 truncate">
                          {user.username}
                        </div>
                        <div className="text-xs text-matrix-700 capitalize">
                          {user.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};