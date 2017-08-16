from setuptools import setup

with open('requirements.txt') as f:
    requirements = f.read().splitlines()

setup(
    name="dawn",
    packages=["dawn"],
    include_package_data=True,
    install_requires=requirements,
)
