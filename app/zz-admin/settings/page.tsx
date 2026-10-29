import { adminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { getSettings, PLATFORMS, CATEGORIES } from "@/lib/settings";
import { CAT_EN } from "@/lib/site";
import { Nav } from "../nav";
import { saveSettingsAction } from "../actions";

export default async function Settings({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const me = await requireAdmin();
  const s = await getSettings(adminClient());
  return (
    <>
      <Nav email={me.email} />
      <h1>Settings</h1>
      {(await searchParams).ok && <p className="meta">✅ Saved</p>}
      <form action={saveSettingsAction}>
        <div className="row">
          <label><b>Posts per day (1–48)</b></label>
          <input name="posts_per_day" type="number" min={1} max={48} defaultValue={s.posts_per_day} />
          <span className="meta">Counted per day (Bangladesh time) and spread across the day. The pipeline runs hourly.</span>
        </div>
        <div className="row">
          <b>Approval mode</b><br />
          <label><input type="radio" name="approval_mode" value="manual" defaultChecked={s.approval_mode === "manual"} />Manual: every article stays a draft until you approve it</label><br />
          <label><input type="radio" name="approval_mode" value="auto" defaultChecked={s.approval_mode === "auto"} />Auto: reliable articles with an image publish automatically (politics, crime and health always stay drafts)</label><br />
          <label><input type="radio" name="approval_mode" value="ultra" defaultChecked={s.approval_mode === "ultra"} />Ultra Auto: every article with an image publishes automatically, including politics, crime and health — no approval at all</label>
          <div className="meta">Nothing is ever published or posted without an image. Ultra Auto has no human check: AI mistakes on sensitive stories (wrong names, accusations, health claims) go live and to your social pages immediately. You can still unpublish from the dashboard.</div>
        </div>
        <div className="row"><b>Social platforms (website is always on)</b><br />
          {PLATFORMS.map((p) => <label key={p} style={{ display: "block" }}><input type="checkbox" name={`p_${p}`} defaultChecked={s.platforms[p]} />{p[0].toUpperCase() + p.slice(1)}</label>)}
        </div>
        <div className="row"><b>Categories to write</b><br />
          {CATEGORIES.map((c) => <label key={c} style={{ display: "block" }}><input type="checkbox" name={`c_${c}`} defaultChecked={s.categories[c]} />{CAT_EN[c]}</label>)}
        </div>
        <div className="row"><b>Article images</b><br />
          <label><input type="radio" name="source_images" value="all" defaultChecked={s.source_images === "all"} />Use the source article&apos;s own photo when available (credited on the image), otherwise an AI concept image</label><br />
          <label><input type="radio" name="source_images" value="open" defaultChecked={s.source_images === "open"} />Use source photos only from open-licence sources (NASA, ESA, NOAA…), otherwise an AI concept image</label>
          <div className="meta">Note: most news photos are copyrighted. Using them is your decision and carries a takedown/strike risk, especially on Facebook and Instagram.</div>
        </div>
        <button className="btn">Save</button>
      </form>
    </>
  );
}
