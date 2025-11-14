# centers/urls.py
from django.urls import path
from .views import CenterListView, CenterCreateView

urlpatterns = [
    path("", CenterListView.as_view(), name="center-list"),
    path("create/", CenterCreateView.as_view(), name="center-create"),
]