from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLES = (
        ('student', 'Student'),
        ('lecturer', 'Lecturer'),
        ('registrar', 'Academic Registrar'),
    )
    role = models.CharField(max_length=10, choices=ROLES, default='student')
    email = models.EmailField(unique=True)

    # Add unique related_name to avoid clashes
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='aits_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='aits_user_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return self.username


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    faculty = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Lecturer(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='lecturer_profile'
    )
    department = models.ForeignKey(
        Department, 
        on_delete=models.CASCADE, 
        related_name='lecturers'
    )

    def __str__(self):
        return self.user.get_full_name()


class Student(models.Model):
    COLLEGE_CHOICES = (
        ('College of Computing', 'College of Computing'),
        ('College Of Humanity And Social Sciences', 'College Of Humanity And Social Sciences'),
        ('College Of Engineering', 'College Of Engineering'),
        ('College Of Education', 'College Of Education'),
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
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='student_profile'
    )
    college = models.CharField(
        max_length=100, 
        choices=COLLEGE_CHOICES
    )
    department = models.ForeignKey(
        Department, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='students'
    )
    year_of_study = models.CharField(
        max_length=20, 
        choices=YEAR_CHOICES
    )
    course = models.CharField(
        max_length=100, 
        choices=COURSE_CHOICES
    )

    

    def __str__(self):
        return self.user.get_full_name()


class AcademicRegistrar(models.Model):
    COLLEGE_CHOICES = (
        ('College of Computing', 'College of Computing'),
        ('College Of Humanity And Social Sciences', 'College Of Humanity And Social Sciences'),
        ('College Of Engineering', 'College Of Engineering'),
        ('College Of Education', 'College Of Education'),
    )
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='registrar_profile'
    )
    college = models.CharField(
        max_length=100, 
        choices=COLLEGE_CHOICES
    )
    department = models.ForeignKey(
        Department, 
        on_delete=models.CASCADE, 
        related_name='registrars'
    )

    def __str__(self):
        return self.user.get_full_name()


class Issue(models.Model):
    CATEGORIES = (
        ('academic', 'Academic Issues'),
        ('technical', 'Technical Issues'),
        ('administrative', 'Administrative Issues'),
        ('examination', 'Examination Issues'),
        ('registration', 'Registration Issues'),
        ('other', 'Other Issues'),
    )
    STATUSES = (
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    )
    PRIORITIES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    COURSE_UNITS = (
        ('CSC1100', 'CSC1100 - Programming Fundamentals'),
        ('CSC1200', 'CSC1200 - Data Structures'),
        ('CSC2100', 'CSC2100 - Database Systems'),
        ('CSC2200', 'CSC2200 - Web Development'),
        ('CSC3100', 'CSC3100 - Software Engineering'),
    )
    YEAR_CHOICES = (
        ('1', 'First Year'),
        ('2', 'Second Year'),
        ('3', 'Third Year'),
    )
    SEMESTER_CHOICES = (
        ('1', 'Semester 1'),
        ('2', 'Semester 2'),
    )
    
    issue_id = models.AutoField(primary_key=True, serialize=False)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORIES)
    description = models.TextField()
    status = models.CharField(
        max_length=20, 
        choices=STATUSES, 
        default='open'
    )
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITIES, 
        default='medium'
    )
    courseUnit = models.CharField(
        max_length=10,
        choices=COURSE_UNITS,
        null=True,
        blank=True
    )
    yearOfStudy = models.CharField(
        max_length=1,
        choices=YEAR_CHOICES,
        null=True,
        blank=True
    )
    semester = models.CharField(
        max_length=1,
        choices=SEMESTER_CHOICES,
        null=True,
        blank=True
    )
    attachment = models.FileField(
        upload_to='issue_attachments/%Y/%m/%d/',
        null=True,
        blank=True
    )
    student = models.ForeignKey(
        Student, 
        on_delete=models.CASCADE, 
        related_name='issues'
    )
    assigned_to = models.ForeignKey(
        Lecturer, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_issues'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.priority:
            self.priority = self.get_priority_for_category()
        super().save(*args, **kwargs)

    def get_priority_for_category(self):
        priority_map = {
            'academic': 'high',
            'examination': 'high',
            'technical': 'medium',
            'administrative': 'medium',
            'registration': 'medium',
            'other': 'low',
        }
        return priority_map.get(self.category, 'low')

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('issue_created', 'New Issue Created'),
        ('issue_updated', 'Issue Updated'),
        ('issue_resolved', 'Issue Resolved'),
        ('issue_assigned', 'Issue Assigned'),
        ('comment_added', 'New Comment Added'),
    )

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.notification_type} for {self.recipient.username}"