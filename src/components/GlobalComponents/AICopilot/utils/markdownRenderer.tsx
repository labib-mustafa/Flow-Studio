import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from '../../../../stores/toastStore';

export const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Code copied to clipboard');
  };

  return (
    <div className="my-2.5 rounded-xl bg-[#101012] text-zinc-200 font-mono text-[11px] overflow-hidden border border-zinc-800 shadow-xs max-w-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161618] border-b border-zinc-800 text-[10px] text-zinc-400">
        <span className="font-semibold uppercase tracking-wider">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-zinc-200" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-zinc-200 leading-relaxed font-mono custom-scrollbar text-[11px]">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const parseInlineStyles = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 bg-[#1c1c1f] text-zinc-200 border border-zinc-800/80 rounded font-mono text-[11px] break-all"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

export const renderTextAndTables = (text: string, keyPrefix: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[] = [];

  const flushTable = (idx: number) => {
    if (tableRows.length === 0) return;
    const rows = [...tableRows];
    tableRows = [];

    const validRows = rows.filter(r => !/^\|?[\s-:]+\|[\s-:|]+$/.test(r.trim()));
    if (validRows.length === 0) return;

    const headerRow = validRows[0].split('|').map(c => c.trim()).filter(Boolean);
    const dataRows = validRows.slice(1).map(r => r.split('|').map(c => c.trim()).filter(Boolean));

    elements.push(
      <div key={`${keyPrefix}-table-${idx}`} className="my-2 overflow-x-auto rounded-xl border border-zinc-800 bg-[#121214] shadow-2xs max-w-full custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          {headerRow.length > 0 && (
            <thead>
              <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-200 font-semibold text-[11px]">
                {headerRow.map((h, hIdx) => (
                  <th key={hIdx} className="px-3 py-2 whitespace-nowrap">{parseInlineStyles(h)}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-zinc-800/60">
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-900/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-1.5 text-zinc-300 whitespace-nowrap">{parseInlineStyles(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  lines.forEach((line, lineIdx) => {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      tableRows.push(line);
      return;
    } else if (tableRows.length > 0) {
      flushTable(lineIdx);
    }

    if (line.startsWith('### ')) {
      elements.push(<h4 key={`${keyPrefix}-h3-${lineIdx}`} className="font-semibold text-xs text-white mt-2 mb-1">{line.replace('### ', '')}</h4>);
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={`${keyPrefix}-h2-${lineIdx}`} className="font-semibold text-sm text-white mt-2.5 mb-1">{line.replace('## ', '')}</h3>);
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={`${keyPrefix}-h1-${lineIdx}`} className="font-semibold text-base text-white mt-3 mb-1.5">{line.replace('# ', '')}</h2>);
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const textContent = line.replace(/^[-*]\s+/, '');
      elements.push(
        <div key={`${keyPrefix}-list-${lineIdx}`} className="flex items-start gap-1.5 my-0.5 ml-1">
          <span className="text-zinc-500 mt-0.5 shrink-0">•</span>
          <span className="leading-relaxed flex-1 min-w-0 text-zinc-300">{parseInlineStyles(textContent)}</span>
        </div>
      );
      return;
    }

    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`${keyPrefix}-num-${lineIdx}`} className="flex items-start gap-1.5 my-0.5 ml-1">
          <span className="text-zinc-500 font-semibold min-w-[14px] text-[11px] shrink-0">{numMatch[1]}.</span>
          <span className="leading-relaxed flex-1 min-w-0 text-zinc-300">{parseInlineStyles(numMatch[2])}</span>
        </div>
      );
      return;
    }

    if (!line.trim()) {
      elements.push(<div key={`${keyPrefix}-empty-${lineIdx}`} className="h-1.5" />);
      return;
    }

    elements.push(<p key={`${keyPrefix}-p-${lineIdx}`} className="my-0.5 leading-relaxed text-zinc-300">{parseInlineStyles(line)}</p>);
  });

  if (tableRows.length > 0) {
    flushTable(lines.length);
  }

  return elements;
};

export const renderFormattedContent = (content: string) => {
  if (!content) return null;
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      const textBefore = content.substring(lastIndex, matchIndex);
      parts.push(renderTextAndTables(textBefore, `pre-${lastIndex}`));
    }

    const language = match[1] || '';
    const code = match[2];
    parts.push(<CodeBlock key={`code-${matchIndex}`} code={code} language={language} />);
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    parts.push(renderTextAndTables(remainingText, `post-${lastIndex}`));
  }

  return parts;
};
