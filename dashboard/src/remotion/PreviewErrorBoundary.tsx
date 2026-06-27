"use client";

import React from "react";

// If the live <Player> fails at runtime (e.g. a composition with deps that don't
// like the browser bundle), show the fallback (still + render flow) instead of a
// broken modal.
export class PreviewErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("Live preview failed, falling back:", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
