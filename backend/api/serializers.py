from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Group, GroupMember, Instance, Item, ItemSplit, Balance

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = GroupMember
        fields = ['id', 'user', 'joined_at']

class GroupSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'created_by', 'created_at', 'members']

class ItemSplitSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ItemSplit
        fields = ['id', 'user', 'amount']

class ItemSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    shared_with = ItemSplitSerializer(source='splits', many=True, read_only=True)
    # Add this line to make instance writable:
    instance = serializers.PrimaryKeyRelatedField(queryset=Instance.objects.all())
    
    class Meta:
        model = Item
        fields = ['id', 'name', 'price', 'created_by', 'created_at', 'shared_with', 'instance']

class InstanceSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    # Add the group field for writes
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())
    items = ItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Instance
        fields = ['id', 'name', 'date', 'description', 'group', 'created_by', 'created_at', 'items']


class BalanceSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)
    
    class Meta:
        model = Balance
        fields = ['id', 'from_user', 'to_user', 'amount']