# Generated by Django 4.1.3 on 2023-03-10 09:08

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('invite', '0016_event'),
    ]

    operations = [
        migrations.CreateModel(
            name='PrivateEventViewers',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='private_event', to='invite.event')),
                ('viewers', models.ManyToManyField(related_name='private_events', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
