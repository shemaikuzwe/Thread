import { Mic } from "lucide-react";
import { Button } from "../ui/button";
import { useRef, useState } from "react";
interface Props {
  setAudioBlob: React.Dispatch<React.SetStateAction<Blob | null>>;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function AudioInput({ setAudioBlob, setIsRecording }: Props) {
  const recorder = useRef<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const handleClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder.current = new MediaRecorder(stream);
      if (recorder.current) {
        recorder.current.ondataavailable = (e) => {
          setAudioChunks([...audioChunks, e.data]);
        };
        recorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          setAudioBlob(audioBlob);
          setAudioChunks([]);
          setIsRecording(false);
        };
        recorder.current.start();
        setIsRecording(true);
      }
    } catch (err) {
      console.log("error", err);
    } finally {
      setIsRecording(false);
    }
  };
  return (
    <Button variant={"secondary"} onClick={handleClick}>
      <Mic className="h-10 w-10" />
    </Button>
  );
}
