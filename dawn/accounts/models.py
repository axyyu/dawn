from django.db import models
from django.contrib.auth.models import User


class Keyword(models.Model):
    name = models.CharField(max_length=50)


class Author(models.Model):
    first = models.CharField(max_length=50)
    middle = models.CharField(max_length=50)
    last = models.CharField(max_length=50)


class Article(models.Model):
    name = models.CharField(max_length=150)
    date = models.DateField()
    link = models.URLField(max_length=200)
    summary = models.TextField(max_length=500)
    keywords = models.ManyToManyField(Keyword, symmetrical=True,)
    mla_citation = models.TextField(max_length=500)
    apa_citation = models.TextField(max_length=500)
    chicago_citation = models.TextField(max_length=500)
    authors = models.ManyToManyField(Author, symmetrical=True,)
    journal = models.CharField(max_length=50)
    publisher = models.CharField(max_length=50)
    sentiment = models.DecimalField(max_digits=5, decimal_places=3)


class Project(models.Model):
    MLA = 'MLA'
    APA = 'APA'
    CHICAGO = 'CHICAGO'
    STYLE_CHOICES = (
        (MLA, 'mla'),
        (APA, 'apa'),
        (CHICAGO, 'chicago'),
    )
    name = models.CharField(max_length=150)
    desc = models.TextField(max_length=500)
    style = models.CharField(max_length=7, choices=STYLE_CHOICES, default=APA,)
    articles = models.ManyToManyField(Article, symmetrical=False,)


class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    projects = models.ManyToManyField(Project, symmetrical=True,)
