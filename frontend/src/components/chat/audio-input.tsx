import { useRef, useState, useEffect } from "react";
import { LiveMicrophoneWaveform } from "../ui/waveform";
import { Button } from "../ui/button";
import { Square } from "lucide-react";
import type { UploadFile } from "@/lib/types";

interface Props {
  ref: React.RefObject<HTMLButtonElement | null>;
  setFiles: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  isRecording: boolean;
  onRecordDone: () => Promise<void>;
}

export default function AudioInput({
  ref,
  setFiles,
  setIsRecording,
  isRecording,
  onRecordDone,
}: Props) {
  const recorder = useRef<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });
          const audioFile = new File([audioBlob], "audio.wav", {
            type: "audio/wav",
          });
          setFiles([
            { file: audioFile, dataUrl: window.URL.createObjectURL(audioFile) },
          ]);
          console.log("file", audioFile);
          audioChunksRef.current = [];
          setIsRecording(false);
          setRecordingTime(0);
          onRecordDone();
        };
        recorder.current.onstart = () => {
          setIsRecording(true);
        };
        recorder.current.start();

        const startTime = Date.now();
        recordingTimerRef.current = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          setRecordingTime(elapsed);
        }, 100);
      }
    } catch (err) {
      console.log("error", err);
      setIsRecording(false);
    }
  };

  const handleStop = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (recorder.current) {
      recorder.current.stop();
      recorder.current = null;
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
          {/* Timer */}
          <div className="text-sm font-medium tabular-nums min-w-[40px] text-muted-foreground">
            {formatTime(recordingTime)}
          </div>

          {/* Live Waveform */}
          <div className="flex-1 h-full flex items-center overflow-hidden">
            <LiveMicrophoneWaveform
              active={isRecording}
              barWidth={3}
              barGap={2}
              barColor="currentColor"
              className="text-primary w-full h-8"
              height={32}
            />
          </div>

          {/* Stop Button */}
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={handleStop}
          >
            <Square className="h-4 w-4 fill-current" />
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
