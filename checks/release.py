"""Verify the Pages build and the card metadata served to a Kakao link crawler."""
from hashlib import sha256
from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path
from time import monotonic, sleep, time_ns
from urllib.error import URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from PIL import Image

BASE = "https://hadangs516.github.io/monuments-men/"
ROOT = Path(__file__).resolve().parents[1]


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
        self.links = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "meta" and "property" in values:
            self.meta[values["property"]] = values.get("content")
        if tag == "link":
            self.links.append(values)


def fetch(url, agent="Game release check"):
    req = Request(url, headers={"User-Agent": agent})
    with urlopen(req, timeout=16) as response:
        assert response.status == 200
        return response.read()


def normalized(data, path):
    if Path(path).suffix in {".html", ".js", ".css", ".webmanifest", ".txt"}:
        return data.replace(b"\r\n", b"\n")
    return data


deadline = monotonic() + 240
while monotonic() < deadline:
    try:
        code = fetch(BASE + "game.js?build=" + str(time_ns()))
        if normalized(code, "game.js") == normalized((ROOT / "game.js").read_bytes(), "game.js"):
            break
    except URLError:
        pass
    sleep(5)
else:
    raise RuntimeError("Could not find the current game on GitHub Pages")
files = ["index.html", "story.js", "game.js", "style.css", "favicon.ico", "manifest.webmanifest"]
files += ["assets/" + p.name for p in (ROOT / "assets").iterdir() if p.is_file()]
for path in files:
    remote = normalized(fetch(urljoin(BASE, path)), path)
    local = normalized((ROOT / path).read_bytes(), path)
    assert sha256(remote).digest() == sha256(local).digest(), path

agent = "facebookexternalhit/1.1;kakaotalk-scrap/1.0"
head = Head()
head.feed(fetch(BASE, agent).decode("utf-8"))
assert head.meta["og:url"] == BASE
assert head.meta["og:image"].startswith(BASE)
card = Image.open(BytesIO(fetch(head.meta["og:image"], agent)))
assert card.size == (1200, 630) and card.format == "JPEG"
assert "제단화" in head.meta["og:title"]
for link in head.links:
    if link.get("rel") in {"icon", "apple-touch-icon"}:
        im = Image.open(BytesIO(fetch(urljoin(BASE, link["href"]))))
        im.verify()
print(f"Public build matches {len(files)} local files. Kakao crawler metadata, image and icons verified.")
