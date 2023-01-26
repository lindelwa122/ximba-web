from django.urls import path

from . import views

app_name = 'invite'

urlpatterns = [
    path('', views.index, name='index'),
    path('bio/<str:username>', views.get_user_bio, name='User bio'),
    path('confirm', views.confirm_email, name='confirm_email'),
    path('login', views.login_view, name='login'),
    path('new_password/<str:username>/<str:access>', views.new_password, name='new_password'),
    path('notification/push/top', views.push_top_notification, name='push_top_notification'),
    path('register', views.register_view, name='register'),
    path('reset_password', views.reset_password, name='reset_password'),
    path('profile/add/about', views.edit_about, name='edit_about'),
    path('profile/add/image', views.edit_profile_img, name='edit_profile_image'),
    path('profile/count', views.get_profile_count, name='profile_count'),
    path('profile/edit', views.edit_profile, name='edit_profile'),
    path('profile_image/<str:username>', views.get_user_profile_image, name='user_profile_img'),
    path('main', views.main, name='main'),
    path('logout', views.logout_view, name='logout'),
    path('<str:username>', views.profile, name='profile')
]
