from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Sum
from .models import Group, GroupMember, Instance, Item, ItemSplit, Balance
from .serializers import (
    UserSerializer, GroupSerializer, InstanceSerializer,
    ItemSerializer, BalanceSerializer
)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]
        obj = queryset.filter(pk=lookup_value).first()
        self.check_object_permissions(self.request, obj)
        return obj
    
    def get_queryset(self):
        return Group.objects.filter(members=self.request.user)
    
    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)
        GroupMember.objects.create(group=group, user=self.request.user)
        
    @action(detail=True, methods=['post'])
    def leave_group(self, request, pk=None):
        group = self.get_object()
        user = request.user
        try:
            membership = GroupMember.objects.get(group=group, user=user)
            membership.delete()
            if GroupMember.objects.filter(group=group).count() == 0:
                group.delete()
                return Response({'status': 'group deleted as you were the last member'})
            return Response({'status': 'you have left the group'})
        except GroupMember.DoesNotExist:
            return Response({'error': 'You are not a member of this group'}, 
                            status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        group = self.get_object()
        email = request.data.get('email')
        
        try:
            user = User.objects.get(email=email)
            GroupMember.objects.create(group=group, user=user)
            return Response({'status': 'member added'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)



class InstanceViewSet(viewsets.ModelViewSet):
    queryset = Instance.objects.all()
    serializer_class = InstanceSerializer
    def get_queryset(self):
        return Instance.objects.filter(group__members=self.request.user)
    

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Item.objects.filter(instance__group__members=self.request.user)
    
    def perform_create(self, serializer):
        instance_id = self.request.data.get('instance')
        instance = Instance.objects.get(id=instance_id)
        item = serializer.save(created_by=self.request.user, instance=instance)
        
        # Create item splits based on shared_with users
        shared_with_ids = self.request.data.get('shared_with', [])
        if shared_with_ids:
            users = User.objects.filter(id__in=shared_with_ids)
            split_amount = item.price / len(users)
            
            for user in users:
                ItemSplit.objects.create(
                    item=item,
                    user=user,
                    amount=split_amount
                )
                
            # Update balances
            self._update_balances(item, users, split_amount)
    
    def _update_balances(self, item, users, split_amount):
        payer = item.created_by
        instance = item.instance
        group = instance.group
        
        for user in users:
            if user != payer:
                # Check if balance already exists
                balance, created = Balance.objects.get_or_create(
                    group=group,
                    from_user=user,
                    to_user=payer,
                    defaults={'amount': 0}
                )
                
                balance.amount += split_amount
                balance.save()

class BalanceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BalanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Get all balances where the user is involved
        user = self.request.user
        return Balance.objects.filter(
            group__members=user
        ).filter(
            from_user=user
        ) | Balance.objects.filter(
            group__members=user
        ).filter(
            to_user=user
        )