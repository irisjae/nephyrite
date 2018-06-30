#!/usr/bin/env bash
[[ `uname` == 'Darwin' ]] && { [ -d "/usr/local/opt/coreutils/libexec/gnubin" ] || { echo "gnu tools not found"; exit 1; } && PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"; }
cd "$(dirname "$0")"

if [ -f ./amas.sh ]; then
	. ./amas.sh
elif [ -f ./.amas.sh ]; then
	. ./.amas.sh
else
	>&2 echo "amas refresher not found"
	exit 1
fi

cd "$(git rev-parse --show-toplevel)"

{
	amas_refresh src/cordova
	amas_refresh src/hci
	amas_refresh transform/refresh
	amas_refresh transform/install

	{
		cd transform/refresh
		if [ -f ./amas.sh ] && [ -f ./.amas.sh ]; then
			rm ./.amas.sh
		fi
		if [ -f ./.gitignore ]; then
			rm ./.gitignore
		fi
	}

	exit
}
