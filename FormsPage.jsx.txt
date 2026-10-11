import "./FormsPage.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase.js";

const BUCKET = "lab-documents";
const FOLDER = "Forms";

function getFileType(name) {
  const ext = String(name || "").split(".").pop().toLowerCase();

  if (ext === "pdf") return "PDF";
  if (["doc", "docx"].includes(ext)) return "WORD";
  if (["xls", "xlsx"].includes(ext)) return "EXCEL";

  return "FILE";
}

function getIcon(type) {
  if (type === "PDF") return "📕";
  if (type === "WORD") return "📘";
  if (type === "EXCEL") return "📗";
  return "📄";
}

function cleanName(name) {
  return String(name || "")
    .replace(/^Forms\//i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function FormsPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [uploadType, setUploadType] = useState("PDF");
  const [uploading, setUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState("");

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedUrl, setSelectedUrl] = useState("");
  const [viewerLoading, setViewerLoading] = useState(false);

  const fileInputRef = useRef(null);

  const loadForms = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await supabase.storage
        .from(BUCKET)
        .list(FOLDER, {
          limit: 1000,
          offset: 0,
          sortBy: {
            column: "name",
            order: "asc",
          },
        });

      if (result.error) throw result.error;

      const data = result.data || [];

      const prepared = data
        .filter((file) => file && file.name)
        .map((file) => {
          const type = getFileType(file.name);

          return {
            ...file,
            path: `${FOLDER}/${file.name}`,
            displayName: cleanName(file.name),
            type,
            icon: getIcon(type),
          };
        });

      setFiles(prepared);

      if (prepared.length === 0) {
        setError(
          "Supabase وصل بنجاح، لكن لم يتم العثور على ملفات داخل Forms."
        );
      }
    } catch (err) {
      console.error("FORMS LOAD ERROR:", err);

      setFiles([]);
      setError(
        err?.message ||
          "Unable to load forms from Supabase Storage."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();

    return files.filter((file) => {
      const matchesSearch =
        !q ||
        file.displayName.toLowerCase().includes(q);

      const matchesType =
        typeFilter === "ALL" ||
        file.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [files, search, typeFilter]);

  const counts = useMemo(
    () => ({
      all: files.length,
      pdf: files.filter((x) => x.type === "PDF").length,
      word: files.filter((x) => x.type === "WORD").length,
      excel: files.filter((x) => x.type === "EXCEL").length,
    }),
    [files]
  );

  const getSignedUrl = async (file) => {
    const result = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.path, 60 * 60);

    if (result.error) throw result.error;

    if (!result.data?.signedUrl) {
      throw new Error("Supabase did not return a file URL.");
    }

    return result.data.signedUrl;
  };

  /*
   * OPEN
   * PDF opens inside our viewer.
   * Word/Excel also open inside the viewer when the browser can render them.
   * If the browser cannot render an Office file, it will use its normal
   * browser behavior instead of forcing a download from our code.
   */
  const openFile = async (file) => {
    setViewerLoading(true);
    setSelectedFile(file);
    setSelectedUrl("");
    setViewerOpen(true);

    try {
      const url = await getSignedUrl(file);
      setSelectedUrl(url);
    } catch (err) {
      console.error("OPEN FILE ERROR:", err);

      setViewerOpen(false);
      setSelectedFile(null);
      setSelectedUrl("");

      alert(
        "لم يتم فتح الملف:\n\n" +
          (err?.message || "Unknown error")
      );
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedFile(null);
    setSelectedUrl("");
  };

  /*
   * PRINT
   *
   * IMPORTANT:
   * We do NOT download the file.
   *
   * PDF:
   * Opens the signed PDF in a new browser tab. The browser's PDF viewer
   * provides the real Print button and does not download automatically.
   *
   * DOC/DOCX/XLS/XLSX:
   * These formats are not natively printable inside a browser iframe.
   * We open the file in a new tab and let the browser/application handle it.
   */
  const printFile = async (file) => {
    try {
      const url = await getSignedUrl(file);

      const printWindow = window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

      if (!printWindow) {
        alert(
          "المتصفح منع فتح نافذة الطباعة.\n\n" +
            "اسمح بالنوافذ المنبثقة لهذا الموقع ثم اضغط Print مرة أخرى."
        );
      }
    } catch (err) {
      console.error("PRINT ERROR:", err);

      alert(
        "لم يتم فتح الملف للطباعة:\n\n" +
          (err?.message || "Unknown error")
      );
    }
  };

  // DELETE FILE
  const deleteFile = async (file) => {
    if (!file?.path) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الملف؟\n\n${file.displayName}\n\nلا يمكن التراجع عن الحذف.`
    );

    if (!confirmed) return;

    try {
      setDeletingPath(file.path);
      setError("");

      const result = await supabase.storage
        .from(BUCKET)
        .remove([file.path]);

      if (result.error) {
        throw result.error;
      }

      // Remove immediately from the UI
      setFiles((current) =>
        current.filter((item) => item.path !== file.path)
      );

      // Close viewer if the deleted file is currently open
      if (selectedFile?.path === file.path) {
        closeViewer();
      }

      alert("تم حذف الملف بنجاح.");
    } catch (err) {
      console.error("DELETE ERROR:", err);

      alert(
        "فشل حذف الملف:\n\n" +
          (err?.message || "Unknown error") +
          "\n\nتأكد أن Storage Policy تسمح بالحذف من lab-documents."
      );
    } finally {
      setDeletingPath("");
    }
  };

  const allowedExtensions = {
    PDF: ["pdf"],
    WORD: ["doc", "docx"],
    EXCEL: ["xls", "xlsx"],
  };

  const handleUploadClick = () => {
    if (uploading) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const extension = file.name
      .split(".")
      .pop()
      .toLowerCase();

    const allowed = allowedExtensions[uploadType] || [];

    if (!allowed.includes(extension)) {
      alert(
        `نوع الملف غير صحيح.\n\nاختار ملف ${uploadType}.`
      );

      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");

      const safeName = file.name
        .replace(/\s+/g, "_")
        .replace(/[^\w.\-()]+/g, "");

      const fileName = `${Date.now()}_${safeName}`;
      const filePath = `${FOLDER}/${fileName}`;

      const result = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (result.error) {
        throw result.error;
      }

      await loadForms();

      alert("تم رفع الملف بنجاح.");
    } catch (err) {
      console.error("UPLOAD ERROR:", err);

      alert(
        "فشل رفع الملف:\n\n" +
          (err?.message || "Unknown error") +
          "\n\nتأكد من Storage Policies الخاصة بـ lab-documents."
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="forms-page">

      {/* HEADER */}
      <div className="heading">
        <div>
          <h1>Forms Center</h1>
          <p>Laboratory Forms & Documents</p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value)}
            disabled={uploading}
            className="forms-upload-type"
            title="Choose file type"
          >
            <option value="PDF">PDF</option>
            <option value="WORD">Word</option>
            <option value="EXCEL">Excel</option>
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept={
              uploadType === "PDF"
                ? ".pdf,application/pdf"
                : uploadType === "WORD"
                ? ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                : ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
            onChange={handleUpload}
            style={{ display: "none" }}
          />

          <button
            className="forms-upload-btn"
            onClick={handleUploadClick}
            disabled={uploading}
            type="button"
          >
            {uploading ? "⏳ Uploading..." : "⬆ Upload"}
          </button>

          <button
            className="outline-btn"
            onClick={loadForms}
            disabled={loading || uploading}
            type="button"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="forms-stats">

        <button
          className={
            "form-stat " +
            (typeFilter === "ALL" ? "active" : "")
          }
          onClick={() => setTypeFilter("ALL")}
          type="button"
        >
          <span>📁</span>
          <div>
            <b>{counts.all}</b>
            <small>All Forms</small>
          </div>
        </button>

        <button
          className={
            "form-stat " +
            (typeFilter === "PDF" ? "active" : "")
          }
          onClick={() => setTypeFilter("PDF")}
          type="button"
        >
          <span>📕</span>
          <div>
            <b>{counts.pdf}</b>
            <small>PDF Files</small>
          </div>
        </button>

        <button
          className={
            "form-stat " +
            (typeFilter === "WORD" ? "active" : "")
          }
          onClick={() => setTypeFilter("WORD")}
          type="button"
        >
          <span>📘</span>
          <div>
            <b>{counts.word}</b>
            <small>Word Files</small>
          </div>
        </button>

        <button
          className={
            "form-stat " +
            (typeFilter === "EXCEL" ? "active" : "")
          }
          onClick={() => setTypeFilter("EXCEL")}
          type="button"
        >
          <span>📗</span>
          <div>
            <b>{counts.excel}</b>
            <small>Excel Files</small>
          </div>
        </button>

      </div>

      {/* FILTER */}
      <div className="forms-toolbar">

        <div className="forms-search">
          🔍

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search forms..."
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Types</option>
          <option value="PDF">PDF</option>
          <option value="WORD">Word</option>
          <option value="EXCEL">Excel</option>
          <option value="FILE">Other</option>
        </select>

      </div>

      {/* LOADING */}
      {loading && (
        <div className="forms-loading">
          <div>⏳</div>
          <h3>Loading Forms...</h3>
          <p>Connecting to Supabase Storage...</p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="forms-error">
          <b>⚠ Forms Error</b>
          <p>{error}</p>

          <button onClick={loadForms} type="button">
            ↻ Try Again
          </button>
        </div>
      )}

      {/* EMPTY SEARCH */}
      {!loading &&
        !error &&
        files.length > 0 &&
        filteredFiles.length === 0 && (
          <div className="forms-empty">
            <div>🔍</div>
            <h3>No Matching Forms</h3>
            <p>Try another search or file type.</p>
          </div>
        )}

      {/* FILES */}
      {!loading &&
        !error &&
        filteredFiles.length > 0 && (
          <div className="forms-grid">

            {filteredFiles.map((file) => (
              <div
                className="form-card"
                key={file.id || file.path}
              >

                <div className="form-card-top">

                  <div
                    className={
                      "form-file-icon " +
                      file.type.toLowerCase()
                    }
                  >
                    {file.icon}
                  </div>

                  <span
                    className={
                      "form-type " +
                      file.type.toLowerCase()
                    }
                  >
                    {file.type}
                  </span>

                </div>

                <div className="form-card-body">

                  <h3 title={file.displayName}>
                    {file.displayName}
                  </h3>

                  <small>
                    {file.type} Document
                  </small>

                </div>

                <div className="form-card-actions form-card-actions-three">

                  <button
                    className="open-form-btn"
                    onClick={() => openFile(file)}
                    type="button"
                    title="Open document"
                  >
                    👁 Open
                  </button>

                  <button
                    className="print-form-btn"
                    onClick={() => printFile(file)}
                    type="button"
                    title="Open document for printing"
                    disabled={deletingPath === file.path}
                  >
                    🖨 Print
                  </button>

                  <button
                    className="delete-form-btn"
                    onClick={() => deleteFile(file)}
                    type="button"
                    title="Delete document"
                    disabled={deletingPath === file.path || uploading}
                  >
                    {deletingPath === file.path ? "⏳ Deleting..." : "🗑 Delete"}
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      {/* INTERNAL VIEWER */}
      {viewerOpen && (
        <div
          className="forms-viewer-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeViewer();
            }
          }}
        >
          <div className="forms-viewer">

            <div className="forms-viewer-header">

              <div className="forms-viewer-title">
                <div
                  className={
                    "forms-viewer-icon " +
                    (selectedFile?.type || "").toLowerCase()
                  }
                >
                  {selectedFile?.icon}
                </div>

                <div>
                  <h3>
                    {selectedFile?.displayName}
                  </h3>

                  <span>
                    {selectedFile?.type} Document
                  </span>
                </div>
              </div>

              <div className="forms-viewer-actions">

                {selectedFile && (
                  <button
                    className="viewer-print"
                    onClick={() => printFile(selectedFile)}
                    type="button"
                  >
                    🖨 Print
                  </button>
                )}

                <button
                  className="viewer-close"
                  onClick={closeViewer}
                  type="button"
                  title="Close"
                >
                  ×
                </button>

              </div>

            </div>

            <div className="forms-viewer-body">

              {viewerLoading && (
                <div className="viewer-loading">
                  <div>⏳</div>
                  <p>Opening document...</p>
                </div>
              )}

              {!viewerLoading && selectedUrl && (
                <>
                  {selectedFile?.type === "PDF" ? (
                    <iframe
                      src={selectedUrl}
                      title={
                        selectedFile?.displayName || "Document"
                      }
                      className="forms-document-frame"
                    />
                  ) : (
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: "12px",
                        color: "#7894ad",
                        textAlign: "center",
                        padding: "30px",
                      }}
                    >
                      <div style={{ fontSize: "50px" }}>
                        {selectedFile?.icon}
                      </div>

                      <h3
                        style={{
                          color: "#e8f1ff",
                          margin: 0,
                        }}
                      >
                        {selectedFile?.displayName}
                      </h3>

                      <p style={{ margin: 0 }}>
                        This {selectedFile?.type} file cannot
                        be rendered directly by the browser.
                      </p>

                      <button
                        className="open-form-btn"
                        onClick={() => {
                          if (selectedUrl) {
                            window.open(
                              selectedUrl,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }
                        }}
                        type="button"
                      >
                        ↗ Open File
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}