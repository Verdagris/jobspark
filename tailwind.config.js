// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // South African inspired colors
        "sa-green": "#007A3D",
        "sa-green-light": "#00A651", 
        "sa-green-dark": "#005A2D",
        "sa-gold": "#FFB612",
        "sa-gold-light": "#FFC843",
        "sa-gold-dark": "#E6A000",
        // RGB versions for use in box-shadows or drop-shadows
        "sa-green-rgb": "0, 122, 61",
        "sa-gold-rgb": "255, 182, 18",
      },
      animation: {
        // Aurora-like animation for background gradients
        "gradient-fade": "gradient-fade 15s ease infinite",
        "spin-slow": "spin 8s linear infinite",
        tilt: "tilt 10s infinite linear",
      },
      keyframes: {
        "gradient-fade": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        tilt: {
          "0%, 50%, 100%": {
            transform: "rotate(0deg)",
          },
          "25%": {
            transform: "rotate(0.5deg)",
          },
          "75%": {
            transform: "rotate(-0.5deg)",
          },
        },
      },
    },
  },
  plugins: [],
};