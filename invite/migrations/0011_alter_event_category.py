# Generated by Django 4.1.3 on 2023-04-05 12:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invite', '0010_personalization_keywords'),
    ]

    operations = [
        migrations.AlterField(
            model_name='event',
            name='category',
            field=models.CharField(max_length=30),
        ),
    ]
