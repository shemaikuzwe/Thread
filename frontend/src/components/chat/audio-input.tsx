import { useRef, useState, useEffect } from "react";
import { LiveMicrophoneWaveform } from "../ui/waveform";
import { Button } from "../ui/button";
import { Pause, Play, Trash2 } from "lucide-react";
import type { UploadFile } from "@/lib/types";

interface Props {
  ref: React.RefObject<HTMLButtonElement | null>;
  setFile: React.Dispatch<React.SetStateAction<UploadFile | null>>;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  isRecording: boolean;
  onRecordDone: () => Promise<void>;
}

export default function AudioInput({
  ref,
  setFile,
  setIsRecording,
  isRecording,
  onRecordDone,
}: Props) {
  const recorder = useRef<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isCancelRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const pausedTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      if (recorder.current) {
        recorder.current.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        recorder.current.onstop = () => {
          if (isCancelRef.current) {
            isCancelRef.current = false;
            audioChunksRef.current = [];
            setIsRecording(false);
            setRecordingTime(0);
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });
          const audioFile = new File([audioBlob], "audio.wav", {
            type: "audio/wav",
          });
          setFile({
            file: audioFile,
            dataUrl: window.URL.createObjectURL(audioFile),
          });
          audioChunksRef.current = [];
          setIsRecording(false);
          setRecordingTime(0);
          onRecordDone();
        };
        recorder.current.onstart = () => {
          setIsRecording(true);
        };
        recorder.current.onpause = () => {
          console.log("paused");
          setIsPaused(true);
          pausedTimeRef.current = currentTimeRef.current;
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
        };
        recorder.current.onresume = () => {
          console.log("resumed");
          setIsPaused(false);
          const resumeTime = Date.now();
          const pausedElapsed = pausedTimeRef.current;
          recordingTimerRef.current = setInterval(() => {
            const elapsed = pausedElapsed + (Date.now() - resumeTime) / 1000;
            currentTimeRef.current = elapsed;
            setRecordingTime(elapsed);
          }, 100);
        };
        recorder.current.start();
        const startTime = Date.now();
        recordingTimerRef.current = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          currentTimeRef.current = elapsed;
          setRecordingTime(elapsed);
        }, 100);
      }
    } catch (err) {
      console.log("error", err);
      setIsRecording(false);
    }
  };

  const handlePause = () => {
    if (recorder.current) {
      if (recorder.current.state === "paused") {
        recorder.current.resume();
        return;
      }
      recorder.current.pause();
    }
  };

  const handleStop = (deleteFile: boolean = false) => {
    if (deleteFile) {
      isCancelRef.current = true;
    }
    if (recorder.current) {
      recorder.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
    setIsPaused(false);
    pausedTimeRef.current = 0;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {isRecording && (
        <div className="flex w-80 items-center justify-end gap-4 px-2 h-10 ml-auto">
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={() => handleStop(true)}
          >
            <span className="sr-only">Delete</span>
            <Trash2 className="h-4 w-4 fill-current" />
          </Button>
          {/* Timer */}
          <div className="text-sm font-medium tabular-nums min-w-[40px] text-muted-foreground">
            {formatTime(recordingTime)}
          </div>

          {/* Live Waveform */}
          <div className="flex-1 h-full flex items-center overflow-hidden">
            <LiveMicrophoneWaveform
              active={isRecording && !isPaused}
              barWidth={3}
              barGap={2}
              barColor="currentColor"
              className="text-primary w-full h-8"
              height={32}
            />
          </div>

          {/* Pause/Resume Button */}
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={handlePause}
          >
            {isPaused ? (
              <Play className="h-4 w-4 fill-current" />
            ) : (
              <Pause className="h-4 w-4 fill-current" />
            )}
          </Button>
        </div>
      )}
      <button
        className="hidden"
        ref={ref}
        onClick={() => {
          if (isRecording) {
            handleStop();
          } else {
            handleClick();
          }
        }}
      />
    </>
  );
}
