import json
from django.http import JsonResponse
from django.shortcuts import render
from django.db import IntegrityError
from datetime import datetime

from .utils import *
from .models import *

# Create your views here.


def index(request):
    return render(request, 'invite/index.html')


def confirm_email(request):
    return render(request, 'invite/confirm_email.html')


def login_view(request):
    return render(request, 'invite/login.html')


def new_password(request):
    return render(request, 'invite/new_password.html')


def register_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        password = data.get('password', '')

        # Ensure form data is not empty
        for val in data.values():
            if not val:
                return JsonResponse({'message': 'No input field must be empty'}, status=400)

        # Validate password
        if not (check_upper(password) and check_lower(password) and check_digit(password)):
            return JsonResponse({'message': 'Password is invalid'}, status=400)

        # Ensure that password is the same as confirm-password
        if password != data.get('confirm-password', ''):
            return JsonResponse({'message': 'Password must match with confirm password'}, status=400)

        try:
            user = User.objects.create_user(
                first_name=data.get('firstname', '').capitalize(),
                last_name=data.get('lastname', '').capitalize(),
                username=data.get('username', '').lower(),
                email=data.get('email', ''),
                password=password,
                email_code=generate_code(),
                code_generation_date=datetime.now(),
            )
            user.save()

        except IntegrityError:
            return JsonResponse({'message': 'Username is already taken. Try a different one'}, status=409)

        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/register.html')


def reset_password(request):
    return render(request, 'invite/reset_password.html')
