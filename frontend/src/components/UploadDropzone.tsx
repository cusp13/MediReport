import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon } from "./icons";

type Props = {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function UploadDropzone({ onFileSelected, disabled, compact }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setFileName(file.name);
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"]
    }
  });

  if (compact) {
    return (
      <div
        {...getRootProps()}
        className={`group flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all hover:border-blue-400 hover:bg-blue-50/50 ${
          isDragActive ? "border-blue-500 bg-blue-50" : ""
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
          <UploadIcon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-gray-700">
          Analyze another report
        </span>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`group relative overflow-hidden rounded-3xl border-2 border-dashed p-12 text-center transition-all ${
        disabled
          ? "cursor-not-allowed border-gray-200 bg-gray-50"
          : "cursor-pointer border-blue-200 bg-white/80 backdrop-blur hover:border-blue-400 hover:bg-blue-50/60"
      } ${isDragActive ? "border-blue-500 bg-blue-50 scale-[1.01] shadow-lg shadow-blue-100" : "shadow-sm"}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
            isDragActive
              ? "bg-blue-500 text-white scale-110"
              : "bg-blue-50 text-blue-500 group-hover:scale-105 group-hover:bg-blue-100"
          }`}
        >
          <UploadIcon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {isDragActive ? "Drop it here" : "Drop your lab report to begin"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            or <span className="font-medium text-blue-600">click to browse</span>
          </p>
        </div>
        {fileName && !disabled ? (
          <p className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {fileName}
          </p>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium">PDF</span>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium">JPG</span>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium">PNG</span>
          </div>
        )}
      </div>
    </div>
  );
}
