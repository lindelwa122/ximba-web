from django.contrib import admin

from .models import *

# Register your models here.
admin.site.register(Following)
admin.site.register(Friend)
admin.site.register(FriendRequest)
admin.site.register(Notification)
admin.site.register(Profile)
admin.site.register(ProfileSetUp)
admin.site.register(User)