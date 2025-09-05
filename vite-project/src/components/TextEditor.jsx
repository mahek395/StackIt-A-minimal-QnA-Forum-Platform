import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Smile,
} from "lucide-react";

const TextEditor = ({ value = "", onChange, placeholder = "" }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentAlignment, setCurrentAlignment] = useState("left");
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    unorderedList: false,
    orderedList: false,
  });
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const isUpdatingFromProp = useRef(false);

  const emojis = [
    "😊", "😂", "❤️", "👍", "🎉", "🔥", "💯", "🚀", "💡", "⭐",
    "🌟", "✨", "🎯", "💪", "🙌", "👏", "🎊", "🎈", "🌈", "☀️",
  ];

  // Push content up to parent
  const handleContentChange = useCallback(() => {
    if (editorRef.current && onChange && !isUpdatingFromProp.current) {
      const htmlContent = editorRef.current.innerHTML;
      const textContent = editorRef.current.textContent || editorRef.current.innerText || "";
      onChange(htmlContent, textContent);
    }
  }, [onChange]);

  // Initialize empty paragraph for proper block context
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML.trim() === "") {
      editorRef.current.innerHTML = "<p><br></p>";
    }
  }, []);

  // Make the editor controlled (reflect parent "value" into innerHTML)
  useEffect(() => {
    if (!editorRef.current) return;

    // Prevent infinite loops by checking if we're already updating
    if (isUpdatingFromProp.current) return;

    const currentHTML = editorRef.current.innerHTML;
    const normalizedValue = value && value.trim() !== "" ? value : "<p><br></p>";

    // Only update if the content actually differs
    if (currentHTML !== normalizedValue) {
      isUpdatingFromProp.current = true;
      
      // Save current cursor position
      const selection = window.getSelection();
      const savedRange = selection.rangeCount > 0 ? {
        startContainer: selection.getRangeAt(0).startContainer,
        startOffset: selection.getRangeAt(0).startOffset,
        endContainer: selection.getRangeAt(0).endContainer,
        endOffset: selection.getRangeAt(0).endOffset
      } : null;

      editorRef.current.innerHTML = normalizedValue;

      // Restore cursor position if possible
      if (savedRange && editorRef.current.contains(savedRange.startContainer)) {
        try {
          const range = document.createRange();
          range.setStart(savedRange.startContainer, savedRange.startOffset);
          range.setEnd(savedRange.endContainer, savedRange.endOffset);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // If restoring fails, place cursor at the end
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      setTimeout(() => {
        isUpdatingFromProp.current = false;
      }, 0);
    }
  }, [value]);

  const updateActiveStyles = useCallback(() => {
    if (!editorRef.current || isUpdatingFromProp.current) return;
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const newActiveStyles = {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikethrough: document.queryCommandState("strikeThrough"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      orderedList: document.queryCommandState("insertOrderedList"),
    };

    let alignParent = selection.focusNode;
    let foundAlignment = false;
    while (
      alignParent &&
      alignParent !== editorRef.current &&
      alignParent.nodeType === Node.ELEMENT_NODE
    ) {
      const computedStyle = window.getComputedStyle(alignParent);
      if (
        computedStyle.textAlign &&
        ["left", "center", "right"].includes(computedStyle.textAlign)
      ) {
        setCurrentAlignment(computedStyle.textAlign);
        foundAlignment = true;
        break;
      }
      alignParent = alignParent.parentElement;
    }
    if (!foundAlignment && editorRef.current.contains(selection.focusNode)) {
      setCurrentAlignment("left");
    } else if (!editorRef.current.contains(selection.focusNode)) {
      setCurrentAlignment("left");
    }
    setActiveStyles(newActiveStyles);
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (!isUpdatingFromProp.current) {
        updateActiveStyles();
      }
    };

    const handleInput = () => {
      if (!isUpdatingFromProp.current) {
        updateActiveStyles();
        handleContentChange();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    const currentEditor = editorRef.current;
    if (currentEditor) {
      currentEditor.addEventListener("input", handleInput);
    }
    
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (currentEditor) {
        currentEditor.removeEventListener("input", handleInput);
      }
    };
  }, [updateActiveStyles, handleContentChange]);

  const execCommand = (command, valueArg = null) => {
    if (isUpdatingFromProp.current) return;
    
    editorRef.current?.focus();
    document.execCommand(command, false, valueArg);
    setTimeout(() => {
      updateActiveStyles();
      handleContentChange();
    }, 0);
  };

  const insertText = (text) => {
    if (isUpdatingFromProp.current) return;
    
    editorRef.current?.focus();
    
    // Ensure we have a selection
    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.addRange(range);
    }
    
    // Use insertText command for proper cursor handling
    document.execCommand('insertText', false, text);
    
    setTimeout(() => {
      updateActiveStyles();
      handleContentChange();
    }, 0);
  };

  const insertEmoji = (emoji) => {
    insertText(emoji);
    setShowEmojiPicker(false);
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return string.startsWith("http://") || string.startsWith("https://");
    } catch {
      return false;
    }
  };

  const insertLink = () => {
    const selection = window.getSelection();
    const isTextSelected = selection.toString().length > 0;

    const url = prompt("Enter URL (e.g., https://example.com):");
    if (!url) return;

    if (!isValidUrl(url)) {
      alert("Please enter a valid URL (e.g., https://example.com).");
      return;
    }

    editorRef.current?.focus();

    if (selection.rangeCount === 0) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.addRange(range);
    }

    if (isTextSelected) {
      execCommand("createLink", url);
    } else {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.textContent = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";

      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(anchor);
      range.setStartAfter(anchor);
      range.setEndAfter(anchor);
      selection.removeAllRanges();
      selection.addRange(range);
      
      handleContentChange();
    }
  };

  const insertImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        editorRef.current?.focus();
        
        const selection = window.getSelection();
        let range;
        
        if (selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        } else {
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        const img = document.createElement("img");
        img.src = reader.result;
        img.alt = file.name;
        img.style.maxWidth = "100%";
        img.style.height = "auto";

        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.setEndAfter(img);
        selection.removeAllRanges();
        selection.addRange(range);
        
        handleContentChange();
      };
      reader.readAsDataURL(file);
    }
    event.target.value = "";
  };

  const setAlignment = (alignment) => {
    setCurrentAlignment(alignment);
    switch (alignment) {
      case "left":
        execCommand("justifyLeft");
        break;
      case "center":
        execCommand("justifyCenter");
        break;
      case "right":
        execCommand("justifyRight");
        break;
      default:
        execCommand("justifyLeft");
    }
  };

  const insertList = (type) => {
    if (type === "bullet") {
      execCommand("insertUnorderedList");
    } else {
      execCommand("insertOrderedList");
    }
  };

  const handleKeyDown = (e) => {
    if (isUpdatingFromProp.current) {
      e.preventDefault();
      return;
    }

    // Prevent toolbar-less Enter from accidentally submitting a parent form
    if (e.key === "Enter") {
      e.stopPropagation();
    }
    
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          execCommand("bold");
          break;
        case "i":
          e.preventDefault();
          execCommand("italic");
          break;
        case "u":
          e.preventDefault();
          execCommand("underline");
          break;
        default:
          break;
      }
    }
  };

  const handlePaste = (e) => {
    if (isUpdatingFromProp.current) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    insertText(text);
  };

  const handleInputEvent = (e) => {
    if (isUpdatingFromProp.current) return;
    // Input handling is done in the event listener
  };

  const getWordCount = () => {
    const text = editorRef.current ? editorRef.current.textContent : "";
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const getCharCount = () => {
    const text = editorRef.current ? editorRef.current.textContent : "";
    return text.length;
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "<p><br></p>";
      editorRef.current.focus();
      
      // Place cursor at the beginning
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStart(editorRef.current.firstChild, 0);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      handleContentChange();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border-b border-gray-200">
          <button
            type="button"
            onClick={() => execCommand("bold")}
            className={`flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md transition-colors active:bg-gray-200 ${
              activeStyles.bold ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-100"
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
            <span className="text-sm font-bold">B</span>
          </button>

          <button
            type="button"
            onClick={() => execCommand("italic")}
            className={`flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md transition-colors active:bg-gray-200 ${
              activeStyles.italic ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-100"
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
            <span className="text-sm italic">I</span>
          </button>

          <button
            type="button"
            onClick={() => execCommand("strikeThrough")}
            className={`flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md transition-colors active:bg-gray-200 ${
              activeStyles.strikethrough ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-100"
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
            <span className="text-sm line-through">S</span>
          </button>

          <button
            type="button"
            onClick={() => execCommand("underline")}
            className={`flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md transition-colors active:bg-gray-200 ${
              activeStyles.underline ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-100"
            }`}
            title="Underline (Ctrl+U)"
          >
            <span className="text-sm underline">U</span>
          </button>

          <div className="w-px h-8 bg-gray-300"></div>

          <button
            type="button"
            onClick={() => insertList("bullet")}
            className={`flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md transition-colors active:bg-gray-200 ${
              activeStyles.unorderedList ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-100"
            }`}
            title="Bullet List"
          >
            <List size={16} />
          </button>

          <button
            type="button"
            onClick={() => insertList("ordered")}
            className={`flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md transition-colors active:bg-gray-200 ${
              activeStyles.orderedList ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-100"
            }`}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>

          <div className="w-px h-8 bg-gray-300"></div>

          <button
            type="button"
            onClick={insertLink}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors active:bg-gray-200"
            title="Insert Link"
          >
            <LinkIcon size={16} />
          </button>

          <button
            type="button"
            onClick={insertImage}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors active:bg-gray-200"
            title="Insert Image"
          >
            <ImageIcon size={16} />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: "none" }}
          />

          <div className="w-px h-8 bg-gray-300"></div>

          <button
            type="button"
            onClick={() => setAlignment("left")}
            className={`flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md transition-colors active:bg-gray-200 ${
              currentAlignment === "left" ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-100"
            }`}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => setAlignment("center")}
            className={`flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md transition-colors active:bg-gray-200 ${
              currentAlignment === "center" ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-100"
            }`}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>

          <button
            type="button"
            onClick={() => setAlignment("right")}
            className={`flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md transition-colors active:bg-gray-200 ${
              currentAlignment === "right" ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-100"
            }`}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>

          <div className="w-px h-8 bg-gray-300"></div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors active:bg-gray-200"
              title="Insert Emoji"
            >
              <Smile size={16} />
            </button>

            {showEmojiPicker && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-gray-300 rounded-lg shadow-lg z-[999] w-[200px]">
                <div className="grid grid-cols-5 gap-2">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 text-lg hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-gray-300"></div>

          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors active:bg-gray-200 text-sm"
            title="Clear All Content and Formatting"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <div
          ref={editorRef}
          contentEditable={true}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onInput={handleInputEvent}
          onBlur={updateActiveStyles}
          className="w-full min-h-64 p-4 focus:outline-none"
          style={{
            fontSize: "14px",
            lineHeight: "1.5",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            direction: 'ltr',
            textAlign: 'left',
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
      </div>

      <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
        <div className="flex gap-4">
          <span>{getWordCount()} words</span>
          <span>{getCharCount()} characters</span>
        </div>
        <div className="text-xs text-gray-400">
          Tip: Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline
        </div>
      </div>

      <style jsx>{`
        [contenteditable] ul {
          list-style-type: disc;
          padding-left: 2em;
          margin: 1em 0;
        }
        
        [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 2em;
          margin: 1em 0;
        }
        
        [contenteditable] li {
          margin-bottom: 0.25em;
        }
        
        [contenteditable] ul ul {
          list-style-type: circle;
        }
        
        [contenteditable] ul ul ul {
          list-style-type: square;
        }
        
        [contenteditable]:empty::before,
        [contenteditable] p:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default TextEditor;