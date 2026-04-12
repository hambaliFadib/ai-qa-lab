const { summarizeDom, getPrimaryTable } = require("./dom-observation");

const DEFAULT_CAPTURE_OPTIONS = Object.freeze({
  includeFormFields: false,
  includeButtons: false,
  maxRowsPerTable: 200,
  maxTables: 3,
  maxDropdowns: 3,
  maxOptionLists: 5,
});

const TRANSACTION_MAPPING_ROW_FIELDS = Object.freeze({
  no: [/^NO$/i],
  type: [/^TYPE$/i],
  code: [/^TRANSACTION MAPPING CODE$/i, /^CODE$/i],
  category: [/^TRANSACTION MAPPING CATEGORY$/i, /^CATEGORY$/i],
  name: [/^NAME$/i],
  billType: [/^BILL TYPE$/i],
  startDate: [/^START DATE$/i],
  endDate: [/^END DATE$/i],
  lateCharge: [/^LATE CHARGE$/i],
  paymentWarranty: [/^PAYMENT WARRANTY$/i],
  instalment: [/^INSTALMENT$/i],
  description: [/^DESCRIPTION$/i],
  status: [/^STATUS$/i],
  statusApproval: [/^STATUS APPROVAL$/i],
  action: [/^ACTION$/i],
});

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function toMatchers(patterns = []) {
  const items = Array.isArray(patterns) ? patterns : [patterns];
  return items.map((pattern) => {
    if (pattern instanceof RegExp) {
      return (value) => pattern.test(normalizeText(value));
    }

    const target = normalizeText(pattern).toLowerCase();
    return (value) => normalizeText(value).toLowerCase() === target;
  });
}

function getRowCellValue(row = {}, patterns = []) {
  const matchers = toMatchers(patterns);
  const entry = Object.entries(row).find(([header]) => matchers.some((matcher) => matcher(header)));
  return entry ? normalizeText(entry[1]) : "";
}

function rowContainsText(row = {}, needle = "") {
  const target = normalizeText(needle).toLowerCase();
  if (!target) {
    return false;
  }

  return Object.values(row).some((value) => normalizeText(value).toLowerCase().includes(target));
}

function findRowByCellValue(rows = [], headerPatterns = [], expectedValue = "", options = {}) {
  const expected = normalizeText(expectedValue).toLowerCase();
  const exact = options.exact !== false;

  return (
    rows.find((row) => {
      const actual = getRowCellValue(row, headerPatterns).toLowerCase();
      return exact ? actual === expected : actual.includes(expected);
    }) || null
  );
}

function projectRow(row = {}, fieldMap = {}) {
  return Object.fromEntries(
    Object.entries(fieldMap).map(([field, patterns]) => [field, getRowCellValue(row, patterns)])
  );
}

