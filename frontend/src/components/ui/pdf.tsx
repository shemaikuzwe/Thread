import type { MessageFile } from "@/lib/types";
import { cn, formatFileSize } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Download } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

const Document = lazy(() =>
  import("react-pdf").then((p) => ({ default: p.Document })),
);
const Page = lazy(() => import("react-pdf").then((p) => ({ default: p.Page })));

interface Props {
  open: boolean;
  className?: string;
  file: MessageFile;
  onDownloadClick: () => void;
}
export default function PDF({ open, file, className, onDownloadClick }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  useEffect(() => {
    async function load() {
      const pdfjs = (await import("react-pdf")).pdfjs;
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
    load();
  }, []);

  const handleLoadMetadata = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return open ? (
    <iframe src={file.url} className={cn(className)} />
  ) : (
    <Card className={cn("w-100 h-70")}>
      <CardHeader className="px-4 flex justify-between items-start w-full">
        <div className="flex  justify-center items-start">
          <img
            src="/icons/pdf.png"
            alt="pdf"
            width={100}
            height={100}
            className="w-13 h-12 -mt-1 rounded-lg"
          />
          <div className="flex flex-col justify-start items-start">
            <CardTitle className="text-sm font-medium">{file.name}</CardTitle>
            <span className="text-xs font-normal">
              {numPages > 0 && `${numPages} Pages`} {formatFileSize(file.size)}
            </span>
          </div>
        </div>
        <div>
          <Button className="w-7 h-7" variant={"outline"} size={"icon"}>
            <Download onClick={onDownloadClick} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-55 -mb-4 px-2.5 overflow-hidden rounded-md">
        <Suspense fallback={<h2>Loading preview..</h2>}>
          <Document file={file.url} onLoadSuccess={handleLoadMetadata}>
            <Page
              pageNumber={1}
              width={350}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </Suspense>
      </CardContent>
    </Card>
  );
}
