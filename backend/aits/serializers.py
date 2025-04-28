from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password

from .models import User, Department, Lecturer, Student, AcademicRegistrar, Issue, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name']

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'faculty']

class LecturerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    lecturerId = serializers.CharField(source='user.username')
    fullName = serializers.SerializerMethodField()
    email = serializers.CharField(source='user.email')

    class Meta:
        model = Lecturer
        fields = ['id', 'lecturerId', 'fullName', 'email', 'department', 'user']

    def get_fullName(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    studentNumber = serializers.CharField(source='user.username')
    fullName = serializers.SerializerMethodField()
    email = serializers.CharField(source='user.email')
    yearOfStudy = serializers.CharField(source='year_of_study')

    class Meta:
        model = Student
        fields = ['id', 'studentNumber', 'fullName', 'email', 'college', 'department', 'yearOfStudy', 'course', 'user']

    def get_fullName(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()

class AcademicRegistrarSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicRegistrar
        fields = ['id', 'user']

class IssueSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    assigned_to = LecturerSerializer(read_only=True)

    class Meta:
        model = Issue
        fields = [
            'issue_id', 
            'title',
            'category', 
            'description', 
            'status', 
            'priority',
            'courseUnit',
            'yearOfStudy',
            'semester',
            'student_name',  # Changed from full student object to just name
            'assigned_to', 
            'created_at', 
            'updated_at'
        ]

    def get_student_name(self, obj):
        return obj.student.user.get_full_name() if obj.student else None

class NotificationSerializer(serializers.ModelSerializer):
    issue = IssueSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient',
            'notification_type',
            'issue',
            'message',
            'is_read',
            'created_at'
        ]
        read_only_fields = ['created_at']

class LoginSerializer(serializers.Serializer):
    userId = serializers.CharField()
    password = serializers.CharField()
    role = serializers.CharField()

    def validate(self, data):
        userId = data.get('userId')
        password = data.get('password')
        role = data.get('role')

        if not all([userId, password, role]):
            raise serializers.ValidationError("All fields are required.")

        try:
            user = User.objects.get(username=userId, role=role)
            if not check_password(password, user.password):
                raise serializers.ValidationError("Invalid credentials")
            data['user'] = user
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")

        return data

class StudentRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    student_data = serializers.DictField()
    
    def validate(self, data):
        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "This email is already registered"})
        
        # Check if username already exists
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "This username is already taken"})
            
        # Validate student data
        student_data = data.get('student_data', {})
        required_fields = ['college', 'department', 'year_of_study', 'course']
        for field in required_fields:
            if field not in student_data:
                raise serializers.ValidationError({f"student_data.{field}": f"{field} is required"})
            
        return data
    
    def create(self, validated_data):
        try:
            # Extract student data
            student_data = validated_data.pop('student_data')
            
            # Create User instance
            user = User.objects.create(
                username=validated_data['username'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                role='student',
                password=make_password(validated_data['password'])
            )
            
            # Get or create Department instance
            department_name = student_data['department']
            try:
                department = Department.objects.get(name=department_name)
            except Department.DoesNotExist:
                # If department doesn't exist, create it with appropriate faculty
                faculty = "Faculty of Computing"  # Default faculty for computing departments
                department = Department.objects.create(
                    name=department_name,
                    faculty=faculty
                )
            
            # Create Student instance with additional data
            student = Student.objects.create(
                user=user,
                college=student_data['college'],
                department=department,
                year_of_study=student_data['year_of_study'],
                course=student_data['course']
            )
            return student
        except Exception as e:
            # If any error occurs during user creation, delete the user if it was created
            if 'user' in locals():
                user.delete()
            raise serializers.ValidationError(str(e))

class LecturerRegistrationSerializer(serializers.Serializer):
    fullName = serializers.CharField()
    email = serializers.EmailField()
    userId = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirmPassword = serializers.CharField(write_only=True)
    lecturer_data = serializers.DictField()
    
    def validate(self, data):
        if data['password'] != data['confirmPassword']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        
        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "This email is already registered"})
        
        # Check if userId already exists
        if User.objects.filter(username=data['userId']).exists():
            raise serializers.ValidationError({"userId": "This User ID is already taken"})
            
        # Validate lecturer data
        lecturer_data = data.get('lecturer_data', {})
        if 'department' not in lecturer_data:
            raise serializers.ValidationError({"lecturer_data": "department is required"})
            
        return data
    
    def create(self, validated_data):
        try:
            # Remove confirmPassword from the data
            validated_data.pop('confirmPassword')
            
            # Extract lecturer data
            lecturer_data = validated_data.pop('lecturer_data')
            
            # Split fullName into first_name and last_name
            full_name_parts = validated_data.pop('fullName').split(' ', 1)
            first_name = full_name_parts[0]
            last_name = full_name_parts[1] if len(full_name_parts) > 1 else ''
            
            # Create User instance
            user = User.objects.create(
                username=validated_data['userId'],
                email=validated_data['email'],
                first_name=first_name,
                last_name=last_name,
                role='lecturer',
                password=make_password(validated_data['password'])
            )
            
            # Get or create Department instance
            department_name = lecturer_data['department']
            try:
                department = Department.objects.get(name=department_name)
            except Department.DoesNotExist:
                # If department doesn't exist, create it with appropriate faculty
                faculty = "Faculty of Computing"  # Default faculty for computing departments
                department = Department.objects.create(
                    name=department_name,
                    faculty=faculty
                )
            
            # Create Lecturer instance with department
            lecturer = Lecturer.objects.create(
                user=user,
                department=department
            )
            return lecturer
        except Exception as e:
            # If any error occurs during user creation, delete the user if it was created
            if 'user' in locals():
                user.delete()
            raise serializers.ValidationError(str(e))

class RegistrarRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    registrar_data = serializers.DictField()
    
    def validate(self, data):
        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "This email is already registered"})
        
        # Check if username already exists
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "This username is already taken"})
            
        # Validate registrar data
        registrar_data = data.get('registrar_data', {})
        required_fields = ['college', 'department']
        for field in required_fields:
            if field not in registrar_data:
                raise serializers.ValidationError({f"registrar_data.{field}": f"{field} is required"})
            
        return data
    
    def create(self, validated_data):
        try:
            # Extract registrar data
            registrar_data = validated_data.pop('registrar_data')
            
            # Create User instance
            user = User.objects.create(
                username=validated_data['username'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                role='registrar',
                password=make_password(validated_data['password'])
            )
            
            # Get or create Department instance
            department_name = registrar_data['department']
            try:
                department = Department.objects.get(name=department_name)
            except Department.DoesNotExist:
                # If department doesn't exist, create it with appropriate faculty
                faculty = "Faculty of Computing"  # Default faculty for computing departments
                department = Department.objects.create(
                    name=department_name,
                    faculty=faculty
                )
            
            # Create AcademicRegistrar instance with additional data
            registrar = AcademicRegistrar.objects.create(
                user=user,
                college=registrar_data['college'],
                department=department
            )
            return registrar
        except Exception as e:
            # If any error occurs during user creation, delete the user if it was created
            if 'user' in locals():
                user.delete()
            raise serializers.ValidationError(str(e))
