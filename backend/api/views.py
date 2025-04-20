from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Sum, Q, Count
from .models import Group, GroupMember, Instance, Item, ItemSplit, Balance
from .serializers import (
    UserSerializer, GroupSerializer, InstanceSerializer,
    ItemSerializer, BalanceSerializer
)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Group, GroupMember
from .serializers import GroupSerializer

class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return only groups that the current user is a member of"""
        return Group.objects.filter(members=self.request.user)
    
    def perform_create(self, serializer):
        """Set the current user as the created_by field and add them as a member"""
        group = serializer.save(created_by=self.request.user)
        # Add the creator as a member and admin
        GroupMember.objects.create(
            group=group,
            user=self.request.user,
            is_admin=True
        )
        
    def create(self, request, *args, **kwargs):
        """Override create to add debug logging"""
        print("Create group request received:", request.data)
        print("Request user:", request.user)
        return super().create(request, *args, **kwargs)
    
    def get_object(self):
        """Get a specific group and verify the user has permission"""
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]
        obj = queryset.filter(pk=lookup_value).first()
        self.check_object_permissions(self.request, obj)
        return obj
    
    @action(detail=True, methods=['post'])
    def leave_group(self, request, pk=None):
        """Allow a user to leave a group"""
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
        """Add a new member to the group by email"""
        group = self.get_object()
        email = request.data.get('email')
        
        from django.contrib.auth.models import User
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
    
    def perform_destroy(self, instance):
        """Delete group and all related balances"""
        from .models import Balance
        # Delete all balances for this group
        Balance.objects.filter(group=instance).delete()
        # Then delete the group (will cascade delete instances, items, etc.)
        instance.delete()
    
class InstanceViewSet(viewsets.ModelViewSet):
    serializer_class = InstanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Instance.objects.filter(group__members=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def perform_destroy(self, instance):
        """Handle balance cleanup when an instance is deleted"""
        group = instance.group
        # Delete the instance first (this will cascade delete all items)
        instance.delete()
        
        # Check if group has any remaining items
        item_count = Item.objects.filter(instance__group=group).count()
        if item_count == 0:
            # No items left in the group, clean up all balances
            deleted_count = Balance.objects.filter(group=group).delete()[0]
            print(f"Cleaned up {deleted_count} balances for group {group.name} as it has no items")


class ItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Item.objects.filter(instance__group__members=self.request.user)
    
    def perform_create(self, serializer):
        instance_id = self.request.data.get('instance')
        instance = Instance.objects.get(id=instance_id)

        print(f"Creating item by user: {self.request.user.username}, email: {self.request.user.email}")

        item = serializer.save(created_by=self.request.user, instance=instance)

        shared_with_ids = self.request.data.get('shared_with', [])
        print(f"Shared with IDs: {shared_with_ids}")

        if not shared_with_ids:
            print("No users shared with — skipping split creation")
            return

        # Resolve users
        users = []
        for id_or_username in shared_with_ids:
            user = (
                User.objects.filter(id=id_or_username).first() or
                User.objects.filter(username=id_or_username).first() or
                User.objects.filter(email=id_or_username).first()
            )
            if user and user not in users:
                users.append(user)

        for user in users:
            print(f"Found user to share with: id={user.id}, username={user.username}, email={user.email}")

        if not users:
            print(f"No users found for IDs/usernames: {shared_with_ids}")
            return

        payer = item.created_by

        # If the payer is not in the split, treat it as a gift and skip balances
        if payer not in users:
            print("Payer is not part of the shared_with list — skipping balance creation")
            return

        split_amount = item.price / len(users)

        # Create item splits
        for user in users:
            ItemSplit.objects.create(
                item=item,
                user=user,
                amount=split_amount
            )

        # Exclude payer from balance calculations (they already paid)
        users_to_bill = [u for u in users if u != payer]

        if not users_to_bill:
            print("Only payer is included — no one owes money")
            return

        # Update balances for other users
        self._update_balances(item, users_to_bill, split_amount)

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
    
    def perform_destroy(self, instance):
        """Handle balance adjustments when an item is deleted"""
        # Get all the splits for this item
        splits = ItemSplit.objects.filter(item=instance)
        payer = instance.created_by
        group = instance.instance.group
        
        print(f"Deleting item: {instance.name}, adjusting balances")
        
        # Adjust balances for each split
        for split in splits:
            user = split.user
            split_amount = split.amount
            
            if user != payer:
                # First try to find direct balance where user owes payer
                balance = Balance.objects.filter(
                    group=group,
                    from_user=user,
                    to_user=payer
                ).first()
                
                if balance:
                    # Reduce the balance
                    balance.amount -= split_amount
                    if balance.amount <= 0.001:  # Handle floating point precision
                        balance.delete()
                        print(f"Deleted balance: {user.username} no longer owes {payer.username}")
                    else:
                        balance.save()
                        print(f"Reduced balance: {user.username} now owes {payer.username} ${balance.amount}")
                else:
                    # If no direct balance found, we need to increase the opposite balance
                    opposite_balance = Balance.objects.filter(
                        group=group,
                        from_user=payer,
                        to_user=user
                    ).first()
                    
                    if opposite_balance:
                        opposite_balance.amount += split_amount
                        opposite_balance.save()
                        print(f"Increased opposite balance: {payer.username} now owes {user.username} ${opposite_balance.amount}")
                    else:
                        # Create new balance in opposite direction
                        Balance.objects.create(
                            group=group,
                            from_user=payer,
                            to_user=user,
                            amount=split_amount
                        )
                        print(f"Created new balance: {payer.username} now owes {user.username} ${split_amount}")
        
        # Now actually delete the item
        instance.delete()
        
        # Check if this group has any remaining items
        self._clean_up_balances(group)
    
    def _clean_up_balances(self, group):
        """Clean up balances if no items exist in the group"""
        # Count items in this group across all instances
        item_count = Item.objects.filter(instance__group=group).count()
        
        if item_count == 0:
            # No items left in the group, clean up all balances
            deleted_count = Balance.objects.filter(group=group).delete()[0]
            print(f"Cleaned up {deleted_count} balances for group {group.name} as it has no items")


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