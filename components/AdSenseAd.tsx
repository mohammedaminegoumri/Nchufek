"use client";

import { useEffect } from "react";

export default function AdSenseAd() {
  useEffect(() => {
    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="my-8 flex justify-center px-4">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-6797042266624762"
        data-ad-slot="1258528696"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
