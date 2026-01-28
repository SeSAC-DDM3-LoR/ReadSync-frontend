/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 메인 컬러: 싱그러운 숲색 (에메랄드 그린)
        primary: "#059669",
        secondary: "#34D399",
        // 게임 포인트 컬러
        "game-gold": "#FBBF24",
        "game-green": "#10B981",
        "forest-bg": "#ECFDF5",
        // 게임 등급 컬러
        "rarity-common": "#9CA3AF",
        "rarity-rare": "#3B82F6",
        "rarity-epic": "#A855F7",
        "rarity-legendary": "#F59E0B",
        // 다크 테마 지원
        "dark-bg": "#0F1419",
        "dark-card": "#1A1F26",
        "dark-border": "#2F3640",
      },
      fontFamily: {
        sans: ["Pretendard", "sans-serif"],
        game: ["Pretendard", "sans-serif"],
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "sparkle": "sparkle 1.5s ease-in-out infinite",
        "bounce-in": "bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "gradient-shift": "gradientShift 3s ease infinite",
        "particle-float": "particleFloat 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: 1, filter: "brightness(100%)" },
          "50%": { opacity: 0.8, filter: "brightness(130%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        sparkle: {
          "0%, 100%": { opacity: 0, transform: "scale(0) rotate(0deg)" },
          "50%": { opacity: 1, transform: "scale(1) rotate(180deg)" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: 0 },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.5)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        particleFloat: {
          "0%, 100%": { transform: "translateY(0) translateX(0)", opacity: 0.6 },
          "25%": { transform: "translateY(-20px) translateX(10px)", opacity: 1 },
          "50%": { transform: "translateY(-40px) translateX(-5px)", opacity: 0.8 },
          "75%": { transform: "translateY(-20px) translateX(-10px)", opacity: 1 },
        },
      },
      boxShadow: {
        "game-panel": "0 8px 32px 0 rgba(16, 185, 129, 0.15)",
        "game-btn": "0 4px 14px 0 rgba(5, 150, 105, 0.4)",
        "game-card": "0 4px 20px 0 rgba(16, 185, 129, 0.2)",
        "game-hover": "0 8px 30px 0 rgba(16, 185, 129, 0.3)",
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.5)",
        "glow-gold": "0 0 20px rgba(251, 191, 36, 0.5)",
        "inner-glow": "inset 0 0 20px rgba(16, 185, 129, 0.1)",
      },
      backgroundImage: {
        "gradient-game": "linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)",
        "gradient-gold": "linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #FCD34D 100%)",
        "gradient-dark": "linear-gradient(180deg, #0F1419 0%, #1A1F26 100%)",
        "shimmer-gradient": "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
      },
    },
  },
  plugins: [],
};
