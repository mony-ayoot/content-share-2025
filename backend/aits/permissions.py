from rest_framework import permissions
from .models import Issue, Lecturer, Student, AcademicRegistrar, Department


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'student')

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Issue):
            return obj.student.user == request.user
        return False

class IsLecturer(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'lecturer')

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Issue):
            lecturer = Lecturer.objects.get(user=request.user)
            return obj.assigned_to == lecturer
        return False

class IsAcademicRegistrar(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'registrar')

    def has_object_permission(self, request, view, obj):
        return True