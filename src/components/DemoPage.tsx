import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, Terminal, Bot, Globe, MessageSquare, Smartphone, Copy, ExternalLink, Trash2, RefreshCw } from 'lucide-react';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'normal' | 'system' | 'success' | 'error' | 'progress';
}

interface ChatbotStatus {
  id: string;
  status: 'processing' | 'scraping' | 'generating_qa' | 'storing_data' | 'finalizing' | 'completed' | 'failed';
  progress: number;
  pages_scraped?: number;
  qa_pairs_generated?: number;
  website_name: string;
  bot_type: string;
  stats?: {
    totalQAs: number;
    totalPages: number;
  };
  error_message?: string;
}

const DemoPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: 'CHATIFY BOT GENERATOR v3.0.0 INITIALIZED\n> AI Engine: ONLINE\n> Content Parser: LOADED\n> Deployment Module: READY\n\nProvide a website URL and describe what type of chatbot you want to create...',
      sender: 'bot',
      timestamp: new Date(),
      type: 'system'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBotType, setSelectedBotType] = useState('qa');
  const [currentChatbot, setCurrentChatbot] = useState<ChatbotStatus | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const botTypes = [
    { id: 'navigation', label: 'Navigation Bot', icon: Globe, color: 'bg-blue-600' },
    { id: 'qa', label: 'Q&A Bot', icon: MessageSquare, color: 'bg-green-600' },
    { id: 'whatsapp', label: 'WhatsApp Bot', icon: Smartphone, color: 'bg-emerald-600' },
    { id: 'support', label: 'Support Bot', icon: Bot, color: 'bg-purple-600' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatMessages]);

  const generateChatbot = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      text: `URL: ${input}\nBot Type: ${botTypes.find(b => b.id === selectedBotType)?.label}\nRequest: Generate a ${selectedBotType} chatbot for this website`,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call backend API to start chatbot generation
      const response = await fetch('/api/scraping/generate-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: input,
          botType: selectedBotType,
          botName: `${new URL(input).hostname} Bot`,
          description: `AI chatbot for ${input}`,
          maxPages: 20,
          includeSubdomains: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start chatbot generation');
      }

      const processingMessage: Message = {
        text: `✅ CHATBOT GENERATION STARTED!\n\nChatbot ID: ${data.chatbotId}\nEstimated Time: ${data.estimatedTime}\n\nProcessing your website...`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'success'
      };

      setMessages(prev => [...prev, processingMessage]);

      // Start polling for status updates
      pollChatbotStatus(data.chatbotId);

    } catch (error) {
      const errorMessage: Message = {
        text: `❌ ERROR: ${error.message}\n\nPlease check the URL and try again.`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const pollChatbotStatus = async (chatbotId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/scraping/status/${chatbotId}`);
        const status: ChatbotStatus = await response.json();

        setCurrentChatbot(status);

        // Update progress message
        const progressMessage: Message = {
          text: getProgressMessage(status),
          sender: 'bot',
          timestamp: new Date(),
          type: 'progress'
        };

        setMessages(prev => {
          const filtered = prev.filter(msg => msg.type !== 'progress');
          return [...filtered, progressMessage];
        });

        // Check if completed or failed
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          setIsLoading(false);
          
          const completedMessage: Message = {
            text: `🎉 CHATBOT GENERATION COMPLETE!\n\n╔═══ BOT DETAILS ═══╗\n║ Name: ${status.website_name}\n║ Type: ${status.bot_type}\n║ Pages Processed: ${status.stats?.totalPages || 0}\n║ Q&A Pairs: ${status.stats?.totalQAs || 0}\n║ Status: READY FOR TESTING\n╚═══════════════════╝\n\nYour chatbot is ready! You can now test it below.`,
            sender: 'bot',
            timestamp: new Date(),
            type: 'success'
          };
          
          setMessages(prev => [...prev.filter(msg => msg.type !== 'progress'), completedMessage]);
          
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          setIsLoading(false);
          
          const failedMessage: Message = {
            text: `❌ CHATBOT GENERATION FAILED\n\nError: ${status.error_message}\n\nPlease try again with a different URL.`,
            sender: 'bot',
            timestamp: new Date(),
            type: 'error'
          };
          
          setMessages(prev => [...prev.filter(msg => msg.type !== 'progress'), failedMessage]);
          setCurrentChatbot(null);
        }

      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 2000);

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsLoading(false);
    }, 600000);
  };

  const getProgressMessage = (status: ChatbotStatus): string => {
    const progressBar = '█'.repeat(Math.floor(status.progress / 10)) + '░'.repeat(10 - Math.floor(status.progress / 10));
    
    let statusText = '';
    switch (status.status) {
      case 'scraping':
        statusText = `Crawling website and extracting content... (${status.pages_scraped || 0} pages found)`;
        break;
      case 'generating_qa':
        statusText = 'Analyzing content and generating Q&A pairs with AI...';
        break;
      case 'storing_data':
        statusText = `Storing knowledge base... (${status.qa_pairs_generated || 0} Q&A pairs generated)`;
        break;
      case 'finalizing':
        statusText = 'Finalizing chatbot and preparing for deployment...';
        break;
      default:
        statusText = 'Processing website...';
    }

    return `[${progressBar}] ${status.progress}% - ${statusText}`;
  };

  const testChatbot = async () => {
    if (!chatInput.trim() || !currentChatbot || currentChatbot.status !== 'completed') return;

    const userChatMessage: Message = {
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userChatMessage]);
    setChatInput('');

    try {
      const response = await fetch(`/api/chatbot/${currentChatbot.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatInput,
          sessionId: 'demo-session'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const botChatMessage: Message = {
        text: data.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, botChatMessage]);

    } catch (error) {
      const errorChatMessage: Message = {
        text: `Error: ${error.message}`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'error'
      };
      setChatMessages(prev => [...prev, errorChatMessage]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const deleteChatbot = async () => {
    if (!currentChatbot) return;

    try {
      const response = await fetch(`/api/scraping/chatbot/${currentChatbot.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCurrentChatbot(null);
        setChatMessages([]);
        const deleteMessage: Message = {
          text: '🗑️ Chatbot deleted successfully.',
          sender: 'bot',
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => [...prev, deleteMessage]);
      }
    } catch (error) {
      console.error('Error deleting chatbot:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateChatbot();
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      testChatbot();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Terminal Header */}
      <div className="bg-gray-800 border-b-4 border-lime-400 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-lime-400 rounded-full"></div>
            </div>
            <div className="flex items-center space-x-3">
              <Terminal className="w-5 h-5 text-lime-400" />
              <span className="text-lime-400 font-bold tracking-wider">
                CHATBOT GENERATOR TERMINAL
              </span>
            </div>
          </div>
          <div className="text-gray-400 text-sm font-mono">
            {currentChatbot ? `[BOT_READY: ${currentChatbot.id.slice(0, 8)}]` : '[READY_TO_GENERATE]'}
          </div>
        </div>
      </div>

      {/* Bot Type Selection */}
      <div className="bg-gray-800 border-b-2 border-gray-700 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-cyan-400 font-bold font-mono">SELECT BOT TYPE:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {botTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedBotType(type.id)}
                disabled={isLoading}
                className={`
                  px-4 py-2 border-2 font-bold text-sm tracking-wide transition-all duration-200
                  flex items-center space-x-2 minecraft-button disabled:opacity-50
                  ${selectedBotType === type.id
                    ? `${type.color} text-white border-gray-300`
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500'
                  }
                `}
              >
                <type.icon className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-900">
            <div className="max-w-4xl mx-auto p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 border-2 font-mono text-sm leading-relaxed
                      ${message.sender === 'user' 
                        ? 'bg-gray-800 border-gray-600 text-cyan-400' 
                        : message.type === 'system'
                        ? 'bg-gray-800 border-yellow-400 text-yellow-400'
                        : message.type === 'success'
                        ? 'bg-gray-800 border-green-400 text-green-400'
                        : message.type === 'error'
                        ? 'bg-gray-800 border-red-400 text-red-400'
                        : message.type === 'progress'
                        ? 'bg-gray-800 border-blue-400 text-blue-400'
                        : 'bg-gray-800 border-lime-400 text-lime-400'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-bold tracking-wider">
                        {message.sender === 'user' ? '{"> USER@TERMINAL:"}' : '{"> CHATIFY_AI:"}'}
                      </span>
                      <span className="text-gray-500 text-xs">
                        [{message.timestamp.toLocaleTimeString()}]
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-gray-300">
                      {message.text}
                    </pre>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-gray-800 border-t-4 border-lime-400 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center space-x-4 mb-3">
                <div className="text-lime-400 font-mono font-bold">
                  {"C:\\CHATIFY>"}
                </div>
                <div className="flex-1 flex space-x-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="
                      flex-1 p-3 bg-gray-900 text-lime-400 border-2 border-gray-600 
                      font-mono focus:border-lime-400 focus:outline-none
                      placeholder-gray-500 disabled:opacity-50
                    "
                    placeholder="https://example.com - Enter website URL to analyze"
                  />
                  <button
                    onClick={generateChatbot}
                    disabled={isLoading || !input.trim()}
                    className="
                      px-6 py-3 bg-lime-400 text-gray-900 border-2 border-lime-300 
                      font-bold tracking-wide transition-all duration-200
                      hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center space-x-2 minecraft-button
                    "
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                    <span>{isLoading ? 'PROCESSING' : 'GENERATE'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chatbot Testing Panel */}
        {currentChatbot && currentChatbot.status === 'completed' && (
          <div className="w-96 bg-gray-800 border-l-4 border-purple-400 flex flex-col">
            <div className="p-4 border-b-2 border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-purple-400 font-bold tracking-wider">TEST CHATBOT</h3>
                <button
                  onClick={deleteChatbot}
                  className="text-red-400 hover:text-red-300 p-1"
                  title="Delete Chatbot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-gray-400 text-xs font-mono">
                {currentChatbot.website_name} • {currentChatbot.stats?.totalQAs} Q&As
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-gray-500 text-sm font-mono text-center">
                  Ask your chatbot anything about the website...
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border-2 text-sm ${
                      msg.sender === 'user'
                        ? 'bg-gray-700 border-cyan-400 text-cyan-400 ml-4'
                        : 'bg-gray-900 border-purple-400 text-gray-300 mr-4'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t-2 border-gray-700">
              <div className="flex space-x-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  className="
                    flex-1 p-2 bg-gray-900 text-purple-400 border-2 border-gray-600 
                    text-sm focus:border-purple-400 focus:outline-none
                    placeholder-gray-500
                  "
                  placeholder="Ask about the website..."
                />
                <button
                  onClick={testChatbot}
                  disabled={!chatInput.trim()}
                  className="
                    px-3 py-2 bg-purple-400 text-gray-900 border-2 border-purple-300 
                    font-bold text-sm transition-all duration-200
                    hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoPage;