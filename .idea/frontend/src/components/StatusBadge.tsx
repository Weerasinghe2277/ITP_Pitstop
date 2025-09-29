// src/components/StatusBadge.jsx
// Usage: <StatusBadge value="pending" size="small|medium|large" variant="subtle|solid|gradient" showDot showAnimation />
export default function StatusBadge({
                                        value,
                                        size = "medium",
                                        variant = "subtle",
                                        title,
                                        showDot = true,
                                        showAnimation = false,
                                        className = "",
                                        onClick
                                    }) {
    const v = String(value || "").trim().toLowerCase();

    // Enhanced status mapping with more variants and icons
    const toneByStatus = {
        // Neutral tones
        pending: "neutral",
        queued: "neutral",
        waiting: "neutral",
        scheduled: "neutral",

        // Info tones
        draft: "info",
        inspecting: "info",
        confirming: "info",
        "in-progress": "info",
        in_progress: "info",
        working: "info",
        confirmed: "info",
        processing: "info",
        assigned: "info",

        // Success tones
        active: "success",
        completed: "success",
        done: "success",
        paid: "success",
        approved: "success",
        released: "success",
        success: "success",
        delivered: "success",
        verified: "success",

        // Warning tones
        warning: "warning",
        attention: "warning",
        "needs-review": "warning",
        on_hold: "warning",
        paused: "warning",

        // Danger tones
        cancelled: "danger",
        canceled: "danger",
        rejected: "danger",
        inactive: "danger",
        scrapped: "danger",
        failed: "danger",
        error: "danger",
        declined: "danger",
        expired: "danger",
    };

    const tone = toneByStatus[v] || "neutral";

    // Enhanced color palettes with modern gradients
    const palettes = {
        neutral: {
            fg: "#6B7280",
            bg: "#F9FAFB",
            br: "#E5E7EB",
            gradient: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
            shadow: "0 1px 2px rgba(107, 114, 128, 0.1)"
        },
        info: {
            fg: "#1D4ED8",
            bg: "#EFF6FF",
            br: "#BFDBFE",
            gradient: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
            shadow: "0 1px 2px rgba(29, 78, 216, 0.1)"
        },
        success: {
            fg: "#059669",
            bg: "#ECFDF5",
            br: "#A7F3D0",
            gradient: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
            shadow: "0 1px 2px rgba(5, 150, 105, 0.1)"
        },
        warning: {
            fg: "#D97706",
            bg: "#FFFBEB",
            br: "#FDE68A",
            gradient: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
            shadow: "0 1px 2px rgba(217, 119, 6, 0.1)"
        },
        danger: {
            fg: "#DC2626",
            bg: "#FEF2F2",
            br: "#FECACA",
            gradient: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
            shadow: "0 1px 2px rgba(220, 38, 38, 0.1)"
        },
    };

    const { fg, bg, br, gradient, shadow } = palettes[tone] || palettes.neutral;

    // Enhanced sizes with better proportions
    const sizes = {
        small: {
            padY: 4,
            padX: 10,
            font: 11,
            dotSize: 5,
            gap: 4,
            borderRadius: 12
        },
        medium: {
            padY: 6,
            padX: 14,
            font: 12,
            dotSize: 6,
            gap: 6,
            borderRadius: 16
        },
        large: {
            padY: 8,
            padX: 18,
            font: 13,
            dotSize: 7,
            gap: 8,
            borderRadius: 20
        },
    };
    const s = sizes[size] || sizes.medium;

    // Solid variant colors
    const solidColors = {
        neutral: { bg: "#6B7280", border: "#4B5563", fg: "#FFFFFF" },
        info: { bg: "#2563EB", border: "#1D4ED8", fg: "#FFFFFF" },
        success: { bg: "#059669", border: "#047857", fg: "#FFFFFF" },
        warning: { bg: "#D97706", border: "#B45309", fg: "#FFFFFF" },
        danger: { bg: "#DC2626", border: "#B91C1C", fg: "#FFFFFF" },
    };

    // Get styles based on variant
    const getStyles = () => {
        switch (variant) {
            case "solid":
                const solid = solidColors[tone] || solidColors.neutral;
                return {
                    color: solid.fg,
                    backgroundColor: solid.bg,
                    border: `1px solid ${solid.border}`,
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
                    backgroundImage: "none",
                };

            case "gradient":
                return {
                    color: fg,
                    backgroundImage: gradient,
                    border: `1px solid ${br}`,
                    boxShadow: shadow,
                };

            case "subtle":
            default:
                return {
                    color: fg,
                    backgroundColor: bg,
                    border: `1px solid ${br}`,
                    boxShadow: shadow,
                    backgroundImage: "none",
                };
        }
    };

    const styles = getStyles();
    const label = (value ?? "").toString().replace(/_/g, " ").replace(/-/g, " ");

    // Animation styles
    const animationStyle = showAnimation ? {
        animation: "pulse 2s infinite",
    } : {};

    // Dot with enhanced design
    const Dot = () => (
        <span
            style={{
                width: s.dotSize,
                height: s.dotSize,
                borderRadius: "50%",
                backgroundColor: variant === "solid" ? "#FFFFFF" : fg,
                opacity: variant === "solid" ? 0.9 : 0.8,
                boxShadow: variant === "solid" ? "0 0 4px rgba(255,255,255,0.3)" : "none",
                transition: "all 0.2s ease-in-out",
            }}
            className={showAnimation ? "status-dot-pulse" : ""}
        />
    );

    return (
        <span
            aria-label={`Status: ${label}`}
            title={title || label}
            onClick={onClick}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: s.gap,
                padding: `${s.padY}px ${s.padX}px`,
                borderRadius: s.borderRadius,
                fontSize: s.font,
                fontWeight: 600,
                lineHeight: 1,
                textTransform: "capitalize",
                letterSpacing: "0.025em",
                cursor: onClick ? "pointer" : "default",
                transition: "all 0.2s ease-in-out",
                position: "relative",
                overflow: "hidden",
                ...styles,
                ...animationStyle,
            }}
            className={`status-badge status-badge-${tone} ${className}`}
        >
            {/* Optional shimmer effect for gradient variant */}
            {variant === "gradient" && (
                <span
                    style={{
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                        transition: "left 0.5s ease-in-out",
                    }}
                    className="status-shimmer"
                />
            )}

            {showDot && <Dot />}
            <span style={{
                position: "relative",
                zIndex: 1,
                whiteSpace: "nowrap"
            }}>
                {label}
            </span>
        </span>
    );
}

