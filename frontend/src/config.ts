// Frontend configuration loaded from environment variables
interface Config {
  API_URL: string;
  UPLOAD_MAX_SIZE: number;
  ALLOWED_EXTENSIONS: string[];
}

// Load configuration from environment variables with defaults
const config: Config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  UPLOAD_MAX_SIZE: parseInt(import.meta.env.VITE_UPLOAD_MAX_SIZE || '10485760'), // 10MB default
  ALLOWED_EXTENSIONS: (import.meta.env.VITE_ALLOWED_EXTENSIONS || '.jpg,.jpeg,.png,.gif,.webp').split(','),
};

export default config; 