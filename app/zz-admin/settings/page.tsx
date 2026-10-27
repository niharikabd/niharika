import { adminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { getSettings, PLATFORMS, CATEGORIES } from "@/lib/settings";
import { CATS } from "@/lib/site";
import { Nav } from "../nav";
import { saveSettingsAction } from "../actions";

export default async function Settings({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const me = await requireAdmin();
  const s = await getSettings(adminClient());
  return (
    <>
      <Nav email={me.email} />
      <h1>সেটিংস</h1>
      {(await searchParams).ok && <p className="meta">✅ সেভ হয়েছে</p>}
      <form action={saveSettingsAction}>
        <div className="row">
          <label><b>প্রতিদিন কয়টি পোস্ট (১–৪৮)</b></label>
          <input name="posts_per_day" type="number" min={1} max={48} defaultValue={s.posts_per_day} />
          <span className="meta">বাংলাদেশ সময়ের দিন ধরে হিসাব; সারাদিনে সমানভাবে ছড়িয়ে লেখা হয়।</span>
        </div>
        <div className="row">
          <b>অনুমোদন মোড</b><br />
          <label><input type="radio" name="approval_mode" value="manual" defaultChecked={s.approval_mode === "manual"} />ম্যানুয়াল: সব লেখা draft, আপনি অনুমোদন দিলে প্রকাশ</label><br />
          <label><input type="radio" name="approval_mode" value="auto" defaultChecked={s.approval_mode === "auto"} />অটো: নির্ভরযোগ্য লেখা নিজে প্রকাশ (রাজনীতি, অপরাধ, স্বাস্থ্য সবসময় draft)</label>
        </div>
        <div className="row"><b>Social platform (website সবসময় চালু)</b><br />
          {PLATFORMS.map((p) => <label key={p} style={{ display: "block" }}><input type="checkbox" name={`p_${p}`} defaultChecked={s.platforms[p]} />{p}</label>)}
        </div>
        <div className="row"><b>যেসব বিভাগের খবর লেখা হবে</b><br />
          {CATEGORIES.map((c) => <label key={c} style={{ display: "block" }}><input type="checkbox" name={`c_${c}`} defaultChecked={s.categories[c]} />{CATS[c]}</label>)}
        </div>
        <button className="btn">সেভ</button>
      </form>
    </>
  );
}
