# Generated by Django 4.1.3 on 2023-03-07 19:57

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('invite', '0015_friend_created_at_alter_notification_datetime_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=50)),
                ('description', models.CharField(max_length=500)),
                ('cover', models.ImageField(blank=True, null=True, upload_to='invite/static/invite/images/events/covers')),
                ('location', models.CharField(max_length=100)),
                ('datetime', models.DateTimeField()),
                ('public', models.BooleanField(default=True)),
                ('attendees_allowed', models.IntegerField(blank=True, null=True)),
                ('ticket_price', models.FloatField(default=0)),
                ('currency_conversion', models.CharField(default='USD', max_length=5)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_event', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
