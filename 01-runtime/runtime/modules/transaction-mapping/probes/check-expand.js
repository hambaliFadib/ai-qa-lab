/**
 * Check for expandable sections in create form.
 */
const { connectBrowser, getOrCreatePage } = require("../../../../tools/cdp-utils");

async function main() {
  const { browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "check-form-expand");

  await page.goto(
    "https://dev-energy.pgn.co.id/system-setup/billing-item/create",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(3000);

  const expandableSections = await page.evaluate(() => {
    const sections = [];

    const collapseHeaders = document.querySelectorAll(
      ".ant-collapse-header, .ant-collapse-item-header"
    );
    collapseHeaders.forEach((header) => {
      sections.push({
        type: "collapse",
        text: header.textContent.trim(),
        expanded: header.getAttribute("aria-expanded") === "true",
      });
    });

    const expandIcons = document.querySelectorAll(
      ".ant-select-arrow, [class*='expand'], [class*='ArrowDown']"
    );
    expandIcons.forEach((icon) => {
      const parent = icon.closest(".ant-select, .ant-form-item");
      sections.push({
        type: "expand_icon",
        parentClass: parent?.className,
      });
    });

    return sections;
  });

  console.log("=== Expandable Sections ===");
  console.log(JSON.stringify(expandableSections, null, 2));

  const approvalStructure = await page.evaluate(() => {
    const field = document.querySelector("#apphierId");
    if (!field) return { found: false };

    const wrapper = field.closest(".ant-select");
    const parentFormItem = field.closest(".ant-form-item");
    const elements = Array.from(parentFormItem?.querySelectorAll("*") || []).map(
      (el) => ({
        tag: el.tagName,
        class: el.className,
        visible: el.offsetParent !== null,
      })
    );

    return {
      found: true,
      wrapperClass: wrapper?.className,
      parentFormItemClass: parentFormItem?.className,
      elements: elements.slice(0, 10),
    };
  });

  console.log("=== Approval Hierarchy Structure ===");
  console.log(JSON.stringify(approvalStructure, null, 2));

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
