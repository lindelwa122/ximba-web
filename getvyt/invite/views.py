from django.shortcuts import render

# Create your views here.
def reset_password(request):
    # Your code goes here

    return render(request, 'invite/reset_password.html')

def new_password(request):
    # Your code goes here

    return render(request, 'invite/new_password.html')