// QM content-legal r2: news card as a row below lg (photo beside the text) – the
// backoffice photos are small (≈ 150–460 px), full-width tiles on phones blew
// them up 4–7× in device pixels. Photo column in px, so 200 % text does not
// enlarge it. Used by the news list and "Weitere Beiträge".
//
// QM content-legal r3:
// · phones (< sm): photo 128 px beside the TITLE only, the teaser runs across the
//   whole card below (3 lines) – the 190 px text column gave ~18 characters a
//   line and 500 px high entries.
// · sm – lg (iPad hoch): one list column, photo 240 px beside title + teaser
//   (three 230 px columns broke titles into 4 lines and teasers into 9).
// · 200 % text (the <li> is the container, under 16 rem): photo above the text.
// · titles hyphenate, long words wrap instead of running past the edge.
export const NEWS_ROW = [
  "max-lg:grid max-lg:grid-cols-[128px_minmax(0,1fr)] max-lg:items-start max-lg:gap-x-4 max-lg:[&>div:last-child]:mt-0",
  "max-sm:[&>div:last-child]:contents max-sm:[&_h3]:col-start-2 max-sm:[&_h3]:row-start-1 max-sm:[&_h3]:self-center",
  "max-sm:[&_p]:col-span-2 max-sm:[&_p]:mt-3 max-sm:[&_p]:line-clamp-3",
  "sm:max-lg:grid-cols-[240px_minmax(0,1fr)] sm:max-lg:gap-x-grid",
  "@max-[16rem]:grid-cols-1 @max-[16rem]:[&>*:first-child]:w-[176px] @max-[16rem]:[&>*:first-child]:max-w-full @max-[16rem]:[&_h3]:col-start-1 @max-[16rem]:[&_h3]:row-start-2 @max-[16rem]:[&_h3]:mt-3 @max-[16rem]:[&_p]:col-span-1",
  "[&_h3]:hyphens-auto [&_h3]:wrap-break-word",
  // QM content-legal r4 (desktop, 200 % text): the three columns stayed (lg is a
  // px breakpoint) – 176 px photos, titles cut every 8 letters, 10-line teasers.
  // The list wrapper is the size container `news` (rem): under 56 rem it is one
  // column of row cards – 240 px photo beside title and teaser (4 lines).
  "lg:@max-[56rem]/news:grid lg:@max-[56rem]/news:grid-cols-[240px_minmax(0,1fr)] lg:@max-[56rem]/news:items-start lg:@max-[56rem]/news:gap-x-grid lg:@max-[56rem]/news:[&>div:last-child]:mt-0 lg:@max-[56rem]/news:[&_p]:line-clamp-4",
].join(" ");

/** Wrapper of every news list: the size container the columns follow (rem, so 200 % text → one column). */
export const NEWS_LIST_CONTAINER = "@container/news";

/** List column classes for NewsMore / "Weitere Beiträge"; each <li> is a size container. */
export const NEWS_GRID = "grid grid-cols-1 gap-x-grid gap-y-10 *:@container lg:@min-[56rem]/news:grid-cols-3 lg:gap-y-14";

/** Real layout widths of the card photo (see NEWS_ROW). */
export const NEWS_SIZES = "(min-width: 1440px) 430px, (min-width: 1024px) 30vw, (min-width: 640px) 240px, 128px";

// "Weitere Beiträge" with only two posts: from lg two columns of row cards
// (photo 200 px beside the text) instead of three tiles with an empty third.
export const NEWS_ROW_WIDE = `${NEWS_ROW} lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start lg:gap-x-6 lg:[&>div:last-child]:mt-0`;
export const NEWS_GRID_TWO = "grid grid-cols-1 gap-x-grid gap-y-10 *:@container lg:@min-[56rem]/news:grid-cols-2 lg:gap-y-14";
export const NEWS_SIZES_WIDE = "(min-width: 1024px) 200px, (min-width: 640px) 240px, 128px";
