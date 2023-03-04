# Generated by Django 4.1.3 on 2023-01-03 19:32

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('invite', '0005_profile_friend_following'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='user',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='profile_user', to=settings.AUTH_USER_MODEL),
        ),
    ]
