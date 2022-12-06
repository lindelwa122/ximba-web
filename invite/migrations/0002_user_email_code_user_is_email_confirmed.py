# Generated by Django 4.1.3 on 2022-12-06 20:37

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('invite', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='email_code',
            field=models.IntegerField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='user',
            name='is_email_confirmed',
            field=models.BooleanField(default=False),
        ),
    ]
