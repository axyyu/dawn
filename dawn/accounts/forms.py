from django import forms
from django.core.validators import MinLengthValidator
from .models import *


def username_validate(value):
    if (User.objects.filter(username=value).exists()):
        raise forms.ValidationError(
            'The username you entered is already in use.',
            code='user_exists')


def email_validate(value):
    if (User.objects.filter(email=value).exists()):
        raise forms.ValidationError(
            'The email you entered is already in use.',
            code='user_exists')


class UserRegistrationForm(forms.Form):
    username = forms.CharField(
        required=True,
        label='Username',
        max_length=50,
        validators=[username_validate, ]
    )
    email = forms.EmailField(
        required=True,
        label='Email',
        max_length=50,
        validators=[email_validate, ]
    )
    password = forms.CharField(
        required=True,
        label='Password',
        max_length=50,
        widget=forms.PasswordInput(),
        validators=[
            MinLengthValidator(
                8,
                message='Password must be at least 8 characters.'),
        ])
