// src/components/StatusBadge.jsx
// Usage: <StatusBadge value="pending" size="small|medium|large" variant="subtle|solid" />
export default function StatusBadge({ value, size = "medium", variant = "subtle", title }) {
    const v = String(value || "").trim().toLowerCase();

    // Map many aliases to a small set of tones
    const toneByStatus = {
        pending: "neutral",
        queued: "neutral",
        draft: "info",
        inspecting: "info",
        confirming: "info",
        "in-progress": "info",
        in_progress: "info",
        working: "info",
        confirmed: "info",
        active: "success",
        completed: "success",
        paid: "success",
        approved: "success",
        released: "success",
        success: "success",
        cancelled: "danger",
        canceled: "danger",
        rejected: "danger",
        inactive: "danger",
        scrapped: "danger",
        failed: "danger",
        error: "danger",
    };

    const tone = toneByStatus[v] || "neutral";

    // Contrast-aware palettes (text, background, border)
    const palettes = {
        neutral: { fg: "#374151", bg: "#f3f4f6", br: "#e5e7eb" },
        info: { fg: "#1d4ed8", bg: "#eff6ff", br: "#bfdbfe" },
        success: { fg: "#166534", bg: "#f0fdf4", br: "#bbf7d0" },
        warning: { fg: "#92400e", bg: "#fffbeb", br: "#fde68a" },
        danger: { fg: "#991b1b", bg: "#fef2f2", br: "#fecaca" },
    };

    const { fg, bg, br } = palettes[tone] || palettes.neutral;

    const sizes = {
        small: { padY: 2, padX: 8, font: 12 },
        medium: { padY: 4, padX: 10, font: 12 },
        large: { padY: 6, padX: 12, font: 13 },
    };
    const s = sizes[size] || sizes.medium;

    const styles =
        variant === "solid"
            ? {
                color: "#ffffff",
                backgroundColor:
                    tone === "danger" ? "#dc2626" : tone === "success" ? "#16a34a" : tone === "info" ? "#2563eb" : "#4b5563",
                border: `1px solid ${tone === "danger" ? "#b91c1c" : tone === "success" ? "#15803d" : tone === "info" ? "#1d4ed8" : "#374151"}`,
            }
            : {
                color: fg,
                backgroundColor: bg,
                border: `1px solid ${br}`,
            };

    const label = (value ?? "").toString();

    return (
        <span
            aria-label={`Status: ${label}`}
            title={title || label}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: `${s.padY}px ${s.padX}px`,
                borderRadius: 9999,
                fontSize: s.font,
                fontWeight: 700,
                lineHeight: 1,
                textTransform: "none",
                ...styles,
            }}
        >
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: styles.color === "#ffffff" ? "#ffffff" : fg, opacity: 0.9 }} />
      <span>{label}</span>
    </span>
    );
}
