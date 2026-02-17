/**
 * Type shim so the Hub typechecks against React 19 without pulling in
 * design-system source (which is typed for React 18). The design-system
 * package is consumed at runtime as-is; this file only affects type-checking.
 */
declare module "@antiphon/design-system/components" {
  import type { ComponentType } from "react";
  export const Button: ComponentType<
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: "primary" | "secondary" | "ghost" | "link" | "danger" | "outline" | "default" | "destructive";
      size?: "compact" | "default" | "spacious" | "sm" | "lg" | "icon";
    }
  >;
  export const Card: ComponentType<
    { children?: React.ReactNode; variant?: "flat" | "raised" | "inset"; padding?: "none" | "compact" | "default" | "spacious"; className?: string }
  >;
  export const CardHeader: ComponentType<
    { title: string; subtitle?: string; actions?: React.ReactNode; className?: string }
  >;
  export const Input: ComponentType<
    React.InputHTMLAttributes<HTMLInputElement> & {
      label?: string;
      error?: string;
      helperText?: string;
      prefix?: React.ReactNode;
      suffix?: React.ReactNode;
    }
  >;
}
