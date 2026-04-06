/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Send, 
  Loader2, 
  Image as ImageIcon, 
  Type as TypeIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { generateSocialPosts, generatePlatformImage, SocialContent } from "./lib/gemini";

// Extend window for AI Studio methods
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type Tone = "professional" | "witty" | "urgent";
type ImageSize = "1K" | "2K" | "4K";

interface PlatformResult {
  platform: "linkedin" | "twitter" | "instagram";
  content: string;
  imageUrl: string;
  loading: boolean;
  error?: string;
}

export default function App() {
  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [imageSize, setImageSize] = useState<ImageSize>("1K");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Record<string, PlatformResult>>({
    linkedin: { platform: "linkedin", content: "", imageUrl: "", loading: false },
    twitter: { platform: "twitter", content: "", imageUrl: "", loading: false },
    instagram: { platform: "instagram", content: "", imageUrl: "", loading: false },
  });
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success as per guidelines
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    if (!hasApiKey) {
      await handleOpenKeySelector();
    }

    setIsGenerating(true);
    
    // Reset results
    setResults({
      linkedin: { platform: "linkedin", content: "", imageUrl: "", loading: true },
      twitter: { platform: "twitter", content: "", imageUrl: "", loading: true },
      instagram: { platform: "instagram", content: "", imageUrl: "", loading: true },
    });

    try {
      // 1. Generate text content for all platforms
      const textContent = await generateSocialPosts(idea, tone);
      
      // Update text content immediately
      setResults(prev => ({
        linkedin: { ...prev.linkedin, content: textContent.linkedin },
        twitter: { ...prev.twitter, content: textContent.twitter },
        instagram: { ...prev.instagram, content: textContent.instagram },
      }));

      // 2. Generate images for each platform in parallel
      const platforms: Array<"linkedin" | "twitter" | "instagram"> = ["linkedin", "twitter", "instagram"];
      const aspectRatios = {
        linkedin: "16:9",
        twitter: "16:9",
        instagram: "1:1"
      };

      await Promise.all(platforms.map(async (platform) => {
        try {
          const imageUrl = await generatePlatformImage(idea, platform, aspectRatios[platform], imageSize);
          setResults(prev => ({
            ...prev,
            [platform]: { ...prev[platform], imageUrl, loading: false }
          }));
        } catch (error) {
          console.error(`Error generating image for ${platform}:`, error);
          setResults(prev => ({
            ...prev,
            [platform]: { ...prev[platform], loading: false, error: "Image generation failed" }
          }));
        }
      }));

    } catch (error) {
      console.error("Generation error:", error);
      // Handle overall failure
      setResults(prev => {
        const newResults = { ...prev };
        Object.keys(newResults).forEach(key => {
          newResults[key].loading = false;
          newResults[key].error = "Generation failed. Please try again.";
        });
        return newResults;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const tones: { id: Tone; label: string; icon: string }[] = [
    { id: "professional", label: "Professional", icon: "💼" },
    { id: "witty", label: "Witty", icon: "✨" },
    { id: "urgent", label: "Urgent", icon: "🔥" },
  ];

  const imageSizes: ImageSize[] = ["1K", "2K", "4K"];

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-[#1A1A1A] text-white p-2 rounded-lg">
                <Sparkles size={24} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">SocialGenie</h1>
            </div>
            <p className="text-[#9E9E9E] max-w-md">
              Generate cross-platform social media content and high-quality images in seconds.
            </p>
          </div>
          
          {!hasApiKey && (
            <button 
              onClick={handleOpenKeySelector}
              className="flex items-center gap-2 bg-white border border-[#E5E5E5] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#F0F0F0] transition-colors"
            >
              <Key size={16} />
              Connect API Key
            </button>
          )}
        </header>

        {/* Input Section */}
        <section className="bg-white rounded-[24px] p-8 shadow-sm border border-[#E5E5E5] mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#9E9E9E] mb-3">
                  Your Idea
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="e.g. A new sustainable coffee brand launching in Brooklyn..."
                  className="w-full h-32 p-4 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs uppercase tracking-wider font-bold text-[#9E9E9E] mb-3">
                    Tone
                  </label>
                  <div className="flex gap-2">
                    {tones.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                          tone === t.id 
                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                            : "bg-white text-[#1A1A1A] border-[#E5E5E5] hover:border-[#1A1A1A]"
                        }`}
                      >
                        <span className="mr-1">{t.icon}</span> {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <label className="block text-xs uppercase tracking-wider font-bold text-[#9E9E9E] mb-3">
                    Image Quality
                  </label>
                  <div className="flex gap-2">
                    {imageSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setImageSize(size)}
                        className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                          imageSize === size 
                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                            : "bg-white text-[#1A1A1A] border-[#E5E5E5] hover:border-[#1A1A1A]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end items-center lg:items-end">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !idea.trim()}
                className="w-full lg:w-auto bg-[#1A1A1A] text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/10"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Generating Magic...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Generate Content
                  </>
                )}
              </button>
              <p className="mt-4 text-xs text-[#9E9E9E] text-center lg:text-right">
                Generating text with Gemini 3.1 Pro & images with Gemini 3.1 Flash Image
              </p>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlatformCard 
            platform="linkedin" 
            icon={<Linkedin size={20} />} 
            result={results.linkedin} 
          />
          <PlatformCard 
            platform="twitter" 
            icon={<Twitter size={20} />} 
            result={results.twitter} 
          />
          <PlatformCard 
            platform="instagram" 
            icon={<Instagram size={20} />} 
            result={results.instagram} 
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-[#E5E5E5] text-center">
        <p className="text-xs text-[#9E9E9E] uppercase tracking-widest font-medium">
          Powered by Google Gemini AI • SocialGenie 2026
        </p>
      </footer>
    </div>
  );
}

function PlatformCard({ 
  platform, 
  icon, 
  result 
}: { 
  platform: string; 
  icon: React.ReactNode; 
  result: PlatformResult 
}) {
  const platformNames = {
    linkedin: "LinkedIn",
    twitter: "Twitter / X",
    instagram: "Instagram"
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-[#E5E5E5] flex flex-col h-full"
    >
      <div className="p-5 border-bottom border-[#F5F5F5] flex items-center justify-between bg-[#F9F9F9]">
        <div className="flex items-center gap-3">
          <div className="bg-[#1A1A1A] text-white p-2 rounded-lg">
            {icon}
          </div>
          <span className="font-bold text-sm uppercase tracking-tight">
            {platformNames[platform as keyof typeof platformNames]}
          </span>
        </div>
        {result.content && !result.loading && (
          <CheckCircle2 size={18} className="text-green-500" />
        )}
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Content Area */}
        <div className="min-h-[150px]">
          {result.loading && !result.content ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-8">
              <Loader2 className="animate-spin text-[#9E9E9E]" size={24} />
              <p className="text-xs text-[#9E9E9E] font-medium uppercase tracking-widest">
                Drafting post...
              </p>
            </div>
          ) : result.content ? (
            <div className="prose prose-sm max-w-none text-[#333] leading-relaxed">
              <ReactMarkdown>{result.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-2 opacity-20 grayscale">
              <TypeIcon size={32} />
              <p className="text-xs font-bold uppercase tracking-widest">No content yet</p>
            </div>
          )}
        </div>

        {/* Image Area */}
        <div className="relative aspect-square md:aspect-video lg:aspect-square bg-[#F9F9F9] rounded-xl overflow-hidden border border-[#F0F0F0]">
          {result.loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#E5E5E5] border-t-[#1A1A1A] rounded-full animate-spin" />
              <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-widest">
                Generating Visual...
              </p>
            </div>
          ) : result.imageUrl ? (
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={result.imageUrl} 
              alt={`${platform} post visual`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : result.error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2 text-[#FF4444]">
              <AlertCircle size={24} />
              <p className="text-xs font-bold uppercase tracking-widest">{result.error}</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 opacity-20 grayscale">
              <ImageIcon size={32} />
              <p className="text-xs font-bold uppercase tracking-widest">Visual will appear here</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-[#F9F9F9] border-t border-[#F5F5F5] flex justify-end">
        <button 
          disabled={!result.content}
          className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] hover:text-[#1A1A1A] transition-colors disabled:opacity-30"
          onClick={() => {
            navigator.clipboard.writeText(result.content);
            // Could add a toast here
          }}
        >
          Copy Text
        </button>
      </div>
    </motion.div>
  );
}
