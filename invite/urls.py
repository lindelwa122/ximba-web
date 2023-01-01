from django.urls import path

from . import views

app_name = 'invite'

urlpatterns = [
    path('', views.index, name='index'),
    path('confirm', views.confirm_email, name='confirm_email'),
    path('login', views.login_view, name='login'),
    path('new_password/<str:username>/<str:access>', views.new_password, name='new_password'),
    path('register', views.register_view, name='register'),
    path('reset_password', views.reset_password, name='reset_password'),
    path('profile', views.profile, name='profile'),
    path('profile/edit', views.edit_profile, name='edit_profile'),
    path('logout', views.logout_view, name='logout')
]