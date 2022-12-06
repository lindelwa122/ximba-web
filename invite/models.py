from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class User(AbstractUser):
  email_code = models.IntegerField()
  is_email_confirmed = models.BooleanField(default=False)
