import { useState } from 'react';
import styles from '../styles/components/SearchBar.module.css';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SearchBar = ({ 
  placeholder = "search your archive", 
  value, 
  onChange, 
  className = "" 
}: SearchBarProps) => {
  return (
    <div className={`${styles.searchBarWrapper} ${className}`}>
      <span className={styles.searchIcon}>
        {/* SVG for search icon */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="9" cy="9" r="7" stroke="#888" strokeWidth="2"/>
          <line x1="14.4142" y1="14" x2="18" y2="17.5858" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </span>
      <input
        type="text"
        className={styles.searchBar}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar; 