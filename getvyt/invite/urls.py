from django.urls import path

from . import views

app_name = 'invite'

urlpatterns = [
    path('', views.register_view, name='register'),
    path('confirm', views.confirm_email, name='confirm_email')
]