// Enhanced CSS for animations and hover effects
const statusBadgeStyles = `
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

@keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}

.status-badge {
    user-select: none;
    backdrop-filter: blur(8px);
}

.status-badge:hover .status-shimmer {
    animation: shimmer 1.5s ease-in-out;
}

.status-dot-pulse {
    animation: pulse 2s ease-in-out infinite;
}

.status-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* Specific hover effects for each variant */
.status-badge-neutral:hover { border-color: #9CA3AF; }
.status-badge-info:hover { border-color: #93C5FD; }
.status-badge-success:hover { border-color: #6EE7B7; }
.status-badge-warning:hover { border-color: #FCD34D; }
.status-badge-danger:hover { border-color: #FCA5A5; }

/* Focus styles for accessibility */
.status-badge:focus {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .status-badge {
        font-size: 11px !important;
        padding: 4px 8px !important;
    }
}
`;

// Inject styles (you might want to do this in your main CSS file)
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = statusBadgeStyles;
    document.head.appendChild(styleSheet);
}

// Enhanced usage examples:
/*
// Basic usage
<StatusBadge value="pending" />
<StatusBadge value="in-progress" />
<StatusBadge value="completed" />

// Different sizes
<StatusBadge value="pending" size="small" />
<StatusBadge value="pending" size="medium" />
<StatusBadge value="pending" size="large" />

// Different variants
<StatusBadge value="pending" variant="subtle" />
<StatusBadge value="pending" variant="solid" />
<StatusBadge value="pending" variant="gradient" />

// With animations
<StatusBadge value="working" showAnimation={true} />
<StatusBadge value="pending" showDot={false} />

// Clickable badge
<StatusBadge value="clickable" onClick={() => console.log('Clicked!')} />

// Custom className
<StatusBadge value="custom" className="my-custom-class" />
*/