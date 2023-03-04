# Generated by Django 4.1.3 on 2023-02-21 10:44

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('invite', '0011_merge_20230220_0450'),
    ]

    operations = [
        migrations.AddField(
            model_name='friend',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('accepted', 'Accepted')], default='pending', max_length=10),
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('friend_request', 'Friend Request'), ('new_follower', 'New Follower')], max_length=20)),
                ('origin', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notification_origin', to=settings.AUTH_USER_MODEL)),
                ('to', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notification_receiver', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]