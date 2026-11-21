#!/usr/bin/env python3
# Make a link to the LCARdS docs' "Preview Your YAML" page with this YAML inside it,
# for a sandbox without Node. Same as lcards-preview-link.mjs:
#
#   python3 scripts/lcards-preview-link.py <file.yaml> [--html <out.html>]   (- for standard input)
#
# Prints the link. With --html it also writes a small page that opens the preview: hand
# the user that file rather than retyping the link (a long link copied by hand breaks).
import base64, json, sys, zlib

PREVIEW_URL = '__PREVIEW_URL__'

args = sys.argv[1:]
html = None
if '--html' in args:
    i = args.index('--html')
    html = args[i + 1] if i + 1 < len(args) else None
    del args[i:i + 2]
    if not html:
        args = []
if not args:
    sys.exit('usage: python3 lcards-preview-link.py <file.yaml | -> [--html <out.html>]')
data = sys.stdin.buffer.read() if args[0] == '-' else open(args[0], 'rb').read()
c = zlib.compressobj(9, zlib.DEFLATED, -15)
packed = base64.urlsafe_b64encode(c.compress(data) + c.flush()).decode().rstrip('=')
url = PREVIEW_URL + '#yaml=' + packed
print(url)
if html:
    with open(html, 'w', encoding='utf-8') as f:
        f.write('<!doctype html>\n<meta charset="utf-8">\n<title>LCARdS preview</title>\n'
                f'<p><a href="{url}">Open the LCARdS preview</a></p>\n'
                f'<script>location.replace({json.dumps(url)})</script>\n')
    print(f'Wrote {html}: opening it shows the preview.', file=sys.stderr)
if len(url) > 60000:
    print(f'Note: the link is {len(url)} characters; some chat apps cut links this long. '
          f'Offer the YAML to paste on {PREVIEW_URL} too.', file=sys.stderr)
