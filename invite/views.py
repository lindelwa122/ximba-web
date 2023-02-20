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
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.utils.timezone import localtime
from fuzzywuzzy import process

from .models import *
from .utils import *

def is_user_authenticated(request, username):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'User not logged in'}, status=403)

    if request.user.username != username.strip():
        return JsonResponse({'error': 'Access denied'}, status=403)

    return JsonResponse({}, status=200)


def search_items(names, query):
    result = []
    for name in names:
        if query in name:
            result.append(name)
    return result

# def find_similar(query, names):
#     result = []
#     for name in names:
#         if difflib.SequenceMatcher(None, query, name).ratio() >= 0.50:
#             result.append(name)
#     return result

@login_required(login_url='/login')
def index(request):
    user = User.objects.get(username=request.user.username)
    if not user.is_email_confirmed:
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
        request.session['username'] = request.user.username

        profile = Profile.objects.filter(user=user)
        if not profile.exists():
            Profile.objects.create(user=user)
        
        return HttpResponseRedirect(reverse('invite:confirm_email'))

    return HttpResponseRedirect(reverse('invite:profile', kwargs={'username': request.user.username}))


def confirm_email(request):
    if request.method == 'POST':
        data = loads(request.body)
        user = User.objects.get(username=request.session['username'])

        if int(data.get('code', '')) != user.email_code:
            return JsonResponse({'message': 'Your code is incorrect. Try checking your emails again.'}, status=400)

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
            return JsonResponse({'message': 'The code has expired. A new code has been sent to your emails.'}, status=400)

        user.is_email_confirmed = True
        user.save()

        if not ProfileSetUp.objects.filter(user=user).exists():
            ProfileSetUp.objects.create(user=user)

        login(request, user)

        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/confirm_email.html')


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


def edit_fullname(request):
    if request.method == 'POST':
        data = loads(request.body)

        user = User.objects.get(username=request.user.username)
        user.first_name = data.get('firstName', '').capitalize()
        user.last_name = data.get('lastName', '').capitalize()
        user.save()

        return JsonResponse({}, status=200)


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


def edit_profile(request):
    return render(request, 'invite/edit_profile.html')


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

def unfollow(request, username):
    user = User.objects.get(username=request.user.username)
    following = User.objects.get(username=username.strip())

    if user == following:
        return JsonResponse({'error': 'You cannot ufollow yourself'}, status=403)

    connection = Following.objects.filter(user=user, following=following)
    if not connection.exists():
        return JsonResponse({'error': 'Not following user'}, status=403)

    connection[0].delete()

    return JsonResponse({}, status=200)

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


def get_profile_count(request, username):
    username = username.strip()
    user = User.objects.get(username=username)
    friends = Friend.objects.filter(user=user).count()
    following = Following.objects.filter(user=user).count()
    followers = Following.objects.filter(following=user).count()
    return JsonResponse({'friendsCount': friends, 'followingCount': following, 'followersCount': followers}, status=200)


def get_user_bio(request, username):
    try:
        user = User.objects.get(username=username)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=404)

    profile = Profile.objects.get(user=user)
    return JsonResponse({'bio': profile.bio}, status=200)


def get_user_profile_image(request, username):
    try:
        user = User.objects.get(username=username)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=404)

    profile = Profile.objects.get(user=user)

    return JsonResponse({'imagePath': get_img_url(profile.profile_img)}, status=200)


def is_user_following(request, other_user):
    user = User.objects.get(username=request.user.username)
    other_user = User.objects.get(username=other_user.strip())

    following = Following.objects.filter(user=user, following=other_user)
    answer = 'YES' if following.exists() else 'NO'

    return JsonResponse({'answer': answer}, status=200)


def login_view(request):
    if request.method == 'POST':
        data = loads(request.body)

        user = authenticate(request, username=data.get(
            'username', ''), password=data.get('password', '')
        )

        if user is None:
            return JsonResponse({'message': 'Username/Password is incorrect. Try resetting your password.'}, status=403)

        login(request, user)
        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/login.html')


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('invite:index'))


def main(request):
    return render(request, 'invite/main.html')


