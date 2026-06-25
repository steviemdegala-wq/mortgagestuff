"use client";

import { useState, useRef, useEffect } from "react";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "date" | "textarea";
  className?: string;
}

export default function InlineEdit({
  value,
  onSave,
  placeholder = "Click to add",
  type = "text",
  className = "",
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      if (inputRef.current && type !== "textarea") {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [editing, type]);

  async function handleSave() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  }

  const displayValue = value || "";
  const isEmpty = !displayValue;

  if (editing) {
    const commonProps = {
      value: draft,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => setDraft(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      disabled: saving,
      className: `w-full border-b border-gray-300 focus:border-gray-600 outline-none py-0.5 text-sm text-black bg-transparent ${className}`,
    };

    return type === "textarea" ? (
      <textarea
        {...commonProps}
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        rows={3}
        className={`w-full border border-gray-300 rounded focus:border-gray-600 outline-none p-2 text-sm text-black bg-transparent resize-none ${className}`}
      />
    ) : (
      <input
        {...commonProps}
        type={type}
        ref={inputRef as React.RefObject<HTMLInputElement>}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`text-left text-sm w-full py-0.5 transition-colors ${
        isEmpty
          ? "text-gray-300 hover:text-gray-400"
          : "text-black hover:text-gray-700"
      } ${className}`}
    >
      {isEmpty ? placeholder : displayValue}
    </button>
  );
}
