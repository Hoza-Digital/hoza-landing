"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  Check,
  FileImage,
  GalleryHorizontal,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  articleDateCode,
  type ArticleImage,
  type ArticleStatus,
  type ArticleSummary,
  slugifyArticleTitle,
} from "@/lib/articles";
import {
  type ArticleFormState,
  publishArticle,
  toggleArticleArchiveAction,
} from "./actions";
import { EditArticleModal } from "./edit-article-modal";
import {
  type CompressedImage,
  MAX_IMAGE_BYTES,
  compressToWebp,
  formatBytes,
  uploadArticleImage,
} from "./image-processing";
import { RichTextEditor } from "./rich-text-editor";

const initialArticleFormState: ArticleFormState = { status: "idle", message: "" };

type ArticleEditorProps = {
  initialImages: ArticleImage[];
  articles: ArticleSummary[];
  authorName: string;
  defaultPublishDate: string;
  defaultDraftDate: string;
  defaultDraftTime: string;
};

function formatArticleDate(date: string) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${date}T00:00:00Z`));
}

function formatEditableSlug(value: string) {
  const formatted = slugifyArticleTitle(value);
  const endsWithSeparator = /[\s-]$/.test(value);
  return formatted && endsWithSeparator && formatted.length < 160 ? `${formatted}-` : formatted;
}

export function ArticleEditor({
  initialImages,
  articles,
  authorName,
  defaultPublishDate,
  defaultDraftDate,
  defaultDraftTime,
}: ArticleEditorProps) {
  const [formState, formAction, formPending] = useActionState(publishArticle, initialArticleFormState);
  const router = useRouter();
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<number, ArticleStatus>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const articleList = useMemo(() => {
    return articles.map((article) => ({
      ...article,
      ...(statusOverrides[article.id] ? { status: statusOverrides[article.id] } : {}),
    }));
  }, [articles, statusOverrides]);

  const handleToggleArchive = async (id: number) => {
    setArchivingId(id);
    setActionError(null);
    const res = await toggleArticleArchiveAction(id);
    setArchivingId(null);
    if (res.ok && res.status) {
      setStatusOverrides((prev) => ({ ...prev, [id]: res.status as ArticleStatus }));
      router.refresh();
    } else if (res.error) {
      setActionError(res.error);
    }
  };

  const [images, setImages] = useState(initialImages);
  const [selectedImage, setSelectedImage] = useState<ArticleImage | null>(initialImages[0] ?? null);
  const [sourceMode, setSourceMode] = useState<"upload" | "gallery">(initialImages.length ? "gallery" : "upload");
  const [galleryQuery, setGalleryQuery] = useState("");
  const [compressed, setCompressed] = useState<CompressedImage | null>(null);
  const [imageState, setImageState] = useState<"idle" | "compressing" | "ready" | "uploading" | "error">("idle");
  const [imageMessage, setImageMessage] = useState("");
  const [title, setTitle] = useState("");
  const [editSlug, setEditSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [coverAlt, setCoverAlt] = useState(initialImages[0]?.altText ?? "");
  const [coverAltCustomized, setCoverAltCustomized] = useState(Boolean(initialImages[0]));
  const [workflow, setWorkflow] = useState<ArticleStatus>("published");
  const [publishDate, setPublishDate] = useState(defaultDraftDate);
  const [publishTime, setPublishTime] = useState(defaultDraftTime);
  const resultRef = useRef<HTMLDivElement>(null);

  const automaticSlug = useMemo(() => slugifyArticleTitle(title), [title]);
  const slug = editSlug ? slugifyArticleTitle(customSlug) : automaticSlug;
  const pathDate = workflow === "published" ? defaultPublishDate : publishDate;
  const pathPreview = `/article/${articleDateCode(pathDate)}/${slug || "your-article-title"}`;
  const previewUrl = useMemo(() => compressed ? URL.createObjectURL(compressed.blob) : "", [compressed]);
  const filteredImages = useMemo(() => {
    const query = galleryQuery.trim().toLocaleLowerCase();
    if (!query) return images;
    return images.filter((image) => `${image.originalName} ${image.altText}`.toLocaleLowerCase().includes(query));
  }, [galleryQuery, images]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (formState.status !== "idle") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [formState]);

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!coverAltCustomized) setCoverAlt(value ? `${value} — Hoza Digital article cover` : "");
  };

  const onEditSlugChange = (enabled: boolean) => {
    setEditSlug(enabled);
    if (enabled && !customSlug) setCustomSlug(automaticSlug);
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
    setSelectedImage(null);
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

  const uploadImage = async () => {
    if (!compressed) return;
    const savedAltText = coverAlt.trim();
    if (savedAltText.length < 3 || savedAltText.length > 180) {
      setImageState("error");
      setImageMessage("Describe the image in 3 to 180 characters before uploading it.");
      return;
    }
    setImageState("uploading");
    setImageMessage("Uploading the optimized image to the gallery…");

    try {
      const result = await uploadArticleImage(compressed, savedAltText);

      setImages((current) => [result, ...current.filter((item) => item.id !== result.id)]);
      setSelectedImage(result);
      setCompressed(null);
      setImageState("idle");
      setImageMessage("Image uploaded and selected from your gallery.");
      setSourceMode("gallery");
    } catch (error) {
      setImageState("error");
      setImageMessage(error instanceof Error ? error.message : "The image could not be uploaded.");
    }
  };

  const selectGalleryImage = (image: ArticleImage) => {
    setSelectedImage(image);
    setCoverAlt(image.altText);
    setCoverAltCustomized(true);
  };

  const showGallery = () => {
    setSourceMode("gallery");
    if (selectedImage) {
      setCoverAlt(selectedImage.altText);
      setCoverAltCustomized(true);
    }
  };

  return (
    <>
      <section className="prodarticle-hero">
        <div>
          <span className="eyebrow">Content production</span>
          <h1>MAKE THE<br /><em>NEXT SIGNAL.</em></h1>
        </div>
        <p>Create a search-ready article, optimize its cover image and publish it to a predictable Hoza URL from one protected workspace.</p>
      </section>

      <form className="prodarticle-form" action={formAction}>
        <input type="hidden" name="coverImageUrl" value={selectedImage?.publicUrl ?? ""} />
        <input type="hidden" name="coverImagePath" value={selectedImage?.storagePath ?? ""} />
        <input type="hidden" name="coverImageAlt" value={coverAlt} />

          <div id="cover-image-menu" className="prod-image-modal-backdrop" popover="auto">
          <section className="prod-panel prod-image-panel prod-image-modal" role="dialog" aria-modal="true" aria-labelledby="cover-heading">
          <button type="button" className="prod-image-modal-close" popoverTarget="cover-image-menu" popoverTargetAction="hide" aria-label="Close cover image menu">
            <X aria-hidden="true" />
          </button>
          <header className="prod-panel-heading">
            <div><span>01</span><h2 id="cover-heading">Cover image</h2></div>
            <p>WebP only · maximum 1 MB · stored in the server image library</p>
          </header>

          <div className="prod-source-tabs" role="tablist" aria-label="Cover image source">
            <button type="button" role="tab" aria-selected={sourceMode === "upload"} className={sourceMode === "upload" ? "is-active" : ""} onClick={() => setSourceMode("upload")}>
              <ImagePlus aria-hidden="true" /> New upload
            </button>
            <button type="button" role="tab" aria-selected={sourceMode === "gallery"} className={sourceMode === "gallery" ? "is-active" : ""} onClick={showGallery}>
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
                  <Image src={previewUrl} alt="Optimized article cover preview" fill unoptimized sizes="(max-width: 800px) 100vw, 44vw" />
                ) : (
                  <div><Sparkles aria-hidden="true" /><span>OPTIMIZED PREVIEW</span></div>
                )}
              </div>

              <label className="prod-field prod-image-alt">
                <span>Cover image alt text *</span>
                <input value={coverAlt} onChange={(event) => { setCoverAltCustomized(true); setCoverAlt(event.target.value); }} required minLength={3} maxLength={180} placeholder="Describe what is visible in the image" />
                <small>This description is saved with the image and appears when you hover over it in the gallery.</small>
              </label>

              <div className={`prod-image-status is-${imageState}`} aria-live="polite">
                {imageState === "compressing" || imageState === "uploading" ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : imageState === "ready" ? <Check aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                <span>{imageMessage || "Your source image stays in the browser until the WebP version is ready."}</span>
                {compressed && imageState === "ready" && <button type="button" onClick={() => void uploadImage()}>Upload to gallery <ArrowUpRight aria-hidden="true" /></button>}
              </div>
            </div>
          ) : (
            <div className="prod-gallery-panel" role="tabpanel">
              <label className="prod-gallery-search">
                <Search aria-hidden="true" />
                <input value={galleryQuery} onChange={(event) => setGalleryQuery(event.target.value)} placeholder="Search filename or image description" aria-label="Search cover image gallery" />
                <span>{filteredImages.length} / {images.length}</span>
              </label>
              <div className="prod-gallery">
                {filteredImages.map((image) => (
                  <button
                    type="button"
                    className={selectedImage?.id === image.id ? "is-selected" : ""}
                    onClick={() => selectGalleryImage(image)}
                    key={image.id}
                    aria-label={`Select ${image.originalName}. ${image.altText}`}
                  >
                    <span className="prod-gallery-image">
                      <Image src={image.publicUrl} alt="" fill sizes="(max-width: 720px) 50vw, 20vw" />
                      <span className="prod-gallery-alt">{image.altText}</span>
                    </span>
                    <span className="prod-gallery-meta"><strong>{image.originalName}</strong><small>{formatBytes(image.sizeBytes)} · {image.width} × {image.height}</small></span>
                    {selectedImage?.id === image.id && <i><Check aria-hidden="true" /></i>}
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

        <section className="prod-panel" aria-labelledby="story-heading">
          <header className="prod-panel-heading">
            <div><span>02</span><h2 id="story-heading">Article story</h2></div>
            <p>Everything here automatically powers the article’s SEO and GEO discovery.</p>
          </header>

          <div className="prod-fields two-columns">
            <div className="prod-field prod-field-wide">
              <span id="article-title-label">Article title *</span>
              <input aria-labelledby="article-title-label" name="title" value={title} onChange={(event) => onTitleChange(event.target.value)} required minLength={3} maxLength={180} placeholder="A clear, useful title people will want to open" />
              <div className="prod-slug-preview">
                <label className="prod-slug-toggle">
                  <input
                    type="checkbox"
                    name="useCustomSlug"
                    value="true"
                    checked={editSlug}
                    onChange={(event) => onEditSlugChange(event.target.checked)}
                  />
                  <span>Edit slug</span>
                </label>
                <small>URL preview: <strong>{pathPreview}</strong></small>
              </div>
              {editSlug ? (
                <label className="prod-custom-slug">
                  <span>Custom slug *</span>
                  <input
                    name="customSlug"
                    value={customSlug}
                    onChange={(event) => setCustomSlug(formatEditableSlug(event.target.value))}
                    onBlur={() => setCustomSlug(slugifyArticleTitle(customSlug))}
                    required
                    minLength={1}
                    maxLength={160}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="your-custom-article-slug"
                  />
                  <small>Use lowercase letters, numbers and hyphens. Other characters are formatted automatically.</small>
                </label>
              ) : null}
            </div>
            <div className="prod-cover-field prod-field-wide">
              <span>Cover image *</span>
              <button
                type="button"
                className={selectedImage ? "has-image" : ""}
                aria-haspopup="dialog"
                popoverTarget="cover-image-menu"
                popoverTargetAction="toggle"
              >
                {selectedImage ? (
                  <Image src={selectedImage.publicUrl} alt="" width={82} height={56} />
                ) : (
                  <i><ImagePlus aria-hidden="true" /></i>
                )}
                <span>
                  <strong>{selectedImage ? "Change cover image" : "Choose cover image"}</strong>
                  <small>{selectedImage ? `${selectedImage.originalName} · ${formatBytes(selectedImage.sizeBytes)}` : "Upload a new image or choose one from the gallery"}</small>
                </span>
                <ArrowUpRight aria-hidden="true" />
              </button>
            </div>
            <label className="prod-field">
              <span>Category *</span>
              <input name="category" required minLength={2} maxLength={80} list="article-categories" placeholder="Product strategy" />
              <datalist id="article-categories">
                <option value="Web Design" />
                <option value="Product Strategy" />
                <option value="Automation" />
                <option value="Technology" />
                <option value="Business Growth" />
              </datalist>
            </label>
            <label className="prod-field">
              <span>Author *</span>
              <input
                name="authorName"
                value={authorName}
                readOnly
                aria-readonly="true"
                className="prod-author-locked"
              />
              <small>Set automatically from the signed-in dashboard user.</small>
            </label>
            <label className="prod-field prod-field-wide">
              <span>Short excerpt *</span>
              <textarea name="excerpt" required minLength={20} maxLength={500} rows={3} placeholder="A concise summary shown on the article card and near the article heading." />
            </label>
            <div className="prod-field prod-field-wide">
              <span id="main-content-label">Main content *</span>
              <RichTextEditor
                images={images}
                name="content"
                onImageUploaded={(image) => setImages((current) => [image, ...current.filter((item) => item.id !== image.id)])}
              />
            </div>
          </div>
        </section>

        <section className="prod-publish-bar">
          <div className={`prod-publish-controls${workflow === "draft" ? " has-schedule" : ""}`}>
            <label className="prod-field compact">
              <span>Workflow *</span>
              <select name="status" value={workflow} onChange={(event) => setWorkflow(event.target.value as ArticleStatus)}>
                <option value="published">Publish now</option>
                <option value="draft">Save as draft</option>
              </select>
            </label>
            {workflow === "draft" && (
              <>
                <label className="prod-field compact">
                  <span>Publish date *</span>
                  <input type="date" name="publishDate" value={publishDate} onChange={(event) => setPublishDate(event.target.value)} required />
                </label>
                <label className="prod-field compact">
                  <span>Publish time (WIB) *</span>
                  <input type="time" name="publishTime" value={publishTime} onChange={(event) => setPublishTime(event.target.value)} required />
                </label>
              </>
            )}
          </div>
          <div className="prod-publish-action">
            <span>{selectedImage ? `Cover selected · ${formatBytes(selectedImage.sizeBytes)}` : "Select or upload a cover before saving"}</span>
            <button type="submit" disabled={formPending || !selectedImage}>
              {formPending ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
              {formPending ? "Saving article…" : "Save article"}
            </button>
          </div>
        </section>

        <div ref={resultRef} className={`prod-result is-${formState.status}`} role="status" aria-live="polite">
          {formState.status === "success" ? <Check aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
          <span>{formState.message || "Your article status will appear here after saving."}</span>
          {formState.status === "success" && formState.path && formState.articleStatus === "published" && (
            <Link href={formState.path} target="_blank">Open public article <ArrowUpRight aria-hidden="true" /></Link>
          )}
        </div>
      </form>

      <section className="prod-recent" aria-labelledby="recent-articles-heading">
        <header>
          <div><span className="eyebrow">Content library</span><h2 id="recent-articles-heading">RECENT ARTICLES.</h2></div>
          <p>{articleList.length} {articleList.length === 1 ? "article" : "articles"} in the database</p>
        </header>
        {actionError && (
          <div className="prod-result is-error" style={{ marginBlock: "1.5rem" }} role="alert">
            <X aria-hidden="true" />
            <span>{actionError}</span>
          </div>
        )}
        <div className="prod-article-list">
          {articleList.map((article) => {
            const path = `/article/${articleDateCode(article.publishDate)}/${article.slug}`;
            const isArchived = article.status === "archived";
            const isArchivingThis = archivingId === article.id;

            return (
              <article key={article.id}>
                <Image src={article.coverImageUrl} alt="" width={112} height={76} />
                <div>
                  <span>{article.category}</span>
                  <h3>{article.title}</h3>
                  <small>{formatArticleDate(article.publishDate)}</small>
                </div>
                <i className={`is-${article.status}`}>{article.status}</i>
                <div className="prod-article-row-actions">
                  <button
                    type="button"
                    className="prod-article-btn prod-article-btn-edit"
                    onClick={() => setEditingArticleId(article.id)}
                    aria-label={`Edit ${article.title}`}
                    title="Edit article"
                  >
                    <Pencil aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className={`prod-article-btn ${isArchived ? "prod-article-btn-unarchive" : "prod-article-btn-archive"}`}
                    onClick={() => void handleToggleArchive(article.id)}
                    disabled={isArchivingThis}
                    aria-label={isArchived ? `Unarchive ${article.title}` : `Archive ${article.title}`}
                    title={isArchived ? "Unarchive article (restore to public)" : "Archive article (hide from front page)"}
                  >
                    {isArchivingThis ? (
                      <LoaderCircle className="admin-spin" aria-hidden="true" />
                    ) : isArchived ? (
                      <ArchiveRestore aria-hidden="true" />
                    ) : (
                      <Archive aria-hidden="true" />
                    )}
                    <span>{isArchived ? "Unarchive" : "Archive"}</span>
                  </button>
                  {article.status === "published" && (
                    <Link
                      href={path}
                      target="_blank"
                      aria-label={`Open ${article.title}`}
                      className="prod-article-btn-view"
                      title="View public article"
                    >
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
          {!articleList.length && <p className="prod-no-articles">Your first saved article will appear here.</p>}
        </div>
      </section>

      {editingArticleId !== null && (
        <EditArticleModal
          articleId={editingArticleId}
          initialImages={images}
          onClose={() => setEditingArticleId(null)}
          onSaved={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}
