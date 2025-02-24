
import { BottomNav } from "@/components/BottomNav";

const mockChats = [
  {
    id: 1,
    name: "Alice Johnson",
    lastMessage: "Is this still available?",
    time: "2m ago",
    unread: true,
  },
  {
    id: 2,
    name: "Bob Smith",
    lastMessage: "Thanks for the quick response!",
    time: "1h ago",
    unread: false,
  },
  // Add more mock chats as needed
];

const Messages = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        <div className="space-y-2">
          {mockChats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-4 bg-secondary p-4 rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-medium text-primary">
                  {chat.name[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{chat.name}</h3>
                  <span className="text-sm text-gray-400">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread && (
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              )}
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Messages;
