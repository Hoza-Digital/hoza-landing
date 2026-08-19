"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  FileImage,
  GalleryHorizontal,
  ImagePlus,
  LoaderCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  articleDateCode,
  type ArticleImage,
  type ArticleStatus,
  type FullArticle,
  slugifyArticleTitle,
} from "@/lib/articles";
import { getArticleForEdit, updateArticleAction, type ArticleFormState } from "./actions";
import {
  type CompressedImage,
  MAX_IMAGE_BYTES,
  compressToWebp,
  formatBytes,
  uploadArticleImage,
} from "./image-processing";
import { RichTextEditor } from "./rich-text-editor";

type EditArticleModalProps = {
  articleId: number;
  initialImages: ArticleImage[];
  onClose: () => void;
  onSaved: () => void;
};

function formatEditableSlug(value: string) {
  const formatted = slugifyArticleTitle(value);
  const endsWithSeparator = /[\s-]$/.test(value);
  return formatted && endsWithSeparator && formatted.length < 160 ? `${formatted}-` : formatted;
}

export function EditArticleModal({
  articleId,
  initialImages,
  onClose,
  onSaved,
}: EditArticleModalProps) {
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<FullArticle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formFeedback, setFormFeedback] = useState<ArticleFormState | null>(null);

  const [images, setImages] = useState(initialImages);
  const [selectedImage, setSelectedImage] = useState<ArticleImage | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [sourceMode, setSourceMode] = useState<"upload" | "gallery">("gallery");
  const [galleryQuery, setGalleryQuery] = useState("");
  const [compressed, setCompressed] = useState<CompressedImage | null>(null);
  const [imageState, setImageState] = useState<"idle" | "compressing" | "ready" | "uploading" | "error">("idle");
  const [imageMessage, setImageMessage] = useState("");

  const [title, setTitle] = useState("");
  const [editSlug, setEditSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [category, setCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverAlt, setCoverAlt] = useState("");
  const [workflow, setWorkflow] = useState<ArticleStatus>("published");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("10:00");

  const dialogRef = useRef<HTMLDivElement>(null);

  const automaticSlug = useMemo(() => slugifyArticleTitle(title), [title]);
  const slug = editSlug ? slugifyArticleTitle(customSlug) : automaticSlug;
  const pathDate = workflow === "published" ? (article?.publishDate ?? "") : publishDate;
  const pathPreview = `/article/${articleDateCode(pathDate || "2026-08-19")}/${slug || "your-article-title"}`;
  const previewUrl = useMemo(() => (compressed ? URL.createObjectURL(compressed.blob) : ""), [compressed]);

  const filteredImages = useMemo(() => {
    const query = galleryQuery.trim().toLocaleLowerCase();
    if (!query) return images;
    return images.filter((img) => `${img.originalName} ${img.altText}`.toLocaleLowerCase().includes(query));
  }, [galleryQuery, images]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      const res = await getArticleForEdit(articleId);
      if (!active) return;
      if (!res.ok || !res.article) {
        setError(res.error || "Could not load article data.");
        setLoading(false);
        return;
      }

      const art = res.article;
      setArticle(art);
      setTitle(art.title);
      setCategory(art.category);
      setExcerpt(art.excerpt);
      setContent(art.content);
      setCoverAlt(art.coverImageAlt);
      setWorkflow(art.status ?? "published");
      setPublishDate(art.publishDate);

      if (art.scheduledFor) {
        const d = new Date(art.scheduledFor);
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        setPublishTime(`${hours}:${minutes}`);
      }

      const matchingImg = initialImages.find((img) => img.storagePath === art.coverImagePath) ?? {
        id: -1,
        storagePath: art.coverImagePath,
        publicUrl: art.coverImageUrl,
        originalName: "Current Cover",
        altText: art.coverImageAlt,
        sizeBytes: 0,
        width: 0,
        height: 0,
        createdAt: "",
      };
      setSelectedImage(matchingImg);

      if (art.slug !== slugifyArticleTitle(art.title)) {
        setEditSlug(true);
        setCustomSlug(art.slug);
      }

      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [articleId, initialImages]);

  // Keyboard trap / escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const onTitleChange = (val: string) => {
    setTitle(val);
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
    } catch (err) {
      setCompressed(null);
      setImageState("error");
      setImageMessage(err instanceof Error ? err.message : "The image could not be converted.");
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
      setImageMessage("Image uploaded and selected.");
      setSourceMode("gallery");
      setShowImagePicker(false);
    } catch (err) {
      setImageState("error");
      setImageMessage(err instanceof Error ? err.message : "The image could not be uploaded.");
    }
  };

  const selectGalleryImage = (image: ArticleImage) => {
    setSelectedImage(image);
    setCoverAlt(image.altText);
    setShowImagePicker(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!article || !selectedImage) return;

    setSaving(true);
    setFormFeedback(null);

    const formData = new FormData();
    formData.append("id", String(article.id));
    formData.append("title", title);
    formData.append("useCustomSlug", editSlug ? "true" : "false");
    formData.append("customSlug", customSlug);
    formData.append("coverImageUrl", selectedImage.publicUrl);
    formData.append("coverImagePath", selectedImage.storagePath);
    formData.append("coverImageAlt", coverAlt);
    formData.append("category", category);
    formData.append("excerpt", excerpt);
    formData.append("content", content);
    formData.append("status", workflow);
    formData.append("publishDate", publishDate);
    if (workflow === "draft") {
      formData.append("publishTime", publishTime);
    }

    const res = await updateArticleAction({ status: "idle", message: "" }, formData);
    setSaving(false);
    setFormFeedback(res);

    if (res.status === "success") {
      onSaved();
      setTimeout(() => {
        onClose();
      }, 900);
    }
  };

  return (
    <div className="prod-edit-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-article-heading">
      <div className="prod-edit-modal-content" ref={dialogRef}>
        <header className="prod-edit-modal-header">
          <div>
            <span className="eyebrow">Edit article</span>
            <h2 id="edit-article-heading">{loading ? "LOADING…" : title || "EDIT ARTICLE"}</h2>
          </div>
          <button type="button" className="prod-edit-modal-close" onClick={onClose} aria-label="Close edit dialog">
            <X aria-hidden="true" />
          </button>
        </header>

        {loading ? (
          <div className="prod-edit-modal-loading">
            <LoaderCircle className="admin-spin" aria-hidden="true" />
            <span>Loading article content…</span>
          </div>
        ) : error ? (
          <div className="prod-edit-modal-error">
            <p>{error}</p>
            <button type="button" className="button button-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form className="prod-edit-modal-form" onSubmit={handleSubmit}>
            <div className="prod-fields two-columns">
              <div className="prod-field prod-field-wide">
                <label htmlFor="edit-title">Article title *</label>
                <input
                  id="edit-title"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  required
                  minLength={3}
                  maxLength={180}
                  placeholder="Article title"
                />
                <div className="prod-slug-preview">
                  <label className="prod-slug-toggle">
                    <input
                      type="checkbox"
                      checked={editSlug}
                      onChange={(e) => onEditSlugChange(e.target.checked)}
                    />
                    <span>Edit slug</span>
                  </label>
                  <small>
                    URL preview: <strong>{pathPreview}</strong>
                  </small>
                </div>
                {editSlug && (
                  <label className="prod-custom-slug">
                    <span>Custom slug *</span>
                    <input
                      value={customSlug}
                      onChange={(e) => setCustomSlug(formatEditableSlug(e.target.value))}
                      onBlur={() => setCustomSlug(slugifyArticleTitle(customSlug))}
                      required
                      minLength={1}
                      maxLength={160}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="custom-article-slug"
                    />
                  </label>
                )}
              </div>

              <div className="prod-cover-field prod-field-wide">
                <span>Cover image *</span>
                <button
                  type="button"
                  className={selectedImage ? "has-image" : ""}
                  onClick={() => setShowImagePicker((prev) => !prev)}
                >
                  {selectedImage ? (
                    <Image src={selectedImage.publicUrl} alt="" width={82} height={56} />
                  ) : (
                    <i>
                      <ImagePlus aria-hidden="true" />
                    </i>
                  )}
                  <span>
                    <strong>{selectedImage ? "Change cover image" : "Choose cover image"}</strong>
                    <small>
                      {selectedImage
                        ? `${selectedImage.originalName} · ${formatBytes(selectedImage.sizeBytes || 0)}`
                        : "Upload a new image or choose one from the gallery"}
                    </small>
                  </span>
                  <ArrowUpRight aria-hidden="true" />
                </button>
              </div>

              {showImagePicker && (
                <div className="prod-modal-image-picker prod-field-wide">
                  <div className="prod-source-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={sourceMode === "gallery"}
                      className={sourceMode === "gallery" ? "is-active" : ""}
                      onClick={() => setSourceMode("gallery")}
                    >
                      <GalleryHorizontal aria-hidden="true" /> Gallery <span>{images.length}</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={sourceMode === "upload"}
                      className={sourceMode === "upload" ? "is-active" : ""}
                      onClick={() => setSourceMode("upload")}
                    >
                      <ImagePlus aria-hidden="true" /> New upload
                    </button>
                  </div>

                  {sourceMode === "gallery" ? (
                    <div className="prod-gallery-panel">
                      <label className="prod-gallery-search">
                        <Search aria-hidden="true" />
                        <input
                          value={galleryQuery}
                          onChange={(e) => setGalleryQuery(e.target.value)}
                          placeholder="Search filename or image description"
                        />
                        <span>
                          {filteredImages.length} / {images.length}
                        </span>
                      </label>
                      <div className="prod-gallery">
                        {filteredImages.map((img) => (
                          <button
                            type="button"
                            className={selectedImage?.storagePath === img.storagePath ? "is-selected" : ""}
                            onClick={() => selectGalleryImage(img)}
                            key={img.id}
                          >
                            <span className="prod-gallery-image">
                              <Image src={img.publicUrl} alt="" fill sizes="160px" />
                              <span className="prod-gallery-alt">{img.altText}</span>
                            </span>
                            <span className="prod-gallery-meta">
                              <strong>{img.originalName}</strong>
                              <small>
                                {formatBytes(img.sizeBytes)} · {img.width} × {img.height}
                              </small>
                            </span>
                            {selectedImage?.storagePath === img.storagePath && (
                              <i>
                                <Check aria-hidden="true" />
                              </i>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="prod-upload-workspace">
                      <label className="prod-dropzone">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => void onFileSelected(e.target.files?.[0])}
                        />
                        <FileImage aria-hidden="true" />
                        <strong>Choose high-resolution image</strong>
                        <span>JPG, PNG, or WebP. Auto converted.</span>
                      </label>
                      <div className="prod-image-preview">
                        {previewUrl ? (
                          <Image src={previewUrl} alt="Preview" fill unoptimized />
                        ) : (
                          <div>
                            <Sparkles aria-hidden="true" />
                            <span>OPTIMIZED PREVIEW</span>
                          </div>
                        )}
                      </div>
                      <label className="prod-field prod-image-alt">
                        <span>Cover image alt text *</span>
                        <input
                          value={coverAlt}
                          onChange={(e) => setCoverAlt(e.target.value)}
                          required
                          minLength={3}
                          maxLength={180}
                          placeholder="Describe the image"
                        />
                      </label>
                      <div className={`prod-image-status is-${imageState}`}>
                        {imageState === "compressing" || imageState === "uploading" ? (
                          <LoaderCircle className="admin-spin" aria-hidden="true" />
                        ) : imageState === "ready" ? (
                          <Check aria-hidden="true" />
                        ) : (
                          <Sparkles aria-hidden="true" />
                        )}
                        <span>{imageMessage || "Ready to process"}</span>
                        {compressed && imageState === "ready" && (
                          <button type="button" onClick={() => void uploadImage()}>
                            Upload to gallery <ArrowUpRight aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <label className="prod-field">
                <span>Category *</span>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  list="edit-article-categories"
                  placeholder="Web Design"
                />
                <datalist id="edit-article-categories">
                  <option value="Web Design" />
                  <option value="Product Strategy" />
                  <option value="Automation" />
                  <option value="Technology" />
                  <option value="Business Growth" />
                  <option value="Sales" />
                </datalist>
              </label>

              <label className="prod-field">
                <span>Author</span>
                <input
                  value={article?.authorName ?? ""}
                  readOnly
                  aria-readonly="true"
                  className="prod-author-locked"
                />
              </label>

              <label className="prod-field prod-field-wide">
                <span>Short excerpt *</span>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  required
                  minLength={20}
                  maxLength={500}
                  rows={3}
                  placeholder="Summary of the article"
                />
              </label>

              <div className="prod-field prod-field-wide">
                <span>Main content *</span>
                <RichTextEditor
                  initialContent={content}
                  images={images}
                  name="edit-content"
                  onChange={(val) => setContent(val)}
                  onImageUploaded={(img) => setImages((prev) => [img, ...prev.filter((i) => i.id !== img.id)])}
                />
              </div>

              <div className="prod-field">
                <span>Workflow / Status *</span>
                <select
                  value={workflow}
                  onChange={(e) => setWorkflow(e.target.value as ArticleStatus)}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived (Hidden from front page)</option>
                </select>
              </div>

              <label className="prod-field">
                <span>Publish date *</span>
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  required
                />
              </label>

              {workflow === "draft" && (
                <label className="prod-field">
                  <span>Target publish time (WIB) *</span>
                  <input
                    type="time"
                    value={publishTime}
                    onChange={(e) => setPublishTime(e.target.value)}
                    required
                  />
                </label>
              )}
            </div>

            {formFeedback && (
              <div className={`prod-result is-${formFeedback.status}`} role="status">
                {formFeedback.status === "success" ? <Check aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                <span>{formFeedback.message}</span>
              </div>
            )}

            <div className="prod-edit-modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={saving || !selectedImage}
              >
                {saving ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                {saving ? "Saving changes…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
