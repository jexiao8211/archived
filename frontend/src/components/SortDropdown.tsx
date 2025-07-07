import { useState, useRef, useEffect } from 'react';
import styles from '../styles/components/SortDropdown.module.css';

export type SortOption = 'Alphabetical' | 'Custom' | 'Last Updated';

export interface SortState {
  option: SortOption;
  ascending: boolean;
}

interface SortDropdownProps {
  value: SortState;
  onChange: (sortState: SortState) => void;
  options?: SortOption[];
  className?: string;
}

const SortDropdown = ({ 
  value, 
  onChange, 
  options = ['Custom', 'Alphabetical', 'Last Updated'],
  className = "" 
}: SortDropdownProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option: SortOption) => {
    if (option === 'Custom') {
      // Custom option - just set the option, no ascending/descending
      onChange({ option, ascending: true });
    } else if (value.option === option) {
      // Same option clicked - toggle ascending/descending (except for Custom)
      onChange({ option, ascending: !value.ascending });
    } else {
      // New option clicked - set to ascending by default
      onChange({ option, ascending: true });
    }
    // Don't close dropdown - let user see the arrow change
  };

  const getArrowIcon = (option: SortOption) => {
    if (value.option !== option || option === 'Custom') return null;
    
    return value.ascending ? (
      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 8L10 4L14 8" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) : (
      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 12L10 16L6 12" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  return (
    <div className={`${styles.sortDropdownWrapper} ${className}`} ref={dropdownRef}>
      <button
        className={styles.sortButton}
        onClick={() => setDropdownOpen((open) => !open)}
        type="button"
      >
        {/* Sort icon SVG */}
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle'}}>
          <path d="M6 8L10 4L14 8" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 12L10 16L6 12" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {dropdownOpen && (
        <div className={styles.sortDropdown}>
          {options.map((option) => (
            <div
              key={option}
              className={`${styles.sortOption} ${value.option === option ? styles.activeSortOption : ''}`}
              onClick={() => handleOptionClick(option)}
            >
              <span>{option}</span>
              {getArrowIcon(option)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortDropdown; 