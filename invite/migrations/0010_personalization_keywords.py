# Generated by Django 4.1.3 on 2023-04-05 02:31

from django.db import migrations, models
import invite.models


class Migration(migrations.Migration):

    dependencies = [
        ('invite', '0009_eventkeyword'),
    ]

    operations = [
        migrations.AddField(
            model_name='personalization',
            name='keywords',
            field=models.JSONField(default=invite.models.Personalization.empty_dict),
        ),
    ]
