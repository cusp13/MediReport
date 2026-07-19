import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon } from "./icons";

type Props = {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  compact?: boolean;
};

function wrapperClass(disabled: boolean | undefined, isActive: boolean): string {
  if (disabled) return "bg-gray-200";
  if (isActive) return "bg-gradient-to-r from-blue-500 to-teal-400 shadow-lg shadow-blue-100";
  return "bg-gradient-to-r from-blue-200 via-teal-200 to-blue-200 hover:from-blue-400 hover:via-teal-400 hover:to-blue-400";
}

function innerClass(disabled: boolean | undefined, isActive: boolean): string {
  if (disabled) return "cursor-not-allowed bg-gray-50";
  if (isActive) return "bg-blue-50/80";
  return "bg-white/90 backdrop-blur hover:bg-blue-50/40";
}

function iconClass(isActive: boolean): string {
  if (isActive) return "scale-110 bg-blue-500 text-white";
  return "bg-gradient-to-br from-blue-50 to-teal-50 text-blue-500 group-hover:from-blue-100 group-hover:to-teal-100 group-hover:scale-105";
}

function headingText(isActive: boolean, hasFile: boolean, disabled: boolean | undefined): string {
  if (isActive) return "Release to analyze";
  if (hasFile && !disabled) return "Report selected";
  return "Drop your lab report here";
}

export function UploadDropzone({ onFileSelected, disabled, compact }: Readonly<Props>) {
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
    const compactDrag = isDragActive ? "border-blue-500 bg-blue-50" : "";
    const compactDisabled = disabled ? "cursor-not-allowed opacity-60" : "";
    return (
      <div
        {...getRootProps()}
        className={`group flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all hover:border-blue-400 hover:bg-blue-50/50 ${compactDrag} ${compactDisabled}`}
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

  const isActive = isDragActive && !disabled;
  const hasFile = !!fileName;
  const showFileName = hasFile && !disabled;

  return (
    <div className={`rounded-2xl p-px transition-all duration-300 ${wrapperClass(disabled, isActive)}`}>
      <div
        {...getRootProps()}
        className={`group relative flex cursor-pointer items-center gap-5 rounded-2xl px-6 py-5 transition-all duration-300 ${innerClass(disabled, isActive)}`}
      >
        <input {...getInputProps()} />

        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${iconClass(isActive)}`}>
          <UploadIcon className="h-6 w-6" />
        </div>

        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-900">
            {headingText(isActive, hasFile, disabled)}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            {showFileName
              ? <span className="font-medium text-blue-600">{fileName}</span>
              : <><span className="font-medium text-blue-600">Click to browse</span> · PDF, JPG or PNG</>
            }
          </p>
        </div>

        {!hasFile && (
          <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
            {["PDF", "JPG", "PNG"].map(fmt => (
              <span
                key={fmt}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-400"
              >
                {fmt}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
