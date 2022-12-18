import json
from django.core.mail import send_mail
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import authenticate, login
from django.db import IntegrityError
from django.utils.timezone import localtime

from .utils import *
from .models import *

# Create your views here.


def index(request):
    return render(request, 'invite/index.html')


def confirm_email(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user = User.objects.get(username=request.session['username'])

        if int(data.get('code', '')) != user.email_code:
            return JsonResponse({'message': 'Your code is incorrect. Try checking your emails again.'}, status=400)

        if (localtime() - user.code_generation_date).seconds > 916:
            user.email_code = generate_code()
            user.code_generation_date = localtime()
            user.save()
            send_mail(
                'Welcome to GetVyt',
                f'Hello, {user.username}. Use this code: {user.email_code} to confirm your email.',
                'portfolio@livingdreams.com',
                [user.email],
                fail_silently=False,
            )
            return JsonResponse({'message': 'The code has expired. A new code has been sent to your emails.'}, status=400)

        user.is_email_confirmed = True
        user.save()

        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/confirm_email.html')


def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        user = authenticate(request, username=data.get('username', ''), password=data.get('password', ''))

        if user is None:
            return JsonResponse({'message': 'Username/Password is incorrect. Try resetting your password.'}, status=403)
            
        login(request, user)
        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/login.html')


def new_password(request):
    return render(request, 'invite/new_password.html')


def register_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        password = data.get('password', '')
        username = data.get('username', '')

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
                code_generation_date=localtime(),
            )
            user.save()

        except IntegrityError:
            return JsonResponse({'message': 'Username is already taken. Try a different one'}, status=409)

        send_mail(
            'Welcome to GetVyt',
            f'Hello, {username}. Use this code: {User.objects.get(username=username).email_code} to confirm your email.',
            'portfolio@livingdreams.com',
            [data.get('email', '')],
            fail_silently=False,
        )

        request.session['username'] = username

        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/register.html')


def reset_password(request):
    return render(request, 'invite/reset_password.html')
