from django.core.exceptions import MiddlewareNotUsed
from django.shortcuts import render


class CustomErrorHandlerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if response.status_code == 500:
            return render(request, 'invite/500.html')
    
        if response.status_code == 404:
            return render(request, 'invite/404.html')

        return response
