#!/usr/bin/env python3
"""Builds the static site.

Each file in src/pages/ starts with a JSON header comment:
    <!--{"path": "about/", "title": "About", "nav": "about", "description": "..."}-->
The rest of the file is the page body. This script wraps every body in the
shared layout (src/layout.html), replaces {{root}} with the relative path back
to the site root, and writes <path>/index.html.

Run from the repository root:  python3 tools/build.py
"""
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
HEADER_RE = re.compile(r"^\s*<!--(\{.*?\})-->\s*", re.S)

ASSET_RE = re.compile(r'(assets/(?:css|js)/[\w-]+\.(?:css|js))"')

NAV_KEYS = ["home", "about", "ministries", "resources", "connect", "give"]


def asset_hash(rel):
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:8]


def build_page(src_file, layout):
    return build_text(src_file.name, src_file.read_text(encoding="utf-8"), layout)


def build_text(name, text, layout):
    match = HEADER_RE.match(text)
    if not match:
        raise SystemExit(f"{name}: missing JSON header comment")
    meta = json.loads(match.group(1))
    body = text[match.end():]

    path = meta["path"]  # "" for home, "about/" etc. or "404.html"
    if path.endswith(".html"):
        out = ROOT / path
        depth = path.count("/")
    else:
        out = ROOT / path / "index.html"
        depth = path.count("/")
    root = meta.get("root") or ("../" * depth if depth else "./")

    title = meta["title"]
    full_title = "Dare Ministries" if meta.get("nav") == "home" else f"{title} · Dare Ministries"

    html = body.lstrip() if meta.get("standalone") else layout.replace("{{body}}", body)
    html = html.replace("{{title}}", full_title)
    html = html.replace("{{description}}", meta.get("description", ""))
    html = html.replace("{{page_class}}", meta.get("class", ""))
    html = html.replace("{{canonical_path}}", "" if path.endswith(".html") else path)
    for key in NAV_KEYS:
        current = ' aria-current="page"' if meta.get("nav") == key else ""
        html = html.replace("{{current_" + key + "}}", current)
    html = html.replace("{{root}}", root)
    # Version stylesheet/script URLs by content so browsers never pair new HTML with stale CSS/JS.
    html = ASSET_RE.sub(lambda m: f'{m.group(1)}?v={asset_hash(m.group(1))}"', html)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    return out.relative_to(ROOT)


def inline(text):
    """Escape HTML, then turn [label](url) into links."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', text)


def post_body(raw):
    """Plain text -> HTML. Blank line = new paragraph, '## ' = heading, '> ' = quote."""
    out = []
    for block in re.split(r"\n\s*\n", raw.strip()):
        lines = block.split("\n")
        if block.startswith("## "):
            out.append(f'<h3 class="h3">{inline(block[3:].strip())}</h3>')
        elif all(l.startswith(">") for l in lines):
            quote = "<br>\n".join(inline(l[1:].strip()) for l in lines)
            out.append(f"<blockquote><p>{quote}</p></blockquote>")
        else:
            out.append("<p>" + "<br>\n".join(inline(l.strip()) for l in lines) + "</p>")
    return "\n        ".join(out)


def load_posts():
    """src/posts/<slug>.txt: 'key: value' header lines, a line with ---, then the article."""
    posts = []
    for f in sorted((SRC / "posts").glob("*.txt")):
        head, _, body = f.read_text(encoding="utf-8").partition("\n---\n")
        meta = dict(line.split(": ", 1) for line in head.strip().split("\n"))
        meta["slug"] = f.stem
        meta["body"] = body
        posts.append(meta)
    posts.sort(key=lambda m: m["date"], reverse=True)  # newest first
    return posts


def render_post(post, newer, older):
    y, m, d = (int(x) for x in post["date"].split("-"))
    pretty = f"{MONTHS[m - 1]} {d}, {y}"
    header = json.dumps({
        "path": f"resources/blog/{post['slug']}/", "title": post["title"], "nav": "resources",
        "class": "post", "description": post["excerpt"],
    })
    credit = f'<p class="post-credit">{inline(post["credit"])}</p>' if post.get("credit") else ""
    def link(other, label):
        if not other:
            return "<span></span>"
        return f'<a href="{{{{root}}}}resources/blog/{other["slug"]}/"><small>{label}</small><span>{inline(other["title"])}</span></a>'
    return f"""<!--{header}-->
    <section class="page-hero post-hero grain">
      <div class="bg"><img src="{{{{root}}}}{post['image']}" alt=""></div>
      <div class="container">
        <ol class="breadcrumb"><li><a href="{{{{root}}}}">Home</a></li><li><a href="{{{{root}}}}resources/">Resources</a></li><li><a href="{{{{root}}}}resources/#blog">Blog</a></li></ol>
        <h1 class="display">{inline(post['title'])}</h1>
        <p class="post-meta"><time datetime="{post['date']}">{pretty}</time> · By {inline(post['author'])}</p>
      </div>
    </section>
    <section class="section">
      <div class="container container-narrow prose post-body">
        {post_body(post['body'])}
        {credit}
        <nav class="post-nav" aria-label="More posts">
          {link(older, "Previous post")}
          {link(newer, "Next post")}
        </nav>
        <p class="post-all"><a class="link-arrow" href="{{{{root}}}}resources/#blog">All posts</a></p>
      </div>
    </section>
"""


MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]


def main():
    layout = (SRC / "layout.html").read_text(encoding="utf-8")
    for src_file in sorted((SRC / "pages").glob("*.html")):
        print("built", build_page(src_file, layout))
    posts = load_posts()
    for i, post in enumerate(posts):
        newer = posts[i - 1] if i > 0 else None
        older = posts[i + 1] if i + 1 < len(posts) else None
        print("built", build_text(post["slug"], render_post(post, newer, older), layout))


if __name__ == "__main__":
    main()
