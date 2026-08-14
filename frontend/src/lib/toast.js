import { toast } from "sonner";

const baseStyle = {
  borderRadius: "13px",
  fontFamily: "var(--font-body)",
};

export function notifySuccess(message, description) {
  toast.success(message, {
    description,
    style: {
      ...baseStyle,
      "--normal-bg": "#eef5ee",
      "--normal-text": "#3c5a4c",
      "--normal-border": "#cfe3d0",
    },
  });
}

export function notifyError(message, description) {
  toast.error(message, {
    description,
    style: {
      ...baseStyle,
      "--normal-bg": "#fdf0ee",
      "--normal-text": "#b3543a",
      "--normal-border": "#f2cec3",
    },
  });
}
