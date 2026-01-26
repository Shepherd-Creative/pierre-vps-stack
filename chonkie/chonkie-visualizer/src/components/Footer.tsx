export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="glass-card border rounded-2xl w-[95%] max-w-[1400px] mx-auto mb-4 mt-8 relative z-10">
      <div className="container mx-auto px-6 py-4 text-center space-y-2">
        <p className="text-xs text-muted-foreground/70">
          Visualize how different chunking strategies split your text for RAG and embedding workflows
        </p>
        <p className="text-sm text-muted-foreground">
          © {year} Chonkie. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
