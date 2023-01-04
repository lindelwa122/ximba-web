from json import loads

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.utils.timezone import localtime

from .models import *
from .utils import *


@login_required(login_url='/login')
def index(request):
    return render(request, 'invite/index.html')


def confirm_email(request):
    if request.method == 'POST':
        data = loads(request.body)
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

        login(request, user)

        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/confirm_email.html')


def login_view(request):
    if request.method == 'POST':
        data = loads(request.body)

        user = authenticate(request, username=data.get(
            'username', ''), password=data.get('password', '')
        )

        if user is None:
            return JsonResponse({'message': 'Username/Password is incorrect. Try resetting your password.'}, status=403)

        login(request, user)
        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/login.html')


def new_password(request, username, access):
    if request.method == 'POST':
        data = loads(request.body)
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

        user = User.objects.get(username=username)
        user.set_password(password)
        user.reset_password = generate_hash(20)
        user.save()

        return JsonResponse({}, status=200)

    else:
        if User.objects.get(username=username).reset_password != access:
            return HttpResponse('<h1>Broken Link</h1>')
        return render(request, 'invite/new_password.html')


def register_view(request):
    if request.method == 'POST':
        data = loads(request.body)
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

        if User.objects.filter(email=data.get('email', '')).exists():
            return JsonResponse({'message': 'This email is already registered. Try logging in.'}, status=409)

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

        confirm_account_code = User.objects.get(username=username).email_code

        send_mail(
            'Welcome to GetVyt',
            f'Hello, {username}. Use this code: {confirm_account_code} to confirm your email.',
            'portfolio@livingdreams.com',
            [data.get('email', '')],
            fail_silently=False,
        )

        request.session['username'] = username

        Profile.objects.create(user=User.objects.get(username=username))

        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/register.html')


def reset_password(request):
    return render(request, 'invite/reset_password.html')


def profile(request, username):
    return render(request, 'invite/profile.html')
    

def edit_profile(request):
    if request.method == 'POST':
        data = loads(request.body)
        email = data.get('email', '')

        try:
            user = User.objects.get(email=email)
        except ObjectDoesNotExist:
            return JsonResponse({'message': 'Email is not found in our database'}, status=404)

        user.reset_password = generate_hash(20)
        user.save()

        reset_password = User.objects.get(email=email).reset_password

        send_mail(
            'Reset Password',
            f'Click here: https://getvyt-web-production.up.railway.app/new_password/{user.username}/{reset_password} to reset your password.',
            'portfolio@livingdreams.com',
            [email],
            fail_silently=False,
        )

        return JsonResponse({'message': 'A link has been sent to your email, use it to reset your password'}, status=400)

    else:
        return render(request, 'invite/reset_password.html')


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('invite:index'))


def main(request):
    return render(request, 'invite/main.html')


def get_profile_count(request):
    if request.user.is_authenticated:
        friends = Friend.objects.filter(user=request.user).count()
        following = Following.objects.filter(user=request.user).count()
        followers = Following.objects.filter(following=request.user).count()

        return JsonResponse({'friendsCount': friends, 'followingCount': following, 'followersCount': followers}, status=200)

    else:
        return JsonResponse({'message': 'User not authenticated.'}, status=403)


def get_user_bio(request):
    if request.user.is_authenticated:
        return JsonResponse({'bio': Profile.objects.get(user=request.user).bio}, status=200)

    else:
        return JsonResponse({'message': 'User is not authenticated'}, status=403)


def get_user_profile_image(request):
    if request.user.is_authenticated:
        return JsonResponse({'bio': Profile.objects.get(user=request.user).profile_img}, status=200)

    else:
        return JsonResponse({'message': 'User is not authenticated'}, status=403)
