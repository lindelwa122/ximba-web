from datetime import date, datetime, timedelta
from io import BytesIO
from json import dumps, loads
from tempfile import NamedTemporaryFile
from uuid import uuid4

from PIL import Image
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.core.files import File
from django.core.files.storage import default_storage
from django.core.mail import send_mail
from django.db import IntegrityError
from django.db.models import Q
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.utils.datastructures import MultiValueDictKeyError
from django.utils.timezone import localtime, now
from fuzzywuzzy import process
import nltk
nltk.download('punkt')
nltk.download('stopwords')
from sklearn.feature_extraction.text import TfidfVectorizer
from urllib.parse import unquote


from .models import *
from getvyt.settings import MAPBOX_ACCESS_TOKEN, OPENAI_ACCESS_TOKEN
from .utils import *

ACTIONS = {
    'buy_ticket': 500,
    'attend_free_event': 400,
    'read_more_info': 280,
    'save_event': 330,
    'see_more': 75,
    'share_event': 350,
    'see_exact_location': 260,
    'follow_organiser': 220,
    'open_post_discuss': 180,
    'write_post_discuss': 200,
    'react_to_stories': 180,
    'share_post_discussion': 250,
    'add_new_friend': 100,
    'new_follow': 50,
    'search_user': 30,
}

@login_required(login_url='/login')
def accept_friendship(request):
    if request.method == 'POST':
        data = loads(request.body)
        username = data.get('username', '')
        other_user = User.objects.get(username=username)
        logged_in_user = request.user

        # Ensure the friend request exists
        friendship = FriendRequest.objects.filter(requester=logged_in_user, receivers=other_user)
        if not friendship.exists(): 
            friendship = FriendRequest.objects.filter(requester=other_user, receivers=logged_in_user)
        else:
            friendship.first().receivers.remove(other_user)

        if not friendship.exists():
            return JsonResponse({'error': 'No friend request was found'}, status=400)
        else:
            friendship.first().receivers.remove(logged_in_user)

        # Check existing connections
        connection = Friend.objects.filter(user=logged_in_user, friend=other_user).first()
        if connection:
            connection.status = Friend.ACCEPTED
            connection.save()

            con2 = Friend.objects.filter(user=other_user, friend=logged_in_user).first()
            con2.status = Friend.ACCEPTED
            con2.save()

        else:
            # Create a new friendship
            Friend.objects.create(user=logged_in_user, friend=other_user, status=Friend.ACCEPTED)
            Friend.objects.create(user=other_user, friend=logged_in_user, status=Friend.ACCEPTED)

        return JsonResponse({}, status=200)


@login_required(login_url='/login')
def add_attendee(request):
    user = request.user
    data = loads(request.body)
    event_id = int(data.get('eventId', ''))

    event = get_object_or_404(Event, id=event_id)

    if event.ticket_access:
        return JsonResponse(
            {'error': 'The event has a ticket access and must be accessed through a different route'}, 
        status=400)

    if event.attendees_allowed > 0:
        if event.attendees.count() >= event.attendees_allowed:
            return JsonResponse({'error': 'The number of attendees has reached the limit'}, status=401)

    event.attendees.add(user)

    saved_events, created = SavedEvent.objects.get_or_create(user=user)
    if created:
        saved_events.event.set([event])
    else:
        saved_events.event.add(event)

    return JsonResponse({}, status=200)


@login_required(login_url='/login')
def add_friend(request):
    if request.method == 'POST':
        data = loads(request.body)
        friend_username = data.get('username', '')
        friend = get_object_or_404(User, username=friend_username)

        # Check if a friend request already exists between the users
        existing_request = FriendRequest.objects.filter(requester=request.user, 
            receivers=friend, 
            status=FriendRequest.PENDING).first()

        if existing_request:
            # A pending request already exists
            return JsonResponse({'error': 'Friend request already sent'}, status=400)
        else:
            # Create a new friend request
            new_request, created = FriendRequest.objects.get_or_create(requester=request.user)
            new_request.receivers.add(friend)

            # TODO: Add Notification

            return JsonResponse({}, status=200)


def add_to_waiting_list(request):
    email = request.GET.get('email')
    waiting = WaitingList.objects.filter(email=email)
    if waiting.exists():
        return JsonResponse({'error': 'conflict'}, status=409)

    WaitingList.objects.create(email=email)
    return JsonResponse({}, status=200)


@login_required(login_url='/login')
def add_to_recent_searches(request, username):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({}, status=401)

        recent = list(Recent.objects.filter(user=request.user))

        for user in recent:
            if user.recent.username == username.strip():
                return JsonResponse({}, status=409)

        # If recent size is 3 or more, delete the last element
        if len(recent) >= 3:
            recent_queryset = Recent.objects.filter(user=request.user).order_by('-id')
            recent_queryset.last().delete()

        user = get_object_or_404(User, username=username)

        # Add new user to recent
        Recent.objects.create(user=request.user, recent=user)

        return JsonResponse({}, status=200)


@login_required(login_url='/login')
def calendar_events(request):
    user = request.user
    attending = Event.objects.filter(attendees=user)
    saved = SavedEvent.objects.filter(user=user).values('event')
    print('saved', saved)
    saved_events = Event.objects.filter(id__in=[e['event'] for e in saved])
    combined = attending.union(saved_events)

    events = []
    for event in combined:
        obj = {
            'title': event.title,
            'start': int(convert_datetime_to_timestamp(event.datetime)),
            'end': int(convert_datetime_to_timestamp(event.end_datetime))
        }
        events.append(obj)

    return JsonResponse({'events': events}, status=200)


@login_required(login_url='/login')
def confirm_email(request):
    if request.method == 'POST':
        data = loads(request.body)
        user = User.objects.get(username=request.session['username'])

        if int(data.get('code', '')) != user.email_code:
            return JsonResponse({'error_type': 'confirm_code_not_match'}, status=400)

        time_difference = localtime() - user.code_generation_date
        if (time_difference).seconds > 916:
            user.email_code = generate_code()
            user.code_generation_date = localtime()
            user.save()
            send_mail(
                'Welcome to GetVyt',
                f'Hello, {user.first_name}. Use this code: {user.email_code} to confirm your email.',
                'portfolio@livingdreams.com',
                [user.email],
                fail_silently=False,
            )
            return JsonResponse({'error_type': 'confirm_code_expired'}, status=400)

        user.is_email_confirmed = True
        user.save()

        if not ProfileSetUp.objects.filter(user=user).exists():
            ProfileSetUp.objects.create(user=user)

        login(request, user)

        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/confirm_email.html')


