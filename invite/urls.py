from django.urls import path

from . import views

app_name = 'invite'

urlpatterns = [
    path('', views.index, name='index')
]