import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Hash, BookOpen, Youtube, Sparkles, Loader2, Video, Tags, Download, Copy, Check, Lightbulb, Mic, MicOff, BarChart, Image as ImageIcon, Upload, X, Save, Bookmark, Undo, Redo } from 'lucide-react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function AdBanner() {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const pushAd = () => {
      if (!adRef.current) return;
      
      // If width is 0, wait and try again (prevents "No slot size for availableWidth=0")
      if (adRef.current.clientWidth === 0) {
        timeoutId = setTimeout(pushAd, 200);
        return;
      }

      try {
        if (!adRef.current.getAttribute('data-adsbygoogle-status')) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (e: any) {
        if (e.message && !e.message.includes('already have ads') && !e.message.includes('No slot size')) {
          console.error("AdSense error", e);
        }
      }
    };

    // Initial delay to ensure DOM layout is complete
    timeoutId = setTimeout(pushAd, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="my-8 mx-auto max-w-4xl w-full bg-slate-800/30 rounded-xl border border-slate-700/30 flex items-center justify-center overflow-hidden relative min-h-[90px] min-w-[250px]">
      <span className="absolute text-slate-600 text-xs font-medium z-0 uppercase tracking-widest">Advertisement</span>
      <ins 
        ref={adRef}
        className="adsbygoogle relative z-10 w-full"
        style={{ display: 'block', minWidth: '250px', height: '90px' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="1234567890"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}

function LoadingState({ message, colorClass = "text-green-500", bgClass = "bg-green-500" }: { message: string, colorClass?: string, bgClass?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p;
        return p + Math.random() * 15;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 p-8 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className={`absolute inset-0 ${bgClass} blur-xl opacity-20 animate-pulse rounded-full`}></div>
        <Loader2 className={`w-12 h-12 animate-spin relative z-10 ${colorClass}`} />
      </div>
      
      <div className="w-full max-w-xs flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-300 font-medium animate-pulse">{message}</span>
          <span className="text-slate-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${bgClass} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <div className={`w-2 h-2 rounded-full ${bgClass} animate-bounce`} style={{ animationDelay: '0ms' }} />
        <div className={`w-2 h-2 rounded-full ${bgClass} animate-bounce`} style={{ animationDelay: '150ms' }} />
        <div className={`w-2 h-2 rounded-full ${bgClass} animate-bounce`} style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function useTemplates(toolName: string) {
  const [templates, setTemplates] = useState<any[]>(() => {
    const saved = localStorage.getItem(`templates_${toolName}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(`templates_${toolName}`, JSON.stringify(templates));
  }, [templates, toolName]);

  const saveTemplate = (name: string, config: any) => {
    setTemplates([...templates, { id: Date.now().toString(), name, config }]);
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  return { templates, saveTemplate, deleteTemplate };
}

function useUndoRedoState(initialValue: string) {
  const [state, setState] = useState(initialValue);
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const set = (newValue: string) => {
    setPast(p => [...p, state]);
    setState(newValue);
    setFuture([]);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(past.slice(0, past.length - 1));
    setFuture(f => [state, ...f]);
    setState(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(future.slice(1));
    setPast(p => [...p, state]);
    setState(next);
  };

  return { value: state, set, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}

function TemplateSelector({ templates, onSelect, onSave, onDelete }: { templates: any[], onSelect: (config: any) => void, onSave: (name: string) => void, onDelete: (id: string) => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedId, setSelectedId] = useState('');

  return (
    <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-900/30 rounded-xl border border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Bookmark className="w-4 h-4 text-green-500" />
          Templates
        </div>
        <button 
          onClick={() => setIsSaving(!isSaving)}
          className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1"
        >
          <Save className="w-3 h-3" /> Save Current
        </button>
      </div>
      
      {isSaving && (
        <div className="flex gap-2 mt-2">
          <input 
            type="text" 
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder="Template name..."
            className="flex-1 p-2 text-sm rounded-lg bg-slate-900 text-white border border-slate-700 focus:border-green-500 outline-none"
          />
          <button 
            onClick={() => {
              if (templateName.trim()) {
                onSave(templateName);
                setTemplateName('');
                setIsSaving(false);
              }
            }}
            disabled={!templateName.trim()}
            className="px-3 py-2 text-sm bg-green-500 hover:bg-green-400 text-slate-950 font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            Save
          </button>
        </div>
      )}

      {templates.length > 0 && (
        <div className="flex gap-2 mt-2">
          <select 
            value={selectedId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedId(id);
              if (id) {
                const tmpl = templates.find(t => t.id === id);
                if (tmpl) onSelect(tmpl.config);
              }
            }}
            className="flex-1 p-2 text-sm rounded-lg bg-slate-900 text-white border border-slate-700 focus:border-green-500 outline-none cursor-pointer"
          >
            <option value="" disabled>Load a template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {selectedId && (
            <button
              onClick={() => {
                onDelete(selectedId);
                setSelectedId('');
              }}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-800 rounded-lg transition-colors"
              title="Delete template"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-green-500/30 pb-12">
      <header className="bg-slate-950 border-b border-slate-800 py-16 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-10 h-10 text-green-500" />
            <h1 className="text-white text-5xl font-bold tracking-tight">CreatorTools <span className="text-green-500">Hub</span></h1>
          </div>
          <h2 className="text-2xl font-medium text-slate-300 mb-6">Free AI Tools to Supercharge Your Content Creation</h2>
          
          <div className="text-slate-400 text-lg space-y-6 leading-relaxed text-left md:text-center">
            <p>
              Are you looking to grow your audience and create better content faster? <strong>CreatorTools Hub</strong> is your ultimate platform offering free, powerful AI tools designed specifically for YouTubers, TikTokers, and digital creators.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-slate-300 my-8">
              <span className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-full">📱 TikTok Hashtags</span>
              <span className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-full">▶️ YouTube Tags</span>
              <span className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-full">✍️ Script Writer</span>
              <span className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-full">📖 Story Generator</span>
              <span className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-full">🎨 AI Image Generator</span>
            </div>

            <p>
              <strong>Why use our tools?</strong> Save hours of brainstorming, boost your video views with smart SEO, and overcome writer's block instantly. Our tools are completely free, easy to use, and powered by advanced AI to help your content stand out from the crowd.
            </p>
            
            <div className="pt-6">
              <p className="text-xl text-green-400 font-semibold animate-pulse">
                Ready to take your content to the next level? Scroll down and try our free AI tools today! 👇
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4">
        <AdBanner />
      </div>

      <main className="container mx-auto px-4 max-w-6xl pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <HashtagTool />
          <StoryTool />
          <YouTubeTool />
          <ScriptTool />
          <TagsTool />
          <YouTubeHashtagTool />
          <YouTubeAnalyzerTool />
          <IdeaToStoryTool />
          <ImageGeneratorTool />
          <YouTubeThumbnailTool />
        </div>
      </main>

      <section className="container mx-auto px-4 max-w-4xl pb-16">
        <div className="bg-slate-800/50 border border-slate-700 p-8 md:p-10 rounded-3xl shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">How to Use an Online Hashtag Generator for Social Media Growth</h2>
          <p className="text-slate-300 leading-relaxed">
            Using an online hashtag generator is the easiest way to accelerate your social media growth. Simply enter your video topic or niche into the tool, click generate, and instantly copy a curated list of trending tags. Hashtags are essential for platforms like TikTok, YouTube, and Instagram because they categorize your content, making it highly discoverable to new audiences. By using the right mix of viral and niche-specific hashtags, you signal the algorithm to push your videos to the For You Page (FYP) or search results, dramatically increasing your organic reach, views, and overall engagement.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl pb-16">
        <div className="bg-slate-800/50 border border-slate-700 p-8 md:p-12 rounded-3xl shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">About CreatorTools Hub</h2>
          
          <div className="space-y-6 text-slate-300 leading-relaxed">
            <p>
              Welcome to <strong>CreatorTools Hub</strong>, your go-to destination for free, AI-powered content creation tools. We built this platform with one simple goal: to make content creation easier, faster, and more effective for everyone.
            </p>
            
            <div>
              <h3 className="text-xl font-semibold text-green-400 mb-2">Who is this for?</h3>
              <p>
                Whether you are a seasoned YouTuber, an aspiring TikTok star, a digital marketer, or a creative writer, our tools are designed for you. We help creators of all levels optimize their content, generate fresh ideas, and overcome creative blocks.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-green-400 mb-2">Our Mission</h3>
              <p>
                Our mission is to democratize content creation. We believe that high-quality SEO optimization, scriptwriting, and brainstorming tools shouldn't be locked behind expensive paywalls. By leveraging advanced AI technology, we provide premium-level tools completely free of charge.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-green-400 mb-2">Why Trust Us?</h3>
              <p>
                We prioritize your privacy and user experience. Our platform is straightforward, requires no sign-ups, and uses state-of-the-art AI models to ensure the results you get are relevant, accurate, and ready to use. We are constantly updating and adding new tools based on what creators actually need.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl pb-16">
        <div className="bg-slate-800/50 border border-slate-700 p-8 md:p-12 rounded-3xl shadow-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Contact Us</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Have a question, feedback, or need help with our tools? We'd love to hear from you! Reach out to our support team and we'll get back to you as soon as possible.
          </p>
          <div className="inline-flex flex-col items-center justify-center p-6 bg-slate-900/80 rounded-2xl border border-slate-700/50 shadow-inner">
            <span className="text-slate-400 text-sm mb-2 uppercase tracking-wider font-semibold">Support Email</span>
            <a href="mailto:oviguejeffery@gmail.com" className="text-xl md:text-2xl font-bold text-green-400 hover:text-green-300 transition-colors mb-4">
              oviguejeffery@gmail.com
            </a>
            <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-800/50 px-4 py-2 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              Response time: within 24-48 hours
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl pb-16">
        <div className="bg-slate-800/50 border border-slate-700 p-8 md:p-12 rounded-3xl shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Privacy Policy</h2>
          
          <div className="space-y-6 text-slate-300 leading-relaxed text-sm md:text-base">
            <p>
              At <strong>CreatorTools Hub</strong>, we respect your privacy and are committed to protecting it. This Privacy Policy explains how we handle information when you visit our website and use our free tools.
            </p>

            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">1. Information Collection</h3>
              <p>
                We believe in keeping things simple and private. You are not required to create an account or provide any personal information (like your name or email address) to use our tools. We only collect minimal, non-personally identifiable information automatically (such as browser type or device information) to ensure our website functions properly.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">2. Cookies Usage</h3>
              <p>
                Our website uses cookies to improve your browsing experience, analyze site traffic, and serve personalized content. Cookies are small text files saved on your device that help us understand how you interact with our site.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">3. Google AdSense & Third-Party Cookies</h3>
              <p>
                To keep our tools free, we use third-party advertising companies like Google AdSense to serve ads when you visit our website.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to our website or other websites.</li>
                <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet.</li>
                <li>You may opt out of personalized advertising by visiting <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">Google's Ads Settings</a>.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">4. Data Protection</h3>
              <p>
                Since we do not collect personal data directly, your risk is minimal. Any inputs you provide to our AI tools are processed securely and are not stored permanently on our servers. We take reasonable measures to protect the integrity and security of our website.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">5. User Consent</h3>
              <p>
                By using CreatorTools Hub, you consent to our use of cookies and agree to the terms outlined in this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 py-8 mt-auto">
        <div className="container mx-auto px-4 max-w-4xl text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} CreatorTools Hub. All rights reserved.</p>
          <p className="mt-2">Free AI tools for content creators.</p>
        </div>
      </footer>
    </div>
  );
}

function HashtagTool() {
  const [topic, setTopic] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setOutput('');
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate viral TikTok hashtags for ${topic}. Return ONLY the hashtags separated by spaces, starting with #. Do not include any other text.`,
      });
      setOutput(response.text || '');
    } catch (e) {
      setOutput('Error generating hashtags. Please try again.');
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col h-full transition-all hover:border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-lg text-green-500">
          <Hash className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">TikTok Hashtags</h2>
      </div>
      
      <div className="flex-grow flex flex-col gap-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
          placeholder="Enter topic (e.g., fitness tips)"
          className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500"
        />
        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full py-3 px-4 bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Hashtags'
          )}
        </button>
        
        {loading && <LoadingState message="Generating hashtags..." />}
        
        {output && !loading && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col gap-3">
            <p className="text-sky-400 leading-relaxed whitespace-pre-wrap font-medium">
              {output}
            </p>
            <CopyButton text={output} />
          </div>
        )}
      </div>
    </div>
  );
}

function StoryTool() {
  const [topic, setTopic] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setOutput('');
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a short emotional viral story about ${topic}. Keep it concise and engaging for social media.`,
      });
      setOutput(response.text || '');
    } catch (e) {
      setOutput('Error generating story hook. Please try again.');
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col h-full transition-all hover:border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-lg text-green-500">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">Story Hook Generator</h2>
      </div>
      
      <div className="flex-grow flex flex-col gap-4">
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter story topic or premise"
          rows={2}
          className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500 resize-none"
        />
        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full py-3 px-4 bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Hook'
          )}
        </button>
        
        {loading && <LoadingState message="Generating story..." />}
        
        {output && !loading && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col gap-3">
            <p className="text-sky-400 leading-relaxed whitespace-pre-wrap">
              {output}
            </p>
            <CopyButton text={output} />
          </div>
        )}
      </div>
    </div>
  );
}

function YouTubeTool() {
  const topicState = useUndoRedoState('');
  const extraInstructionsState = useUndoRedoState('');
  const [tone, setTone] = useState('Engaging');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const { templates, saveTemplate, deleteTemplate } = useTemplates('youtube_desc');

  const generate = async () => {
    if (!topicState.value.trim()) return;
    setOutput('');
    setLoading(true);
    try {
      let prompt = `Write a YouTube description for ${topicState.value}. Tone: ${tone}. Include a catchy intro, call to action, and relevant tags.`;
      if (extraInstructionsState.value.trim()) {
        prompt += `\nAdditional instructions: ${extraInstructionsState.value}`;
      }
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setOutput(response.text || '');
    } catch (e) {
      setOutput('Error generating description. Please try again.');
      console.error(e);
    }
    setLoading(false);
  };

  const handleLoadTemplate = (config: any) => {
    if (config.topic !== undefined) topicState.set(config.topic);
    if (config.tone !== undefined) setTone(config.tone);
    if (config.extraInstructions !== undefined) extraInstructionsState.set(config.extraInstructions);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col h-full transition-all hover:border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-lg text-green-500">
          <Youtube className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">YouTube Description</h2>
      </div>
      
      <TemplateSelector 
        templates={templates} 
        onSelect={handleLoadTemplate} 
        onSave={(name) => saveTemplate(name, { topic: topicState.value, tone, extraInstructions: extraInstructionsState.value })}
        onDelete={deleteTemplate}
      />
      
      <div className="flex-grow flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-400 pl-1">Topic</span>
            <div className="flex gap-1">
              <button onClick={topicState.undo} disabled={!topicState.canUndo} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Undo"><Undo className="w-3.5 h-3.5" /></button>
              <button onClick={topicState.redo} disabled={!topicState.canRedo} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Redo"><Redo className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <textarea
            value={topicState.value}
            onChange={(e) => topicState.set(e.target.value)}
            placeholder="Enter video topic or title"
            rows={2}
            className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500 resize-none"
          />
          <div className="text-xs text-slate-500 text-right">{topicState.value.length} characters</div>
        </div>
        <div className="flex gap-3">
          <select 
            value={tone} 
            onChange={(e) => setTone(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none cursor-pointer"
          >
            <option value="Engaging">Engaging</option>
            <option value="Professional">Professional</option>
            <option value="Funny">Funny</option>
            <option value="Educational">Educational</option>
            <option value="Dramatic">Dramatic</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-400 pl-1">Extra Instructions</span>
            <div className="flex gap-1">
              <button onClick={extraInstructionsState.undo} disabled={!extraInstructionsState.canUndo} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Undo"><Undo className="w-3.5 h-3.5" /></button>
              <button onClick={extraInstructionsState.redo} disabled={!extraInstructionsState.canRedo} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Redo"><Redo className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <textarea
            value={extraInstructionsState.value}
            onChange={(e) => extraInstructionsState.set(e.target.value)}
            placeholder="Extra instructions (e.g., 'Include links to my social media', 'Make it short')"
            rows={2}
            className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500 resize-none text-sm"
          />
          <div className="text-xs text-slate-500 text-right">{extraInstructionsState.value.length} characters</div>
        </div>
        <button
          onClick={generate}
          disabled={loading || !topicState.value.trim()}
          className="w-full py-3 px-4 bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Description'
          )}
        </button>
        
        {loading && <LoadingState message="Generating description..." />}
        
        {output && !loading && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col gap-3">
            <p className="text-sky-400 leading-relaxed whitespace-pre-wrap text-sm">
              {output}
            </p>
            <CopyButton text={output} />
          </div>
        )}
      </div>
    </div>
  );
}

function ScriptTool() {
  const topicState = useUndoRedoState('');
  const extraInstructionsState = useUndoRedoState('');
  const [length, setLength] = useState('30 seconds');
  const [tone, setTone] = useState('Engaging');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const { templates, saveTemplate, deleteTemplate } = useTemplates('script_writer');

  const generate = async () => {
    if (!topicState.value.trim()) return;
    setOutput('');
    setLoading(true);
    try {
      let prompt = `Write a ${length} viral video script about "${topicState.value}". Tone: ${tone}. Structure the script strictly with three clear sections:\n\nHOOK:\n[Your hook here]\n\nBODY:\n[Your main content here]\n\nCALL TO ACTION:\n[Your CTA here]\n\nDo not use markdown bolding (**), just use the exact capitalized headers above. Keep it concise and formatted clearly.`;
      if (extraInstructionsState.value.trim()) {
        prompt += `\nAdditional instructions: ${extraInstructionsState.value}`;
      }
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setOutput(response.text || '');
    } catch (e) {
      setOutput('Error generating script. Please try again.');
      console.error(e);
    }
    setLoading(false);
  };

  const handleLoadTemplate = (config: any) => {
    if (config.topic !== undefined) topicState.set(config.topic);
    if (config.length !== undefined) setLength(config.length);
    if (config.tone !== undefined) setTone(config.tone);
    if (config.extraInstructions !== undefined) extraInstructionsState.set(config.extraInstructions);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col h-full transition-all hover:border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-lg text-green-500">
          <Video className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">Script Writer</h2>
      </div>
      
      <TemplateSelector 
        templates={templates} 
        onSelect={handleLoadTemplate} 
        onSave={(name) => saveTemplate(name, { topic: topicState.value, length, tone, extraInstructions: extraInstructionsState.value })}
        onDelete={deleteTemplate}
      />
      
      <div className="flex-grow flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-400 pl-1">Topic</span>
            <div className="flex gap-1">
              <button onClick={topicState.undo} disabled={!topicState.canUndo} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Undo"><Undo className="w-3.5 h-3.5" /></button>
              <button onClick={topicState.redo} disabled={!topicState.canRedo} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Redo"><Redo className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <textarea
            value={topicState.value}
            onChange={(e) => topicState.set(e.target.value)}
            placeholder="Enter video topic"
            rows={2}
            className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500 resize-none"
          />
          <div className="text-xs text-slate-500 text-right">{topicState.value.length} characters</div>
        </div>
        <div className="flex gap-3">
          <select 
            value={length} 
            onChange={(e) => setLength(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none cursor-pointer"
          >
            <option value="15 seconds">15s Length</option>
            <option value="30 seconds">30s Length</option>
            <option value="1 minute">1m Length</option>
            <option value="3 minutes">3m Length</option>
            <option value="5 minutes">5m Length</option>
            <option value="10 minutes">10m Length</option>
            <option value="20 minutes">20m Length</option>
            <option value="30 minutes">30m Length</option>
          </select>
          <select 
            value={tone} 
            onChange={(e) => setTone(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none cursor-pointer"
          >
            <option value="Engaging">Engaging</option>
            <option value="Funny">Funny</option>
            <option value="Humorous">Humorous</option>
            <option value="Dramatic">Dramatic</option>
            <option value="Educational">Educational</option>
            <option value="Informative">Informative</option>
            <option value="Inspirational">Inspirational</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-400 pl-1">Extra Instructions</span>
            <div className="flex gap-1">
              <button onClick={extraInstructionsState.undo} disabled={!extraInstructionsState.canUndo} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Undo"><Undo className="w-3.5 h-3.5" /></button>
              <button onClick={extraInstructionsState.redo} disabled={!extraInstructionsState.canRedo} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Redo"><Redo className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <textarea
            value={extraInstructionsState.value}
            onChange={(e) => extraInstructionsState.set(e.target.value)}
            placeholder="Extra instructions (e.g., 'Include a joke about coffee', 'Target audience is beginners')"
            rows={2}
            className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500 resize-none text-sm"
          />
          <div className="text-xs text-slate-500 text-right">{extraInstructionsState.value.length} characters</div>
        </div>
        <button
          onClick={generate}
          disabled={loading || !topicState.value.trim()}
          className="w-full py-3 px-4 bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Script'
          )}
        </button>
        
        {loading && <LoadingState message="Generating script..." />}
        
        {output && !loading && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col gap-3">
            <p className="text-sky-400 leading-relaxed whitespace-pre-wrap text-sm">
              {output}
            </p>
            <CopyButton text={output} />
          </div>
        )}
      </div>
    </div>
  );
}

function TagsTool() {
  const [topic, setTopic] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTopic((prev) => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const generate = async () => {
    if (!topic.trim()) return;
    setOutput('');
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate SEO YouTube tags for ${topic}. Return ONLY the tags separated by commas. Do not include any other text or hashtags.`,
      });
      setOutput(response.text || '');
    } catch (e) {
      setOutput('Error generating tags. Please try again.');
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col h-full transition-all hover:border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-lg text-green-500">
          <Tags className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">YouTube Tags</h2>
      </div>
      
      <div className="flex-grow flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
            placeholder="Enter video topic"
            className="flex-1 p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500"
          />
          <button
            onClick={toggleListening}
            className={`p-3 rounded-xl border transition-all flex items-center justify-center ${
              isListening 
                ? 'bg-red-500/20 border-red-500 text-red-500' 
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-green-500 hover:border-green-500'
            }`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full py-3 px-4 bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Tags'
          )}
        </button>
        
        {loading && <LoadingState message="Generating tags..." />}
        
        {output && !loading && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col gap-3">
            <p className="text-sky-400 leading-relaxed whitespace-pre-wrap font-medium">
              {output}
            </p>
            <CopyButton text={output} />
          </div>
        )}
      </div>
    </div>
  );
}

