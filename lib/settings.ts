export type Settings = {
  posts_per_day: number;
  approval_mode: "manual" | "auto" | "ultra";
  platforms: Record<string, boolean>;
  categories: Record<string, boolean>;
  source_images: "open" | "all";
};

export const PLATFORMS = ["telegram", "facebook", "instagram"] as const;
export const CATEGORIES = ["science", "tech", "bangladesh", "world"] as const;

export async function getSettings(db: any): Promise<Settings> {
  const { data } = await db.from("settings").select("key,value");
  const m: Record<string, any> = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));
  return {
    posts_per_day: Math.min(48, Math.max(1, Number(m.posts_per_day ?? 6))),
    approval_mode: m.approval_mode === "ultra" ? "ultra" : m.approval_mode === "auto" ? "auto" : "manual",
    platforms: { telegram: true, facebook: false, instagram: false, ...(m.platforms_enabled ?? {}) },
    categories: { science: true, tech: true, bangladesh: true, world: true, ...(m.categories_enabled ?? {}) },
    source_images: m.source_images === "open" ? "open" : "all",
  };
}

export async function saveSettings(db: any, s: Settings) {
  await db.from("settings").upsert([
    { key: "posts_per_day", value: s.posts_per_day },
    { key: "approval_mode", value: s.approval_mode },
    { key: "platforms_enabled", value: s.platforms },
    { key: "categories_enabled", value: s.categories },
    { key: "source_images", value: s.source_images },
  ].map((r) => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: "key" });
}
