# Holmes #

## Setting up dev environment ##

* `pip install autoenv`

* Run in root directory of the project
`virtualenv --no-site-packages --distribute dawn-env`

* Change to the project root directory, the environment should automatically activate, with a "(dawn-env)" in front of the PS1.

* `pip install -r requirements.txt` will install the required packages.

* Install postgres sql and create a user. Start the server.

* Copy and rename examplesettings.py to settings.py and add the postgresql database uri and the secret key (can skip this step).

* Run migrations to populate the postgresql database with `python manage.py migrate`.

* To run the development server, run `python manage.py runserver`.

## Configuration ##
* `config.json` contains API keys and the port number the app runs on.

* Use `pip freeze > requirements.txt` to maintain requirements