from django.shortcuts import render
from django.http import HttpResponse
import difflib
# Create your views here.

def search_items(names, query):
    result = []
    for name in names:
        if query in name:
            result.append(name)
    return result

def find_similar(query, names):
    result = []
    for name in names:
        if difflib.SequenceMatcher(None, query, name).ratio() >= 0.50:
            result.append(name)
    return result

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

def search(request):
    if request.method == 'GET':
        query = request.GET['search']
        # 'names' variable is equal to saved Names in Database.
        result = search_items(names, query)

        if result:
            for item in result:
               return HttpResponse(f'Exact match results: {item}')
        else:
            print("No exact match found.")
            similar_result = find_similar(query, names)
            if similar_result:
                for item in similar_result:
                   return HttpResponse(f'Similar results: {item}')
            else:
                return HttpResponse("No similar results found.")

    return render(request, 'invite/search.html')
