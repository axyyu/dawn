from django import forms

class UserRegistrationForm(forms.Form):
    username = forms.CharField(
        required = True,
        label = 'Username',
        max_length = 50,
    )
    email = forms.CharField(
        required = True,
        label = 'Email',
        max_length = 50,
    )
    password = forms.CharField(
        required = True,
        label = 'Password',
        max_length = 50,
        widget = forms.PasswordInput()
    )
