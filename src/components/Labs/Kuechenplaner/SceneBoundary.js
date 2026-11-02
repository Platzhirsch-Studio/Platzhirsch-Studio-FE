"use client";
// R2: Fehlergrenze um die nachgeladene 3D-Szene (Küchen- und Sofaplaner).
// Fängt einen abgebrochenen Chunk-Download (langsames oder unterbrochenes Netz)
// und Laufzeitfehler in three.js ab, damit nicht der ganze Planer ausfällt.
// Der Planer zeigt dann den 2D-Grundriss und bietet „Erneut laden“ an.
import { Component } from "react";

export default class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
