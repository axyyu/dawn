from django.conf.urls import include, url
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.views.generic import RedirectView

from . import views

urlpatterns = [
    url(r'^login/$', auth_views.LoginView.as_view(template_name='accounts/login.html')),
    url(r'^logout/$', auth_views.LogoutView.as_view(next_page='/')),
]
