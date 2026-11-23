#!/usr/bin/env bash
# Verify the Sveltia CMS pin in public/admin/index.html and track upgrades.
#
# 1. Fail if the pinned SRI hash does not match the published npm package.
# 2. If npm has a newer release, open (or refresh) a single tracking issue that
#    contains the new version and its SRI hash.
# 3. Once the pin has caught up, close that issue.
#
# Requires bash, npm, curl, openssl and gh (with GH_TOKEN and GH_REPO set).
set -euo pipefail

html="public/admin/index.html"
package="@sveltia/cms"
title_prefix="Sveltia CMS 有新版本"

current=$(sed -n 's|.*unpkg\.com/@sveltia/cms@\([0-9][0-9A-Za-z.+-]*\)/dist/sveltia-cms\.js.*|\1|p' "$html" | head -n 1)
pinned_sri=$(sed -n 's|.*integrity="\(sha384-[A-Za-z0-9+/=]*\)".*|\1|p' "$html" | head -n 1)

if [ -z "$current" ] || [ -z "$pinned_sri" ]; then
  echo "::error file=$html::Could not find the pinned Sveltia CMS version and SRI hash."
  exit 1
fi

# SRI hash of dist/sveltia-cms.js from the npm tarball (integrity-checked by
# npm), cross-checked against the copy that unpkg actually serves.
sri_of() {
  local version="$1" dir npm_sri cdn_sri
  dir=$(mktemp -d)
  npm pack --silent --pack-destination "$dir" "$package@$version" >/dev/null
  tar -xzf "$dir"/*.tgz -C "$dir" package/dist/sveltia-cms.js
  npm_sri="sha384-$(openssl dgst -sha384 -binary "$dir/package/dist/sveltia-cms.js" | openssl base64 -A)"
  cdn_sri="sha384-$(curl -fsSL "https://unpkg.com/$package@$version/dist/sveltia-cms.js" | openssl dgst -sha384 -binary | openssl base64 -A)"
  rm -rf "$dir"
  if [ "$npm_sri" != "$cdn_sri" ]; then
    echo "::error::unpkg serves a different file than the npm package for $package@$version." >&2
    return 1
  fi
  echo "$npm_sri"
}

expected_sri=$(sri_of "$current")
if [ "$pinned_sri" != "$expected_sri" ]; then
  echo "::error file=$html::SRI hash for $package@$current should be $expected_sri"
  exit 1
fi
echo "Pinned $package@$current, SRI hash verified."

latest=$(npm view "$package" version)
existing=$(gh issue list --state open --limit 100 --json number,title \
  --jq "[.[] | select(.title | startswith(\"$title_prefix\"))][0].number // empty")

newest=$(printf '%s\n%s\n' "$current" "$latest" | sort -V | tail -n 1)
if [ "$newest" = "$current" ]; then
  echo "$package@$current is up to date (npm latest: $latest)."
  if [ -n "$existing" ]; then
    gh issue close "$existing" --comment "已固定到 Sveltia CMS $current，关闭此提醒。"
  fi
  exit 0
fi

new_sri=$(sri_of "$latest")
title="$title_prefix：$latest（当前 $current）"
fence='```'
body=$(cat <<BODY
\`$html\` 固定的 Sveltia CMS 是 **$current**，npm 上的最新版本是 **$latest**。

- 更新说明：https://github.com/sveltia/sveltia-cms/releases
- 代码差异：https://github.com/sveltia/sveltia-cms/compare/v$current...v$latest

升级时把 \`$html\` 中的 \`<script>\` 替换为：

${fence}html
<script
  src="https://unpkg.com/$package@$latest/dist/sveltia-cms.js"
  integrity="$new_sri"
  crossorigin="anonymous"
></script>
${fence}

SRI 哈希根据 npm 发布包计算，并已核对与 unpkg 实际提供的文件一致。升级后请打开 \`/admin/\` 登录确认一次；新版本固定后，此 issue 会自动关闭。

_由 \`.github/workflows/sveltia-cms-update.yml\` 自动检查生成。_
BODY
)

if [ -n "$existing" ]; then
  gh issue edit "$existing" --title "$title" --body "$body"
  echo "Updated issue #$existing for $package@$latest."
else
  gh issue create --title "$title" --body "$body"
fi
