from django.contrib import admin
from .models import User, Department, Lecturer, Student, AcademicRegistrar, Issue, Notification
# Register your models here


admin.site.register(User)
admin.site.register(Lecturer)
admin.site.register(Student)
admin.site.register(AcademicRegistrar)
admin.site.register(Issue)
admin.site.register(Notification)