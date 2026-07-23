import { Image, FileText, Download, X } from "lucide-react";
import type { AttachedDoc } from "../../types";

export function DocumentViewerModal({
  viewDoc,
  setViewDoc,
}: {
  viewDoc: AttachedDoc | null;
  setViewDoc: (doc: AttachedDoc | null) => void;
}) {
  if (!viewDoc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              {viewDoc.mimeType.startsWith("image/") ? <Image size={16} className="text-blue-600" /> : <FileText size={16} className="text-blue-600" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{viewDoc.name}</div>
              <div className="text-xs text-muted-foreground">{(viewDoc.size / 1024).toFixed(1)} KB · {viewDoc.mimeType}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={viewDoc.dataUrl} download={viewDoc.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity">
              <Download size={13} /> Download
            </a>
            <button onClick={() => setViewDoc(null)} className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center min-h-48">
          {viewDoc.mimeType.startsWith("image/") ? (
            <img src={viewDoc.dataUrl} alt={viewDoc.name} className="max-w-full max-h-[60vh] rounded-lg shadow-md object-contain" />
          ) : viewDoc.mimeType === "application/pdf" ? (
            <iframe src={viewDoc.dataUrl} title={viewDoc.name} className="w-full rounded-lg" style={{ height: "60vh" }} />
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground font-medium">{viewDoc.name}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Preview not available for this file type</p>
              <a href={viewDoc.dataUrl} download={viewDoc.name} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                <Download size={14} /> Download to view
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
