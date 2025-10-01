import React, { useRef, useEffect } from 'react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({ value, onChange, placeholder, minHeight = '60px' }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only update if the content is different to avoid cursor jumps
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };
  
  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput(); // Ensure state is updated after command
  };

  const commandButtons = [
    { cmd: 'bold', label: 'B', style: { fontWeight: 'bold' } as React.CSSProperties },
    { cmd: 'italic', label: 'I', style: { fontStyle: 'italic' } as React.CSSProperties },
    { cmd: 'underline', label: 'U', style: { textDecoration: 'underline' } as React.CSSProperties },
    { cmd: 'insertUnorderedList', label: 'UL', style: {} },
    { cmd: 'insertOrderedList', label: 'OL', style: {} },
  ];

  return (
    <div className="shadow border border-slate-300 dark:border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 bg-slate-50 dark:bg-slate-700">
      <div className="flex items-center space-x-1 p-1 border-b border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 rounded-t-lg">
        {commandButtons.map(({ cmd, label, style }) => (
          <button
            key={cmd}
            type="button"
            // Use onMouseDown to prevent the editor from losing focus
            onMouseDown={(e) => { e.preventDefault(); execCmd(cmd); }}
            className="p-2 w-8 h-8 flex items-center justify-center rounded text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            style={style}
            aria-label={label}
            title={label}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="prose dark:prose-invert max-w-none w-full py-3 px-4 text-slate-900 dark:text-white leading-tight outline-none rounded-b-lg"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default TextEditor;
