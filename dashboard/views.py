from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count
from django.db.models.functions import TruncDay
from .models import User, FeatureClick
from .serializers import UserSerializer, FeatureClickSerializer
from django.shortcuts import render

def index(request):
    return render(request, 'dashboard/index.html')

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

class TrackView(generics.CreateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = FeatureClickSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from datetime import datetime, timedelta
from django.utils import timezone

class AnalyticsView(views.APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        age_group = request.query_params.get('age') # <18, 18-40, >40
        gender = request.query_params.get('gender')
        feature_filter = request.query_params.get('feature') 

        clicks = FeatureClick.objects.all()

        # User filters
        if age_group:
            if age_group == '<18':
                clicks = clicks.filter(user__age__lt=18)
            elif age_group == '18-40':
                 clicks = clicks.filter(user__age__gte=18, user__age__lte=40)
            elif age_group == '>40':
                 clicks = clicks.filter(user__age__gt=40)
        
        if gender:
            clicks = clicks.filter(user__gender=gender)

        # Date filters
        if start_date_str:
            clicks = clicks.filter(timestamp__date__gte=start_date_str)
        if end_date_str:
            clicks = clicks.filter(timestamp__date__lte=end_date_str)

        # Bar Chart Data
        bar_data = clicks.values('feature_name').annotate(count=Count('id')).order_by('-count')

        # Line Chart Data
        line_qs = clicks
        if feature_filter:
            line_qs = line_qs.filter(feature_name=feature_filter)
        
        # Get actual data from DB
        db_data = line_qs.annotate(date=TruncDay('timestamp')).values('date').annotate(count=Count('id')).order_by('date')
        
        # Convert to dictionary for easy lookup
        data_dict = {item['date'].strftime('%Y-%m-%d') if hasattr(item['date'], 'strftime') else str(item['date']): item['count'] for item in db_data}
        
        # Generate full date range if start and end dates are provided
        line_data = []
        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                
                current_date = start_date
                while current_date <= end_date:
                    date_str = current_date.strftime('%Y-%m-%d')
                    line_data.append({
                        'date': date_str,
                        'count': data_dict.get(date_str, 0)
                    })
                    current_date += timedelta(days=1)
            except ValueError:
                # Fallback if date parsing fails
                line_data = list(db_data)
        else:
            line_data = list(db_data)

        return Response({
            'bar_chart': list(bar_data),
            'line_chart': line_data
        })