def extract_keywords(event_id):
    event = Event.objects.get(id=event_id)

    text = event.description

    # Tokenize the text into words
    tokens = nltk.word_tokenize(text.lower())

    # Remove stop words
    stop_words = set(nltk.corpus.stopwords.words('english'))
    words = [token for token in tokens if token.isalnum() and token not in stop_words]

    # Extract keywords using TF-IDF
    tfidf = TfidfVectorizer()
    tfidf.fit(words)
    keywords = dict(zip(tfidf.vocabulary_.keys(), tfidf.idf_))

    # Save the keywords in the database
    event_keywords = EventKeyword(event=event, keywords=keywords)
    event_keywords.save()

    return


@login_required(login_url='/login')
def create_event(request):
    if request.method == 'POST':

        # Validate form
        title = request.POST.get('title')
        if not title:
            return JsonResponse({'error_type': 'event_title_empty'}, status=400)

        description = request.POST.get('description')
        if not description:
            return JsonResponse({'error_type': 'event_description_empty'}, status=400)

        location = request.POST.get('location')
        if not location:
            return JsonResponse({'error_type': 'event_location_empty'}, status=400)

        datetimeInfo = request.POST.get('datetime')
        if not datetimeInfo:
            return JsonResponse({'error_type': 'event_datetime_empty'}, status=400)

        endingDatetimeInfo = request.POST.get('endingDatetime')
        if not endingDatetimeInfo:
            return JsonResponse({'error_type': 'event_ending_datetime_empty'}, status=400)

        selectedType = request.POST.get('selectedType')
        if selectedType == 'null' or selectedType == 'undefined':
            return JsonResponse({'error_type': 'event_selected_type_empty'}, status=400)

        selectedAccess = request.POST.get('selectedAccess')
        if selectedAccess == 'null' or selectedAccess == 'undefined':
            return JsonResponse({'error_type': 'event_selected_access_empty'}, status=400)

        selectedPaidOptions = request.POST.get('selectedPaidOptions')
        ticketPrice = request.POST.get('amount')
        selectedPaymentOptions = request.POST.get('selectedPaymentOptions')
        if selectedAccess == 'with-access':
            if selectedPaidOptions == 'null' or selectedPaidOptions == 'undefined':
                return JsonResponse({'error_type': 'event_paid_options_empty'}, status=400)

            if selectedPaidOptions == 'paid':
                if selectedPaymentOptions == 'null' or selectedPaymentOptions == 'undefined':
                    return JsonResponse({'error_type': 'event_payment_options_empty'}, status=400)

                try:
                    if ticketPrice == 'null' or ticketPrice == 'undefined' or int(ticketPrice) <= 0:
                        return JsonResponse({'error_type': 'event_ticket_price_invalid'}, status=400)
                except ValueError:
                        return JsonResponse({'error_type': 'event_ticket_price_invalid'}, status=400)

        attendance_limit = request.POST.get('limit')
        if not attendance_limit:
            attendance_limit = 0

        datetime_obj = datetime.strptime(datetimeInfo, '%Y-%m-%dT%H:%M')
        end_datetime_obj = datetime.strptime(endingDatetimeInfo, '%Y-%m-%dT%H:%M')

        public = False if selectedType == 'private' else True

        ticket = True if selectedAccess == 'with-access' else False

        keywords = request.POST.get('keywords')
        keywords_len = len(keywords.strip().split(','))

        if keywords_len < 3 or keywords_len > 5:
            return JsonResponse({'error_type': 'event_keywords_invalid'}, status=400) 

        draft = True if request.POST.get('draft') == 'true' else False

        category = request.POST.get('category')

        generated_hash = generate_hash(5)
        identifier = title.lower().replace(' ', '-')

        event = Event.objects.create(
            user=request.user,
            title=title,
            identifier=f'{identifier}-{generated_hash}',
            description=description,
            datetime=datetime_obj,
            end_datetime=end_datetime_obj,
            location=location,
            public=public,
            ticket_access=ticket,
            attendees_allowed=attendance_limit,
            ticket_price=int(ticketPrice) if selectedPaidOptions == 'paid' else 0,
            category=category,
            keywords=keywords,
            draft=draft
        )

        event.immediate_payment = True if selectedPaymentOptions == 'immediate' else False
        event.save()

        ticketDeadline = request.POST.get('ticketDeadline')

        if ticketDeadline:
            ticket_deadline_obj = datetime.strptime(ticketDeadline, '%Y-%m-%dT%H:%M')
            event.ticket_purchase_deadline=ticket_deadline_obj
            event.save()

        if draft:
            EventMoreInfo.objects.create(event=event)
            url = f'/more-info/{event.pk}/edit'
        else:
            url = '/home'

        if not public:
            friends = Friend.objects.filter(user=request.user, status=Friend.ACCEPTED)
            friends_list = [relationship.friend for relationship in friends]
            allowed_viewers = PrivateEventViewers.objects.create(event=event)
            allowed_viewers.viewers.set(friends_list)
        
        try:
            image_file = request.FILES['image']
        except MultiValueDictKeyError:
            pass
        else:
            if image_file:
                x = 0 if (int(float(request.POST.get('x'))) < 0) else int(
                float(request.POST.get('x')))
                y = 0 if (int(float(request.POST.get('y'))) < 0) else int(
                    float(request.POST.get('y')))
                width = int(float(request.POST.get('width')))
                height = int(float(request.POST.get('height')))

                # get the file extension
                file_ext = image_file.name.split('.')[-1]

                with NamedTemporaryFile(dir='invite/static/invite/images/temp', suffix=file_ext, delete=False) as temp:
                    temp.write(image_file.file.read())
                    temp.seek(0)

                    with default_storage.open(temp.name, 'rb') as f:
                        image = Image.open(f)

                        # Crop image
                        cropped_image = image.crop((x, y, x + width, y + height))

                        # Create a BytesIO object
                        image_io = BytesIO()

                        # Save the image to the BytesIO object
                        cropped_image.save(image_io, format='JPEG')

                        # Seek to the beginning of the file
                        image_io.seek(0)

                        # generate a random hash for the image name
                        random_hash = uuid4().hex

                        # rename the file
                        new_file_name = f'{random_hash}.{file_ext}'

                        # saving image
                        event.cover.save(
                            new_file_name, File(image_io), save=False
                        )
                        event.save()

        extract_keywords(event.id)

        return JsonResponse({'next_route': url}, status=200)


@login_required(login_url='/login')
def delete_friendship(request):
    if request.method == 'POST':
        data = loads(request.body)
        username = data.get('username', '')
        logged_in_user = request.user
        other_user = get_object_or_404(User, username=username)

        connection_1 = get_object_or_404(Friend, user=logged_in_user, friend=other_user)
        connection_2 = get_object_or_404(Friend, user=other_user, friend=logged_in_user)

        if (connection_1.status == Friend.PENDING):
            return JsonResponse({'error': 'Your friendship status is pending'}, status=400)

        # Update status
        connection_1.status = Friend.PENDING
        connection_2.status = Friend.PENDING

        # Save
        connection_1.save()
        connection_2.save()

        return JsonResponse({'message': 'Friendship deleted successfully.'}, status=200)


