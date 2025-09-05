'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { 
  oneLight, 
  oneDark 
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Button } from './button';

type TProps = {
  code: string;
  language?: string;
  theme?: 'light' | 'dark';
  maxHeight?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  wrapLines?: boolean;
  className?: string;
};

export function CodeBlock({
  code,
  language = 'typescript',
  theme = 'light',
  maxHeight = '400px',
  showLineNumbers = true,
  showCopyButton = true,
  wrapLines = false,
  className = ''
}: TProps) {
  const [isCopied, setIsCopied] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }

  const syntaxTheme = theme === 'dark' ? oneDark : oneLight;

  return (
    <div className={`relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {showCopyButton && (
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
            aria-label={isCopied ? 'Copied!' : 'Copy code'}
          >
            {isCopied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      )}
      
      <div 
        className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
        style={{ maxHeight }}
      >
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          showLineNumbers={showLineNumbers}
          wrapLines={wrapLines}
          wrapLongLines={wrapLines}
          customStyle={{
            margin: 0,
            background: 'transparent',
            fontSize: '14px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          }}
          codeTagProps={{
            style: {
              fontSize: '14px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            }
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
