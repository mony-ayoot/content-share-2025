from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from aits.models import Notification

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()
    
    return Response({'count': count})