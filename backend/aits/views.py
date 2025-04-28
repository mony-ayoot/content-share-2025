from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.hashers import check_password
from rest_framework import serializers
from django.conf import settings
import jwt
import traceback
import datetime
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Issue, Student, Lecturer, User, Notification
from .serializers import (
    IssueSerializer, 
    LoginSerializer,
    StudentRegistrationSerializer,
    LecturerRegistrationSerializer,
    NotificationSerializer,
    RegistrarRegistrationSerializer,
    StudentSerializer,
    LecturerSerializer
)
from .permissions import IsStudent, IsLecturer, IsAcademicRegistrar


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            role = serializer.validated_data['role']
            
            # Get current timestamp and set expiration
            now = datetime.datetime.utcnow()
            exp = now + datetime.timedelta(hours=24)
            
            # Generate JWT token with expiration
            token = jwt.encode(
                {
                    'user_id': user.username,
                    'role': role,
                    'exp': int(exp.timestamp())
                },
                settings.SECRET_KEY,
                algorithm='HS256'
            )
            
            return Response({
                'token': token,
                'user': {
                    'userId': user.username,
                    'fullName': f"{user.first_name} {user.last_name}".strip(),
                    'email': user.email,
                    'role': role
                }
            }, status=status.HTTP_200_OK)
            
        return Response(
            {'error': serializer.errors.get('non_field_errors', ['Invalid credentials'])[0]},
            status=status.HTTP_401_UNAUTHORIZED
        )

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        role = request.data.get('role')
        print("\n=== Registration Request ===")
        print("Received data:", request.data)
        
        if role == 'student':
            serializer = StudentRegistrationSerializer(data=request.data)
        elif role == 'lecturer':
            serializer = LecturerRegistrationSerializer(data=request.data)
        elif role == 'registrar':
            serializer = RegistrarRegistrationSerializer(data=request.data)
        else:
            print("Invalid role:", role)
            return Response(
                {'errors': {'role': f'Invalid role. Must be one of: student, lecturer, registrar'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        if serializer.is_valid():
            try:
                instance = serializer.save()
                user = instance.user
                print("User created successfully:", user.username)
                return Response({
                    'message': 'Registration successful',
                    'user': {
                        'userId': user.username,
                        'fullName': f"{user.first_name} {user.last_name}".strip(),
                        'email': user.email,
                        'role': user.role
                    }
                }, status=status.HTTP_201_CREATED)
            except serializers.ValidationError as e:
                print("Validation error:", str(e))
                return Response({'errors': {'general': str(e)}}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                print("Registration error:", str(e))
                print("Traceback:", traceback.format_exc())
                return Response(
                    {'errors': {'general': 'Registration failed. Please try again.'}},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Format validation errors
        errors = {}
        for field, error_list in serializer.errors.items():
            errors[field] = error_list[0] if isinstance(error_list, list) else error_list
        
        print("Validation errors:", errors)
        return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

class StudentIssueCreateView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get(self, request):
        try:
            # Get the student instance
            student = request.user.student_profile
            
            # Get all issues for this student
            issues = Issue.objects.filter(student=student).order_by('-created_at')
            
            # Serialize the issues
            serializer = IssueSerializer(issues, many=True)
            
            return Response({
                'issues': serializer.data
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        try:
            print("\n=== Creating New Issue ===")
            print(f"Request data: {request.data}")
            
            # Get the student instance
            student = request.user.student_profile
            print(f"Student: {student}")
            
            # Get assigned lecturer if provided
            assigned_to = None
            if 'assigned_to' in request.data:
                try:
                    assigned_to = Lecturer.objects.get(id=request.data['assigned_to'])
                    print(f"Assigning to lecturer: {assigned_to}")
                except Lecturer.DoesNotExist:
                    print(f"Lecturer with ID {request.data['assigned_to']} not found")
                    return Response({
                        'error': 'Selected lecturer does not exist'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the issue
            serializer = IssueSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                print(f"Serializer is valid. Data: {serializer.validated_data}")
                
                # Add the student and assigned lecturer to the issue data
                serializer.validated_data['student'] = student
                if assigned_to:
                    serializer.validated_data['assigned_to'] = assigned_to
                
                # Handle file upload
                if 'attachment' in request.FILES:
                    serializer.validated_data['attachment'] = request.FILES['attachment']
                
                # Save the issue
                issue = serializer.save()
                print(f"Issue created successfully: {issue}")
                
                # Create notification for the student
                create_notification(
                    recipient=request.user,
                    notification_type='issue_created',
                    issue=issue,
                    message=f'Your issue "{issue.title}" has been submitted successfully.'
                )
                
                # Create notification for assigned lecturer if one is assigned
                if assigned_to:
                    create_notification(
                        recipient=assigned_to.user,
                        notification_type='issue_assigned',
                        issue=issue,
                        message=f'You have been assigned a new issue: {issue.title}'
                    )
                    print(f"Notification sent to lecturer: {assigned_to}")
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Error creating issue: {str(e)}")
            return Response(
                {'error': 'Failed to create issue', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LecturerIssueListView(generics.ListAPIView):
    serializer_class = IssueSerializer
    permission_classes = [IsLecturer]

    def get_queryset(self):
        lecturer = self.request.user.lecturer_profile
        return Issue.objects.filter(assigned_to=lecturer)


class IssueUpdateView(generics.UpdateAPIView):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]  # Base authentication check

    def get_permissions(self):
        """
        Custom permission check that properly implements OR logic
        between IsLecturer and IsAcademicRegistrar
        """
        if self.request.user.is_authenticated:
            if self.request.user.role in ['lecturer', 'registrar']:
                return []
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        issue = serializer.save()
        if self.request.user.role == 'lecturer':
            # Create notification about the update
            create_notification(
                recipient=issue.student.user,
                notification_type='issue_updated',
                issue=issue,
                message=f'Your issue "{issue.title}" has been updated'
            )


class StudentIssueDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = IssueSerializer
    permission_classes = [IsStudent]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        student = self.request.user.student_profile
        return Issue.objects.filter(student=student)

    def perform_update(self, serializer):
        student = self.request.user.student_profile
        
        # Handle file upload during update
        if 'attachment' in self.request.FILES:
            serializer.validated_data['attachment'] = self.request.FILES['attachment']
            
        issue = serializer.save(student=student)
        
        # Create notification for assigned lecturer if one is assigned
        if issue.assigned_to:
            create_notification(
                recipient=issue.assigned_to.user,
                notification_type='issue_updated',
                issue=issue,
                message=f'Issue updated: {issue.title}'
            )


class LecturerIssueDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = IssueSerializer
    permission_classes = [IsLecturer]

    def get_queryset(self):
        lecturer = self.request.user.lecturer_profile
        return Issue.objects.filter(assigned_to=lecturer)

    def perform_update(self, serializer):
        issue = serializer.save()
        
        # Create notification for the student when status changes
        if 'status' in self.request.data:
            create_notification(
                recipient=issue.student.user,
                notification_type='issue_updated',
                issue=issue,
                message=f'Your issue "{issue.title}" status has been updated to {issue.status}'
            )


class AcademicRegistrarIssueListView(generics.ListAPIView):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [IsAcademicRegistrar]

class AcademicRegistrarIssueDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = IssueSerializer
    permission_classes = [IsAcademicRegistrar]
    queryset = Issue.objects.all()

    def perform_update(self, serializer):
        issue = serializer.save()
        
        # Create notification for status changes
        if 'status' in self.request.data:
            create_notification(
                recipient=issue.student.user,
                notification_type='issue_updated',
                issue=issue,
                message=f'Your issue "{issue.title}" status has been updated to {issue.status}'
            )
        
        # Create notification for assignment changes
        if 'assigned_to' in self.request.data and issue.assigned_to:
            create_notification(
                recipient=issue.assigned_to.user,
                notification_type='issue_assigned',
                issue=issue,
                message=f'You have been assigned to issue: {issue.title}'
            )


class IssueDeleteView(generics.DestroyAPIView):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter issues based on user role and permissions
        if self.request.user.role == 'registrar':
            return Issue.objects.all()
        elif self.request.user.role == 'student':
            return Issue.objects.filter(student__user=self.request.user)
        return Issue.objects.none()

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response({'message': 'Issue deleted successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    try:
        print(f"Fetching notifications for user: {request.user.username}")
        notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')
        print(f"Found {notifications.count()} notifications")
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"Error in get_notifications: {str(e)}")
        return Response(
            {'error': 'Failed to fetch notifications', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
        notification.is_read = True
        notification.save()
        return Response({'status': 'success'})
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error in mark_notification_read: {str(e)}")
        return Response(
            {'error': 'Failed to mark notification as read', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    try:
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'count': count})
    except Exception as e:
        print(f"Error in get_unread_count: {str(e)}")
        return Response(
            {'error': 'Failed to fetch unread count', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
        notification.delete()
        return Response({'status': 'success'})
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Failed to delete notification', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_all_notifications(request):
    try:
        Notification.objects.filter(recipient=request.user).delete()
        return Response({'status': 'success'})
    except Exception as e:
        return Response(
            {'error': 'Failed to clear notifications', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def create_notification(recipient, notification_type, issue, message):
    """
    Helper function to create notifications
    """
    try:
        notification = Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            issue=issue,
            message=message
        )
        print(f"Created notification: {notification.id} for user: {recipient.username}")
        return notification
    except Exception as e:
        print(f"Error creating notification: {str(e)}")
        return None

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_issue(request):
    try:
        # ... existing issue creation code ...

        # Create notification for assigned lecturer
        if Issue.assigned_to:
            create_notification(
                recipient=Issue.assigned_to.user,
                notification_type='issue_assigned',
                issue=Issue,
                message=f'You have been assigned a new issue: {Issue.title}'
            )

        return Response(Issue.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_issue(request, issue_id):
    try:
        issue = Issue.objects.get(pk=issue_id)
        old_status = issue.status
        old_assigned_to = issue.assigned_to

        # ... existing issue update code ...

        # Create notifications for status changes
        if old_status != issue.status:
            if issue.status == 'resolved':
                create_notification(
                    recipient=issue.student.user,
                    notification_type='issue_resolved',
                    issue=issue,
                    message=f'Your issue "{issue.title}" has been resolved'
                )

        # Create notifications for assignment changes
        if old_assigned_to != issue.assigned_to and issue.assigned_to:
            create_notification(
                recipient=issue.assigned_to.user,
                notification_type='issue_assigned',
                issue=issue,
                message=f'You have been assigned to issue: {issue.title}'
            )

        return Response(serializers.data)
    except Issue.DoesNotExist:
        return Response({'error': 'Issue not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StudentListView(generics.ListAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsAcademicRegistrar | IsLecturer]
    
    def get_queryset(self):
        try:
            print(f"\n=== StudentListView.get_queryset ===")
            print(f"User: {self.request.user}")
            print(f"Role: {self.request.user.role}")
            
            # Start with all students
            queryset = Student.objects.all().select_related('user', 'department')
            
            # If user is a lecturer, filter by their college
            if self.request.user.role == 'lecturer':
                lecturer = self.request.user.lecturer_profile
                lecturer_college = lecturer.department.faculty
                queryset = queryset.filter(college=lecturer_college)
                print(f"Filtered by lecturer's college: {lecturer_college}")
            
            # Apply additional filters from query parameters
            college = self.request.query_params.get('college', None)
            if college and college != 'All Colleges':
                queryset = queryset.filter(college=college)
                print(f"After college filter ({college}): {queryset.count()}")
                
            # Filter by department if provided
            department = self.request.query_params.get('department', None)
            if department and department != 'All Departments':
                queryset = queryset.filter(department__name=department)
                print(f"After department filter ({department}): {queryset.count()}")
                
            # Filter by year if provided
            year = self.request.query_params.get('year', None)
            if year and year != 'All Years':
                queryset = queryset.filter(year_of_study=year)
                print(f"After year filter ({year}): {queryset.count()}")
            
            return queryset
            
        except Exception as e:
            print(f"Error in StudentListView.get_queryset: {str(e)}")
            print(f"Request user: {self.request.user}, Role: {self.request.user.role}")
            raise

    def list(self, request, *args, **kwargs):
        try:
            print(f"\n=== StudentListView.list ===")
            print(f"User: {request.user}")
            print(f"Query params: {request.query_params}")
            
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Error in StudentListView.list: {str(e)}")
            print(f"Request user: {request.user}")
            print(f"Query params: {request.query_params}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LecturerListView(generics.ListAPIView):
    serializer_class = LecturerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Lecturer.objects.all().select_related('user', 'department')
        
        # Filter by department if provided
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department__name=department)
            
        return queryset

class LecturerUpdateView(generics.UpdateAPIView):
    serializer_class = LecturerSerializer
    permission_classes = [IsAuthenticated, IsAcademicRegistrar]
    queryset = Lecturer.objects.all()

    def perform_update(self, serializer):
        lecturer = serializer.save()
        # Create notification for the lecturer
        Notification.objects.create(
            recipient=lecturer.user,
            notification_type='profile_updated',
            message=f'Your profile has been updated by {self.request.user.get_full_name()}'
        )

class LecturerDeleteView(generics.DestroyAPIView):
    serializer_class = LecturerSerializer
    permission_classes = [IsAuthenticated, IsAcademicRegistrar]
    queryset = Lecturer.objects.all()

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        user.delete()  # Delete the associated user account as well