import React from 'react';
import { Bot, Zap, Shield, Code, MessageSquare, Smartphone, Globe, Download, Users, Award, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onNavigateToDemo: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToDemo }) => {
  const botTypes = [
    {
      icon: Globe,
      title: 'WEBSITE BOT',
      description: 'Navigate and answer questions about any website',
      color: 'border-blue-400 text-blue-400',
      features: ['Site navigation', 'Content search', 'Page recommendations']
    },
    {
      icon: MessageSquare,
      title: 'Q&A BOT',
      description: 'Smart question-answering based on website content',
      color: 'border-green-400 text-green-400',
      features: ['FAQ automation', 'Knowledge base', 'Smart responses']
    },
    {
      icon: Smartphone,
      title: 'WHATSAPP BOT',
      description: 'Deploy chatbots directly to WhatsApp Business',
      color: 'border-emerald-400 text-emerald-400',
      features: ['Business messaging', 'Customer support', 'Lead generation']
    },
    {
      icon: Bot,
      title: 'SUPPORT BOT',
      description: 'Automated customer support and troubleshooting',
      color: 'border-purple-400 text-purple-400',
      features: ['Issue resolution', 'Ticket routing', '24/7 availability']
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'INSTANT GENERATION',
      description: 'Create production-ready chatbots in under 5 minutes from any website URL'
    },
    {
      icon: Shield,
      title: 'ENTERPRISE SECURITY',
      description: 'Bank-grade encryption, GDPR compliant, and secure data handling'
    },
    {
      icon: Code,
      title: 'DEVELOPER FRIENDLY',
      description: 'REST APIs, NPM packages, webhooks, and comprehensive documentation'
    },
    {
      icon: Download,
      title: 'MULTIPLE EXPORTS',
      description: 'Deploy to WhatsApp, Telegram, Discord, or embed on any website'
    }
  ];

  const testimonials = [
    {
      company: 'TechCorp Inc.',
      feedback: 'Reduced customer support tickets by 70% with our AI chatbot',
      metric: '70% reduction'
    },
    {
      company: 'E-commerce Plus',
      feedback: 'Generated 500+ qualified leads in the first month',
      metric: '500+ leads'
    },
    {
      company: 'SaaS Solutions',
      feedback: 'Improved user onboarding completion rate by 45%',
      metric: '45% improvement'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5 text-lime-400 text-xs leading-none pointer-events-none">
        <div className="grid grid-cols-20 gap-0 h-full animate-pulse">
          {Array.from({ length: 400 }).map((_, i) => (
            <div key={i} className="w-4 h-4 border border-lime-400"></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="mb-8">
            <div className="inline-block p-8 bg-gray-800 border-4 border-lime-400 shadow-lg shadow-lime-400/20 block-shadow">
              <Bot className="w-20 h-20 text-lime-400 mx-auto mb-6 animate-pulse" />
              <div className="text-4xl font-bold text-lime-400 mb-4 tracking-wider terminal-glow">
                ╔═══════════════════════╗
              </div>
              <div className="text-6xl font-bold text-white mb-4 tracking-widest">
                CHATIFY
              </div>
              <div className="text-2xl font-bold text-cyan-400 mb-4 tracking-wider">
                AI CHATBOT GENERATOR
              </div>
              <div className="text-4xl font-bold text-lime-400 tracking-wider terminal-glow">
                ╚═══════════════════════╝
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed font-mono">
            <span className="text-lime-400">{'>'}</span> TRANSFORM ANY WEBSITE INTO AN INTELLIGENT CHATBOT<br />
            <span className="text-lime-400">{'>'}</span> POWERED BY ADVANCED AI & MACHINE LEARNING<br />
            <span className="text-lime-400">{'>'}</span> DEPLOY TO WHATSAPP, TELEGRAM, WEB & MORE...
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
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
            <div className="text-gray-400 font-mono text-sm">
              FREE • NO SIGNUP • INSTANT GENERATION
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-800 border-2 border-gray-600 p-4">
              <div className="text-2xl font-bold text-lime-400">25K+</div>
              <div className="text-gray-400 text-xs">BOTS CREATED</div>
            </div>
            <div className="bg-gray-800 border-2 border-gray-600 p-4">
              <div className="text-2xl font-bold text-cyan-400">99.2%</div>
              <div className="text-gray-400 text-xs">SUCCESS RATE</div>
            </div>
            <div className="bg-gray-800 border-2 border-gray-600 p-4">
              <div className="text-2xl font-bold text-purple-400">30s</div>
              <div className="text-gray-400 text-xs">AVG GENERATION</div>
            </div>
          </div>
        </div>

        {/* Bot Types Grid */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center text-lime-400 mb-12 tracking-wider terminal-glow">
            ╔═══ CHATBOT TYPES ═══╗
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {botTypes.map((bot, index) => (
              <div
                key={index}
                className={`
                  bg-gray-800 border-4 ${bot.color} p-6 
                  hover:shadow-lg transition-all duration-300
                  hover:bg-gray-750 minecraft-button block-shadow
                  hover:scale-105
                `}
              >
                <div className={`w-16 h-16 bg-gray-700 border-4 ${bot.color} flex items-center justify-center mb-4 mx-auto`}>
                  <bot.icon className={`w-8 h-8 ${bot.color}`} />
                </div>
                <h3 className={`text-lg font-bold ${bot.color} mb-3 tracking-wide text-center`}>
                  ► {bot.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed text-center mb-4">
                  {bot.description}
                </p>
                <div className="space-y-1">
                  {bot.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-gray-400 text-xs">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center text-cyan-400 mb-12 tracking-wider terminal-glow">
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
                  hover:scale-105
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
        <div className="bg-gray-800 border-4 border-purple-400 p-6 mb-20 shadow-lg shadow-purple-400/20 block-shadow">
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
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <span className="text-lime-400 font-bold">STEP 1:</span>
                  <span className="text-gray-300">Enter website URL and select chatbot type</span>
                </div>
                <div className="flex items-start space-x-4">
                  <span className="text-cyan-400 font-bold">STEP 2:</span>
                  <span className="text-gray-300">AI analyzes content and generates intelligent responses</span>
                </div>
                <div className="flex items-start space-x-4">
                  <span className="text-yellow-400 font-bold">STEP 3:</span>
                  <span className="text-gray-300">Test your chatbot with real questions</span>
                </div>
                <div className="flex items-start space-x-4">
                  <span className="text-green-400 font-bold">STEP 4:</span>
                  <span className="text-gray-300">Download integration code or deploy instantly</span>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 border border-gray-600">
                <div className="text-purple-400 font-bold mb-2">TECHNICAL SPECS:</div>
                <div className="space-y-1 text-xs">
                  <div className="text-gray-300">• GPT-4 Powered AI Engine</div>
                  <div className="text-gray-300">• Vector Embeddings for Context</div>
                  <div className="text-gray-300">• Real-time Content Analysis</div>
                  <div className="text-gray-300">• Multi-platform Deployment</div>
                  <div className="text-gray-300">• Enterprise-grade Security</div>
                </div>
              </div>
            </div>
            
            <div className="text-purple-400 mt-6 text-center">
              ═══════════════════════════════════════════
            </div>
            <div className="text-center text-gray-300 mt-2">
              GENERATION TIME: ~2-5 MINUTES | SUCCESS RATE: 99.2% | UPTIME: 99.98%
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center text-yellow-400 mb-12 tracking-wider terminal-glow">
            ╔═══ SUCCESS STORIES ═══╗
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-800 border-4 border-yellow-400 p-6 block-shadow">
                <div className="flex items-center space-x-2 mb-4">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-bold text-yellow-400 text-lg">{testimonial.company}</h4>
                </div>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  "{testimonial.feedback}"
                </p>
                <div className="text-lime-400 font-bold text-lg">
                  {testimonial.metric}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-orange-400 mb-12 text-center tracking-wider terminal-glow">
            ╔═══ USE CASES ═══╗
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800 border-4 border-orange-400 p-6 block-shadow hover:scale-105 transition-transform">
              <h4 className="font-bold text-orange-400 mb-3 text-lg">E-COMMERCE SUPPORT</h4>
              <p className="text-gray-300 text-sm mb-4">Create product recommendation bots and customer service assistants</p>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-gray-400 text-xs">Product recommendations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-gray-400 text-xs">Order tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-gray-400 text-xs">Customer support</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 border-4 border-orange-400 p-6 block-shadow hover:scale-105 transition-transform">
              <h4 className="font-bold text-orange-400 mb-3 text-lg">DOCUMENTATION HELPER</h4>
              <p className="text-gray-300 text-sm mb-4">Transform docs into interactive Q&A bots for better user experience</p>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-gray-400 text-xs">API documentation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-gray-400 text-xs">User guides</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-gray-400 text-xs">FAQ automation</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 border-4 border-orange-400 p-6 block-shadow hover:scale-105 transition-transform">
              <h4 className="font-bold text-orange-400 mb-3 text-lg">LEAD GENERATION</h4>
              <p className="text-gray-300 text-sm mb-4">Deploy intelligent bots to capture and qualify leads automatically</p>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-gray-400 text-xs">Lead qualification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-gray-400 text-xs">Contact collection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-gray-400 text-xs">Sales automation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gray-800 border-4 border-lime-400 p-8 shadow-lg shadow-lime-400/20 block-shadow">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Users className="w-8 h-8 text-lime-400" />
              <h2 className="text-3xl font-bold text-lime-400 tracking-wider terminal-glow">
                ╔═══ START BUILDING ═══╗
              </h2>
            </div>
            
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of developers and businesses using Chatify to create intelligent chatbots. 
              No coding required, production-ready in minutes.
            </p>
            
            <button
              onClick={onNavigateToDemo}
              className="
                px-16 py-6 bg-lime-400 text-gray-900 border-4 border-lime-300 
                font-bold text-2xl tracking-wider transition-all duration-200
                hover:bg-lime-300 hover:shadow-lg hover:shadow-lime-400/30
                minecraft-button block-shadow hover:scale-105
              "
            >
              ► GENERATE YOUR FIRST BOT ◄
            </button>
            
            <div className="text-gray-400 font-mono text-sm mt-4">
              ╔══════════════════════════════════════════════════════╗<br />
              ║  FREE TIER: 5 BOTS/MONTH • PRO: UNLIMITED + SUPPORT ║<br />
              ║  ENTERPRISE: CUSTOM SOLUTIONS & WHITE-LABEL OPTIONS ║<br />
              ╚══════════════════════════════════════════════════════╝
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t-2 border-gray-700">
          <p className="text-gray-500 text-sm font-mono">
            ╔════════════════════════════════════════════════════════════════════╗<br />
            ║  CHATIFY v3.0.0 - AI CHATBOT GENERATION PLATFORM                  ║<br />
            ║  POWERED BY GPT-4, VECTOR EMBEDDINGS & ADVANCED ML ALGORITHMS     ║<br />
            ║  TRUSTED BY 10,000+ DEVELOPERS WORLDWIDE                          ║<br />
            ╚════════════════════════════════════════════════════════════════════╝
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;