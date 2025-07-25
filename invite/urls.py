from django.urls import path

from . import views

app_name = 'invite'

urlpatterns = [
    path('', views.landing_page, name='landing_page'),
    path('friend-request/accept', views.accept_friendship, name='accept_friend_request'),
    path('event/add/attendee', views.add_attendee, name='add_attendee'), 
    path('add/friend', views.add_friend, name='add_friend'),
    path('waitlist/join', views.add_to_waiting_list, name='add_to_waiting_list'),
    path('search/recent/add/<str:username>', views.add_to_recent_searches, name='add_to_recent'),
    path('calendar', views.view_calendar, name='view_calendar'),
    path('calendar/events', views.calendar_events, name='calendar_events'),
    path('confirm', views.confirm_email, name='confirm_email'),
    path('new-event/publish', views.create_event, name='save_event'),
    path('friend/remove', views.delete_friendship, name='delete_friendship'),
    path('profile/add/about', views.edit_about, name='edit_about'),
    path('profile/add/image', views.edit_profile_img, name='edit_profile_image'),
    path('profile/edit', views.edit_profile, name='edit_profile'),
    path('profile/edit/email', views.edit_email, name='edit_email'),
    path('profile/edit/fullname', views.edit_fullname, name='edit_fullname'),
    path('profile/edit/username', views.edit_username, name='edit_username'),
    path('event/share/<int:event_id>', views.event_shared_handler, name='share_event'),
    path('<str:username>/friends/new', views.find_friends, name='find_friends'),
    path('follow/<str:username>', views.follow, name='follow'),
    path('retrieve-api-key/<str:token_name>', views.get_API_key, name='retrieve_API_key'),
    path('get/<str:get_query>', views.get_data, name='get_data'),
    path('event/ticket/get/<int:event_id>', views.get_event_access, name='get_ticket'),
    path('events/get', views.get_events, name='get_events'),
    path('events/get/filter/nearby', views.get_events_nearby, name='get_events'),
    path('events/get/filter/<str:filter_by>', views.get_events_filter, name='get_events'),
    path('event/stats/<int:event_id>', views.get_event_stats, name='event_stats'),
    path('get/followers/<str:username>', views.get_followers, name='get_followers'),
    path('get/followings/<str:username>', views.get_followings, name='get_followings'),
    path('friends/<str:username>', views.get_friends, name='get_friends'),
    path('pending-friends/<str:username>', views.get_pending_friends, name='get_pending_friends'),
    path('popular-users', views.get_popular_accounts, name='popular_accounts'),
    path('profile/count/<str:username>', views.get_profile_count, name='profile_count'),
    path('saved-events', views.get_saved_events, name='get_saved_events'),
    path('ticket/new/add', views.get_ticket, name='get_ticket'),
    path('ticket/<int:event_id>', views.get_ticket_info, name='get_ticket_info'),
    path('bio/<str:username>', views.get_user_bio, name='user_bio'),
    path('get-info-about-user/<str:username>', views.get_user_data, name='get_user_data'),
    path('profile_image/<str:username>', views.get_user_profile_image, name='user_profile_img'),
    path('get-username', views.get_username, name='get_username'),
    path('home', views.index, name='index'),
    path('is-event-refundable/<int:event_id>', views.is_event_refundable, name='is_event_refundable'),
    path('is-user-authenticated/<str:username>', views.is_user_authenticated, name='is_user_authenticated'),
    path('check/is-user-following/<str:other_user>', views.is_user_following, name='check_user_follow_status'),
    path('logged-in', views.is_user_logged_in, name='logged_in_status'),
    path('login-with-dummy-account', views.login_with_dummy_account, name="dummy_login"),
    path('login', views.login_view, name='login'),
    path('logout', views.logout_view, name='logout'),
    path('main', views.main, name='main'),
    path('metrics', views.metrics, name='metrics'),
    path('metrics/stats', views.metrics_stats, name='metrics_stats'),
    path('more-info/<int:event_id>/edit', views.more_info, name='more_info'),
    path('more-info/<int:event_id>/edit/get/draft', views.get_event_draft, name='get_more_info'),
    path('more-info/<int:event_id>/edit/draft/save', views.more_info, name='save_more_info'),
    path('more-info/<int:event_id>/view', views.view_more_info, name='view_more_info'),
    path('more-info/<int:event_id>/event/view', views.event_more_info_render, name='save_event_id'),
    path('new_password/<str:username>/<str:access>', views.new_password, name='new_password'),
    path('notifications', views.get_notifications, name='get_notifications'),
    path('notification/push/top', views.push_top_notification, name='push_top_notification'),
    path('new-event', views.new_event, name='new_event'),
    path('search/recent', views.recent_search, name='recent_search'),
    path('event/refund', views.refund_handler, name='handler_refunds'),
    path('register', views.register_view, name='register'),
    path('event/remove/attendee', views.remove_attendee, name='remove_attendee'),
    path('page-not-found', views.render404, name='render404'),
    path('resend-code', views.resend_code, name='resend_code'),
    path('reset_password', views.reset_password, name='reset_password'),
    path('event/save', views.save_event, name='save_event'),
    path('ticket/scan/<str:event_id>/<str:ticket_id>', views.validate_ticket, name='scan_tickets'),
    path('scan-tickets/<str:event_id>', views.scan_tickets, name='scan_tickets_view'),
    path('search', views.search, name='search_user'),
    path('unfollow/<str:username>', views.unfollow, name='unfollow'),
    path('personalization/increment-scores', views.update_scores, name='follow_scores'),
    path('saved-event/delete', views.unsave_event, name='unsave_event'),
    path('wallet', views.wallet_view, name='wallet'),
    path('wallet/balance', views.wallet_balance, name='deposit'),
    path('wallet/deposit', views.wallet_deposit, name='deposit'),
    path('<str:username>', views.profile, name='profile'),
]
