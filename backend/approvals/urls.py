from django.urls import path
from .views import ApprovalListCreateView, MyApprovalListView, ApprovalActionView

urlpatterns = [
    path('', ApprovalListCreateView.as_view(), name='approval-list-create'),
    path('my/', MyApprovalListView.as_view(), name='my-approval-list'),
    path('<int:pk>/<str:action>/', ApprovalActionView.as_view(), name='approval-action'),
]