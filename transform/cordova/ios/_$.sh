#!/usr/bin/env bash
[[ `uname` == 'Darwin' ]] && { [ -d "/usr/local/opt/coreutils/libexec/gnubin" ] || { echo "gnu tools not found"; exit 1; } && PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"; }
cd "$(dirname "$0")"
package_root="$(git rev-parse --show-toplevel)"

. ~/.nvm/nvm.sh --no-use

if [ -d "${package_root}/dist/cordova/ios" ]; then
	rm -r "${package_root}/dist/cordova/ios"
fi;

mkdir "${package_root}/dist/cordova/ios"
cd "${package_root}/dist/cordova/ios"

find "${package_root}/dist/cordova/$" -mindepth 1 -maxdepth 1 -print0 \
	| xargs -0 ln -s --target-directory=.

cp --remove-destination "$(readlink -f config.xml)" config.xml
echo "$(cat config.xml | grep -Ev "$(cat config.xml \
                | grep "engine\ name=\"" \
                | sed "s/^.\+name=\"\([^\"]\+\)\".\+/\1/" \
                | grep -v ios \
                | sed "s/\(.\+\)/engine\ name=\"\1\"/" \
		| paste -sd "|" -
        )"
)" > config.xml

cordova prepare
cordova-splash
cordova-icon
#maybe no need www?
#zip -r cordova-ios.zip config.xml www/ platforms/ plugins/
