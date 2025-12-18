import re
import threading
from django.conf import settings


request_cfg = threading.local()


class RouterMiddleware(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        pattern = re.compile("\\b(http://|https://|www.|.com|8000|:|//)\\W\\d+", re.I)
        words = request.get_host()        
        db_name = [pattern.sub("", words)][0].split('.')[0]

        databases = list(settings.DATABASES.keys())

        if db_name in databases:
            request_cfg.cfg = db_name
        else:
            request_cfg.cfg = "default"

        response = self.get_response(request)

        if hasattr( request_cfg, 'cfg' ):
            del request_cfg.cfg
        return response


class DatabaseRouter (object):
    def _default_db( self ):
        if hasattr( request_cfg, 'cfg' ):
            return request_cfg.cfg
        else:
            return 'default'

    def db_for_read( self, model, **hints ):
        return self._default_db()

    def db_for_write( self, model, **hints ):
        return self._default_db()
