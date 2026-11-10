import { getJson, FALLBACK_PROFILE } from "../lib/api";
import { Hero, Profile, Heists, Confidant, Contact } from "../components/Sections";

// ISR: halaman dibangun statis lalu disegarkan di server tiap 60 detik.
export const revalidate = 60;

export default async function Page() {
  const [data, heists] = await Promise.all([
    getJson("/api/profile", FALLBACK_PROFILE),
    getJson("/api/heists", []),
  ]);
  const profile = { ...FALLBACK_PROFILE, ...data, stats: data.stats ?? [], confidants: data.confidants ?? [] };

  return (
    <main id="main">
      <Hero profile={profile} />
      <Profile profile={profile} />
      <Heists heists={Array.isArray(heists) ? heists : []} />
      <Confidant confidants={profile.confidants} />
      <Contact profile={profile} />
    </main>
  );
}
