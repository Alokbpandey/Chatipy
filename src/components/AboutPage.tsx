import React from 'react';
import { Info, Cpu, Globe, Shield, Zap, Code, Users, Award, Bot, MessageSquare } from 'lucide-react';

const AboutPage: React.FC = () => {
  const systemSpecs = [
    { component: 'AI CHATBOT ENGINE', version: 'v4.2.1', status: 'ONLINE', color: 'text-lime-400' },
    { component: 'CONTENT ANALYZER', version: 'v3.1.0', status: 'ACTIVE', color: 'text-cyan-400' },
    { component: 'DEPLOYMENT CORE', version: 'v2.8.3', status: 'READY', color: 'text-green-400' },
    { component: 'INTEGRATION API', version: 'v5.0.1', status: 'RUNNING', color: 'text-yellow-400' },
  ];

  const capabilities = [
    {
      icon: Globe,
      title: 'WEBSITE PARSING',
      description: 'Deep content extraction and understanding from any website',
      color: 'border-blue-400 text-blue-400'
    },
    {
      icon: Bot,
      title: 'AI TRAINING',
      description: 'Automatic chatbot training on website content and context',
      color: 'border-purple-400 text-purple-400'
    },
    {
      icon: MessageSquare,
      title: 'MULTI-PLATFORM',
      description: 'Deploy to WhatsApp, Telegram, Discord, and web platforms',
      color: 'border-green-400 text-green-400'
    },
    {
      icon: Code,
      title: 'EASY INTEGRATION',
      description: 'NPM packages, REST APIs, and embed codes for developers',
      color: 'border-yellow-400 text-yellow-400'
    }
  ];

  const platforms = [
    { name: 'WhatsApp Business', status: 'SUPPORTED', color: 'text-green-400' },
    { name: 'Telegram Bot API', status: 'SUPPORTED', color: 'text-cyan-400' },
    { name: 'Discord Bot', status: 'SUPPORTED', color: 'text-purple-400' },
    { name: 'Web Widget', status: 'SUPPORTED', color: 'text-blue-400' },
    { name: 'REST API', status: 'SUPPORTED', color: 'text-yellow-400' },
    { name: 'NPM Package', status: 'SUPPORTED', color: 'text-orange-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-6 bg-gray-800 border-4 border-cyan-400 shadow-lg shadow-cyan-400/20 block-shadow mb-6">
            <Info className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-cyan-400 tracking-wider terminal-glow">
              ╔══ PLATFORM INFO ══╗
            </h1>
          </div>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed">
            Revolutionary AI platform that transforms any website into intelligent chatbots. 
            Create navigation assistants, Q&A bots, customer support agents, and more with just a URL and prompt.
          </p>
        </div>

        {/* System Status Terminal */}
        <div className="bg-gray-800 border-4 border-lime-400 p-6 mb-8 shadow-lg shadow-lime-400/20 block-shadow">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-lime-400 rounded-full"></div>
            <span className="text-gray-400 text-sm ml-4">system-status.exe</span>
          </div>
          
          <div className="bg-gray-900 p-4 border-2 border-gray-700 font-mono">
            <div className="text-lime-400 mb-4 text-center font-bold">
              ══════════ SYSTEM STATUS ══════════
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {systemSpecs.map((spec, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-800 border border-gray-600">
                  <div>
                    <span className="text-gray-300">[{spec.component}]</span>
                    <span className="text-gray-500 text-xs ml-2">{spec.version}</span>
                  </div>
                  <span className={`font-bold ${spec.color}`}>[{spec.status}]</span>
                </div>
              ))}
            </div>
            
            <div className="text-lime-400 mt-4 text-center">
              ═══════════════════════════════════════════
            </div>
            <div className="text-center text-gray-300 mt-2">
              UPTIME: 99.98% | BOTS GENERATED: 25,847 | STATUS: OPERATIONAL
            </div>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {capabilities.map((capability, index) => (
            <div
              key={index}
              className={`
                bg-gray-800 border-4 ${capability.color} p-6 
                hover:shadow-lg transition-all duration-300
                hover:bg-gray-750 minecraft-button block-shadow
              `}
            >
              <div className={`w-16 h-16 bg-gray-700 border-4 ${capability.color} flex items-center justify-center mb-4`}>
                <capability.icon className={`w-8 h-8 ${capability.color}`} />
              </div>
              <h3 className={`text-xl font-bold ${capability.color} mb-3 tracking-wide`}>
                ► {capability.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {capability.description}
              </p>
            </div>
          ))}
        </div>

        {/* Supported Platforms */}
        <div className="bg-gray-800 border-4 border-purple-400 p-6 mb-8 shadow-lg shadow-purple-400/20 block-shadow">
          <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center tracking-wider terminal-glow">
            ╔═══ DEPLOYMENT PLATFORMS ═══╗
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {platforms.map((platform, index) => (
              <div key={index} className="bg-gray-900 p-4 border-2 border-gray-700 flex justify-between items-center">
                <span className="text-gray-300">[{platform.name}]</span>
                <span className={`font-bold ${platform.color}`}>[{platform.status}]</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Examples */}
        <div className="bg-gray-800 border-4 border-orange-400 p-6 shadow-lg shadow-orange-400/20 block-shadow">
          <h2 className="text-2xl font-bold text-orange-400 mb-6 text-center tracking-wider terminal-glow">
            ╔═══ INTEGRATION EXAMPLES ═══╗
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 p-4 border-2 border-gray-700">
              <h3 className="font-bold text-orange-400 mb-3">► NPM PACKAGE</h3>
              <pre className="text-gray-300 text-xs bg-gray-800 p-2 border border-gray-600">
{`npm install @chatify/bot-sdk
import { ChatifyBot } from '@chatify/bot-sdk';

const bot = new ChatifyBot({
  apiKey: 'your-api-key',
  botId: 'generated-bot-id'
});`}
              </pre>
            </div>
            
            <div className="bg-gray-900 p-4 border-2 border-gray-700">
              <h3 className="font-bold text-orange-400 mb-3">► WEB EMBED</h3>
              <pre className="text-gray-300 text-xs bg-gray-800 p-2 border border-gray-600">
{`<script src="https://chatify.ai/embed.js"></script>
<div id="chatify-widget" 
     data-bot-id="your-bot-id"
     data-theme="terminal">
</div>`}
              </pre>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="text-center">
          <div className="bg-gray-800 border-4 border-lime-400 p-8 shadow-lg shadow-lime-400/20 block-shadow">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Users className="w-8 h-8 text-lime-400" />
              <h2 className="text-3xl font-bold text-lime-400 tracking-wider terminal-glow">
                ╔═══ PLATFORM STATS ═══╗
              </h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gray-900 p-4 border-2 border-gray-700">
                <div className="text-3xl font-bold text-lime-400 mb-2">25K+</div>
                <div className="text-gray-300 text-sm">BOTS GENERATED</div>
              </div>
              <div className="bg-gray-900 p-4 border-2 border-gray-700">
                <div className="text-3xl font-bold text-cyan-400 mb-2">500+</div>
                <div className="text-gray-300 text-sm">WEBSITES ANALYZED</div>
              </div>
              <div className="bg-gray-900 p-4 border-2 border-gray-700">
                <div className="text-3xl font-bold text-purple-400 mb-2">15</div>
                <div className="text-gray-300 text-sm">PLATFORMS SUPPORTED</div>
              </div>
              <div className="bg-gray-900 p-4 border-2 border-gray-700">
                <div className="text-3xl font-bold text-yellow-400 mb-2">99.2%</div>
                <div className="text-gray-300 text-sm">SUCCESS RATE</div>
              </div>
            </div>
            
            <p className="text-gray-400 font-mono text-sm">
              ╔══════════════════════════════════════════════════════╗<br />
              ║  TRUSTED BY DEVELOPERS, BUSINESSES & ENTREPRENEURS  ║<br />
              ║  BUILDING THE FUTURE OF CONVERSATIONAL AI SINCE 2023║<br />
              ╚══════════════════════════════════════════════════════╝
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;