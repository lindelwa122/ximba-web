from json import dumps

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

class Personalization(models.Model):
  def categories_dict():
    return {
      'education': 0,
      'career_prospects': 0,
      'social_connections': 0,
      'personal_growth': 0,
      'partylike': 0
    }
  
  def empty_dict():
    return {}

  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_personalization')
  categories = models.JSONField(default=categories_dict)
  tags = models.JSONField(default=empty_dict)
  keywords = models.JSONField(default=empty_dict)

  def __str__(self):
    return self.user.username

class Event(models.Model):
  user = models.ForeignKey(User, models.CASCADE, related_name='user_event')
  identifier = models.CharField(max_length=30)
  title = models.CharField(max_length=50)
  description = models.CharField(max_length=500)
  cover = models.ImageField(upload_to='invite/static/invite/images/events/covers', null=True, blank=True)
  location = models.CharField(max_length=100)
  datetime = models.DateTimeField()
  end_datetime = models.DateTimeField()
  ticket_purchase_deadline = models.DateTimeField(blank=True, null=True)
  immediate_payment = models.BooleanField(blank=True, null=True)
  public = models.BooleanField(default=True)
  ticket_access = models.BooleanField(default=False)
  attendees_allowed = models.IntegerField(null=True, blank=True)
  attendees = models.ManyToManyField(User, related_name='attendees', blank=True)
  shares = models.ManyToManyField(User, related_name='shares', blank=True)
  ticket_price = models.FloatField(default=0)
  keywords = models.CharField(max_length=500)
  category = models.CharField(max_length=30)
  currency_conversion = models.CharField(max_length=5, default='ZAR')
  draft = models.BooleanField(default=False)

  def __str__(self):
    return f'{self.title} posted by {self.user.username} ({self.category}): {"Public" if self.public else "Private"}'
  
class EventMoreInfo(models.Model):
  event = models.ForeignKey(Event, models.CASCADE, related_name='more_info')
  html = models.JSONField(default=list)

  def save(self, *args, **kwargs):
    if isinstance(self.html, list):
      self.html = dumps(self.html)
    super().save(*args, **kwargs)

class Ticket(models.Model):
  event = models.ForeignKey(Event, models.CASCADE, related_name='ticket')
  owner = models.ForeignKey(User, models.CASCADE, related_name='ticket_owner')
  people = models.IntegerField(default=1)
  identifier = models.CharField(max_length=50)
  expired = models.BooleanField(default=False)
  datetime = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f'{self.owner} has a ticket for {self.event.title}'

class TicketSale(models.Model):
  PENDING = 'pending'
  REFUNDED = 'refunded'
  COMPLETE = 'complete'

  STATUS = (
    (PENDING, 'pending'),
    (REFUNDED, 'refunded'),
    (COMPLETE, 'complete')
  )

  ticket = models.ForeignKey(Ticket, models.CASCADE, related_name='ticket')
  event = models.ForeignKey(Event, models.CASCADE, related_name='event')
  user = models.ForeignKey(User, models.CASCADE, related_name='user')
  identifier = models.CharField(max_length=20)
  issued_date = models.DateTimeField(auto_now_add=True)
  effective_date = models.DateTimeField(null=True, blank=True)
  status = models.CharField(max_length=20, choices=STATUS, default=PENDING)
  

class SavedEvent(models.Model):
  user = models.ForeignKey(User, models.CASCADE, related_name='user_saved')
  event = models.ManyToManyField(Event, related_name='saved_events')

class PrivateEventViewers(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='private_event')
    viewers = models.ManyToManyField(User, related_name='private_events')

    def __str__(self):
      return f'{self.event} can be viewed by only friends.'

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

class WaitingList(models.Model):
  email = models.CharField(max_length=50)
  date = models.DateTimeField(auto_now_add=True)

class LandingPageVisits(models.Model):
  date = models.DateTimeField(auto_now_add=True)

class Wallet(models.Model):
  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_wallet')
  balance = models.FloatField(default=50)

  def __str__(self):
    return f'{self.user} (R{self.balance.__float__()})'

class DepositRecord(models.Model):
  user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='user_deposit_record')
  amount = models.FloatField()
  transaction_fee = models.FloatField()
  transaction_percentage = models.FloatField()
  deposit_fee = models.FloatField()
  deposit_percentage = models.FloatField()
  datetime = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f'{self.user} deposited {self.amount} on {self.datetime}'

class Revenue(models.Model):
  TICKET_SALE = 'ticket_sale'
  DEPOSIT_FEE = 'deposit_fee'

  REVENUE_FROM = (
    (TICKET_SALE, 'Ticket Sale'),
    (DEPOSIT_FEE, 'Deposit Fee'),
  )

  amount = models.FloatField()
  source = models.CharField(max_length=20, choices=REVENUE_FROM)
  received_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f'{self.amount} from {self.source}'

class EventKeyword(models.Model):
  event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='event_keyword')
  keywords = models.JSONField()
  created_at = models.DateTimeField(auto_now_add=True)
  