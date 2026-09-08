"use client";

import { useEffect, useState } from "react";
import { bankFetch } from "@/lib/api";

export interface SiteInfo {
  id: number;
  slug: string;
  name: string;
  brand_color?: string;
  primary_currency?: string;
  kyc_required?: boolean;
  logo_url?: string;
}

/** Fetch the currently viewed site's public info once. */
export function useSite() {
  const [site, setSite] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    bankFetch<{ site: SiteInfo }>("/site-info")
      .then((res) => {
        if (active && res.ok && res.data?.site) setSite(res.data.site);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { site, loading };
}