"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Check, Plus, Tag, X } from "lucide-react";

import { normalizeCategoryName } from "@/lib/articles";

export const PRESET_CATEGORIES = [
  "Sales",
  "Web",
  "App",
  "Product Strategy",
  "Automation",
  "Technology",
  "Business Growth",
] as const;

type CategoryPickerProps = {
  value: string;
  onChange?: (formattedValue: string) => void;
  name?: string;
  required?: boolean;
};

export function CategoryPicker({
  value,
  onChange,
  name = "category",
  required = true,
}: CategoryPickerProps) {
  const [customInput, setCustomInput] = useState("");

  const selectedList = useMemo(() => {
    const normalized = normalizeCategoryName(value ?? "");
    return normalized
      .split(",")
      .map((cat) => cat.trim())
      .filter(Boolean);
  }, [value]);

  const updateCategories = (newList: string[]) => {
    const raw = newList.join(", ");
    const formatted = normalizeCategoryName(raw);
    onChange?.(formatted);
  };

  const toggleCategory = (cat: string) => {
    const isSelected = selectedList.some(
      (item) => item.toLowerCase() === cat.toLowerCase(),
    );
    if (isSelected) {
      updateCategories(
        selectedList.filter((item) => item.toLowerCase() !== cat.toLowerCase()),
      );
    } else {
      updateCategories([...selectedList, cat]);
    }
  };

  const removeCategory = (catToRemove: string) => {
    updateCategories(
      selectedList.filter((item) => item.toLowerCase() !== catToRemove.toLowerCase()),
    );
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;

    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    updateCategories([...selectedList, ...parts]);
    setCustomInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddCustom();
    }
  };

  return (
    <div className="category-picker-container">
      <input type="hidden" name={name} value={value} required={required} />

      {/* Selected tags badges */}
      {selectedList.length > 0 && (
        <div className="category-selected-tags">
          {selectedList.map((cat) => (
            <span key={cat} className="category-tag-badge">
              <Tag aria-hidden="true" />
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => removeCategory(cat)}
                aria-label={`Remove category ${cat}`}
                title={`Remove ${cat}`}
              >
                <X aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Preset Category Chips */}
      <div className="category-preset-chips" aria-label="Available category presets">
        {PRESET_CATEGORIES.map((preset) => {
          const isSelected = selectedList.some(
            (item) => item.toLowerCase() === preset.toLowerCase(),
          );
          return (
            <button
              key={preset}
              type="button"
              className={`category-chip ${isSelected ? "is-selected" : ""}`}
              onClick={() => toggleCategory(preset)}
            >
              {isSelected ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
              <span>{preset}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Category Input */}
      <div className="category-custom-input-wrap">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAddCustom}
          placeholder="Add custom category (e.g. Mobile, Strategy)…"
        />
        {customInput.trim() && (
          <button type="button" onClick={handleAddCustom} className="category-add-btn">
            Add
          </button>
        )}
      </div>
      <small className="category-picker-help">
        Click presets above or type custom categories (press Enter or comma to add multiple).
      </small>
    </div>
  );
}
