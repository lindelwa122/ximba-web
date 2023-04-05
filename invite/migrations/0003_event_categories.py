# Generated by Django 4.1.3 on 2023-04-04 10:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invite', '0002_waitinglist'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='categories',
            field=models.CharField(choices=[('education', 'Education'), ('career_prospects', 'Career Prospects'), ('social_connections', 'Social Connections'), ('personal_growth', 'Personal Growth'), ('partylike', 'partylike')], default='partylike', max_length=20),
        ),
    ]
