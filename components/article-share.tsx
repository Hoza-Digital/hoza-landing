"use client";

import { Check, Facebook, Instagram, Link2, MessageCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ArticleShareProps = {
  title: string;
  url: string;
};

export function ArticleShare({ title, url }: ArticleShareProps) {
  const [feedback, setFeedback] = useState("");
  const feedbackTimer = useRef<number | null>(null);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  useEffect(() => () => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
  }, []);

  const showFeedback = (message: string) => {
    setFeedback(message);
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(""), 2600);
  };

  const copyLink = async (message = "Link copied") => {
    try {
      await navigator.clipboard.writeText(url);
      showFeedback(message);
    } catch {
      showFeedback("Unable to copy link");
    }
  };

  const shareToInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink("Link copied for Instagram");
  };

  return (
    <div className="article-share">
      <span>SHARE URL</span>
      <div className="article-share-actions">
        <a href={`https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noreferrer noopener" aria-label="Share on X" title="Share on X">
          <span className="social-x-mark" aria-hidden="true" />
        </a>
        <button type="button" onClick={shareToInstagram} aria-label="Share on Instagram" title="Share on Instagram">
          <Instagram aria-hidden="true" />
        </button>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer noopener" aria-label="Share on Facebook" title="Share on Facebook">
          <Facebook aria-hidden="true" />
        </a>
        <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noreferrer noopener" aria-label="Share on WhatsApp" title="Share on WhatsApp">
          <MessageCircle aria-hidden="true" />
        </a>
        <a href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noreferrer noopener" aria-label="Share on Telegram" title="Share on Telegram">
          <Send aria-hidden="true" />
        </a>
        <button type="button" onClick={() => copyLink()} aria-label="Copy article link" title="Copy article link">
          {feedback.startsWith("Link copied") ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
        </button>
      </div>
      <p className="article-share-feedback" aria-live="polite">{feedback}</p>
    </div>
  );
}