function IdeaToStoryTool() {
  const [idea, setIdea] = useState('');
  const [genre, setGenre] = useState('Fantasy');
  const [duration, setDuration] = useState('1 min');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!idea.trim()) return;
    setOutput('');
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Turn this basic idea into a captivating, well-written short story that takes about ${duration} to read. Genre: ${genre}. Idea: "${idea}". Make it engaging, descriptive, and creative.`,
      });
      setOutput(response.text || '');
    } catch (e) {
      setOutput('Error generating story. Please try again.');
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col h-full transition-all hover:border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-lg text-green-500">
          <Lightbulb className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">AI Idea to Story</h2>
      </div>
      
      <div className="flex-grow flex flex-col gap-4">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Enter your basic idea..."
          rows={2}
          className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500 resize-none"
        />
        <div className="flex gap-3">
          <select 
            value={genre} 
            onChange={(e) => setGenre(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none cursor-pointer"
          >
            <option value="Fantasy">Fantasy</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Romance">Romance</option>
            <option value="Horror">Horror</option>
            <option value="Mystery">Mystery</option>
            <option value="Slice of Life">Slice of Life</option>
          </select>
          <select 
            value={duration} 
            onChange={(e) => setDuration(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none cursor-pointer"
          >
            <option value="30 seconds">30 seconds</option>
            <option value="1 minute">1 minute</option>
            <option value="3 minutes">3 minutes</option>
            <option value="5 minutes">5 minutes</option>
            <option value="10 minutes">10 minutes</option>
            <option value="20 to 30 minutes">20 to 30 minutes</option>
          </select>
        </div>
        <button
          onClick={generate}
          disabled={loading || !idea.trim()}
          className="w-full py-3 px-4 bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Story'
          )}
        </button>
        
        {loading && <LoadingState message="Generating story..." />}
        
        {output && !loading && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col gap-3">
            <div className="text-sky-400 leading-relaxed whitespace-pre-wrap text-sm max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {output}
            </div>
            <CopyButton text={output} />
          </div>
        )}
      </div>
    </div>
  );
}

function YouTubeHashtagTool() {
  const [topic, setTopic] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setOutput('');
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate SEO-optimized YouTube hashtags for a video about ${topic}. Return ONLY the hashtags separated by spaces, starting with #. Do not include any other text.`,
      });
      setOutput(response.text || '');
    } catch (e) {
      setOutput('Error generating hashtags. Please try again.');
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col h-full transition-all hover:border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-lg text-green-500">
          <Youtube className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">YouTube Hashtags</h2>
      </div>
      
      <div className="flex-grow flex flex-col gap-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
          placeholder="Enter video topic"
          className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500"
        />
        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full py-3 px-4 bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Hashtags'
          )}
        </button>
        
        {loading && <LoadingState message="Generating hashtags..." />}
        
        {output && !loading && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col gap-3">
            <p className="text-sky-400 leading-relaxed whitespace-pre-wrap font-medium">
              {output}
            </p>
            <CopyButton text={output} />
          </div>
        )}
      </div>
    </div>
  );
}

