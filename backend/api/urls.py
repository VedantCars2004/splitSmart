from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, GroupViewSet, InstanceViewSet, ItemViewSet, BalanceViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'instances', InstanceViewSet, basename='instance')
router.register(r'items', ItemViewSet, basename='item')
router.register(r'balances', BalanceViewSet, basename='balance')

urlpatterns = [
    path('', include(router.urls)),
]