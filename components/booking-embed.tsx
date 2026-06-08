"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";

/**
 * Inline Cal.com calendar. Only rendered when a real calLink is configured
 * (see isCalConfigured in lib/content). Brand color is matched to the clay accent.
 */
export default function BookingEmbed({ calLink }: { calLink: string }) {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        cssVarsPerTheme: { light: { "cal-brand": "#bd5a36" }, dark: {} },
        hideEventTypeDetails: true,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <Cal
      calLink={calLink}
      style={{ width: "100%", height: "100%", overflow: "auto" }}
      config={{ layout: "month_view" }}
    />
  );
}