function YouTubeAnalyzerTool() {
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!title.trim() && !desc.trim() && !link.trim()) return;
    setOutput('');
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this YouTube content:

Title: ${title}
Description: ${desc}

1. Rate SEO
2. Suggest better title
3. Suggest hashtags
4. Suggest tags
5. Improve description`,
      });
      setOutput(response.text || '');
    } catch (e) {
      setOutput('Error analyzing video. Please try again.');
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col h-full transition-all hover:border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-lg text-green-500">
          <BarChart className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">YouTube Video Analyzer</h2>
      </div>
      
      <div className="flex-grow flex flex-col gap-4">
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Paste YouTube link (optional)"
          className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter video title"
          className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Paste video description"
          rows={3}
          className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500 resize-none"
        />
        <button
          onClick={generate}
          disabled={loading || (!title.trim() && !desc.trim() && !link.trim())}
          className="w-full py-3 px-4 bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Video'
          )}
        </button>
        
        {loading && <LoadingState message="Analyzing video..." />}
        
        {output && !loading && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col gap-3">
            <div className="text-sky-400 leading-relaxed whitespace-pre-wrap text-sm max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {output}
            </div>
            <CopyButton text={output} />
          </div>
        )}
      </div>
    </div>
  );
}

function ImageGeneratorTool() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageStyle, setImageStyle] = useState('none');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [referenceImage, setReferenceImage] = useState<{data: string, mimeType: string} | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      
      const mimeType = file.type;
      const base64Data = result.split(',')[1];
      setReferenceImage({ data: base64Data, mimeType });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setReferenceImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generate = async () => {
    if (!prompt.trim() && !referenceImage) return;
    setOutput('');
    setLoading(true);
    try {
      const finalPromptText = imageStyle !== 'none' ? `${prompt}, ${imageStyle} style` : prompt;
      
      let contents: any = finalPromptText;
      
      if (referenceImage) {
        contents = {
          parts: [
            {
              inlineData: {
                data: referenceImage.data,
                mimeType: referenceImage.mimeType,
              },
            },
            {
              text: finalPromptText,
            },
          ],
        };
      }
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: contents,
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          }
        }
      });
      
      let imageUrl = '';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (imageUrl) {
        setOutput(imageUrl);
      } else {
        setOutput('error');
      }
    } catch (e) {
      console.error(e);
      setOutput('error');
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!output) return;
    try {
      const base64Data = output.split(',')[1];
      const mimeType = output.split(',')[0].split(':')[1].split(';')[0];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      const blob = new Blob(byteArrays, { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Download failed:', e);
      const link = document.createElement('a');
      link.href = output;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col h-full transition-all hover:border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-lg text-green-500">
          <ImageIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">AI Image Generator</h2>
      </div>
      
      <div className="flex-grow flex flex-col gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          rows={3}
          className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-500 resize-none"
        />
        
        <div className="flex flex-col gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          
          {!previewUrl ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-slate-400 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-6 h-6" />
              <span>Upload Reference Image (Optional)</span>
            </button>
          ) : (
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-600 group">
              <img src={previewUrl} alt="Reference" className="w-full h-full object-contain bg-slate-900/50" />
              <button 
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-slate-900/80 rounded-full text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-slate-900/80 px-3 py-1 rounded-lg text-sm font-medium text-white">Reference Image</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <select 
            value={aspectRatio} 
            onChange={(e) => setAspectRatio(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none cursor-pointer"
          >
            <option value="1:1">1:1 (Square)</option>
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="4:3">4:3 (Standard)</option>
            <option value="3:4">3:4 (Vertical)</option>
          </select>
          
          <select 
            value={imageStyle} 
            onChange={(e) => setImageStyle(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none cursor-pointer"
          >
            <option value="none">No Style</option>
            <option value="photorealistic">Realistic</option>
            <option value="3d render">3D Render</option>
            <option value="anime">Anime</option>
            <option value="cinematic">Cinematic</option>
            <option value="digital art">Digital Art</option>
            <option value="watercolor">Watercolor</option>
            <option value="cyberpunk">Cyberpunk</option>
            <option value="pencil sketch">Sketch</option>
            <option value="oil painting">Oil Painting</option>
            <option value="pop art">Pop Art</option>
            <option value="minimalist">Minimalist</option>
            <option value="neon">Neon</option>
          </select>
        </div>

        <button
          onClick={generate}
          disabled={loading || (!prompt.trim() && !referenceImage)}
          className="w-full py-3 px-4 bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Image'
          )}
        </button>
        
        {loading && <LoadingState message="Creating your image..." />}
        
        {output && !loading && output !== 'error' && (
          <div className="mt-4 rounded-xl overflow-hidden border border-slate-700/50 flex flex-col bg-slate-900/30">
            <img src={output} alt="Generated" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
            <div className="p-3 border-t border-slate-700/50 flex justify-end">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        )}
        {output === 'error' && !loading && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-sm text-center">
            Failed to generate image. Please try a different prompt.
          </div>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full py-2 px-4 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
    >
      {copied ? (
        <>
          <Check className="w-5 h-5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-5 h-5" />
          Copy
        </>
      )}
    </button>
  );
}

function YouTubeThumbnailTool() {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [referenceImage, setReferenceImage] = useState<{data: string, mimeType: string} | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      
      const mimeType = file.type;
      const base64Data = result.split(',')[1];
      setReferenceImage({ data: base64Data, mimeType });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setReferenceImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generate = async () => {
    if (!prompt.trim() && !referenceImage) return;
    setOutput('');
    setLoading(true);
    try {
      const finalPromptText = `Eye-catching YouTube thumbnail, vibrant colors, high contrast, bold composition, highly engaging, ${prompt}`;
      
      let contents: any = finalPromptText;
      
      if (referenceImage) {
        contents = {
          parts: [
            {
              inlineData: {
                data: referenceImage.data,
                mimeType: referenceImage.mimeType,
              },
            },
            {
              text: finalPromptText,
            },
          ],
        };
      }
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: contents,
        config: {
          imageConfig: {
            aspectRatio: '16:9',
          }
        }
      });
      
      let imageUrl = '';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (imageUrl) {
        setOutput(imageUrl);
      } else {
        setOutput('error');
      }
    } catch (e) {
      console.error(e);
      setOutput('error');
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!output) return;
    try {
      const base64Data = output.split(',')[1];
      const mimeType = output.split(',')[0].split(':')[1].split(';')[0];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      const blob = new Blob(byteArrays, { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `thumbnail-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Download failed:', e);
      const link = document.createElement('a');
      link.href = output;
      link.download = `thumbnail-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col h-full transition-all hover:border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-lg text-red-500">
          <Youtube className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">YouTube Thumbnail Generator</h2>
      </div>
      
      <div className="flex-grow flex flex-col gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your video topic for the thumbnail..."
          rows={3}
          className="w-full p-3 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-slate-500 resize-none"
        />
        
        <div className="flex flex-col gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          
          {!previewUrl ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-slate-400 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-6 h-6" />
              <span>Upload Reference Image (Optional)</span>
            </button>
          ) : (
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-600 group">
              <img src={previewUrl} alt="Reference" className="w-full h-full object-cover opacity-50" />
              <button 
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-slate-900/80 rounded-full text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-slate-900/80 px-3 py-1 rounded-lg text-sm font-medium text-white">Reference Image</span>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={generate}
          disabled={loading || (!prompt.trim() && !referenceImage)}
          className="w-full py-3 px-4 bg-red-500 hover:bg-red-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Thumbnail'
          )}
        </button>
        
        {loading && <LoadingState message="Designing thumbnail..." colorClass="text-red-500" bgClass="bg-red-500" />}
        
        {output && !loading && output !== 'error' && (
          <div className="mt-4 rounded-xl overflow-hidden border border-slate-700/50 flex flex-col bg-slate-900/30">
            <img src={output} alt="Generated Thumbnail" className="w-full h-auto object-cover aspect-video" referrerPolicy="no-referrer" />
            <div className="p-3 border-t border-slate-700/50 flex justify-end">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        )}
        {output === 'error' && !loading && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-sm text-center">
            Failed to generate thumbnail. Please try a different prompt.
          </div>
        )}
      </div>
    </div>
  );
}

