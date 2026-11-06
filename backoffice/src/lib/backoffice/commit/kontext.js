"use client";
// React-Kontext der Commit-Warteschlange. Bereitgestellt vom ToastProvider (components/Backoffice/Toast.js,
// eingebunden in Shell und KioskShell); gelesen von useVerzoegerterCommit() und <Ausstehend>.

import { createContext } from "react";

export const CommitKontext = createContext(null);
