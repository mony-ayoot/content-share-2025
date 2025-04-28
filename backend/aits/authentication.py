import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User

class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        try:
            # Check for Bearer token
            auth_parts = auth_header.split()
            if len(auth_parts) != 2 or auth_parts[0].lower() != 'bearer':
                raise AuthenticationFailed('Invalid authorization header format. Use: Bearer <token>')

            token = auth_parts[1]
            
            # Decode the token
            try:
                payload = jwt.decode(
                    token, 
                    settings.JWT_SECRET_KEY,
                    algorithms=[settings.JWT_ALGORITHM]
                )
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed('Token has expired')
            except jwt.InvalidTokenError:
                raise AuthenticationFailed('Invalid token')
            
            # Get user from payload
            try:
                user = User.objects.get(username=payload['user_id'])
            except User.DoesNotExist:
                raise AuthenticationFailed('No user found for token')
            
            # Ensure user role matches the token
            if user.role != payload.get('role'):
                raise AuthenticationFailed('Invalid user role')
                
            return (user, None)
            
        except (IndexError, KeyError):
            raise AuthenticationFailed('Invalid token format')
        except Exception as e:
            raise AuthenticationFailed(str(e))

    def authenticate_header(self, request):
        return 'Bearer'