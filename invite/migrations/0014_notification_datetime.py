# Generated by Django 4.1.3 on 2023-02-21 14:06

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('invite', '0013_notification_seen'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='datetime',
            field=models.DateTimeField(auto_created=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]