def new_password(request, username, access):
    if request.method == 'POST':
        data = loads(request.body)
        password = data.get('password', '')

        # Ensure form data is not empty
        for val in data.values():
            if not val:
                return JsonResponse({'message': 'No input field must be empty'}, status=400)

        # Validate password
        if not (check_upper(password) and check_lower(password) and check_digit(password)):
            return JsonResponse({'message': 'Password is invalid'}, status=400)

        # Ensure that password is the same as confirm-password
        if password != data.get('confirm-password', ''):
            return JsonResponse({'message': 'Password must match with confirm password'}, status=400)

        user = User.objects.get(username=username)
        user.set_password(password)
        user.reset_password = generate_hash(20)
        user.save()

        return JsonResponse({}, status=200)

    else:
        if User.objects.get(username=username).reset_password != access:
            return HttpResponse('<h1>Broken Link</h1>')
        return render(request, 'invite/new_password.html')


def profile(request, username):
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
    else:
        f = False

    # Determine if user is authenticated
    authenticated = user.username == request.user.username
    
    # User authenticated but email not confirmed
    if authenticated and not user.is_email_confirmed:
        return HttpResponseRedirect(reverse('invite:index'))

    return render(request, 'invite/profile.html', {
        'user': user,
        'authenticated': authenticated,
        'is_user_logged_in': request.user.is_authenticated,
        'following_user': f
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


def render404(request):
    return render(request, 'invite/404.html')


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
            obj['image'] = profile.profile_img.url
        recent.append(obj)

    return JsonResponse({'recent': recent}, status=200)


def find_users(query, threshold=80):
    users = User.objects.all()
    matching_users = []
    for user in users:
        user_fields = [user.username, user.first_name, user.last_name]
        best_match = process.extractOne(query, user_fields)
        profile = Profile.objects.filter(user=user).first()
        if best_match[1] >= threshold:
            matching_users.append({
                'username': user.username,
                'fullName': f'{user.first_name} {user.last_name}',
                'image': get_img_url(profile.profile_img) if profile else ''
            })
    return matching_users

def search(request):
    query = request.GET.get('query')
    threshold = int(request.GET.get('threshold', 80))
    matching_users = find_users(query, threshold=threshold)
    return JsonResponse({'users': matching_users})

def register_view(request):
    if request.method == 'POST':
        data = loads(request.body)
        password = data.get('password', '')
        username = data.get('username', '')

        # Ensure form data is not empty
        for val in data.values():
            if not val:
                return JsonResponse({'message': 'No input field must be empty'}, status=400)

        # Validate password
        if not (check_upper(password) and check_lower(password) and check_digit(password)):
            return JsonResponse({'message': 'Password is invalid'}, status=400)

        # Ensure that password is the same as confirm-password
        if password != data.get('confirm-password', ''):
            return JsonResponse({'message': 'Password must match with confirm password'}, status=400)

        if User.objects.filter(email=data.get('email', '')).exists():
            return JsonResponse({'message': 'This email is already registered. Try logging in.'}, status=409)

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
            return JsonResponse({'message': 'Username is already taken. Try a different one'}, status=409)

        confirm_account_code = User.objects.get(username=username).email_code

        send_mail(
            'Welcome to GetVyt',
            f'Hello, {username}. Use this code: {confirm_account_code} to confirm your email.',
            'portfolio@livingdreams.com',
            [data.get('email', '')],
            fail_silently=False,
        )

        request.session['username'] = username

        Profile.objects.create(user=User.objects.get(username=username))

        return JsonResponse({}, status=200)

    else:
        return render(request, 'invite/register.html')


def reset_password(request):
    if request.method == 'POST':
        data = loads(request.body)
        email = data.get('email', '')

        try:
            user = User.objects.get(email=email)
        except ObjectDoesNotExist:
            return JsonResponse({'message': 'Email is not found in our database'}, status=404)

        user.reset_password = generate_hash(20)
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

        return JsonResponse({'message': 'A link has been sent to your email, use it to reset your password'}, status=400)

    else:
        return render(request, 'invite/reset_password.html')
    
    
def find_friends(request):
    following_list = []
    user = User.objects.get(username='tester')
    friends = Friend.objects.filter(user=user)
    following = Following.objects.filter(user=user)
    for followers in following:
        if followers in friends:
            pass
        following_list.append(followers)
    print(following_list)
    return HttpResponse(f'{friends}{following_list}')    
    
