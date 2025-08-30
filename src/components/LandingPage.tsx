import React from 'react';
import { Bot, Zap, Shield, Code, MessageSquare, Smartphone, Globe, Download } from 'lucide-react';

interface LandingPageProps {
  onNavigateToDemo: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToDemo }) => {
  const botTypes = [
    {
      icon: Globe,
      title: 'WEBSITE BOT',
      description: 'Navigate and answer questions about any website',
      color: 'border-blue-400 text-blue-400'
    },
    {
      icon: MessageSquare,
      title: 'Q&A BOT',
      description: 'Smart question-answering based on website content',
      color: 'border-green-400 text-green-400'
    },
    {
      icon: Smartphone,
      title: 'WHATSAPP BOT',
      description: 'Deploy chatbots directly to WhatsApp Business',
      color: 'border-emerald-400 text-emerald-400'
    },
    {
      icon: Bot,
      title: 'TELEGRAM BOT',
      description: 'Create Telegram bots with website knowledge',
      color: 'border-cyan-400 text-cyan-400'
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'INSTANT GENERATION',
      description: 'Create chatbots in seconds from any website URL'
    },
    {
      icon: Shield,
      title: 'SECURE & PRIVATE',
      description: 'Your data stays safe with enterprise-grade security'
    },
    {
      icon: Code,
      title: 'EASY INTEGRATION',
      description: 'Export and integrate into your projects with simple APIs'
    },
    {
      icon: Download,
      title: 'MULTIPLE FORMATS',
      description: 'Download as NPM package, API endpoint, or embed code'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Minecraft Block Pattern Background */}
      <div className="absolute inset-0 opacity-5 text-lime-400 text-xs leading-none pointer-events-none">
        <div className="grid grid-cols-20 gap-0 h-full">
          {Array.from({ length: 400 }).map((_, i) => (
            <div key={i} className="w-4 h-4 border border-lime-400"></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <div className="inline-block p-8 bg-gray-800 border-4 border-lime-400 shadow-lg shadow-lime-400/20 block-shadow">
              <Bot className="w-20 h-20 text-lime-400 mx-auto mb-6" />
              <div className="text-4xl font-bold text-lime-400 mb-4 tracking-wider terminal-glow">
                ╔═══════════════════════╗
              </div>
              <div className="text-6xl font-bold text-white mb-4 tracking-widest">
                CHATIFY
              </div>
              <div className="text-2xl font-bold text-cyan-400 mb-4 tracking-wider">
                CHATBOT GENERATOR
              </div>
              <div className="text-4xl font-bold text-lime-400 tracking-wider terminal-glow">
                ╚═══════════════════════╝
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-mono">
            <span className="text-lime-400">{'>'}</span> INITIALIZE CHATBOT_GENERATOR.EXE<br />
            <span className="text-lime-400">{'>'}</span> AI-POWERED BOT CREATION PROTOCOL ACTIVE<br />
            <span className="text-lime-400">{'>'}</span> ENTER WEBSITE URL + PROMPT TO GENERATE...
          </h2>
          
          <button
            onClick={onNavigateToDemo}
            className="
              px-12 py-6 bg-lime-400 text-gray-900 border-4 border-lime-300 
              font-bold text-2xl tracking-wider transition-all duration-200
              hover:bg-lime-300 hover:shadow-lg hover:shadow-lime-400/30
              minecraft-button block-shadow
            "
          >
            ► CREATE CHATBOT ◄
          </button>
        </div>

        {/* Bot Types Grid */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-lime-400 mb-8 tracking-wider terminal-glow">
            ╔═══ SUPPORTED BOT TYPES ═══╗
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {botTypes.map((bot, index) => (
              <div
                key={index}
                className={`
                  bg-gray-800 border-4 ${bot.color} p-6 
                  hover:shadow-lg transition-all duration-300
                  hover:bg-gray-750 minecraft-button block-shadow
                `}
              >
                <div className={`w-16 h-16 bg-gray-700 border-4 ${bot.color} flex items-center justify-center mb-4 mx-auto`}>
                  <bot.icon className={`w-8 h-8 ${bot.color}`} />
                </div>
                <h3 className={`text-lg font-bold ${bot.color} mb-3 tracking-wide text-center`}>
                  ► {bot.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed text-center">
                  {bot.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-cyan-400 mb-8 tracking-wider terminal-glow">
            ╔═══ PLATFORM FEATURES ═══╗
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="
                  bg-gray-800 border-2 border-gray-600 p-6 
                  hover:border-cyan-400 transition-all duration-300
                  hover:shadow-lg hover:shadow-cyan-400/10 minecraft-button
                "
              >
                <div className="w-12 h-12 bg-cyan-400 border-2 border-cyan-300 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-gray-900" />
                </div>
                <h3 className="font-bold text-cyan-400 mb-2 tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works Terminal */}
        <div className="bg-gray-800 border-4 border-purple-400 p-6 mb-16 shadow-lg shadow-purple-400/20 block-shadow">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-lime-400 rounded-full"></div>
            <span className="text-gray-400 text-sm ml-4">how-it-works.exe</span>
          </div>
          
          <div className="bg-gray-900 p-6 border-2 border-gray-700 font-mono text-sm">
            <div className="text-purple-400 mb-6 text-center font-bold text-lg">
              ══════════ HOW IT WORKS ══════════
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <span className="text-lime-400 font-bold">STEP 1:</span>
                <span className="text-gray-300">Provide website URL and describe your chatbot requirements</span>
              </div>
              <div className="flex items-start space-x-4">
                <span className="text-cyan-400 font-bold">STEP 2:</span>
                <span className="text-gray-300">AI analyzes website content and generates intelligent responses</span>
              </div>
              <div className="flex items-start space-x-4">
                <span className="text-yellow-400 font-bold">STEP 3:</span>
                <span className="text-gray-300">Choose deployment platform (WhatsApp, Telegram, Web, API)</span>
              </div>
              <div className="flex items-start space-x-4">
                <span className="text-green-400 font-bold">STEP 4:</span>
                <span className="text-gray-300">Download integration package or deploy instantly</span>
              </div>
            </div>
            
            <div className="text-purple-400 mt-6 text-center">
              ═══════════════════════════════════════════
            </div>
            <div className="text-center text-gray-300 mt-2">
              GENERATION TIME: ~30 SECONDS | SUCCESS RATE: 99.2%
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-orange-400 mb-8 tracking-wider terminal-glow">
            ╔═══ USE CASES ═══╗
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800 border-4 border-orange-400 p-6 block-shadow">
              <h4 className="font-bold text-orange-400 mb-3 text-lg">E-COMMERCE SUPPORT</h4>
              <p className="text-gray-300 text-sm">Create product recommendation bots and customer service assistants</p>
            </div>
            <div className="bg-gray-800 border-4 border-orange-400 p-6 block-shadow">
              <h4 className="font-bold text-orange-400 mb-3 text-lg">DOCUMENTATION HELPER</h4>
              <p className="text-gray-300 text-sm">Transform docs into interactive Q&A bots for better user experience</p>
            </div>
            <div className="bg-gray-800 border-4 border-orange-400 p-6 block-shadow">
              <h4 className="font-bold text-orange-400 mb-3 text-lg">LEAD GENERATION</h4>
              <p className="text-gray-300 text-sm">Deploy intelligent bots to capture and qualify leads automatically</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t-2 border-gray-700">
          <p className="text-gray-500 text-sm font-mono">
            ╔════════════════════════════════════════════════╗<br />
            ║  CHATIFY v3.0.0 - CHATBOT GENERATION PLATFORM ║<br />
            ║  POWERED BY ADVANCED AI & MACHINE LEARNING    ║<br />
            ╚════════════════════════════════════════════════╝
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;