"use client";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import hljs from "highlight.js";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

// Import a custom theme
import "@/styles/hljs-theme.css";

type CodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
};

export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState("");

  useEffect(() => {
    if (language && hljs.getLanguage(language)) {
      try {
        const highlighted = hljs.highlight(code, { language }).value;
        setHighlightedCode(highlighted);
      } catch (_err) {
        setHighlightedCode(code);
      }
    } else {
      const highlighted = hljs.highlightAuto(code).value;
      setHighlightedCode(highlighted);
    }
  }, [code, language]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      // Failed to copy
    }
  };

  return (
    <div className="my-8 rounded-xl bg-[#181818] font-mono text-sm border border-border/50 shadow-lg overflow-hidden group">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#222]">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-xs text-[#b9b9b9] font-sans tracking-tight">
              {filename}
            </span>
          )}
          {!filename && language && (
            <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-[#b9b9b9]">
              {language}
            </span>
          )}
        </div>

        <Button
          onClick={copyToClipboard}
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md hover:bg-muted/10 transition-colors text-[#b9b9b9]"
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <Check className="size-3.5 text-green-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>

      {/* Code Area */}
      <div className="relative">
        <pre className="p-5 overflow-x-auto scrollbar-hide">
          <code
            className={cn("hljs", language)}
            dangerouslySetInnerHTML={{ __html: highlightedCode || code }}
          />
        </pre>
      </div>
    </div>
  );
}
