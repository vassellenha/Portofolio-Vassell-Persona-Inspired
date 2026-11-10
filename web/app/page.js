import { getSiteData } from "../lib/api";
import { Hero, Profile, Skills, Heists, Confidant, Contact } from "../components/Sections";

// ISR: halaman dibangun statis lalu disegarkan di server tiap 60 detik.
export const revalidate = 60;

export default async function Page() {
  const { profile, heists, confidants } = await getSiteData();

  return (
    <main id="main">
      <Hero profile={profile} />
      <Profile profile={profile} />
      <Skills profile={profile} />
      <Heists heists={heists} />
      <Confidant confidants={confidants} />
      <Contact profile={profile} />
    </main>
  );
}