function collectVisibleOptionLists(options = {}) {
  const maxOptionLists = Number.isFinite(options.maxOptionLists) ? options.maxOptionLists : 5;
  const clean = (value = "", max = 200) => {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
  };

  const isVisible = (element) => {
    if (!(element instanceof Element)) {
      return false;
    }

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };

  const belongsToContainer = (container, listNode) => {
    if (!(container instanceof Element) || !(listNode instanceof Element)) {
      return false;
    }

    return (
      container === listNode ||
      container.contains(listNode) ||
      listNode.contains(container)
    );
  };

  const collectTexts = (container, selectors) => {
    const seen = new Set();
    return selectors
      .flatMap((selector) => Array.from(container.querySelectorAll(selector)))
      .map((node) => clean(node.innerText || node.textContent || "", 160))
      .filter((text) => {
        if (!text || seen.has(text)) {
          return false;
        }
        seen.add(text);
        return true;
      });
  };

  const expandedComboboxListIds = Array.from(document.querySelectorAll("[role='combobox'][aria-expanded='true']"))
    .flatMap((element) => [element.getAttribute("aria-controls"), element.getAttribute("aria-owns")])
    .filter(Boolean);

  const candidateGroups = [
    {
      kind: "ant-select",
      selector: ".ant-select-dropdown",
      itemSelectors: [
        ".ant-select-item-option-content",
        ".ant-select-item-option",
        "[role='option']",
      ],
      isActive: (container) => {
        if (isVisible(container)) {
          return true;
        }

        return expandedComboboxListIds.some((listId) => {
          const listNode = document.getElementById(listId);
          return belongsToContainer(container, listNode);
        });
      },
    },
    {
      kind: "ant-menu",
      selector: ".ant-dropdown, .ant-menu-submenu-popup, .ant-popover, [role='menu']",
      itemSelectors: [
        ".ant-dropdown-menu-title-content",
        ".ant-dropdown-menu-item",
        ".ant-menu-title-content",
        ".ant-menu-item",
        "[role='menuitem']",
      ],
      isActive: (container) => isVisible(container) && !container.classList.contains("ant-menu-inline"),
    },
    {
      kind: "generic-listbox",
      selector: "[role='listbox']",
      itemSelectors: ["[role='option']"],
      isActive: (container) => isVisible(container) && !container.classList.contains("ant-menu-inline"),
    },
  ];

  const seenSignatures = new Set();
  const optionLists = [];

  candidateGroups.forEach((group) => {
    Array.from(document.querySelectorAll(group.selector)).forEach((container, containerIndex) => {
      if (!group.isActive(container)) {
        return;
      }

      const options = collectTexts(container, group.itemSelectors);
      if (options.length === 0) {
        return;
      }

      const signature = `${group.kind}::${options.join("|")}`;
      if (seenSignatures.has(signature)) {
        return;
      }
      seenSignatures.add(signature);

      optionLists.push({
        option_list_index: optionLists.length,
        container_index: containerIndex,
        kind: group.kind,
        class_name: clean(container.className || "", 160),
        options,
      });
    });
  });

  return optionLists.slice(0, maxOptionLists);
}

function buildPageEvidence(summary = {}) {
  const primaryTable = getPrimaryTable(summary);

  return {
    summary,
    primaryTable,
    url: summary.url || "",
    title: summary.title || "",
    headings: summary.headings || [],
    errors: summary.errors || [],
    formFields: summary.form_fields || [],
    buttons: summary.buttons || [],
    headers: primaryTable?.headers || [],
    rowCount: primaryTable?.row_count || 0,
    rows: primaryTable?.sample_row_objects || [],
    sampledRows: primaryTable?.sampled_rows || [],
    visibleDropdowns: summary.visible_dropdowns || [],
    visibleOptionLists: summary.visible_option_lists || [],
    visibleOverlays: summary.visible_overlays || [],
  };
}

async function capturePageEvidence(page, options = {}) {
  const summary = await page.evaluate(summarizeDom, {
    ...DEFAULT_CAPTURE_OPTIONS,
    includeFormFields: options.includeFormFields !== false,
    includeButtons: options.includeButtons !== false,
    ...options,
  });

  const visibleOptionLists = await page.evaluate(collectVisibleOptionLists, {
    ...DEFAULT_CAPTURE_OPTIONS,
    maxOptionLists: Number.isFinite(options.maxOptionLists)
      ? options.maxOptionLists
      : DEFAULT_CAPTURE_OPTIONS.maxOptionLists,
  });

  let antSelectIndex = 0;
  summary.visible_option_lists = visibleOptionLists.map((item) => {
    if (item.kind !== "ant-select") {
      return item;
    }

    const dropdownOptions = summary.visible_dropdowns?.[antSelectIndex]?.options || item.options;
    antSelectIndex += 1;
    return {
      ...item,
      options: dropdownOptions,
    };
  });

  if ((!summary.visible_dropdowns || summary.visible_dropdowns.length === 0) && visibleOptionLists.length > 0) {
    summary.visible_dropdowns = visibleOptionLists
      .filter((item) => item.kind === "ant-select")
      .map((item, dropdownIndex) => ({
        dropdown_index: dropdownIndex,
        options: item.options,
      }));
  }

  return buildPageEvidence(summary);
}

async function capturePrimaryTable(page, options = {}) {
  return capturePageEvidence(page, {
    ...options,
    includeFormFields: false,
    includeButtons: false,
  });
}

module.exports = {
  buildPageEvidence,
  capturePageEvidence,
  capturePrimaryTable,
  findRowByCellValue,
  getRowCellValue,
  projectRow,
  rowContainsText,
  TRANSACTION_MAPPING_ROW_FIELDS,
};



