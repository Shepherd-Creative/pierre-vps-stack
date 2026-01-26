'use client';

import { FileText, GitCompare } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  showComparison?: boolean;
  onToggleComparison?: () => void;
}

export function Header({ showComparison = false, onToggleComparison }: HeaderProps) {
  return (
    <header className="sticky top-4 z-50 glass-card border rounded-2xl w-[95%] max-w-[1400px] mx-auto">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo/Title */}
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Chonkie Visualizer</h1>
          </div>

          {/* Center: Tagline */}
          <p className="text-xs text-muted-foreground/70 flex-1 text-center">
            Visualize how different chunking strategies split your text for RAG and embedding workflows
          </p>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {onToggleComparison && (
              <button
                onClick={onToggleComparison}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showComparison
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary'
                }`}
              >
                <GitCompare className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {showComparison ? 'Single View' : 'Compare'}
                </span>
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
