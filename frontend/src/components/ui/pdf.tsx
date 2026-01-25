import type { MessageFile } from "@/lib/types";
import { cn, formatFileSize } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Download } from "lucide-react";
import { useEffect, useState, Suspense } from "react";

interface Props {
  open: boolean;
  className?: string;
  file: MessageFile;
  onDownloadClick: () => void;
}

export default function PDF({ open, file, className, onDownloadClick }: Props) {
  const [reactPdf, setReactPdf] = useState<{ Document: any; Page: any } | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  useEffect(() => {
    (async () => {
      const { pdfjs, Document, Page } = await import("react-pdf");
      if (typeof window !== "undefined") {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
      }
      setReactPdf({ Document, Page });
    })();
  }, []);

  const { Document, Page } = reactPdf || {};

  return open ? (
    <iframe src={file.url} className={cn(className)} />
  ) : (
    <Card className={"w-100 h-70"}>
      <CardHeader className="px-4 flex justify-between items-start w-full">
        <div className="flex justify-center items-start">
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
              {numPages && `${numPages} Pages`} {formatFileSize(file.size)}
            </span>
          </div>
        </div>
        <div>
          <Button className="w-7 h-7" variant={"outline"} size={"icon"}>
            <Download onClick={onDownloadClick} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-55  -mb-4 px-2.5 overflow-hidden rounded-md">
        <Suspense fallback={<h2>Loading preview..</h2>}>
          {Document && Page ? (
            <Document
              file={file.url}
              onLoadSuccess={({ numPages }: { numPages: number }) => setNumPages(numPages)}
              onLoadError={(error: any) => console.error("PDF load error:", error)}
            >
              <Page
                pageNumber={1}
                width={350}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          ) : (
            <div className="text-sm text-muted-foreground">Loading preview…</div>
          )}
        </Suspense>
      </CardContent>
    </Card>
  );
}
