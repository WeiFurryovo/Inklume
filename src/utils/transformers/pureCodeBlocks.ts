import { h } from "hastscript";
import type { ShikiTransformer } from "shiki";

function parseMetaString(value = "") {
  return Object.fromEntries(
    value.split(" ").reduce<[string, string | true][]>((entries, item) => {
      const matched = item.match(/(.+)?=("(.+)"|'(.+)')$/);
      if (!matched) return entries;

      entries.push([matched[1], matched[3] || matched[4] || true]);
      return entries;
    }, [])
  );
}

export const updateStyle = (): ShikiTransformer => ({
  name: "shiki-transformer-update-style",
  pre(node) {
    const container = h("pre", node.children);
    node.children = [container];
    node.tagName = "div";
  },
});

export const addTitle = (): ShikiTransformer => ({
  name: "shiki-transformer-add-title",
  pre(node) {
    const rawMeta = this.options.meta?.__raw;
    if (!rawMeta) return;

    const meta = parseMetaString(rawMeta);
    if (!meta.title) return;

    node.children.unshift(
      h(
        "div",
        {
          class:
            "title text-sm text-muted-foreground px-3 py-1 rounded-lg border",
        },
        meta.title.toString()
      )
    );
  },
});

export const addLanguage = (): ShikiTransformer => ({
  name: "shiki-transformer-add-language",
  pre(node) {
    node.children.push(
      h(
        "span",
        {
          class: "language ps-1 pe-3 text-sm bg-muted text-muted-foreground",
        },
        this.options.lang
      )
    );
  },
});

export const addCopyButton = (timeout = 2000): ShikiTransformer => ({
  name: "shiki-transformer-copy-button",
  pre(node) {
    node.children.push(
      h(
        "button",
        {
          class:
            "copy text-muted-foreground p-1 box-content border rounded-lg bg-card",
          "aria-label": "Copy code",
          "data-code": this.source,
          onclick: `
            navigator.clipboard.writeText(this.dataset.code);
            this.classList.add('copied');
            setTimeout(() => this.classList.remove('copied'), ${timeout})
          `,
        },
        [
          h("div", { class: "ready" }, [
            h("svg", { class: "size-5" }, [
              h("use", { href: "/icons/code.svg#mingcute-clipboard-line" }),
            ]),
          ]),
          h("div", { class: "success hidden" }, [
            h("svg", { class: "size-5" }, [
              h("use", { href: "/icons/code.svg#mingcute-file-check-line" }),
            ]),
          ]),
        ]
      )
    );
  },
});

export const addCollapse = (displayLineCount = 15): ShikiTransformer => ({
  name: "shiki-transformer-add-collapse",
  pre(node) {
    if (this.lines.length <= displayLineCount) return;

    node.properties = {
      ...node.properties,
      class: `${(node.properties?.class as string) || ""} collapsed`,
    };
    node.children.push(
      h(
        "button",
        {
          class: "collapse-toggle bg-card text-muted-foreground rounded-lg m-2",
          "aria-label": "Toggle collapse code block",
          onclick: "this.parentElement.classList.toggle('collapsed')",
        },
        [
          h("svg", { class: "size-5" }, [
            h("use", {
              href: "/icons/code.svg#mingcute-arrow-down-line",
            }),
          ]),
          h("span", { class: "desc" }, " code"),
        ]
      ),
      h("div", { class: "collapse-fade" })
    );
  },
});
