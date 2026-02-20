from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,empty_favicon
)
from . import views

urlpatterns = [
    path('favicon.ico', empty_favicon),
    path('favicon.png', empty_favicon),
    path('', views.index, name='index'),
    path('api/register/', views.RegisterView.as_view(), name='register'),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/track/', views.TrackView.as_view(), name='track'),
    path('api/analytics/', views.AnalyticsView.as_view(), name='analytics'),
]
