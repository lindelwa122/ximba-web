from random import randint, choices
from string import hexdigits

from .models import *

def check_upper(str):
    for char in str:
        if char.isupper():
            return True
    return False

def check_lower(str):
    for char in str:
        if char.islower():
            return True
    return False

def check_digit(str):
    for char in str:
        if char.isdigit():
            return True
    return False

def check_friendship_status(request, username):
    # Check if friendship exists
    other_user = User.objects.get(username=username.strip())
    friendship = Friend.objects.filter(user=request.user, friend=other_user, status=Friend.ACCEPTED)
    if friendship.exists():
        return 'friends'

    # Check if friendship is pending
    friendship_pending = FriendRequest.objects.filter(requester=request.user, receivers=other_user, status=FriendRequest.PENDING)
    if friendship_pending.exists():
        return 'friendship_requested'

    # Check again
    friendship_pending = FriendRequest.objects.filter(requester=other_user, receivers=request.user, status=FriendRequest.PENDING)
    if friendship_pending.exists():
        return 'friendship_received'

    return 'no_relationship'

def generate_code():
    return randint(100000, 999999)

def generate_hash(n: int):
    hash_ls = choices(hexdigits, k=n)
    hash = ''
    for char in hash_ls:
        hash += char
    return hash

def get_img_url(image):
    # Create a list
    image_url_array = image.url.split('/')

    if image_url_array[-1] != 'default.png':
        # Delete the second element (invite)
        del image_url_array[1]

    # Join the list
    return '/'.join(image_url_array)

def serialize_data(data: list):
    ls = []
    for user in data:
        profile = Profile.objects.filter(user=user).first()
        obj = {
            'username': user.username,
            'fullName': f'{user.first_name} {user.last_name}',
            'image': get_img_url(profile.profile_img) if profile else ''
        }
        ls.append(obj)
    return ls

def convert_datetime_to_timestamp(datetime):
    timestamp = datetime.timestamp()
    return timestamp * 1000

def serialize_post(data: list, user):
    ls = []
    for post in data:
        event_actions_count = EventActionsCount.objects.get(event=post)
        attendees = event_actions_count.attendees.count()
        saves = event_actions_count.saves.count()

        obj = {
            'id': post.id,
            'title': post.title,
            'location': post.location,
            'description': post.description,
            'cover': get_img_url(post.cover) if post.cover else False,
            'timestamp': convert_datetime_to_timestamp(post.datetime),
            'publisher': serialize_data([post.user]),
            'with_ticket': post.ticket_access,
            'ticket_secured': Ticket.objects.filter(event=post, owner=user).exists(),
            'attendance_limit': post.attendees_allowed,
            'attendees': attendees,
            'saves': saves
        }
        ls.append(obj)
    return ls