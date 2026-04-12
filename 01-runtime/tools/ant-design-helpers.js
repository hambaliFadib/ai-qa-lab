function normalizeText(value = "") {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

async function readActiveDropdown(page) {
  return page.evaluate(() => {
    const clean = (value = "") =>
      String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();

    const isVisible = (element) => {
      if (!(element instanceof Element)) {
        return false;
      }

      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };

    const belongsToDropdown = (dropdown, listNode) => {
      if (!(dropdown instanceof Element) || !(listNode instanceof Element)) {
        return false;
      }

      return (
        dropdown === listNode ||
        dropdown.contains(listNode) ||
        listNode.contains(dropdown)
      );
    };

    const expandedComboboxes = Array.from(
      document.querySelectorAll("[role='combobox'][aria-expanded='true']")
    );
    const controlledListIds = expandedComboboxes
      .flatMap((element) => [element.getAttribute("aria-controls"), element.getAttribute("aria-owns")])
      .filter(Boolean);

    const dropdowns = Array.from(document.querySelectorAll(".ant-select-dropdown"))
      .map((dropdown, dropdownIndex) => {
        const options = Array.from(dropdown.querySelectorAll(".ant-select-item-option"))
          .map((option, optionIndex) => {
            const content = option.querySelector(".ant-select-item-option-content") || option;
            return {
              option_index: optionIndex,
              text: clean(content.innerText || content.textContent || ""),
              class_name: clean(option.className || ""),
            };
          })
          .filter((option) => option.text);

        const controlsExpandedCombobox = controlledListIds.some((listId) => {
          const listNode = document.getElementById(listId);
          return belongsToDropdown(dropdown, listNode);
        });

        return {
          dropdown_index: dropdownIndex,
          option_count: options.length,
          options,
          controls_expanded_combobox: controlsExpandedCombobox,
          visible: isVisible(dropdown),
          class_name: clean(dropdown.className || ""),
        };
      })
      .filter((dropdown) => dropdown.option_count > 0);

    const activeDropdown =
      dropdowns.find((dropdown) => dropdown.controls_expanded_combobox) ||
      dropdowns.find((dropdown) => dropdown.visible) ||
      dropdowns[dropdowns.length - 1] ||
      null;

    return {
      controlled_list_ids: controlledListIds,
      dropdowns,
      active_dropdown: activeDropdown,
    };
  });
}

async function waitForActiveDropdown(page, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 5000;
  const pollMs = Number.isFinite(options.pollMs) ? options.pollMs : 100;
  const startedAt = Date.now();
  let lastState = null;

  while (Date.now() - startedAt < timeoutMs) {
    lastState = await readActiveDropdown(page);
    if (lastState.active_dropdown) {
      return lastState;
    }
    await page.waitForTimeout(pollMs);
  }

  const dropdownCount = lastState?.dropdowns?.length || 0;
  throw new Error(`Ant Design dropdown did not become active within ${timeoutMs}ms (dropdown_count=${dropdownCount})`);
}

async function hasActiveDropdown(page) {
  const state = await readActiveDropdown(page);
  return Boolean(state.active_dropdown);
}

async function getActiveDropdownOptions(page, options = {}) {
  const state = options.wait === false
    ? await readActiveDropdown(page)
    : await waitForActiveDropdown(page, options);

  const activeDropdown = state.active_dropdown || null;
  const optionTexts = (activeDropdown?.options || [])
    .map((option) => normalizeText(option.text || option))
    .filter(Boolean);

  return {
    controlled_list_ids: state.controlled_list_ids || [],
    dropdowns: state.dropdowns || [],
    active_dropdown: activeDropdown,
    options: optionTexts,
  };
}

async function selectActiveDropdownOption(page, options = {}) {
  const desiredText = normalizeText(options.optionText || "");
  const exact = options.exact !== false;
  const optionIndex = Number.isInteger(options.optionIndex) ? options.optionIndex : 0;
  const state = await waitForActiveDropdown(page, options);

  const result = await page.evaluate(
    ({ desiredText: rawDesiredText, exactMatch, desiredIndex }) => {
      const clean = (value = "") =>
        String(value ?? "")
          .replace(/\s+/g, " ")
          .trim();

      const desiredText = clean(rawDesiredText);
      const belongsToDropdown = (dropdown, listNode) => {
        if (!(dropdown instanceof Element) || !(listNode instanceof Element)) {
          return false;
        }

        return (
          dropdown === listNode ||
          dropdown.contains(listNode) ||
          listNode.contains(dropdown)
        );
      };

      const expandedComboboxes = Array.from(
        document.querySelectorAll("[role='combobox'][aria-expanded='true']")
      );
      const controlledListIds = expandedComboboxes
        .flatMap((element) => [element.getAttribute("aria-controls"), element.getAttribute("aria-owns")])
        .filter(Boolean);

      const dropdowns = Array.from(document.querySelectorAll(".ant-select-dropdown"))
        .map((dropdown, dropdownIndex) => {
          const options = Array.from(dropdown.querySelectorAll(".ant-select-item-option"));
          const controlsExpandedCombobox = controlledListIds.some((listId) => {
            const listNode = document.getElementById(listId);
            return belongsToDropdown(dropdown, listNode);
          });

          return {
            dropdown,
            dropdownIndex,
            options,
            controlsExpandedCombobox,
          };
        })
        .filter((item) => item.options.length > 0);

      const activeDropdown =
        dropdowns.find((item) => item.controlsExpandedCombobox) ||
        dropdowns[dropdowns.length - 1] ||
        null;

      if (!activeDropdown) {
        return {
          clicked: false,
          reason: "no-active-dropdown",
          availableOptions: [],
        };
      }

      const availableOptions = activeDropdown.options
        .map((option) => clean((option.querySelector(".ant-select-item-option-content") || option).innerText || option.textContent || ""))
        .filter(Boolean);

      let target = null;

      if (desiredText) {
        const comparer = exactMatch
          ? (value) => clean(value).toLowerCase() === desiredText.toLowerCase()
          : (value) => clean(value).toLowerCase().includes(desiredText.toLowerCase());

        target = activeDropdown.options.find((option) => {
          const label = (option.querySelector(".ant-select-item-option-content") || option).innerText || option.textContent || "";
          return comparer(label);
        }) || null;
      } else {
        target = activeDropdown.options[desiredIndex] || null;
      }

      if (!target) {
        return {
          clicked: false,
          reason: "option-not-found",
          availableOptions,
        };
      }

      const label = clean((target.querySelector(".ant-select-item-option-content") || target).innerText || target.textContent || "");
      ["pointerdown", "mousedown", "mouseup", "click"].forEach((eventName) => {
        target.dispatchEvent(
          new MouseEvent(eventName, {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
      });

      return {
        clicked: true,
        optionText: label,
        availableOptions,
        dropdownIndex: activeDropdown.dropdownIndex,
      };
    },
    {
      desiredText,
      exactMatch: exact,
      desiredIndex: optionIndex,
    }
  );

  if (!result.clicked) {
    throw new Error(
      `Unable to select Ant Design dropdown option (${result.reason || "unknown"}). Available: ${JSON.stringify(
        result.availableOptions || []
      )}`
    );
  }

  await page.waitForTimeout(300);
  return {
    ...result,
    dropdownState: state,
  };
}

async function selectFirstActiveDropdownOption(page, options = {}) {
  return selectActiveDropdownOption(page, {
    ...options,
    optionIndex: Number.isInteger(options.optionIndex) ? options.optionIndex : 0,
  });
}

module.exports = {
  getActiveDropdownOptions,
  hasActiveDropdown,
  normalizeText,
  readActiveDropdown,
  selectActiveDropdownOption,
  selectFirstActiveDropdownOption,
  waitForActiveDropdown,
};
