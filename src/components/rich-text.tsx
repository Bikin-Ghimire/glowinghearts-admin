'use client'

import { useEffect, useMemo } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'

type Props = {
  value: string            // HTML in
  onChange: (html: string) => void  // HTML out
  placeholder?: string
  className?: string
}

export default function RichTextEditorTiptap({
  value,
  onChange,
  placeholder = 'Write something…',
  className,
}: Props) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https', 'mailto', 'tel'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    [placeholder],
  )

  const editor = useEditor({
    extensions,
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          // editor surface (contenteditable)
          'min-h-[160px] w-full rounded-b-md bg-white p-3 text-zinc-900 outline-none ' +
          'prose prose-sm max-w-none prose-zinc ' +
          'dark:bg-zinc-950 dark:text-zinc-100 dark:prose-invert',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Keep editor content in sync if parent changes it (e.g., when loading existing data)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value != null && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false }) // prevent loop by not emitting update
    }
  }, [value, editor])

  if (!editor) return null

  const btnBase =
    'rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50'
  const btnActive =
    'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
  const group =
    'flex flex-wrap items-center gap-1 rounded-t-md border border-zinc-300 bg-white p-2 text-zinc-800 ' +
    'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
  const sep = 'mx-1 h-5 w-px bg-zinc-300 dark:bg-zinc-700'

  const setOrUnsetLink = () => {
    const prev = editor.getAttributes('link')?.href as string | undefined
    const url = window.prompt('Enter URL (leave empty to remove):', prev ?? '')
    if (url == null) return
    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url.trim() })
        .run()
    }
  }

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className={group}>
        {/* Undo / Redo */}
        <button
          type="button"
          className={btnBase}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          Undo
        </button>
        <button
          type="button"
          className={btnBase}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          Redo
        </button>

        <span className={sep} />

        {/* Inline marks */}
        <button
          type="button"
          className={`${btnBase} ${editor.isActive('bold') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          title="Bold"
        >
          Bold
        </button>
        <button
          type="button"
          className={`${btnBase} ${editor.isActive('italic') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          title="Italic"
        >
          Italic
        </button>
        <button
          type="button"
          className={`${btnBase} ${editor.isActive('underline') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          Underline
        </button>
        <button
          type="button"
          className={`${btnBase} ${editor.isActive('code') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Code"
        >
          Code
        </button>

        <span className={sep} />

        {/* Headings */}
        {[1, 2, 3].map((lvl) => (
          <button
            key={lvl}
            type="button"
            className={`${btnBase} ${editor.isActive('heading', { level: lvl }) ? btnActive : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: lvl as 1 | 2 | 3 }).run()}
            title={`Heading ${lvl}`}
          >
            H{lvl}
          </button>
        ))}
        <button
          type="button"
          className={`${btnBase} ${editor.isActive('paragraph') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Paragraph"
        >
          ¶
        </button>

        <span className={sep} />

        {/* Lists */}
        <button
          type="button"
          className={`${btnBase} ${editor.isActive('bulletList') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          className={`${btnBase} ${editor.isActive('orderedList') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          1. List
        </button>
        <button
          type="button"
          className={`${btnBase} ${editor.isActive('blockquote') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          “ ” 
        </button>

        <span className={sep} />

        {/* Alignment */}
        {(['left', 'center', 'right'] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            className={`${btnBase} ${editor.isActive({ textAlign: dir }) ? btnActive : ''}`}
            onClick={() => editor.chain().focus().setTextAlign(dir).run()}
            title={`Align ${dir}`}
          >
            {dir[0].toUpperCase() + dir.slice(1)}
          </button>
        ))}

        <span className={sep} />

        {/* Link */}
        <button
          type="button"
          className={`${btnBase} ${editor.isActive('link') ? btnActive : ''}`}
          onClick={setOrUnsetLink}
          title="Insert/Edit Link"
        >
          Link
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            className={btnBase}
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
          >
            Unlink
          </button>
        )}
      </div>

      {/* Editor */}
      <div
        className="rounded-md border border-zinc-300 shadow-sm dark:border-zinc-700"
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}