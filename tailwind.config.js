/** @type {import('tailwindcss').Config} */
     module.exports = {
       content: [
         "./app/**/*.{js,jsx}",
         "./components/**/*.{js,jsx}",
       ],
      theme: { 
        extend: { 
          backdropFilter: { 'none': 'none', 'blur': 'blur(8px)' },
          animation: { 
            pulse: 'pulse 1s ease-in-out infinite',
            'fade-in': 'fade-in 0.5s ease-out',
            'zoom-in-50': 'zoom-in-50 0.7s ease-out',
            'spin-slow': 'spin-slow 4s linear infinite',

           },
          keyframes: {
            pulse: {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
             'fade-in': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 },
            },
            'zoom-in-50': {
              '0%': { opacity: 0, transform: 'scale(0.5)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
            'spin-slow': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          },
         }
     },
       plugins: [],
     }