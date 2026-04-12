function cleanNodeText(value, max = 240) {
  if (value === undefined || value === null) {
    return "";
  }

  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

function rowCellsToObject(headers = [], cells = []) {
  const result = {};
  const width = Math.max(headers.length, cells.length);

  for (let index = 0; index < width; index += 1) {
    const header = cleanNodeText(headers[index] || "") || `COLUMN_${index + 1}`;
    result[header] = cleanNodeText(cells[index] || "");
  }

  return result;
}

function getPrimaryTable(summary) {
  if (!summary || !Array.isArray(summary.tables)) {
    return null;
  }

  return (
    summary.tables.find(
      (table) =>
        (Array.isArray(table.headers) && table.headers.length > 0) ||
        (typeof table.row_count === "number" && table.row_count > 0)
    ) || null
  );
}

function findHeaderIndex(headers = [], patterns = []) {
  const checks = patterns.map((pattern) =>
    pattern instanceof RegExp
      ? (value) => pattern.test(value)
      : (value) => cleanNodeText(value).toLowerCase() === cleanNodeText(pattern).toLowerCase()
  );

  return headers.findIndex((header) => checks.some((check) => check(header)));
}

function summarizeDom(options = {}) {
  const includeFormFields = options.includeFormFields !== false;
  const includeButtons = options.includeButtons !== false;
  const maxRowsPerTable = Number.isFinite(options.maxRowsPerTable) ? options.maxRowsPerTable : 5;
  const maxTables = Number.isFinite(options.maxTables) ? options.maxTables : 3;
  const maxDropdowns = Number.isFinite(options.maxDropdowns) ? options.maxDropdowns : 3;

  const cleanLocal = (value, max = 240) => {
    if (value === undefined || value === null) {
      return "";
    }

    const text = String(value).replace(/\s+/g, " ").trim();
    return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
  };

  const isVisible = (element) => {
    if (!(element instanceof Element)) {
      return false;
    }

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
  };

  const rowCellsToObjectLocal = (headers = [], cells = []) => {
    const result = {};
    const width = Math.max(headers.length, cells.length);

    for (let index = 0; index < width; index += 1) {
      const header = cleanLocal(headers[index] || "") || `COLUMN_${index + 1}`;
      result[header] = cleanLocal(cells[index] || "");
    }

    return result;
  };

  const getReadOnlyFieldValue = (root, labelText) => {
    const labelElement = root.querySelector("label");
    const directSiblingText = cleanLocal(
      labelElement?.nextElementSibling?.innerText || labelElement?.nextElementSibling?.textContent || "",
      160
    );
    if (directSiblingText && directSiblingText !== labelText) {
      return directSiblingText;
    }

    const staticValue = Array.from(
      root.querySelectorAll("p, .ant-typography, .ant-descriptions-item-content, [data-field-value]")
    )
      .map((element) => cleanLocal(element.innerText || element.textContent || "", 160))
      .find((value) => value && value !== labelText);

    if (staticValue) {
      return staticValue;
    }

    return "";
  };

  const normalizeHeadersLocal = (headers = []) => {
    const normalized = headers.map((header) => cleanLocal(header, 120));
    while (normalized.length > 0 && !normalized[normalized.length - 1]) {
      normalized.pop();
    }
    return normalized;
  };

  const scoreHeaders = (headers = []) => headers.filter(Boolean).length;

  const scoreRows = (rows = []) => {
    const maxWidth = rows.reduce((width, row) => Math.max(width, row.cells.length), 0);
    return rows.length * 100 + maxWidth;
  };

  const tableGroupSelectors = ".ant-table-container, .ant-table-wrapper, .table-responsive, .table-container, [role='table']";
  const tableGroups = Array.from(document.querySelectorAll(tableGroupSelectors));

  const getTableGroupKey = (table, tableIndex) => {
    const container = table.closest(tableGroupSelectors);
    if (!container) {
      return `table:${tableIndex}`;
    }

    const groupIndex = tableGroups.indexOf(container);
    return groupIndex >= 0 ? `container:${groupIndex}` : `table:${tableIndex}`;
  };

  const headings = Array.from(document.querySelectorAll("h1, h2, .page-title, .ant-page-header-heading-title"))
    .filter(isVisible)
    .map((element) => cleanLocal(element.textContent || "", 160))
    .filter(Boolean)
    .slice(0, 10);

  const formFields = includeFormFields
    ? Array.from(document.querySelectorAll(".ant-form-item, form label, label"))
        .map((item) => {
          const root = item.closest(".ant-form-item") || (item.matches("label") ? item.parentElement || item : item);
          const labelElement = root.matches("label") ? root : root.querySelector("label");
          const label = cleanLocal(
            labelElement?.textContent?.replace(/\*/g, "") || item.textContent || "",
            120
          );
          if (!label) {
            return null;
          }

          const input = root.querySelector("input:not([type='hidden']), textarea, select");
          const selection = root.querySelector(".ant-select-selection-item");
          const picker = root.querySelector(".ant-picker-input input");
          const value = cleanLocal(
            (picker && picker.value) ||
              (input && input.value) ||
              (selection && selection.textContent) ||
              getReadOnlyFieldValue(root, label) ||
              "",
            160
          );

          return { label, value };
        })
        .filter(Boolean)
        .slice(0, 20)
    : [];

  const buttons = includeButtons
    ? Array.from(document.querySelectorAll("button, [role='button'], .ant-btn"))
        .filter(isVisible)
        .map((button) => ({
          text: cleanLocal(button.textContent || button.getAttribute("aria-label") || "", 120),
          selector: cleanLocal(
            button.id
              ? `#${button.id}`
              : `${button.tagName.toLowerCase()}.${Array.from(button.classList || []).slice(0, 2).join(".")}`,
            160
          ),
        }))
        .filter((button) => button.text || button.selector)
        .slice(0, 20)
    : [];

  const errors = Array.from(
    document.querySelectorAll(
      ".ant-form-item-explain-error, .ant-message-error, .ant-notification-notice-description, .ant-alert-error"
    )
  )
    .filter(isVisible)
    .map((element) => cleanLocal(element.textContent || "", 200))
    .filter(Boolean)
    .slice(0, 10);

  const logicalTableMap = new Map();
  Array.from(document.querySelectorAll("table"))
    .filter(isVisible)
    .map((table, tableIndex) => {
      const headers = normalizeHeadersLocal(Array.from(table.querySelectorAll("thead th")).map((th) =>
        cleanLocal(th.innerText || th.textContent, 120)
      ));
      const rowCandidates = Array.from(table.querySelectorAll("tbody tr"))
        .map((row, rowIndex) => {
          const cells = Array.from(row.querySelectorAll("td, th"))
            .map((cell) => cleanLocal(cell.innerText || cell.textContent, 160));
          return {
            row_index: rowIndex,
            cells,
            non_empty: cells.some(Boolean),
          };
        })
        .filter((row) => row.non_empty);

      return {
        table_index: tableIndex,
        group_key: getTableGroupKey(table, tableIndex),
        headers,
        row_candidates: rowCandidates,
      };
    })
    .filter((table) => table.headers.length > 0 || table.row_candidates.length > 0)
    .forEach((table) => {
      const existing =
        logicalTableMap.get(table.group_key) || {
          first_table_index: table.table_index,
          source_table_indexes: [],
          headers: [],
          row_candidates: [],
        };

      existing.first_table_index = Math.min(existing.first_table_index, table.table_index);
      existing.source_table_indexes.push(table.table_index);

      if (scoreHeaders(table.headers) > scoreHeaders(existing.headers)) {
        existing.headers = table.headers;
      }

      if (scoreRows(table.row_candidates) > scoreRows(existing.row_candidates)) {
        existing.row_candidates = table.row_candidates;
      }

      logicalTableMap.set(table.group_key, existing);
    });

  const tableSignatures = new Set();
  const tables = Array.from(logicalTableMap.values())
    .sort((left, right) => left.first_table_index - right.first_table_index)
    .map((tableGroup, tableIndex) => {
      const headers = normalizeHeadersLocal(tableGroup.headers);
      if (headers.length === 0 && tableGroup.row_candidates.length === 0) {
        return null;
      }

      const sampledRows = tableGroup.row_candidates.slice(0, maxRowsPerTable).map((row) => ({
        row_index: row.row_index,
        cells: row.cells,
        values_by_header: rowCellsToObjectLocal(headers, row.cells),
      }));

      const signature = `${headers.join("|")}::${sampledRows[0]?.cells?.join("|") || ""}`;
      if (tableSignatures.has(signature)) {
        return null;
      }
      tableSignatures.add(signature);

      return {
        table_index: tableIndex,
        source_table_indexes: tableGroup.source_table_indexes,
        headers,
        row_count: tableGroup.row_candidates.length,
        sampled_rows: sampledRows,
        sample_rows: sampledRows.map((row) => row.cells),
        sample_row_objects: sampledRows.map((row) => row.values_by_header),
      };
    })
    .filter(Boolean)
    .slice(0, maxTables);

  const expandedComboboxListIds = new Set(
    Array.from(document.querySelectorAll("[role='combobox'][aria-expanded='true']"))
      .flatMap((element) => [element.getAttribute("aria-controls"), element.getAttribute("aria-owns")])
      .filter(Boolean)
  );

  const isActiveDropdown = (dropdown) => {
    if (isVisible(dropdown)) {
      return true;
    }

    for (const listId of expandedComboboxListIds) {
      const listNode = document.getElementById(listId);
      if (listNode && dropdown.contains(listNode)) {
        return true;
      }
    }

    return false;
  };

  const visibleDropdowns = Array.from(document.querySelectorAll(".ant-select-dropdown"))
    .filter(isActiveDropdown)
    .map((dropdown, dropdownIndex) => {
      const seenOptions = new Set();
      const options = Array.from(dropdown.querySelectorAll(".ant-select-item-option"))
        .map((option) => {
          const content = option.querySelector(".ant-select-item-option-content");
          return cleanLocal(content ? content.innerText || content.textContent : option.innerText || option.textContent, 160);
        })
        .filter((option) => {
          if (!option || seenOptions.has(option)) {
            return false;
          }
          seenOptions.add(option);
          return true;
        });

      return {
        dropdown_index: dropdownIndex,
        options,
      };
    })
    .filter((dropdown) => dropdown.options.length > 0)
    .slice(0, maxDropdowns);

  const overlaySignatures = new Set();
  const visibleOverlays = Array.from(
    document.querySelectorAll(".ant-modal, .ant-drawer, .ant-dropdown, .ant-popover, [role='dialog']")
  )
    .filter(isVisible)
    .map((overlay, overlayIndex) => {
      const text = cleanLocal(overlay.innerText || overlay.textContent, 400);
      const signature = `${cleanLocal(overlay.className || "", 120)}::${text}`;
      if (!text || overlaySignatures.has(signature)) {
        return null;
      }
      overlaySignatures.add(signature);

      return {
        overlay_index: overlayIndex,
        class_name: cleanLocal(overlay.className || "", 160),
        text,
      };
    })
    .filter(Boolean)
    .slice(0, 5);

  return {
    url: window.location.href,
    title: cleanLocal(document.title || "", 180),
    headings,
    errors,
    form_fields: formFields,
    buttons,
    tables,
    primary_table_headers: tables[0]?.headers || [],
    primary_table_row_count: tables[0]?.row_count || 0,
    visible_dropdowns: visibleDropdowns,
    visible_overlays: visibleOverlays,
  };
}

module.exports = {
  cleanNodeText,
  rowCellsToObject,
  getPrimaryTable,
  findHeaderIndex,
  summarizeDom,
};
