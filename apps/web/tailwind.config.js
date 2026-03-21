/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Material Black Theme
        background: {
          DEFAULT: '#000000',
          primary: '#000000',
          secondary: '#121212',
          tertiary: '#1E1E1E',
          elevated: '#2C2C2C',
        },
        surface: {
          DEFAULT: '#0A0A0A',
          primary: '#0A0A0A',
          light: '#1A1A1A',
          secondary: '#121212',
          tertiary: '#1A1A1A',
          elevated: '#242424',
        },
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        accent: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        text: {
          DEFAULT: '#FFFFFF',
          primary: '#FFFFFF',
          secondary: '#B3B3B3',
          disabled: '#666666',
          hint: '#808080',
        },
        secondary: '#B3B3B3',
        hint: '#808080',
        error: {
          main: '#CF6679',
          light: '#EF5350',
          dark: '#B00020',
        },
        success: {
          main: '#4CAF50',
          light: '#81C784',
          dark: '#388E3C',
        },
        warning: {
          main: '#FF9800',
          light: '#FFB74D',
          dark: '#F57C00',
        },
        info: {
          main: '#2196F3',
          light: '#64B5F6',
          dark: '#1976D2',
        },
      },
      boxShadow: {
        'material-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'material-2': '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
        'material-3': '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
        'material-4': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
        'material-5': '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
      },
    },
  },
  plugins: [],
}
