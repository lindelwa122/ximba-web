# Generated by Django 4.1.3 on 2023-01-20 21:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invite', '0007_alter_profile_profile_img_alter_profile_user_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='profile_img',
            field=models.ImageField(default='/static/invite/images/profiles/default.png', upload_to='static/invite/images/profiles'),
        ),
    ]
