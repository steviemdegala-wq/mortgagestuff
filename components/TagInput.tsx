"use client";

import { useState, useEffect, useRef } from "react";

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => Promise<void>;
  onRemove: (tag: string) => Promise<void>;
  suggestionType?: "markets" | "specializations";
  placeholder?: string;
}

export default function TagInput({
  tags,
  onAdd,
  onRemove,
  suggestionType = "markets",
  placeholder = "Add tag",
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/tags?type=${suggestionType}`)
      .then((r) => r.json())
      .then((data: string[]) => setAllSuggestions(data));
  }, [suggestionType]);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions(allSuggestions.filter((s) => !tags.includes(s)));
    } else {
      setSuggestions(
        allSuggestions.filter(
          (s) =>
            s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
        )
      );
    }
  }, [input, allSuggestions, tags]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    await onAdd(trimmed);
    setInput("");
    setShowDropdown(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
          >
            {tag}
            <button
              onClick={() => onRemove(tag)}
              className="text-gray-400 hover:text-gray-700 leading-none"
              aria-label={`Remove ${tag}`}
            >
              &times;
            </button>
          </span>
        ))}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="text-xs border-b border-gray-200 focus:border-gray-400 outline-none py-0.5 px-0.5 w-28 text-gray-600 placeholder-gray-300 bg-transparent"
          />
        </div>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-sm z-10 min-w-40 max-h-40 overflow-y-auto">
          {input.trim() && !suggestions.some((s) => s.toLowerCase() === input.toLowerCase()) && (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(input);
              }}
              className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
            >
              Add &ldquo;{input}&rdquo;
            </button>
          )}
          {suggestions.map((s) => (
            <button
              key={s}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
              }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