@login_required(login_url='/login')
def edit_about(request):
    if request.method == 'POST':
        data = loads(request.body)
        about = data.get('about', )

        user_profile = Profile.objects.get(user=request.user)

        if len(about) > 200:
            return JsonResponse({}, status=400)

        user_profile.bio = about
        user_profile.save()

        profile_set_up = ProfileSetUp.objects.get(user=request.user)

        if not profile_set_up.bio_setup:
            profile_set_up.bio_setup = True
            profile_set_up.save()

        return JsonResponse({'message': about}, status=200)


@login_required(login_url='/login')
def edit_email(request):
    if request.method == 'POST':
        data = loads(request.body)
        email = data.get('email', '').strip()

        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists'}, status=409)

        user = User.objects.get(username=request.user.username)
        user.code_generation_date = localtime()
        user.email = email
        user.email_code = generate_code()
        user.is_email_confirmed = False
        user.save()

        return JsonResponse({}, status=200)


@login_required(login_url='/login')
def edit_fullname(request):
    if request.method == 'POST':
        data = loads(request.body)

        user = User.objects.get(username=request.user.username)
        user.first_name = data.get('firstName', '').capitalize()
        user.last_name = data.get('lastName', '').capitalize()
        user.save()

        return JsonResponse({}, status=200)


@login_required(login_url='/login')
def edit_username(request):
    if request.method == 'POST':
        data = loads(request.body)
        username = data.get('username', '')

        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists. Try a different one.'}, status=409)

        user = User.objects.get(username=request.user.username)
        user.username = username
        user.save()

        return JsonResponse({}, status=200)


@login_required(login_url='/login')
def edit_profile(request):
    return render(request, 'invite/edit_profile.html')


def event_more_info_render(request, event_id):
    event = EventMoreInfo.objects.filter(event__id=event_id)
    if not event.exists():
        return HttpResponseRedirect(reverse('invite:render404'))
    return render(request, 'invite/more-info-view.html')


@login_required(login_url='/login')
def event_shared_handler(request, event_id):
    user = request.user
    event = Event.objects.get(id=event_id)

    contains = event.shares.contains(user)
    if contains:
        return JsonResponse({'message': 'user has already shared this event'}, status=409)

    event.shares.add(user)

    # TODO: Send notification to all user's friends

    return JsonResponse({'message': 'event shared successfully'}, status=200)


@login_required(login_url='/login')
def edit_profile_img(request):
    if request.method == 'POST':
        x = 0 if (int(float(request.POST.get('x'))) < 0) else int(
            float(request.POST.get('x')))
        y = 0 if (int(float(request.POST.get('y'))) < 0) else int(
            float(request.POST.get('y')))
        width = int(float(request.POST.get('width')))
        height = int(float(request.POST.get('height')))
        image_file = request.FILES['image']

        # get the file extension
        file_ext = image_file.name.split('.')[-1]

        with NamedTemporaryFile(dir='invite/static/invite/images/temp', suffix=file_ext, delete=False) as temp:
            temp.write(image_file.file.read())
            temp.seek(0)

            with default_storage.open(temp.name, 'rb') as f:
                image = Image.open(f)

                # Crop image
                cropped_image = image.crop((x, y, x + width, y + height))

                # Create a BytesIO object
                image_io = BytesIO()

                # Save the image to the BytesIO object
                cropped_image.save(image_io, format='JPEG')

                # Seek to the beginning of the file
                image_io.seek(0)

                # Save cropped image
                profile = Profile.objects.get(user=request.user)
                # generate a random hash for the image name
                random_hash = uuid4().hex
                # rename the file
                new_file_name = f'{random_hash}.{file_ext}'
                profile.profile_img.save(
                    new_file_name, File(image_io), save=False)
                profile.save()

        profile_set_up = ProfileSetUp.objects.get(user=request.user)

        if not profile_set_up.profile_img_setup:
            profile_set_up.profile_img_setup = True
            profile_set_up.save()

        return JsonResponse({}, status=200)


@login_required(login_url='/login')
def find_friends(request, username):
    # Get user
    if username == 'use-logged-in-user':
        user = request.user
    else:
        user = User.objects.get(username=username.strip())

    # Get the user's friends
    friends = Friend.objects.filter(user=user, status=Friend.ACCEPTED).values_list('friend', flat=True)
    friends_pending = list(FriendRequest.objects.filter(requester=user).values_list('receivers', flat=True))
    requests_pending = list(FriendRequest.objects.filter(receivers=user).values_list('requester', flat=True))

    # Get similar users 
    similar_users = find_similar_users(user)
    similar_users_ids = [user.id for user in similar_users]

    # Get the friends of the user's friends, excluding the user's friends and the user themselves
    friend_friends = Friend.objects.filter(user__in=friends).exclude(user=user).exclude(friend__in=friends).values_list('friend', flat=True)

    # Get the users who follow the user but are not friends yet
    followers = Following.objects.filter(following=user).exclude(user__in=friends).exclude(user=user).values_list('user', flat=True)

    # Get the recent users visited by the user
    recent_users = Recent.objects.filter(user=user).values_list('recent', flat=True)

    # Get the mutual friends of the user and each potential friend
    potential_friends = User.objects.filter(
        Q(id__in=friends) | 
        Q(id__in=friend_friends) | 
        Q(id__in=followers) | 
        Q(id__in=recent_users) |
        Q(id__in=similar_users_ids)
    ).exclude(id__in=friends).exclude(id__in=friends_pending).exclude(id__in=requests_pending).exclude(id=user.id).distinct()

    # Sort potential friends by relevance, in descending order
    relevance_scores = {}
    for friend in potential_friends:
        mutual_friends = Friend.objects.filter(user=friend, friend__in=friends).values_list('friend', flat=True)
        mutual_friends_count = len(mutual_friends)
        following_friend = Following.objects.filter(user=user, following=friend).exists()
        friend_following = Following.objects.filter(user=friend, following=user).exists()
        relevance_score = mutual_friends_count + following_friend + friend_following
        relevance_scores[friend] = relevance_score
    suggested_friends = sorted(relevance_scores, key=lambda friend: relevance_scores[friend], reverse=True)

    return JsonResponse({'suggested_friends': serialize_data(list(suggested_friends)[:10])})


