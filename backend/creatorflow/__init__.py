import os

if not os.getenv('VERCEL'):
    from .celery import app as celery_app
    __all__ = ('celery_app',)
else:
    # Vercel serves synchronous HTTP functions; eagerly importing the worker
    # stack increases every cold start without processing any jobs.
    __all__ = ()
