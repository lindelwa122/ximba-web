from django.shortcuts import render

# Create your views here.
def index(request):
    return render(request, 'invite/index.html')
    
def register_view(request):
    # Your code goes here

    return render(request, 'invite/reset_password.html')

def new_password(request):
    # Your code goes here

    return render(request, 'invite/confirm_email.html')
