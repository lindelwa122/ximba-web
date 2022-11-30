from django.urls import path

from . import views

app_name = 'invite'

urlpatterns = [
    path('', views.index, name='index'),
    path('confirm', views.confirm_email, name='confirm_email'),
    path('login', views.login_view, name='login'),
    path('new_password', views.new_password, name='new_password'),
    path('register', views.register_view, name='register'),
    path('reset_password', views.reset_password, name='reset_password')
]