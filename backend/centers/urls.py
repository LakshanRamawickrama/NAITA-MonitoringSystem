# centers/urls.py
from django.urls import path
from .views import CenterListView

urlpatterns = [
    path("", CenterListView.as_view(), name="center-list"),
]