def find_users(query, threshold=80):
    # Get all users from the database
    users = User.objects.all()

    # Create an empty list to hold the matching users
    matching_users = []

    # Loop through each user
    for user in users:
        # Extract the relevant fields for the user and store them in a list
        user_fields = [user.username, user.first_name, user.last_name]

        # Find the best match between the query and the user fields
        best_match = process.extractOne(query, user_fields)

        # Check if the best match meets the threshold
        if best_match[1] >= threshold:
            # If the match meets the threshold, add the user's information to the list of matching users
            profile = Profile.objects.filter(user=user).first()
            matching_users.append({
                'username': user.username,
                'fullName': f'{user.first_name} {user.last_name}',
                'image': get_img_url(profile.profile_img) if profile else ''
            })

    # Return the list of matching users
    return matching_users


@login_required(login_url='/login')
def follow(request, username):
    user = User.objects.get(username=request.user.username)
    following = User.objects.get(username=username.strip())

    if user == following:
        return JsonResponse({'error': 'You cannot follow yourself'}, status=403)

    connection = Following.objects.filter(user=user, following=following)
    if connection.exists():
        return JsonResponse({'error': 'Already following user'}, status=409)

    Following.objects.create(user=user, following=following)

    return JsonResponse({}, status=200)


def get_API_key(request, token_name):
    if token_name == 'mapbox':
        return JsonResponse({'key': MAPBOX_ACCESS_TOKEN}, status=200)
    
    elif token_name == 'openai':
        return JsonResponse({'key': OPENAI_ACCESS_TOKEN}, status=200)


def get_data(request, get_query):
    user = request.user
    if user.is_authenticated:
        profile = Profile.objects.get(user=user)

        if get_query == 'about':
            return JsonResponse({'data': profile.bio}, status=200)

        elif get_query == 'email':
            return JsonResponse({'data': user.email}, status=200)

        elif get_query == 'name':
            return JsonResponse({'data': f'{user.first_name} {user.last_name}'}, status=200)

        elif get_query == 'profile_img':
            return JsonResponse({'data': get_img_url(profile.profile_img)}, status=200)

        elif get_query == 'username':
            return JsonResponse({'data': user.username}, status=200)

        else:
            return JsonResponse({'error': 'Data not found'}, status=404)

    else:
        return JsonResponse({'error': 'User not authenticated'}, status=409)


EVENTS = []
def get_events(request):
    username = request.GET.get('username')
    user = request.user
    events_for = request.GET.get('events_for')

    if events_for == 'profile':
        events = Event.objects.filter(user=user)
        return JsonResponse({'events': serialize_post(events, user)}, status=200) 

    print('auth', user.is_authenticated)

    # If user is not logged in
    if not user.is_authenticated:
        public_events = Event.objects.filter(public=True)
        return JsonResponse({'events': serialize_post(public_events)})

    start = int(request.GET.get('start'))
    end = int(request.GET.get('end'))

    if start == 0 or start >= len(EVENTS):
        EVENTS.clear()

        longitude = request.GET.get('longitude')
        latitude = request.GET.get('latitude')

        if username:
            user = get_object_or_404(User, username=username)   
            events = Event.objects.filter(user=user).order_by('-datetime')
            return JsonResponse({'events': serialize_post(events, user)}, status=200)
            
        public_events = Event.objects.filter(public=True, draft=False).exclude(user=user)
        allowed_private_events = PrivateEventViewers.objects.filter(viewers=user).values('event_id')
        private_events = Event.objects.filter(public=False).filter(id__in=allowed_private_events)
        events = public_events.union(private_events)

        order = order_events_by_relevance(events, user, longitude, latitude)
        for num in order:
            event = get_object_or_404(Event, id=num)
            EVENTS.append(event)

        return JsonResponse(
            {
                'events': serialize_post(EVENTS[:end], user), 
                'end': end, 
                'total_events': len(EVENTS)
            }, 
            status=200
        )
    
    elif end >= len(EVENTS):
        return JsonResponse(
            {
                'events': serialize_post(EVENTS[start:], user), 
                'end': 0, 
                'total_events': len(EVENTS)
            }, 
            status=200
        )

    else:
        return JsonResponse(
            {
                'events': serialize_post(EVENTS[start:end], user), 
                'end': end, 
                'total_events': len(EVENTS)
            }, 
            status=200
        )


@login_required(login_url='/login')
def get_event_access(request, event_id):
    ticket_id = uuid4().hex
    user = request.user

    event = get_object_or_404(Event, id=event_id, ticket_access=True)

    if Ticket.objects.filter(event=event, owner=user).exists():
        return JsonResponse({'error': 'Ticket already exists'}, status=409)

    if event.attendees_allowed > 0:
        if event.attendees.count() >= event.attendees_allowed:
            return JsonResponse({'error': 'The number of attendees has reached the limit'}, status=401)
        
    Ticket.objects.create(event=event, owner=user, identifier=ticket_id)

    event.attendees.add(user)

    saved_event, created = SavedEvent.objects.get_or_create(user=user)
    if created:
        saved_event.event.set([event])
    else:
        saved_event.event.add(event)

    return JsonResponse({}, status=200)


@login_required(login_url='/login')
def get_event_draft(request, event_id):
    user = request.user
    event = get_object_or_404(Event, id=event_id, user=user)
    additional_info = get_object_or_404(EventMoreInfo, event=event)
    return JsonResponse({'info': dumps(additional_info.html)}, status=200)


def get_events_filter(request, filter_by):
    user = request.user

    if filter_by == 'upcoming':
        allowed_private_events = PrivateEventViewers.objects.filter(viewers=user).values('event_id')
        public_events = Event.objects.filter(public=True, datetime__gte=now()).exclude(user=user)
        private_events = Event.objects.filter(public=False, datetime__gte=now(), id__in=allowed_private_events).exclude(user=user)
        events = public_events.union(private_events)
        return JsonResponse({'events': serialize_post(events, user)}, status=200)

    if filter_by == 'friends':
        filter_method = Friend.objects.filter(user=user, status=Friend.ACCEPTED).values('friend_id')

    elif filter_by == 'following':
        filter_method = Following.objects.filter(user=user).values('following_id')

    if filter_by != 'upcoming':
        allowed_private_events = PrivateEventViewers.objects.filter(viewers=user).values('event_id')
        public_events = Event.objects.filter(public=True).filter(user_id__in=filter_method)
        private_events = Event.objects.filter(public=False, user_id__in=filter_method, id__in=allowed_private_events)
        events = public_events.union(private_events)

    longitude = request.GET.get('longitude')
    latitude = request.GET.get('latitude')

    order = order_events_by_relevance(events, user, longitude, latitude)
    ordered_events = []
    for num in order:
        event = get_object_or_404(Event, id=num)
        ordered_events.append(event)

    return JsonResponse({'events': serialize_post(ordered_events, user)}, status=200)


