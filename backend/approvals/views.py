# approvals/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Approval
from .serializers import ApprovalSerializer

class ApprovalListCreateView(generics.ListCreateAPIView):
    queryset = Approval.objects.all()
    serializer_class = ApprovalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # For admin, show all; adjust based on user role if needed
        return super().get_queryset()

class MyApprovalListView(generics.ListAPIView):
    serializer_class = ApprovalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Approval.objects.filter(requested_by=self.request.user)

class ApprovalActionView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk, action):
        try:
            approval = Approval.objects.get(pk=pk)
        except Approval.DoesNotExist:
            return Response({'error': 'Approval not found'}, status=status.HTTP_404_NOT_FOUND)

        # Optionally, check if user is admin or authorized to approve/reject

        if action == 'approve':
            approval.status = 'Approved'
        elif action == 'reject':
            approval.status = 'Rejected'
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

        approval.save()
        return Response(ApprovalSerializer(approval).data)