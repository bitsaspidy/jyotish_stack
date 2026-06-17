'use client';
import { useEffect, useRef, useState } from 'react';

// Dependency-free WYSIWYG editor (WordPress-style) built on contentEditable +
// document.execCommand. Visual / HTML toggle mirrors WordPress's Visual / Text tabs.
// Controlled via `value` / `onChange` (onChange receives the HTML string).

const GOLD = '#D4AF37';
const BORDER = 'rgba(212,175,55,0.18)';

function Btn({ onCmd, title, children, wide }) {
  return (
    <button
      type="button"
      title={title}
      // preventDefault keeps the editor selection/focus so execCommand applies to it
      onMouseDown={(e) => { e.preventDefault(); onCmd(); }}
      style={{
        minWidth: wide ? 'auto' : 28, height:28, padding: wide ? '0 8px' : 0,
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        background:'transparent', border:'1px solid transparent', borderRadius:5,
        color:'rgba(245,240,232,0.75)', fontSize:13, cursor:'pointer', lineHeight:1,
        transition:'all 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background='rgba(212,175,55,0.12)'; e.currentTarget.style.borderColor=BORDER; }}
      onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; }}
    >
      {children}
    </button>
  );
}

const Sep = () => <span style={{ width:1, height:20, background:'rgba(255,255,255,0.1)', margin:'0 3px' }} />;

export default function RichTextEditor({ value = '', onChange, minHeight = 240, placeholder = 'Write here…' }) {
  const ref = useRef(null);
  const [mode, setMode] = useState('visual'); // 'visual' | 'html'

  // Push external value (template applied, signature loaded) into the editor —
  // but only when it actually differs, so typing isn't interrupted / cursor kept.
  useEffect(() => {
    if (mode !== 'visual') return;
    const el = ref.current;
    if (el && el.innerHTML !== (value || '')) el.innerHTML = value || '';
  }, [value, mode]);

  const emit = () => { if (ref.current) onChange(ref.current.innerHTML); };

  const exec = (cmd, arg) => {
    document.execCommand(cmd, false, arg);
    emit();
  };

  const format = (tag) => exec('formatBlock', tag);

  const addLink = () => {
    const url = window.prompt('Link URL:', 'https://');
    if (url) exec('createLink', url);
  };

  const setColor = (e) => exec('foreColor', e.target.value);

  return (
    <div style={{ border:`1px solid ${BORDER}`, borderRadius:8, overflow:'hidden', background:'#0D0F1E' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:2, flexWrap:'wrap', padding:'6px 8px', borderBottom:`1px solid ${BORDER}`, background:'rgba(255,255,255,0.02)' }}>
        {mode === 'visual' ? (
          <>
            <select
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => { format(e.target.value); e.target.selectedIndex = 0; }}
              defaultValue=""
              title="Paragraph format"
              style={{ height:28, background:'#0D0F1E', color:'rgba(245,240,232,0.8)', border:`1px solid ${BORDER}`, borderRadius:5, fontSize:12, padding:'0 6px', cursor:'pointer', outline:'none' }}
            >
              <option value="" disabled>Format</option>
              <option value="<p>">Paragraph</option>
              <option value="<h1>">Heading 1</option>
              <option value="<h2>">Heading 2</option>
              <option value="<h3>">Heading 3</option>
              <option value="<blockquote>">Quote</option>
            </select>
            <Sep />
            <Btn title="Bold"          onCmd={() => exec('bold')}><b>B</b></Btn>
            <Btn title="Italic"        onCmd={() => exec('italic')}><i>I</i></Btn>
            <Btn title="Underline"     onCmd={() => exec('underline')}><u>U</u></Btn>
            <Btn title="Strikethrough" onCmd={() => exec('strikeThrough')}><s>S</s></Btn>
            <label title="Text color" onMouseDown={(e) => e.preventDefault()} style={{ width:28, height:28, display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' }}>
              <span style={{ color:'rgba(245,240,232,0.75)', fontSize:13, borderBottom:'3px solid #D4AF37', lineHeight:1 }}>A</span>
              <input type="color" onChange={setColor} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }} />
            </label>
            <Sep />
            <Btn title="Bullet list"   onCmd={() => exec('insertUnorderedList')}>•</Btn>
            <Btn title="Numbered list" onCmd={() => exec('insertOrderedList')}>1.</Btn>
            <Sep />
            <Btn title="Align left"    onCmd={() => exec('justifyLeft')}>⬅</Btn>
            <Btn title="Align center"  onCmd={() => exec('justifyCenter')}>⬌</Btn>
            <Btn title="Align right"   onCmd={() => exec('justifyRight')}>➡</Btn>
            <Sep />
            <Btn title="Insert link"   onCmd={addLink}>🔗</Btn>
            <Btn title="Remove link"   onCmd={() => exec('unlink')}>⛓️‍💥</Btn>
            <Btn title="Clear formatting" onCmd={() => exec('removeFormat')}>🧹</Btn>
          </>
        ) : (
          <span style={{ color:'rgba(245,240,232,0.45)', fontSize:11, padding:'4px 6px' }}>Raw HTML — edit the source directly</span>
        )}

        {/* Visual / HTML toggle */}
        <div style={{ marginLeft:'auto', display:'flex', gap:1, background:'rgba(255,255,255,0.04)', borderRadius:6, padding:2 }}>
          {['visual','html'].map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              padding:'4px 10px', borderRadius:4, fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
              background: mode===m ? 'rgba(212,175,55,0.18)' : 'transparent',
              color: mode===m ? GOLD : 'rgba(245,240,232,0.45)',
            }}>
              {m === 'visual' ? '✎ Visual' : '</> HTML'}
            </button>
          ))}
        </div>
      </div>

      {/* Editor surface */}
      {mode === 'visual' ? (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          data-placeholder={placeholder}
          className="rte-surface"
          style={{
            minHeight, maxHeight:460, overflowY:'auto', padding:'14px 16px',
            background:'#ffffff', color:'#1a1a2e', fontSize:14, lineHeight:1.7,
            fontFamily:'Georgia, serif', outline:'none',
          }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          style={{
            width:'100%', boxSizing:'border-box', minHeight, maxHeight:460,
            background:'#0D0F1E', color:'#9FE88D', border:'none', padding:'12px 16px',
            fontSize:12.5, lineHeight:1.65, fontFamily:'monospace', outline:'none', resize:'vertical',
          }}
        />
      )}

      <style>{`
        .rte-surface:empty:before { content: attr(data-placeholder); color:#9aa0b5; font-style:italic; }
        .rte-surface a { color:#1a56db; }
        .rte-surface h1 { font-size:24px; margin:8px 0; }
        .rte-surface h2 { font-size:20px; margin:8px 0; }
        .rte-surface h3 { font-size:17px; margin:6px 0; }
        .rte-surface blockquote { border-left:3px solid #D4AF37; margin:8px 0; padding:4px 14px; color:#555; }
        .rte-surface ul, .rte-surface ol { padding-left:24px; margin:6px 0; }
        .rte-surface img { max-width:100%; height:auto; }
      `}</style>
    </div>
  );
}
