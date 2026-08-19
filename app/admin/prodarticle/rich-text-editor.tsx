"use client";

import { Placeholder } from "@tiptap/extensions";
import TiptapImage from "@tiptap/extension-image";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import NextImage from "next/image";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bold,
  Check,
  FileImage,
  GalleryHorizontal,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  LoaderCircle,
  Quote,
  Redo2,
  RemoveFormatting,
  Search,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import type { ArticleImage } from "@/lib/articles";
import {
  type CompressedImage,
  MAX_IMAGE_BYTES,
  compressToWebp,
  formatBytes,
  uploadArticleImage,
} from "./image-processing";

type RichTextEditorProps = {
  images: ArticleImage[];
  name: string;
  initialContent?: string;
  onChange?: (content: string) => void;
  onImageUploaded: (image: ArticleImage) => void;
};

function markdownToHtml(content: string): string {
  if (!content) return "<p></p>";
  if (/^<[a-z][\s\S]*>/i.test(content.trim())) return content;

  const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const parseInline = (text: string) => {
    return escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
      .replace(/!\[([^\]]*)\]\((\/image\/[^)\s]+)\)/g, '<img src="$2" alt="$1" class="prod-rich-inline-image" />');
  };

  const lines = content.replaceAll("\r\n", "\n").split("\n\n");
  const htmlBlocks: string[] = [];

  for (const block of lines) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("### ")) {
      htmlBlocks.push(`<h3>${parseInline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      htmlBlocks.push(`<h2>${parseInline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("> ")) {
      const quoteText = trimmed.split("\n").map((l) => l.replace(/^>\s?/, "")).join("<br/>");
      htmlBlocks.push(`<blockquote><p>${parseInline(quoteText)}</p></blockquote>`);
    } else if (trimmed.startsWith("- ")) {
      const items = trimmed.split("\n").map((l) => l.replace(/^-\s?/, "")).map((item) => `<li><p>${parseInline(item)}</p></li>`).join("");
      htmlBlocks.push(`<ul>${items}</ul>`);
    } else if (/^\d+\.\s/.test(trimmed)) {
      const items = trimmed.split("\n").map((l) => l.replace(/^\d+\.\s?/, "")).map((item) => `<li><p>${parseInline(item)}</p></li>`).join("");
      htmlBlocks.push(`<ol>${items}</ol>`);
    } else if (/^!\[([^\]]*)\]\((\/image\/[^)\s]+)\)$/.test(trimmed)) {
      const match = trimmed.match(/^!\[([^\]]*)\]\((\/image\/[^)\s]+)\)$/);
      if (match) {
        htmlBlocks.push(`<img src="${match[2]}" alt="${escapeHtml(match[1])}" class="prod-rich-inline-image" />`);
      }
    } else {
      const paraText = trimmed.split("\n").join("<br/>");
      htmlBlocks.push(`<p>${parseInline(paraText)}</p>`);
    }
  }

  return htmlBlocks.join("") || "<p></p>";
}

type ToolbarButtonProps = {
  label: string;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  opensDialog?: boolean;
  onClick: () => void;
};

function ToolbarButton({ label, children, active = false, disabled = false, opensDialog = false, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={active ? "is-active" : undefined}
      aria-pressed={active}
      aria-haspopup={opensDialog ? "dialog" : undefined}
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function childMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replaceAll("\u00a0", " ").replaceAll("\u200B", "");
  }
  if (!(node instanceof HTMLElement)) return "";

  const content = Array.from(node.childNodes).map(childMarkdown).join("");
  const wrapInline = (marker: string) => {
    const leadingSpace = content.match(/^\s*/)?.[0] ?? "";
    const trailingSpace = content.match(/\s*$/)?.[0] ?? "";
    const value = content.trim();
    return value ? `${leadingSpace}${marker}${value}${marker}${trailingSpace}` : content;
  };
  switch (node.tagName) {
    case "BR":
      return "\n";
    case "STRONG":
    case "B":
      return wrapInline("**");
    case "EM":
    case "I":
      return wrapInline("*");
    case "A": {
      const href = node.getAttribute("href")?.trim() ?? "";
      const safeHref = /^(https?:\/\/|mailto:|\/|#)/i.test(href) ? href : "";
      const leadingSpace = content.match(/^\s*/)?.[0] ?? "";
      const trailingSpace = content.match(/\s*$/)?.[0] ?? "";
      return safeHref && content.trim()
        ? `${leadingSpace}[${content.trim()}](${safeHref})${trailingSpace}`
        : content;
    }
    case "IMG": {
      const src = node.getAttribute("src")?.trim() ?? "";
      if (!/^\/image\/\d{6}\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(src)) return "";
      const alt = (node.getAttribute("alt") ?? "Article image").replaceAll("]", "").trim();
      return `![${alt}](${src})`;
    }
    default:
      return content;
  }
}

function blockMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return childMarkdown(node).trim();
  if (!(node instanceof HTMLElement)) return "";

  const content = childMarkdown(node).trim();
  switch (node.tagName) {
    case "H2":
      return content ? `## ${content}` : "";
    case "H3":
      return content ? `### ${content}` : "";
    case "BLOCKQUOTE":
      return content ? content.split("\n").map((line) => `> ${line}`).join("\n") : "";
    case "UL":
      return Array.from(node.children)
        .filter((child) => child.tagName === "LI")
        .map((child) => `- ${childMarkdown(child).trim()}`)
        .filter((item) => item.length > 2)
        .join("\n");
    case "OL":
      return Array.from(node.children)
        .filter((child) => child.tagName === "LI")
        .map((child, index) => `${index + 1}. ${childMarkdown(child).trim()}`)
        .filter((item) => !/^\d+\.\s*$/.test(item))
        .join("\n");
    default:
      return content;
  }
}

