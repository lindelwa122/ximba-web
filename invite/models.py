from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.timezone import localtime

# Create your models here.
class User(AbstractUser):
  email_code = models.IntegerField(default=000000)
  code_generation_date = models.DateTimeField(auto_created=True, default=localtime)
  is_email_confirmed = models.BooleanField(default=False)
  reset_password = models.TextField(max_length=20, blank=True, null=True)

  def __str__(self):
    return self.username

class Event(models.Model):
  user = models.ForeignKey(User, models.CASCADE, related_name='user_event')
  title = models.CharField(max_length=50)
  description = models.CharField(max_length=500)
  cover = models.ImageField(upload_to='invite/static/invite/images/events/covers', null=True, blank=True)
  location = models.CharField(max_length=100)
  datetime = models.DateTimeField()
  public = models.BooleanField(default=True)
  attendees_allowed = models.IntegerField(null=True, blank=True)
  ticket_price = models.FloatField(default=0)
  currency_conversion = models.CharField(max_length=5, default='USD')

  def __str__(self):
    return f'{self.title} posted by {self.user.username}'

class Friend(models.Model):
  PENDING = 'pending'
  ACCEPTED = 'accepted'
  STATUS_CHOICES = [
      (PENDING, 'Pending'),
      (ACCEPTED, 'Accepted')
  ]

  user = models.ForeignKey(User, models.CASCADE, related_name='friend_user')
  friend = models.ForeignKey(User, models.CASCADE, 'friend')
  status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self) -> str:
    return f'{self.user.username} befriends {self.friend.username}'


class FriendRequest(models.Model):
  PENDING = 'pending'
  ACCEPTED = 'accepted'
  STATUS_CHOICES = (
      (PENDING, 'Pending'),
      (ACCEPTED, 'Accepted'),
  )
  requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_requests_sent')
  receivers = models.ManyToManyField(User, related_name='friend_requests_received')
  status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    receivers = self.receivers
    all_receivers = receivers.all()

    if all_receivers.count() == 1:
      names = str(all_receivers[0])
    elif all_receivers.count() == 2:
      names = ' and '.join(map(str, all_receivers))
    elif all_receivers.count >= 3:
      first_two = ', '.join(map(str, all_receivers[:2]))
      remaining = all_receivers.count() - 2
      remaining_text = '1 more.' if remaining else f'{remaining} more.'
      names = f'{first_two} and {remaining_text}'

    return f'{self.requester} sent a friend request to {names}'


class Notification(models.Model):
  TYPE_CHOICES = [
    ('friend_request', 'Friend Request'),
    ('new_follower', 'New Follower')
  ]

  origin = models.ForeignKey(User, models.CASCADE, related_name='notification_origin')
  to = models.ForeignKey(User, models.CASCADE, related_name='notification_receiver')
  notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
  seen = models.BooleanField(default=False)
  datetime = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f'From: {self.origin}. To: {self.to}. Type: {self.notification_type}.'

class Following(models.Model):
  user = models.ForeignKey(User, models.CASCADE, related_name='following_user')
  following = models.ForeignKey(User, models.CASCADE, related_name='following_following')

  def __str__(self) -> str:
    return f'{self.user.username} follows {self.following.username}'

class Profile(models.Model):
  user = models.ForeignKey(User, models.CASCADE, related_name='profile_user')
  profile_img = models.ImageField(upload_to='invite/static/invite/images/profiles', default='/static/invite/images/profiles/default.png')
  bio = models.TextField(max_length=200, blank=True, null=True)

  def __str__(self) -> str:
    return self.user.username

class ProfileSetUp(models.Model):
  user = models.ForeignKey(User, models.CASCADE, related_name='setup_user')
  profile_img_setup = models.BooleanField(default=False)
  bio_setup = models.BooleanField(default=False)

  def __str__(self) -> str:
    return f'{self.user.username}: ({self.profile_img_setup}, {self.bio_setup})'
    
class Recent(models.Model):
  user = models.ForeignKey(User, models.CASCADE, related_name='recent_user')
  recent = models.ForeignKey(User, models.CASCADE, related_name='recent_recent')
