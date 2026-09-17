#!/usr/bin/env python3
"""Local dev server that mirrors Vercel's `cleanUrls` behaviour.

The site links to extensionless paths (/about, /contact) because vercel.json sets
cleanUrls. Python's plain http.server can't resolve those, so this maps
/about -> about.html and falls back to 404.html, exactly as the deploy does.

    python serve.py [port]        # default 5173
"""
import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def send_head(self):
        path = self.translate_path(self.path)
        # /about -> about.html
        if not os.path.exists(path) and not path.endswith(('/', '.html')):
            if os.path.isfile(path + '.html'):
                self.path = self.path.split('?')[0] + '.html'
        # anything still missing -> the styled 404 page
        if not os.path.exists(self.translate_path(self.path)):
            self.path = '/404.html'
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            body = open(os.path.join(ROOT, '404.html'), 'rb').read()
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            return None if self.command == 'HEAD' else __import__('io').BytesIO(body)
        return super().send_head()

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


class Server(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == '__main__':
    with Server(("127.0.0.1", PORT), Handler) as httpd:
        print("Saeki Dojo prototype  ->  http://127.0.0.1:%d" % PORT)
        print("Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")
