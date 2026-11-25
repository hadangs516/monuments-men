"""Play the public game or a local preview in Chrome and WebKit."""
from pathlib import Path
import sys
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "checks" / "captures"
OUT.mkdir(exist_ok=True)
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8176/"


def play(browser, name, width, height, collect, touch):
    context = browser.new_context(viewport={"width": width, "height": height},
                                  is_mobile=touch, has_touch=touch,
                                  device_scale_factor=1, locale="ko-KR")
    page = context.new_page()
    page.set_default_timeout(20000)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("response", lambda r: errors.append(f"{r.status} {r.url}") if r.status >= 400 else None)

    def button(act, extra=""):
        return page.locator(f'button[data-act="{act}"]{extra}:visible').last

    def press(act, extra=""):
        target = button(act, extra)
        if touch:
            target.tap()
        else:
            target.click()

    def shot(label):
        page.evaluate("document.fonts.ready")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+1")
        page.screenshot(path=OUT / f"{name}-{label}.png", full_page=True, timeout=45000)

    def clues(chapter):
        for i in ([2, 0, 1] if collect else [0, 1]):
            # Use the painted scene itself, with the list available as an alternative.
            marker = page.locator(f'.marker[data-i="{i}"]')
            marker.tap() if touch else marker.click()
            if chapter == 0 and i == 0:
                shot("clue")
            press("close")
        press("puzzle")

    def reload_resume():
        page.reload(wait_until="networkidle")
        press("start")

    page.goto(URL, wait_until="networkidle")
    shot("home")
    assert page.locator('meta[property="og:image"]').get_attribute("content").endswith("assets/share.jpg")
    press("chapter", '[data-i="2"]')
    assert "앞 현장을" in page.locator("dialog").inner_text()
    press("close")
    press("guide")
    page.keyboard.press("Escape")
    assert not page.locator("dialog").is_visible()
    press("start")
    shot("letter")
    press("begin")
    shot("castle")
    clues(0)
    press("route", '[data-id="B-09"]')
    press("submit")
    assert "띠의 수" in page.locator(".feedback").inner_text()
    press("route", '[data-id="A-17"]')
    shot("route")
    reload_resume()
    assert button("route", '[data-id="A-17"]').get_attribute("aria-pressed") == "true"
    press("submit")
    press("next")
    shot("mine")
    clues(1)
    press("submit")
    assert "0칸" in page.locator(".feedback").inner_text()
    press("tile", '[data-i="0"]')
    press("tile", '[data-i="4"]')
    reload_resume()
    assert "왼쪽 지평선" in button("tile", '[data-i="0"]').get_attribute("aria-label")
    press("hint")
    press("hint")
    press("assist")
    for i in (3, 5):
        press("tile", f'[data-i="{i}"]')
    shot("photo")
    press("submit")
    press("next")
    shot("depot")
    clues(2)
    for i in (0, 1):
        press("proof", f'[data-i="{i}"]')
    press("city", '[data-id="헨트"]')
    press("submit")
    assert "권한" in page.locator(".feedback").inner_text()
    press("proof", '[data-i="0"]')
    press("proof", '[data-i="3"]')
    press("submit")
    assert "도시" in page.locator(".feedback").inner_text()
    press("city", '[data-id="브뤼셀"]')
    shot("handover")
    press("submit")
    press("ending")
    assert "분수는 그대로야" in page.locator("h1").inner_text()
    assert ("우표" in page.locator(".ending-letter").inner_text()) == collect
    shot("ending")
    press("history")
    assert page.locator(".sources a").count() == 2
    press("close")
    press("home")
    press("chapter", '[data-i="0"]')
    press("enter")
    if not collect:
        press("clue", '[data-i="2"]')
        press("close")
    press("journal")
    assert "개인 기록" in page.locator(".journal-meta").inner_text()
    press("close")
    press("settings")
    press("reset-confirm")
    press("settings")
    press("close")
    reload_resume()
    assert page.locator(".ending-letter").count() == 1
    assert not errors, errors
    context.close()
    print(f"{name} complete · saved puzzle state, retry, hint, ending, revisit, history", flush=True)


with sync_playwright() as pw:
    chrome = pw.chromium.launch(channel="chrome")
    play(chrome, "desktop", 1440, 900, True, False)
    play(chrome, "android", 393, 852, False, True)
    play(chrome, "landscape", 844, 390, True, True)
    chrome.close()
    webkit = pw.webkit.launch()
    play(webkit, "iphone", 390, 844, True, True)
    webkit.close()
