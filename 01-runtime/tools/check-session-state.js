const { connectBrowser, getOrCreatePage } = require("./cdp-utils");

async function main() {
  const { browser, cdpUrl, cdpStatus } = await connectBrowser();
  const page = await getOrCreatePage(browser, "pgn.co.id");
  const context = browser.contexts()[0];

  const pages = context.pages();
  const cookies = await context.cookies();
  const token = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem("token");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return {
        parse_error: error.message,
      };
    }
  });

  console.log(
    JSON.stringify(
      {
        cdpUrl,
        cdpStatus,
        pages: await Promise.all(
          pages.map(async (candidate, index) => ({
            index,
            url: candidate.url(),
            title: await candidate.title().catch(() => ""),
          }))
        ),
        currentPage: {
          url: page.url(),
          title: await page.title().catch(() => ""),
        },
        cookies: cookies.map((cookie) => ({
          name: cookie.name,
          domain: cookie.domain,
        })),
        token,
      },
      null,
      2
    )
  );

  await browser.close();
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
