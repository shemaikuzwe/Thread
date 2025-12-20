import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  variant?: "sent" | "received";
}

export function AudioPlayer({
  audioUrl,
  variant = "received",
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate waveform bars (simulated)
  const waveformBars = Array.from({ length: 20 }, (_, i) => {
    const height = Math.random() * 100;
    return height;
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError(true);
      setIsPlaying(false);
      console.log(
        "[v0] Audio loading error - invalid or unsupported audio source"
      );
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.log("[v0] Error playing audio:", err);
      setError(true);
      setIsPlaying(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg p-3 shadow-sm ${
        variant === "sent" ? "bg-primary" : "bg-card"
      } max-w-sm`}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <Button
        size="icon"
        variant={variant === "sent" ? "secondary" : "default"}
        className={`h-10 w-10 shrink-0 rounded-full ${
          variant === "sent"
            ? "bg-primary-foreground/90 hover:bg-primary-foreground text-primary"
            : ""
        }`}
        onClick={togglePlayPause}
        disabled={error}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="h-5 w-5 translate-x-0.5" fill="currentColor" />
        )}
      </Button>

      {/* Waveform */}
      <div className="relative flex flex-1 items-center gap-[1px] h-10 w-full min-w-[60px]">
        {waveformBars.map((height, index) => {
          const barProgress = (index / waveformBars.length) * 100;
          const isPlayed = barProgress <= progress;

          return (
            <div
              key={index}
              className={`flex-1 rounded-full transition-colors duration-200 ${
                isPlayed
                  ? variant === "sent"
                    ? "bg-primary-foreground"
                    : "bg-primary"
                  : variant === "sent"
                  ? "bg-primary-foreground/30"
                  : "bg-muted-foreground/30"
              }`}
              style={{ height: `${Math.max(height * 0.35, 12)}%` }}
            />
          );
        })}
      </div>

      {/* Time Display */}
      <div
        className={`text-xs font-medium tabular-nums shrink-0 ${
          variant === "sent"
            ? "text-primary-foreground"
            : "text-muted-foreground"
        }`}
      >
        {error
          ? "Error"
          : isPlaying
          ? formatTime(currentTime)
          : formatTime(duration)}
      </div>
    </div>
  );
}