function editorToMarkdown(editor: HTMLElement) {
  const blocks: string[] = [];
  let inlineNodes: Node[] = [];
  const flushInlineNodes = () => {
    const content = inlineNodes.map(childMarkdown).join("").trim();
    if (content) blocks.push(content);
    inlineNodes = [];
  };

  for (const node of Array.from(editor.childNodes)) {
    const isBlock = node instanceof HTMLElement
      && ["P", "DIV", "H2", "H3", "BLOCKQUOTE", "UL", "OL", "IMG"].includes(node.tagName);
    if (isBlock) {
      flushInlineNodes();
      const content = blockMarkdown(node);
      if (content) blocks.push(content);
    } else {
      inlineNodes.push(node);
    }
  }
  flushInlineNodes();

  return blocks
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function RichTextEditor({ images, name, initialContent, onChange, onImageUploaded }: RichTextEditorProps) {
  const [content, setContent] = useState(initialContent ?? "");
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [sourceMode, setSourceMode] = useState<"upload" | "gallery">("upload");
  const [galleryQuery, setGalleryQuery] = useState("");
  const [compressed, setCompressed] = useState<CompressedImage | null>(null);
  const [imageState, setImageState] = useState<"idle" | "compressing" | "ready" | "uploading" | "error">("idle");
  const [imageMessage, setImageMessage] = useState("");
  const [inlineAlt, setInlineAlt] = useState("");
  const [notice, setNotice] = useState("Full story content is included in SEO and GEO discovery automatically.");
  const previewUrl = useMemo(() => compressed ? URL.createObjectURL(compressed.blob) : "", [compressed]);
  const filteredImages = useMemo(() => {
    const query = galleryQuery.trim().toLocaleLowerCase();
    if (!query) return images;
    return images.filter((image) => `${image.originalName} ${image.altText}`.toLocaleLowerCase().includes(query));
  }, [galleryQuery, images]);
  const editor = useEditor({
    immediatelyRender: false,
    content: initialContent ? markdownToHtml(initialContent) : "<p></p>",
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
        },
      }),
      Placeholder.configure({
        placeholder: "Write the article story here. Use the toolbar for headings, emphasis, lists, quotes, links and inline images.",
      }),
      TiptapImage.configure({
        allowBase64: false,
        inline: false,
        HTMLAttributes: { class: "prod-rich-inline-image" },
      }),
    ],
    editorProps: {
      attributes: {
        class: "prod-rich-canvas",
        role: "textbox",
        "aria-label": "Main article content",
        "aria-multiline": "true",
        "aria-required": "true",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const markdownRoot = document.createElement("div");
      markdownRoot.innerHTML = activeEditor.getHTML();
      const text = activeEditor.getText().replace(/\n+/g, " ").trim();
      const md = editorToMarkdown(markdownRoot);
      setContent(md);
      onChange?.(md);
      setCharacterCount(text.length);
      setWordCount(text ? text.split(/\s+/).length : 0);
    },
  });

  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const targetHtml = markdownToHtml(initialContent);
      if (editor.getHTML() !== targetHtml) {
        editor.commands.setContent(targetHtml, { emitUpdate: true });
      }
    }
  }, [editor, initialContent]);

  const addLink = () => {
    if (!editor || editor.state.selection.empty) {
      setNotice("Select some text first, then choose the link button.");
      return;
    }

    const href = window.prompt("Paste a link beginning with https://, mailto:, / or #");
    if (!href) return;
    if (!/^(https?:\/\/|mailto:|\/|#)/i.test(href.trim())) {
      setNotice("Use a safe link beginning with https://, mailto:, / or #.");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
    setNotice("Link added. Full story content is included in SEO and GEO discovery.");
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!imagePickerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImagePickerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [imagePickerOpen]);

  const insertImage = (image: ArticleImage) => {
    if (!editor) return;
    editor.chain().focus().insertContent([
      {
        type: "image",
        attrs: {
          src: image.publicUrl,
          alt: image.altText,
          title: image.originalName,
        },
      },
      { type: "paragraph" },
    ], { updateSelection: true }).run();
    setImagePickerOpen(false);
    setNotice(`Image inserted with alt text: ${image.altText}`);
  };

  const onFileSelected = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageState("error");
      setImageMessage("Choose a valid image file.");
      return;
    }

    setImageState("compressing");
    setImageMessage("Converting the image to an efficient WebP…");
    try {
      const result = await compressToWebp(file);
      if (result.blob.size > MAX_IMAGE_BYTES) throw new Error("The converted image is still larger than 1 MB.");
      setCompressed(result);
      setImageState("ready");
      setImageMessage(`${formatBytes(result.blob.size)} · ${result.width} × ${result.height}px · ready to upload`);
    } catch (error) {
      setCompressed(null);
      setImageState("error");
      setImageMessage(error instanceof Error ? error.message : "The image could not be converted.");
    }
  };

  const uploadAndInsertImage = async () => {
    if (!compressed) return;
    const savedAltText = inlineAlt.trim();
    if (savedAltText.length < 3 || savedAltText.length > 180) {
      setImageState("error");
      setImageMessage("Describe the image in 3 to 180 characters before uploading it.");
      return;
    }

    setImageState("uploading");
    setImageMessage("Uploading the optimized image to the gallery…");
    try {
      const result = await uploadArticleImage(compressed, savedAltText);
      onImageUploaded(result);
      setCompressed(null);
      setInlineAlt("");
      setImageState("idle");
      setImageMessage("");
      insertImage(result);
    } catch (error) {
      setImageState("error");
      setImageMessage(error instanceof Error ? error.message : "The image could not be uploaded.");
    }
  };

  return (
    <div className="prod-rich-editor">
      <div className="prod-rich-toolbar" role="toolbar" aria-label="Article formatting">
        <div>
          <ToolbarButton label="Undo" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}><Undo2 aria-hidden="true" /></ToolbarButton>
          <ToolbarButton label="Redo" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}><Redo2 aria-hidden="true" /></ToolbarButton>
        </div>
        <div>
          <ToolbarButton label="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold aria-hidden="true" /></ToolbarButton>
          <ToolbarButton label="Italic" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic aria-hidden="true" /></ToolbarButton>
        </div>
        <div>
          <ToolbarButton label="Section heading" active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 aria-hidden="true" /></ToolbarButton>
          <ToolbarButton label="Smaller heading" active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 aria-hidden="true" /></ToolbarButton>
          <ToolbarButton label="Quote" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote aria-hidden="true" /></ToolbarButton>
        </div>
        <div>
          <ToolbarButton label="Bulleted list" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List aria-hidden="true" /></ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered aria-hidden="true" /></ToolbarButton>
          <ToolbarButton label="Add link" active={editor?.isActive("link")} onClick={addLink}><LinkIcon aria-hidden="true" /></ToolbarButton>
          <ToolbarButton label="Insert image" opensDialog onClick={() => setImagePickerOpen(true)}><ImagePlus aria-hidden="true" /></ToolbarButton>
        </div>
        <div>
          <ToolbarButton label="Clear formatting" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            <RemoveFormatting aria-hidden="true" />
          </ToolbarButton>
        </div>
      </div>

      <EditorContent editor={editor} />

      {imagePickerOpen && (
        <div
          className="prod-image-modal-backdrop prod-inline-image-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setImagePickerOpen(false);
          }}
        >
          <section className="prod-panel prod-image-panel prod-image-modal" role="dialog" aria-modal="true" aria-labelledby="inline-image-heading">
            <button type="button" className="prod-image-modal-close" autoFocus onClick={() => setImagePickerOpen(false)} aria-label="Close inline image menu">
              <X aria-hidden="true" />
            </button>
            <header className="prod-panel-heading">
              <div><span>+</span><h2 id="inline-image-heading">Inline image</h2></div>
              <p>WebP only · maximum 1 MB · stored in the server image library</p>
            </header>

            <div className="prod-source-tabs" role="tablist" aria-label="Inline image source">
              <button type="button" role="tab" aria-selected={sourceMode === "upload"} className={sourceMode === "upload" ? "is-active" : ""} onClick={() => setSourceMode("upload")}>
                <ImagePlus aria-hidden="true" /> New upload
              </button>
              <button type="button" role="tab" aria-selected={sourceMode === "gallery"} className={sourceMode === "gallery" ? "is-active" : ""} onClick={() => setSourceMode("gallery")}>
                <GalleryHorizontal aria-hidden="true" /> Gallery <span>{images.length}</span>
              </button>
            </div>

            {sourceMode === "upload" ? (
              <div className="prod-upload-workspace" role="tabpanel">
                <label className="prod-dropzone">
                  <input type="file" accept="image/*" onChange={(event) => void onFileSelected(event.target.files?.[0])} />
                  <FileImage aria-hidden="true" />
                  <strong>Choose a high-resolution image</strong>
                  <span>JPG, PNG, WebP or another browser-readable image. It will be resized and converted automatically.</span>
                </label>

                <div className="prod-image-preview">
                  {previewUrl ? (
                    <NextImage src={previewUrl} alt="Optimized inline image preview" fill unoptimized sizes="(max-width: 800px) 100vw, 44vw" />
                  ) : (
                    <div><Sparkles aria-hidden="true" /><span>OPTIMIZED PREVIEW</span></div>
                  )}
                </div>

                <label className="prod-field prod-image-alt">
                  <span>Image alt text *</span>
                  <input value={inlineAlt} onChange={(event) => setInlineAlt(event.target.value)} minLength={3} maxLength={180} placeholder="Describe what is visible in the image" />
                  <small>This description is saved with the image, appears on gallery hover, and supports article accessibility and discovery.</small>
                </label>

                <div className={`prod-image-status is-${imageState}`} aria-live="polite">
                  {imageState === "compressing" || imageState === "uploading" ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : imageState === "ready" ? <Check aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                  <span>{imageMessage || "Your source image stays in the browser until the WebP version is ready."}</span>
                  {compressed && imageState === "ready" && <button type="button" onClick={() => void uploadAndInsertImage()}>Upload and insert <ArrowUpRight aria-hidden="true" /></button>}
                </div>
              </div>
            ) : (
              <div className="prod-gallery-panel" role="tabpanel">
                <label className="prod-gallery-search">
                  <Search aria-hidden="true" />
                  <input value={galleryQuery} onChange={(event) => setGalleryQuery(event.target.value)} placeholder="Search filename or image description" aria-label="Search inline image gallery" />
                  <span>{filteredImages.length} / {images.length}</span>
                </label>
                <div className="prod-gallery">
                  {filteredImages.map((image) => (
                    <button
                      type="button"
                      key={image.id}
                      onClick={() => insertImage(image)}
                      title={image.altText}
                      aria-label={`Insert ${image.originalName}. ${image.altText}`}
                    >
                      <span className="prod-gallery-image">
                        <NextImage src={image.publicUrl} alt="" fill sizes="(max-width: 720px) 50vw, 20vw" />
                        <span className="prod-gallery-alt">{image.altText}</span>
                      </span>
                      <span className="prod-gallery-meta"><strong>{image.originalName}</strong><small>{formatBytes(image.sizeBytes)} · {image.width} × {image.height}</small></span>
                    </button>
                  ))}
                  {!images.length && (
                    <div className="prod-gallery-empty">
                      <GalleryHorizontal aria-hidden="true" />
                      <strong>Your gallery is ready for its first image.</strong>
                      <button type="button" onClick={() => setSourceMode("upload")}>Upload an image</button>
                    </div>
                  )}
                  {images.length > 0 && !filteredImages.length && (
                    <div className="prod-gallery-empty">
                      <Search aria-hidden="true" />
                      <strong>No images match “{galleryQuery.trim()}”.</strong>
                      <button type="button" onClick={() => setGalleryQuery("")}>Clear search</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      <textarea name={name} value={content} readOnly hidden aria-hidden="true" />
      <div className="prod-rich-meta" aria-live="polite">
        <span>{wordCount} {wordCount === 1 ? "word" : "words"} · {characterCount} characters</span>
        <span>{notice}</span>
      </div>
    </div>
  );
}
