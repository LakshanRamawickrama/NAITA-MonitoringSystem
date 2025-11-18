# centers/views.py
from rest_framework import generics, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Center
from .serializers import CenterSerializer

class CenterListView(generics.ListAPIView):
    queryset = Center.objects.all()
    serializer_class = CenterSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'district_manager' and user.district:
            queryset = queryset.filter(district=user.district)
        
        return queryset
    
class CenterCreateView(generics.CreateAPIView):
    queryset = Center.objects.all()
    serializer_class = CenterSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
class CenterUpdateView(generics.UpdateAPIView):
    queryset = Center.objects.all()
    serializer_class = CenterSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"
    
class CenterDeleteView(generics.DestroyAPIView):
    queryset = Center.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"