from django.urls import path
from .views import (
    LoginView, 
    RegisterView, 
    StudentIssueCreateView,
    StudentIssueDetailView,
    StudentListView,
    LecturerIssueListView,
    LecturerIssueDetailView,
    LecturerListView,
    LecturerUpdateView,
    LecturerDeleteView,
    IssueUpdateView,
    IssueDeleteView,
    AcademicRegistrarIssueListView,
    AcademicRegistrarIssueDetailView,
    get_notifications,
    mark_notification_read,
    delete_notification,
    clear_all_notifications
)
from . import views

urlpatterns = [
    # Auth routes
    path('login', LoginView.as_view(), name='login'),
    path('register', RegisterView.as_view(), name='register'),
    
    # Student routes
    path('students', StudentListView.as_view(), name='student-list'),
    path('students/', StudentListView.as_view(), name='student-list-slash'),
    
    # Lecturer routes
    path('lecturers', LecturerListView.as_view(), name='lecturer-list'),
    path('lecturers/', LecturerListView.as_view(), name='lecturer-list-slash'),
    path('lecturers/<int:pk>', LecturerUpdateView.as_view(), name='lecturer-update'),
    path('lecturers/<int:pk>/delete', LecturerDeleteView.as_view(), name='lecturer-delete'),
    path('lecturer/issues', LecturerIssueListView.as_view(), name='lecturer-issues'),
    path('lecturer/issues/', LecturerIssueListView.as_view(), name='lecturer-issues-slash'),
    path('lecturer/issues/<int:pk>', LecturerIssueDetailView.as_view(), name='lecturer-issue-detail'),
    path('lecturer/issues/<int:pk>/', LecturerIssueDetailView.as_view(), name='lecturer-issue-detail-slash'),
    
    # Issue routes
    path('issues/<int:pk>', StudentIssueDetailView.as_view(), name='issue-detail'),
    path('issues/<int:pk>/', StudentIssueDetailView.as_view(), name='issue-detail-slash'),
    path('student/issues', StudentIssueCreateView.as_view(), name='student-issues'),
    path('student/issues/<int:pk>', StudentIssueDetailView.as_view(), name='student-issue-detail'),
    path('issues/<int:pk>/update', IssueUpdateView.as_view(), name='issue-update'),
    path('issues/<int:pk>/delete', IssueDeleteView.as_view(), name='issue-delete'),
    path('registrar/issues', AcademicRegistrarIssueListView.as_view(), name='registrar-issues'),
    path('registrar/issues/<int:pk>', AcademicRegistrarIssueDetailView.as_view(), name='registrar-issue-detail'),
    path('registrar/issues/<int:pk>/', AcademicRegistrarIssueDetailView.as_view(), name='registrar-issue-detail-slash'),
    
    # Notification routes
    path('notifications', get_notifications, name='get-notifications'),
    path('notifications/', get_notifications, name='get-notifications-slash'),
    path('notifications/<int:notification_id>/mark-read', mark_notification_read, name='mark-notification-read'),
    path('notifications/<int:notification_id>/mark-read/', mark_notification_read, name='mark-notification-read-slash'),
    path('notifications/unread-count', views.get_unread_count, name='notification-unread-count'),
    path('notifications/unread-count/', views.get_unread_count, name='notification-unread-count-slash'),
    path('notifications/<int:notification_id>/delete', delete_notification, name='delete-notification'),
    path('notifications/clear-all', clear_all_notifications, name='clear-all-notifications'),
    path('notifications/<int:notification_id>/delete/', delete_notification, name='delete-notification-slash'),
    path('notifications/clear-all/', clear_all_notifications, name='clear-all-notifications-slash'),
    
    # Keep other existing routes...
    path('login/', LoginView.as_view(), name='login-slash'),
    path('register/', RegisterView.as_view(), name='register-slash'),
    path('student/issues/', StudentIssueCreateView.as_view(), name='student-issues-slash'),
    path('student/issues/<int:pk>/', StudentIssueDetailView.as_view(), name='student-issue-detail-slash'),
]