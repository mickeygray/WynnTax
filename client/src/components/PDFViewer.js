import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import pdf from "../assets/wynn-tax-guide.pdf";
export default function PDFViewer() {
  return (
    <div className="h-[90vh] overflow-y-auto p-4 bg-gray-50">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer fileUrl={pdf} />
      </Worker>
    </div>
  );
}
