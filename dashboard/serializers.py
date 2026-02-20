from rest_framework import serializers
from .models import User, FeatureClick

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'age', 'gender')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            age=validated_data.get('age'),
            gender=validated_data.get('gender')
        )
        return user

class FeatureClickSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureClick
        fields = ('id', 'user', 'feature_name', 'timestamp')
        read_only_fields = ('user', 'timestamp')
