import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "নীহারিকা", short_name: "নীহারিকা", start_url: "/", display: "standalone", background_color: "#0b1020", theme_color: "#0b1020", icons: [{ src: "/logo-192.png", sizes: "192x192", type: "image/png" }, { src: "/logo-512.png", sizes: "512x512", type: "image/png" }, { src: "/logo-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] };
}
