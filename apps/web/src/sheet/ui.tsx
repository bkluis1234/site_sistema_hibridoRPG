import { useEffect, useRef, useState, type ReactNode } from "react";
import { Skull, Upload, X } from "lucide-react";
import { type SheetDetails } from "../../../../packages/shared/src/index";
export function Panel({
  id,
  title,
  icon,
  children,
  className = "",
}: {
  id?: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={"sheet-panel " + className}>
      <h2 className="brush-heading">
        {icon}
        <span>{title}</span>
      </h2>
      <div className="sheet-panel-body">{children}</div>
    </section>
  );
}
export function InputField({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="sheet-field">
      <label>
        <span>{label}</span>
        {children}
      </label>
      {error && (
        <span className="sheet-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
export function Portrait({ settings }: { settings: SheetDetails["portrait"] }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <div className="portrait-box">
      <div className="portrait-frame">
        {preview ? (
          <img src={preview} alt="Prévia local do retrato" />
        ) : (
          <>
            <Skull size={48} strokeWidth={0.8} />
            <span>FOTO / DESENHO</span>
          </>
        )}
      </div>
      <input
        className="sr-only"
        type="file"
        ref={file}
        accept={settings.mimeTypes.join(",")}
        aria-label="Selecionar retrato"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (
            !settings.mimeTypes.includes(f.type) ||
            f.size > settings.maxBytes
          ) {
            setError(
              "Selecione PNG, JPEG ou WebP de até " +
                settings.maxBytes / 1024 / 1024 +
                " MB.",
            );
            e.target.value = "";
            return;
          }
          setPreview(URL.createObjectURL(f));
          setError("");
        }}
      />
      <div className="portrait-actions">
        <button
          className="sheet-quiet"
          type="button"
          onClick={() => file.current?.click()}
        >
          <Upload size={14} />
          {preview ? "Substituir" : "Selecionar imagem"}
        </button>
        {preview && (
          <button
            className="icon-button"
            aria-label="Remover prévia"
            onClick={() => {
              setPreview(null);
              if (file.current) file.current.value = "";
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <p className="sheet-help">
        Prévia neste dispositivo. O envio persistente aguarda configuração de
        storage.
      </p>
      {error && (
        <p role="alert" className="sheet-field-error">
          {error}
        </p>
      )}
    </div>
  );
}
