// Kartu flip CSS-only (Server Component, nol JS, nol hydration):
// checkbox tersembunyi + label. Keyboard: Tab ke checkbox, Space/Enter membalik. Face yang tidak aktif
// di-set visibility:hidden (setelah setengah animasi) sehingga link di dalamnya tidak bisa di-Tab.
const FACE =
  "[backface-visibility:hidden] [grid-area:1/1] [transition:visibility_0s_.25s]";
const FOCUS =
  "group-has-[:focus-visible]:outline group-has-[:focus-visible]:outline-[3px] group-has-[:focus-visible]:outline-offset-4 group-has-[:focus-visible]:outline-fg";

export default function FlipCard({ id, front, back, label, shadow = "fg" }) {
  return (
    <div className="group -skew-x-6 [perspective:1200px]">
      <input id={id} type="checkbox" data-flip aria-label={label} className="peer sr-only" />
      <div className="grid transition-transform duration-500 ease-out [transform-style:preserve-3d] group-has-[:checked]:[transform:rotateY(180deg)]">
        <label
          htmlFor={id}
          className={`${FACE} ${FOCUS} cursor-pointer border-[3px] border-fg bg-bg transition-colors duration-100 hover:border-red group-has-[:checked]:invisible ${
            shadow === "red" ? "shadow-[8px_8px_0_var(--red)]" : "shadow-[8px_8px_0_var(--fg)]"
          }`}
        >
          <span className="block skew-x-6 p-5">{front}</span>
        </label>

        <div
          className={`${FACE} invisible border-[3px] border-fg bg-bg shadow-[8px_8px_0_var(--red)] [transform:rotateY(180deg)] group-has-[:checked]:visible`}
        >
          <div className="skew-x-6 p-5">
            {back}
            <label
              htmlFor={id}
              className="mt-4 inline-block -skew-x-12 cursor-pointer border-[3px] border-fg px-4 py-1 text-xs font-black uppercase italic tracking-tighter transition-colors duration-100 hover:bg-fg hover:text-bg"
            >
              <span className="inline-block skew-x-12">Balik</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
