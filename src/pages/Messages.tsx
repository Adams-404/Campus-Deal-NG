import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: string;
  isOwn: boolean;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
}

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Effect to hide/show bottom nav based on chat selection
  useEffect(() => {
    const bottomNav = document.querySelector('[data-bottom-nav]');
    if (bottomNav) {
      bottomNav.classList.toggle('hidden', !!selectedChat);
    }
    // Add overflow hidden to body when chat is selected on mobile
    if (isMobileView) {
      document.body.style.overflow = selectedChat ? 'hidden' : '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedChat, isMobileView]);

  // Handle window resize with proper cleanup
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sample data
  const chats: Chat[] = [
    {
      id: '1',
      name: 'Alice Smith',
      lastMessage: 'See you tomorrow!',
      timestamp: '2:33 PM',
      unread: 0,
      avatar: '/avatars/alice.jpg',
    },
    {
      id: '2',
      name: 'Bob Johnson',
      lastMessage: 'Thanks for the quick response!',
      timestamp: '1h ago',
      unread: 1,
      avatar: '/avatars/bob.jpg',
    },
  ];

  const messages: Message[] = [
    {
      id: '1',
      content: 'Hey, how are you?',
      timestamp: '2:30 PM',
      sender: 'Alice Smith',
      isOwn: false,
    },
    {
      id: '2',
      content: "I'm good, thanks! How about you?",
      timestamp: '2:31 PM',
      sender: 'You',
      isOwn: true,
    },
    {
      id: '3',
      content: 'See you tomorrow!',
      timestamp: '2:33 PM',
      sender: 'Alice Smith',
      isOwn: false,
    },
  ];

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Chat list - hidden on mobile when chat is selected */}
      <div
        className={cn(
          'w-full md:w-1/3 bg-background border-r border-border/60 flex flex-col h-full',
          selectedChat && isMobileView ? 'hidden' : 'block'
        )}
      >
        <div className="p-4 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                'p-4 border-b border-border/40 cursor-pointer hover:bg-muted/50 transition-colors',
                selectedChat === chat.id && 'bg-muted'
              )}
              onClick={() => setSelectedChat(chat.id)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h3 className="font-semibold text-foreground truncate">{chat.name}</h3>
                    <span className="text-sm text-muted-foreground flex-shrink-0">{chat.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="w-5 h-5 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white">{chat.unread}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat window - shown when chat is selected */}
      {selectedChat && (
        <div
          className={cn(
            'w-full md:w-2/3 flex flex-col bg-background h-full relative',
            !selectedChat && isMobileView ? 'hidden' : 'flex'
          )}
        >
          {/* Fixed Header */}
          <div className="fixed md:fixed top-0 md:top-0 w-full md:w-2/3 z-20 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {isMobileView && (
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors -ml-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                )}
                <div className="w-10 h-10 rounded-full bg-muted" />
                <h2 className="font-semibold text-foreground truncate">
                  {chats.find((chat) => chat.id === selectedChat)?.name}
                </h2>
              </div>
              <div className="flex space-x-4">
                <button className="text-blue-500 hover:text-blue-600 transition-colors rounded-full p-2 border-2 border-blue-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </button>
                <button className="text-[#25D366] hover:text-[#128C7E] transition-colors rounded-full p-2 border-2 border-[#25D366]">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Chat Content */}
          <div className="flex-1 overflow-y-auto pt-[72px] pb-[80px]">
            <div className="p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm',
                      message.isOwn
                        ? 'bg-background border-2 border-[#25D366] text-foreground'
                        : 'bg-background border-2 border-blue-500 text-foreground'
                    )}
                  >
                    <p className="break-words">{message.content}</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed Input Area */}
          <div className="fixed md:fixed bottom-0 md:bottom-0 w-full md:w-2/3 z-20 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="p-4">
              <div className="flex space-x-4 items-center max-w-screen-md mx-auto">
                <button className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 rounded-full bg-black/10 border-border border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] text-foreground placeholder:text-muted-foreground min-w-0"
                />
                <button className="bg-[#25D366] text-white rounded-full p-2 hover:bg-[#128C7E] transition-colors flex-shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
