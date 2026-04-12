const { connectBrowser, getOrCreatePage } = require("./cdp-utils");

async function main() {
  const { browser, cdpStatus } = await connectBrowser();
  const page = await getOrCreatePage(browser, "pgn.co.id");

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
        cdpStatus,
        currentUrl: page.url(),
        title: await page.title().catch(() => ""),
        hasToken: Boolean(token),
        token,
      },
      null,
      2
    )
  );

  await browser.close();
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
