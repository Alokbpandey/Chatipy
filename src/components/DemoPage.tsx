import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, Terminal, Bot, Globe, MessageSquare, Smartphone, ExternalLink, Copy, Check } from 'lucide-react';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'normal' | 'system' | 'success' | 'download' | 'error';
  chatbotId?: string;
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
  const [generatedChatbotId, setGeneratedChatbotId] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
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

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    if (!validateUrl(input)) {
      const errorMessage: Message = {
        text: '❌ ERROR: Invalid URL format. Please provide a valid HTTP or HTTPS URL.',
        sender: 'bot',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      text: `URL: ${input}\nBot Type: ${botTypes.find(b => b.id === selectedBotType)?.label}\nRequest: Generate a ${selectedBotType} chatbot for this website`,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const websiteUrl = input;
    setInput('');
    setIsLoading(true);

    try {
      // Start chatbot generation
      const response = await fetch('/api/scraping/generate-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl,
          botType: selectedBotType,
          botName: `${new URL(websiteUrl).hostname} Bot`,
          description: `AI assistant for ${new URL(websiteUrl).hostname}`,
          maxPages: 20
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start chatbot generation');
      }

      const startMessage: Message = {
        text: `✅ CHATBOT GENERATION STARTED!\n\nBot ID: ${result.chatbotId}\nEstimated Time: ${result.estimatedTime}\n\nMonitoring progress...`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'success'
      };
      setMessages(prev => [...prev, startMessage]);

      // Poll for status updates
      const chatbotId = result.chatbotId;
      setGeneratedChatbotId(chatbotId);
      pollStatus(chatbotId);

    } catch (error) {
      console.error('Error generating chatbot:', error);
      const errorMessage: Message = {
        text: `❌ GENERATION FAILED: ${error.message}`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const pollStatus = async (chatbotId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/scraping/status/${chatbotId}`);
        const status = await response.json();

        if (!response.ok) {
          throw new Error(status.error || 'Failed to get status');
        }

        const progressMessage: Message = {
          text: `[${Array(Math.floor(status.progress / 10)).fill('█').join('')}${Array(10 - Math.floor(status.progress / 10)).fill('░').join('')}] ${status.progress}% - ${status.status.toUpperCase().replace('_', ' ')}`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => {
          const newMessages = [...prev];
          // Replace last progress message or add new one
          if (newMessages[newMessages.length - 1]?.type === 'system' && newMessages[newMessages.length - 1]?.text.includes('%')) {
            newMessages[newMessages.length - 1] = progressMessage;
          } else {
            newMessages.push(progressMessage);
          }
          return newMessages;
        });

        if (status.status === 'completed') {
          const successMessage: Message = {
            text: `✅ CHATBOT GENERATION COMPLETE!\n\n╔═══ BOT DETAILS ═══╗\n║ Type: ${botTypes.find(b => b.id === selectedBotType)?.label}\n║ Source: ${status.website_url}\n║ Training Data: ${status.stats.totalPages} pages\n║ Q&A Pairs: ${status.stats.totalQAs}\n║ Status: READY FOR DEPLOYMENT\n╚═══════════════════╝\n\n🤖 Your chatbot is ready! Test it below or download integration code.`,
            sender: 'bot',
            timestamp: new Date(),
            type: 'success',
            chatbotId
          };
          setMessages(prev => [...prev, successMessage]);
          
          setTimeout(() => {
            const downloadMessage: Message = {
              text: 'DOWNLOAD_OPTIONS_AVAILABLE',
              sender: 'bot',
              timestamp: new Date(),
              type: 'download',
              chatbotId
            };
            setMessages(prev => [...prev, downloadMessage]);
            setIsLoading(false);
          }, 1000);
          
        } else if (status.status === 'failed') {
          const errorMessage: Message = {
            text: `❌ GENERATION FAILED: ${status.error_message || 'Unknown error occurred'}`,
            sender: 'bot',
            timestamp: new Date(),
            type: 'error'
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsLoading(false);
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            const timeoutMessage: Message = {
              text: '⏰ TIMEOUT: Generation is taking longer than expected. Please check status manually.',
              sender: 'bot',
              timestamp: new Date(),
              type: 'error'
            };
            setMessages(prev => [...prev, timeoutMessage]);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
        const errorMessage: Message = {
          text: `❌ STATUS CHECK FAILED: ${error.message}`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'error'
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
      }
    };

    poll();
  };

  const testChatbot = async () => {
    if (!testMessage.trim() || !generatedChatbotId) return;

    try {
      const response = await fetch(`/api/chatbot/${generatedChatbotId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get response');
      }

      const testResponse: Message = {
        text: `🤖 BOT RESPONSE:\n\n${result.response}\n\nConfidence: ${(result.confidence * 100).toFixed(1)}%\nSources: ${result.sources.length} pages`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'success'
      };
      setMessages(prev => [...prev, testResponse]);
      setTestMessage('');

    } catch (error) {
      const errorMessage: Message = {
        text: `❌ TEST FAILED: ${error.message}`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const downloadOptions = [
    { 
      type: 'npm', 
      label: 'NPM Package', 
      description: 'Install via npm for Node.js projects',
      code: `npm install @chatify/bot-sdk\n\nimport { ChatifyBot } from '@chatify/bot-sdk';\n\nconst bot = new ChatifyBot({\n  apiKey: 'your-api-key',\n  botId: '${generatedChatbotId}'\n});`
    },
    { 
      type: 'api', 
      label: 'REST API', 
      description: 'HTTP endpoints for any platform',
      code: `// Chat with your bot\nfetch('http://localhost:3001/api/chatbot/${generatedChatbotId}/chat', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ message: 'Hello!' })\n})`
    },
    { 
      type: 'embed', 
      label: 'Web Widget', 
      description: 'HTML embed code for websites',
      code: `<script src="https://chatify.ai/embed.js"></script>\n<div id="chatify-widget" \n     data-bot-id="${generatedChatbotId}"\n     data-theme="terminal">\n</div>`
    },
    { 
      type: 'whatsapp', 
      label: 'WhatsApp Deploy', 
      description: 'Direct WhatsApp Business integration',
      code: `// WhatsApp webhook handler\napp.post('/webhook/whatsapp', async (req, res) => {\n  const { message, from } = req.body;\n  \n  const response = await fetch(\n    'http://localhost:3001/api/chatbot/${generatedChatbotId}/chat',\n    {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ message })\n    }\n  );\n  \n  const { response: botResponse } = await response.json();\n  // Send botResponse back to WhatsApp\n});`
    },
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
                      : message.type === 'error'
                      ? 'bg-gray-800 border-red-400 text-red-400'
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

                {/* Test Chatbot Interface */}
                {message.type === 'success' && message.chatbotId && (
                  <div className="mt-4 bg-gray-800 border-2 border-cyan-400 p-4">
                    <h3 className="font-bold text-cyan-400 mb-3 tracking-wide">
                      ► TEST YOUR CHATBOT
                    </h3>
                    <div className="flex space-x-3">
                      <input
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && testChatbot()}
                        className="
                          flex-1 p-3 bg-gray-900 text-cyan-400 border-2 border-gray-600 
                          font-mono focus:border-cyan-400 focus:outline-none
                          placeholder-gray-500
                        "
                        placeholder="Ask your chatbot a question..."
                      />
                      <button
                        onClick={testChatbot}
                        disabled={!testMessage.trim()}
                        className="
                          px-6 py-3 bg-cyan-400 text-gray-900 border-2 border-cyan-300 
                          font-bold tracking-wide transition-all duration-200
                          hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed
                          flex items-center space-x-2 minecraft-button
                        "
                      >
                        <Send className="w-4 h-4" />
                        <span>TEST</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Download Options */}
                {message.type === 'download' && message.chatbotId && (
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    {downloadOptions.map((option, idx) => (
                      <div
                        key={idx}
                        className="
                          p-4 bg-gray-800 border-2 border-lime-400
                          minecraft-button block-shadow
                        "
                      >
                        <div className="flex items-center justify-between mb-3">
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
                          <button
                            onClick={() => copyToClipboard(option.code, option.type)}
                            className="p-2 bg-gray-700 border border-gray-600 hover:border-lime-400 transition-colors"
                          >
                            {copiedCode === option.type ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        <pre className="text-xs text-gray-300 bg-gray-900 p-3 border border-gray-700 overflow-x-auto">
                          {option.code}
                        </pre>
                      </div>
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