def get_events_nearby(request):
    user = request.user

    # Get the user's current location using Mapbox's geocoding API
    location = request.GET.get('location')

    allowed_private_events = PrivateEventViewers.objects.filter(viewers=user).values('event_id')
    public_events = Event.objects.filter(public=True).exclude(user=user)
    private_events = Event.objects.filter(public=False, id__in=allowed_private_events).exclude(user=user)
    events = public_events.union(private_events)

    nearby_events = []
    for event in events:
        # Parse the latitude and longitude values from the location field
        event_longitude, event_latitude = event.location.split(',')
        event_latitude = float(event_latitude)
        event_longitude = float(event_longitude)

        # Parse the latitude and longitude values from the user location
        user_longitude, user_latitude = location.split(',')
        user_latitude = float(user_latitude)
        user_longitude = float(user_longitude)

        distance_in_km = haversine(event_longitude, event_latitude, user_longitude, user_latitude)

        # If the event is within the specified distance, add it to the nearby_events list
        if distance_in_km <= 10:
            nearby_events.append(event)

    events_ids = [obj.id for obj in nearby_events]
    nearby_events = Event.objects.filter(id__in=events_ids)

    order = order_events_by_relevance(nearby_events, user, user_longitude, user_latitude)
    ordered_events = []
    for num in order:
        event = get_object_or_404(Event, id=num)
        ordered_events.append(event)

    return JsonResponse({'events': serialize_post(ordered_events, user)}, status=200)


def get_event_stats(request, event_id):
    event = Event.objects.get(id=int(event_id))
    user_saved_event = SavedEvent.objects.filter(user=request.user, event=event).exists()
    event_saves_count = SavedEvent.objects.filter(event=event).count()

    return JsonResponse(
        {
            'attendees': [attendees.username for attendees in event.attendees.all()], 
            'saves': event_saves_count,
            'userSavedEvent': user_saved_event,
            'price': event.ticket_price
        }, 
        status=200
    )


def get_followers(request, username):
    user = User.objects.get(username=username.strip())
    followers = Following.objects.filter(following=user)
    followers_data = []

    for _user in followers:
        obj = {}
        obj['username'] = _user.user.username
        obj['fullName'] = f'{_user.user.first_name} {_user.user.last_name}'
        profile = Profile.objects.get(user=_user.user)
        obj['image'] = get_img_url(profile.profile_img)
        followers_data.append(obj)

    return JsonResponse({'users': followers_data}, status=200)


def get_followings(request, username):
    user = User.objects.get(username=username.strip())
    followings = Following.objects.filter(user=user)
    followings_data = []

    for _user in followings:
        obj = {}
        obj['username'] = _user.following.username
        obj['fullName'] = f'{_user.following.first_name} {_user.following.last_name}'
        profile = Profile.objects.get(user=_user.following)
        obj['image'] = get_img_url(profile.profile_img)
        followings_data.append(obj)

    return JsonResponse({'users': followings_data}, status=200)
    

def get_friends(request, username):
    user = User.objects.get(username=username.strip())
    friends = Friend.objects.filter(user=user, status=Friend.ACCEPTED)
    return JsonResponse({'friends': serialize_data([friend.friend for friend in friends])})


@login_required(login_url='/login')
def get_notifications(request):
    notifications = Notification.objects.filter(to=request.user)
    print(notifications)

    # Serialize data
    data = []
    for notification in notifications:
        profile = Profile.objects.filter(user=notification.origin).first()
        obj = {
            'origin': notification.origin.username,
            'type': notification.notification_type,
            'datetime': notification.datetime,
            'image': get_img_url(profile.profile_img) if profile else ''
        }
        data.append(obj)

    return JsonResponse({'notifications': data}, status=200)


@login_required(login_url='/login')
def get_pending_friends(request, username):
    user = User.objects.get(username=username.strip())

    # Get request receivers
    pending_friends = FriendRequest.objects.filter(requester=user, status=FriendRequest.PENDING)
    receiver_ids = [receiver_id for (receiver_id,) in pending_friends.values_list('receivers')]
    receivers = User.objects.filter(id__in=receiver_ids)
    serialized_receivers = serialize_data(receivers)

    # Get requesters
    received_requests = FriendRequest.objects.filter(receivers=user)
    requester_ids = [requester_id for (requester_id,) in received_requests.values_list('requester')]
    requesters = User.objects.filter(id__in=requester_ids)
    serialized_requesters = serialize_data(requesters)

    return JsonResponse({'receivers': serialized_receivers, 'requesters': serialized_requesters}, status=200)


def get_popular_accounts(request):
    popular_users = Following.objects.all().values_list('following').order_by('user')[:5]
    user_ids = [user_id for (user_id,) in popular_users]
    users = User.objects.filter(id__in=user_ids)
    serialized_user_data = serialize_data(users)    
    return JsonResponse({'popular_users': serialized_user_data})


def get_profile_count(request, username):
    username = username.strip()
    user = User.objects.get(username=username)

    friends = Friend.objects.filter(user=user, status=Friend.ACCEPTED).count()
    following = Following.objects.filter(user=user).count()
    followers = Following.objects.filter(following=user).count()
    return JsonResponse({'friendsCount': friends, 'followingCount': following, 'followersCount': followers}, status=200)


@login_required(login_url='/login')
def get_saved_events(request):
    user =  request.user
    events = SavedEvent.objects.get(user=user)
    serialized_data = serialize_post(events.event.all(), user)
    return JsonResponse({'events': serialized_data}, status=200)


@login_required(login_url='/login')
def get_ticket(request):
    if request.method == 'POST':
        user = request.user

        data = loads(request.body)
        attendees = data.get('attendees')
        event_id = data.get('eventId')
        password = data.get('password')

        authenticated = authenticate(request, username=user.username, password=password)
        if not authenticated:
            return JsonResponse({'message': 'credentials invalid'}, status=401)

        event = get_object_or_404(Event, id=int(event_id))
        price = event.ticket_price

        wallet = Wallet.objects.get(user=user)
        balance = wallet.balance
        try:
            attendees = int(attendees)
        except ValueError:
            attendees = 1
        else:
            if attendees < 1:
                attendees = 1

        total_ticket_price = price * attendees
        charges = total_ticket_price * (3/100)
        total = total_ticket_price + charges

        if total > balance:
            return JsonResponse({'message': 'insufficient funds'}, status=400)

        # Deduct from user's wallet
        wallet.balance = balance - (total_ticket_price+charges)
        wallet.save()

        # Create ticket
        ticket_id = uuid4().hex
        ticket = Ticket.objects.create(event=event, owner=user, people=attendees, identifier=ticket_id)

        # Record transaction
        ticket_sale_id = uuid4().hex
        ticket_sale = TicketSale.objects.create(ticket=ticket, event=event, user=user, identifier=ticket_sale_id)

        # Check if we have to pay organiser
        if event.immediate_payment:
            organiser = event.user
            organiser_wallet = Wallet.objects.get(user=organiser)
            organiser_balance = organiser_wallet.balance
            payment = price - (price * (6/100))
            organiser_wallet.balance = organiser_balance + payment
            organiser_wallet.save()

            ticket_sale.effective_date = now()
            ticket_sale.status = TicketSale.COMPLETE
            
        else:
            ticket_sale.effective_date = event.end_datetime
            ticket_sale.status = TicketSale.PENDING

        ticket_sale.save()

        # Save Event
        saved_event, created = SavedEvent.objects.get_or_create(user=user)
        if created:
            saved_event.event.set([event])
        else:
            saved_event.event.add(event)

        # Add attendee
        event.attendees.add(user)

        # Add to revenue
        sale_commission = total_ticket_price * (1/100)
        Revenue.objects.create(amount=sale_commission, source=Revenue.TICKET_SALE)

        return JsonResponse({'message': 'ticket successfully purchased'}, status=200)


