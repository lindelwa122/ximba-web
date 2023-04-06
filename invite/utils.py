from datetime import datetime, timedelta
from math import radians, cos, sin, asin, sqrt
from random import randint, choices, shuffle, random
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

def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees)
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 
    return c * r

def order_events_by_relevance(events, target_user, longitude=0.0, latitude=0.0):
    relevance_scores = {}

    for event in events:
        score = 0
        publisher = event.user

        # Priorize nearby events
        event_location = event.location.split(',')
        event_long, event_lat = event_location[0], event_location[1]
        distance = haversine(float(event_long), float(event_lat), float(longitude), float(latitude))

        if distance <= 10:
            score += 500

        elif distance <= 20:
            score += 250

        elif distance <= 30:
            score += 125

        # Collaborative filtering
        target_user_categories = Personalization.objects.get(user=target_user).categories
        target_user_tags = Personalization.objects.get(user=target_user).tags

        users = User.objects.all()
        for user in users:
            if user == target_user:
                continue  # Skip the target user

            # Compute similarity score based on Jaccard similarity coefficient
            user_categories = Personalization.objects.get(user=user).categories
            user_tags = Personalization.objects.get(user=user).tags

            try:
                category_similarity = len(set(target_user_categories.keys()) & set(user_categories.keys())) / len(set(target_user_categories.keys()) | set(user_categories.keys()))
            except ZeroDivisionError:
                category_similarity = 1
    
            try:
                tag_similarity = len(set(target_user_tags.keys()) & set(user_tags.keys())) / len(set(target_user_tags.keys()) | set(user_tags.keys()))
            except ZeroDivisionError:
                tag_similarity = 1

            similarity_score = category_similarity * 0.5 + tag_similarity * 0.5  # Weighted average

            # If similarity score is above a certain threshold, use collaborative filtering
            if similarity_score > 0.3:
                event_tags = event.keywords.split(',')
                for keyword, value in user_tags.items():
                    if keyword in event_tags:
                        score += value * similarity_score       

        # Check if user befriends publisher
        friendship = Friend.objects.filter(user=target_user, friend=publisher, status=Friend.ACCEPTED)
        if friendship.exists():
            score += 300

        # Check if user follows publisher
        following = Following.objects.filter(user=target_user, following=publisher)
        if following.exists():
            score += 100

        personalization = Personalization.objects.get(user=target_user)

        # Score category
        user_categories = personalization.categories
        event_categories = event.category

        for category, value in user_categories.items():
            if category == event_categories:
                score += value

        # Score keywords
        user_keywords = personalization.keywords
        event_keywords = EventKeyword.objects.get(event=event).keywords
        for keyword, value in user_keywords.items():
            for k in event_keywords.keys():
                if keyword == k:
                    score += value

        # Score using tags
        user_tags = personalization.tags
        event_tags = event.keywords.split(',')

        for keyword, value in user_tags.items():
            if keyword in event_tags:
                score += value

        # Get the current date and time
        now = datetime.now().date()

        # Define the time durations
        three_days = timedelta(days=3)
        five_days = timedelta(days=5)
        seven_days = timedelta(days=7)

        # Get the date of the event
        event_date = event.datetime.date()

        # Score using datetime
        if (event_date - now) <= three_days:
            score += 75
        elif (event_date - now) <= five_days:
            score += 50
        elif (event_date - now) <= seven_days:
            score += 25

        relevance_scores[event.id] = score

    size = events.count()
    return dict_values(relevance_scores, size)


def serialize_post(data, user):
    ls = []

    for post in data:
        saved_event = SavedEvent.objects.filter(user=user, event=post).exists()
        saved_count = SavedEvent.objects.filter(event=post).count()
        event_more_info = EventMoreInfo.objects.filter(event=post).exists()

        obj = {
            'id': post.id,
            'title': post.title,
            'location': post.location,
            'description': post.description,
            'cover': get_img_url(post.cover) if post.cover else False,
            'timestamp': convert_datetime_to_timestamp(post.datetime),
            'ticket_deadline': convert_datetime_to_timestamp(post.end_datetime),
            'publisher': serialize_data([post.user]),
            'with_ticket': post.ticket_access,
            'ticket_secured': Ticket.objects.filter(event=post, owner=user).exists(),
            'ticket_price': post.ticket_price,
            'attendance_limit': post.attendees_allowed,
            'attendees': post.attendees.count(),
            'saves': saved_count,
            'user_saved_event': saved_event,
            'attending': post.attendees.contains(user),
            'category': post.category,
            'keywords': post.keywords,
            'more_info': event_more_info
        }
        ls.append(obj)
    
    return ls



def find_biggest_value(dic: dict):
    biggest = -1

    for key, value in dic.items():
        if value > biggest:
            biggest = value
            key_tracker = key

    return key_tracker

def dict_values(dic: dict, size: int = 1, order_by: str='high'):
    ls = []
    if order_by == 'high':
        for _ in range(size):
            biggest = find_biggest_value(dic)
            dic.pop(biggest)
            ls.append(biggest)

    return ls
