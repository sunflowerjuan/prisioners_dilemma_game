/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        body: ['"Chakra Petch"', "sans-serif"]
      },
      colors: {
        ink: "#050816",
        neonPink: "#ff4fd8",
        neonBlue: "#54f7ff",
        neonLime: "#c5ff5e",
        arcadeGold: "#ffd447"
      },
      boxShadow: {
        arcade: "0 0 0 2px #0a1025, 0 0 0 4px #54f7ff, 0 12px 30px rgba(84, 247, 255, 0.25)",
        panel: "0 0 0 2px rgba(197,255,94,0.35), inset 0 0 0 2px rgba(5,8,22,0.8)"
      },
      keyframes: {
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 2px rgba(84,247,255,0.35), 0 0 12px rgba(255,79,216,0.15)" },
          "50%": { boxShadow: "0 0 0 2px rgba(255,79,216,0.45), 0 0 22px rgba(84,247,255,0.25)" }
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        blink: {
          "0%, 45%, 100%": { opacity: "1" },
          "50%, 95%": { opacity: "0.4" }
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        }
      },
      animation: {
        glow: "glow 2.5s infinite ease-in-out",
        floaty: "floaty 2.4s infinite ease-in-out",
        blink: "blink 1.1s steps(2) infinite",
        scan: "scan 8s linear infinite"
      }
    }
  },
  plugins: []
};
