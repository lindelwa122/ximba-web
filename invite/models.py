from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class User(AbstractUser):
  email_code = models.IntegerField(null=True)
  code_generation_date = models.DateTimeField(auto_created=True, null=True)
  is_email_confirmed = models.BooleanField(default=False)
  reset_password = models.TextField(max_length=20, blank=True, null=True)
