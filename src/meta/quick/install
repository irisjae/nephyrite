#!/usr/bin/env bash

if [[ `uname` == 'Darwin' ]]; then
	echo checking gnu tools...
	command -v brew > /dev/null || { 
		echo please install homebrew then try again; 
		echo see https://github.com/Homebrew/install;
		exit 1;
	}
	brew install coreutils
	#brew install binutils
	#brew install diffutils
	#brew install ed --with-default-names
	#brew install findutils --with-default-names
	#brew install gawk
	#brew install gnu-indent --with-default-names
	#brew install gnu-sed --with-default-names
	#brew install gnu-tar --with-default-names
	#brew install gnu-which --with-default-names
	#brew install gnutls
	brew install grep --with-default-names
	#brew install gzip
	#brew install screen
	#brew install watch
	#brew install wdiff --with-gettext
	#brew install wget
	PATH="$(brew --prefix coreutils)/libexec/gnubin:$PATH"
	echo
	echo
fi

echo checking nvm version...
[ -e ~/.nvm/nvm.sh ] || {
	echo please install nvm then try again;
	echo see https://github.com/creationix/nvm#installation;
	exit 1;
} && . ~/.nvm/nvm.sh --no-use
nvm install 8 && \
nvm alias node 8 && \
nvm alias default 8
nvm use 8
echo
echo

echo checking npm version...
if ! npm outdated -g npm | grep -z npm; then
    echo npm is up to date
else
    echo trying to update npm...
    npm install -g npm
fi
echo
echo

echo checking ama...
if npm list -g ama; then
    echo ama already installed
else
    echo trying install ama...
    npm install -g jade-ama
fi
echo
echo


echo checking cordova...
if npm list -g cordova@8.0.0; then
    echo cordova already installed
else
    echo trying install cordova...
    npm install -g cordova@8.0.0
fi
echo
echo




cd "$(dirname "$0")"
cd "$(git rev-parse --show-toplevel)"

find . -name package.json
echo installing npm packages...
find . -not -regex .*/node_modules/.* -name package.json -exec bash -c 'for f; do git check-ignore -q "$f" || echo "$f"; done' {} + | while read f; do
	pushd "$(dirname "$f")"
	npm install
	ln -s ../ node_modules/__ 2> /dev/null
	popd
done
echo
echo


echo refreshing amas...
./quick/refresh
echo
echo
