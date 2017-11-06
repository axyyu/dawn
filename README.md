# Holmes #

## Setting up dev environment ##

* `pip3 install autoenv`

* Run in root directory of the project
`virtualenv --no-site-packages --distribute dawn-env`

* Change to the project root directory, the environment should automatically activate, with a "(dawn-env)" in front of the PS1.

* `python3 setup.py install` will install the required packages.

* Install postgresql and create a user. Start the postgres server.

* Copy and rename examplesettings.py to settings.py and add the postgresql database uri and the secret key.

* Run migrations to populate the postgresql database with `python3 manage.py migrate`.

* To run the development server, run `python manage.py runserver`.

* If using nginx, make sure to add the line `rewrite ^/(.*)/$ /$1 permanent;` to the config.

## Configuration ##

* Whenever there is a change in example\_settings.py, make sure to update your settings.py.

* Use `pip3 freeze > requirements.txt` to maintain requirements.
