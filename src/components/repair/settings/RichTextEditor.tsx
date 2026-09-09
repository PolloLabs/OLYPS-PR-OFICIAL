import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Code,
  Undo,
  Redo,
  Sparkles,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Digite os termos e condições ou conteúdo da folha...',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceMode, setIsSourceMode] = useState<boolean>(false);

  // Sync initial content
  useEffect(() => {
    if (editorRef.current && !isSourceMode) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isSourceMode]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertVariable = (variableTag: string) => {
    if (isSourceMode) {
      onChange((value || '') + variableTag);
    } else {
      execCmd('insertHTML', `<span class="bg-indigo-50 text-indigo-700 font-mono text-xs px-1.5 py-0.5 rounded border border-indigo-200 select-all font-semibold">${variableTag}</span>&nbsp;`);
    }
  };

  const variables = [
    { label: 'Nome do Cliente', tag: '{NOME_CLIENTE}' },
    { label: 'Número da OS', tag: '{NUMERO_OS}' },
    { label: 'Equipamento', tag: '{EQUIPAMENTO}' },
    { label: 'Número de Série', tag: '{NUMERO_SERIE}' },
    { label: 'Data de Entrada', tag: '{DATA_ENTRADA}' },
    { label: 'Valor Final', tag: '{VALOR_TOTAL}' },
    { label: 'Garantia', tag: '{DIAS_GARANTIA}' },
  ];

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="flex items-center flex-wrap gap-1">
          <button
            type="button"
            onClick={() => execCmd('bold')}
            title="Negrito (Ctrl+B)"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 font-bold transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('italic')}
            title="Itálico (Ctrl+I)"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('underline')}
            title="Sublinhado (Ctrl+U)"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Underline className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => execCmd('formatBlock', '<h2>')}
            title="Título H2"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors flex items-center"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('formatBlock', '<h3>')}
            title="Subtítulo H3"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors flex items-center"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            title="Lista com Marcadores"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            title="Lista Numerada"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => execCmd('undo')}
            title="Desfazer"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('redo')}
            title="Refazer"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle */}
        <button
          type="button"
          onClick={() => setIsSourceMode(!isSourceMode)}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border flex items-center gap-1 transition-colors ${
            isSourceMode
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="Alternar entre visualização formatada e código HTML"
        >
          <Code className="w-3.5 h-3.5" />
          <span>{isSourceMode ? 'Visualizar' : 'Código HTML'}</span>
        </button>
      </div>

      {/* Variables Bar */}
      <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-slate-500 font-medium flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          Tags Dinâmicas:
        </span>
        {variables.map((v) => (
          <button
            key={v.tag}
            type="button"
            onClick={() => insertVariable(v.tag)}
            className="px-2 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-mono text-[10px] transition-colors"
            title={`Clique para inserir a tag ${v.tag} no texto`}
          >
            + {v.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {isSourceMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-900 text-slate-100 focus:outline-hidden resize-y min-h-[220px]"
          placeholder={placeholder}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="p-4 min-h-[220px] max-h-[400px] overflow-y-auto text-xs text-slate-800 focus:outline-hidden prose prose-sm max-w-none"
          data-placeholder={placeholder}
        />
      )}
    </div>
  );
};
