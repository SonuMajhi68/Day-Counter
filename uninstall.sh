#! /bin/bash
set -e

NAME=day-counter
DOMAIN=SonuMajhi68
UUID=$NAME@$DOMAIN

echo -e "\n\t[~~ Day-Counter-extension ~~]\n"
echo -e "\trunning the script...\n"

if $(gnome-extensions list | grep -q $UUID); then
    gnome-extensions uninstall $UUID
else
    echo -e "\tDay-Counter-extension is not installed, exiting..."
    exit 1
fi

echo -e "\t[~~ Extension is uninstalled ~~]\n"
exit 0