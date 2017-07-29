# Holmes #

## Setting up dev environment ##

* `pip install autoenv`

* Run in root directory of the project
`virtualenv --no-site-packages --distribute -p python3.5 dawn-env`

* Change to the project root directory, the environment should automatically activate, with a "(dawn-env)" in front of the PS1.

* `pip install -r requirements` will install the required packages.

* Move examplesettings.py to settings.py and add the postgresql database uri and the secret key.

* Run migrations to populate the postgresql database with `python manage.py migrate`.

* To run the development server, run `python manage.py runserver`.

## Configuration ##
* `config.json` contains API keys and the port number the app runs on.