@login_required(login_url='/login')
def get_ticket_info(request, event_id):
    user = request.user
    event = get_object_or_404(Event, id=event_id)
    ticket = get_object_or_404(Ticket, event=event, owner=user)
    serialized_event_data = serialize_post([ticket.event], user)

    obj =  {
        'event_id': event_id,
        'title': serialized_event_data[0]['title'],
        'location': serialized_event_data[0]['location'],
        'timestamp': serialized_event_data[0]['timestamp'],
        'price': serialized_event_data[0]['ticket_price'],
        'people': ticket.people,
        'identifier': ticket.identifier,
        'expired': ticket.expired
    }

    return JsonResponse({'ticket_info': obj}, status=200)


def get_user_bio(request, username):
    try:
        user = User.objects.get(username=username)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=404)

    profile = Profile.objects.get(user=user)
    return JsonResponse({'bio': profile.bio}, status=200)


def get_user_data(request, username):
    try:
        user = User.objects.get(username=username.strip())
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=404)

    profile = Profile.objects.get(user=user)

    obj = {
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'profile_image': get_img_url(profile.profile_img)
    }

    return JsonResponse({'user_data': obj}, status=200)


def get_user_profile_image(request, username):
    try:
        user = User.objects.get(username=username)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=404)

    profile = Profile.objects.get(user=user)

    return JsonResponse({'imagePath': get_img_url(profile.profile_img)}, status=200)


def get_username(request):
    username = request.user.username
    return JsonResponse({'username': username}, status=200)


def index(request):
    return render(request, 'invite/index.html')


def is_event_refundable(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    answer = 'NO' if event.immediate_payment else 'YES'

    return JsonResponse({'answer': answer}, status=200)


def is_user_authenticated(request, username):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'User not logged in'}, status=403)

    if request.user.username != username.strip():
        return JsonResponse({'error': 'Access denied'}, status=403)

    return JsonResponse({}, status=200)


def is_user_following(request, other_user):
    user = User.objects.get(username=request.user.username)
    other_user = User.objects.get(username=other_user.strip())

    following = Following.objects.filter(user=user, following=other_user)
    answer = 'YES' if following.exists() else 'NO'

    return JsonResponse({'answer': answer}, status=200)


def is_user_logged_in(request):
    answer = 'YES' if request.user.is_authenticated else 'NO'
    return JsonResponse({'answer': answer}, status=200)


def landing_page(request):
    LandingPageVisits.objects.create()
    return render(request, 'invite/landing-page.html')


def login_view(request):
    if request.method == 'POST':
        data = loads(request.body)

        user = authenticate(request, username=data.get(
            'username', ''), password=data.get('password', '')
        )

        if user is None:
            return JsonResponse({'error_type': 'login'}, status=400)

        login(request, user)
        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/login.html')


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('invite:index'))


def main(request):
    return render(request, 'invite/main.html')


@login_required(login_url='/login')
def metrics(request):
    if request.user.is_superuser:
        return render(request, 'invite/metrics.html')

    else:
        return HttpResponse('<h1>You are not authorized to access this page.</h1>')


@login_required(login_url='/login')
def metrics_stats(request):
    timeframe = request.GET.get('timeframe')
    now = datetime.now()

    if timeframe == 'all':
        waiting_list_count = WaitingList.objects.all().count()
        landing_page_visits = LandingPageVisits.objects.all().count()
        

    elif timeframe == 'seven_days':
        seven_days_ago = now - timedelta(days=7)
        waiting_list_count = WaitingList.objects.filter(date__range=(seven_days_ago, now)).count()
        landing_page_visits = LandingPageVisits.objects.filter(date__range=(seven_days_ago, now)).count()

    elif timeframe == 'today':
        today = date.today()
        waiting_list_count = WaitingList.objects.filter(date__date=today).count()
        landing_page_visits = LandingPageVisits.objects.filter(date__date=today).count()

    return JsonResponse({'waitlist': waiting_list_count, 'landing_page': landing_page_visits}, status=200)


@login_required(login_url='/login')
def more_info(request, event_id):
    user = request.user
    if request.method == 'GET':
        try:
            Event.objects.get(id=event_id, user=user, draft=True)
        except ObjectDoesNotExist:
            return HttpResponseRedirect(reverse('invite:render404'))
        
        return render(request, 'invite/more-event-info.html')

    elif request.method == 'PUT':
        
        data = unquote(request.body.decode('utf-8'))
        html_content = loads(data)
        event = get_object_or_404(Event, id=event_id, user=user)

        add_info, _ = EventMoreInfo.objects.get_or_create(event=event)
        add_info.html = html_content
        add_info.save()

        return JsonResponse({}, status=200)

    elif request.method == 'POST':
        data = unquote(request.body.decode('utf-8'))
        html_content = loads(data)
        event = get_object_or_404(Event, id=event_id, user=user)
        event.draft = False
        event.save()

        add_info, _ = EventMoreInfo.objects.get_or_create(event=event)
        add_info.html = html_content
        add_info.save()

        return JsonResponse({}, status=200)


@login_required(login_url='/login')
def new_event(request):
    return render(request, 'invite/new_event.html')


@login_required(login_url='/login')
def new_password(request, username, access):
    if request.method == 'POST':
        data = loads(request.body)
        password = data.get('password', '')

        # Ensure form data is not empty
        for val in data.values():
            if not val:
                return JsonResponse({'error_type': 'empty'}, status=400)

        # Validate password
        if not (check_upper(password) and check_lower(password) and check_digit(password)):
            return JsonResponse({'error_type': 'password_invalid'}, status=400)

        # Ensure that password is the same as confirm-password
        if password != data.get('confirm-password', ''):
            return JsonResponse({'error_type': 'confirm_invalid'}, status=400)

        user = User.objects.get(username=username)
        user.set_password(password)
        user.reset_password = generate_hash(20)
        user.save()

        return JsonResponse({}, status=200)

    else:
        if User.objects.get(username=username).reset_password != access:
            return HttpResponse('<h1>Broken Link</h1>')
        return render(request, 'invite/new_password.html')


