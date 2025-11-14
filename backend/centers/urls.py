# centers/urls.py
from django.urls import path
from .views import CenterListView, CenterCreateView, CenterUpdateView, CenterDeleteView

urlpatterns = [
    path("", CenterListView.as_view(), name="center-list"),
    path("create/", CenterCreateView.as_view(), name="center-create"),
    path("<int:id>/update/", CenterUpdateView.as_view(), name="center-update"),
    path("<int:id>/delete/", CenterDeleteView.as_view(), name="center-delete"),
]