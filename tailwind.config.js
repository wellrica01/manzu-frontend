/** @type {import('tailwindcss').Config} */
     module.exports = {
       content: [
         "./app/**/*.{js,jsx}",
         "./components/**/*.{js,jsx}",
       ],
      theme: { 
        extend: { 
          backdropFilter: { 'none': 'none', 'blur': 'blur(8px)' },
          animation: { pulse: 'pulse 1s ease-in-out infinite' },
          keyframes: {
            pulse: {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          },
         }
     },
       plugins: [],
     }