def profile(request, username=None):
    if not username:
        username = request.user.username

    username = username.strip()

    # Try to get user
    try:
        user = User.objects.get(username=username)
    except ObjectDoesNotExist:
        return HttpResponseRedirect(reverse('invite:render404'))

    if request.user.is_authenticated:
        # Determine if the Currently Logged-In User Follows the User Whose Profile is Being Viewed
        f = Following.objects.filter(user=request.user, following=user)
        f = f.exists()
        friendship_status = check_friendship_status(request, username)
    else:
        f = False
        friendship_status = 'no_relationship'

    # Determine if user is authenticated
    authenticated = user.username == request.user.username
    
    # User authenticated but email not confirmed
    if authenticated and not user.is_email_confirmed:
        return HttpResponseRedirect(reverse('invite:index'))

    return render(request, 'invite/profile.html', {
        'user': user,
        'authenticated': authenticated,
        'is_user_logged_in': request.user.is_authenticated,
        'following_user': f,
        'friendship_status': friendship_status
    })


def push_top_notification(request):
    if request.user.is_authenticated:

        setup = ProfileSetUp.objects.get(user=request.user)

        if not (setup.bio_setup and setup.profile_img_setup):
            return JsonResponse({'currentStatus': 'profileNotComplete', 'imageSetUp': setup.profile_img_setup, 'bioSetUp': setup.bio_setup}, status=200)

        else:
            return JsonResponse({'currentStatus': 'profileComplete'}, status=200)

    else:
        return JsonResponse({'currentStatus': 'notLoggedIn'}, status=200)


def recent_search(request):
    logged_in_user = request.user
    recent = []

    if not logged_in_user.is_authenticated:
        return JsonResponse({'recent': recent}, status=200)

    recent_users = Recent.objects.filter(user=logged_in_user).order_by('-id')

    for recent_user in recent_users:
        user = recent_user.recent
        obj = {
            'username': user.username,
            'fullName': f'{user.first_name} {user.last_name}',
        }
        profile = Profile.objects.filter(user=user).first()
        if profile:
            obj['image'] = get_img_url(profile.profile_img)
        recent.append(obj)

    return JsonResponse({'recent': recent}, status=200)


@login_required(login_url='/login')
def refund_handler(request):
    user = request.user
    data = loads(request.body)

    event_id = int(data.get('eventId'))
    event = get_object_or_404(Event, id=event_id)

    start_date = event.datetime
    if now() >= start_date:
        return JsonResponse({'message': "it's too late to get refund"}, status=400)

    ticket = Ticket.objects.get(event=event, owner=user)

    # Refund user
    price = event.ticket_price
    wallet = Wallet.objects.get(user=user)
    balance = wallet.balance
    wallet.balance = (balance + price) * ticket.people
    wallet.save()

    # Record refund
    # There seem to be a bug here:
    # Instead of this being updated it is deleted
    # NOTE: FIX THIS WHEN YOU GET TIME
    ticket_record = TicketSale.objects.get(event=event, user=user)
    ticket_record.status = TicketSale.REFUNDED
    ticket_record.save()

    # Revoke ticket
    ticket.delete()

    # Remove user as attendee
    event.attendees.remove(user)

    return JsonResponse({'message': 'refund was successful'}, status=200)


def register_view(request):
    if request.method == 'POST':
        data = loads(request.body)
        password = data.get('password', '')
        username = data.get('username', '')

        # Ensure form data is not empty
        for val in data.values():
            if not val:
                return JsonResponse({'error_type': 'empty'}, status=400)

        # Validate password
        if not (check_upper(password) and check_lower(password) and check_digit(password)):
            return JsonResponse({'error_type': 'password_invalid'}, status=400)

        # Ensure that password is the same as confirm-password
        if password != data.get('confirm-password', ''):
            return JsonResponse({'error_type': 'confirm_invalid'}, status=400)

        if User.objects.filter(email=data.get('email', '')).exists():
            return JsonResponse({'error_type': 'mail_taken'}, status=409)

        try:
            user = User.objects.create_user(
                first_name=data.get('firstname', '').capitalize(),
                last_name=data.get('lastname', '').capitalize(),
                username=data.get('username', '').lower(),
                email=data.get('email', ''),
                password=password,
                email_code=generate_code(),
                code_generation_date=localtime(),
            )
            user.save()

        except IntegrityError:
            return JsonResponse({'error_type': 'username_taken'}, status=409)

        Profile.objects.create(user=User.objects.get(username=username))
        
        request.session['username'] = username

        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/register.html')


@login_required(login_url='/login')
def remove_attendee(request):
    if request.method == 'DELETE':
        user = request.user
        data = loads(request.body)
        event_id = int(data.get('eventId', ''))
        method = data.get('method', '')

        event = get_object_or_404(Event, id=event_id)

        if method == 'normal':

            if event.ticket_access:
                return JsonResponse({'error': 'Incorrect method. Try "free" method.'}, status=400)

            event.attendees.remove(user)

            return JsonResponse({}, status=200)

        elif method == 'free':
            if event.ticket_price != 0:
                return JsonResponse({'error': 'Incorrect method. Try another method'}, status=401)

            ticket = get_object_or_404(Ticket, event=event, owner=user)
            ticket.delete()

            event.attendees.remove(user)

            return JsonResponse({}, status=200)


def render404(request):
    return render(request, 'invite/404.html')


def resend_code(request):
    username = request.session['username']
    user = get_object_or_404(User, username=username)
    code = generate_code()
    user.email_code = code
    user.save()

    send_mail(
        'Confirm your email',
        f'Hello, {username}. Use this code: {code} to confirm your email.',
        'portfolio@livingdreams.com',
        [user.email],
        fail_silently=False,
    )

    return JsonResponse({}, status=200)


def reset_password(request):
    if request.method == 'POST':
        data = loads(request.body)
        email = data.get('email', '')

        try:
            user = User.objects.get(email=email)
        except ObjectDoesNotExist:
            return JsonResponse({'error_type': 'mail_404'}, status=404)

        user.reset_password = uuid4().hex
        user.save()

        username = user.username
        reset_password_code = User.objects.get(email=email).reset_password

        send_mail(
            'Reset Password',
            f'Click here: https://getvyt-web-production.up.railway.app/new_password/{username}/{reset_password_code} to reset your password.',
            'portfolio@livingdreams.com',
            [email],
            fail_silently=False,
        )


        return JsonResponse({'error_type': 'link_sent'}, status=400)

    else:
        return render(request, 'invite/reset_password.html')


