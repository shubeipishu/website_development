declare global {
  interface Window {
    app: unknown;
    GraphI18n?: {
      t?: (key: string, vars?: Record<string, string | number>) => string;
      getLang?: () => string;
      setLang?: (lang: string) => void;
      toggleLang?: () => void;
      apply?: (root?: Document | HTMLElement) => void;
      onChange?: (cb: (lang: string) => void) => void;
    };
    katex?: unknown;
    math?: unknown;
    GRAPH_CONFIG?: unknown;
    computeGraphStats?: (nodes: unknown[], edges: unknown[]) => unknown;
  }
}

export {};
