"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

type MuiEmotionRegistryProps = {
  children: ReactNode;
};

export default function MuiEmotionRegistry({ children }: MuiEmotionRegistryProps) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "mui", prepend: true });
    cache.compat = true;

    const prevInsert = cache.insert;
    let inserted: string[] = [];

    cache.insert = (...args: Parameters<typeof prevInsert>) => {
      const serialized = args[1] as { name: string };
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };

    const flush = () => {
      const previouslyInserted = inserted;
      inserted = [];
      return previouslyInserted;
    };

    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }

    let styles = "";
    for (const name of names) {
      styles += cache.inserted[name];
    }

    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
