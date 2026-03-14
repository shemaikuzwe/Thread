import { Moon, PcCase, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-md p-1 ">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("system")}
        aria-label="System theme"
      >
        <PcCase className="h-4 w-4 " />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-md ${theme === "light" ? "bg-black/20" : ""}`}
        onClick={() => setTheme("light")}
        aria-label="Light theme"
      >
        <Sun className="h-4 w-4 " />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-md ${theme === "dark" ? "bg-black/20" : ""}`}
        onClick={() => setTheme("dark")}
        aria-label="Dark theme"
      >
        <Moon className="h-4 w-4" />
      </Button>
    </div>
  );
}
