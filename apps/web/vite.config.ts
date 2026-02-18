import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { reactRouter } from "@react-router/dev/vite";
// import fs from "fs";
export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["pdfjs-dist"],
  },
  // server: {
  //   https: {
  //     key: fs.readFileSync(
  //       "/home/shema/apps/go-projects/thread/certificates/localhost-key.pem",
  //     ),
  //     cert: fs.readFileSync(
  //       "/home/shema/apps/go-projects/thread/certificates/localhost.pem",
  //     ),
  //   },
  // },
});
