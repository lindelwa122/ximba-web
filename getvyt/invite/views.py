from django.shortcuts import render

# Create your views here.
def register_view(request):
    # Your code goes here

    return render(request, 'invite/register.html')

def confirm_email(request):
    # Your code goes here

    return render(request, 'invite/confirm_email.html')