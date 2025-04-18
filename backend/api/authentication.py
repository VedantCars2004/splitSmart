import firebase_admin
from firebase_admin import credentials, auth
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import authentication
from rest_framework import exceptions

# Initialize Firebase Admin SDK
cred = credentials.Certificate(settings.FIREBASE_CONFIG)
firebase_admin.initialize_app(cred)

# Add this to wherever you create/sync Django users from Firebase
# This ensures the username field matches the email
def get_or_create_user_from_firebase(firebase_user):
    email = firebase_user.get('email')
    try:
        # Try to get the user by email first
        user = User.objects.get(email=email)
        # Make sure username matches email for consistency
        if user.username != email:
            user.username = email
            user.save()
        return user
    except User.DoesNotExist:
        # Create a new user with email as username
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=firebase_user.get('displayName', '').split(' ')[0] if firebase_user.get('displayName') else '',
            last_name=' '.join(firebase_user.get('displayName', '').split(' ')[1:]) if firebase_user.get('displayName') else ''
        )
        return user

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None
        
        id_token = auth_header.split(' ').pop()
        try:
            decoded_token = auth.verify_id_token(id_token)
            uid = decoded_token['uid']
            email = decoded_token.get('email', '')
            
            # Get or create user
            try:
                user = User.objects.get(username=uid)
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=uid,
                    email=email,
                    password=None  # No password since using Firebase
                )
                
                # Update profile info if available
                if 'name' in decoded_token:
                    name_parts = decoded_token['name'].split(' ', 1)
                    user.first_name = name_parts[0]
                    if len(name_parts) > 1:
                        user.last_name = name_parts[1]
                    user.save()
            
            return (user, None)
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Invalid token: {str(e)}')