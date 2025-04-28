from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('lecturer', 'Lecturer'),
        ('registrar', 'Registrar'),
    )
    
    COLLEGE_CHOICES = (
        ('College of Computing', 'College of Computing'),
        ('College Of Humanity And Social Sciences', 'College Of Humanity And Social Sciences'),
        ('College Of Engineering', 'College Of Engineering'),
        ('College Of Education', 'College Of Education'),
    )
    
    DEPARTMENT_CHOICES = (
        ('Department of Computer Science', 'Department of Computer Science'),
        ('Department Of Software Engineering', 'Department Of Software Engineering'),
        ('Department of Library And Information System', 'Department of Library And Information System'),
        ('Department Of Information Technology', 'Department Of Information Technology'),
    )
    
    COURSE_CHOICES = (
        ('Computer Science', 'Computer Science'),
        ('Software Engineering', 'Software Engineering'),
        ('Library and Information', 'Library and Information'),
        ('Information Technology', 'Information Technology'),
    )
    
    YEAR_CHOICES = (
        ('First Year', 'First Year'),
        ('Second Year', 'Second Year'),
        ('Third Year', 'Third Year'),
    )
    
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    user_id = models.CharField(max_length=50, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    
    # Student-specific fields
    college = models.CharField(max_length=255, choices=COLLEGE_CHOICES, blank=True, null=True)
    department = models.CharField(max_length=255, choices=DEPARTMENT_CHOICES, blank=True, null=True)
    year_of_study = models.CharField(max_length=50, choices=YEAR_CHOICES, blank=True, null=True)
    course = models.CharField(max_length=255, choices=COURSE_CHOICES, blank=True, null=True)
    
    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name', 'user_id', 'role']
    
    def __str__(self):
        return self.email 