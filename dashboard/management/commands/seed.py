from django.core.management.base import BaseCommand
from dashboard.models import User, FeatureClick
from django.utils import timezone
import random
from datetime import timedelta

class Command(BaseCommand):
    help = 'Seeds database with dummy data'

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")
        
        # Create Users
        users = []
        for i in range(20):
            username = f'user_{i}'
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username, 
                    password='password123',
                    age=random.randint(15, 60),
                    gender=random.choice(['Male', 'Female', 'Other'])
                )
                users.append(user)
            else:
                users.append(User.objects.get(username=username))

        # Create Clicks
        features = ['date_filter', 'age_filter', 'gender_filter', 'bar_chart_zoom_date', 'bar_chart_zoom_age']
        
        for user in users:
            # Generate between 50 and 200 clicks per user
            for _ in range(random.randint(50, 200)): 
                feature = random.choice(features)
                # Randomize time over the last 90 days
                time_offset = timedelta(
                    days=random.randint(0, 90), 
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
                
                click = FeatureClick.objects.create(
                    user=user,
                    feature_name=feature,
                )
                # Update timestamp manually
                FeatureClick.objects.filter(pk=click.pk).update(timestamp=timezone.now() - time_offset)
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded database with dummy data'))
