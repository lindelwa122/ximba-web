import json
from django.http import JsonResponse
from django.shortcuts import render

# Create your views here.


def index(request):
    return render(request, 'invite/index.html')


def confirm_email(request):
    return render(request, 'invite/confirm_email.html')


def login_view(request):
    return render(request, 'invite/login.html')


def new_password(request):
    return render(request, 'invite/new_password.html')

def check_upper(str):
    for char in str:
        if char.isupper():
            return True

    return False

def check_lower(str):
    for char in str:
        if char.islower():
            return True

    return False

def check_digit(str):
    for char in str:
        if char.isdigit():
            return True

    return False

def register_view(request):
    if request.method == 'POST':
        data = json.load(request.body)
        password = data.get('password', '')

        # Ensure firstname is not empty
        if not data.get('firstname', ''):
            return JsonResponse({'message': 'First name is required'}, status=204) 

        # Ensure lastname is not empty
        if not data.get('lastname', ''):
            return JsonResponse({'message': 'Last name is required'}, status=204) 

        # Ensure username is not empty
        if not data.get('username', ''):
            return JsonResponse({'message': 'Username name is required'}, status=204) 

        # Ensure email is not empty
        if not data.get('email', ''):
             return JsonResponse({'message': 'Email name is required'}, status=204) 

        # Ensure password is not empty
        if not password:
             return JsonResponse({'message': 'Password name is required'}, status=204) 

        # Ensure confirm-email is not empty
        if not data.get('confirm-email', ''):
             return JsonResponse({'message': 'You have to confirm your email'}, status=204) 

        # Validate password
        if not (check_upper(password) and check_lower(password) and check_digit(password)):
            return JsonResponse({'message': 'Password is invalid'}, status=204)


        return JsonResponse({'message': 'Congrats, your account has been made'}, status=200)

    else:
        return render(request, 'invite/register.html')


def reset_password(request):
    return render(request, 'invite/reset_password.html')