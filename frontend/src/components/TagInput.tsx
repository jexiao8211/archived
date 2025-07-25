import { useState, useRef, useEffect } from 'react';
import styles from '../styles/components/TagInput.module.css';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const TagInput = ({ 
  tags, 
  onTagsChange, 
  disabled = false, 
  placeholder = "Type a tag and press enter/space...",
  className = ""
}: TagInputProps) => {
  const [tagInput, setTagInput] = useState('');
  const [isTypingTag, setIsTypingTag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle input changes - convert to lowercase
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setTagInput(value);
    
    // If user starts typing and there's content, show tag formatting
    if (value.trim()) {
      setIsTypingTag(true);
    } else {
      setIsTypingTag(false);
    }
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag();
    } else if (e.key === ' ') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag();
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      e.preventDefault();
      // Remove the last tag and put its text back in the input
      const lastTag = tags[tags.length - 1];
      onTagsChange(tags.slice(0, -1));
      setTagInput(lastTag);
      setIsTypingTag(true);
    }
  };

  // Add a new tag
  const addTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      onTagsChange([...tags, newTag]);
    }
    setTagInput('');
    setIsTypingTag(false);
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle blur event - save current tag when user exits input
  const handleBlur = () => {
    if (tagInput.trim()) {
      addTag();
    }
  };

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  return (
    <div className={`${styles.tagInputContainer} ${className}`}>
      {tags.map((tag) => (
        <span key={tag} className={styles.tag}>
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className={styles.removeTagButton}
            disabled={disabled}
          >
            ×
          </button>
        </span>
      ))}
      <div className={styles.inputWrapper}>
        {isTypingTag && tagInput.trim() && (
          <span className={styles.typingTag}>
            {tagInput}
            <button
              type="button"
              onClick={() => {
                setTagInput('');
                setIsTypingTag(false);
              }}
              className={styles.removeTagButton}
              disabled={disabled}
            >
              ×
            </button>
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={tagInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
          className={styles.tagInput}
          disabled={disabled}
          style={{ color: 'transparent', caretColor: 'transparent' }}
        />
      </div>
    </div>
  );
};

export default TagInput; 