@login_required(login_url='/login')
def save_event(request):
    if request.method == 'POST':
        data = loads(request.body)
        event_id = int(data.get('eventId', ''))
        event = get_object_or_404(Event, id=event_id)

        saved_event, created = SavedEvent.objects.get_or_create(user=request.user)
        if created:
            saved_event.event.set([event])
        else:
            if saved_event.event.contains(event):
                return JsonResponse({'error': 'Event already saved'}, status=200)
            
            saved_event.event.add(event)

        return JsonResponse({}, status=200)


@login_required(login_url='/login')
def scan_tickets(request, event_id, ticket_id=None):
    if ticket_id == None:
        return render(request, 'invite/scan-tickets.html', { 'event_id': event_id })


@login_required(login_url='/login')
def validate_ticket(request, event_id, ticket_id):
    try:
        event = Event.objects.get(identifier=event_id)
    except ObjectDoesNotExist:
        return JsonResponse({'message': 'event does not exist'}, status=400)

    try:
        ticket = Ticket.objects.get(event=event, identifier=ticket_id)
    except ObjectDoesNotExist:
        return JsonResponse({'message': 'ticket does not exist'}, status=400)

    if ticket.expired:
        return JsonResponse({'message': 'ticket is expired'}, status=410)

    ticket.expired = True
    ticket.save()

    ticket_data = {
        'owner': ticket.owner.username,
        'people': ticket.people
    }

    return JsonResponse({'message': 'ticket valid', 'ticket': ticket_data}, status=200)


def search(request):
    query = request.GET.get('query')
    threshold = int(request.GET.get('threshold', 80))
    matching_users = find_users(query, threshold=threshold)
    return JsonResponse({'users': matching_users})


@login_required(login_url='/login')
def unfollow(request, username):
    user = User.objects.get(username=request.user.username)
    following = User.objects.get(username=username.strip())

    if user == following:
        return JsonResponse({'error': 'You cannot unfollow yourself'}, status=403)

    connection = Following.objects.filter(user=user, following=following)
    if not connection.exists():
        return JsonResponse({'error': 'Not following user'}, status=403)

    connection[0].delete()

    return JsonResponse({}, status=200)


@login_required(login_url='/login')
def update_scores(request):
    # Get parameters
    action = request.GET.get('action')
    related = request.GET.get('related')
    user = request.user
    
    if related == 'event':
        event_id = request.GET.get('event_id')
        event = Event.objects.get(id=int(event_id))
        tags = event.keywords.split(',')
        category = event.category

        p = Personalization.objects.get(user=user)

        # Update user categories
        personal_categories = p.categories
        personal_categories[category] += ACTIONS[action]

        # Update keywords
        personal_keywords = p.keywords
        event_keywords = EventKeyword.objects.get(event=event).keywords
        top_event_keywords = dict_values(event_keywords, 3)

        for keyword in top_event_keywords:
            if keyword in personal_keywords.keys():
                personal_keywords[keyword] += (ACTIONS[action] + 100)
            else:
                personal_keywords[keyword] = (ACTIONS[action] + 100)

        # Update tags
        personal_tags = p.tags

        # If user tags are empty
        if not personal_tags:
            for tag in tags:
                personal_tags[tag] = ACTIONS[action]

        else:
            for key in personal_tags.keys():
                if key in tags:
                    personal_tags[key] += ACTIONS[action]

            # Add new tags
            for tag in tags:
                if tag not in personal_tags.keys():
                    personal_tags[tag] = ACTIONS[action]

    elif related == 'person':
        related_username = request.GET.get('related_username').strip()
        related_user = get_object_or_404(User, username=related_username)

        p = Personalization.objects.get(user=user)
        related_p = Personalization.objects.get(user=related_user)

        # Update user categories
        personal_categories = p.categories
        related_categories = related_p.categories

        category = dict_values(related_categories)[0]
        personal_categories[category] += ACTIONS[action]

        # Update keywords
        personal_keywords = p.keywords
        related_keywords = related_p.keywords
        keywords = dict_values(related_keywords, 3)

        for word in keywords:
            if word in related_keywords.keys():
                personal_keywords[word] += (ACTIONS[action] + 50)
            else:
                personal_keywords[word] = (ACTIONS[action] + 50)

        # Update tags
        related_tags = related_p.tags
        tags = dict_values(related_tags, 3)
        personal_tags = p.tags

        for tag in tags:
            if tag in personal_tags:
                personal_tags[tag] += ACTIONS[action]
            else:
                personal_tags[tag] = ACTIONS[action]


    p.categories = personal_categories
    p.keywords = personal_keywords
    p.tags = personal_tags
    p.save()

    return JsonResponse({'message': 'scores updated successfully'}, status=200)


@login_required(login_url='/login')
def unsave_event(request):
    if request.method == 'DELETE':
        user = request.user
        data = loads(request.body)
        event_id = int(data.get('eventId', ''))

        event = get_object_or_404(Event, id=event_id)

        is_user_attendee = event.attendees.contains(user)

        if event.ticket_access and is_user_attendee:
            return JsonResponse({'error': 'Cannot remove events with ticket access.'}, status=400)

        saved_events = get_object_or_404(SavedEvent, user=user, event=event)

        saved_events.event.remove(event)

        return JsonResponse({}, status=200)


@login_required(login_url='/login')
def view_calendar(request):
    return render(request, 'invite/calendar.html')


def view_more_info(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    additional_info = get_object_or_404(EventMoreInfo, event=event)
    return JsonResponse({'info': dumps(additional_info.html)}, status=200)


@login_required(login_url='/login')
def wallet_balance(request):
    user = request.user

    # Get balance
    balance = Wallet.objects.get(user=user).balance

    return JsonResponse({'balance': balance}, status=200)


@login_required(login_url='/login')
def wallet_deposit(request):
    if request.method == 'POST':
        user = request.user
        data = loads(request.body)

        amount = data.get('amount')
        amount = int(amount)

        if amount < 25 or amount > 2000:
            return JsonResponse({'message': 'amount_invalid'}, status=400)
        
        password = data.get('password')
        authenticated = authenticate(request, username=user.username, password=password)

        if not authenticated:
            return JsonResponse({'message': 'incorrect_password'}, status=400)

        # Update user's balance
        deposit = amount - (amount * (4/100))
        wallet = Wallet.objects.get(user=user)
        wallet.balance = wallet.balance + deposit
        wallet.save()

        # Record transaction
        bank_charges = amount * (2/100)
        service_fees = amount * (2/100)

        DepositRecord.objects.create(
            user=user,
            amount=amount,
            transaction_fee=bank_charges,
            transaction_percentage=2,
            deposit_fee=service_fees,
            deposit_percentage=2
        )

        # Update revenue
        Revenue.objects.create(amount=service_fees, source=Revenue.DEPOSIT_FEE)

        return JsonResponse({'message': 'deposit was successful'}, status=200)


@login_required(login_url='/login')
def wallet_view(request):
    return render(request, 'invite/wallet.html')
