# Serves a folder on 127.0.0.1, like python -m http.server. With --csp it sends the content policy of the device bench
# (aravo.oksigenia.com/eq/b/), so the walk catches what a strict host blocks, such as inline style attributes: the
# browser reports each one as a console error. The style hashes are those of Oksigenia's accessibility panel, the same
# as in app/index.html (tests/csp.mjs checks that both say the same).
# Usage: python3 -I servir.py <port> <folder> [--csp]
import functools
import http.server
import sys

CSP = ("default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client; "
       "style-src 'self' 'unsafe-hashes' 'sha256-S7ClRAmGJq3evHjIDEpITgQRsrKVzPiY8x2s1HkH4Kg=' "
       "'sha256-4wOm3BwddL5VP97matJWlHbRkq9UhogcJWNPtIU220A=' 'sha256-HXpdsTS7aV+r+X2zQtxJcxGFkx9YDkRb2LwtnZjFr/E=' "
       "https://accounts.google.com/gsi/style; img-src 'self' data: blob:; "
       "media-src 'self' blob:; worker-src 'self' blob:; "
       "connect-src 'self' https://www.googleapis.com https://accounts.google.com/gsi/; "
       "frame-src https://accounts.google.com/gsi/; form-action 'none'; frame-ancestors 'none'; base-uri 'none'")


class Manejador(http.server.SimpleHTTPRequestHandler):
    csp = False

    def end_headers(self):
        if self.csp:
            self.send_header('Content-Security-Policy', CSP)
        super().end_headers()

    def log_message(self, *args):
        pass


def main():
    puerto, carpeta = int(sys.argv[1]), sys.argv[2]
    Manejador.csp = '--csp' in sys.argv[3:]
    manejador = functools.partial(Manejador, directory=carpeta)
    http.server.ThreadingHTTPServer(('127.0.0.1', puerto), manejador).serve_forever()


if __name__ == '__main__':
    main()
