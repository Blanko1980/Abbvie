#!/usr/bin/env python3
"""Bildgenerierung über die Gemini API (Weg 1).

Aufruf:
  python3 tools/gen_image.py --prompt-file p.txt --out bild.png [--ref a.png ...]
         [--model gemini-3-pro-image] [--aspect 16:9] [--size 2K]

Der Schlüssel kommt aus der Umgebungsvariable GEMINI_API_KEY und wird nie ausgegeben.
Referenzbilder (--ref) werden mitgeschickt, um Figuren und Stil konsistent zu halten.
"""
import argparse, base64, json, mimetypes, os, sys, time, urllib.request, urllib.error

API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt-file", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--ref", action="append", default=[])
    ap.add_argument("--model", default="gemini-3-pro-image")
    ap.add_argument("--aspect", default="16:9")
    ap.add_argument("--size", default="2K")
    ap.add_argument("--retries", type=int, default=3)
    a = ap.parse_args()

    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit("GEMINI_API_KEY fehlt")

    parts = []
    for r in a.ref:
        mime = mimetypes.guess_type(r)[0] or "image/png"
        with open(r, "rb") as f:
            parts.append({"inline_data": {"mime_type": mime, "data": base64.b64encode(f.read()).decode()}})
    with open(a.prompt_file, encoding="utf-8") as f:
        parts.append({"text": f.read()})

    image_config = {"aspectRatio": a.aspect}
    if a.size:
        image_config["imageSize"] = a.size
    body = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"], "imageConfig": image_config},
    }
    req = urllib.request.Request(
        API.format(model=a.model),
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )

    for attempt in range(a.retries):
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.load(resp)
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:600]
            if e.code in (429, 500, 503) and attempt < a.retries - 1:
                time.sleep(10 * (attempt + 1))
                continue
            sys.exit(f"HTTP {e.code}: {msg}")

    saved = False
    for cand in data.get("candidates", []):
        for p in cand.get("content", {}).get("parts", []):
            blob = p.get("inline_data") or p.get("inlineData")
            if blob and not p.get("thought"):
                os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
                raw = base64.b64decode(blob["data"])
                is_png = raw.startswith(b"\x89PNG")
                want_png = a.out.lower().endswith(".png")
                if is_png != want_png:  # Format an die Dateiendung anpassen
                    from io import BytesIO
                    from PIL import Image  # pip install pillow
                    im = Image.open(BytesIO(raw)).convert("RGB")
                    im.save(a.out, "PNG") if want_png else im.save(a.out, "JPEG", quality=95)
                else:
                    with open(a.out, "wb") as f:
                        f.write(raw)
                saved = True
            elif p.get("text") and not p.get("thought"):
                print("Modell:", p["text"][:300])
    if not saved:
        sys.exit("Kein Bild erhalten: " + json.dumps(data)[:600])
    print("gespeichert:", a.out)


if __name__ == "__main__":
    main()
