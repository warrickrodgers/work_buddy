import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';

/** Strip outer ```markdown ... ``` or ``` ... ``` wrappers some LLMs add */
function cleanMarkdown(text: string): string {
  const t = text.trim();
  const wrapped = t.match(/^```(?:markdown)?\s*\n([\s\S]*?)\n```$/);
  return wrapped ? wrapped[1].trim() : t;
}

const assistantComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2.5 last:mb-0 text-sm leading-relaxed text-foreground">{children}</p>
  ),

  h1: ({ children }) => (
    <h1 className="text-base font-bold text-foreground mt-6 mb-2 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-foreground mt-5 mb-2 pb-1.5 border-b border-border first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-accent-foreground mt-4 mb-1.5 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-medium text-muted-foreground mt-3 mb-1 first:mt-0">{children}</h4>
  ),

  ul: ({ children }) => (
    <ul className="list-disc pl-4 mb-2.5 last:mb-0 space-y-1 text-sm marker:text-primary/70">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 mb-2.5 last:mb-0 space-y-1 text-sm marker:text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed text-foreground">{children}</li>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-muted-foreground/90">{children}</em>
  ),

  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-3 border-l-[3px] border-primary/60 text-muted-foreground text-sm italic">
      {children}
    </blockquote>
  ),

  hr: () => <hr className="my-4 border-border" />,

  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),

  code: ({ className, children, ...props }: any) => {
    const isBlock = !!className?.includes('language-');
    if (isBlock) {
      return <code className="text-xs font-mono leading-relaxed">{children}</code>;
    }
    return (
      <code
        className="px-1.5 py-0.5 rounded-md text-xs font-mono bg-muted text-foreground border border-border/50"
        {...props}
      >
        {children}
      </code>
    );
  },

  pre: ({ children }) => (
    <pre className="my-3 p-4 rounded-xl bg-muted text-foreground overflow-x-auto text-xs font-mono leading-relaxed">
      {children}
    </pre>
  ),

  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-foreground border-b border-border">
      {children}
    </th>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
      {children}
    </tr>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-xs text-foreground">{children}</td>
  ),
};

const userComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 text-sm leading-relaxed text-white">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5 text-sm text-white/90 marker:text-white/60">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5 text-sm text-white/90 marker:text-white/60">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-white/80">{children}</em>,
  code: ({ children, ...props }: any) => (
    <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-white/20 text-white" {...props}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 p-3 rounded-lg bg-white/10 overflow-x-auto text-xs font-mono text-white/90">
      {children}
    </pre>
  ),
};

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  className?: string;
}

export function ChatMessage({ content, role, className }: ChatMessageProps) {
  const cleaned = cleanMarkdown(content);
  const components = role === 'user' ? userComponents : assistantComponents;

  return (
    <div className={cn('max-w-none text-foreground', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}

/** Render arbitrary user-entered markdown content (descriptions, criteria, metrics, etc.) */
export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('max-w-none', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={assistantComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
