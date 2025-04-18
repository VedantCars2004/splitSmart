from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Sum, Q
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
            # Check if user is already a member
            if GroupMember.objects.filter(group=group, user=user).exists():
                return Response({'error': 'User is already a member of this group'}, 
                            status=status.HTTP_400_BAD_REQUEST)
            GroupMember.objects.create(group=group, user=user)
            return Response({'status': 'member added'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class InstanceViewSet(viewsets.ModelViewSet):
    serializer_class = InstanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
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
        
        # Debug info
        print(f"Creating item by user: {self.request.user.username}, email: {self.request.user.email}")
        
        item = serializer.save(created_by=self.request.user, instance=instance)
        
        # Create item splits based on shared_with users
        shared_with_ids = self.request.data.get('shared_with', [])
        print(f"Shared with IDs: {shared_with_ids}")
        
        if shared_with_ids:
            # Ensure we can handle both username and ID lookup
            users = []
            for id_or_username in shared_with_ids:
                # First try to find by ID
                user = User.objects.filter(id=id_or_username).first()
                if not user:
                    # Then try to find by username (which might be email)
                    user = User.objects.filter(username=id_or_username).first()
                if not user:
                    # Finally try by email
                    user = User.objects.filter(email=id_or_username).first()
                    
                if user and user not in users:
                    users.append(user)
            
            # Print found users for debugging
            for user in users:
                print(f"Found user to share with: id={user.id}, username={user.username}, email={user.email}")
            
            # If no users found, log this for debugging
            if not users:
                print(f"No users found for IDs/usernames: {shared_with_ids}")
                return
                
            # Include payer in the count - they already paid
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
        
        print(f"Updating balances: item={item.name}, payer={payer.username}, users={[u.username for u in users]}, amount={split_amount}")
        
        for user in users:
            if user != payer:
                # Look for existing balance in either direction
                balance = Balance.objects.filter(
                    group=group,
                    from_user=user,
                    to_user=payer
                ).first()
                
                opposite_balance = Balance.objects.filter(
                    group=group,
                    from_user=payer,
                    to_user=user
                ).first()
                
                if opposite_balance:
                    # If there's an opposite direction balance, reduce it first
                    if opposite_balance.amount >= split_amount:
                        opposite_balance.amount -= split_amount
                        if opposite_balance.amount > 0:
                            opposite_balance.save()
                            print(f"Reduced opposite balance: {payer.username} owes {user.username} ${opposite_balance.amount}")
                        else:
                            opposite_balance.delete()
                            print(f"Deleted zero balance between {payer.username} and {user.username}")
                    else:
                        # If the opposite balance is smaller, zero it out and create a new one
                        remaining = split_amount - opposite_balance.amount
                        opposite_balance.delete()
                        
                        # Create or update balance in the other direction
                        balance, created = Balance.objects.get_or_create(
                            group=group,
                            from_user=user,
                            to_user=payer,
                            defaults={'amount': remaining}
                        )
                        
                        if not created:
                            balance.amount += remaining
                            balance.save()
                        
                        print(f"Created/updated balance: {user.username} owes {payer.username} ${balance.amount}")
                else:
                    # No opposite balance, just create or update
                    balance, created = Balance.objects.get_or_create(
                        group=group,
                        from_user=user,
                        to_user=payer,
                        defaults={'amount': split_amount}
                    )
                    
                    if not created:
                        balance.amount += split_amount
                        balance.save()
                    
                    print(f"Updated balance: {user.username} owes {payer.username} ${balance.amount}")


class BalanceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BalanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Get all balances where the user is involved
        user = self.request.user
        print(f"Getting balances for user: id={user.id}, username={user.username}, email={user.email}")
        
        balances = Balance.objects.filter(
            group__members=user
        ).filter(
            Q(from_user=user) | Q(to_user=user)
        )
        
        print(f"Found {balances.count()} balances")
        for balance in balances:
            print(f"Balance: {balance.from_user.username} owes {balance.to_user.username} ${balance.amount}")
        
        return balances