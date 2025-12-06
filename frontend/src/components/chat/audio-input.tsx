import { useRef, useState } from "react";
import { Waveform } from "../ui/waveform";
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
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
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
          console.log("data", e.data.size);
          audioChunksRef.current.push(e.data);
        };
        recorder.current.onstop = () => {
          const audioFile = new File(audioChunksRef.current, "audio.wav", {
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
    if (recorder.current) {
      recorder.current.stop();
      recorder.current = null;
    }
  };
  const data = Array.from({ length: 10 }, (_, i) => i);
  return (
    <>
      {isRecording && (
        <div className="flex w-full items-center justify-between">
          <div className="w-100 justify-center items-center h-full  flex flex-col">
            {formatTime(recordingTime)}
            <Waveform data={data} height={20} barWidth={4} barGap={2} />
          </div>
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
