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


def register_view(request):
    return render(request, 'invite/register.html')


def reset_password(request):
    return render(request, 'invite/reset_password.html')


def profile(request):
    return render(request, 'invite/profile.html')
    

def edit_profile(request):
    return render(request, 'invite/edit_profile.html')