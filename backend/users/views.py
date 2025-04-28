from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from aits.models import User, Student, Lecturer, AcademicRegistrar, Department
import traceback

# Map departments to their faculties
DEPARTMENT_FACULTY_MAP = {
    'Department of Computer Science': 'College of Computing',
    'Department Of Software Engineering': 'College of Computing',
    'Department of Library And Information System': 'College Of Humanity And Social Sciences',
    'Department Of Information Technology': 'College of Computing'
}

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    print("\n=== Registration Request ===")
    print("Received data:", data)
    
    role = data.get('role')
    
    # For lecturer registration, map the fields to match backend expectations
    if role == 'lecturer':
        required_fields = ['fullName', 'email', 'userId', 'password', 'confirmPassword']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print("Missing required fields:", missing_fields)
            return Response(
                {'errors': {field: 'This field is required.' for field in missing_fields}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Transform the data to match the legacy format
        name_parts = data['fullName'].split(' ', 1)
        transformed_data = {
            'username': data['userId'],
            'email': data['email'],
            'password': data['password'],
            'role': 'lecturer',
            'first_name': name_parts[0],
            'last_name': name_parts[1] if len(name_parts) > 1 else '',
            'lecturer_data': data.get('lecturer_data', {})
        }
        data = transformed_data
    else:
        # For other roles, check legacy required fields
        required_fields = ['username', 'email', 'password', 'role', 'first_name', 'last_name']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print("Missing required fields:", missing_fields)
            return Response(
                {'errors': {field: 'This field is required.' for field in missing_fields}},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Validate role
    if data['role'] not in dict(User.ROLES):
        print("Invalid role:", data['role'])
        print("Valid roles:", dict(User.ROLES))
        return Response(
            {'errors': {'role': f'Invalid role. Must be one of: {", ".join(dict(User.ROLES).keys())}'}},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if email already exists
    if User.objects.filter(email=data['email']).exists():
        print("Email already exists:", data['email'])
        return Response(
            {'errors': {'email': 'Email already exists.'}}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if username already exists
    if User.objects.filter(username=data['username']).exists():
        print("Username already exists:", data['username'])
        return Response(
            {'errors': {'username': 'Username already exists.'}}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        print("\n=== Creating Base User ===")
        # Create base user
        user = User.objects.create(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data['role'],
            password=make_password(data['password'])
        )
        print("Base user created successfully:", user.username)
        
        # Handle role-specific data
        if data['role'] == 'lecturer' and 'lecturer_data' in data:
            lecturer_data = data['lecturer_data']
            print("\n=== Processing Lecturer Data ===")
            print("Lecturer data:", lecturer_data)
            
            # Get or create department
            department_name = lecturer_data['department']
            print("\nProcessing department:", department_name)
            print("Department faculty map:", DEPARTMENT_FACULTY_MAP)
            
            faculty = DEPARTMENT_FACULTY_MAP.get(department_name)
            if not faculty:
                raise ValueError(f"Invalid department: {department_name}")
                
            department, created = Department.objects.get_or_create(
                name=department_name,
                defaults={'faculty': faculty}
            )
            print(f"Department {'created' if created else 'retrieved'}:", department.name)
            
            print("\nCreating lecturer profile...")
            lecturer = Lecturer.objects.create(
                user=user,
                department=department
            )
            print("Lecturer profile created successfully")
            
            # Return lecturer-specific response
            return Response({
                'message': 'Registration successful',
                'user': {
                    'userId': user.username,
                    'fullName': f"{user.first_name} {user.last_name}".strip(),
                    'email': user.email,
                    'role': user.role
                }
            }, status=status.HTTP_201_CREATED)
            
        elif data['role'] == 'student' and 'student_data' in data:
            student_data = data['student_data']
            print("\n=== Processing Student Data ===")
            print("Student data:", student_data)
            
            # Validate student-specific fields
            print("\nValidating student fields:")
            print("College choices:", dict(Student.COLLEGE_CHOICES))
            print("Course choices:", dict(Student.COURSE_CHOICES))
            print("Year choices:", dict(Student.YEAR_CHOICES))
            
            if not student_data.get('college') in dict(Student.COLLEGE_CHOICES):
                raise ValueError(f"Invalid college. Must be one of: {', '.join(dict(Student.COLLEGE_CHOICES).keys())}")
            if not student_data.get('course') in dict(Student.COURSE_CHOICES):
                raise ValueError(f"Invalid course. Must be one of: {', '.join(dict(Student.COURSE_CHOICES).keys())}")
            if not student_data.get('year_of_study') in dict(Student.YEAR_CHOICES):
                raise ValueError(f"Invalid year of study. Must be one of: {', '.join(dict(Student.YEAR_CHOICES).keys())}")
            
            # Get or create department
            department_name = student_data['department']
            print("\nProcessing department:", department_name)
            print("Department faculty map:", DEPARTMENT_FACULTY_MAP)
            
            faculty = DEPARTMENT_FACULTY_MAP.get(department_name)
            if not faculty:
                raise ValueError(f"Invalid department: {department_name}")
                
            department, created = Department.objects.get_or_create(
                name=department_name,
                defaults={'faculty': faculty}
            )
            print(f"Department {'created' if created else 'retrieved'}:", department.name)
            
            print("\nCreating student profile...")
            Student.objects.create(
                user=user,
                college=student_data['college'],
                department=department,
                year_of_study=student_data['year_of_study'],
                course=student_data['course']
            )
            print("Student profile created successfully")
            
        elif data['role'] == 'registrar' and 'registrar_data' in data:
            registrar_data = data['registrar_data']
            print("\n=== Processing Registrar Data ===")
            print("Registrar data:", registrar_data)
            
            # Validate registrar-specific fields
            print("\nValidating registrar fields:")
            print("College choices:", dict(AcademicRegistrar.COLLEGE_CHOICES))
            
            if not registrar_data.get('college') in dict(AcademicRegistrar.COLLEGE_CHOICES):
                raise ValueError(f"Invalid college. Must be one of: {', '.join(dict(AcademicRegistrar.COLLEGE_CHOICES).keys())}")
            
            # Get or create department
            department_name = registrar_data['department']
            print("\nProcessing department:", department_name)
            print("Department faculty map:", DEPARTMENT_FACULTY_MAP)
            
            faculty = DEPARTMENT_FACULTY_MAP.get(department_name)
            if not faculty:
                raise ValueError(f"Invalid department: {department_name}")
                
            department, created = Department.objects.get_or_create(
                name=department_name,
                defaults={'faculty': faculty}
            )
            print(f"Department {'created' if created else 'retrieved'}:", department.name)
            
            print("\nCreating registrar profile...")
            AcademicRegistrar.objects.create(
                user=user,
                college=registrar_data['college'],
                department=department
            )
            print("Registrar profile created successfully")
        
        print("\n=== Registration Successful ===")
        return Response(
            {'message': 'User registered successfully.'}, 
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        print("\n=== Registration Error ===")
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        try:
            # If any error occurs during user creation, delete the user if it was created
            if 'user' in locals():
                user.delete()
        except Exception:
            pass
        return Response(
            {'errors': {'general': str(e)}}, 
            status=status.HTTP_400_BAD_REQUEST
        )