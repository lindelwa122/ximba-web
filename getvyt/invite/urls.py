from django.urls import path

from . import views

app_name = 'invite'

urlpatterns = [
    path('', views.reset_password, name='reset_password'),
    path('new', views.new_password, name='new_password')
]