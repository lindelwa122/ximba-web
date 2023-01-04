from django.urls import path

from . import views

app_name = 'invite'

urlpatterns = [
    path('', views.index, name='index'),
    path('bio', views.get_user_bio, name='User bio'),
    path('confirm', views.confirm_email, name='confirm_email'),
    path('login', views.login_view, name='login'),
    path('register', views.register_view, name='register'),
    path('reset_password', views.reset_password, name='reset_password'),
    path('profile/count', views.get_profile_count, name='profile_count'),
    path('profile/edit', views.edit_profile, name='edit_profile'),
    path('profile_image', views.get_user_profile_image, name='user_profile_img'),
    path('main', views.main, name='main'),
    path('logout', views.logout_view, name='logout'),
    path('<str:username>', views.profile, name='profile')
]
