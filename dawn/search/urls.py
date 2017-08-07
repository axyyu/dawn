from django.conf.urls import url

from . import views
from . import define

urlpatterns = [
    url(r'^$', views.index, name='index'),
    # url(r'^user/(?P<searchterm>\w)/$', views.search_page,),
]
