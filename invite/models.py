from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class User(AbstractUser):
  email_code = models.IntegerField(null=True)
  code_generation_date = models.DateTimeField(auto_created=True, null=True)
  is_email_confirmed = models.BooleanField(default=False)
  reset_password = models.TextField(max_length=20, blank=True, null=True)

class Friend(models.Model):
  user = models.ForeignKey(User, models.CASCADE, related_name='friend_user')
  friend = models.ForeignKey(User, models.CASCADE, 'friend')

class Following(models.Model):
  user = models.ForeignKey(User, models.CASCADE, related_name='following_user')
  following = models.ForeignKey(User, models.CASCADE, related_name='following_following')

class Profile(models.Model):
  user = models.ForeignKey(User, models.CASCADE, related_name='profile_user')
  profile_img = models.ImageField(upload_to='invite/static/invite/images/profiles', default='/static/images/profiles/default.png')
  bio = models.TextField(max_length=200, blank=True, null=True)