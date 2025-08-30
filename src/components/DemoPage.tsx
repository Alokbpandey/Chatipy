import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, Terminal, Bot, Globe, MessageSquare, Smartphone } from 'lucide-react';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'normal' | 'system' | 'success' | 'download';
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
  const [selectedBotType, setSelectedBotType] = useState('navigation');
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
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      text: `URL: ${input}\nBot Type: ${botTypes.find(b => b.id === selectedBotType)?.label}\nRequest: Generate a ${selectedBotType} chatbot for this website`,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate processing stages
    const stages = [
      'Fetching website content...',
      'Analyzing page structure...',
      'Extracting key information...',
      'Training AI model...',
      'Generating chatbot responses...',
      'Preparing deployment package...'
    ];

    for (let i = 0; i < stages.length; i++) {
      setTimeout(() => {
        const progressMessage: Message = {
          text: `[${Array(i + 1).fill('█').join('')}${Array(6 - i - 1).fill('░').join('')}] ${Math.round((i + 1) / 6 * 100)}% - ${stages[i]}`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => [...prev, progressMessage]);
      }, i * 800);
    }

    // Final success message
    setTimeout(() => {
      const successMessage: Message = {
        text: `✅ CHATBOT GENERATION COMPLETE!\n\n╔═══ BOT DETAILS ═══╗\n║ Type: ${botTypes.find(b => b.id === selectedBotType)?.label}\n║ Source: ${input}\n║ Training Data: 247 pages\n║ Response Accuracy: 94.7%\n║ Deployment Ready: YES\n╚═══════════════════╝\n\n🤖 Your chatbot is ready for deployment!\n\nChoose your integration method below:`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'success'
      };
      setMessages(prev => [...prev, successMessage]);
      
      // Add download options
      setTimeout(() => {
        const downloadMessage: Message = {
          text: 'DOWNLOAD_OPTIONS_AVAILABLE',
          sender: 'bot',
          timestamp: new Date(),
          type: 'download'
        };
        setMessages(prev => [...prev, downloadMessage]);
        setIsLoading(false);
      }, 1000);
    }, 5000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const downloadOptions = [
    { type: 'npm', label: 'NPM Package', description: 'Install via npm for Node.js projects' },
    { type: 'api', label: 'REST API', description: 'HTTP endpoints for any platform' },
    { type: 'embed', label: 'Web Widget', description: 'HTML embed code for websites' },
    { type: 'whatsapp', label: 'WhatsApp Deploy', description: 'Direct WhatsApp Business integration' },
  ];

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
            [READY_TO_GENERATE]
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
                className={`
                  px-4 py-2 border-2 font-bold text-sm tracking-wide transition-all duration-200
                  flex items-center space-x-2 minecraft-button
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

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-900">
        <div className="max-w-6xl mx-auto p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  className={`
                    p-4 border-2 font-mono text-sm leading-relaxed
                    ${message.sender === 'user' 
                      ? 'bg-gray-800 border-gray-600 text-cyan-400' 
                      : message.type === 'system'
                      ? 'bg-gray-800 border-yellow-400 text-yellow-400'
                      : message.type === 'success'
                      ? 'bg-gray-800 border-green-400 text-green-400'
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

                {/* Download Options */}
                {message.type === 'download' && (
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    {downloadOptions.map((option, idx) => (
                      <button
                        key={idx}
                        className="
                          p-4 bg-gray-800 border-2 border-lime-400 text-left
                          hover:bg-gray-700 transition-all duration-200 minecraft-button
                          hover:shadow-lg hover:shadow-lime-400/20
                        "
                      >
                        <div className="flex items-center space-x-3">
                          <Download className="w-5 h-5 text-lime-400" />
                          <div>
                            <div className="font-bold text-lime-400 tracking-wide">
                              {option.label}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="p-4 bg-gray-800 border-2 border-yellow-400 text-yellow-400 font-mono text-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-bold tracking-wider">{"> CHATIFY_AI:"}</span>
                  <span className="text-gray-500 text-xs">[PROCESSING]</span>
                </div>
                <div className="text-gray-300">
                  <div className="animate-pulse">
                    ▓▓▓▓▓▓▓▓▓▓ GENERATING CHATBOT...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gray-800 border-t-4 border-lime-400 p-4">
        <div className="max-w-6xl mx-auto">
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
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="
                  px-6 py-3 bg-lime-400 text-gray-900 border-2 border-lime-300 
                  font-bold tracking-wide transition-all duration-200
                  hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center space-x-2 minecraft-button
                "
              >
                <Bot className="w-4 h-4" />
                <span>GENERATE</span>
              </button>
            </div>
          </div>
          
          <div className="text-gray-500 text-xs font-mono text-center">
            ╔════════════════════════════════════════════════════════════════════╗
            ║ ENTER WEBSITE URL + SELECT BOT TYPE + PRESS GENERATE TO CREATE BOT ║
            ╚════════════════════════════════════════════════════════════════════╝
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;