"use client"

import { useState, useEffect, useRef } from "react";

interface ImageGeneratorProps {
    generateImage: (
        text: string
    ) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
}

export default function ImageGenerator({ generateImage }: ImageGeneratorProps) {
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previousPrompts, setPreviousPrompts] = useState<string[]>([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false); // For clipboard feedback

    const menuRef = useRef<HTMLDivElement>(null);

    // Close the menu when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement; // Cast to HTMLElement
          if (menuRef.current && !menuRef.current.contains(target) && !target.closest('.hamburger')) {
            setMenuOpen(false); // Close the menu if clicked outside and not on the hamburger
          }
      };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setImageUrl(null);
        setError(null);

        try {
            const data = await generateImage(inputText);

            if(!data.success) {
                throw new Error(data.error || "Failed to generate image");
            }

            if (data.imageUrl) {
                const img = new Image();
                const url = data.imageUrl;
                img.onload = () => {
                    setImageUrl(url);
                };
                img.src = url;
            } else {
                throw new Error("No image URL received");
            }

            setPreviousPrompts([inputText, ...previousPrompts]);
            setInputText("");
        } catch (error) {
            console.error("Error:", error);
            setError(
                error instanceof Error ? error.message : "Failed to generate image"
            );
        } finally {
            setIsLoading(false);
        }
};

const handleShare = () => {
    if (imageUrl) {
      navigator.clipboard.writeText(imageUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset the "copied" state after 2 seconds
      }).catch((error) => {
        console.error("Error copying to clipboard", error);
      });
    }
  };

return (
    <div className="min-h-screen flex flex-col justify-between items-center p-8 bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <header className="w-full text-center mb-8 flex items-center justify-center relative">
        {/* Hamburger Menu (Fixed to Left) */}
        <div
          className={`hamburger absolute left-4 cursor-pointer transform transition-transform duration-300 ${menuOpen ? 'rotate-45' : ''}`}
          onClick={() => setMenuOpen(prev => !prev)} // Toggle the menu when clicked
        >
          <div className={`w-6 h-0.5 bg-white mb-1 transform transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
          <div className={`w-6 h-0.5 bg-white mb-1 transform transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></div>
          <div className={`w-6 h-0.5 bg-white transform transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
        </div>

        {/* Title Centered */}
        <div className="flex-1">
          <h1 className="text-4xl font-Sora font-bold text-cyan-400">Artiflex</h1>
          <p className="text-lg font-Sora text-gray-400">Turning your imagination into a reality</p>
        </div>

        {/* Share Button (Top Right) */}
        {imageUrl && (
          <button
            onClick={handleShare}
            className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-Sora font-bold rounded-lg shadow-lg hover:from-cyan-400 hover:to-blue-400 transition-transform transform hover:scale-105"
          >
            {copied ? 'Link Copied!' : 'Share'}
          </button>
        )}
      </header>

      {/* Backdrop when Sidebar is Open */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={() => setMenuOpen(false)} // Close on backdrop click
        />
      )}

      {/* Sidebar (Menu) */}
      <div
        ref={menuRef}
        className={`fixed top-0 left-0 w-64 h-full bg-gray-800 text-white shadow-lg z-50 transform transition-transform ease-in-out duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4">
          {/* Prompt History Text */}
          <h2 className="text-2xl font-bold font-Sora text-cyan-400">Prompt History</h2>

          {/* X icon to close the menu */}
          <div
            className="cursor-pointer text-3xl text-white"
            onClick={() => setMenuOpen(false)} // Close the menu when clicked
          >
            &times;
          </div>
        </div>

        <div className="p-4">
          <ul className="space-y-2">
            {previousPrompts.map((prompt, index) => (
              <li key={index} className="border-b font-Sora border-gray-700 py-2">{prompt}</li>
            ))}
          </ul>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center gap-8">
        {error && (
          <div className="w-full max-w-2xl p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 dark:bg-red-900 dark:text-red-100">
            {error}
          </div>
        )}

        {imageUrl && (
          <div className="w-full max-w-2xl rounded-lg overflow-hidden shadow-lg">
            <img
              src={imageUrl}
              alt="Generated Image"
              className="w-full h-full"
            />
          </div>
        )}
      </main>

      <footer className="w-full max-w-4xl mx-auto mt-8">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 p-4 font-Sora rounded-lg bg-black/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400"
              placeholder="Tell me your imagination..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-Sora font-bold shadow-lg hover:from-cyan-400 hover:to-blue-400 transition-transform transform hover:scale-105 disabled:opacity-50"
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}

