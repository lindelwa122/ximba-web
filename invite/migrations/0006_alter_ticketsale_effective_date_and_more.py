# Generated by Django 4.1.3 on 2023-04-08 02:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invite', '0005_rename_active_date_ticketsale_effective_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ticketsale',
            name='effective_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='ticketsale',
            name='status',
            field=models.CharField(choices=[('pending', 'pending'), ('refunded', 'refunded'), ('complete', 'complete')], default='pending', max_length=20),
        ),
    ]