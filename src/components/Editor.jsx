import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect, useRef, useState, useCallback } from "react";

export default function Editor({ value, onChange }) {
     const isInternalUpdate = useRef(false);
     const [linkModalOpen, setLinkModalOpen] = useState(false);
     const [linkUrl, setLinkUrl] = useState("");
     const [linkText, setLinkText] = useState("");
     const [isEditingLink, setIsEditingLink] = useState(false);
     const urlInputRef = useRef(null);

     const safeValue = typeof value === 'string' ? value : (value?.target?.value || '');

     const editor = useEditor({
          extensions: [
               StarterKit.configure({
                    paragraph: {
                         HTMLAttributes: {
                              class: "editor-paragraph",
                         },
                    },
                    heading: {
                         levels: [1, 2, 3],
                         HTMLAttributes: {},
                    },
                    bulletList: {
                         HTMLAttributes: {
                              class: "editor-bullet-list",
                         },
                    },
                    orderedList: {
                         HTMLAttributes: {
                              class: "editor-ordered-list",
                         },
                    },
               }),
               Link.configure({
                    openOnClick: true,           // Click pe link open ho
                    autolink: true,              // Auto-detect URLs
                    linkOnPaste: true,           // Paste pe auto-link
                    HTMLAttributes: {
                         class: "editor-link",
                         rel: "noopener noreferrer",
                         target: "_blank",
                     },
               }),
          ],

          content: safeValue || "",

          onUpdate: ({ editor }) => {
               isInternalUpdate.current = true;
               if (typeof onChange === 'function') {
                 onChange(editor.getHTML());
               }
          },

          autofocus: false,
     });

     useEffect(() => {
          if (!editor) return;
          if (isInternalUpdate.current) {
               isInternalUpdate.current = false;
               return;
          }
          const currentHTML = editor.getHTML();
          if (safeValue !== currentHTML) {
               editor.commands.setContent(safeValue || "", false, {
                    preserveWhitespace: "full",
               });
          }
     }, [safeValue, editor]);

     // Focus URL input jab modal open ho
     useEffect(() => {
          if (linkModalOpen && urlInputRef.current) {
               setTimeout(() => urlInputRef.current?.focus(), 50);
          }
     }, [linkModalOpen]);

     const openLinkModal = useCallback(() => {
          if (!editor) return;

          const { from, to, empty } = editor.state.selection;
          const existingLink = editor.getAttributes("link").href || "";

          // Agar link already hai to edit mode
          if (existingLink) {
               setLinkUrl(existingLink);
               setLinkText(editor.state.doc.textBetween(from, to, ""));
               setIsEditingLink(true);
          } else {
               // Agar text selected hai to woh pre-fill ho jaye
               const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, "");
               setLinkText(selectedText);
               setLinkUrl("");
               setIsEditingLink(false);
          }

          setLinkModalOpen(true);
     }, [editor]);

     const applyLink = useCallback(() => {
          if (!editor || !linkUrl.trim()) return;

          const url = linkUrl.startsWith("http://") || linkUrl.startsWith("https://")
               ? linkUrl.trim()
               : `https://${linkUrl.trim()}`;

          const { from, to, empty } = editor.state.selection;
          const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, "");
          const displayText = linkText.trim() || selectedText || url;

          if (empty && !selectedText) {
               // Koi selection nahi → naya text insert karo link ke saath
               editor
                    .chain()
                    .focus()
                    .insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${displayText}</a>`)
                    .run();
          } else if (linkText.trim() && linkText.trim() !== selectedText) {
               // Text change kiya → replace selection with new linked text
               editor
                    .chain()
                    .focus()
                    .deleteSelection()
                    .insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${displayText}</a>`)
                    .run();
          } else {
               // Selection hai, sirf link lagao
               editor.chain().focus().setLink({ href: url }).run();
          }

          setLinkModalOpen(false);
          setLinkUrl("");
          setLinkText("");
     }, [editor, linkUrl, linkText]);

     const removeLink = useCallback(() => {
          if (!editor) return;
          editor.chain().focus().unsetLink().run();
          setLinkModalOpen(false);
          setLinkUrl("");
          setLinkText("");
     }, [editor]);

     const handleModalKeyDown = (e) => {
          if (e.key === "Enter") applyLink();
          if (e.key === "Escape") setLinkModalOpen(false);
     };

     if (!editor) return null;

     const ToolbarButton = ({ onClick, isActive, children, title }) => (
          <button
               type="button"
               title={title}
               className={`
        relative inline-flex items-center justify-center
        min-w-8 h-8 px-3
        text-[13px] font-medium tracking-wide
        rounded-md border transition-all duration-150
        select-none cursor-pointer
        ${isActive
                         ? "bg-gray-900 text-white border-gray-900 shadow-inner"
                         : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
                    }
      `}
               onMouseDown={(e) => {
                    e.preventDefault();
                    onClick();
               }}
          >
               {children}
          </button>
     );

     const Divider = () => (
          <div className="w-px h-5 bg-gray-200 self-center mx-1" />
     );

     return (
          <div className="editor-root border border-gray-200 rounded-xl overflow-visible bg-white shadow-sm relative">
               {/* ── Toolbar ── */}
               <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50/80 flex-wrap">
                    {/* Text style */}
                    <ToolbarButton
                         title="Bold (Ctrl+B)"
                         isActive={editor.isActive("bold")}
                         onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                         <BoldIcon />
                    </ToolbarButton>

                    <ToolbarButton
                         title="Italic (Ctrl+I)"
                         isActive={editor.isActive("italic")}
                         onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                         <ItalicIcon />
                    </ToolbarButton>

                    <ToolbarButton
                         title="Strikethrough"
                         isActive={editor.isActive("strike")}
                         onClick={() => editor.chain().focus().toggleStrike().run()}
                    >
                         <StrikeIcon />
                    </ToolbarButton>

                    <ToolbarButton
                         title="Code"
                         isActive={editor.isActive("code")}
                         onClick={() => editor.chain().focus().toggleCode().run()}
                    >
                         <CodeIcon />
                    </ToolbarButton>

                    <Divider />

                    {/* Headings */}
                    <ToolbarButton
                         title="Heading 1"
                         isActive={editor.isActive("heading", { level: 1 })}
                         onClick={() =>
                              editor.chain().focus().toggleHeading({ level: 1 }).run()
                         }
                    >
                         H1
                    </ToolbarButton>

                    <ToolbarButton
                         title="Heading 2"
                         isActive={editor.isActive("heading", { level: 2 })}
                         onClick={() =>
                              editor.chain().focus().toggleHeading({ level: 2 }).run()
                         }
                    >
                         H2
                    </ToolbarButton>

                    <ToolbarButton
                         title="Heading 3"
                         isActive={editor.isActive("heading", { level: 3 })}
                         onClick={() =>
                              editor.chain().focus().toggleHeading({ level: 3 }).run()
                         }
                    >
                         H3
                    </ToolbarButton>

                    <Divider />

                    {/* Lists */}
                    <ToolbarButton
                         title="Bullet List"
                         isActive={editor.isActive("bulletList")}
                         onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                         <BulletIcon />
                    </ToolbarButton>

                    <ToolbarButton
                         title="Numbered List"
                         isActive={editor.isActive("orderedList")}
                         onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                         <OrderedIcon />
                    </ToolbarButton>

                    <Divider />

                    {/* Block */}
                    <ToolbarButton
                         title="Blockquote"
                         isActive={editor.isActive("blockquote")}
                         onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    >
                         <QuoteIcon />
                    </ToolbarButton>

                    <ToolbarButton
                         title="Code Block"
                         isActive={editor.isActive("codeBlock")}
                         onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    >
                         <CodeBlockIcon />
                    </ToolbarButton>

                    <Divider />

                    {/* ── Hyperlink Button ── */}
                    <ToolbarButton
                         title="Insert / Edit Link (Ctrl+K)"
                         isActive={editor.isActive("link")}
                         onClick={openLinkModal}
                    >
                         <LinkIcon />
                    </ToolbarButton>

                    <Divider />

                    {/* Undo / Redo */}
                    <ToolbarButton
                         title="Undo (Ctrl+Z)"
                         isActive={false}
                         onClick={() => editor.chain().focus().undo().run()}
                    >
                         <UndoIcon />
                    </ToolbarButton>

                    <ToolbarButton
                         title="Redo (Ctrl+Y)"
                         isActive={false}
                         onClick={() => editor.chain().focus().redo().run()}
                    >
                         <RedoIcon />
                    </ToolbarButton>
               </div>

               {/* ── Editor content ── */}
               <EditorContent editor={editor} className="editor-content-wrapper" />

               {/* ── Link Modal ── */}
               {linkModalOpen && (
                    <div
                         className="fixed inset-0 z-50 flex items-center justify-center"
                         onMouseDown={(e) => {
                              if (e.target === e.currentTarget) setLinkModalOpen(false);
                         }}
                    >
                         {/* Backdrop */}
                         <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

                         {/* Modal box */}
                         <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-95 max-w-[90vw]">
                              <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
                                   {isEditingLink ? "Edit Link" : "Insert Link"}
                              </h3>

                              {/* Link Text / Title */}
                              <div className="mb-3">
                                   <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                                        Display Text
                                   </label>
                                   <input
                                        type="text"
                                        placeholder="e.g. Google, Click here…"
                                        value={linkText}
                                        onChange={(e) => setLinkText(e.target.value)}
                                        onKeyDown={handleModalKeyDown}
                                        className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all placeholder:text-gray-300"
                                   />
                              </div>

                              {/* URL */}
                              <div className="mb-5">
                                   <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                                        URL <span className="text-red-400">*</span>
                                   </label>
                                   <input
                                        ref={urlInputRef}
                                        type="url"
                                        placeholder="https://example.com"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        onKeyDown={handleModalKeyDown}
                                        className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all placeholder:text-gray-300"
                                   />
                              </div>

                              {/* Buttons */}
                              <div className="flex items-center gap-2">
                                   <button
                                        type="button"
                                        onClick={applyLink}
                                        disabled={!linkUrl.trim()}
                                        className="flex-1 bg-gray-900 text-white text-[13px] font-medium py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                   >
                                        {isEditingLink ? "Update Link" : "Insert Link"}
                                   </button>

                                   {isEditingLink && (
                                        <button
                                             type="button"
                                             onClick={removeLink}
                                             className="text-[13px] font-medium text-red-500 py-2 px-3 rounded-lg hover:bg-red-50 border border-red-200 transition-all"
                                        >
                                             Remove
                                        </button>
                                   )}

                                   <button
                                        type="button"
                                        onClick={() => setLinkModalOpen(false)}
                                        className="text-[13px] font-medium text-gray-500 py-2 px-3 rounded-lg hover:bg-gray-100 transition-all"
                                   >
                                        Cancel
                                   </button>
                              </div>
                         </div>
                    </div>
               )}

               <style>{`
        /* ── Link styles ── */
        .editor-content-wrapper .ProseMirror a.editor-link {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
          transition: color 0.15s;
        }

        .editor-content-wrapper .ProseMirror a.editor-link:hover {
          color: #1d4ed8;
        }

        /* Reset ProseMirror defaults */
        .editor-content-wrapper .ProseMirror {
          outline: none;
          padding: 20px 24px;
          min-height: 200px;
          max-height: 400px;
          overflow-y: auto;
          font-size: 14px;
          line-height: 1.75;
          color: #1a1a1a;
          caret-color: #111;
          margin: 0;
        }

        .editor-content-wrapper .ProseMirror p {
          margin: 0 0 0.75em 0;
          padding: 0;
        }

        .editor-content-wrapper .ProseMirror > *:last-child {
          margin-bottom: 0;
        }

        .editor-content-wrapper .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.25;
          color: #111;
          margin: 1em 0 1em 0;
          padding: 0;
          letter-spacing: -0.02em;
        }

        .editor-content-wrapper .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.3;
          color: #111;
          margin: 0.6em 0 0.6em 0;
          padding: 0;
          letter-spacing: -0.01em;
        }

        .editor-content-wrapper .ProseMirror h3 {
          font-size: 1.1rem;
          font-weight: 600;
          line-height: 1.4;
          color: #222;
          margin: 0.6em 0 0.6em 0;
          padding: 0;
        }

        .editor-content-wrapper .ProseMirror > h1:first-child,
        .editor-content-wrapper .ProseMirror > h2:first-child,
        .editor-content-wrapper .ProseMirror > h3:first-child {
          margin-top: 0;
        }

        .editor-content-wrapper .ProseMirror strong {
          font-weight: 700;
          color: #111;
        }

        .editor-content-wrapper .ProseMirror em {
          font-style: italic;
          color: #333;
        }

        .editor-content-wrapper .ProseMirror s {
          text-decoration: line-through;
          color: #888;
        }

        .editor-content-wrapper .ProseMirror ul,
        .editor-content-wrapper .ProseMirror ol {
          margin: 0 0 0.75em 0;
          padding-left: 1.6em;
        }

        .editor-content-wrapper .ProseMirror ul {
          list-style-type: disc;
        }

        .editor-content-wrapper .ProseMirror ol {
          list-style-type: decimal;
        }

        .editor-content-wrapper .ProseMirror li {
          margin: 0 0 0.25em 0;
          padding-left: 0.25em;
        }

        .editor-content-wrapper .ProseMirror li > ul,
        .editor-content-wrapper .ProseMirror li > ol {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }

        .editor-content-wrapper .ProseMirror li > p {
          margin: 0;
        }

        .editor-content-wrapper .ProseMirror blockquote {
          border-left: 3px solid #d1d5db;
          margin: 0 0 0.75em 0;
          padding: 4px 0 4px 16px;
          color: #555;
          font-style: italic;
        }

        .editor-content-wrapper .ProseMirror blockquote p {
          margin: 0;
        }

        .editor-content-wrapper .ProseMirror code {
          font-size: 0.875em;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 1px 5px;
          color: #c7254e;
        }

        .editor-content-wrapper .ProseMirror pre {
          background: #1e1e2e;
          border-radius: 8px;
          padding: 14px 18px;
          margin: 0 0 0.75em 0;
          overflow-x: auto;
        }

        .editor-content-wrapper .ProseMirror pre code {
          font-size: 0.875em;
          background: none;
          border: none;
          padding: 0;
          color: #cdd6f4;
        }

        .editor-content-wrapper .ProseMirror hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1.25em 0;
        }

        .editor-content-wrapper .ProseMirror.ProseMirror-empty:before {
          content: attr(data-placeholder);
          pointer-events: none;
          float: left;
          height: 0;
          color: #adb5bd;
          font-style: italic;
        }

        .editor-content-wrapper .ProseMirror::-webkit-scrollbar {
          width: 6px;
        }
        .editor-content-wrapper .ProseMirror::-webkit-scrollbar-track {
          background: transparent;
        }
        .editor-content-wrapper .ProseMirror::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 99px;
        }
        .editor-content-wrapper .ProseMirror::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
          </div>
     );
}

/* ── SVG Icons ── */

const BoldIcon = () => (
     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h8a4 4 0 0 1 0 8H6V4zm0 8h9a4 4 0 0 1 0 8H6v-8z" />
     </svg>
);

const ItalicIcon = () => (
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="19" y1="4" x2="10" y2="4" />
          <line x1="14" y1="20" x2="5" y2="20" />
          <line x1="15" y1="4" x2="9" y2="20" />
     </svg>
);

const StrikeIcon = () => (
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="4" y1="12" x2="20" y2="12" />
          <path d="M17.5 6.5C17 5 15.5 4 13 4c-3 0-5 1.5-5 4 0 1.5.8 2.6 2 3.2" />
          <path d="M6.5 17.5C7 19 8.5 20 11 20c3 0 5-1.5 5-4 0-1.5-.8-2.6-2-3.2" />
     </svg>
);

const CodeIcon = () => (
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
     </svg>
);

const BulletIcon = () => (
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
     </svg>
);

const OrderedIcon = () => (
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">1.</text>
          <text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">2.</text>
          <text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">3.</text>
     </svg>
);

const QuoteIcon = () => (
     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
     </svg>
);

const CodeBlockIcon = () => (
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="18" rx="3" />
          <line x1="2" y1="9" x2="22" y2="9" />
          <line x1="8" y1="15" x2="12" y2="15" />
          <line x1="8" y1="12" x2="16" y2="12" />
     </svg>
);

const UndoIcon = () => (
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 7v6h6" />
          <path d="M3 13C5.5 6.5 13 4 19 7.5S22 19 15 20" />
     </svg>
);

const RedoIcon = () => (
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M21 7v6h-6" />
          <path d="M21 13C18.5 6.5 11 4 5 7.5S2 19 9 20" />
     </svg>
);

const LinkIcon = () => (
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
     </svg>
);
