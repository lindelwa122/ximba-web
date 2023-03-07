from django.urls import path

from . import views

app_name = 'invite'

urlpatterns = [
    path('', views.index, name='index'),
    path('bio/<str:username>', views.get_user_bio, name='User bio'),
    path('check/is-user-following/<str:other_user>', views.is_user_following, name='check_user_follow_status'),
    path('confirm', views.confirm_email, name='confirm_email'),
    path('follow/<str:username>', views.follow, name='follow'),
    path('<str:username>/friends/new', views.find_friends, name='find_friends'),
    path('friends/<str:username>', views.get_friends, name='get_friends'),
    path('friend-request/accept', views.accept_friendship, name='accept_friend_request'),
    path('add/friend', views.add_friend, name='add_friend'),
    path('get/<str:get_query>', views.get_data, name='get_data'),
    path('get/followers/<str:username>', views.get_followers, name='get_followers'),
    path('get/followings/<str:username>', views.get_followings, name='get_followings'),
    path('is-user-authenticated/<str:username>', views.is_user_authenticated, name='is_user_authenticated'),
    path('login', views.login_view, name='login'),
    path('logout', views.logout_view, name='logout'),
    path('main', views.main, name='main'),
    path('new_password/<str:username>/<str:access>', views.new_password, name='new_password'),
    path('notifications', views.get_notifications, name='get_notifications'),
    path('notification/push/top', views.push_top_notification, name='push_top_notification'),
    path('pending-friends/<str:username>', views.get_pending_friends, name='get_pending_friends'),
    path('profile/add/about', views.edit_about, name='edit_about'),
    path('profile/add/image', views.edit_profile_img, name='edit_profile_image'),
    path('profile/count/<str:username>', views.get_profile_count, name='profile_count'),
    path('popular-users', views.get_popular_accounts, name='popular_accounts'),
    path('page-not-found', views.render404, name='render404'),
    path('profile/edit', views.edit_profile, name='edit_profile'),
    path('profile/edit/email', views.edit_email, name='edit_email'),
    path('profile/edit/fullname', views.edit_fullname, name='edit_fullname'),
    path('profile/edit/username', views.edit_username, name='edit_username'),
    path('profile_image/<str:username>', views.get_user_profile_image, name='user_profile_img'),
    path('friend/remove', views.delete_friendship, name='delete_friendship'),
    path('register', views.register_view, name='register'),
    path('reset_password', views.reset_password, name='reset_password'),
    path('resend-code', views.resend_code, name='resend_code'),
    path('search', views.search, name='search_user'),
    path('search/recent', views.recent_search, name='recent_search'),
    path('search/recent/add/<str:username>', views.add_to_recent_searches, name='add_to_recent'),
    path('unfollow/<str:username>', views.unfollow, name='unfollow'),
    path('new-event', views.new_event, name='new_event'),
    path('<str:username>', views.profile, name='profile')
]
