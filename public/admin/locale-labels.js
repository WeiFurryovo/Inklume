(() => {
  const FIELD_LABELS = {
    siteName: { en: "Site Name", zh: "站点名称" },
    browserTitle: { en: "Browser Tab Title", zh: "浏览器标签页标题" },
    favicon: { en: "Favicon", zh: "标签页图标" },
    displayName: { en: "Display Name", zh: "显示名称" },
    avatar: { en: "Avatar", zh: "头像" },
    location: { en: "Location", zh: "所在地" },
    role: { en: "Role", zh: "身份" },
    about: { en: "About", zh: "自我介绍" },
    publishingHeading: { en: "Publishing Heading", zh: "发布方式标题" },
    publishingDescription: {
      en: "Publishing Description",
      zh: "发布方式描述",
    },
    links: { en: "Homepage Link Labels", zh: "首页链接文字" },
    "links.source": { en: "Source Code", zh: "源代码" },
    "links.readPosts": { en: "Read Posts", zh: "阅读文章" },
    "links.moreAbout": { en: "More About", zh: "更多关于我" },
    "links.morePosts": { en: "More Posts", zh: "更多文章" },
    "links.gallery": { en: "Gallery", zh: "相册" },
    navigation: { en: "Navigation Labels", zh: "顶部导航文字" },
    "navigation.posts": { en: "Posts", zh: "文章" },
    "navigation.gallery": { en: "Gallery", zh: "相册" },
    "navigation.archives": { en: "Archives", zh: "归档" },
    "navigation.tags": { en: "Tags", zh: "标签" },
    "navigation.about": { en: "About", zh: "关于" },
    title: { en: "Title", zh: "标题" },
    description: { en: "Description", zh: "描述" },
    author: { en: "Author", zh: "作者" },
    pubDatetime: { en: "Published At", zh: "发布时间" },
    modDatetime: { en: "Updated At", zh: "更新时间" },
    featured: { en: "Featured", zh: "首页推荐" },
    draft: { en: "Draft", zh: "草稿" },
    gallery: { en: "Include in Gallery", zh: "收录到相册" },
    tags: { en: "Tags", zh: "标签" },
    heroImage: { en: "Hero Image", zh: "头图" },
    "heroImage.src": { en: "Image", zh: "图片" },
    "heroImage.alt": { en: "Alternative Text", zh: "替代文本" },
    "heroImage.color": { en: "Accent Color", zh: "强调色" },
    ogImage: { en: "Social Image", zh: "社交分享图片" },
    canonicalURL: { en: "Canonical URL", zh: "规范链接" },
    hideEditPost: { en: "Hide Edit Link", zh: "隐藏编辑链接" },
    timezone: { en: "Display Timezone", zh: "显示时区" },
    body: { en: "Body", zh: "正文" },
  };

  const localizeFieldLabels = () => {
    document
      .querySelectorAll('[data-mode="edit"][data-locale] [data-key-path]')
      .forEach(field => {
        const locale = field.closest("[data-locale]")?.dataset.locale;
        const labels = FIELD_LABELS[field.dataset.keyPath];
        const label = labels?.[locale === "zh" ? "zh" : "en"];
        const heading = field.querySelector(":scope > header > h4");

        if (label && heading && heading.textContent !== label) {
          heading.textContent = label;
          field.setAttribute(
            "aria-label",
            locale === "zh" ? `${label}字段` : `${label} field`
          );
        }
      });
  };

  let animationFrame;
  const scheduleLocalization = () => {
    if (animationFrame) return;

    animationFrame = requestAnimationFrame(() => {
      animationFrame = undefined;
      localizeFieldLabels();
    });
  };

  new MutationObserver(scheduleLocalization).observe(document.body, {
    attributes: true,
    attributeFilter: ["data-locale", "data-mode"],
    childList: true,
    subtree: true,
  });

  scheduleLocalization();
})();
