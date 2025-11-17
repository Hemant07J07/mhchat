from __future__ import annotations
import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mhchat_proj.settings')

app = Celery('mhchat_proj')

# read configuration from Django settings, CELERY_prefix will be used
app.config_from_object('django.conf:settings', namespace='CELERY')

# auto-discover tasks from installed apps (looks for tasks.py inside apps)
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f"Celery debug task: {self.request!r}")