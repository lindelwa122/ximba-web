from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.timezone import localtime

# Create your models here.
class User(AbstractUser):
  email_code = models.IntegerField(default=000000)
  code_generation_date = models.DateTimeField(auto_created=True, default=localtime)
  is_email_confirmed = models.BooleanField(default=False)
  reset_password = models.TextField(max_length=20, blank=True, null=True)

class Friend(models.Model):
  user = models.ForeignKey(User, models.CASCADE, related_name='friend_user')
  friend = models.ForeignKey(User, models.CASCADE, 'friend')

  def __str__(self) -> str:
    return f'{self.user.username} befriends {self.friend.username}'

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
