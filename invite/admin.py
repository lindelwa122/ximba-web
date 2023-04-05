from django.contrib import admin

from .models import *

# Register your models here.
admin.site.register(Event)
admin.site.register(EventKeyword)
admin.site.register(EventMoreInfo)
admin.site.register(Following)
admin.site.register(Friend)
admin.site.register(FriendRequest)
admin.site.register(Notification)
admin.site.register(Personalization)
admin.site.register(PrivateEventViewers)
admin.site.register(Profile)
admin.site.register(ProfileSetUp)
admin.site.register(User)
admin.site.register(WaitingList)